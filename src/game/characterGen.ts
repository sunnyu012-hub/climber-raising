import { BALANCE } from './balance'
import { seededRng, type Rng } from './rng'
import { ALL_MOVES } from '../content/moves'
import { APPEARANCE_POOLS } from '../content/appearance'
import { NICKNAMES } from '../content/nicknames'
import { BODY_TYPES, FIRST_TITLES, PERSONALITIES, SPECIALTIES, getSpecialty } from '../content/traits'
import type {
  Appearance, Climber, Gender, MoveKey, ReachTrait, StatKey,
} from './types'

/**
 * 캐릭터 랜덤 생성 — 전부 순수 함수다.
 * React 컴포넌트 안에서 굴리지 마라. 같은 시드면 항상 같은 캐릭터가 나온다.
 *
 * 공정성 규칙 (docs/BALANCE.md 참조)
 *  - 모든 캐릭터의 시작 능력치 총합은 동일하다.
 *  - 성별과 나이는 능력치에 전혀 영향을 주지 않는다.
 *  - 주특기는 능력치를 재분배할 뿐 총합을 늘리지 않는다.
 *  - 체형은 능력치를 바꾸지 않는다. 등반 판정(먼 홀드/압축)에만 연결된다.
 */

export const STAT_KEYS: StatKey[] = [
  'power', 'technique', 'flexibility', 'stamina', 'routefinding', 'mental', 'social', 'luck',
]

const pickFrom = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
const intBetween = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1))

// ---------------- 닉네임 ----------------
export const rollNickname = (rng: Rng): string => pickFrom(rng, NICKNAMES)

// ---------------- 외형 ----------------
export function rollAppearance(rng: Rng): Appearance {
  const P = APPEARANCE_POOLS
  return {
    hair: pickFrom(rng, P.hair),
    hairColor: pickFrom(rng, P.hairColor),
    skin: pickFrom(rng, P.skin),
    shirt: pickFrom(rng, P.shirt),
    pants: pickFrom(rng, P.pants),
    shoe: pickFrom(rng, P.shoe),
    chalkbag: pickFrom(rng, P.chalkbag),
  }
}

// ---------------- 체형 · 키 ----------------
export function rollBody(rng: Rng): { reach: ReachTrait; height: number } {
  const body = pickFrom(rng, BODY_TYPES)
  return { reach: body.id, height: intBetween(rng, body.height[0], body.height[1]) }
}

// ---------------- 주특기 · 성격 ----------------
export const rollSpecialty = (rng: Rng): string => pickFrom(rng, SPECIALTIES).id
export const rollPersonality = (rng: Rng): string => pickFrom(rng, PERSONALITIES).id
export const rollTitle = (rng: Rng): string => pickFrom(rng, FIRST_TITLES)

// ---------------- 능력치 (고정 총합) ----------------
/**
 * 총합을 고정한 채로 8개 능력치를 배분한다.
 * 최솟값에서 시작해 남은 점수를 한 점씩 무작위로 뿌린다 — 최댓값에 걸리면 다른 데로 간다.
 */
export function rollStats(rng: Rng, specialtyId: string): Record<StatKey, number> {
  const { total, min, max, specialtyBonus } = BALANCE.creation

  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, min])) as Record<StatKey, number>
  let remaining = total - min * STAT_KEYS.length

  let guard = 0
  while (remaining > 0 && guard++ < 10000) {
    const k = pickFrom(rng, STAT_KEYS)
    if (stats[k] < max) {
      stats[k] += 1
      remaining -= 1
    }
  }

  // 주특기 보너스는 총합을 늘리지 않는다 — 다른 능력치에서 그대로 빼온다.
  const spec = getSpecialty(specialtyId)
  let moved = 0
  guard = 0
  while (moved < specialtyBonus && guard++ < 10000) {
    if (stats[spec.stat] >= max) break
    const donor = pickFrom(rng, STAT_KEYS)
    if (donor === spec.stat || stats[donor] <= min) continue
    stats[donor] -= 1
    stats[spec.stat] += 1
    moved += 1
  }
  return stats
}

// ---------------- 무브 숙련도 ----------------
export function rollMastery(rng: Rng, specialtyId: string): Record<MoveKey, number> {
  const mastery = Object.fromEntries(ALL_MOVES.map((m) => [m, 0])) as Record<MoveKey, number>
  for (const m of getSpecialty(specialtyId).moves as MoveKey[]) {
    if (m in mastery) mastery[m] = intBetween(rng, BALANCE.creation.masteryMin, BALANCE.creation.masteryMax)
  }
  return mastery
}

// ---------------- 자기소개 ----------------
export const buildIntro = (specialtyId: string): string => getSpecialty(specialtyId).intro

// ---------------- 최종 조립 ----------------
export interface GenerateInput {
  seed: number
  nickname: string
  gender: Gender
  age: number | null
}

/**
 * 성별·나이·닉네임은 사용자가 정하고 나머지는 시드에서 굴린다.
 * 성별/나이는 rng를 소비하지 않으므로 **같은 시드면 성별을 바꿔도 같은 몸이 나온다** —
 * 성별이 능력치나 체형에 영향을 주지 않는다는 규칙이 구조로 보장된다.
 */
export function generateCharacter(input: GenerateInput): Climber {
  const rng = seededRng(input.seed)

  const appearance = rollAppearance(rng)
  const { reach, height } = rollBody(rng)
  const specialtyId = rollSpecialty(rng)
  const personalityId = rollPersonality(rng)
  const stats = rollStats(rng, specialtyId)
  const mastery = rollMastery(rng, specialtyId)
  const title = rollTitle(rng)

  return {
    name: input.nickname,
    gender: input.gender,
    age: input.age,
    height,
    appearance,
    seed: input.seed,
    specialtyId,
    personalityId,
    intro: buildIntro(specialtyId),
    title,
    reach,
    level: 1,
    exp: 0,
    stats,
    statExp: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Record<StatKey, number>,
    mastery,
    condition: {
      hp: 100, fatigue: 0, mood: 70,
      joints: { finger: 100, shoulder: 100, knee: 100 },
    },
    skillPoints: 1,
    skills: [],
    money: BALANCE.creation.startingMoney,
    equipment: [],
  }
}

/** 새 시드 하나. 다시 뽑기에서 쓴다. */
export const newSeed = (): number => Math.floor(Math.random() * 2 ** 31)
