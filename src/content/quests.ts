import type { Quest } from '../game/types'

/**
 * 퀘스트.
 *
 * **목표는 게임 이벤트로만 판정한다.** 화면이 "완료했다"고 제출하는 구조가 아니다 —
 * `game/events.ts`의 `emit()`이 흘려보내는 이벤트를 세서 자동으로 진행된다.
 *
 * `goals[].event`는 `GameEvent['t']` 값이고, `match`를 주면 그 필드가 일치할 때만 센다.
 * `sumField`를 주면 횟수 대신 그 숫자 필드를 누적한다(예: 돈 벌기).
 */
export const QUESTS: Quest[] = [
  // ---------------- 튜토리얼 ----------------
  {
    id: 'tut-first-climb',
    kind: 'tutorial',
    name: '일단 붙어보기',
    desc: '아무 문제나 하나 붙어봐요. 떨어져도 괜찮아요.',
    goals: [{ event: 'climb.attempt', count: 1, label: '문제 도전' }],
    reward: { exp: 40, money: 10000 },
    next: 'tut-first-clear',
  },
  {
    id: 'tut-first-clear',
    kind: 'tutorial',
    name: '첫 완등',
    desc: '탑 홀드를 잡아봐요. 그 기분은 처음이 제일 좋아요.',
    goals: [{ event: 'climb.clear', count: 1, label: '완등' }],
    reward: { exp: 80, money: 20000, title: 'title-first-top' },
    next: 'tut-first-job',
  },
  {
    id: 'tut-first-job',
    kind: 'tutorial',
    name: '암벽화 살 돈 모으기',
    desc: '알바를 한 번 해봐요. 장비는 생각보다 비싸요.',
    goals: [{ event: 'activity.done', count: 1, match: { kind: 'job' }, label: '알바 하루' }],
    reward: { exp: 60, money: 30000, skillPoint: 1 },
  },

  // ---------------- 일일 (3개 중 랜덤 2개) ----------------
  {
    id: 'daily-attempt',
    kind: 'daily',
    name: '오늘의 도전',
    desc: '오늘 문제를 두 번 붙어봐요.',
    goals: [{ event: 'climb.attempt', count: 2, label: '문제 도전' }],
    reward: { exp: 30, money: 8000 },
  },
  {
    id: 'daily-move',
    kind: 'daily',
    name: '하이스텝 연습',
    desc: '하이스텝을 세 번 써봐요.',
    goals: [{ event: 'move.used', count: 3, match: { move: 'highstep' }, label: '하이스텝 사용' }],
    reward: { exp: 35, money: 6000 },
  },
  {
    id: 'daily-rest',
    kind: 'daily',
    name: '쉬는 것도 훈련',
    desc: '회복 일정을 하루 소화해요.',
    goals: [{ event: 'activity.done', count: 1, match: { kind: 'rest' }, label: '휴식 하루' }],
    reward: { exp: 25, money: 5000 },
  },

  // ---------------- 주간 ----------------
  {
    id: 'weekly-clears',
    kind: 'weekly',
    name: '이번 주 세 개',
    desc: '이번 주에 세 문제를 완등해요.',
    goals: [{ event: 'climb.clear', count: 3, label: '완등' }],
    reward: { exp: 150, money: 40000, fame: 10 },
  },
  {
    id: 'weekly-money',
    kind: 'weekly',
    name: '생활비 벌기',
    desc: '이번 주에 10만 원을 벌어요.',
    goals: [{ event: 'money.earn', count: 100000, sumField: 'amount', label: '수입' }],
    reward: { exp: 120, money: 0, fame: 5 },
  },

  // ---------------- NPC ----------------
  {
    id: 'npc-setter-favor',
    kind: 'npc',
    name: '세터의 작은 부탁',
    desc: '지훈 씨가 새로 깐 문제를 아무나 붙어봐 달래요. 다섯 번 도전하면 돼요.',
    npcId: 'setter',
    goals: [{ event: 'climb.attempt', count: 5, label: '문제 도전' }],
    reward: { exp: 120, money: 25000, fame: 8 },
    unlock: { npcFriendship: { setter: 15 } },
    next: 'npc-setter-beta',
  },
  {
    id: 'npc-setter-beta',
    kind: 'npc',
    name: '지훈 씨의 베타 노트',
    desc: '이제 친해졌으니 베타를 알려주겠대요. 두 문제만 더 완등하면요.',
    npcId: 'setter',
    goals: [{ event: 'climb.clear', count: 2, label: '완등' }],
    reward: { exp: 200, money: 0, title: 'title-setter-friend', fame: 15 },
    unlock: { npcFriendship: { setter: 30 } },
  },

  // ---------------- 원정 ----------------
  {
    id: 'exp-busan-tour',
    kind: 'expedition',
    name: '웨이브락 세 지점 돌기',
    desc: '서면·남천·부산대를 전부 가봐요. 다 돌면 소문으로만 듣던 암장이 열려요.',
    goals: [{ event: 'gym.visit', count: 3, label: '지점 방문' }],
    reward: { exp: 200, money: 0, fame: 20, title: 'title-busan-tour' },
  },
  {
    id: 'exp-cliffside',
    kind: 'expedition',
    name: '클리프사이드 원정',
    desc: '부산 외곽의 독립 암장에 다녀와요. 문제가 독하다니 각오하고요.',
    goals: [{ event: 'expedition.done', count: 1, match: { gymId: 'busan-cliffside' }, label: '원정 완료' }],
    reward: { exp: 400, money: 0, itemId: 'accessory-badge', fame: 40, title: 'title-first-expedition' },
    unlock: { visitedGyms: 3 },
  },
]

export const getQuest = (id: string): Quest | undefined => QUESTS.find((q) => q.id === id)

export const questsOfKind = (kind: Quest['kind']): Quest[] =>
  QUESTS.filter((q) => q.kind === kind)

export const KIND_LABEL: Record<Quest['kind'], string> = {
  tutorial: '튜토리얼',
  daily: '일일',
  weekly: '주간',
  story: '스토리',
  npc: 'NPC',
  gym: '암장',
  expedition: '원정',
  growth: '성장',
}
