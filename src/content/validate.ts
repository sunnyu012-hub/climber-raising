import { ACTIVITIES, getActivity } from './activities'
import { EQUIPMENT, getItem } from './equipment'
import { GYMS } from './gyms'
import { NPCS } from './npcs'
import { PROBLEMS, getProblem, problemsOfGym } from './problems'
import { ACHIEVEMENTS, CAREERS, COMPETITIONS, SEASONS, TITLES, getTitle } from './progression'
import { QUESTS, getQuest } from './quests'
import { REGIONS, getRegion } from './regions'
import { SHOPS } from './shop'
import { SKILLS } from './skills'
import type { UnlockRule } from '../game/types'

/**
 * 콘텐츠 참조 검사. **콘텐츠만 고쳐도 게임이 안 깨지는지**를 지켜주는 안전망이다.
 * 새 데이터를 넣고 테스트를 돌리면 오타 난 id가 여기서 잡힌다.
 *
 * errors = 게임이 깨지는 것 / warnings = 의도한 골격일 수도 있는 것
 */
export interface ValidationResult { errors: string[]; warnings: string[]; counts: Record<string, number> }

const dupes = (ids: string[]): string[] =>
  [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]

export function validateContent(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const counts: Record<string, number> = {
    지역: REGIONS.length,
    암장: GYMS.length,
    문제: PROBLEMS.length,
    활동: ACTIVITIES.length,
    스킬: SKILLS.length,
    NPC: NPCS.length,
    퀘스트: QUESTS.length,
    업적: ACHIEVEMENTS.length,
    칭호: TITLES.length,
    장비: EQUIPMENT.length,
    대회: COMPETITIONS.length,
  }
  const has = (list: { id: string }[], id: string) => list.some((x) => x.id === id)

  const checkUnlock = (where: string, rule?: UnlockRule) => {
    for (const r of rule?.regions ?? []) if (!getRegion(r)) errors.push(`${where}: 없는 지역 ${r}`)
    for (const q of rule?.quests ?? []) if (!getQuest(q)) errors.push(`${where}: 없는 퀘스트 ${q}`)
    for (const n of Object.keys(rule?.npcFriendship ?? {})) {
      if (!has(NPCS, n)) errors.push(`${where}: 없는 NPC ${n}`)
    }
  }

  // ---- id 중복 ----
  for (const [name, ids] of Object.entries({
    problem: PROBLEMS.map((p) => p.id),
    gym: GYMS.map((g) => g.id),
    quest: QUESTS.map((q) => q.id),
    item: EQUIPMENT.map((e) => e.id),
    title: TITLES.map((t) => t.id),
    achievement: ACHIEVEMENTS.map((a) => a.id),
    activity: ACTIVITIES.map((a) => a.id),
    skill: SKILLS.map((s) => s.id),
    region: REGIONS.map((r) => r.id),
  })) {
    for (const d of dupes(ids)) errors.push(`${name} id 중복: ${d}`)
  }

  // ---- 암장 ----
  for (const g of GYMS) {
    if (!getRegion(g.regionId)) errors.push(`암장 ${g.id}: 없는 지역 ${g.regionId}`)
    for (const n of g.npcIds) if (!has(NPCS, n)) errors.push(`암장 ${g.id}: 없는 NPC ${n}`)
    checkUnlock(`암장 ${g.id}`, g.unlock)
    if (problemsOfGym(g.id).length === 0) warnings.push(`암장 ${g.id}: 붙을 문제가 하나도 없다`)
  }

  // ---- 문제 ----
  for (const p of PROBLEMS) {
    const owner = GYMS.some((g) => g.id === p.gymId || g.brandId === p.gymId)
    if (!owner) errors.push(`문제 ${p.id}: 어느 암장에도 안 붙어 있다 (${p.gymId})`)
    for (const st of p.steps) {
      // 먼 홀드 베타가 있으면 짧은 리치용 대체 베타가 반드시 있어야 한다
      const far = st.choices.some((c) => c.reach === 'far')
      const alt = st.choices.some(
        (c) => c.reach === 'compressed' || c.moves.includes('intermediate'),
      )
      if (far && !alt) errors.push(`문제 ${p.id} ${st.id}: 먼 홀드 대체 베타가 없다`)
    }
  }

  // ---- 지역 ----
  for (const r of REGIONS) checkUnlock(`지역 ${r.id}`, r.unlock)

  // ---- 퀘스트 ----
  for (const q of QUESTS) {
    checkUnlock(`퀘스트 ${q.id}`, q.unlock)
    if (q.next && !getQuest(q.next)) errors.push(`퀘스트 ${q.id}: 없는 다음 퀘스트 ${q.next}`)
    if (q.npcId && !has(NPCS, q.npcId)) errors.push(`퀘스트 ${q.id}: 없는 NPC ${q.npcId}`)
    if (q.reward.itemId && !getItem(q.reward.itemId))
      errors.push(`퀘스트 ${q.id}: 없는 보상 아이템 ${q.reward.itemId}`)
    if (q.reward.title && !getTitle(q.reward.title))
      errors.push(`퀘스트 ${q.id}: 없는 칭호 ${q.reward.title}`)
    if (q.goals.length === 0) errors.push(`퀘스트 ${q.id}: 목표가 없다`)
  }

  // ---- 업적 ----
  for (const a of ACHIEVEMENTS) {
    if (a.reward?.title && !getTitle(a.reward.title))
      errors.push(`업적 ${a.id}: 없는 칭호 ${a.reward.title}`)
  }

  // ---- 장비 · 상점 ----
  for (const e of EQUIPMENT) {
    if (e.effects.length === 0) warnings.push(`장비 ${e.id}: 효과가 없다 (장식용 장비 금지)`)
  }
  for (const shop of SHOPS) {
    if (shop.gymId && !GYMS.some((g) => g.id === shop.gymId))
      errors.push(`상점 ${shop.id}: 없는 암장 ${shop.gymId}`)
    for (const entry of shop.entries) {
      if (!getItem(entry.itemId)) errors.push(`상점 ${shop.id}: 없는 아이템 ${entry.itemId}`)
      checkUnlock(`상점 ${shop.id}`, entry.unlock)
    }
  }

  // ---- 커리어 ----
  for (const c of CAREERS) {
    if (c.activityId && !getActivity(c.activityId))
      errors.push(`커리어 ${c.id}: 없는 활동 ${c.activityId}`)
    if (!c.activityId) warnings.push(`커리어 ${c.id}: 아직 활동이 없다 (준비 중)`)
    if (c.requires && !CAREERS.some((x) => x.id === c.requires))
      errors.push(`커리어 ${c.id}: 없는 선행 커리어 ${c.requires}`)
  }

  // ---- 대회 · 시즌 ----
  for (const c of COMPETITIONS) {
    if (!GYMS.some((g) => g.id === c.gymId)) errors.push(`대회 ${c.id}: 없는 암장 ${c.gymId}`)
    for (const pid of c.problemIds) if (!getProblem(pid)) errors.push(`대회 ${c.id}: 없는 문제 ${pid}`)
    for (const t of c.tiers) {
      if (t.title && !getTitle(t.title)) errors.push(`대회 ${c.id}: 없는 칭호 ${t.title}`)
    }
    if (problemsOfGym(c.gymId).length === 0) warnings.push(`대회 ${c.id}: 개최 암장에 문제가 없다`)
  }
  for (const s of SEASONS) {
    for (const q of s.questIds) if (!getQuest(q)) errors.push(`시즌 ${s.id}: 없는 퀘스트 ${q}`)
    if (s.titleId && !getTitle(s.titleId)) errors.push(`시즌 ${s.id}: 없는 칭호 ${s.titleId}`)
  }

  // ---- 활동 ----
  for (const a of ACTIVITIES) {
    for (const n of Object.keys(a.requires?.friendship ?? {})) {
      if (!has(NPCS, n)) errors.push(`활동 ${a.id}: 없는 NPC ${n}`)
    }
    for (const ev of a.events) {
      if (ev.npcId && !has(NPCS, ev.npcId)) errors.push(`활동 ${a.id}: 없는 NPC ${ev.npcId}`)
    }
  }

  // ---- 스킬 ----
  for (const s of SKILLS) {
    if (s.requires && !has(SKILLS, s.requires)) errors.push(`스킬 ${s.id}: 없는 선행 스킬 ${s.requires}`)
  }

  return { errors, warnings, counts }
}
