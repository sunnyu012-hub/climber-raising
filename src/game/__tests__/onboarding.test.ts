import { describe, expect, it } from 'vitest'
import { createDraft, createNewGame, clampAge, draftBlocker, AGE, SAVE_VERSION } from '../newGame'
import { generateCharacter } from '../characterGen'
import { migrate } from '../../store/migrate'
import { GYMS, SELECTABLE_GYMS, STARTING_GYM_ID, migrateGymId } from '../../content/gyms'
import { problemsOfGym } from '../../content/problems'
import { isValidNickname } from '../../content/nicknames'
import type { GameState, OnboardingDraft } from '../types'

const fullDraft = (): OnboardingDraft => ({
  ...createDraft(42, '부산다람쥐'),
  gender: 'female',
  age: 28,
  gymId: 'waverock-namcheon',
})

describe('온보딩 게이트 — 필수 값이 없으면 완료할 수 없다', () => {
  it('완전히 채워지면 통과한다', () => {
    expect(draftBlocker(fullDraft())).toBeNull()
  })

  it('닉네임이 비었거나 공백이면 막힌다', () => {
    expect(draftBlocker({ ...fullDraft(), nickname: '' })).not.toBeNull()
    expect(draftBlocker({ ...fullDraft(), nickname: '   ' })).not.toBeNull()
    expect(draftBlocker({ ...fullDraft(), nickname: '가' })).not.toBeNull()
    expect(draftBlocker({ ...fullDraft(), nickname: '가나다라마바사아자차카' })).not.toBeNull()
  })

  it('성별을 안 골랐으면 막힌다', () => {
    expect(draftBlocker({ ...fullDraft(), gender: 'unset' })).not.toBeNull()
  })

  it('시작 암장을 안 골랐으면 막힌다', () => {
    expect(draftBlocker({ ...fullDraft(), gymId: null })).not.toBeNull()
  })

  it('닉네임 검증 규칙이 UI와 같다', () => {
    expect(isValidNickname('쪼꼬홀드')).toBe(true)
    expect(isValidNickname(' 가 ')).toBe(false)
    expect(isValidNickname('열글자를넘기는아주긴이름')).toBe(false)
  })
})

describe('나이 입력 검증', () => {
  it('범위 밖 값을 잘라낸다', () => {
    expect(clampAge(5)).toBe(AGE.min)
    expect(clampAge(200)).toBe(AGE.max)
    expect(clampAge(28)).toBe(28)
  })

  it('숫자가 아닌 값은 기본값으로 떨어진다', () => {
    expect(clampAge(Number('abc'))).toBe(AGE.default)
  })

  it('기본값이 28세다', () => {
    expect(createDraft(1, '테스트').age).toBe(28)
  })
})

describe('신규 게임 생성', () => {
  it('온보딩으로 만든 게임은 완료 표시가 붙는다', () => {
    const c = generateCharacter({ seed: 7, nickname: '부산다람쥐', gender: 'female', age: 28 })
    const g = createNewGame(c, 'waverock-pnu')
    expect(g.onboardingCompleted).toBe(true)
    expect(g.gymId).toBe('waverock-pnu')
    expect(g.climber.name).toBe('부산다람쥐')
  })

  it('캐릭터 없이 만든 기본 상태는 온보딩 미완료다 (생성 화면이 뜬다)', () => {
    expect(createNewGame().onboardingCompleted).toBe(false)
  })
})

describe('웨이브락 3지점', () => {
  it('세 지점이 존재하고 id가 고정돼 있다', () => {
    expect(SELECTABLE_GYMS.map((g) => g.id)).toEqual([
      'waverock-seomyeon', 'waverock-namcheon', 'waverock-pnu',
    ])
  })

  it('웨이브락 세 지점은 어디를 골라도 같은 문제 5개를 즐길 수 있다', () => {
    const counts = SELECTABLE_GYMS.map((g) => problemsOfGym(g.id).map((p) => p.id).join(','))
    expect(new Set(counts).size).toBe(1)
    expect(problemsOfGym(SELECTABLE_GYMS[0].id)).toHaveLength(5)
  })

  it('웨이브락 지점 간 능력치·보상 보너스가 없다', () => {
    for (const g of SELECTABLE_GYMS) expect(g.homeBonus).toHaveLength(0)
  })

  it('지점마다 시각 테마가 다르다', () => {
    expect(new Set(SELECTABLE_GYMS.map((g) => g.theme.sign)).size).toBe(SELECTABLE_GYMS.length)
  })

  it('원정 암장은 홈짐 후보에 들어가지 않는다', () => {
    expect(SELECTABLE_GYMS.some((g) => g.id === 'busan-cliffside')).toBe(false)
    expect(GYMS.some((g) => g.id === 'busan-cliffside')).toBe(true)
  })
})

// ---------------------------------------------------------------- 마이그레이션
/** v1 세이브를 흉내 낸다 (성별·나이·외형·온보딩 필드 없음, 옛 암장 id) */
function legacyV1Save() {
  const g = createNewGame(generateCharacter({ seed: 1, nickname: '옛유저', gender: 'female', age: 30 }))
  // v1 세이브는 구조가 다르므로 느슨한 형태로 다룬다
  const s = JSON.parse(JSON.stringify(g)) as Record<string, any>
  s.version = 1
  s.gymId = 'busan-wavelock'
  s.climber.level = 12
  s.climber.money = 987654
  s.climber.stats = { power: 18, technique: 17, flexibility: 15, stamina: 14, routefinding: 13, mental: 12, social: 11, luck: 10 }
  s.climber.skills = ['precise-feet', 'lockoff']
  s.climber.skillPoints = 3
  s.records = { 'wl-001': { attempts: 5, cleared: true, onsight: true, bestGradeCleared: 0 } }
  s.achievements = ['ach-slab', 'ach-reach']
  s.schedule = { week: 9, dayIndex: 4, days: ['train-boulder', 'rest-full', 'job-wash', 'train-power', 'rest-full', 'job-strip', 'social-crew'] }
  s.npc = { owner: 44, setter: 21, veteran: 33 }
  // v1에는 없던 필드 제거
  delete s.onboardingCompleted
  delete s.climber.gender
  delete s.climber.age
  delete s.climber.height
  delete s.climber.appearance
  delete s.climber.specialtyId
  delete s.climber.personalityId
  delete s.climber.seed
  delete s.climber.intro
  delete s.climber.title
  // v1 시절의 look 필드
  s.climber.look = { hair: 'long', hairColor: '#4a3b32', skin: '#f0c9a4', shirt: '#8faa86', pants: '#2f3a4a' }
  return { version: 1, state: s as unknown as GameState }
}

describe('기존 세이브 마이그레이션', () => {
  const out = migrate(legacyV1Save())!

  it('진행 데이터를 하나도 잃지 않는다', () => {
    expect(out.climber.level).toBe(12)
    expect(out.climber.money).toBe(987654)
    expect(out.climber.stats.power).toBe(18)
    expect(out.climber.skills).toEqual(['precise-feet', 'lockoff'])
    expect(out.climber.skillPoints).toBe(3)
    expect(out.records['wl-001'].cleared).toBe(true)
    expect(out.achievements).toEqual(['ach-slab', 'ach-reach'])
    expect(out.schedule.week).toBe(9)
    expect(out.schedule.dayIndex).toBe(4)
    expect(out.npc.owner).toBe(44)
  })

  it('기존 사용자에게 온보딩을 다시 강제하지 않는다', () => {
    expect(out.onboardingCompleted).toBe(true)
  })

  it('성별과 나이를 임의로 확정하지 않는다', () => {
    expect(out.climber.gender).toBe('unset')
    expect(out.climber.age).toBeNull()
  })

  it('옛 암장 id가 서면점으로 안전하게 옮겨진다', () => {
    expect(out.gymId).toBe('waverock-seomyeon')
    expect(out.gymId).toBe(STARTING_GYM_ID)
  })

  it('v1의 look이 appearance로 옮겨지고 빠진 색은 기본값으로 채워진다', () => {
    expect(out.climber.appearance.hair).toBe('long')
    expect(out.climber.appearance.shirt).toBe('#8faa86')
    expect(out.climber.appearance.shoe).toBeTruthy()
    expect(out.climber.appearance.chalkbag).toBeTruthy()
    expect((out.climber as unknown as Record<string, unknown>).look).toBeUndefined()
  })

  it('신규 필드가 없어도 오류 없이 채워진다', () => {
    expect(out.climber.height).toBeGreaterThan(100)
    expect(out.climber.specialtyId).toBeTruthy()
    expect(out.climber.personalityId).toBeTruthy()
    expect(out.version).toBe(SAVE_VERSION)
  })

  it('직렬화 → 복원을 반복해도 값이 유지된다', () => {
    const again = migrate({ version: SAVE_VERSION, state: JSON.parse(JSON.stringify(out)) })!
    expect(again.climber.level).toBe(12)
    expect(again.climber.appearance).toEqual(out.climber.appearance)
    expect(again.gymId).toBe(out.gymId)
  })

  it('알 수 없는 암장 id는 서면점으로 떨어진다', () => {
    expect(migrateGymId('없는암장')).toBe(STARTING_GYM_ID)
    expect(migrateGymId(undefined)).toBe(STARTING_GYM_ID)
    expect(migrateGymId('waverock-pnu')).toBe('waverock-pnu')
  })

  it('망가진 세이브는 null (새 게임 → 온보딩)', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate({ version: 1, state: {} as GameState })).toBeNull()
  })
})
