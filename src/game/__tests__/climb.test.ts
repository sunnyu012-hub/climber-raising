import { describe, expect, it } from 'vitest'
import { BALANCE } from '../balance'
import { baseChanceOf, luckShiftOf, outcomeOf, resolveStep } from '../climb'
import { collectModifiers, emptyModifiers } from '../character'
import { createClimber } from '../newGame'
import { seededRng } from '../rng'
import { getProblem } from '../../content/problems'
import type { BetaChoice, Climber, ReachTrait, StepContext } from '../types'

const problem = getProblem('wl-002')!
const stepFar = problem.steps[0] // 먼 홀드 / 압축 / 중간 홀드 3택

const choiceById = (id: string): BetaChoice => stepFar.choices.find((c) => c.id === id)!

function ctx(climber: Climber, mods = emptyModifiers()): StepContext {
  return { climber, problem, mods }
}

describe('성공률 계산', () => {
  it('관련 능력치가 높으면 성공률이 오른다', () => {
    const weak = createClimber('약', 'balanced')
    const strong = createClimber('강', 'balanced')
    strong.stats.power += 10
    strong.stats.technique += 10
    const c = choiceById('a') // power/technique 가중
    expect(baseChanceOf(ctx(strong), c)).toBeGreaterThan(baseChanceOf(ctx(weak), c))
  })

  it('피로가 높으면 성공률이 떨어진다', () => {
    const fresh = createClimber('쌩쌩', 'balanced')
    const tired = createClimber('지침', 'balanced')
    tired.condition.fatigue = 90
    const c = choiceById('a')
    expect(baseChanceOf(ctx(tired), c)).toBeLessThan(baseChanceOf(ctx(fresh), c))
  })

  it('관절이 나쁘면 성공률이 떨어진다', () => {
    const ok = createClimber('멀쩡', 'balanced')
    const hurt = createClimber('통증', 'balanced')
    hurt.condition.joints.shoulder = 25
    const c = choiceById('a') // shoulder 소모 있음
    expect(baseChanceOf(ctx(hurt), c)).toBeLessThan(baseChanceOf(ctx(ok), c))
  })

  it('숙련도가 오르면 성공률이 오른다', () => {
    const rookie = createClimber('초보', 'balanced')
    const pro = createClimber('숙련', 'balanced')
    pro.mastery.lockoff = 100
    const c = choiceById('a')
    const diff = baseChanceOf(ctx(pro), c) - baseChanceOf(ctx(rookie), c)
    expect(diff).toBeCloseTo(BALANCE.climb.masteryWeight, 5)
  })
})

describe('스킬 효과가 실제 판정에 반영된다', () => {
  it('다이노 자신감을 배우면 다이노 성공률이 오른다', () => {
    const plain = createClimber('무스킬', 'balanced')
    const skilled = createClimber('스킬', 'balanced')
    skilled.skills = ['lockoff', 'dyno-confidence']

    const dyno = problem.steps[2].choices.find((c) => c.moves.includes('dyno'))!
    const before = baseChanceOf(ctx(plain), dyno)
    const after = baseChanceOf(ctx(skilled, collectModifiers(skilled, {})), dyno)
    expect(after).toBeGreaterThan(before + 0.09) // +10%p (락오프 힘 +1도 약간 더해짐)
  })

  it('워밍업 습관은 관절 소모를 줄인다', () => {
    const plain = createClimber('무스킬', 'balanced')
    const careful = createClimber('조심', 'balanced')
    careful.skills = ['warmup']
    const c = choiceById('a')

    const a = resolveStep(ctx(plain), c, seededRng(7))
    const b = resolveStep(ctx(careful, collectModifiers(careful, {})), c, seededRng(7))
    expect(b.cost.joints.shoulder!).toBeLessThan(a.cost.joints.shoulder!)
  })

  it('NPC 친밀도 특전도 판정에 들어간다', () => {
    const c = createClimber('인싸', 'balanced')
    const cold = collectModifiers(c, { veteran: 0 })
    const warm = collectModifiers(c, { veteran: 40 })
    expect(warm.moveChance.flagging ?? 0).toBeGreaterThan(cold.moveChance.flagging ?? 0)
  })
})

describe('리치 특성', () => {
  const far = choiceById('a')          // 먼 홀드
  const compressed = choiceById('b')   // 하이스텝(압축)
  const intermediate = choiceById('c') // 중간 홀드 경유

  const of = (trait: ReachTrait, c: BetaChoice, skills: string[] = []) => {
    const cl = createClimber('테스트', trait)
    // 리치 특성만 비교하기 위해 능력치를 동일하게 맞춘다
    cl.stats = { power: 10, technique: 10, flexibility: 10, stamina: 10, routefinding: 10, mental: 10, social: 10, luck: 10 }
    cl.skills = skills
    return baseChanceOf(ctx(cl, collectModifiers(cl, {})), c)
  }

  it('짧은 리치는 먼 홀드에 불리하다', () => {
    expect(of('short', far)).toBeLessThan(of('long', far))
  })

  it('짧은 리치는 압축 동작에 유리하다 — 불리하기만 하지 않다', () => {
    expect(of('short', compressed)).toBeGreaterThan(of('long', compressed))
  })

  it('짧은 리치는 중간 홀드를 더 잘 찾는다', () => {
    expect(of('short', intermediate)).toBeGreaterThan(of('balanced', intermediate))
  })

  it('리치 보완 베타 스킬이 먼 홀드 패널티를 크게 줄인다', () => {
    const withSkill = of('short', far, ['precise-feet', 'highstep-master', 'reach-comp'])
    const without = of('short', far, ['precise-feet', 'highstep-master'])
    expect(withSkill).toBeGreaterThan(without)
  })
})

describe('행운은 결과를 지배하지 못한다', () => {
  it('luckShift는 항상 luckRange × luckMult 안에 있다', () => {
    const lucky = createClimber('행운아', 'balanced')
    lucky.stats.luck = 99
    const mods = emptyModifiers()
    for (const choice of [choiceById('a'), choiceById('c'), problem.steps[2].choices[2]]) {
      const span = BALANCE.climb.luckRange * choice.luckMult
      const rng = seededRng(1234)
      for (let i = 0; i < 2000; i++) {
        const shift = luckShiftOf(ctx(lucky, mods), choice, rng())
        expect(Math.abs(shift)).toBeLessThanOrEqual(span + 1e-9)
      }
    }
  })

  it('행운 99여도 능력치 20 차이를 뒤집지 못한다', () => {
    const luckyWeak = createClimber('운빨', 'balanced')
    luckyWeak.stats.luck = 99
    const skilled = createClimber('실력', 'balanced')
    skilled.stats.power += 12
    skilled.stats.technique += 12

    const c = choiceById('a')
    const span = BALANCE.climb.luckRange * c.luckMult
    const bestLucky = baseChanceOf(ctx(luckyWeak), c) + span
    expect(bestLucky).toBeLessThan(baseChanceOf(ctx(skilled), c))
  })
})

describe('결과 4단계', () => {
  it('roll 위치에 따라 대성공/성공/부분실패/추락으로 갈린다', () => {
    const p = 0.6
    expect(outcomeOf(p, 0.0)).toBe('crit')
    expect(outcomeOf(p, p * BALANCE.climb.critRatio + 0.001)).toBe('success')
    expect(outcomeOf(p, p + 0.001)).toBe('partial')
    expect(outcomeOf(p, 0.999)).toBe('fall')
  })

  it('성공률은 5~95% 밖으로 나가지 않는다', () => {
    const broken = createClimber('만신창이', 'balanced')
    broken.condition = { hp: 0, fatigue: 100, mood: 0, joints: { finger: 0, shoulder: 0, knee: 0 } }
    const r = resolveStep(ctx(broken), choiceById('a'), seededRng(3))
    expect(r.chance).toBeGreaterThanOrEqual(BALANCE.climb.minChance)
    expect(r.chance).toBeLessThanOrEqual(BALANCE.climb.maxChance)
  })
})

describe('재현성', () => {
  it('같은 시드는 같은 결과를 만든다', () => {
    const c = createClimber('재현', 'balanced')
    const a = resolveStep(ctx(c), choiceById('a'), seededRng(20260821))
    const b = resolveStep(ctx(c), choiceById('a'), seededRng(20260821))
    expect(a.outcome).toBe(b.outcome)
    expect(a.chance).toBe(b.chance)
    expect(a.roll).toBe(b.roll)
    expect(a.text).toBe(b.text)
  })

  it('시드가 다르면 결과 분포가 생긴다 (한 값에 고정되지 않는다)', () => {
    const c = createClimber('분포', 'balanced')
    const seen = new Set<string>()
    for (let s = 0; s < 200; s++) {
      seen.add(resolveStep(ctx(c), choiceById('a'), seededRng(s)).outcome)
    }
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })
})
