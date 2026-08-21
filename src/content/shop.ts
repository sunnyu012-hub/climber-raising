import type { Shop } from '../game/types'

/**
 * 상점 재고. 상품을 추가하려면 `entries`에 `itemId` 한 줄을 넣으면 된다
 * (아이템 자체는 `equipment.ts`에 먼저 만든다).
 *
 * `stock: null` = 무제한, 숫자 = 그 개수만 팔린다(비소모품은 1로 두면 하나만 살 수 있다).
 */
export const SHOPS: Shop[] = [
  {
    id: 'shop-waverock',
    name: '웨이브락 프로숍',
    gymId: null, // 웨이브락 어느 지점에서나 같은 물건을 판다
    blurb: '카운터 옆 진열장. 사장님이 직접 골라서 들여놓는다.',
    entries: [
      { itemId: 'shoes-beginner', stock: null },
      { itemId: 'chalkbag-basic', stock: null },
      { itemId: 'chalk-friction', stock: null },
      { itemId: 'tape-joint', stock: null },
      { itemId: 'accessory-brush', stock: null },
      { itemId: 'apparel-tee', stock: null, unlock: { level: 4 } },
      { itemId: 'shoes-technical', stock: null, unlock: { level: 6, clears: 5 } },
    ],
  },
]

export const getShop = (id: string): Shop | undefined => SHOPS.find((s) => s.id === id)

/** 그 암장에서 이용할 수 있는 상점 */
export const shopsOfGym = (gymId: string): Shop[] =>
  SHOPS.filter((s) => s.gymId === null || s.gymId === gymId)
