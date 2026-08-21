import { BALANCE } from './balance'
import { now } from './clock'
import { STARTING_GYM_ID } from '../content/gyms'
import { PRESETS } from '../content/activities'
import { generateCharacter } from './characterGen'
import { emptyStats } from './events'
import { emptyQuests } from './quests'
import { emptyWorld } from './world'
import { emptyInventory } from './inventory'
import { SLOT_ORDER, SLOT_UNLOCK_LEVEL } from '../content/equipment'
import { CURRENT_SEASON_ID } from '../content/progression'
import type { Climber, EquipSlot, GameState, Gender, OnboardingDraft, ReachTrait } from './types'

export const SAVE_VERSION = 4

export const AGE = {
  min: BALANCE.creation.ageMin,
  max: BALANCE.creation.ageMax,
  default: BALANCE.creation.ageDefault,
} as const

export const GENDER_LABEL: Record<Gender, string> = {
  female: '여자',
  male: '남자',
  unset: '미설정',
}

export const clampAge = (v: number): number =>
  Math.max(AGE.min, Math.min(AGE.max, Math.round(Number.isFinite(v) ? v : AGE.default)))

/**
 * 폴백/테스트용 캐릭터.
 * reach를 지정하면 체형만 덮어쓴다 — 능력치는 그대로라 체형 효과만 비교할 수 있다.
 */
export const createClimber = (name = '게스트 클라이머', reach?: ReachTrait): Climber => {
  const c = generateCharacter({ seed: 20260821, nickname: name, gender: 'unset', age: null })
  if (reach) c.reach = reach
  return c
}

/** 그 레벨에서 열려 있어야 할 장비 슬롯 (마이그레이션·레벨업 공용) */
export const slotsForLevel = (level: number): EquipSlot[] =>
  SLOT_ORDER.filter((slot) => level >= SLOT_UNLOCK_LEVEL[slot])

export function createNewGame(climber?: Climber, gymId: string = STARTING_GYM_ID): GameState {
  const t = now()
  const c = climber ?? createClimber()
  return {
    version: SAVE_VERSION,
    onboardingCompleted: !!climber,
    climber: c,
    gymId,
    homeGymId: gymId,
    schedule: { week: 1, dayIndex: 0, days: [...PRESETS[0].days] },
    clock: { createdAt: t, lastTickAt: t, bonusMs: 0 },
    records: {},
    npc: { owner: 5, setter: 0, veteran: 0 },
    achievements: [],
    log: [{ at: t, icon: '🎒', text: `${c.name}, 부산에서 클라이밍을 시작했다.` }],
    settings: { fastMode: false, devTimeScale: BALANCE.time.defaultTimeScale },
    directPlayCount: 0,
    pendingReport: null,

    // ---- 전체 시스템 뼈대 ----
    stats: emptyStats(),
    collection: { problem: [], gym: [gymId], npc: [], equipment: [] },
    quests: emptyQuests(),
    achievementProgress: {},
    titles: ['title-rookie'],
    equippedTitle: 'title-rookie',
    world: emptyWorld(gymId),
    inventory: emptyInventory(),
    career: {},
    projects: {},
    competitionRecords: [],
    crew: { crewId: null, name: null },
    seasonId: CURRENT_SEASON_ID,
    shopBought: {},
  }
}

// ---------------- 온보딩 진행 상태 ----------------
export const createDraft = (seed: number, nickname: string): OnboardingDraft => ({
  step: 1,
  nickname,
  gender: 'female',
  age: AGE.default,
  seed,
  gymId: null,
})

/** 온보딩을 끝낼 수 있는 상태인가. UI와 스토어가 같은 규칙을 쓴다. */
export function draftBlocker(d: OnboardingDraft): string | null {
  if (d.nickname.trim().length < 2 || d.nickname.trim().length > 10) return '닉네임은 2~10자로 정해주세요.'
  if (d.gender !== 'female' && d.gender !== 'male') return '성별을 골라주세요.'
  if (!Number.isFinite(d.age)) return '나이를 정해주세요.'
  if (!d.seed) return '캐릭터를 먼저 뽑아주세요.'
  if (!d.gymId) return '시작 암장을 골라주세요.'
  return null
}
