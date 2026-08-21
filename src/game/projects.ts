import { BALANCE } from './balance'
import type { GameState, ProjectProgress } from './types'

/**
 * 프로젝트 문제 — 못 풀어도 남는 것.
 * 시도할수록 "이해도"가 오르고, 그 이해도가 다음 시도의 성공률을 조금 올린다.
 * (이해도 보정은 `climb.ts`의 `baseChanceOf`에서 한 번만 적용된다.)
 */
export const projectOf = (s: GameState, problemId: string): ProjectProgress =>
  (s.projects[problemId] ??= {
    problemId, bestStep: 0, attempts: 0, knownBetas: [], understanding: 0,
  })

export const understandingOf = (s: GameState, problemId: string): number =>
  s.projects[problemId]?.understanding ?? 0

/** 동작 하나의 결과를 프로젝트 기록에 남긴다. */
export function noteStep(
  s: GameState, problemId: string, stepIndex: number, choiceId: string, success: boolean,
): void {
  const p = projectOf(s, problemId)
  if (success) {
    p.bestStep = Math.max(p.bestStep, stepIndex + 1)
    if (!p.knownBetas.includes(choiceId)) p.knownBetas.push(choiceId)
  }
  p.understanding = Math.min(
    BALANCE.project.understandingMax,
    p.understanding + (success ? BALANCE.project.perStep : BALANCE.project.perFail),
  )
}

export function noteAttempt(s: GameState, problemId: string): void {
  projectOf(s, problemId).attempts += 1
}
