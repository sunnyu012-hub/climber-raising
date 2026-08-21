import type { Gym } from '../game/types'

export { REGIONS, getRegion, HOME_REGION_ID, TIER_LABEL } from './regions'

/**
 * 암장 데이터.
 *
 * 웨이브락 3지점은 **능력치·보상이 동일**하다 — 확인되지 않은 실제 시설 특성을
 * 사실처럼 만들지 않기 위해서다. 지점 구분은 색, 분위기 문구, **고유 이벤트 1개씩**이다.
 * (고유 이벤트는 보상이 아니라 분위기 연출이다.)
 *
 * 웨이브락 밖 확장 암장은 전부 **가상 이름**을 쓴다. 실존 암장의 상표나 특징을 만들지 마라.
 *
 * id는 세이브가 참조하므로 절대 바꾸지 않는다. 이름 교체는 displayName / branchName만.
 */
export const WAVEROCK_BRAND = 'waverock'

const WAVEROCK = {
  regionId: 'busan',
  brandId: WAVEROCK_BRAND,
  npcIds: ['owner', 'setter', 'veteran'],
  homeBonus: [],
  visitCost: 15000,
  scale: 'medium' as const,
  facilities: ['볼더링', '샤워실', '라운지'],
}

export const GYMS: Gym[] = [
  {
    ...WAVEROCK,
    id: 'waverock-seomyeon',
    displayName: '부산 웨이브락 서면점',
    branchName: '서면점',
    tagline: '도심 한가운데에서 시작하는 첫 클라이밍 생활!',
    character: '부산에서 사람이 제일 많이 지나다니는 동네.',
    wallTypes: ['슬랩', '수직', '오버행'],
    theme: { sign: '#e8916f', wall: '#d3cdbb', accent: '#c96f4e' },
    signature: {
      id: 'ev-seomyeon',
      name: '퇴근길 뒤풀이',
      text: '운동 끝나고 다 같이 국밥을 먹으러 갔다. 처음 온 사람도 따라왔다.',
      chance: 0.3,
      effect: { mood: 6, friendship: { owner: 3 } },
    },
    unlock: {},
  },
  {
    ...WAVEROCK,
    id: 'waverock-namcheon',
    displayName: '부산 웨이브락 남천점',
    branchName: '남천점',
    tagline: '바다 가까운 동네에서 느긋하게 시작해볼까요?',
    character: '창문을 열면 바다 냄새가 나는 동네.',
    wallTypes: ['슬랩', '수직', '오버행'],
    theme: { sign: '#7ba6c2', wall: '#cbd6d3', accent: '#5f8ba8' },
    signature: {
      id: 'ev-namcheon',
      name: '원정 온 사람들',
      text: '다른 지역에서 원정 온 팀이 왔다. 베타를 하나 배웠다.',
      chance: 0.3,
      effect: { mood: 4, friendship: { veteran: 3 } },
    },
    unlock: {},
  },
  {
    ...WAVEROCK,
    id: 'waverock-pnu',
    displayName: '부산 웨이브락 부산대점',
    branchName: '부산대점',
    tagline: '활기찬 대학가에서 새로운 크루를 만나보세요!',
    character: '저녁마다 사람이 몰리는 대학가.',
    wallTypes: ['슬랩', '수직', '오버행'],
    theme: { sign: '#8faa86', wall: '#cfd4c2', accent: '#6d8766' },
    signature: {
      id: 'ev-pnu',
      name: '늦은 밤 단골들',
      text: '문 닫기 직전까지 남은 사람들끼리 인사를 텄다. 이제 얼굴을 안다.',
      chance: 0.3,
      effect: { mood: 4, friendship: { setter: 3 } },
    },
    unlock: {},
  },

  // ---------------- 부산 첫 원정 암장 (가상) ----------------
  {
    id: 'busan-cliffside',
    regionId: 'busan',
    brandId: 'independent',
    displayName: '클리프사이드 볼더 (가상)',
    branchName: '클리프사이드',
    tagline: '부산 외곽의 작은 독립 암장. 소문으로만 듣던 곳.',
    character: '세터 한 명이 혼자 다 깐다는 곳. 문제가 독하다는 이야기가 많다.',
    wallTypes: ['수직', '오버행', '루프'],
    npcIds: ['veteran'],
    homeBonus: [],
    visitCost: 45000,
    scale: 'small',
    facilities: ['볼더링'],
    theme: { sign: '#b49bc8', wall: '#c6bdd0', accent: '#8a72a8' },
    signature: {
      id: 'ev-cliffside',
      name: '독한 세팅',
      text: '여기 문제는 확실히 한 등급 위 같다. 돌아가는 길에 손가락이 얼얼하다.',
      chance: 0.5,
      effect: { mood: 5 },
    },
    /** 세 지점을 모두 방문하면 열린다 */
    unlock: { visitedGyms: 3, level: 3 },
  },
]

/** 캐릭터 생성에서 고를 수 있는 지점 (홈짐 후보) */
export const SELECTABLE_GYMS = GYMS.filter((g) => g.brandId === WAVEROCK_BRAND)

export const STARTING_GYM_ID = SELECTABLE_GYMS[0].id

export const getGym = (id: string): Gym =>
  GYMS.find((g) => g.id === id) ?? GYMS[0]

export const gymsOfRegion = (regionId: string): Gym[] =>
  GYMS.filter((g) => g.regionId === regionId)

/** v1/v2 세이브의 옛 암장 id를 서면점으로 옮긴다. */
export const migrateGymId = (id: string | undefined): string =>
  id && GYMS.some((g) => g.id === id) ? id : STARTING_GYM_ID
