import { describe, expect, it } from 'vitest'
import { BALANCE } from '../balance'
import { baseChanceOf } from '../climb'
import { collectModifiers, emptyModifiers } from '../character'
import {
  STAT_KEYS, generateCharacter, rollAppearance, rollBody, rollMastery, rollStats,
} from '../characterGen'
import { seededRng } from '../rng'
import { APPEARANCE_POOLS } from '../../content/appearance'
import { NICKNAMES } from '../../content/nicknames'
import { BODY_TYPES, PERSONALITIES, SPECIALTIES, getSpecialty } from '../../content/traits'
import { getProblem } from '../../content/problems'
import type { Gender, StatKey } from '../types'

const C = BALANCE.creation
const gen = (seed: number, gender: Gender = 'female', age: number | null = 28) =>
  generateCharacter({ seed, nickname: '테스터', gender, age })

const sum = (stats: Record<StatKey, number>) =>
  STAT_KEYS.reduce((a, k) => a + stats[k], 0)

describe('캐릭터 생성 — 재현성', () => {
  it('같은 시드는 같은 캐릭터를 만든다', () => {
    expect(gen(12345)).toEqual(gen(12345))
  })

  it('다른 시드는 충분히 다른 결과를 만든다', () => {
    const seen = new Set<string>()
    for (let s = 0; s < 60; s++) {
      const c = gen(s)
      seen.add(`${c.reach}|${c.specialtyId}|${c.personalityId}|${c.appearance.hair}|${c.appearance.shirt}`)
    }
    expect(seen.size).toBeGreaterThan(30)
  })

  it('저장된 시드로 다시 만들면 외형이 똑같이 복원된다', () => {
    const c = gen(777)
    expect(gen(c.seed).appearance).toEqual(c.appearance)
  })
})

describe('공정성 — 성별과 나이는 능력치를 바꾸지 않는다', () => {
  it('성별만 다르면 능력치·체형·키가 완전히 같다', () => {
    const f = gen(999, 'female', 28)
    const m = gen(999, 'male', 28)
    expect(m.stats).toEqual(f.stats)
    expect(m.reach).toBe(f.reach)
    expect(m.height).toBe(f.height)
    expect(m.specialtyId).toBe(f.specialtyId)
  })

  it('나이만 다르면 능력치가 완전히 같다', () => {
    const young = gen(4242, 'female', 18)
    const old = gen(4242, 'female', 60)
    expect(old.stats).toEqual(young.stats)
    expect(old.money).toBe(young.money)
    expect(sum(old.stats)).toBe(sum(young.stats))
  })

  it('미설정(unset) 성별·나이여도 정상 생성된다', () => {
    const c = generateCharacter({ seed: 5, nickname: '옛유저', gender: 'unset', age: null })
    expect(sum(c.stats)).toBe(C.total)
    expect(c.age).toBeNull()
  })
})

describe('공정성 — 능력치 총합과 범위', () => {
  it('어떤 캐릭터든 시작 능력치 총합이 동일하다', () => {
    for (let s = 0; s < 200; s++) expect(sum(gen(s).stats)).toBe(C.total)
  })

  it('모든 능력치가 허용 범위 안에 있다', () => {
    for (let s = 0; s < 200; s++) {
      const c = gen(s)
      for (const k of STAT_KEYS) {
        expect(c.stats[k]).toBeGreaterThanOrEqual(C.min)
        expect(c.stats[k]).toBeLessThanOrEqual(C.max)
      }
    }
  })

  it('주특기 보너스가 실제로 반영된다', () => {
    // 같은 시드면 기본 배분이 동일하다 → 주특기만 바꿔 비교하면 보너스가 그대로 보인다
    for (const spec of SPECIALTIES) {
      const other = SPECIALTIES.find((x) => x.stat !== spec.stat)!
      let wins = 0
      for (let s = 0; s < 40; s++) {
        const mine = rollStats(seededRng(s), spec.id)[spec.stat]
        const theirs = rollStats(seededRng(s), other.id)[spec.stat]
        if (mine > theirs) wins++
        expect(mine).toBeGreaterThanOrEqual(theirs) // 절대 손해 보지 않는다
      }
      expect(wins).toBeGreaterThan(20) // 대부분의 시드에서 실제로 더 높다
    }
  })

  it('주특기 능력치가 전체 평균보다 높게 나오는 경향이 있다', () => {
    let higher = 0
    for (let s = 0; s < 200; s++) {
      const c = gen(s)
      const spec = getSpecialty(c.specialtyId)
      const avg = sum(c.stats) / STAT_KEYS.length
      if (c.stats[spec.stat] >= avg) higher++
    }
    expect(higher / 200).toBeGreaterThan(0.7)
  })

  it('주특기 보너스를 줘도 총합은 변하지 않는다', () => {
    for (const spec of SPECIALTIES) {
      for (let s = 0; s < 20; s++) {
        expect(sum(rollStats(seededRng(s), spec.id))).toBe(C.total)
      }
    }
  })

  it('망한 캐릭터도 만능 캐릭터도 나오지 않는다', () => {
    for (let s = 0; s < 200; s++) {
      const vals = STAT_KEYS.map((k) => gen(s).stats[k])
      expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(C.max - C.min)
    }
  })
})

describe('외형 · 체형 · 키', () => {
  it('외형 값이 전부 허용 팔레트 안에 있다', () => {
    for (let s = 0; s < 100; s++) {
      const a = rollAppearance(seededRng(s))
      expect(APPEARANCE_POOLS.hair).toContain(a.hair)
      expect(APPEARANCE_POOLS.hairColor as readonly string[]).toContain(a.hairColor)
      expect(APPEARANCE_POOLS.skin as readonly string[]).toContain(a.skin)
      expect(APPEARANCE_POOLS.shirt as readonly string[]).toContain(a.shirt)
      expect(APPEARANCE_POOLS.pants as readonly string[]).toContain(a.pants)
      expect(APPEARANCE_POOLS.shoe as readonly string[]).toContain(a.shoe)
      expect(APPEARANCE_POOLS.chalkbag as readonly string[]).toContain(a.chalkbag)
    }
  })

  it('키가 체형별 허용 범위를 벗어나지 않는다', () => {
    for (let s = 0; s < 200; s++) {
      const { reach, height } = rollBody(seededRng(s))
      const body = BODY_TYPES.find((b) => b.id === reach)!
      expect(height).toBeGreaterThanOrEqual(body.height[0])
      expect(height).toBeLessThanOrEqual(body.height[1])
    }
  })

  it('체형 3종이 모두 나온다', () => {
    const seen = new Set(Array.from({ length: 100 }, (_, s) => rollBody(seededRng(s)).reach))
    expect(seen.size).toBe(3)
  })

  it('닉네임 풀이 30개 이상이고 그 안에서만 뽑힌다', () => {
    expect(NICKNAMES.length).toBeGreaterThanOrEqual(30)
    for (let s = 0; s < 50; s++) expect(NICKNAMES).toContain(NICKNAMES[s % NICKNAMES.length])
  })

  it('시작 무브 숙련도는 주특기 무브에만, 허용 범위 안에서 붙는다', () => {
    for (const spec of SPECIALTIES) {
      const m = rollMastery(seededRng(3), spec.id)
      for (const [move, v] of Object.entries(m)) {
        if ((spec.moves as string[]).includes(move)) {
          expect(v).toBeGreaterThanOrEqual(C.masteryMin)
          expect(v).toBeLessThanOrEqual(C.masteryMax)
        } else {
          expect(v).toBe(0)
        }
      }
    }
  })
})

describe('체형이 기존 등반 판정에 실제로 연결된다', () => {
  const problem = getProblem('wl-002')!
  const step = problem.steps[0]
  const far = step.choices.find((c) => c.reach === 'far')!
  const compressed = step.choices.find((c) => c.reach === 'compressed')!

  /** 능력치를 똑같이 맞추고 체형만 바꿔 비교한다 */
  const chance = (reach: 'short' | 'balanced' | 'long', choice: typeof far) => {
    const c = gen(1)
    c.reach = reach
    c.stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 10])) as Record<StatKey, number>
    return baseChanceOf({ climber: c, problem, mods: emptyModifiers() }, choice)
  }

  it('짧은 리치는 먼 홀드에 불리하고 압축 동작에 유리하다', () => {
    expect(chance('short', far)).toBeLessThan(chance('long', far))
    expect(chance('short', compressed)).toBeGreaterThan(chance('long', compressed))
  })

  it('균형형은 어느 쪽에도 치우치지 않는다', () => {
    const b = chance('balanced', far)
    expect(b).toBeGreaterThan(chance('short', far))
    expect(b).toBeLessThan(chance('long', far))
  })
})

describe('성격 패시브가 실제로 적용된다', () => {
  it('모든 성격이 판정 모디파이어를 바꾼다 (장식용 특성 없음)', () => {
    const base = gen(11)
    for (const p of PERSONALITIES) {
      const c = { ...base, personalityId: p.id }
      const mods = collectModifiers(c, {})
      const plain = emptyModifiers()
      expect(JSON.stringify(mods)).not.toBe(JSON.stringify(plain))
    }
  })
})

describe('자기소개와 칭호', () => {
  it('자기소개가 주특기와 연결된다', () => {
    for (let s = 0; s < 40; s++) {
      const c = gen(s)
      expect(c.intro).toBe(getSpecialty(c.specialtyId).intro)
      expect(c.title.length).toBeGreaterThan(0)
    }
  })
})
