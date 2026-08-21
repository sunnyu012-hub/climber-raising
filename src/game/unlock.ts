import { getRegion } from '../content/regions'
import { NPCS } from '../content/npcs'
import type { GameState, UnlockRule } from './types'

/**
 * 해금 조건 판정 — 지역·암장·상점·퀘스트·대회가 **전부 이 한 함수**를 쓴다.
 * 조건을 새로 만들지 말고 `UnlockRule`에 필드를 하나 늘려서 여기에만 추가한다.
 *
 * 통과하면 null, 막혀 있으면 사용자에게 보여줄 이유 한 줄을 돌려준다.
 */
export function unlockBlocker(s: GameState, rule?: UnlockRule): string | null {
  if (!rule) return null
  if (rule.comingSoon) return '콘텐츠 준비 중이에요'
  if (rule.level && s.climber.level < rule.level) return `레벨 ${rule.level} 필요`
  if (rule.money && s.climber.money < rule.money) return `${rule.money.toLocaleString()}원 필요`
  if (rule.clears && s.stats.clears < rule.clears) return `완등 ${rule.clears}개 필요`
  if (rule.visitedGyms && s.world.visitedGyms.length < rule.visitedGyms)
    return `암장 ${rule.visitedGyms}곳 방문 필요`
  if (rule.fame && s.world.fame < rule.fame) return `명성 ${rule.fame} 필요`
  for (const r of rule.regions ?? []) {
    if (!s.world.unlockedRegions.includes(r)) return `${getRegion(r)?.displayName ?? r} 먼저 해금`
  }
  for (const q of rule.quests ?? []) {
    if (!s.quests.done.includes(q)) return '이전 퀘스트를 먼저 끝내야 해요'
  }
  for (const [npcId, need] of Object.entries(rule.npcFriendship ?? {})) {
    if ((s.npc[npcId] ?? 0) < need) {
      const name = NPCS.find((n) => n.id === npcId)?.name ?? npcId
      return `${name} 친밀도 ${need} 필요`
    }
  }
  return null
}

export const isUnlocked = (s: GameState, rule?: UnlockRule): boolean =>
  unlockBlocker(s, rule) === null
