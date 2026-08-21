import { QUESTS, getQuest, questsOfKind } from '../content/quests'
import { getItem } from '../content/equipment'
import { addItem, syncSlots } from './equipment'
import { emit, grantTitle, isQuestDone, pushLog } from './events'
import { grantExp } from './progress'
import { unlockBlocker } from './unlock'
import { now } from './clock'
import type { GameState, Quest, QuestProgress } from './types'

/**
 * 퀘스트 진행. **진행 판정은 여기에 없다** — `events.ts`의 `emit()`이 이벤트로 센다.
 * 이 파일이 하는 일은 세 가지뿐이다: 열어주기 · 갱신하기 · 보상 주기.
 */

/** 게임 시작부터 세는 통산 일수. 일일 퀘스트 갱신 기준. */
export const absoluteDay = (s: GameState): number =>
  (s.schedule.week - 1) * 7 + s.schedule.dayIndex

const newProgress = (q: Quest): QuestProgress => ({
  questId: q.id,
  counts: q.goals.map(() => 0),
  completed: false,
  claimed: false,
  startedAt: now(),
})

const isActive = (s: GameState, id: string) => s.quests.active.some((p) => p.questId === id)

/** 다른 퀘스트의 `next`로 연결된 퀘스트는 앞 퀘스트를 끝내야 열린다. */
const CHAINED = new Set(QUESTS.map((q) => q.next).filter((x): x is string => !!x))

export function startQuest(s: GameState, id: string): void {
  const q = getQuest(id)
  if (!q || isActive(s, id) || s.quests.done.includes(id)) return
  s.quests.active.push(newProgress(q))
}

/** 일일 퀘스트 2개를 그날에 맞게 고른다. 같은 날이면 항상 같은 조합이다. */
function pickDaily(day: number, pool: Quest[], count: number): string[] {
  const out: string[] = []
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    // 날짜에서 만든 결정적 순서 — 새로고침해도 오늘 퀘스트가 바뀌지 않는다
    const idx = (day * 7 + i * 13 + Math.floor(day / 3)) % pool.length
    let j = idx
    while (out.includes(pool[j].id)) j = (j + 1) % pool.length
    out.push(pool[j].id)
  }
  return out
}

function rotate(s: GameState, kind: 'daily' | 'weekly', picked: string[]): void {
  s.quests.active = s.quests.active.filter((p) => getQuest(p.questId)?.kind !== kind)
  for (const id of picked) startQuest(s, id)
}

/** 하루/한 주가 넘어갔으면 일일·주간 퀘스트를 새로 깐다. 못 받은 보상은 사라진다. */
export function refreshPeriodic(s: GameState): void {
  const day = absoluteDay(s)
  if (s.quests.lastDailyDay !== day) {
    s.quests.lastDailyDay = day
    s.quests.dailySeed = day
    s.quests.dailyPicked = pickDaily(day, questsOfKind('daily'), 2)
    rotate(s, 'daily', s.quests.dailyPicked)
  }
  if (s.quests.lastWeeklyWeek !== s.schedule.week) {
    s.quests.lastWeeklyWeek = s.schedule.week
    s.quests.weeklyPicked = questsOfKind('weekly').map((q) => q.id)
    rotate(s, 'weekly', s.quests.weeklyPicked)
  }
}

/** 조건을 채운 퀘스트를 자동으로 연다. 수동 수락 화면은 만들지 않는다. */
export function openAvailable(s: GameState): void {
  for (const q of QUESTS) {
    if (q.kind === 'daily' || q.kind === 'weekly') continue
    if (isActive(s, q.id) || s.quests.done.includes(q.id)) continue
    if (CHAINED.has(q.id)) {
      const prev = QUESTS.find((x) => x.next === q.id)
      if (prev && !s.quests.done.includes(prev.id)) continue
    }
    if (unlockBlocker(s, q.unlock)) continue
    startQuest(s, q.id)
    pushLog(s, '📜', `새 퀘스트 — ${q.name}`)
  }
}

/** 하루가 지났거나 상태가 바뀐 뒤에 부른다. 여러 번 불러도 안전하다. */
export function syncQuests(s: GameState): void {
  refreshPeriodic(s)
  // 이벤트를 놓친 채 저장된 세이브도 여기서 완료 표시를 회복한다
  for (const p of s.quests.active) {
    const q = getQuest(p.questId)
    if (q && !p.completed && isQuestDone(p, q.goals)) p.completed = true
  }
  openAvailable(s)
}

/** 보상 수령. 받을 수 없으면 이유를 돌려준다. */
export function claimQuest(s: GameState, questId: string): string | null {
  const p = s.quests.active.find((x) => x.questId === questId)
  const q = getQuest(questId)
  if (!p || !q) return '없는 퀘스트예요'
  if (!p.completed) return '아직 목표를 다 못 채웠어요'
  if (p.claimed) return '이미 받았어요'

  const r = q.reward
  if (r.exp) {
    const ups = grantExp(s.climber, r.exp)
    for (let i = 0; i < ups; i++) emit(s, { t: 'level.up', level: s.climber.level - ups + i + 1 })
    if (ups > 0) syncSlots(s)
  }
  if (r.money) {
    s.climber.money += r.money
    emit(s, { t: 'money.earn', amount: r.money, source: 'quest' })
  }
  if (r.itemId && getItem(r.itemId)) addItem(s, r.itemId)
  if (r.title) grantTitle(s, r.title)
  if (r.fame) s.world.fame += r.fame
  if (r.skillPoint) s.climber.skillPoints += r.skillPoint

  p.claimed = true
  s.quests.active = s.quests.active.filter((x) => x.questId !== questId)
  s.quests.done.push(questId)
  pushLog(s, '✅', `퀘스트 완료 — ${q.name}`)
  openAvailable(s)
  return null
}

/** 화면에 보여줄 진행 중 퀘스트 (완료된 것 먼저) */
export const activeQuests = (s: GameState): { quest: Quest; progress: QuestProgress }[] =>
  s.quests.active
    .map((p) => ({ quest: getQuest(p.questId)!, progress: p }))
    .filter((x) => !!x.quest)
    .sort((a, b) => Number(b.progress.completed) - Number(a.progress.completed))
