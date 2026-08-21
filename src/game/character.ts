import { BALANCE } from './balance'
import type {
  Climber, ClimbModifiers, Condition, Gym, JointKey, JointStage, MoveKey, SkillEffect, StatKey, WallType,
} from './types'
import { SKILLS } from '../content/skills'
import { NPCS } from '../content/npcs'
import { getPersonality } from '../content/traits'

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
export const clamp100 = (v: number) => clamp(v, 0, 100)

// ---------- 성장 곡선 ----------
export function statExpNeeded(level: number): number {
  const { statExpBase, statExpGrowth } = BALANCE.growth
  return Math.round(statExpBase * Math.pow(statExpGrowth, Math.max(0, level - 8)))
}

export function levelExpNeeded(level: number): number {
  const { levelExpBase, levelExpGrowth } = BALANCE.growth
  return Math.round(levelExpBase * Math.pow(levelExpGrowth, level - 1))
}

/** 숙련도는 높을수록 느리게 오른다. */
export function masteryGain(current: number, weight = 1): number {
  const { masteryGainBase, masteryCurve } = BALANCE.growth
  const room = Math.max(0, 1 - current / 100)
  return masteryGainBase * Math.pow(room, masteryCurve) * weight
}

// ---------- 관절 ----------
export function jointStage(v: number): JointStage {
  const s = BALANCE.injury.stages
  if (v >= s.healthy) return 'healthy'
  if (v >= s.caution) return 'caution'
  if (v >= s.stiff) return 'stiff'
  if (v >= s.pain) return 'pain'
  return 'injured'
}

export const JOINT_STAGE_LABEL: Record<JointStage, string> = {
  healthy: '건강', caution: '주의', stiff: '뻐근함', pain: '통증', injured: '부상',
}

export const JOINT_STAGE_EMOJI: Record<JointStage, string> = {
  healthy: '🙂', caution: '😐', stiff: '😖', pain: '😣', injured: '🤕',
}

export const isInjured = (c: Condition): boolean =>
  (Object.values(c.joints) as number[]).some((v) => v < BALANCE.injury.blockClimbAt)

export const worstJoint = (c: Condition): { key: JointKey; value: number } =>
  (Object.entries(c.joints) as [JointKey, number][])
    .reduce((a, [k, v]) => (v < a.value ? { key: k, value: v } : a), { key: 'finger' as JointKey, value: 101 })

// ---------- 모디파이어 수집 ----------
export function emptyModifiers(): ClimbModifiers {
  return {
    moveChance: {}, statBonus: {},
    fatigueCost: 1, jointCost: 1, recovery: 1,
    reachComp: 0, revealChance: 0, injuryWarn: 0,
    wallAffinity: {},
  }
}

/** 스킬 + NPC 친밀도 특전 + 홈 지점 보너스를 하나의 모디파이어로 합친다. */
export function collectModifiers(
  climber: Climber,
  npc: Record<string, number>,
  gym?: Gym,
  /** 장착 장비 + 칭호 효과. 스토어가 넘겨준다 */
  extra: SkillEffect[] = [],
): ClimbModifiers {
  const m = emptyModifiers()
  const effects = [
    ...SKILLS.filter((s) => climber.skills.includes(s.id)).flatMap((s) => s.effects),
    ...NPCS.flatMap((n) => n.perks.filter((p) => (npc[n.id] ?? 0) >= p.at).map((p) => p.effect)),
    getPersonality(climber.personalityId).effect,
    ...(gym?.homeBonus ?? []),
    ...extra,
  ]
  for (const e of effects) {
    switch (e.kind) {
      case 'moveChance': m.moveChance[e.move] = (m.moveChance[e.move] ?? 0) + e.value; break
      case 'statBonus': m.statBonus[e.stat] = (m.statBonus[e.stat] ?? 0) + e.value; break
      case 'fatigueCost': m.fatigueCost *= e.value; break
      case 'jointCost': m.jointCost *= e.value; break
      case 'recovery': m.recovery *= e.value; break
      case 'reachComp': m.reachComp = Math.min(1, m.reachComp + e.value); break
      case 'revealChance': m.revealChance = Math.max(m.revealChance, e.value); break
      case 'injuryWarn': m.injuryWarn = Math.max(m.injuryWarn, e.value); break
      case 'wallAffinity': m.wallAffinity[e.wall] = (m.wallAffinity[e.wall] ?? 0) + e.value; break
    }
  }
  return m
}

/** 장착 장비 + 장착 칭호의 효과. 장식용 장비를 만들지 않기 위해 반영 지점은 여기 하나뿐이다. */
export function gearEffects(s: GameState): SkillEffect[] {
  const out: SkillEffect[] = []
  for (const id of Object.values(s.inventory.equipped)) {
    const item = id ? getItem(id) : undefined
    if (item) out.push(...item.effects)
  }
  const title = s.equippedTitle ? getTitle(s.equippedTitle) : undefined
  if (title?.effect) out.push(title.effect)
  return out
}

/**
 * 이 세이브 상태의 최종 모디파이어. **등반 판정은 전부 이 함수를 지난다** —
 * 스킬·NPC·홈짐·장비·칭호가 한 곳에서 합쳐져야 중복 적용이 안 생긴다.
 */
export const stateModifiers = (s: GameState): ClimbModifiers =>
  collectModifiers(s.climber, s.npc, getGym(s.gymId), gearEffects(s))

export const effectiveStat = (climber: Climber, mods: ClimbModifiers, key: StatKey): number =>
  climber.stats[key] + (mods.statBonus[key] ?? 0)

export function weightedStat(
  climber: Climber, mods: ClimbModifiers, weights: Partial<Record<StatKey, number>>,
): number {
  let sum = 0, total = 0
  for (const [k, w] of Object.entries(weights) as [StatKey, number][]) {
    sum += effectiveStat(climber, mods, k) * w
    total += w
  }
  return total > 0 ? sum / total : BALANCE.climb.statPivot
}

export const averageMastery = (climber: Climber, moves: MoveKey[]): number =>
  moves.length === 0 ? 0 : moves.reduce((a, m) => a + climber.mastery[m], 0) / moves.length

export const wallBonus = (mods: ClimbModifiers, wall: WallType): number =>
  mods.wallAffinity[wall] ?? 0

// ---------- 경고 ----------
export interface Warning { level: 'info' | 'warn' | 'danger'; text: string }

/** 부상 전에 반드시 먼저 뜨는 경고들. 겁주지 말고 귀엽고 명확하게. */
export function buildWarnings(climber: Climber, weekRestDays: number): Warning[] {
  const out: Warning[] = []
  const c = climber.condition
  const { injury } = BALANCE

  const finger = jointStage(c.joints.finger)
  if (finger === 'injured') out.push({ level: 'danger', text: '손가락이 파업에 들어갔어요. 재활부터 해요.' })
  else if (finger === 'pain') out.push({ level: 'danger', text: '손가락이 아파요. 오늘은 크림프보다 휴식이 좋아 보여요!' })
  else if (c.joints.finger < injury.warnAt) out.push({ level: 'warn', text: '손가락이 조용히 파업을 준비하고 있어요.' })

  const shoulder = jointStage(c.joints.shoulder)
  if (shoulder === 'injured') out.push({ level: 'danger', text: '어깨가 만세를 거부합니다. 재활 일정이 필요해요.' })
  else if (shoulder === 'pain') out.push({ level: 'danger', text: '어깨에서 소리가 나요. 당분간 다이노는 참아요.' })
  else if (c.joints.shoulder < injury.warnAt) out.push({ level: 'warn', text: '어깨가 뻐근해요. 오버행은 조금만.' })

  const knee = jointStage(c.joints.knee)
  if (knee === 'injured') out.push({ level: 'danger', text: '무릎이 힐 훅을 거부합니다. 쉬어야 해요.' })
  else if (knee === 'pain') out.push({ level: 'danger', text: '무릎이 시큰거려요. 힐 훅은 잠시 접어둬요.' })
  else if (c.joints.knee < injury.warnAt) out.push({ level: 'warn', text: '무릎이 눈치를 주고 있어요.' })

  if (c.fatigue >= injury.overtrainFatigue)
    out.push({ level: 'danger', text: '과훈련이에요. 몸이 "그만"이라고 말하고 있어요.' })
  else if (c.fatigue >= injury.overtrainFatigue - 20)
    out.push({ level: 'warn', text: '피로가 쌓이고 있어요. 이번 주에 휴식 하루 넣어볼까요?' })

  if (c.hp <= injury.lowHp)
    out.push({ level: 'warn', text: '체력이 바닥이에요. 오늘은 국밥 먹고 자는 게 이득이에요.' })

  if (weekRestDays === 0)
    out.push({ level: 'warn', text: '이번 주 휴식이 하루도 없어요. 쉬는 것도 훈련이에요!' })

  if (c.mood <= 25)
    out.push({ level: 'info', text: '의욕이 떨어졌어요. 크루 교류로 기분 전환은 어때요?' })

  return out
}
