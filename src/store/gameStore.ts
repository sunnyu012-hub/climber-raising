import { create } from 'zustand'
import { BALANCE } from '../game/balance'
import { now } from '../game/clock'
import { collectModifiers, isInjured } from '../game/character'
import { resolveStep, isSuccess } from '../game/climb'
import {
  advanceSchedule, applyStepResult, clearReward, dayLengthMs, failReward, grantExp,
  grantStatExp, speedupMs,
} from '../game/progress'
import { createDraft, createNewGame, draftBlocker, SAVE_VERSION } from '../game/newGame'
import { generateCharacter, newSeed, rollNickname } from '../game/characterGen'
import { systemRng } from '../game/rng'
import { getProblem } from '../content/problems'
import { getGym } from '../content/gyms'
import { getSkill } from '../content/skills'
import { PRESETS } from '../content/activities'
import { localAdapter } from './localAdapter'
import { migrate } from './migrate'
import type { SaveAdapter } from './storage'
import type { ClimbingProblem, GameState, OnboardingDraft, StepResult } from '../game/types'

/** 진행 중인 등반 세션. 저장하지 않는다(중간에 나가면 시도는 없던 일이 된다). */
export interface ClimbSession {
  problem: ClimbingProblem
  stepIndex: number
  status: 'active' | 'cleared' | 'fallen'
  onsight: boolean
  lastResult: StepResult | null
  retries: number
  gainedExp: number
  speedupTotal: number
  hurt: string | null
}

const MAX_RETRIES = 2

interface Store {
  state: GameState
  ready: boolean
  /** 온보딩 임시 상태. null이면 온보딩 중이 아니다. 본 세이브와 완전히 분리돼 있다. */
  draft: OnboardingDraft | null
  adapter: SaveAdapter
  session: ClimbSession | null

  init: () => Promise<void>
  setDraft: (d: OnboardingDraft) => void
  /** 온보딩 시작/미리보기. 기존 세이브를 건드리지 않는다. */
  beginOnboarding: () => void
  cancelOnboarding: () => void
  finishOnboarding: () => void
  applyAppearanceOnly: (d: OnboardingDraft) => void
  patchProfile: (p: { gender?: GameState['climber']['gender']; age?: number | null; gymId?: string }) => void
  tick: (surfaceReport?: boolean) => void
  persist: () => void

  setDay: (dayIndex: number, activityId: string | null) => void
  applyPreset: (presetId: string) => void

  startClimb: (problemId: string) => void
  chooseBeta: (choiceId: string) => void
  exitClimb: () => void

  learnSkill: (skillId: string) => void
  dismissReport: () => void
  setFastMode: (v: boolean) => void
  setTimeScale: (v: number) => void
  resetGame: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useGame = create<Store>((set, get) => ({
  state: createNewGame(),
  ready: false,
  draft: null,
  adapter: localAdapter,
  session: null,

  async init() {
    const adapter = get().adapter
    const loaded = migrate(await adapter.load())

    if (!loaded || !loaded.onboardingCompleted) {
      // 세이브가 없다 → 캐릭터를 먼저 만든다. 본 세이브는 아직 만들지 않는다.
      const saved = await adapter.loadDraft()
      set({
        ready: true,
        draft: saved ?? createDraft(newSeed(), rollNickname(systemRng)),
      })
      return
    }

    const { state, report } = advanceSchedule(loaded, now(), systemRng)
    set({ state: { ...state, pendingReport: report }, ready: true, draft: null })
    get().persist()
  },

  setDraft(d) {
    set({ draft: d })
    void get().adapter.saveDraft(d).catch(() => { /* 임시 상태 저장 실패는 치명적이지 않다 */ })
  },

  beginOnboarding() {
    const d = createDraft(newSeed(), rollNickname(systemRng))
    set({ draft: d })
    void get().adapter.saveDraft(d).catch(() => {})
  },

  cancelOnboarding() {
    set({ draft: null })
    void get().adapter.clearDraft().catch(() => {})
  },

  finishOnboarding() {
    const d = get().draft
    if (!d || draftBlocker(d)) return
    const climber = generateCharacter({
      seed: d.seed, nickname: d.nickname.trim(), gender: d.gender, age: d.age,
    })
    set({ state: createNewGame(climber, d.gymId!), draft: null, session: null })
    void get().adapter.clearDraft().catch(() => {})
    get().persist()
  },

  /** 기존 진행(레벨·돈·스킬·기록)은 두고 외형과 기본 정보만 바꾼다. */
  applyAppearanceOnly(d) {
    const state = structuredClone(get().state)
    const fresh = generateCharacter({
      seed: d.seed, nickname: d.nickname.trim(), gender: d.gender, age: d.age,
    })
    const c = state.climber
    c.name = fresh.name
    c.gender = fresh.gender
    c.age = fresh.age
    c.height = fresh.height
    c.appearance = fresh.appearance
    c.seed = fresh.seed
    c.specialtyId = fresh.specialtyId
    c.personalityId = fresh.personalityId
    c.intro = fresh.intro
    c.reach = fresh.reach
    if (d.gymId) state.gymId = d.gymId
    state.log = [{ at: now(), icon: '✂️', text: '머리를 자르고 마음도 좀 바꿨다.' }, ...state.log]
      .slice(0, BALANCE.log.max)
    set({ state, draft: null })
    void get().adapter.clearDraft().catch(() => {})
    get().persist()
  },

  /** 성별·나이·암장만 보완한다(기존 세이브용). 외형과 능력치는 그대로. */
  patchProfile(p) {
    const state = structuredClone(get().state)
    if (p.gender) state.climber.gender = p.gender
    if (p.age !== undefined) state.climber.age = p.age
    if (p.gymId) state.gymId = p.gymId
    set({ state })
    get().persist()
  },

  tick(surfaceReport = false) {
    const { state, session } = get()
    if (session?.status === 'active') return // 등반 중에는 날짜를 넘기지 않는다
    const { state: next, report } = advanceSchedule(state, now(), systemRng)
    if (report) {
      // 보던 중에 하루가 넘어간 거라면 모달로 막지 않는다 — 기록에만 남긴다.
      const surface = surfaceReport || report.daysRun >= 2
      set({ state: { ...next, pendingReport: surface ? report : null } })
      get().persist()
    } else if (next.clock.lastTickAt !== state.clock.lastTickAt) {
      set({ state: next })
    }
  },

  persist() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const { adapter, state } = get()
      void adapter.save({ version: SAVE_VERSION, state }).catch((e) => {
        console.error('[save] 저장 실패', e)
      })
    }, 300)
  },

  setDay(dayIndex, activityId) {
    const state = structuredClone(get().state)
    state.schedule.days[dayIndex] = activityId
    set({ state })
    get().persist()
  },

  applyPreset(presetId) {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const state = structuredClone(get().state)
    state.schedule.days = [...preset.days]
    set({ state })
    get().persist()
  },

  startClimb(problemId) {
    const problem = getProblem(problemId)
    if (!problem) return
    const state = get().state
    if (isInjured(state.climber.condition)) return
    const record = state.records[problemId]
    set({
      session: {
        problem,
        stepIndex: 0,
        status: 'active',
        onsight: !record || record.attempts === 0,
        lastResult: null,
        retries: 0,
        gainedExp: 0,
        speedupTotal: 0,
        hurt: null,
      },
    })
  },

  chooseBeta(choiceId) {
    const { session } = get()
    if (!session || session.status !== 'active') return
    const step = session.problem.steps[session.stepIndex]
    const choice = step.choices.find((c) => c.id === choiceId)
    if (!choice) return

    const state = structuredClone(get().state)
    const mods = collectModifiers(state.climber, state.npc, getGym(state.gymId))
    const result = resolveStep({ climber: state.climber, problem: session.problem, mods }, choice, systemRng)
    const hurt = applyStepResult(state.climber, result, systemRng)

    const next: ClimbSession = { ...session, lastResult: result, hurt }

    if (isSuccess(result.outcome)) {
      // 직접 플레이 보상: 일정 시간 단축
      const gain = speedupMs(state, 'step')
      state.clock.bonusMs += gain
      next.speedupTotal += gain
      next.retries = 0
      next.stepIndex += 1
      if (next.stepIndex >= session.problem.steps.length) next.status = 'cleared'
    } else if (result.outcome === 'partial') {
      next.retries += 1
      if (next.retries > MAX_RETRIES) {
        next.status = 'fallen'
      }
    } else {
      next.status = 'fallen'
    }

    if (next.status === 'cleared') {
      finishClear(state, session.problem, next)
    } else if (next.status === 'fallen') {
      finishFall(state, session.problem, next)
    }

    if (hurt) {
      state.log = [{ at: now(), icon: '🤕', text: `${session.problem.name}에서 무리했다.` }, ...state.log]
        .slice(0, BALANCE.log.max)
    }

    set({ state, session: next })
    get().persist()
  },

  exitClimb() {
    set({ session: null })
    get().tick()
  },

  learnSkill(skillId) {
    const skill = getSkill(skillId)
    if (!skill) return
    const state = structuredClone(get().state)
    const c = state.climber
    if (c.skills.includes(skillId)) return
    if (c.skillPoints < skill.cost) return
    if (skill.requires && !c.skills.includes(skill.requires)) return
    c.skillPoints -= skill.cost
    c.skills.push(skillId)
    state.log = [{ at: now(), icon: '✨', text: `스킬 «${skill.name}» 습득!` }, ...state.log]
      .slice(0, BALANCE.log.max)
    set({ state })
    get().persist()
  },

  dismissReport() {
    set({ state: { ...get().state, pendingReport: null } })
    get().persist()
  },

  setFastMode(v) {
    const state = structuredClone(get().state)
    state.settings.fastMode = v
    set({ state })
    get().persist()
  },

  setTimeScale(v) {
    const state = structuredClone(get().state)
    state.settings.devTimeScale = v
    set({ state })
    get().persist()
  },

  /** 전체 초기화 — 세이브를 지우고 온보딩부터 다시 시작한다. */
  async resetGame() {
    await get().adapter.clear()
    await get().adapter.clearDraft()
    set({
      state: createNewGame(),
      session: null,
      draft: createDraft(newSeed(), rollNickname(systemRng)),
    })
  },
}))

// ---------- 완등 / 추락 정산 (스토어 전용 헬퍼) ----------
function finishClear(state: GameState, problem: ClimbingProblem, session: ClimbSession): void {
  const c = state.climber
  const rec = state.records[problem.id] ?? { attempts: 0, cleared: false, onsight: false }
  const firstClear = !rec.cleared
  const onsight = session.onsight && firstClear

  const reward = clearReward(problem, firstClear, onsight)
  const exp = reward.exp

  grantStatExp(c, problem.reward.statExp, reward.statExpMult)
  grantExp(c, exp)
  c.money += reward.money

  const gain = speedupMs(state, 'clear')
  state.clock.bonusMs += gain
  session.speedupTotal += gain
  session.gainedExp = exp

  state.records[problem.id] = {
    attempts: rec.attempts + 1,
    cleared: true,
    onsight: rec.onsight || onsight,
    bestGradeCleared: Math.max(rec.bestGradeCleared ?? -1, problem.grade),
  }
  state.directPlayCount += 1
  c.condition.mood = Math.min(100, c.condition.mood + (firstClear ? 10 : 4))

  if (problem.achievement && !state.achievements.includes(problem.achievement.id)) {
    state.achievements.push(problem.achievement.id)
  }
  state.log = [
    { at: now(), icon: onsight ? '🌟' : '🏁', text: `${problem.name} ${onsight ? '초견 ' : ''}완등! (+${exp} EXP)` },
    ...state.log,
  ].slice(0, BALANCE.log.max)
}

function finishFall(state: GameState, problem: ClimbingProblem, session: ClimbSession): void {
  const c = state.climber
  const rec = state.records[problem.id] ?? { attempts: 0, cleared: false, onsight: false }
  // 실패해도 완전히 빈손은 아니다 — 숙련도는 이미 붙었고 경험치도 조금 남는다.
  const reward = failReward(problem)
  const exp = reward.exp
  grantExp(c, exp)
  grantStatExp(c, problem.reward.statExp, reward.statExpMult)
  session.gainedExp = exp

  state.records[problem.id] = { ...rec, attempts: rec.attempts + 1 }
  state.directPlayCount += 1
  c.condition.mood = Math.max(0, c.condition.mood - 3)
  state.log = [
    { at: now(), icon: '💥', text: `${problem.name}에서 떨어졌다. (+${exp} EXP)` },
    ...state.log,
  ].slice(0, BALANCE.log.max)
}

/** 하루 길이를 UI에서 쓰기 위한 재노출 */
export { dayLengthMs }
