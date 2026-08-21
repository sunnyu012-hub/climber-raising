import { collectModifiers } from './character'
import { equippedEffects } from './inventory'
import { getTitle } from '../content/progression'
import { getGym } from '../content/gyms'
import type { ClimbModifiers, GameState, SkillEffect } from './types'

/**
 * 지금 캐릭터에게 걸린 **모든** 보정을 한 번에 모은다.
 * 스킬 + NPC 특전 + 성격 + 홈짐 + 장착 장비 + 장착 칭호.
 *
 * 판정하는 곳은 전부 이 함수를 써야 한다 — 화면마다 다른 조합을 쓰면
 * 표시된 성공률과 실제 결과가 어긋난다.
 */
export function allModifiers(s: GameState): ClimbModifiers {
  const extra: SkillEffect[] = [...equippedEffects(s)]
  const title = s.equippedTitle ? getTitle(s.equippedTitle) : undefined
  if (title?.effect) extra.push(title.effect)
  return collectModifiers(s.climber, s.npc, getGym(s.gymId), extra)
}
