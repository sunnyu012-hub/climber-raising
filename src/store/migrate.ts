import { createNewGame, SAVE_VERSION, slotsForLevel } from '../game/newGame'
import { migrateGymId } from '../content/gyms'
import type { Climber, GameState } from '../game/types'
import type { PersistedSave } from './storage'

/**
 * 세이브 복구. **기존 사용자의 진행을 절대 버리지 않는다.**
 * 구조가 바뀌어도 기본값과 병합해서 살린다.
 *
 * v3 → v4 에서 하는 일
 *  - 전체 시스템 뼈대(퀘스트·도감·월드·장비·기록…) 필드를 기본값으로 채운다
 *  - 이미 있는 값은 절대 덮어쓰지 않는다 (여러 번 돌려도 결과가 같다 — 멱등)
 *
 * v1/v2 → v3 에서 하는 일
 *  - onboardingCompleted: true  (기존 사용자에게 온보딩을 다시 띄우지 않는다)
 *  - gender: 'unset', age: null (임의로 확정하지 않는다 — 더보기에서 보완)
 *  - 옛 암장 id → waverock-seomyeon
 *  - look → appearance (신발/초크백 색은 기본값으로 채움)
 *  - 레벨·돈·능력치·일정·업적·기록은 그대로
 */
export function migrate(raw: PersistedSave | null): GameState | null {
  if (!raw || typeof raw !== 'object' || !raw.state) return null
  const base = createNewGame()
  const s = raw.state as Partial<GameState> & { climber?: Partial<Climber> & { look?: unknown } }

  if (!s.climber || !s.schedule || !s.clock) return null

  const old = s.climber
  const oldLook = (old.look ?? {}) as Partial<Climber['appearance']>

  const climber: Climber = {
    ...base.climber,
    ...(old as Partial<Climber>),
    // v1에는 없던 필드 — 임의의 값을 확정하지 않는다
    gender: old.gender ?? 'unset',
    age: old.age ?? null,
    height: old.height ?? base.climber.height,
    seed: old.seed ?? base.climber.seed,
    specialtyId: old.specialtyId ?? base.climber.specialtyId,
    personalityId: old.personalityId ?? base.climber.personalityId,
    intro: old.intro ?? base.climber.intro,
    title: old.title ?? base.climber.title,
    appearance: { ...base.climber.appearance, ...oldLook, ...old.appearance },
    // 진행 데이터는 있는 그대로 살린다
    stats: { ...base.climber.stats, ...old.stats },
    statExp: { ...base.climber.statExp, ...old.statExp },
    mastery: { ...base.climber.mastery, ...old.mastery },
    condition: {
      ...base.climber.condition,
      ...old.condition,
      joints: { ...base.climber.condition.joints, ...old.condition?.joints },
    },
  }
  // 옛 세이브에 남아 있는 look 잔재 제거
  delete (climber as Partial<Climber> & { look?: unknown }).look

  return {
    ...base,
    ...s,
    version: SAVE_VERSION,
    // 기존 사용자는 이미 플레이 중이다 — 온보딩을 강제로 다시 보여주지 않는다
    onboardingCompleted: s.onboardingCompleted ?? true,
    climber,
    gymId: migrateGymId(s.gymId),
    homeGymId: migrateGymId(s.homeGymId ?? s.gymId),
    schedule: { ...base.schedule, ...s.schedule },
    clock: { ...base.clock, ...s.clock },
    settings: { ...base.settings, ...s.settings },
    npc: { ...base.npc, ...s.npc },
    records: s.records ?? {},
    achievements: s.achievements ?? [],
    log: s.log ?? [],
    pendingReport: null,

    // ---- v4: 시스템 뼈대. 없으면 기본값, 있으면 그대로 (멱등) ----
    stats: { ...base.stats, ...s.stats },
    collection: { ...base.collection, ...s.collection },
    quests: { ...base.quests, ...s.quests },
    achievementProgress: s.achievementProgress ?? {},
    titles: s.titles ?? base.titles,
    equippedTitle: s.equippedTitle ?? base.equippedTitle,
    world: {
      ...base.world,
      ...s.world,
      visitedGyms: s.world?.visitedGyms ?? [migrateGymId(s.gymId)],
      gymFamiliarity: { ...base.world.gymFamiliarity, ...s.world?.gymFamiliarity },
      regionFamiliarity: { ...base.world.regionFamiliarity, ...s.world?.regionFamiliarity },
    },
    inventory: {
      ...base.inventory,
      ...s.inventory,
      // 레벨이 이미 높은 기존 세이브는 그만큼 슬롯이 열려 있어야 한다
      unlockedSlots: s.inventory?.unlockedSlots ?? slotsForLevel(climber.level),
    },
    career: s.career ?? {},
    projects: s.projects ?? {},
    competitionRecords: s.competitionRecords ?? [],
    crew: { ...base.crew, ...s.crew },
    seasonId: s.seasonId ?? base.seasonId,
    shopBought: s.shopBought ?? {},
  }
}
