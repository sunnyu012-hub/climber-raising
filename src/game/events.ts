import { BALANCE } from './balance'
import { now } from './clock'
import { ACHIEVEMENTS, getTitle } from '../content/progression'
import { getQuest } from '../content/quests'
import type {
  GameEvent, GameState, MoveKey, PlayStats, QuestGoal, QuestProgress,
} from './types'

/**
 * 이벤트 스파인 — 이 게임의 모든 진행이 지나가는 한 지점.
 *
 * 화면이 "퀘스트 완료했다"고 제출하는 구조가 아니다.
 * 실제로 일어난 일(`GameEvent`)만 흘려보내고, 퀘스트·업적·도감·기록이 그걸 보고 스스로 판정한다.
 * 새 시스템이 진행을 추적해야 하면 여기에 구독을 하나 더 붙인다.
 *
 * SERVER-AUTHORITY: 서버 모드에서는 이 이벤트 스트림을 서버로 보내고
 * 보상 확정은 서버가 다시 계산한다. 클라이언트가 만든 보상 수치를 그대로 신뢰하지 않는다.
 */

// ---------------- 목표 판정 (퀘스트·업적 공용) ----------------
/** 이벤트가 이 목표에 해당하는가 */
export function goalMatches(goal: QuestGoal, ev: GameEvent): boolean {
  if (goal.event !== ev.t) return false
  if (!goal.match) return true
  const rec = ev as unknown as Record<string, unknown>
  return Object.entries(goal.match).every(([k, v]) => rec[k] === v)
}

/** 이벤트 하나가 이 목표를 얼마나 진행시키는가 */
export function goalDelta(goal: QuestGoal, ev: GameEvent): number {
  if (!goalMatches(goal, ev)) return 0
  if (!goal.sumField) return 1
  const v = (ev as unknown as Record<string, unknown>)[goal.sumField]
  return typeof v === 'number' ? v : 0
}

export const isQuestDone = (p: QuestProgress, goals: QuestGoal[]): boolean =>
  goals.every((g, i) => (p.counts[i] ?? 0) >= g.count)

// ---------------- 기본 상태 ----------------
export function emptyStats(): PlayStats {
  return {
    days: 0, attempts: 0, clears: 0, onsights: 0, flashes: 0, falls: 0,
    bestGrade: -1, moveUse: {}, gymVisits: {}, gymClears: {},
    jobs: 0, earned: 0, spent: 0, injuries: 0, rests: 0,
    expeditions: 0, itemsGained: 0, competitions: 0,
  }
}

// ---------------- 구독자 ----------------
function applyStats(s: GameState, ev: GameEvent): void {
  const st = s.stats
  switch (ev.t) {
    case 'climb.attempt':
      st.attempts += 1
      break
    case 'climb.clear':
      st.clears += 1
      if (ev.onsight) st.onsights += 1
      if (ev.flash) st.flashes += 1
      st.bestGrade = Math.max(st.bestGrade, ev.grade)
      st.gymClears[ev.gymId] = (st.gymClears[ev.gymId] ?? 0) + 1
      break
    case 'climb.fall':
      st.falls += 1
      break
    case 'move.used':
      st.moveUse[ev.move] = (st.moveUse[ev.move] ?? 0) + 1
      break
    case 'activity.done':
      if (ev.kind === 'job') st.jobs += 1
      if (ev.kind === 'rest' || ev.kind === 'rehab') st.rests += 1
      break
    case 'money.earn':
      st.earned += ev.amount
      break
    case 'money.spend':
      st.spent += ev.amount
      break
    case 'gym.visit':
      st.gymVisits[ev.gymId] = (st.gymVisits[ev.gymId] ?? 0) + 1
      break
    case 'injury':
      st.injuries += 1
      break
    case 'expedition.done':
      st.expeditions += 1
      break
    case 'item.get':
      st.itemsGained += 1
      break
    case 'competition.done':
      st.competitions += 1
      break
    default:
      break
  }
}

function applyCollection(s: GameState, ev: GameEvent): void {
  const add = (kind: keyof GameState['collection'], id: string) => {
    if (id && !s.collection[kind].includes(id)) s.collection[kind].push(id)
  }
  switch (ev.t) {
    case 'climb.attempt': add('problem', ev.problemId); break
    case 'gym.visit': add('gym', ev.gymId); break
    case 'npc.talk': add('npc', ev.npcId); break
    case 'npc.friendship': add('npc', ev.npcId); break
    case 'item.get': add('equipment', ev.itemId); break
    default: break
  }
}

function applyQuests(s: GameState, ev: GameEvent): void {
  for (const p of s.quests.active) {
    if (p.completed) continue
    const quest = getQuest(p.questId)
    if (!quest) continue
    let changed = false
    quest.goals.forEach((g, i) => {
      const d = goalDelta(g, ev)
      if (d > 0) {
        p.counts[i] = Math.min(g.count, (p.counts[i] ?? 0) + d)
        changed = true
      }
    })
    if (changed && isQuestDone(p, quest.goals)) p.completed = true
  }
}

function applyAchievements(s: GameState, ev: GameEvent): void {
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue
    const prog = (s.achievementProgress[a.id] ??= a.goals.map(() => 0))
    let changed = false
    a.goals.forEach((g, i) => {
      const d = goalDelta(g, ev)
      if (d > 0) {
        prog[i] = Math.min(g.count, (prog[i] ?? 0) + d)
        changed = true
      }
    })
    if (!changed) continue
    if (a.goals.every((g, i) => (prog[i] ?? 0) >= g.count)) {
      s.achievements.push(a.id)
      if (a.reward?.fame) s.world.fame += a.reward.fame
      if (a.reward?.money) s.climber.money += a.reward.money
      if (a.reward?.title) grantTitle(s, a.reward.title)
      pushLog(s, '🏅', `업적 달성 — ${a.name}`)
    }
  }
}

// ---------------- 공용 헬퍼 ----------------
export function pushLog(s: GameState, icon: string, text: string): void {
  s.log = [{ at: now(), icon, text }, ...s.log].slice(0, BALANCE.log.max)
}

export function grantTitle(s: GameState, titleId: string): void {
  if (!getTitle(titleId) || s.titles.includes(titleId)) return
  s.titles.push(titleId)
  pushLog(s, '🎖️', `칭호 «${getTitle(titleId)!.name}» 획득!`)
}

/**
 * 이벤트 하나를 게임 상태에 흘려보낸다.
 * 상태를 직접 수정하므로 반드시 **복제한 상태**에 대고 부른다(스토어가 structuredClone 후 호출).
 */
export function emit(s: GameState, ev: GameEvent): void {
  applyStats(s, ev)
  applyCollection(s, ev)
  applyQuests(s, ev)
  applyAchievements(s, ev)
}

/** 여러 이벤트를 순서대로 */
export const emitAll = (s: GameState, evs: GameEvent[]): void => {
  for (const e of evs) emit(s, e)
}

/** 등반 한 동작에서 나오는 무브 사용 이벤트 */
export const moveEvents = (moves: MoveKey[]): GameEvent[] =>
  moves.map((m) => ({ t: 'move.used', move: m }))
