import type { Npc } from '../game/types'

export const NPCS: Npc[] = [
  {
    id: 'owner',
    name: '웨이브락 사장님',
    emoji: '🧔',
    role: '암장 사장',
    intro: '수건 던져주면서 "천천히 해요, 손가락은 하나뿐이니까"라고 말하는 사람.',
    lines: {
      greet: '어서 와요. 오늘 슬랩 새로 깔았어요.',
      high: '이제 우리 암장 사람이네. 홀드 세척비 좀 올려줄게요.',
      low: '신발은 잘 맞아요? 발 아프면 바로 벗어요.',
    },
    perks: [
      { at: 20, effect: { kind: 'recovery', value: 1.05 }, desc: '친밀도 20 — 암장 소파를 내줍니다. 회복 +5%' },
      { at: 50, effect: { kind: 'statBonus', stat: 'social', value: 1 }, desc: '친밀도 50 — 단골 대우. 인맥 +1' },
    ],
  },
  {
    id: 'setter',
    name: '세터 지훈',
    emoji: '🔧',
    role: '루트 세터',
    intro: '문제를 깔고 나서 사람들이 어디서 막히는지 구경하는 게 취미.',
    lines: {
      greet: '이번 주 노랑, 좀 얄궂게 깔았어요.',
      high: '아, 그 문제요? 두 번째 홀드에서 몸 낮추면 돼요. 비밀입니다.',
      low: '음… 힌트는 좀 더 친해지면요.',
    },
    perks: [
      { at: 25, effect: { kind: 'statBonus', stat: 'routefinding', value: 1 }, desc: '친밀도 25 — 세팅 의도를 설명해줍니다. 루트파인딩 +1' },
      { at: 45, effect: { kind: 'revealChance', value: 1 }, desc: '친밀도 45 — 베타를 미리 흘려줍니다. 정확한 성공률 공개' },
    ],
  },
  {
    id: 'veteran',
    name: '고인물 은서',
    emoji: '🧗',
    role: '10년째 같은 암장',
    intro: '평일 저녁 8시면 항상 그 자리에 있다. 조언은 대체로 맞다.',
    lines: {
      greet: '워밍업 했어요? 안 했죠? 티 나요.',
      high: '오늘 그 무브 좋았어요. 진짜로.',
      low: '어… 거긴 그냥 힘으로 가는 데예요. 아마도.',
    },
    perks: [
      { at: 20, effect: { kind: 'statBonus', stat: 'mental', value: 1 }, desc: '친밀도 20 — 옆에서 응원해줍니다. 멘탈 +1' },
      { at: 40, effect: { kind: 'moveChance', move: 'flagging', value: 0.04 }, desc: '친밀도 40 — 플래깅을 잡아줍니다. 플래깅 +4%p' },
    ],
  },
]

export const getNpc = (id: string): Npc | undefined => NPCS.find((n) => n.id === id)
