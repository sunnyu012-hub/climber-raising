import { BALANCE, DAY_NAMES, JOINT_LABEL, STAT_LABEL } from './balance'
import { ACTIVITIES, getActivity } from '../content/activities'
import { getGym } from '../content/gyms'
import { careerOfActivity } from '../content/progression'
import { emit } from './events'
import { refreshQuests } from './quests'
import { clamp100, collectModifiers, isInjured, levelExpNeeded, masteryGain, statExpNeeded } from './character'
import { josa } from './text'
import type { Rng } from './rng'
import type {
  Climber, DayResult, GameState, JointKey, MoveKey, OfflineReport, StatKey, StepResult,
} from './types'

/** 게임 내 하루의 실제 길이(ms). 개발자 배속이 적용된다. */
export const dayLengthMs = (state: GameState): number =>
  BALANCE.time.dayMs / Math.max(1, state.settings.devTimeScale)

/** 직접 플레이로 당긴 시간까지 포함한 경과 시간. */
export const elapsedMs = (state: GameState, now: number): number =>
  Math.max(0, now - state.clock.lastTickAt) + state.clock.bonusMs

/** 현재 날의 남은 시간(ms). */
export function remainingMsOfDay(state: GameState, now: number): number {
  const day = dayLengthMs(state)
  return Math.max(0, day - (elapsedMs(state, now) % day))
}

// ---------- 경험치 ----------
export function grantStatExp(
  climber: Climber, statExp: Partial<Record<StatKey, number>>, mult = 1,
): string[] {
  const lines: string[] = []
  for (const [k, v] of Object.entries(statExp) as [StatKey, number][]) {
    climber.statExp[k] += v * mult
    while (climber.statExp[k] >= statExpNeeded(climber.stats[k])) {
      climber.statExp[k] -= statExpNeeded(climber.stats[k])
      climber.stats[k] += 1
      lines.push(`${josa(STAT_LABEL[k], '이/가')} 올랐다! (${climber.stats[k] - 1} → ${climber.stats[k]})`)
    }
  }
  return lines
}

export function grantExp(climber: Climber, exp: number): number {
  climber.exp += exp
  let ups = 0
  while (climber.exp >= levelExpNeeded(climber.level)) {
    climber.exp -= levelExpNeeded(climber.level)
    climber.level += 1
    climber.skillPoints += 1
    ups += 1
  }
  return ups
}

export function grantMoveExp(
  climber: Climber, moveExp: Partial<Record<MoveKey, number>>, mult = 1,
): void {
  for (const [m, v] of Object.entries(moveExp) as [MoveKey, number][]) {
    climber.mastery[m] = Math.min(
      100, climber.mastery[m] + masteryGain(climber.mastery[m], (v * mult) / 3),
    )
  }
}

// ---------- 하루 처리 ----------
function runOneDay(state: GameState, rng: Rng): DayResult {
  const c = state.climber
  const mods = collectModifiers(c, state.npc, getGym(state.gymId))
  const dayIndex = state.schedule.dayIndex
  const planned = getActivity(state.schedule.days[dayIndex])
  const lines: string[] = []
  let money = 0
  let exp = 0

  const injuriesAtDayStart = state.stats.injuries
  const rngRoll = rng()
  const blocked = !!planned && !planned.allowedWhenInjured && isInjured(c.condition)
  const act = blocked ? getActivity('rest-full') : planned

  if (blocked) lines.push(`${josa(planned!.name, '을/를')} 하려 했지만 몸이 말을 안 들었다. 오늘은 쉬었다.`)

  if (!act) {
    lines.push('일정이 비어 있었다. 그냥 쉬었다.')
    c.condition.hp = clamp100(c.condition.hp + 15 * mods.recovery)
    c.condition.fatigue = clamp100(c.condition.fatigue - 10 * mods.recovery)
  } else {
    const rec = mods.recovery
    c.condition.hp = clamp100(c.condition.hp + (act.hp >= 0 ? act.hp * rec : act.hp))
    c.condition.fatigue = clamp100(
      c.condition.fatigue + (act.fatigue <= 0 ? act.fatigue * rec : act.fatigue),
    )
    c.condition.mood = clamp100(c.condition.mood + act.mood)

    for (const [j, v] of Object.entries(act.joints) as [JointKey, number][]) {
      const applied = v >= 0 ? v * rec : v * mods.jointCost
      c.condition.joints[j] = clamp100(c.condition.joints[j] + applied)
    }

    lines.push(...grantStatExp(c, act.statExp))
    if (act.moveExp) grantMoveExp(c, act.moveExp)

    const totalStatExp = Object.values(act.statExp).reduce((a, b) => a + b, 0)
    exp = Math.round(totalStatExp * 0.6)
    grantExp(c, exp)

    money = act.money
    c.money = Math.max(0, c.money + money)
    if (money > 0) emit(state, { t: 'money.earn', amount: money, source: act.id })
    if (money < 0) emit(state, { t: 'money.spend', amount: -money, sink: act.id })

    // 알바를 반복하면 커리어 숙련도가 쌓이고 다음 알바가 열린다
    const career = careerOfActivity(act.id)
    if (career) state.career[career.id] = Math.min(200, (state.career[career.id] ?? 0) + 5)

    for (const ev of act.events) {
      if (rng() >= ev.chance) continue
      lines.push(ev.text)
      if (ev.npcId && ev.friendship) {
        state.npc[ev.npcId] = Math.min(
          BALANCE.npc.maxFriendship, (state.npc[ev.npcId] ?? 0) + ev.friendship,
        )
        emit(state, { t: 'npc.friendship', npcId: ev.npcId, value: state.npc[ev.npcId] })
      }
      if (ev.money) {
        money += ev.money
        c.money = Math.max(0, c.money + ev.money)
      }
      if (ev.mood) c.condition.mood = clamp100(c.condition.mood + ev.mood)
    }

    // 부상 판정 — 무작위 처벌이 아니라 누적된 선택의 결과다.
    // 피로도 관절도 멀쩡하면 아예 굴리지 않는다(첫날부터 다치는 일 없음).
    const worst = Math.min(...(Object.values(c.condition.joints) as number[]))
    const strained = c.condition.fatigue >= BALANCE.injury.strainFatigue
      || worst <= BALANCE.injury.strainJoint
    const riskMult = Math.min(
      BALANCE.injury.riskMaxMultiplier,
      1 + c.condition.fatigue / 50 + (1 - worst / 100) * 3,
    )
    if (strained && rng() < act.injuryRisk * riskMult * mods.jointCost) {
      const keys = Object.keys(act.joints).length > 0
        ? (Object.keys(act.joints) as JointKey[])
        : (['finger'] as JointKey[])
      const hurt = keys[Math.floor(rng() * keys.length)]
      c.condition.joints[hurt] = clamp100(c.condition.joints[hurt] - BALANCE.injury.injuryJointDrop)
      emit(state, { t: 'injury', joint: hurt })
      lines.push(`${JOINT_LABEL[hurt]}에서 뚝 소리가 났다. 무리했나 보다.`)
    }
  }

  // 자연 회복
  c.condition.fatigue = clamp100(
    c.condition.fatigue - BALANCE.injury.passiveFatigueRecovery * mods.recovery,
  )
  for (const j of Object.keys(c.condition.joints) as JointKey[]) {
    c.condition.joints[j] = clamp100(
      c.condition.joints[j] + BALANCE.injury.passiveJointRecovery * mods.recovery,
    )
  }

  if (act) emit(state, { t: 'activity.done', activityId: act.id, kind: act.kind })
  state.stats.days += 1

  // 지점 고유 이벤트 — 보상이 아니라 분위기 연출
  const gym = getGym(state.gymId)
  if (rngRoll < gym.signature.chance) {
    lines.push(gym.signature.text)
    if (gym.signature.effect.mood) {
      c.condition.mood = clamp100(c.condition.mood + gym.signature.effect.mood)
    }
    for (const [npcId, v] of Object.entries(gym.signature.effect.friendship ?? {})) {
      state.npc[npcId] = Math.min(BALANCE.npc.maxFriendship, (state.npc[npcId] ?? 0) + v)
      emit(state, { t: 'npc.friendship', npcId, value: state.npc[npcId] })
    }
    state.world.gymFamiliarity[gym.id] = Math.min(100, (state.world.gymFamiliarity[gym.id] ?? 0) + 2)
  }

  // 부상 없이 일주일을 보냈으면 업적용 이벤트
  if (state.schedule.dayIndex === 6 && state.stats.injuries === injuriesAtDayStart) {
    emit(state, { t: 'healthy.week' })
  }

  const result: DayResult = {
    week: state.schedule.week,
    dayIndex,
    activityId: act?.id ?? null,
    activityName: act ? `${act.icon} ${act.name}` : '🕳️ 빈 일정',
    lines, money, exp,
  }

  state.schedule.dayIndex += 1
  if (state.schedule.dayIndex > 6) {
    state.schedule.dayIndex = 0
    state.schedule.week += 1
    state.directPlayCount = 0
  }
  refreshQuests(state)
  return result
}

const snapshot = (c: Climber) => ({
  hp: c.condition.hp,
  fatigue: c.condition.fatigue,
  level: c.level,
  joints: { ...c.condition.joints },
})

/**
 * 마지막 처리 시각부터 now까지 지난 날짜를 소화한다.
 * SERVER-AUTHORITY: now는 game/clock.ts의 now()에서 오며 나중에 서버 시각으로 교체된다.
 */
export function advanceSchedule(
  input: GameState, now: number, rng: Rng,
): { state: GameState; report: OfflineReport | null } {
  const state: GameState = structuredClone(input)
  const day = dayLengthMs(state)
  const capMs = BALANCE.time.offlineCapHours * 3600_000

  const rawAway = Math.max(0, now - state.clock.lastTickAt)
  const away = Math.min(rawAway, capMs)
  const total = away + state.clock.bonusMs
  const rawDays = Math.floor(total / day)
  const days = Math.min(rawDays, BALANCE.time.offlineCapDays)

  if (days <= 0) {
    // 상한을 넘은 시간은 버린다(로컬 시간 조작 방지)
    if (rawAway > capMs) state.clock.lastTickAt = now - away
    return { state, report: null }
  }

  const before = snapshot(state.climber)
  const results: DayResult[] = []
  for (let i = 0; i < days; i++) results.push(runOneDay(state, rng))

  // 일수 상한에 걸렸다면 남은 시간은 버린다(무한 누적 방지)
  const leftover = days === rawDays ? total - days * day : 0
  state.clock.lastTickAt = now - leftover
  state.clock.bonusMs = 0

  const after = snapshot(state.climber)
  const report: OfflineReport = {
    awayMs: rawAway,
    cappedMs: Math.max(0, rawAway - capMs) + (rawDays - days) * day,
    daysRun: days,
    results,
    totalMoney: results.reduce((a, r) => a + r.money, 0),
    totalExp: results.reduce((a, r) => a + r.exp, 0),
    fatigueDelta: after.fatigue - before.fatigue,
    hpDelta: after.hp - before.hp,
    jointDelta: {
      finger: after.joints.finger - before.joints.finger,
      shoulder: after.joints.shoulder - before.joints.shoulder,
      knee: after.joints.knee - before.joints.knee,
    },
    unlocked: [],
    levelUps: after.level - before.level,
  }

  state.log = [
    ...results.map((r) => ({
      at: now,
      icon: '📅',
      text: `${r.week}주차 ${DAY_NAMES[r.dayIndex]}요일 — ${r.activityName}`,
    })),
    ...state.log,
  ].slice(0, BALANCE.log.max)

  return { state, report }
}

// ---------- 등반 결과 반영 ----------
/** 등반 한 동작의 결과를 캐릭터에 반영한다. 부상이 발생하면 관절 키를 돌려준다. */
export function applyStepResult(
  climber: Climber, result: StepResult, rng: Rng,
): JointKey | null {
  const c = climber.condition
  c.hp = clamp100(c.hp - result.cost.hp)
  c.fatigue = clamp100(c.fatigue + result.cost.fatigue)
  for (const [j, v] of Object.entries(result.cost.joints) as [JointKey, number][]) {
    c.joints[j] = clamp100(c.joints[j] - v)
  }
  for (const [m, v] of Object.entries(result.masteryGain) as [MoveKey, number][]) {
    climber.mastery[m] = Math.min(100, climber.mastery[m] + v)
  }
  if (rng() < result.injuryRisk) {
    const keys = Object.keys(result.cost.joints) as JointKey[]
    const hurt = keys.length > 0 ? keys[Math.floor(rng() * keys.length)] : 'finger'
    c.joints[hurt] = clamp100(c.joints[hurt] - BALANCE.injury.injuryJointDrop)
    return hurt
  }
  return null
}

/** 직접 플레이 반복 보정 — 계속 해도 바닥값 아래로는 안 떨어진다. */
export const directPlayMultiplier = (count: number): number => {
  const { diminishStep, diminishFloor } = BALANCE.directPlay
  return Math.max(diminishFloor, 1 / (1 + diminishStep * count))
}

/** 동작 성공 / 완등 시 현재 일정을 당기는 양(ms). */
export function speedupMs(state: GameState, kind: 'step' | 'clear'): number {
  const ratio = kind === 'step'
    ? BALANCE.directPlay.speedupPerStepRatio
    : BALANCE.directPlay.speedupOnClearRatio
  return dayLengthMs(state) * ratio * directPlayMultiplier(state.directPlayCount)
}

export const restDaysInWeek = (state: GameState): number =>
  state.schedule.days.filter((id) => {
    const a = ACTIVITIES.find((x) => x.id === id)
    return a?.kind === 'rest' || a?.kind === 'rehab'
  }).length

// ---------- 보상 계산 (순수) ----------
/** 완등 보상. 초견/첫 완등 보너스와 직접 플레이 배수를 여기서 전부 결정한다. */
export function clearReward(
  problem: { reward: { exp: number; money?: number }; firstClearBonus: { exp: number; money: number } },
  firstClear: boolean,
  onsight: boolean,
): { exp: number; money: number; statExpMult: number } {
  const { bonusRatio, onsightBonus } = BALANCE.directPlay
  const mult = bonusRatio * (onsight ? onsightBonus : 1)
  return {
    exp: Math.round(problem.reward.exp * mult) + (firstClear ? problem.firstClearBonus.exp : 0),
    money: (problem.reward.money ?? 0) + (firstClear ? problem.firstClearBonus.money : 0),
    statExpMult: bonusRatio,
  }
}

/** 실패해도 빈손은 아니다. 다만 완등보다 확실히 적어야 한다. */
export function failReward(problem: { reward: { exp: number } }): { exp: number; statExpMult: number } {
  return {
    exp: Math.round(problem.reward.exp * BALANCE.growth.failExpRatio),
    statExpMult: BALANCE.growth.failExpRatio,
  }
}
