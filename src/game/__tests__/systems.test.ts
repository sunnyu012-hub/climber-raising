import { describe, expect, it } from 'vitest'
import { createNewGame } from '../newGame'
import { generateCharacter } from '../characterGen'
import { emit } from '../events'
import { unlockBlocker } from '../unlock'
import { travelBlocker, travelTo, unlockRegions } from '../world'
import { addItem, equipItem, syncSlots, unequipSlot } from '../equipment'
import { buyItem, sellItem, shopList } from '../shop'
import { claimQuest, syncQuests } from '../quests'
import { runCompetition } from '../competition'
import { noteStep, understandingOf } from '../projects'
import { stateModifiers } from '../character'
import { baseChanceOf } from '../climb'
import { myRankings } from '../ranking'
import { seededRng } from '../rng'
import { validateContent } from '../../content/validate'
import { getProblem } from '../../content/problems'
import { getItem } from '../../content/equipment'
import { migrate } from '../../store/migrate'
import type { GameState } from '../types'

const fresh = (): GameState => {
  const s = createNewGame(
    generateCharacter({ seed: 3, nickname: '테스터', gender: 'female', age: 28 }),
    'waverock-seomyeon',
  )
  emit(s, { t: 'gym.visit', gymId: s.gymId })
  syncQuests(s)
  return s
}

// ---------------------------------------------------------------- 콘텐츠
describe('콘텐츠 무결성', () => {
  const report = validateContent()

  it('끊어진 참조나 중복 ID가 없다', () => {
    expect(report.errors).toEqual([])
  })

  it('콘텐츠 개수를 셀 수 있다', () => {
    expect(report.counts.문제).toBeGreaterThan(0)
    expect(report.counts.퀘스트).toBeGreaterThan(0)
    expect(report.counts.장비).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------- 해금
describe('해금 조건', () => {
  it('조건을 못 채우면 이유를 알려준다', () => {
    const s = fresh()
    expect(unlockBlocker(s, { level: 99 })).toContain('레벨')
    expect(unlockBlocker(s, { money: 9_999_999 })).toContain('원')
    expect(unlockBlocker(s, { clears: 50 })).toContain('완등')
    expect(unlockBlocker(s, { fame: 500 })).toContain('명성')
  })

  it('조건이 없거나 채워졌으면 통과한다', () => {
    const s = fresh()
    expect(unlockBlocker(s, undefined)).toBeNull()
    expect(unlockBlocker(s, { level: 1 })).toBeNull()
  })

  it('준비 중인 콘텐츠는 조건을 채워도 열리지 않는다', () => {
    const s = fresh()
    s.climber.level = 99
    s.world.fame = 99999
    expect(unlockBlocker(s, { level: 1, comingSoon: true })).toContain('준비 중')
  })

  it('준비 중인 지역은 해금 목록에 들어가지 않는다', () => {
    const s = fresh()
    s.climber.level = 99
    s.world.fame = 99999
    unlockRegions(s)
    expect(s.world.unlockedRegions).toEqual(['busan'])
  })
})

// ---------------------------------------------------------------- 이동 · 원정
describe('암장 이동과 원정', () => {
  it('교통비가 모자라면 못 간다', () => {
    const s = fresh()
    s.climber.money = 0
    expect(travelBlocker(s, 'waverock-namcheon')).toContain('모자라')
  })

  it('이동하면 돈이 줄고 방문 기록이 남는다', () => {
    const s = fresh()
    const before = s.climber.money
    expect(travelTo(s, 'waverock-namcheon')).toBeNull()
    expect(s.climber.money).toBeLessThan(before)
    expect(s.gymId).toBe('waverock-namcheon')
    expect(s.world.visitedGyms).toContain('waverock-namcheon')
    expect(s.stats.gymVisits['waverock-namcheon']).toBe(1)
  })

  it('세 지점을 다 돌아야 원정 암장이 열린다', () => {
    const s = fresh()
    s.climber.money = 999999
    expect(travelBlocker(s, 'busan-cliffside')).not.toBeNull()

    travelTo(s, 'waverock-namcheon')
    travelTo(s, 'waverock-pnu')
    s.climber.level = 3
    expect(travelBlocker(s, 'busan-cliffside')).toBeNull()
  })

  it('원정을 다녀오면 배지·명성·업적이 남는다', () => {
    const s = fresh()
    s.climber.money = 999999
    s.climber.level = 3
    travelTo(s, 'waverock-namcheon')
    travelTo(s, 'waverock-pnu')
    travelTo(s, 'busan-cliffside')

    expect(s.world.expeditions).toContain('busan-cliffside')
    expect(s.world.badges.length).toBeGreaterThan(0)
    expect(s.world.fame).toBeGreaterThan(0)
    expect(s.stats.expeditions).toBe(1)
    expect(s.achievements).toContain('ach-first-expedition')
  })

  it('이미 있는 곳으로는 못 간다', () => {
    const s = fresh()
    expect(travelBlocker(s, s.gymId)).toContain('이미')
  })
})

// ---------------------------------------------------------------- 장비 · 상점
describe('장비와 상점', () => {
  it('돈이 모자라면 못 산다', () => {
    const s = fresh()
    s.climber.money = 0
    expect(buyItem(s, 'shoes-beginner')).toContain('모자라')
    expect(s.inventory.items).toHaveLength(0)
  })

  it('사면 돈이 줄고 가방에 들어간다', () => {
    const s = fresh()
    s.climber.money = 500000
    const price = getItem('shoes-beginner')!.price
    expect(buyItem(s, 'shoes-beginner')).toBeNull()
    expect(s.climber.money).toBe(500000 - price)
    expect(s.inventory.items.some((i) => i.itemId === 'shoes-beginner')).toBe(true)
    expect(s.stats.spent).toBe(price)
    expect(s.collection.equipment).toContain('shoes-beginner')
  })

  it('같은 고유 장비를 두 번 살 수 없다', () => {
    const s = fresh()
    s.climber.money = 500000
    buyItem(s, 'shoes-beginner')
    expect(buyItem(s, 'shoes-beginner')).not.toBeNull()
  })

  it('레벨이 낮으면 상점 상품이 잠겨 있다', () => {
    const s = fresh()
    const row = shopList(s).find((r) => r.entry.itemId === 'shoes-technical')!
    expect(row.blocked).not.toBeNull()
  })

  it('장착하면 등반 판정이 실제로 좋아진다', () => {
    const s = fresh()
    const problem = getProblem('wl-001')!
    const choice = problem.steps[0].choices[0] // 발 바꾸기

    const before = baseChanceOf({ climber: s.climber, problem, mods: stateModifiers(s) }, choice)
    addItem(s, 'shoes-technical')
    expect(equipItem(s, 'shoes-technical')).toBeNull()
    const after = baseChanceOf({ climber: s.climber, problem, mods: stateModifiers(s) }, choice)

    expect(after).toBeGreaterThan(before)
  })

  it('벗으면 효과가 사라진다', () => {
    const s = fresh()
    const problem = getProblem('wl-001')!
    const choice = problem.steps[0].choices[0]
    addItem(s, 'shoes-technical')
    equipItem(s, 'shoes-technical')
    const worn = baseChanceOf({ climber: s.climber, problem, mods: stateModifiers(s) }, choice)
    unequipSlot(s, 'shoes')
    const bare = baseChanceOf({ climber: s.climber, problem, mods: stateModifiers(s) }, choice)
    expect(bare).toBeLessThan(worn)
  })

  it('잠긴 슬롯에는 장착할 수 없다', () => {
    const s = fresh()
    addItem(s, 'accessory-brush')
    expect(equipItem(s, 'accessory-brush')).not.toBeNull()
  })

  it('레벨이 오르면 슬롯이 열린다', () => {
    const s = fresh()
    s.climber.level = 20
    syncSlots(s)
    expect(s.inventory.unlockedSlots).toContain('accessory')
  })

  it('팔면 돈이 들어오고 가방에서 빠진다', () => {
    const s = fresh()
    s.climber.money = 500000
    buyItem(s, 'shoes-beginner')
    const before = s.climber.money
    expect(sellItem(s, 'shoes-beginner')).toBeNull()
    expect(s.climber.money).toBeGreaterThan(before)
    expect(s.inventory.items.some((i) => i.itemId === 'shoes-beginner')).toBe(false)
  })
})

// ---------------------------------------------------------------- 퀘스트
describe('퀘스트 자동 판정', () => {
  it('튜토리얼 퀘스트가 처음부터 열려 있다', () => {
    const s = fresh()
    expect(s.quests.active.some((q) => q.questId === 'tut-first-climb')).toBe(true)
  })

  it('이벤트만으로 목표가 진행된다 (수동 제출 없음)', () => {
    const s = fresh()
    emit(s, { t: 'climb.attempt', problemId: 'wl-001', gymId: s.gymId, grade: 0 })
    const p = s.quests.active.find((q) => q.questId === 'tut-first-climb')!
    expect(p.counts[0]).toBe(1)
    expect(p.completed).toBe(true)
  })

  it('완료 전에는 보상을 받을 수 없다', () => {
    const s = fresh()
    expect(claimQuest(s, 'tut-first-climb')).toContain('아직')
  })

  it('보상은 한 번만 받을 수 있다', () => {
    const s = fresh()
    emit(s, { t: 'climb.attempt', problemId: 'wl-001', gymId: s.gymId, grade: 0 })
    const money = s.climber.money
    expect(claimQuest(s, 'tut-first-climb')).toBeNull()
    expect(s.climber.money).toBeGreaterThan(money)

    const after = s.climber.money
    expect(claimQuest(s, 'tut-first-climb')).not.toBeNull() // 두 번째는 거부
    expect(s.climber.money).toBe(after)
    expect(s.quests.done).toContain('tut-first-climb')
  })

  it('체인 퀘스트는 앞 퀘스트를 끝내야 열린다', () => {
    const s = fresh()
    expect(s.quests.active.some((q) => q.questId === 'tut-first-clear')).toBe(false)
    emit(s, { t: 'climb.attempt', problemId: 'wl-001', gymId: s.gymId, grade: 0 })
    claimQuest(s, 'tut-first-climb')
    expect(s.quests.active.some((q) => q.questId === 'tut-first-clear')).toBe(true)
  })

  it('조건을 만족하는 조건부 퀘스트만 열린다', () => {
    const s = fresh()
    expect(s.quests.active.some((q) => q.questId === 'npc-setter-favor')).toBe(false)
    s.npc.setter = 20
    syncQuests(s)
    expect(s.quests.active.some((q) => q.questId === 'npc-setter-favor')).toBe(true)
  })

  it('일일 퀘스트는 2개만 뽑힌다', () => {
    const s = fresh()
    expect(s.quests.dailyPicked).toHaveLength(2)
  })

  it('sumField 목표는 횟수가 아니라 값을 누적한다', () => {
    const s = fresh()
    emit(s, { t: 'money.earn', amount: 40000, source: 'test' })
    const p = s.quests.active.find((q) => q.questId === 'weekly-money')!
    expect(p.counts[0]).toBe(40000)
  })
})

// ---------------------------------------------------------------- 프로젝트 문제
describe('프로젝트 문제', () => {
  it('실패해도 이해도가 남는다', () => {
    const s = fresh()
    expect(understandingOf(s, 'wl-005')).toBe(0)
    noteStep(s, 'wl-005', 0, 'a', false)
    expect(understandingOf(s, 'wl-005')).toBeGreaterThan(0)
  })

  it('성공하면 베타가 기록되고 이해도가 더 오른다', () => {
    const s = fresh()
    noteStep(s, 'wl-005', 0, 'a', false)
    const afterFail = understandingOf(s, 'wl-005')
    noteStep(s, 'wl-005', 0, 'a', true)
    expect(understandingOf(s, 'wl-005')).toBeGreaterThan(afterFail)
    expect(s.projects['wl-005'].knownBetas.length).toBeGreaterThan(0)
  })

  it('프로젝트가 아닌 문제는 진척을 남기지 않는다', () => {
    const s = fresh()
    noteStep(s, 'wl-001', 0, 'a', false)
    expect(s.projects['wl-001']).toBeUndefined()
  })

  it('이해도는 100을 넘지 않는다', () => {
    const s = fresh()
    for (let i = 0; i < 50; i++) noteStep(s, 'wl-005', i % 4, `c${i}`, true)
    expect(understandingOf(s, 'wl-005')).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------- 대회
describe('미니대회', () => {
  it('조건을 못 채우면 참가할 수 없다', () => {
    const s = fresh()
    const r = runCompetition(s, 'comp-waverock-mini', seededRng(1))
    expect(typeof r).toBe('string')
  })

  it('참가비를 내고 결과와 보상을 받는다', () => {
    const s = fresh()
    s.climber.level = 10
    s.stats.clears = 5
    s.climber.money = 200000
    const r = runCompetition(s, 'comp-waverock-mini', seededRng(7))
    expect(typeof r).not.toBe('string')
    if (typeof r === 'string') return

    expect(r.total).toBe(3)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.tier.length).toBeGreaterThan(0)
    expect(s.stats.competitions).toBe(1)
    expect(s.competitionRecords).toHaveLength(1)
    expect(s.achievements).toContain('ach-competition')
  })

  it('같은 시드는 같은 대회 결과를 만든다', () => {
    const setup = () => {
      const s = fresh()
      s.climber.level = 10
      s.stats.clears = 5
      s.climber.money = 200000
      return s
    }
    const a = runCompetition(setup(), 'comp-waverock-mini', seededRng(42))
    const b = runCompetition(setup(), 'comp-waverock-mini', seededRng(42))
    expect(a).toEqual(b)
  })
})

// ---------------------------------------------------------------- 기록 · 도감 · 랭킹
describe('기록과 도감', () => {
  it('이벤트가 통계에 누적된다', () => {
    const s = fresh()
    emit(s, { t: 'climb.clear', problemId: 'wl-001', gymId: s.gymId, grade: 2, onsight: true, flash: true })
    expect(s.stats.clears).toBe(1)
    expect(s.stats.onsights).toBe(1)
    expect(s.stats.flashes).toBe(1)
    expect(s.stats.bestGrade).toBe(2)
  })

  it('도감은 실제로 만난 것만 기록한다', () => {
    const s = fresh()
    expect(s.collection.problem).toHaveLength(0)
    emit(s, { t: 'climb.attempt', problemId: 'wl-003', gymId: s.gymId, grade: 2 })
    expect(s.collection.problem).toEqual(['wl-003'])
  })

  it('같은 것을 두 번 만나도 도감에 한 번만 들어간다', () => {
    const s = fresh()
    emit(s, { t: 'climb.attempt', problemId: 'wl-003', gymId: s.gymId, grade: 2 })
    emit(s, { t: 'climb.attempt', problemId: 'wl-003', gymId: s.gymId, grade: 2 })
    expect(s.collection.problem).toHaveLength(1)
  })

  it('랭킹은 내 점수만 계산하고 순위는 비워둔다', () => {
    const s = fresh()
    const rows = myRankings(s)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(Number.isFinite(r.score)).toBe(true)
      expect(r.rank).toBeNull() // 순위는 서버 몫
    }
  })
})

// ---------------------------------------------------------------- 칭호
describe('칭호', () => {
  it('업적을 달성하면 칭호가 붙는다', () => {
    const s = fresh()
    emit(s, { t: 'climb.clear', problemId: 'wl-001', gymId: s.gymId, grade: 0, onsight: false, flash: false })
    expect(s.achievements).toContain('ach-first-clear')
    expect(s.titles).toContain('title-first-top')
  })

  it('장착한 칭호 효과가 판정에 들어간다', () => {
    const s = fresh()
    s.climber.reach = 'short'
    s.titles.push('title-short-reach')
    const problem = getProblem('wl-002')!
    const far = problem.steps[0].choices.find((c) => c.reach === 'far')!

    s.equippedTitle = null
    const off = baseChanceOf({ climber: s.climber, problem, mods: stateModifiers(s) }, far)
    s.equippedTitle = 'title-short-reach'
    const on = baseChanceOf({ climber: s.climber, problem, mods: stateModifiers(s) }, far)

    expect(on).toBeGreaterThan(off)
  })
})

// ---------------------------------------------------------------- 마이그레이션
describe('v3 → v4 마이그레이션', () => {
  it('신규 필드가 없어도 기본값으로 살아난다', () => {
    const s = fresh()
    s.climber.level = 11
    s.climber.money = 333000
    const raw = JSON.parse(JSON.stringify(s)) as Record<string, unknown>
    raw.version = 3
    for (const k of ['stats', 'collection', 'quests', 'world', 'inventory', 'career',
      'projects', 'competitionRecords', 'crew', 'seasonId', 'shopBought',
      'titles', 'equippedTitle', 'achievementProgress', 'homeGymId']) delete raw[k]

    const out = migrate({ version: 3, state: raw as unknown as GameState })!
    expect(out.climber.level).toBe(11)
    expect(out.climber.money).toBe(333000)
    expect(out.stats.clears).toBe(0)
    expect(out.world.visitedGyms.length).toBeGreaterThan(0)
    expect(out.inventory.unlockedSlots.length).toBeGreaterThan(0)
    expect(out.homeGymId).toBeTruthy()
  })

  it('여러 번 돌려도 결과가 같다 (멱등)', () => {
    const s = fresh()
    s.stats.clears = 4
    s.world.badges.push('badge-x')
    const once = migrate({ version: 4, state: JSON.parse(JSON.stringify(s)) })!
    const twice = migrate({ version: 4, state: JSON.parse(JSON.stringify(once)) })!
    expect(twice.stats.clears).toBe(4)
    expect(twice.world.badges).toEqual(['badge-x'])
    expect(twice).toEqual(once)
  })
})
