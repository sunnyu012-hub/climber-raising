/** 도메인 타입 단일 출처. UI/콘텐츠/저장 전부 여기를 참조한다. */

// ---------- 기본 키 ----------
export type StatKey =
  | 'power' | 'technique' | 'flexibility' | 'stamina'
  | 'routefinding' | 'mental' | 'social' | 'luck'

export type JointKey = 'finger' | 'shoulder' | 'knee'

export type MoveKey =
  | 'highstep' | 'flagging' | 'lockoff' | 'intermediate'
  | 'heelhook' | 'dyno' | 'footswap' | 'rest' | 'chalk'

export type WallType = '슬랩' | '수직' | '오버행' | '루프'
export type ReachTag = 'far' | 'compressed' | 'neutral'
export type ReachTrait = 'short' | 'balanced' | 'long'
export type Outcome = 'crit' | 'success' | 'partial' | 'fall'
export type JointStage = 'healthy' | 'caution' | 'stiff' | 'pain' | 'injured'
export type PoseKey =
  | 'idle' | 'lookUp' | 'reach' | 'stepUp' | 'pull' | 'highstep' | 'flag'
  | 'heel' | 'dyno' | 'wobble' | 'fall' | 'mat' | 'top' | 'tired' | 'rest'

export type ChanceTier = 'veryGood' | 'doable' | 'risky' | 'reckless' | 'unknown'

/** 'unset' = 기존 세이브에서 넘어온 미설정 상태. 임의로 확정하지 않는다. */
export type Gender = 'female' | 'male' | 'unset'
export type HairKey = 'short' | 'long' | 'bun' | 'curly' | 'twin' | 'cap'

/** 외형은 파츠 이미지를 늘리지 않고 형태 6종 + 팔레트 조합으로만 확장한다. */
export interface Appearance {
  hair: HairKey
  hairColor: string
  skin: string
  shirt: string
  pants: string
  shoe: string
  chalkbag: string
}

/** 도트 캐릭터 표시 크기 체계. 화면마다 임의의 px를 쓰지 않는다. */
export type SpriteSize = 'tiny' | 'small' | 'medium' | 'action'

// ---------- 콘텐츠 ----------
export interface Gym {
  id: string
  regionId: string
  /** 같은 브랜드의 지점끼리 공통 문제를 공유한다. 브랜드 문제는 gymId에 이 값을 쓴다. */
  brandId: string
  displayName: string
  /** 지점 이름만 짧게 (선택 화면용) */
  branchName: string
  tagline: string
  /** 이 지점이 어떤 곳인지 — 선택 화면에서 보여준다 */
  character: string
  wallTypes: WallType[]
  npcIds: string[]
  /** 지점 카드/벽 배경 색. 지금은 지점 구분이 시각 요소뿐이다. */
  theme: { sign: string; wall: string; accent: string }
  /**
   * 향후 확장 자리. 지금은 웨이브락 3지점 모두 빈 배열이다 —
   * 어느 지점을 골라도 능력치·보상이 같아야 하기 때문이다.
   */
  homeBonus: SkillEffect[]
  scale: 'small' | 'medium' | 'large'
  facilities: string[]
  /** 홈짐이 아닌 곳을 방문할 때 드는 돈 */
  visitCost: number
  /** 지점 고유 이벤트 1개. 보상이 아니라 분위기 연출이다. */
  signature: {
    id: string
    name: string
    text: string
    chance: number
    effect: { mood?: number; friendship?: Record<string, number> }
  }
  unlock: UnlockRule
}

export interface BetaChoice {
  id: string
  label: string
  moves: MoveKey[]
  stats: Partial<Record<StatKey, number>>
  baseChance: number
  cost: { hp: number; fatigue: number } & Partial<Record<JointKey, number>>
  luckMult: number
  reach: ReachTag
  wall?: WallType
  critText: string
  successText: string
  partialText: string
  fallText: string
  pose?: PoseKey
}

export interface ProblemStep {
  id: string
  situation: string
  line: string
  choices: BetaChoice[]
}

export interface ClimbingProblem {
  id: string
  gymId: string
  name: string
  grade: number // 0 = V0
  wall: WallType
  desc: string
  recommend: StatKey[]
  steps: ProblemStep[]
  reward: { exp: number; money?: number; statExp: Partial<Record<StatKey, number>> }
  firstClearBonus: { exp: number; money: number }
  achievement?: { id: string; name: string; desc: string }
  flavor: string
  /** 한 번에 못 풀어도 진척이 남는 문제 */
  isProject?: boolean
  /** 세팅 교체까지 남은 주차 (표시용). 없으면 상설 */
  setUntilWeek?: number
  /** 주 사용 홀드 (도감 표시용) */
  holds?: string[]
}

export type ActivityKind = 'train' | 'rest' | 'rehab' | 'job' | 'social'

export interface ActivityEvent {
  chance: number
  text: string
  npcId?: string
  friendship?: number
  money?: number
  mood?: number
}

export interface ActivityDefinition {
  id: string
  name: string
  kind: ActivityKind
  icon: string
  desc: string
  hp: number
  fatigue: number
  mood: number
  joints: Partial<Record<JointKey, number>>
  statExp: Partial<Record<StatKey, number>>
  moveExp?: Partial<Record<MoveKey, number>>
  money: number
  injuryRisk: number
  allowedWhenInjured: boolean
  requires?: { stats?: Partial<Record<StatKey, number>>; friendship?: Record<string, number> }
  events: ActivityEvent[]
}

export type SkillEffect =
  | { kind: 'moveChance'; move: MoveKey; value: number }
  | { kind: 'statBonus'; stat: StatKey; value: number }
  | { kind: 'fatigueCost'; value: number }
  | { kind: 'jointCost'; value: number }
  | { kind: 'recovery'; value: number }
  | { kind: 'reachComp'; value: number }
  | { kind: 'revealChance'; value: number }
  | { kind: 'injuryWarn'; value: number }
  | { kind: 'wallAffinity'; wall: WallType; value: number }

export type SkillBranch = 'technician' | 'power' | 'wellness'

export interface Skill {
  id: string
  branch: SkillBranch
  name: string
  desc: string
  tier: number
  requires?: string
  cost: number
  effects: SkillEffect[]
}

export interface NpcPerk { at: number; effect: SkillEffect; desc: string }

export interface Npc {
  id: string
  name: string
  emoji: string
  role: string
  intro: string
  lines: { greet: string; high: string; low: string }
  perks: NpcPerk[]
}

// ---------- 플레이어 상태 ----------
export interface Condition {
  hp: number
  fatigue: number
  mood: number
  joints: Record<JointKey, number>
}

export interface Climber {
  name: string
  gender: Gender
  /** null = 미설정 (기존 세이브). 임의의 나이를 확정하지 않는다. */
  age: number | null
  /** 표시용 키(cm). 판정에는 쓰지 않는다 — reach와 중복 적용 금지. */
  height: number
  appearance: Appearance
  /** 이 캐릭터를 만든 시드. 같은 시드 + 같은 성별/나이 = 같은 캐릭터 */
  seed: number
  specialtyId: string
  personalityId: string
  intro: string
  title: string
  reach: ReachTrait
  level: number
  exp: number
  stats: Record<StatKey, number>
  statExp: Record<StatKey, number>
  mastery: Record<MoveKey, number>
  condition: Condition
  skillPoints: number
  skills: string[]
  money: number
  /** TEMP: 장비 시스템 미구현. 타입/저장 자리만 확보. */
  equipment: string[]
}

export interface ScheduleState {
  week: number
  dayIndex: number // 0=월 … 6=일
  days: (string | null)[] // activityId
}

export interface ProblemRecord {
  attempts: number
  cleared: boolean
  onsight: boolean
  bestGradeCleared?: number
}

export interface LogEntry { at: number; icon: string; text: string }

export interface DayResult {
  week: number
  dayIndex: number
  activityId: string | null
  activityName: string
  lines: string[]
  money: number
  exp: number
}

export interface OfflineReport {
  awayMs: number
  cappedMs: number
  daysRun: number
  results: DayResult[]
  totalMoney: number
  totalExp: number
  fatigueDelta: number
  hpDelta: number
  jointDelta: Record<JointKey, number>
  unlocked: string[]
  levelUps: number
}

/** 온보딩 진행 중 임시 상태. 마지막 확인 전까지 본 세이브를 덮어쓰지 않는다. */
export interface OnboardingDraft {
  step: 1 | 2 | 3 | 4
  nickname: string
  gender: Gender
  age: number
  seed: number
  gymId: string | null
}

export interface GameSettings {
  fastMode: boolean
  devTimeScale: number
}

export interface GameState {
  version: number
  /** 온보딩(캐릭터 생성)을 마쳤는가. 기존 세이브는 마이그레이션에서 true가 된다. */
  onboardingCompleted: boolean
  climber: Climber
  /** 지금 있는 암장 */
  gymId: string
  /** 소속 홈짐 (돈을 내면 바꿀 수 있다) */
  homeGymId: string
  schedule: ScheduleState
  clock: { createdAt: number; lastTickAt: number; bonusMs: number }
  records: Record<string, ProblemRecord>
  npc: Record<string, number>
  achievements: string[]
  log: LogEntry[]
  settings: GameSettings
  directPlayCount: number
  pendingReport: OfflineReport | null

  // ---- 업데이트 #3: 전체 시스템 뼈대 ----
  /** 누적 플레이 기록. 이벤트 스파인이 갱신한다 */
  stats: PlayStats
  /** 도감 — 발견한 것들 */
  collection: CollectionState
  quests: QuestState
  /** 업적별 목표 진행도 (달성 전) */
  achievementProgress: Record<string, number[]>
  titles: string[]
  equippedTitle: string | null
  world: WorldState
  inventory: InventoryState
  /** 알바 커리어 숙련도 */
  career: Record<string, number>
  /** 프로젝트 문제 진척도 */
  projects: Record<string, ProjectProgress>
  competitionRecords: CompetitionRecord[]
  crew: CrewState
  seasonId: string
  /** 상점 구매 이력 (재고 제한용) */
  shopBought: Record<string, number>
}

/** 프로젝트 문제 — 한 번에 못 풀어도 진척이 남는다 */
export interface ProjectProgress {
  problemId: string
  /** 가장 멀리 간 동작 인덱스 */
  bestStep: number
  attempts: number
  /** 발견한 베타 (선택지 id) */
  knownBetas: string[]
  /** 누적 이해도 0~100. 다음 시도 성공률에 작은 보정을 준다 */
  understanding: number
}

// ---------- 판정 ----------
export interface ClimbModifiers {
  moveChance: Partial<Record<MoveKey, number>>
  statBonus: Partial<Record<StatKey, number>>
  fatigueCost: number
  jointCost: number
  recovery: number
  reachComp: number
  revealChance: number
  injuryWarn: number
  wallAffinity: Partial<Record<WallType, number>>
}

export interface StepContext {
  climber: Climber
  problem: ClimbingProblem
  mods: ClimbModifiers
}

export interface StepResult {
  outcome: Outcome
  chance: number
  roll: number
  luckShift: number
  luckyEvent: boolean
  text: string
  pose: PoseKey
  cost: { hp: number; fatigue: number; joints: Partial<Record<JointKey, number>> }
  masteryGain: Partial<Record<MoveKey, number>>
  injuryRisk: number
}

// ================================================================
// 전체 시스템 뼈대 (업데이트 #3)
// ================================================================

// ---------------- 이벤트 스파인 ----------------
/**
 * 게임에서 일어난 사실. 퀘스트·업적·도감·기록은 전부 이 이벤트만 보고 판정한다.
 * 화면이 "완료했다"고 직접 제출하지 못하게 하기 위한 구조다.
 */
export type GameEvent =
  | { t: 'climb.attempt'; problemId: string; gymId: string; grade: number }
  | { t: 'climb.clear'; problemId: string; gymId: string; grade: number; onsight: boolean; flash: boolean }
  | { t: 'climb.fall'; problemId: string; gymId: string }
  | { t: 'move.used'; move: MoveKey }
  | { t: 'activity.done'; activityId: string; kind: ActivityKind }
  | { t: 'money.earn'; amount: number; source: string }
  | { t: 'money.spend'; amount: number; sink: string }
  | { t: 'npc.talk'; npcId: string }
  | { t: 'npc.friendship'; npcId: string; value: number }
  | { t: 'gym.visit'; gymId: string }
  | { t: 'region.unlock'; regionId: string }
  | { t: 'item.get'; itemId: string }
  | { t: 'item.equip'; itemId: string; slot: EquipSlot }
  | { t: 'injury'; joint: JointKey }
  | { t: 'healthy.week' }
  | { t: 'expedition.done'; regionId: string; gymId: string }
  | { t: 'competition.done'; competitionId: string; tier: string }
  | { t: 'level.up'; level: number }
  | { t: 'skill.learn'; skillId: string }

// ---------------- 월드 / 지역 ----------------
export interface UnlockRule {
  level?: number
  money?: number
  clears?: number
  visitedGyms?: number
  fame?: number
  regions?: string[]
  quests?: string[]
  npcFriendship?: Record<string, number>
  /** 아직 콘텐츠가 없어 열 수 없는 지역 */
  comingSoon?: boolean
}

export interface Region {
  id: string
  displayName: string
  order: number
  /** 상위 묶음 (부산·경남 → 국내, 아시아 → 해외) */
  tier: 'home' | 'domestic' | 'overseas' | 'world'
  blurb: string
  unlock: UnlockRule
  /** 원정 비용(원). 홈 지역은 0 */
  travelCost: number
  /** 원정에 드는 게임 내 일수 */
  travelDays: number
  reward?: { exp: number; money: number; title?: string; badge?: string }
}

export interface WorldState {
  /** 방문한 적 있는 암장 */
  visitedGyms: string[]
  /** 해금된 지역 */
  unlockedRegions: string[]
  /** 지역별 친숙도 0~100 */
  regionFamiliarity: Record<string, number>
  /** 암장별 친숙도 0~100 */
  gymFamiliarity: Record<string, number>
  /** 완료한 원정 */
  expeditions: string[]
  /** 획득한 기념 배지 */
  badges: string[]
  /** 명성 — 대회·원정·업적으로 오른다 */
  fame: number
}

// ---------------- 장비 ----------------
export type EquipSlot = 'shoes' | 'chalkbag' | 'chalk' | 'tape' | 'apparel' | 'accessory'

export interface EquipmentItem {
  id: string
  name: string
  slot: EquipSlot
  desc: string
  /** 표시용 도트 색 */
  color: string
  price: number
  /** 되팔 때 받는 비율 */
  sellRatio: number
  effects: SkillEffect[]
  /** 소모품이면 수량형 */
  stackable: boolean
  source: string
  /** 준비만 해둔 필드 — 이번 단계에서는 쓰지 않는다 */
  durability?: number
  upgradeLevel?: number
}

export interface InventoryEntry {
  itemId: string
  qty: number
  isNew: boolean
  gotAt: number
}

export interface InventoryState {
  items: InventoryEntry[]
  equipped: Partial<Record<EquipSlot, string>>
  /** 레벨로 해금되는 슬롯 */
  unlockedSlots: EquipSlot[]
}

// ---------------- 상점 ----------------
export interface ShopEntry {
  itemId: string
  /** null이면 무제한 */
  stock: number | null
  unlock?: UnlockRule
}

export interface Shop {
  id: string
  name: string
  gymId: string | null
  blurb: string
  entries: ShopEntry[]
}

// ---------------- 퀘스트 ----------------
export type QuestKind = 'tutorial' | 'daily' | 'weekly' | 'story' | 'npc' | 'gym' | 'expedition' | 'growth'

/** 목표 = 특정 이벤트를 N번. 조건이 있으면 그 이벤트에서만 센다. */
export interface QuestGoal {
  event: GameEvent['t']
  count: number
  /** 이벤트 필드가 이 값과 같아야 센다 */
  match?: Record<string, string | number | boolean>
  /** 숫자 필드의 누적 합으로 셀 때 (예: money.earn의 amount) */
  sumField?: string
  label: string
}

export interface Quest {
  id: string
  kind: QuestKind
  name: string
  desc: string
  goals: QuestGoal[]
  reward: { exp?: number; money?: number; itemId?: string; title?: string; fame?: number; skillPoint?: number }
  unlock?: UnlockRule
  npcId?: string
  /** 완료 후 자동으로 열리는 다음 퀘스트 */
  next?: string
}

export interface QuestProgress {
  questId: string
  counts: number[]
  completed: boolean
  /** 보상을 이미 받았는가 — 중복 수령 방지 */
  claimed: boolean
  startedAt: number
}

export interface QuestState {
  active: QuestProgress[]
  done: string[]
  /** 일일/주간 갱신 기준 */
  dailySeed: number
  dailyPicked: string[]
  weeklyPicked: string[]
  lastDailyDay: number
  lastWeeklyWeek: number
}

// ---------------- 칭호 · 업적 · 도감 ----------------
export interface Achievement {
  id: string
  name: string
  desc: string
  goals: QuestGoal[]
  reward?: { title?: string; fame?: number; money?: number }
  hidden?: boolean
}

export interface Title {
  id: string
  name: string
  desc: string
  /** 대부분은 수집용. 작은 효과가 붙을 수 있다 */
  effect?: SkillEffect
}

export type CollectionKind = 'problem' | 'gym' | 'npc' | 'equipment'

export interface CollectionState {
  problem: string[]
  gym: string[]
  npc: string[]
  equipment: string[]
}

// ---------------- 커리어 (알바) ----------------
export interface CareerTrack {
  id: string
  name: string
  tier: 'entry' | 'mid' | 'senior'
  activityId: string
  desc: string
  /** 이 숙련도에 도달하면 다음 알바가 열린다 */
  unlockAt: number
  requires?: string
}

// ---------------- 시즌 · 대회 ----------------
export interface Season {
  id: string
  name: string
  blurb: string
  /** 로컬 모드에서는 표시만. 서버 연결 후 실제 시각으로 대체된다 */
  weeks: number
  questIds: string[]
  titleId?: string
}

export interface Competition {
  id: string
  name: string
  gymId: string
  blurb: string
  entryFee: number
  unlock: UnlockRule
  /** 도전할 문제 id들 */
  problemIds: string[]
  /** 점수 구간별 등급과 보상 */
  tiers: { minScore: number; tier: string; money: number; fame: number; title?: string }[]
}

export interface CompetitionRecord {
  competitionId: string
  bestScore: number
  bestTier: string
  entries: number
  lastAt: number
}

// ---------------- 기록 · 통계 ----------------
export interface PlayStats {
  days: number
  attempts: number
  clears: number
  onsights: number
  flashes: number
  falls: number
  bestGrade: number
  moveUse: Partial<Record<MoveKey, number>>
  gymVisits: Record<string, number>
  gymClears: Record<string, number>
  jobs: number
  earned: number
  spent: number
  injuries: number
  rests: number
  expeditions: number
  itemsGained: number
  competitions: number
}

// ---------------- 크루 (서버 필요) ----------------
export interface CrewMemberView {
  id: string
  name: string
  level: number
  weeklyContribution: number
  role: 'owner' | 'member'
}

export interface CrewState {
  /** 로컬 모드에서는 항상 null — 서버 연결 후 실제 크루가 들어온다 */
  crewId: string | null
  name: string | null
}

// ---------------- 랭킹 (서버 필요) ----------------
export interface RankingCategory {
  id: string
  name: string
  desc: string
  /** 내 예상 점수 계산 — 서버에서 같은 식으로 재계산한다 */
  score: (s: GameState) => number
}

// ---------------- 홈짐 일일 상태 ----------------
export interface GymDayState {
  gymId: string
  /** 몇 번째 게임 내 일자의 상태인가 */
  day: number
  crowd: 'quiet' | 'normal' | 'busy'
  freshSet: boolean
  note: string
}
