import type { ActivityDefinition } from '../game/types'

/**
 * 하루 1개 활동. 여기에 객체를 추가하면 일정 편성 화면에 자동으로 나타난다.
 * hp/fatigue/mood/joints 는 "변화량"이다(음수 = 감소).
 */
export const ACTIVITIES: ActivityDefinition[] = [
  // ---------- 훈련 ----------
  {
    id: 'train-boulder',
    name: '볼더링 훈련',
    kind: 'train', icon: '🧗', desc: '문제 붙잡고 씨름한다. 제일 많이 늘고 제일 많이 축난다.',
    hp: -22, fatigue: 16, mood: 4,
    joints: { finger: -4, shoulder: -3, knee: -2 },
    statExp: { technique: 26, power: 16, routefinding: 10, mental: 6 },
    moveExp: { highstep: 3, flagging: 3, lockoff: 3 },
    money: 0, injuryRisk: 0.05, allowedWhenInjured: false,
    events: [
      { chance: 0.18, text: '옆 사람이 베타를 알려줬다. 되게 잘 통했다.', npcId: 'veteran', friendship: 3, mood: 3 },
      { chance: 0.10, text: '새로 깐 문제를 제일 먼저 붙어봤다. 세터가 흐뭇해한다.', npcId: 'setter', friendship: 3 },
    ],
  },
  {
    id: 'train-power',
    name: '근력 훈련',
    kind: 'train', icon: '🏋️', desc: '캠퍼스와 턱걸이. 손가락은 조심하자.',
    hp: -20, fatigue: 18, mood: -2,
    joints: { finger: -6, shoulder: -5 },
    statExp: { power: 32, stamina: 10 },
    moveExp: { lockoff: 4, dyno: 2 },
    money: 0, injuryRisk: 0.09, allowedWhenInjured: false,
    events: [
      { chance: 0.12, text: '어제보다 한 칸 더 잡혔다. 혼자 조용히 신났다.', mood: 6 },
    ],
  },
  {
    id: 'train-flex',
    name: '유연성 훈련',
    kind: 'train', icon: '🤸', desc: '스트레칭과 고관절. 지루하지만 하이스텝이 달라진다.',
    hp: -10, fatigue: 6, mood: 2,
    joints: { knee: 2, shoulder: 1 },
    statExp: { flexibility: 30, mental: 6 },
    moveExp: { highstep: 4, heelhook: 3 },
    money: 0, injuryRisk: 0.01, allowedWhenInjured: true,
    events: [
      { chance: 0.14, text: '드디어 발이 귀 옆까지 왔다. 사진을 찍어 크루방에 올렸다.', mood: 5 },
    ],
  },
  {
    id: 'train-route',
    name: '루트파인딩 공부',
    kind: 'train', icon: '🔍', desc: '영상 돌려보고 홀드 방향을 읽는다. 몸은 안 축난다.',
    hp: -5, fatigue: 2, mood: 0,
    joints: {},
    statExp: { routefinding: 30, mental: 10 },
    moveExp: { intermediate: 4 },
    money: 0, injuryRisk: 0, allowedWhenInjured: true,
    events: [
      { chance: 0.15, text: '어제 막힌 문제의 답이 갑자기 보였다. 자기 전에 손이 근질거린다.', mood: 4 },
    ],
  },

  // ---------- 회복 ----------
  {
    id: 'rest-full',
    name: '완전 휴식',
    kind: 'rest', icon: '🛌', desc: '아무것도 안 한다. 이것도 훈련이다.',
    hp: 42, fatigue: -30, mood: 8,
    joints: { finger: 7, shoulder: 6, knee: 6 },
    statExp: {},
    money: 0, injuryRisk: 0, allowedWhenInjured: true,
    events: [
      { chance: 0.12, text: '누워서 클라이밍 영상만 봤다. 이게 휴식인가 훈련인가.', mood: 3 },
    ],
  },
  {
    id: 'rehab-finger',
    name: '손가락 재활',
    kind: 'rehab', icon: '🩹', desc: '고무밴드와 온찜질. 손가락이 고마워한다.',
    hp: 12, fatigue: -10, mood: -2,
    joints: { finger: 16, shoulder: 4 },
    statExp: { mental: 8 },
    money: -5000, injuryRisk: 0, allowedWhenInjured: true,
    events: [
      { chance: 0.15, text: '사장님이 "그거 나도 했었어요"라며 밴드를 하나 더 줬다.', npcId: 'owner', friendship: 3 },
    ],
  },

  // ---------- 알바 ----------
  {
    id: 'job-wash',
    name: '암장 홀드 세척 알바',
    kind: 'job', icon: '🧽', desc: '통에 담가 솔질. 손가락 부담은 적고 홀드를 눈으로 익힌다.',
    hp: -14, fatigue: 8, mood: -1,
    joints: { finger: -1 },
    statExp: { technique: 12, routefinding: 8 },
    money: 42000, injuryRisk: 0.005, allowedWhenInjured: true,
    events: [
      { chance: 0.2, text: '사장님이 저녁을 사줬다. 국밥이었다.', npcId: 'owner', friendship: 4, mood: 4 },
      { chance: 0.1, text: '세척하다 보니 이 홀드가 왜 미끄러웠는지 알겠다.', npcId: 'setter', friendship: 2 },
    ],
  },
  {
    id: 'job-strip',
    name: '암장 탈거 보조 알바',
    kind: 'job', icon: '🔩', desc: '벽에 붙은 홀드를 다 뜯는다. 돈은 되는데 몸이 아프다.',
    hp: -28, fatigue: 20, mood: -3,
    joints: { shoulder: -6, finger: -3 },
    statExp: { power: 16, social: 12 },
    money: 78000, injuryRisk: 0.04, allowedWhenInjured: false,
    events: [
      { chance: 0.3, text: '세터가 다음 세팅 컨셉을 미리 알려줬다.', npcId: 'setter', friendship: 6 },
      { chance: 0.08, text: '볼트를 하나 떨어뜨렸는데 아무도 못 봤다. 조용히 주웠다.', mood: -2 },
    ],
  },
  {
    id: 'job-lesson',
    name: '초보자 레슨 보조',
    kind: 'job', icon: '🙋', desc: '처음 온 사람들에게 매트 사용법부터 알려준다.',
    hp: -16, fatigue: 8, mood: 4,
    joints: {},
    statExp: { routefinding: 16, mental: 14, social: 16 },
    money: 55000, injuryRisk: 0.005, allowedWhenInjured: true,
    requires: { stats: { technique: 11 } },
    events: [
      { chance: 0.22, text: '가르치다 보니 내 베타가 왜 되는지 알겠다.', mood: 5 },
      { chance: 0.12, text: '수강생이 완등했다. 내가 더 기뻤다.', npcId: 'owner', friendship: 4, mood: 6 },
    ],
  },

  {
    id: 'job-setting',
    name: '루트 세팅 보조',
    kind: 'job', icon: '🔧', desc: '세터 옆에서 홀드를 붙인다. 문제를 보는 눈이 달라진다.',
    hp: -24, fatigue: 16, mood: 6,
    joints: { shoulder: -4, finger: -2 },
    statExp: { routefinding: 26, technique: 16, social: 10 },
    moveExp: { intermediate: 4 },
    money: 95000, injuryRisk: 0.02, allowedWhenInjured: false,
    requires: { friendship: { setter: 25 } },
    events: [
      { chance: 0.35, text: '내가 붙인 홀드로 누가 완등했다. 이상하게 뿌듯하다.', npcId: 'setter', friendship: 6, mood: 6 },
      { chance: 0.12, text: '세터가 "다음엔 한 문제 깔아볼래요?"라고 물었다.', npcId: 'setter', friendship: 8 },
    ],
  },

  // ---------- 회복 (식사) ----------
  {
    id: 'rest-meal',
    name: '잘 먹고 푹 자기',
    kind: 'rest', icon: '🍚', desc: '국밥 한 그릇과 이른 취침. 돈은 들지만 확실히 회복된다.',
    hp: 30, fatigue: -22, mood: 12,
    joints: { finger: 4, shoulder: 4, knee: 4 },
    statExp: {},
    money: -12000, injuryRisk: 0, allowedWhenInjured: true,
    events: [
      { chance: 0.18, text: '사장님이 단골이라고 계란을 하나 더 얹어줬다.', npcId: 'owner', friendship: 3, mood: 4 },
    ],
  },

  // ---------- 소셜 ----------
  {
    id: 'social-crew',
    name: '크루 교류',
    kind: 'social', icon: '🍻', desc: '같이 붙고 같이 먹는다. 의욕이 채워진다.',
    hp: -8, fatigue: 4, mood: 16,
    joints: {},
    statExp: { social: 24, mental: 10 },
    money: -18000, injuryRisk: 0.005, allowedWhenInjured: true,
    events: [
      { chance: 0.25, text: '은서 님이 자기 베타 노트를 보여줬다.', npcId: 'veteran', friendship: 7 },
      { chance: 0.15, text: '다음 달 원정 얘기가 나왔다. 아직은 듣기만 했다.', mood: 5 },
    ],
  },
]

export const getActivity = (id: string | null): ActivityDefinition | undefined =>
  id ? ACTIVITIES.find((a) => a.id === id) : undefined

export const KIND_LABEL: Record<string, string> = {
  train: '훈련', rest: '회복', rehab: '재활', job: '알바', social: '소셜',
}

/** 추천 편성 3종 — 일정 화면 버튼이 그대로 소비한다. */
export const PRESETS: { id: string; name: string; desc: string; days: string[] }[] = [
  {
    id: 'safe', name: '안전 성장',
    desc: '관절 지키면서 꾸준히',
    days: ['train-boulder', 'train-flex', 'rest-full', 'train-boulder', 'train-route', 'job-wash', 'rest-full'],
  },
  {
    id: 'money', name: '돈 집중',
    desc: '장비 사려면 벌어야지',
    days: ['job-strip', 'job-wash', 'rest-full', 'job-lesson', 'job-wash', 'train-boulder', 'rest-full'],
  },
  {
    id: 'skill', name: '실력 집중',
    desc: '몸은 나중에 생각한다',
    days: ['train-boulder', 'train-power', 'train-boulder', 'rest-full', 'train-power', 'train-boulder', 'train-flex'],
  },
]
