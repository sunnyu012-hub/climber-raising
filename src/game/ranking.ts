import { CURRENT_SEASON_ID } from '../content/progression'
import type { GameState, RankingCategory } from './types'

/**
 * 랭킹.
 *
 * 로컬 모드에서는 **내 예상 점수만** 계산한다. 가짜 경쟁 순위를 만들지 않는다.
 * SERVER-AUTHORITY: 실제 순위는 서버가 같은 식으로 재계산해 매긴다.
 * 클라이언트가 계산한 점수를 그대로 제출하지 않는다 — 여기 값은 "이렇게 계산됩니다" 안내용이다.
 */
export const RANKINGS: RankingCategory[] = [
  { id: 'growth', name: '종합 성장', desc: '레벨 · 능력치 총합 · 명성', score: (s) => s.climber.level * 100 + Object.values(s.climber.stats).reduce((a, b) => a + b, 0) * 5 + s.world.fame },
  { id: 'max-grade', name: '최고 난도', desc: '완등한 가장 높은 난이도', score: (s) => Math.max(0, s.stats.bestGrade + 1) * 200 },
  { id: 'onsight', name: '초견왕', desc: '초견 완등 수', score: (s) => s.stats.onsights * 150 },
  { id: 'reach', name: '리치 극복왕', desc: '짧은 리치로 올린 완등', score: (s) => (s.climber.reach === 'short' ? s.stats.clears * 120 : s.stats.clears * 30) },
  { id: 'social', name: '인맥왕', desc: 'NPC 친밀도 합', score: (s) => Object.values(s.npc).reduce((a, b) => a + b, 0) * 8 },
  { id: 'expedition', name: '원정왕', desc: '원정 횟수 · 방문 암장', score: (s) => s.stats.expeditions * 300 + s.world.visitedGyms.length * 80 },
  { id: 'job', name: '알바왕', desc: '알바 횟수 · 누적 수입', score: (s) => s.stats.jobs * 40 + Math.floor(s.stats.earned / 10000) * 5 },
  { id: 'joints', name: '철벽관절왕', desc: '부상 없이 버틴 정도', score: (s) => Math.max(0, s.stats.attempts * 10 - s.stats.injuries * 200) },
  { id: 'growth-speed', name: '급성장왕', desc: '플레이 일수 대비 성장', score: (s) => Math.round((s.climber.level * 100) / Math.max(1, s.stats.days)) },
  { id: 'crew', name: '크루 기여왕', desc: '크루 활동 기여도', score: () => 0 },
]

export interface RankingRow {
  category: RankingCategory
  score: number
  /** 서버 연결 후에만 순위가 나온다 */
  rank: null
}

export const myRankings = (s: GameState): RankingRow[] =>
  RANKINGS.map((category) => ({ category, score: Math.round(category.score(s)), rank: null }))

export const seasonId = () => CURRENT_SEASON_ID
