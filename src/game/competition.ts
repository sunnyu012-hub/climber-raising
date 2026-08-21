import { COMPETITIONS, getCompetition } from '../content/progression'
import { getProblem } from '../content/problems'
import { baseChanceOf, isSuccess, resolveStep } from './climb'
import { stateModifiers } from './character'
import { applyStepResult } from './progress'
import { emit, grantTitle, moveEvents, pushLog } from './events'
import { now } from './clock'
import { unlockBlocker } from './unlock'
import type { Competition, GameState, StepContext } from './types'
import type { Rng } from './rng'

/**
 * 미니대회. 새 판정식을 만들지 않는다 — 평소 등반과 **똑같은** `resolveStep`으로
 * 문제를 자동으로 붙어보고, 얼마나 올라갔는지로 점수를 낸다.
 * (대회 전용 확률을 따로 두면 밸런스가 두 벌이 된다.)
 */

export const competitionOptions = (s: GameState) =>
  COMPETITIONS.map((comp) => ({
    comp,
    blocked: unlockBlocker(s, comp.unlock)
      ?? (s.climber.money < comp.entryFee
        ? `참가비 ${comp.entryFee.toLocaleString()}원 필요` : null),
    record: s.competitionRecords.find((r) => r.competitionId === comp.id),
  }))

const tierOf = (comp: Competition, score: number) =>
  [...comp.tiers].reverse().find((t) => score >= t.minScore) ?? comp.tiers[0]

export interface CompetitionResult {
  score: number
  tier: string
  topped: number
  total: number
  money: number
  fame: number
  lines: string[]
}

/** 대회 진행. 참가할 수 없으면 이유 문자열을 돌려준다. */
export function runCompetition(
  s: GameState, compId: string, rng: Rng,
): CompetitionResult | string {
  const comp = getCompetition(compId)
  if (!comp) return '없는 대회예요'
  const blocked = unlockBlocker(s, comp.unlock)
  if (blocked) return blocked
  if (s.climber.money < comp.entryFee)
    return `${(comp.entryFee - s.climber.money).toLocaleString()}원 모자라요`

  s.climber.money -= comp.entryFee
  emit(s, { t: 'money.spend', amount: comp.entryFee, sink: 'competition' })

  const mods = stateModifiers(s)
  const lines: string[] = []
  let scoreSum = 0
  let topped = 0
  const problems = comp.problemIds.map(getProblem).filter((p) => !!p)

  for (const problem of problems) {
    let step = 0
    let retries = 0
    while (step < problem.steps.length) {
      const ctx: StepContext = { climber: s.climber, problem, mods }
      const choices = problem.steps[step].choices
      // 대회에서는 캐릭터가 알아서 제일 승산 있는 베타를 고른다
      const best = choices.reduce((a, c) =>
        baseChanceOf(ctx, c) > baseChanceOf(ctx, a) ? c : a)
      const r = resolveStep(ctx, best, rng)
      applyStepResult(s.climber, r, rng)
      for (const ev of moveEvents(best.moves)) emit(s, ev)
      if (isSuccess(r.outcome)) { step += 1; retries = 0 }
      else if (r.outcome === 'partial' && retries < 1) retries += 1
      else break
    }
    const done = step >= problem.steps.length
    if (done) topped += 1
    scoreSum += done ? 100 : Math.round(60 * (step / problem.steps.length))
    lines.push(done
      ? `${problem.name} — 완등! (100점)`
      : `${problem.name} — ${step}동작에서 떨어짐 (${Math.round(60 * (step / problem.steps.length))}점)`)
    emit(s, { t: 'climb.attempt', problemId: problem.id, gymId: comp.gymId, grade: problem.grade })
  }

  const score = problems.length ? Math.round(scoreSum / problems.length) : 0
  const t = tierOf(comp, score)
  if (t.money) {
    s.climber.money += t.money
    emit(s, { t: 'money.earn', amount: t.money, source: 'competition' })
  }
  s.world.fame += t.fame
  if (t.title) grantTitle(s, t.title)

  const rec = s.competitionRecords.find((r) => r.competitionId === compId)
  if (rec) {
    rec.entries += 1
    rec.lastAt = now()
    if (score > rec.bestScore) { rec.bestScore = score; rec.bestTier = t.tier }
  } else {
    s.competitionRecords.push({
      competitionId: compId, bestScore: score, bestTier: t.tier, entries: 1, lastAt: now(),
    })
  }
  emit(s, { t: 'competition.done', competitionId: compId, tier: t.tier })
  pushLog(s, '🏆', `${comp.name} ${t.tier} (${score}점)`)

  return { score, tier: t.tier, topped, total: problems.length, money: t.money, fame: t.fame, lines }
}
