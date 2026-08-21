import { BALANCE } from './balance'
import { getProblem } from '../content/problems'
import type { GameState, ProjectProgress } from './types'

/**
 * 프로젝트 문제 — 한 번에 못 풀어도 진척이 남는다.
 * 실패해도 동작 이해도·발견한 베타·다음 시도 보정이 쌓인다.
 */

export const emptyProject = (problemId: string): ProjectProgress => ({
  problemId, bestStep: 0, attempts: 0, knownBetas: [], understanding: 0,
})

export const getProject = (s: GameState, problemId: string): ProjectProgress | undefined =>
  s.projects[problemId]

/** 이해도가 주는 성공률 보정 (상한 있음) */
export function projectBonus(s: GameState, problemId: string): number {
  const p = s.projects[problemId]
  if (!p) return 0
  return (p.understanding / 100) * BALANCE.project.maxBonus
}

/** 한 동작을 시도할 때마다 진척을 기록한다 */
export function recordStep(
  s: GameState, problemId: string, stepIndex: number, choiceId: string, success: boolean,
): void {
  const prob = getProblem(problemId)
  if (!prob?.isProject) return
  const p = (s.projects[problemId] ??= emptyProject(problemId))

  const betaKey = `${stepIndex}:${choiceId}`
  if (success && !p.knownBetas.includes(betaKey)) {
    p.knownBetas.push(betaKey)
    p.understanding = Math.min(100, p.understanding + BALANCE.project.betaGain)
  }
  if (stepIndex + 1 > p.bestStep) {
    p.bestStep = stepIndex + 1
    p.understanding = Math.min(100, p.understanding + BALANCE.project.stepGain)
  }
  // 실패해도 조금은 남는다
  if (!success) p.understanding = Math.min(100, p.understanding + BALANCE.project.failGain)
}

export function recordAttempt(s: GameState, problemId: string): void {
  const prob = getProblem(problemId)
  if (!prob?.isProject) return
  const p = (s.projects[problemId] ??= emptyProject(problemId))
  p.attempts += 1
}
