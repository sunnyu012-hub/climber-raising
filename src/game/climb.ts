import { BALANCE } from './balance'
import { MOVE_INFO } from '../content/moves'
import {
  averageMastery, clamp, effectiveStat, masteryGain, weightedStat, wallBonus,
} from './character'
import type { Rng } from './rng'
import type {
  BetaChoice, ChanceTier, JointKey, MoveKey, Outcome, PoseKey, StepContext, StepResult,
} from './types'

/**
 * 등반 한 동작 판정. 순수 함수 — 부수효과 없음, 난수는 인자로 받은 rng만 사용.
 * UI는 이 함수의 결과를 표시하기만 한다.
 */

export const TIER_LABEL: Record<ChanceTier, string> = {
  veryGood: '매우 유리', doable: '해볼 만함', risky: '위험', reckless: '무모함', unknown: '알 수 없음',
}

export function chanceTier(chance: number): ChanceTier {
  if (chance >= 0.75) return 'veryGood'
  if (chance >= 0.55) return 'doable'
  if (chance >= 0.38) return 'risky'
  return 'reckless'
}

/** 선택지가 부담을 주는 관절들. cost에 명시된 게 없으면 무브의 주 관절을 쓴다. */
export function affectedJoints(choice: BetaChoice): JointKey[] {
  const explicit = (['finger', 'shoulder', 'knee'] as JointKey[]).filter(
    (j) => (choice.cost[j] ?? 0) !== 0,
  )
  if (explicit.length > 0) return explicit
  return [...new Set(choice.moves.map((m) => MOVE_INFO[m].joint))]
}

/** 리치 특성 보정. 짧은 리치는 먼 홀드에 불리하지만 압축 동작에 강하다. */
export function reachAdjust(ctx: StepContext, choice: BetaChoice): number {
  const { reachFarPenalty, reachCompressedBonus, shortReachIntermediateBonus } = BALANCE.climb
  const trait = ctx.climber.reach
  const comp = ctx.mods.reachComp
  let v = 0
  if (choice.reach === 'far') {
    if (trait === 'short') v -= reachFarPenalty * (1 - comp)
    if (trait === 'long') v += reachFarPenalty * 0.6
  } else if (choice.reach === 'compressed') {
    if (trait === 'short') v += reachCompressedBonus
    if (trait === 'long') v -= reachCompressedBonus * 0.6
  }
  if (trait === 'short' && choice.moves.includes('intermediate')) v += shortReachIntermediateBonus
  return v
}

/** 행운 보정 전의 성공률. UI가 등급 표시에 쓴다. */
export function baseChanceOf(ctx: StepContext, choice: BetaChoice): number {
  const C = BALANCE.climb
  const { climber, mods, problem } = ctx
  const cond = climber.condition

  const stat = weightedStat(climber, mods, choice.stats)
  const statTerm = C.statWeight * clamp((stat - C.statPivot) / C.statScale, -1, 1)

  const mastery = averageMastery(climber, choice.moves)
  const masteryTerm = C.masteryWeight * (mastery / 100)

  const fatigueTerm = -C.fatiguePenalty * (cond.fatigue / 100)
  const hpTerm = -C.hpPenalty * Math.max(0, (C.hpSafeLine - cond.hp) / C.hpSafeLine)

  const joints = affectedJoints(choice)
  const jointHealth = Math.min(...joints.map((j) => cond.joints[j]), 100)
  const jointTerm = -C.jointPenalty * (1 - jointHealth / 100)

  const moodTerm = C.moodWeight * ((cond.mood - 50) / 50)
  const gradeTerm = -C.gradeScale * problem.grade

  const skillTerm =
    choice.moves.reduce((a, m) => a + (mods.moveChance[m] ?? 0), 0) +
    wallBonus(mods, problem.wall)

  // 프로젝트 이해도 — 같은 문제를 붙어본 만큼 조금 유리해진다
  const projectTerm = BALANCE.project.chanceBonus * ((ctx.understanding ?? 0) / 100)

  return (
    choice.baseChance + statTerm + masteryTerm + fatigueTerm + hpTerm +
    jointTerm + moodTerm + gradeTerm + skillTerm + projectTerm + reachAdjust(ctx, choice)
  )
}

/**
 * 행운 보정. 반드시 |결과| <= luckRange * choice.luckMult 를 만족한다.
 * 행운 능력치는 폭이 아니라 기댓값만 위로 민다 — 성장을 무력화하지 않기 위해서.
 */
export function luckShiftOf(ctx: StepContext, choice: BetaChoice, u: number): number {
  const C = BALANCE.climb
  const span = C.luckRange * choice.luckMult
  const luckStat = effectiveStat(ctx.climber, ctx.mods, 'luck')
  const bias = clamp((luckStat - C.statPivot) / C.luckStatScale, -0.5, 0.5)
  return clamp((u * 2 - 1) * span + bias * span, -span, span)
}

export function outcomeOf(chance: number, roll: number): Outcome {
  const C = BALANCE.climb
  if (roll < chance * C.critRatio) return 'crit'
  if (roll < chance) return 'success'
  if (roll < chance + (1 - chance) * C.partialBand) return 'partial'
  return 'fall'
}

export const isSuccess = (o: Outcome) => o === 'crit' || o === 'success'

const LUCKY_RESCUE = [
  '떨어지려는 순간 무릎이 홀드에 걸렸다. 자세는 이상하지만 살았다!',
  '손이 빠졌는데 반대 손이 저절로 다른 홀드를 잡았다. 몸이 알아서 했다!',
  '발이 미끄러지다가 아래 홀드에 딱 멈췄다. 운이 좋다!',
]

export function resolveStep(ctx: StepContext, choice: BetaChoice, rng: Rng): StepResult {
  const C = BALANCE.climb
  const { climber, mods } = ctx

  const luckShift = luckShiftOf(ctx, choice, rng())
  const chance = clamp(baseChanceOf(ctx, choice) + luckShift, C.minChance, C.maxChance)

  const roll = rng()
  let outcome = outcomeOf(chance, roll)

  let luckyEvent = false
  if (outcome === 'fall' && rng() < C.luckyEventChance) {
    outcome = 'partial'
    luckyEvent = true
  }

  const mastery = averageMastery(climber, choice.moves)
  const mult = C.costByOutcome[outcome]
  const relief = 1 - C.masteryCostRelief * (mastery / 100)

  // 음수 비용(레스트)은 회복이다 — 성공했을 때만 준다.
  const scale = (v: number): number => {
    if (v >= 0) return v * mult * relief
    return outcome === 'crit' ? v * 1.2 : outcome === 'success' ? v : 0
  }

  const joints: Partial<Record<JointKey, number>> = {}
  for (const j of ['finger', 'shoulder', 'knee'] as JointKey[]) {
    const v = choice.cost[j]
    if (v) joints[j] = scale(v) * mods.jointCost
  }

  const masteryWeightByOutcome =
    outcome === 'crit' ? 1.3 : outcome === 'success' ? 1 : BALANCE.growth.failMasteryRatio
  const masteryGains: Partial<Record<MoveKey, number>> = {}
  for (const m of choice.moves) {
    masteryGains[m] = masteryGain(climber.mastery[m], masteryWeightByOutcome)
  }

  const jointsUsed = affectedJoints(choice)
  const jointHealth = Math.min(...jointsUsed.map((j) => climber.condition.joints[j]), 100)
  const riskMult = Math.min(
    BALANCE.injury.riskMaxMultiplier,
    1 + climber.condition.fatigue / 50 + (1 - jointHealth / 100) * 3 + (outcome === 'fall' ? 1 : 0),
  )
  const injuryRisk = BALANCE.injury.riskPerHardStep * riskMult * mods.jointCost

  const text = luckyEvent
    ? LUCKY_RESCUE[Math.floor(rng() * LUCKY_RESCUE.length)]
    : outcome === 'crit' ? choice.critText
    : outcome === 'success' ? choice.successText
    : outcome === 'partial' ? choice.partialText
    : choice.fallText

  const basePose: PoseKey = choice.pose ?? MOVE_INFO[choice.moves[0]].pose
  const pose: PoseKey = outcome === 'fall' ? 'fall' : outcome === 'partial' ? 'wobble' : basePose

  return {
    outcome, chance, roll, luckShift, luckyEvent, text, pose,
    cost: {
      hp: scale(choice.cost.hp),
      fatigue: scale(choice.cost.fatigue) * mods.fatigueCost,
      joints,
    },
    masteryGain: masteryGains,
    injuryRisk,
  }
}
