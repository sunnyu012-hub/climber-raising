import type { EquipmentItem, EquipSlot } from '../game/types'

/**
 * 장비. 효과는 스킬과 같은 `SkillEffect`라서 그대로 등반 판정·회복에 들어간다.
 * 장식용 장비를 만들지 마라 — `effects`가 빈 배열이면 콘텐츠 검사가 경고한다.
 *
 * `durability` / `upgradeLevel`은 **필드만 준비**했다. 이번 단계에서는 쓰지 않는다.
 */

export const SLOT_LABEL: Record<EquipSlot, string> = {
  shoes: '암벽화',
  chalkbag: '초크백',
  chalk: '초크',
  tape: '테이프',
  apparel: '의류',
  accessory: '액세서리',
}

export const SLOT_ORDER: EquipSlot[] = ['shoes', 'chalkbag', 'chalk', 'tape', 'apparel', 'accessory']

/** 레벨로 열리는 슬롯. 처음에는 암벽화·초크백만. */
export const SLOT_UNLOCK_LEVEL: Record<EquipSlot, number> = {
  shoes: 1,
  chalkbag: 1,
  chalk: 2,
  tape: 4,
  apparel: 6,
  accessory: 9,
}

export const EQUIPMENT: EquipmentItem[] = [
  {
    id: 'shoes-beginner',
    name: '입문용 암벽화',
    slot: 'shoes',
    desc: '발이 안 아픈 게 제일 큰 장점. 발끝 감각은 기대하지 말자.',
    color: '#8a7a6d',
    price: 90000,
    sellRatio: 0.4,
    effects: [{ kind: 'moveChance', move: 'footswap', value: 0.03 }],
    stackable: false,
    source: '암장 프로숍',
  },
  {
    id: 'shoes-technical',
    name: '테크니컬 암벽화',
    slot: 'shoes',
    desc: '작은 발홀드가 다르게 보인다. 대신 30분만 신어도 발이 운다.',
    color: '#c9553f',
    price: 240000,
    sellRatio: 0.4,
    effects: [
      { kind: 'moveChance', move: 'footswap', value: 0.06 },
      { kind: 'moveChance', move: 'highstep', value: 0.05 },
      { kind: 'moveChance', move: 'heelhook', value: 0.05 },
      { kind: 'wallAffinity', wall: '슬랩', value: 0.04 },
    ],
    stackable: false,
    source: '암장 프로숍',
  },
  {
    id: 'chalkbag-basic',
    name: '기본 초크백',
    slot: 'chalkbag',
    desc: '허리에 차는 평범한 초크백. 있으면 확실히 편하다.',
    color: '#d9b06a',
    price: 35000,
    sellRatio: 0.4,
    effects: [{ kind: 'moveChance', move: 'chalk', value: 0.04 }],
    stackable: false,
    source: '암장 프로숍',
  },
  {
    id: 'chalk-friction',
    name: '마찰력 초크',
    slot: 'chalk',
    desc: '손에 오래 남는다. 여름에 특히 티가 난다.',
    color: '#f0ece2',
    price: 22000,
    sellRatio: 0.3,
    effects: [
      { kind: 'moveChance', move: 'chalk', value: 0.05 },
      { kind: 'moveChance', move: 'lockoff', value: 0.03 },
    ],
    stackable: true,
    source: '암장 프로숍',
  },
  {
    id: 'tape-joint',
    name: '관절 테이프',
    slot: 'tape',
    desc: '손가락에 감으면 심리적으로도 든든하다.',
    color: '#e8e0d0',
    price: 18000,
    sellRatio: 0.3,
    effects: [{ kind: 'jointCost', value: 0.9 }],
    stackable: true,
    source: '암장 프로숍',
  },
  {
    id: 'apparel-tee',
    name: '암장 로고 티셔츠',
    slot: 'apparel',
    desc: '입고 가면 사람들이 아는 척을 해준다.',
    color: '#8faa86',
    price: 45000,
    sellRatio: 0.35,
    effects: [{ kind: 'statBonus', stat: 'social', value: 1 }],
    stackable: false,
    source: '암장 프로숍',
  },
  {
    id: 'accessory-brush',
    name: '홀드 브러시',
    slot: 'accessory',
    desc: '홀드를 닦고 붙으면 확실히 다르다. 매너이기도 하다.',
    color: '#a98d6b',
    price: 15000,
    sellRatio: 0.3,
    effects: [
      { kind: 'moveChance', move: 'intermediate', value: 0.03 },
      { kind: 'statBonus', stat: 'luck', value: 1 },
    ],
    stackable: false,
    source: '암장 프로숍',
  },
  {
    id: 'accessory-badge',
    name: '첫 원정 기념 배지',
    slot: 'accessory',
    desc: '클리프사이드에서 받은 배지. 별건 아닌데 자랑스럽다.',
    color: '#b49bc8',
    price: 0,
    sellRatio: 0,
    effects: [{ kind: 'statBonus', stat: 'mental', value: 1 }],
    stackable: false,
    source: '부산 원정 보상',
  },
]

export const getItem = (id: string): EquipmentItem | undefined =>
  EQUIPMENT.find((e) => e.id === id)
