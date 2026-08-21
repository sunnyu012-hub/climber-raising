import type { HairKey } from '../game/types'

/**
 * 도트 외형 팔레트.
 * 파츠 이미지를 늘리지 않고 **색 조합**으로 외형을 확장한다.
 * 색을 추가하려면 아래 배열에 hex 하나를 넣으면 된다.
 *
 * 성별로 팔레트를 나누지 않는다 — 어떤 성별이든 모든 색이 나올 수 있다.
 */

/** 피부 5종 */
export const SKINS = ['#f6ddc0', '#f3d3b0', '#e8bd94', '#d3a074', '#b57f56'] as const

/** 머리 색 8종 */
export const HAIR_COLORS = [
  '#2e2622', '#4a3b32', '#6b4a30', '#8a6a45',
  '#c4a06a', '#2f3a4a', '#7a4a52', '#5a6b58',
] as const

/** 머리 형태 6종 — Sprite.tsx의 HAIRS 테이블 키와 1:1로 맞춘다 */
export const HAIR_STYLES: HairKey[] = ['short', 'long', 'bun', 'curly', 'twin', 'cap']

/** 상의 10종 */
export const SHIRTS = [
  '#e8916f', '#8faa86', '#a8c8dd', '#f0c088', '#b49bc8',
  '#e0d3b8', '#d9737f', '#6f9fa8', '#c9b06a', '#7f8fb0',
] as const

/** 하의 8종 */
export const PANTS = [
  '#2f3a4a', '#4a3b32', '#5f6b52', '#6b5f7a',
  '#8a7a6d', '#3f5a63', '#7a5a4a', '#565b66',
] as const

/** 암벽화 8종 */
export const SHOES = [
  '#c96f4e', '#4a5a72', '#7a3f4a', '#5a6b3f',
  '#8a5a2a', '#3f4a4a', '#a8636f', '#2f5a52',
] as const

/** 초크백 8종 */
export const CHALKBAGS = [
  '#d9b06a', '#8faa86', '#c98f9a', '#7ba6c2',
  '#b49bc8', '#e0d3b8', '#a8836a', '#6f8f7a',
] as const

export const APPEARANCE_POOLS = {
  skin: SKINS,
  hairColor: HAIR_COLORS,
  hair: HAIR_STYLES,
  shirt: SHIRTS,
  pants: PANTS,
  shoe: SHOES,
  chalkbag: CHALKBAGS,
} as const
