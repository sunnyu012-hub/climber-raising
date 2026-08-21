import type { ReachTrait, SkillEffect, StatKey } from '../game/types'

/**
 * 체형 · 주특기 · 성격 데이터.
 * 어떤 항목도 명백한 상위 선택지가 되면 안 된다.
 *  - 체형: 능력치를 바꾸지 않는다. 등반 판정(먼 홀드 / 압축)에만 연결된다.
 *  - 주특기: 능력치를 재분배할 뿐 총합은 그대로다.
 *  - 성격: 아주 작은 패시브 하나 + 대사 차이.
 */

// ---------------- 체형 ----------------
export interface BodyType {
  id: ReachTrait
  name: string
  desc: string
  /** 표시용 키 범위(cm). 판정에는 쓰지 않는다 — 중복 적용 금지. */
  height: [min: number, max: number]
}

export const BODY_TYPES: BodyType[] = [
  {
    id: 'short', name: '짧은 리치',
    desc: '먼 홀드는 조금 불리하지만 압축 동작과 좁은 스타트에 강하고, 중간 홀드를 잘 찾는다',
    height: [148, 163],
  },
  {
    id: 'balanced', name: '균형형',
    desc: '특별히 강하거나 약한 거리가 없다. 어떤 빌드로도 무난하게 간다',
    height: [160, 174],
  },
  {
    id: 'long', name: '긴 리치',
    desc: '먼 홀드에 강하지만 압축 동작과 좁은 스타트가 답답하다. 발 기술이 더 중요해진다',
    height: [172, 187],
  },
]

export const getBodyType = (id: ReachTrait): BodyType =>
  BODY_TYPES.find((b) => b.id === id) ?? BODY_TYPES[1]

// ---------------- 주특기 ----------------
export interface Specialty {
  id: string
  name: string
  /** 이 능력치가 조금 높게 나온다 (총합은 유지된다) */
  stat: StatKey
  /** 이 무브 숙련도를 조금 갖고 시작한다 */
  moves: string[]
  intro: string
}

export const SPECIALTIES: Specialty[] = [
  { id: 'flex', name: '유연성 천재', stat: 'flexibility', moves: ['highstep', 'heelhook'], intro: '팔이 짧으면 발을 더 높이 올리면 되죠!' },
  { id: 'feet', name: '발쓰기 우등생', stat: 'technique', moves: ['footswap', 'flagging'], intro: '손은 거들 뿐이에요. 진짜는 발이거든요.' },
  { id: 'grip', name: '악력 부자', stat: 'power', moves: ['lockoff', 'chalk'], intro: '일단 잡으면 안 놓습니다. 그게 제 장점이에요.' },
  { id: 'endure', name: '지치지 않는 팔', stat: 'stamina', moves: ['rest', 'lockoff'], intro: '느려도 끝까지 가요. 그게 제 방식이에요.' },
  { id: 'beta', name: '베타 탐정', stat: 'routefinding', moves: ['intermediate'], intro: '이 문제, 분명 다른 길이 있어요. 제가 찾을게요.' },
  { id: 'steel', name: '강철 멘탈', stat: 'mental', moves: ['dyno'], intro: '떨어지는 건 안 무서워요. 안 붙어보는 게 무섭죠.' },
  { id: 'social', name: '암장 친화력', stat: 'social', moves: ['rest'], intro: '오늘 처음 오셨어요? 제가 매트 쓰는 법 알려드릴게요!' },
  { id: 'lucky', name: '이상하게 운이 좋음', stat: 'luck', moves: ['intermediate', 'chalk'], intro: '왜 됐는지는 저도 몰라요. 근데 됐어요.' },
]

export const getSpecialty = (id: string): Specialty =>
  SPECIALTIES.find((s) => s.id === id) ?? SPECIALTIES[0]

// ---------------- 성격 ----------------
export interface Personality {
  id: string
  name: string
  desc: string
  /** 아주 작은 패시브 하나. 다른 성격을 압도하지 않게 크기를 맞춘다. */
  effect: SkillEffect
}

export const PERSONALITIES: Personality[] = [
  { id: 'go', name: '일단 해보는 편', desc: '고민보다 손이 먼저 나간다', effect: { kind: 'moveChance', move: 'dyno', value: 0.03 } },
  { id: 'safe', name: '안전한 베타 선호', desc: '무리한 무브를 잘 안 고른다', effect: { kind: 'jointCost', value: 0.96 } },
  { id: 'burn', name: '실패할수록 불타오름', desc: '떨어지면 오히려 눈이 반짝인다', effect: { kind: 'statBonus', stat: 'mental', value: 1 } },
  { id: 'crew', name: '사람들과 함께할 때 강함', desc: '옆에서 봐주면 확실히 잘한다', effect: { kind: 'statBonus', stat: 'social', value: 1 } },
  { id: 'solo', name: '혼자 프로젝트를 파는 편', desc: '한 문제를 며칠씩 붙잡는다', effect: { kind: 'moveChance', move: 'intermediate', value: 0.03 } },
  { id: 'gear', name: '장비를 꼼꼼히 챙김', desc: '초크와 신발 상태를 늘 확인한다', effect: { kind: 'moveChance', move: 'chalk', value: 0.03 } },
  { id: 'body', name: '몸 상태를 잘 살핌', desc: '아프면 바로 멈출 줄 안다', effect: { kind: 'recovery', value: 1.05 } },
  { id: 'weird', name: '이상한 베타를 좋아함', desc: '남들이 안 쓰는 방법을 먼저 시도한다', effect: { kind: 'statBonus', stat: 'routefinding', value: 1 } },
]

export const getPersonality = (id: string): Personality =>
  PERSONALITIES.find((p) => p.id === id) ?? PERSONALITIES[0]

// ---------------- 첫 칭호 ----------------
export const FIRST_TITLES = [
  '오늘부터 클라이머', '매트 위의 신입', '초크 첫 개시', '벽 앞에 선 사람',
  '암벽화 길들이는 중', '주 3회 목표', '아직 V0', '내일도 올 사람',
]
