import type { Achievement, CareerTrack, Competition, Season, Title } from '../game/types'

/**
 * 장기 진행 콘텐츠 — 업적 · 칭호 · 커리어 · 시즌 · 대회.
 * 업적과 퀘스트는 같은 `QuestGoal` 문법을 쓴다(이벤트 기반 자동 판정).
 */

// ---------------- 칭호 ----------------
export const TITLES: Title[] = [
  { id: 'title-rookie', name: '오늘부터 클라이머', desc: '시작한 사람에게' },
  { id: 'title-first-top', name: '첫 탑', desc: '처음으로 탑 홀드를 잡았다' },
  { id: 'title-busan-tour', name: '부산 한 바퀴', desc: '웨이브락 세 지점을 전부 방문했다' },
  { id: 'title-first-expedition', name: '원정 다녀온 사람', desc: '첫 원정을 마쳤다', effect: { kind: 'statBonus', stat: 'mental', value: 1 } },
  { id: 'title-setter-friend', name: '세터의 친구', desc: '지훈 씨와 친해졌다', effect: { kind: 'statBonus', stat: 'routefinding', value: 1 } },
  { id: 'title-short-reach', name: '리치는 핑계였다', desc: '짧은 리치로 먼 홀드 문제를 완등했다', effect: { kind: 'reachComp', value: 0.1 } },
  { id: 'title-healthy', name: '철벽 관절', desc: '일주일 동안 다치지 않았다', effect: { kind: 'jointCost', value: 0.97 } },
  { id: 'title-shopper', name: '장비병 입문', desc: '첫 장비를 샀다' },
  { id: 'title-competitor', name: '대회 나가본 사람', desc: '미니대회에 참가했다' },
]

export const getTitle = (id: string): Title | undefined => TITLES.find((t) => t.id === id)

// ---------------- 업적 ----------------
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-clear', name: '첫 완등', desc: '처음으로 문제를 완등했다',
    goals: [{ event: 'climb.clear', count: 1, label: '완등' }],
    reward: { title: 'title-first-top', fame: 5 },
  },
  {
    id: 'ach-first-fall', name: '첫 추락', desc: '매트는 생각보다 푹신하다',
    goals: [{ event: 'climb.fall', count: 1, label: '추락' }],
  },
  {
    id: 'ach-first-onsight', name: '첫 원트', desc: '한 번에 올라갔다',
    goals: [{ event: 'climb.clear', count: 1, match: { flash: true }, label: '원트 완등' }],
    reward: { fame: 10 },
  },
  {
    id: 'ach-first-job', name: '첫 알바', desc: '클라이밍으로 돈을 벌기 시작했다',
    goals: [{ event: 'activity.done', count: 1, match: { kind: 'job' }, label: '알바' }],
  },
  {
    id: 'ach-healthy-week', name: '부상 없는 일주일', desc: '일주일 내내 몸이 멀쩡했다',
    goals: [{ event: 'healthy.week', count: 1, label: '건강한 한 주' }],
    reward: { title: 'title-healthy', fame: 10 },
  },
  {
    id: 'ach-three-gyms', name: '웨이브락 3지점', desc: '세 지점을 전부 방문했다',
    goals: [{ event: 'gym.visit', count: 3, label: '지점 방문' }],
    reward: { title: 'title-busan-tour', fame: 20 },
  },
  {
    id: 'ach-first-buy', name: '장비 첫 구매', desc: '드디어 내 장비가 생겼다',
    goals: [{ event: 'item.get', count: 1, label: '장비 획득' }],
    reward: { title: 'title-shopper' },
  },
  {
    id: 'ach-first-expedition', name: '부산 원정 완료', desc: '홈짐 밖으로 나가봤다',
    goals: [{ event: 'expedition.done', count: 1, label: '원정' }],
    reward: { fame: 30 },
  },
  {
    id: 'ach-competition', name: '대회 참가', desc: '미니대회에 나갔다',
    goals: [{ event: 'competition.done', count: 1, label: '대회 참가' }],
    reward: { title: 'title-competitor', fame: 15 },
  },
  {
    id: 'ach-ten-clears', name: '열 문제', desc: '완등 10개를 채웠다',
    goals: [{ event: 'climb.clear', count: 10, label: '완등' }],
    reward: { fame: 25, money: 50000 },
  },
]

export const getAchievement = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id)

// ---------------- 알바 커리어 ----------------
/**
 * 알바를 반복하면 커리어 숙련도가 쌓이고 다음 알바가 열린다.
 * 이번 단계에서는 초급 3종 + 중급 1종(루트 세팅 보조)까지 실제 작동한다.
 */
export const CAREERS: CareerTrack[] = [
  { id: 'car-wash', name: '홀드 세척', tier: 'entry', activityId: 'job-wash', desc: '누구나 시작할 수 있는 일', unlockAt: 0 },
  { id: 'car-strip', name: '탈거 보조', tier: 'entry', activityId: 'job-strip', desc: '몸은 힘들지만 돈이 된다', unlockAt: 0 },
  { id: 'car-lesson', name: '레슨 보조', tier: 'entry', activityId: 'job-lesson', desc: '가르치면서 배운다', unlockAt: 0 },
  {
    id: 'car-setting', name: '루트 세팅 보조', tier: 'mid', activityId: 'job-setting',
    desc: '세터 옆에서 홀드를 붙인다. 문제를 보는 눈이 달라진다',
    unlockAt: 30, requires: 'car-strip',
  },
  // ---- 아래는 골격만. activityId가 아직 없으므로 콘텐츠 검사가 "준비 중"으로 표시한다 ----
  { id: 'car-comp-staff', name: '대회 운영', tier: 'mid', activityId: '', desc: '준비 중', unlockAt: 60, requires: 'car-lesson' },
  { id: 'car-film', name: '촬영 보조', tier: 'mid', activityId: '', desc: '준비 중', unlockAt: 60, requires: 'car-wash' },
  { id: 'car-repair', name: '암벽화 수선', tier: 'mid', activityId: '', desc: '준비 중', unlockAt: 60 },
  { id: 'car-private', name: '개인 레슨', tier: 'senior', activityId: '', desc: '준비 중', unlockAt: 100, requires: 'car-lesson' },
  { id: 'car-setter', name: '루트 세터', tier: 'senior', activityId: '', desc: '준비 중', unlockAt: 100, requires: 'car-setting' },
  { id: 'car-creator', name: '콘텐츠 크리에이터', tier: 'senior', activityId: '', desc: '준비 중', unlockAt: 100, requires: 'car-film' },
  { id: 'car-sponsor', name: '브랜드 협찬', tier: 'senior', activityId: '', desc: '준비 중', unlockAt: 150 },
  { id: 'car-pro', name: '프로 클라이머', tier: 'senior', activityId: '', desc: '준비 중', unlockAt: 200, requires: 'car-sponsor' },
]

export const getCareer = (id: string): CareerTrack | undefined => CAREERS.find((c) => c.id === id)
export const careerOfActivity = (activityId: string): CareerTrack | undefined =>
  CAREERS.find((c) => c.activityId === activityId)

export const TIER_LABEL: Record<CareerTrack['tier'], string> = {
  entry: '초급', mid: '중급', senior: '고급',
}

// ---------------- 시즌 ----------------
/**
 * 시즌은 구조만 준비했다. 실제 시작·종료 시각은 **서버가 정한다** —
 * 로컬 시간으로 시즌을 굴리면 조작할 수 있기 때문이다.
 */
export const SEASONS: Season[] = [
  {
    id: 'season-0',
    name: '프리시즌 · 부산',
    blurb: '아직 아무도 모르는 시절. 기록은 남는다.',
    weeks: 8,
    questIds: ['weekly-clears', 'weekly-money'],
    titleId: 'title-rookie',
  },
]

export const CURRENT_SEASON_ID = 'season-0'

// ---------------- 대회 ----------------
export const COMPETITIONS: Competition[] = [
  {
    id: 'comp-waverock-mini',
    name: '웨이브락 미니대회',
    gymId: 'waverock-seomyeon',
    blurb: '지점 단위 소규모 대회. 문제 3개를 붙고 성과로 등급이 갈린다.',
    entryFee: 20000,
    unlock: { level: 4, clears: 3 },
    problemIds: ['wl-001', 'wl-002', 'wl-004'],
    tiers: [
      { minScore: 0, tier: '참가', money: 0, fame: 3 },
      { minScore: 40, tier: '동메달', money: 30000, fame: 12 },
      { minScore: 70, tier: '은메달', money: 80000, fame: 25 },
      { minScore: 95, tier: '금메달', money: 200000, fame: 50, title: 'title-competitor' },
    ],
  },
]

export const getCompetition = (id: string): Competition | undefined =>
  COMPETITIONS.find((c) => c.id === id)
