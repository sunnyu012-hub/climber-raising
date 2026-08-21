import { GYMS, getGym, WAVEROCK_BRAND } from '../content/gyms'
import { REGIONS, getRegion } from '../content/regions'
import { clamp100 } from './character'
import { emit, pushLog } from './events'
import { unlockBlocker } from './unlock'
import type { GameState, Gym } from './types'

/**
 * 월드 이동 — 지점 이동과 원정.
 *
 * 이동은 **소속 지점을 옮기는 것**이다. 옮기면 그 암장의 문제를 붙을 수 있다.
 * 웨이브락 밖(브랜드가 다른 곳)으로 가는 건 원정으로 친다.
 *
 * ponytail: `Region.travelDays`는 아직 소비하지 않는다 — 날짜 진행이 실시간 시계에
 * 묶여 있어서, 일수 소모는 서버 시간 전환(SERVER-AUTHORITY) 뒤에 붙이는 게 맞다.
 */

export const isExpeditionGym = (gym: Gym): boolean => gym.brandId !== WAVEROCK_BRAND

/** 이동 비용. 지금 있는 곳이면 0. */
export const travelCost = (s: GameState, gymId: string): number =>
  s.gymId === gymId ? 0 : getGym(gymId).visitCost

/** 갈 수 있는가. 막히면 이유. */
export function travelBlocker(s: GameState, gymId: string): string | null {
  const gym = getGym(gymId)
  if (s.gymId === gymId) return '이미 여기예요'
  const locked = unlockBlocker(s, gym.unlock)
  if (locked) return locked
  const cost = travelCost(s, gymId)
  if (s.climber.money < cost) return `${(cost - s.climber.money).toLocaleString()}원 모자라요`
  return null
}

/** 지점 이동(또는 원정). 막히면 이유를 돌려준다. */
export function travelTo(s: GameState, gymId: string): string | null {
  const blocked = travelBlocker(s, gymId)
  if (blocked) return blocked
  const gym = getGym(gymId)
  const cost = travelCost(s, gymId)

  if (cost > 0) {
    s.climber.money -= cost
    emit(s, { t: 'money.spend', amount: cost, sink: 'travel' })
  }
  s.gymId = gymId
  if (!s.world.visitedGyms.includes(gymId)) s.world.visitedGyms.push(gymId)
  s.world.gymFamiliarity[gymId] = clamp100((s.world.gymFamiliarity[gymId] ?? 0) + 10)
  s.world.regionFamiliarity[gym.regionId] = clamp100((s.world.regionFamiliarity[gym.regionId] ?? 0) + 3)
  emit(s, { t: 'gym.visit', gymId })

  if (isExpeditionGym(gym)) {
    // 원정은 하루를 통째로 쓴다 — 몸은 축나고 기분은 좋다
    const c = s.climber.condition
    c.fatigue = clamp100(c.fatigue + 12)
    c.mood = clamp100(c.mood + 8)
    if (!s.world.expeditions.includes(gymId)) s.world.expeditions.push(gymId)
    emit(s, { t: 'expedition.done', regionId: gym.regionId, gymId })
    // 다녀온 곳마다 기념 배지 하나. 지역 보상이 따로 있으면 그것도 같이 준다.
    for (const badge of [`badge-${gym.id}`, getRegion(gym.regionId)?.reward?.badge]) {
      if (badge && !s.world.badges.includes(badge)) s.world.badges.push(badge)
    }
    s.world.fame += 20
    pushLog(s, '🚌', `${gym.branchName} 원정을 다녀왔다.`)
  } else {
    pushLog(s, '🚶', `${gym.branchName}으로 옮겼다.`)
  }
  return null
}

/** 조건을 채운 지역을 연다. 여러 번 불러도 안전하다. */
export function unlockRegions(s: GameState): void {
  for (const r of REGIONS) {
    if (s.world.unlockedRegions.includes(r.id)) continue
    if (unlockBlocker(s, r.unlock)) continue
    s.world.unlockedRegions.push(r.id)
    emit(s, { t: 'region.unlock', regionId: r.id })
    pushLog(s, '🗺️', `${r.displayName} 지역이 열렸다!`)
  }
}

/** 그 지역에서 갈 수 있는 암장 목록 (막힌 이유 포함) */
export const gymOptions = (s: GameState, regionId: string) =>
  GYMS.filter((g) => g.regionId === regionId).map((gym) => ({
    gym,
    blocked: travelBlocker(s, gym.id),
    cost: travelCost(s, gym.id),
    here: s.gymId === gym.id,
    visited: s.world.visitedGyms.includes(gym.id),
  }))
