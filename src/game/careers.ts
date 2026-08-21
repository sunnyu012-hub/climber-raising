import { STAT_LABEL } from './balance'
import { CAREERS, careerOfActivity, getCareer } from '../content/progression'
import { NPCS } from '../content/npcs'
import { pushLog } from './events'
import type { ActivityDefinition, GameState, StatKey } from './types'

/**
 * 알바 커리어. 같은 알바를 반복하면 경력 일수가 쌓이고 상위 알바가 열린다.
 *
 * 일정 화면의 잠금 표시는 **`activityBlocker()` 하나만** 본다.
 * (능력치 조건과 커리어 조건이 두 군데로 갈라지면 화면과 계산이 어긋난다.)
 */
export const careerDays = (s: GameState, careerId: string): number => s.career[careerId] ?? 0

/** 하루 알바를 끝냈을 때 경력을 올린다. */
export function bumpCareer(s: GameState, activityId: string): void {
  const track = careerOfActivity(activityId)
  if (!track) return
  const before = careerDays(s, track.id)
  s.career[track.id] = before + 1
  for (const c of CAREERS) {
    if (!c.activityId || c.requires !== track.id) continue
    if (before < c.unlockAt && before + 1 >= c.unlockAt) {
      pushLog(s, '💼', `새 알바가 열렸다 — ${c.name}`)
    }
  }
}

/** 이 활동을 지금 넣을 수 있는가. 막혀 있으면 사용자에게 보여줄 이유. */
export function activityBlocker(s: GameState, a: ActivityDefinition): string | null {
  for (const [k, v] of Object.entries(a.requires?.stats ?? {}) as [StatKey, number][]) {
    if (s.climber.stats[k] < v) return `🔒 ${STAT_LABEL[k]} ${v} 필요`
  }
  for (const [id, v] of Object.entries(a.requires?.friendship ?? {})) {
    if ((s.npc[id] ?? 0) < v) {
      const name = NPCS.find((n) => n.id === id)?.name ?? id
      return `🔒 ${name} 친밀도 ${v} 필요`
    }
  }
  const track = careerOfActivity(a.id)
  const need = track?.requires ? getCareer(track.requires) : undefined
  if (track && need && careerDays(s, need.id) < track.unlockAt) {
    return `🔒 ${need.name} ${track.unlockAt}일 경력 필요 (현재 ${careerDays(s, need.id)}일)`
  }
  return null
}

/** 화면용 커리어 목록 — 경력 일수와 잠금 상태 */
export const careerList = (s: GameState) =>
  CAREERS.map((c) => ({
    career: c,
    days: careerDays(s, c.id),
    ready: !!c.activityId,
    blocked: c.requires ? careerDays(s, c.requires) < c.unlockAt : false,
  }))
