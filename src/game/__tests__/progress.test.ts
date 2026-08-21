import { describe, expect, it } from 'vitest'
import { BALANCE } from '../balance'
import { buildWarnings, isInjured, jointStage } from '../character'
import { createNewGame } from '../newGame'
import { seededRng } from '../rng'
import {
  advanceSchedule, clearReward, dayLengthMs, directPlayMultiplier, failReward,
  remainingMsOfDay, restDaysInWeek, speedupMs,
} from '../progress'
import { migrate } from '../../store/migrate'
import { getProblem } from '../../content/problems'
import type { GameState } from '../types'

const DAY = BALANCE.time.dayMs
const rng = () => seededRng(99)

/** 특정 활동으로 일주일을 채운 상태를 만든다. */
function stateWith(activityId: string, patch: Partial<GameState> = {}): GameState {
  const s = createNewGame()
  s.schedule.days = Array(7).fill(activityId)
  s.clock.lastTickAt = 0
  return { ...s, ...patch }
}

describe('일정 자동 진행', () => {
  it('하루가 지나면 하루치가 소화된다', () => {
    const s = stateWith('train-boulder')
    const { state, report } = advanceSchedule(s, DAY, rng())
    expect(report?.daysRun).toBe(1)
    expect(state.schedule.dayIndex).toBe(1)
  })

  it('하루가 안 지났으면 아무 일도 없다', () => {
    const s = stateWith('train-boulder')
    const { state, report } = advanceSchedule(s, DAY * 0.5, rng())
    expect(report).toBeNull()
    expect(state.schedule.dayIndex).toBe(0)
  })

  it('일요일이 끝나면 다음 주로 넘어간다', () => {
    const s = stateWith('rest-full')
    const { state } = advanceSchedule(s, DAY * 7, rng())
    expect(state.schedule.week).toBe(2)
    expect(state.schedule.dayIndex).toBe(0)
  })

  it('오프라인 진행은 상한을 넘지 않는다', () => {
    const s = stateWith('rest-full')
    const cap = BALANCE.time.offlineCapHours * 3600_000
    const maxDays = Math.floor(cap / DAY)
    const { state, report } = advanceSchedule(s, cap * 5, rng()) // 상한의 5배 방치
    expect(report!.daysRun).toBeLessThanOrEqual(maxDays)
    expect(report!.cappedMs).toBeGreaterThan(0)
    expect(state.clock.lastTickAt).toBeGreaterThan(0)
  })

  it('배속이 높아도 한 번에 도는 일수에 상한이 있다', () => {
    const s = stateWith('rest-full')
    s.settings.devTimeScale = 60 // 하루가 아주 짧아진다
    const { report } = advanceSchedule(s, BALANCE.time.offlineCapHours * 3600_000, rng())
    expect(report!.daysRun).toBe(BALANCE.time.offlineCapDays)
    expect(report!.cappedMs).toBeGreaterThan(0)
  })

  it('남은 시간은 하루 길이를 넘지 않는다', () => {
    const s = stateWith('rest-full')
    expect(remainingMsOfDay(s, DAY * 0.25)).toBeCloseTo(DAY * 0.75, 0)
    expect(remainingMsOfDay(s, DAY * 3.5)).toBeCloseTo(DAY * 0.5, 0)
  })
})

describe('휴식과 과훈련은 다른 결과를 만든다', () => {
  it('휴식 일정은 체력과 관절을 회복시킨다', () => {
    const s = stateWith('rest-full')
    s.climber.condition = { hp: 30, fatigue: 70, mood: 50, joints: { finger: 60, shoulder: 60, knee: 60 } }
    const { state } = advanceSchedule(s, DAY, rng())
    const c = state.climber.condition
    expect(c.hp).toBeGreaterThan(30)
    expect(c.fatigue).toBeLessThan(70)
    expect(c.joints.finger).toBeGreaterThan(60)
  })

  it('훈련만 일주일 하면 피로가 쌓이고 관절이 나빠진다', () => {
    const s = stateWith('train-power')
    const { state } = advanceSchedule(s, DAY * 7, rng())
    const c = state.climber.condition
    expect(c.fatigue).toBeGreaterThan(30)
    expect(c.joints.finger).toBeLessThan(100)
  })

  it('과훈련이면 경고가 뜬다', () => {
    const s = stateWith('train-power')
    const { state } = advanceSchedule(s, DAY * 7, rng())
    const warns = buildWarnings(state.climber, restDaysInWeek(state))
    expect(warns.some((w) => w.text.includes('과훈련') || w.level === 'danger')).toBe(true)
    expect(warns.some((w) => w.text.includes('휴식이 하루도 없어요'))).toBe(true)
  })

  it('멀쩡한 캐릭터 + 휴식 있는 일정이면 위험 경고가 없다', () => {
    const s = createNewGame()
    expect(restDaysInWeek(s)).toBeGreaterThan(0)
    expect(buildWarnings(s.climber, restDaysInWeek(s)).filter((w) => w.level === 'danger')).toHaveLength(0)
  })
})

describe('부상', () => {
  it('관절 단계가 값에 맞게 나뉜다', () => {
    expect(jointStage(100)).toBe('healthy')
    expect(jointStage(75)).toBe('caution')
    expect(jointStage(55)).toBe('stiff')
    expect(jointStage(35)).toBe('pain')
    expect(jointStage(10)).toBe('injured')
  })

  it('부상 중에는 격한 활동이 자동으로 휴식으로 대체된다', () => {
    const s = stateWith('train-power')
    s.climber.condition.joints.finger = 10
    expect(isInjured(s.climber.condition)).toBe(true)
    const { state, report } = advanceSchedule(s, DAY, rng())
    expect(report!.results[0].activityId).toBe('rest-full')
    expect(report!.results[0].lines[0]).toContain('몸이 말을 안 들었다')
    expect(state.climber.condition.joints.finger).toBeGreaterThan(10)
  })

  it('멀쩡한 몸은 첫날부터 다치지 않는다 (부상은 누적의 결과)', () => {
    const s = stateWith('train-power') // injuryRisk가 가장 높은 활동
    const always = () => 0             // 확률 판정을 전부 통과시키는 RNG
    const { state } = advanceSchedule(s, DAY, always)
    // 활동 소모(-6) + 자연 회복(+3)만 반영되고 부상 추가 하락(-12)은 없다
    expect(state.climber.condition.joints.finger).toBe(97)
  })

  it('피로가 쌓인 몸은 같은 조건에서 다친다', () => {
    const s = stateWith('train-power')
    s.climber.condition.fatigue = 60
    const always = () => 0
    const { state, report } = advanceSchedule(s, DAY, always)
    expect(state.climber.condition.joints.finger).toBeLessThan(97)
    expect(report!.results[0].lines.some((l) => l.includes('뚝'))).toBe(true)
  })

  it('부상 중에도 재활/공부는 그대로 진행된다', () => {
    const s = stateWith('rehab-finger')
    s.climber.condition.joints.finger = 10
    const { report } = advanceSchedule(s, DAY, rng())
    expect(report!.results[0].activityId).toBe('rehab-finger')
  })
})

describe('보상', () => {
  const problem = getProblem('wl-003')!

  it('완등 보상은 자동 진행보다 130~160% 유리하다', () => {
    const r = clearReward(problem, false, false)
    const ratio = r.exp / problem.reward.exp
    expect(ratio).toBeGreaterThanOrEqual(1.3)
    expect(ratio).toBeLessThanOrEqual(1.6)
  })

  it('첫 완등과 초견에는 추가 보너스가 붙는다', () => {
    const plain = clearReward(problem, false, false).exp
    const first = clearReward(problem, true, false).exp
    const onsight = clearReward(problem, true, true).exp
    expect(first).toBe(plain + problem.firstClearBonus.exp)
    expect(onsight).toBeGreaterThan(first)
  })

  it('실패 보상은 완등 보상보다 확실히 적다', () => {
    const fail = failReward(problem).exp
    expect(fail).toBeGreaterThan(0)
    expect(fail).toBeLessThan(clearReward(problem, false, false).exp * 0.5)
  })
})

describe('직접 플레이 시간 단축', () => {
  it('동작 성공은 현재 일정을 당긴다', () => {
    const s = stateWith('train-boulder')
    const gain = speedupMs(s, 'step')
    expect(gain).toBeCloseTo(DAY * BALANCE.directPlay.speedupPerStepRatio, 5)

    s.clock.bonusMs = gain
    expect(remainingMsOfDay(s, 0)).toBeLessThan(dayLengthMs(s))
  })

  it('완등 단축이 동작 단축보다 크다', () => {
    const s = stateWith('train-boulder')
    expect(speedupMs(s, 'clear')).toBeGreaterThan(speedupMs(s, 'step'))
  })

  it('충분히 당기면 실제로 하루가 앞당겨진다', () => {
    const s = stateWith('train-boulder')
    s.clock.bonusMs = DAY * 0.9
    const { report } = advanceSchedule(s, DAY * 0.2, rng())
    expect(report?.daysRun).toBe(1)
  })

  it('반복 플레이 보너스는 점점 줄지만 바닥값 아래로는 안 간다', () => {
    expect(directPlayMultiplier(0)).toBe(1)
    expect(directPlayMultiplier(3)).toBeLessThan(directPlayMultiplier(1))
    expect(directPlayMultiplier(999)).toBe(BALANCE.directPlay.diminishFloor)
  })

  it('개발자 배속을 올리면 하루가 짧아진다', () => {
    const s = stateWith('rest-full')
    s.settings.devTimeScale = 60
    expect(dayLengthMs(s)).toBe(DAY / 60)
  })
})

describe('저장과 복원', () => {
  it('직렬화 후 복원해도 진행 상태가 유지된다', () => {
    const s = stateWith('train-boulder')
    s.climber.stats.power = 21
    s.climber.money = 123456
    s.achievements.push('ach-slab')
    s.records['wl-001'] = { attempts: 3, cleared: true, onsight: false, bestGradeCleared: 0 }

    const restored = migrate(JSON.parse(JSON.stringify({ version: 1, state: s })))!
    expect(restored.climber.stats.power).toBe(21)
    expect(restored.climber.money).toBe(123456)
    expect(restored.records['wl-001'].cleared).toBe(true)
    expect(restored.achievements).toContain('ach-slab')
    expect(restored.schedule.days).toEqual(s.schedule.days)
  })

  it('구버전 세이브에 없는 필드는 기본값으로 채워진다', () => {
    const s = createNewGame() as unknown as Record<string, unknown>
    delete s.achievements
    delete s.npc
    const restored = migrate({ version: 0, state: s as unknown as GameState })!
    expect(restored.achievements).toEqual([])
    expect(restored.npc.owner).toBeDefined()
  })

  it('망가진 세이브는 null을 돌려준다 (새 게임으로 시작)', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate({ version: 1, state: {} as GameState })).toBeNull()
  })
})

describe('재현성', () => {
  it('같은 시드로 일주일을 돌리면 결과가 같다', () => {
    const a = advanceSchedule(stateWith('job-strip'), DAY * 7, seededRng(5))
    const b = advanceSchedule(stateWith('job-strip'), DAY * 7, seededRng(5))
    expect(a.state.climber.money).toBe(b.state.climber.money)
    expect(a.state.climber.condition).toEqual(b.state.climber.condition)
    expect(a.report!.results.map((r) => r.lines)).toEqual(b.report!.results.map((r) => r.lines))
  })
})
