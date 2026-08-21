import type { Region } from '../game/types'

/**
 * 지역 계층. 부산에서 시작해 전국 → 해외 → 세계 대회로 넓어진다.
 *
 * 이번 단계에서 **실제로 갈 수 있는 곳은 부산뿐**이다.
 * 나머지는 해금 조건만 보이는 골격이다 — `unlock.comingSoon`이 붙은 지역은
 * 조건을 채워도 열리지 않고 "콘텐츠 준비 중"으로 표시된다.
 *
 * 새 지역을 실제로 열려면: `comingSoon`을 지우고 그 지역의 암장을 `gyms.ts`에 추가한다.
 */
export const REGIONS: Region[] = [
  {
    id: 'busan',
    displayName: '부산',
    order: 0,
    tier: 'home',
    blurb: '바다와 산이 붙어 있는 도시. 여기서 시작한다.',
    unlock: {},
    travelCost: 0,
    travelDays: 0,
  },
  {
    id: 'gyeongnam',
    displayName: '경남',
    order: 1,
    tier: 'domestic',
    blurb: '부산 옆 동네. 주말에 다녀올 만한 거리다.',
    unlock: { level: 8, clears: 12, regions: ['busan'], comingSoon: true },
    travelCost: 60000,
    travelDays: 2,
    reward: { exp: 300, money: 0, badge: 'badge-gyeongnam' },
  },
  {
    id: 'seoul',
    displayName: '서울·경기',
    order: 2,
    tier: 'domestic',
    blurb: '암장이 제일 많은 곳. 잘하는 사람도 제일 많다.',
    unlock: { level: 15, fame: 200, regions: ['gyeongnam'], comingSoon: true },
    travelCost: 180000,
    travelDays: 3,
    reward: { exp: 800, money: 0, badge: 'badge-seoul' },
  },
  {
    id: 'daegu',
    displayName: '대구·경북',
    order: 3,
    tier: 'domestic',
    blurb: '자연 암벽이 가까운 지역.',
    unlock: { level: 15, regions: ['gyeongnam'], comingSoon: true },
    travelCost: 90000,
    travelDays: 2,
  },
  {
    id: 'chungcheong',
    displayName: '충청',
    order: 4,
    tier: 'domestic',
    blurb: '',
    unlock: { level: 18, comingSoon: true },
    travelCost: 120000,
    travelDays: 2,
  },
  {
    id: 'jeolla',
    displayName: '전라',
    order: 5,
    tier: 'domestic',
    blurb: '',
    unlock: { level: 18, comingSoon: true },
    travelCost: 130000,
    travelDays: 2,
  },
  {
    id: 'gangwon',
    displayName: '강원',
    order: 6,
    tier: 'domestic',
    blurb: '',
    unlock: { level: 20, comingSoon: true },
    travelCost: 150000,
    travelDays: 3,
  },
  {
    id: 'jeju',
    displayName: '제주',
    order: 7,
    tier: 'domestic',
    blurb: '',
    unlock: { level: 22, comingSoon: true },
    travelCost: 250000,
    travelDays: 4,
  },
  {
    id: 'asia',
    displayName: '아시아',
    order: 8,
    tier: 'overseas',
    blurb: '첫 해외 원정. 여권부터 챙기자.',
    unlock: { level: 25, fame: 800, regions: ['seoul'], comingSoon: true },
    travelCost: 900000,
    travelDays: 7,
    reward: { exp: 3000, money: 0, badge: 'badge-asia' },
  },
  {
    id: 'europe',
    displayName: '유럽',
    order: 9,
    tier: 'overseas',
    blurb: '',
    unlock: { level: 35, comingSoon: true },
    travelCost: 2500000,
    travelDays: 12,
  },
  {
    id: 'namerica',
    displayName: '북미',
    order: 10,
    tier: 'overseas',
    blurb: '',
    unlock: { level: 35, comingSoon: true },
    travelCost: 2800000,
    travelDays: 12,
  },
  {
    id: 'worlds',
    displayName: '세계 대회',
    order: 11,
    tier: 'world',
    blurb: '여기까지 오면 진짜다.',
    unlock: { level: 50, fame: 5000, comingSoon: true },
    travelCost: 0,
    travelDays: 14,
  },
]

export const getRegion = (id: string): Region | undefined =>
  REGIONS.find((r) => r.id === id)

export const HOME_REGION_ID = 'busan'

export const TIER_LABEL: Record<Region['tier'], string> = {
  home: '홈 지역',
  domestic: '국내',
  overseas: '해외',
  world: '세계',
}
