import type { Skill, SkillBranch } from '../game/types'

export const BRANCH_LABEL: Record<SkillBranch, string> = {
  technician: '테크니션',
  power: '파워',
  wellness: '웰니스',
}

export const BRANCH_BLURB: Record<SkillBranch, string> = {
  technician: '적게 힘쓰고 많이 올라간다',
  power: '안 되면 되게 한다',
  wellness: '오래 클라이밍하는 사람이 이긴다',
}

/**
 * 모든 효과는 game/climb.ts · game/progress.ts 에서 실제로 소비된다.
 * UI에만 존재하는 스킬을 추가하지 마라.
 */
export const SKILLS: Skill[] = [
  // ---- 테크니션 ----
  {
    id: 'precise-feet', branch: 'technician', tier: 1, cost: 1,
    name: '정밀한 발쓰기',
    desc: '발끝을 믿게 된다. 모든 발 무브 성공률 +4%p, 등반 피로 -5%',
    effects: [
      { kind: 'moveChance', move: 'footswap', value: 0.04 },
      { kind: 'moveChance', move: 'highstep', value: 0.04 },
      { kind: 'fatigueCost', value: 0.95 },
    ],
  },
  {
    id: 'highstep-master', branch: 'technician', tier: 2, cost: 1, requires: 'precise-feet',
    name: '하이스텝 숙련',
    desc: '하이스텝 +8%p, 유연성 +1',
    effects: [
      { kind: 'moveChance', move: 'highstep', value: 0.08 },
      { kind: 'statBonus', stat: 'flexibility', value: 1 },
    ],
  },
  {
    id: 'flag-stable', branch: 'technician', tier: 2, cost: 1, requires: 'precise-feet',
    name: '플래깅 안정화',
    desc: '플래깅 +8%p, 슬랩에서 +4%p',
    effects: [
      { kind: 'moveChance', move: 'flagging', value: 0.08 },
      { kind: 'wallAffinity', wall: '슬랩', value: 0.04 },
    ],
  },
  {
    id: 'reach-comp', branch: 'technician', tier: 3, cost: 2, requires: 'highstep-master',
    name: '리치 보완 베타',
    desc: '먼 홀드 리치 패널티를 70% 없앤다. 중간 홀드 경유 +6%p',
    effects: [
      { kind: 'reachComp', value: 0.7 },
      { kind: 'moveChance', move: 'intermediate', value: 0.06 },
    ],
  },

  // ---- 파워 ----
  {
    id: 'lockoff', branch: 'power', tier: 1, cost: 1,
    name: '락오프',
    desc: '힘으로 버티기 +7%p, 힘 +1',
    effects: [
      { kind: 'moveChance', move: 'lockoff', value: 0.07 },
      { kind: 'statBonus', stat: 'power', value: 1 },
    ],
  },
  {
    id: 'overhang', branch: 'power', tier: 2, cost: 1, requires: 'lockoff',
    name: '오버행 적응',
    desc: '오버행·루프에서 +6%p',
    effects: [
      { kind: 'wallAffinity', wall: '오버행', value: 0.06 },
      { kind: 'wallAffinity', wall: '루프', value: 0.06 },
    ],
  },
  {
    id: 'dyno-confidence', branch: 'power', tier: 2, cost: 1, requires: 'lockoff',
    name: '다이노 자신감',
    desc: '다이노 +10%p, 멘탈 +1. 대신 어깨는 알아서 챙기자',
    effects: [
      { kind: 'moveChance', move: 'dyno', value: 0.10 },
      { kind: 'statBonus', stat: 'mental', value: 1 },
    ],
  },
  {
    id: 'pump-resist', branch: 'power', tier: 3, cost: 2, requires: 'overhang',
    name: '펌핑 저항',
    desc: '등반 피로 소모 -15%, 지구력 +1',
    effects: [
      { kind: 'fatigueCost', value: 0.85 },
      { kind: 'statBonus', stat: 'stamina', value: 1 },
    ],
  },

  // ---- 웰니스 ----
  {
    id: 'warmup', branch: 'wellness', tier: 1, cost: 1,
    name: '워밍업 습관',
    desc: '관절 소모 -12%, 부상 위험 감소',
    effects: [
      { kind: 'jointCost', value: 0.88 },
      { kind: 'injuryWarn', value: 0.5 },
    ],
  },
  {
    id: 'fast-recovery', branch: 'wellness', tier: 2, cost: 1, requires: 'warmup',
    name: '빠른 회복',
    desc: '휴식·재활 회복량 +20%',
    effects: [{ kind: 'recovery', value: 1.2 }],
  },
  {
    id: 'joint-care', branch: 'wellness', tier: 2, cost: 1, requires: 'warmup',
    name: '관절 관리',
    desc: '관절 소모 -20% (워밍업과 중첩)',
    effects: [{ kind: 'jointCost', value: 0.8 }],
  },
  {
    id: 'injury-sense', branch: 'wellness', tier: 3, cost: 2, requires: 'joint-care',
    name: '부상 위험 감지',
    desc: '위험한 베타에 경고 표시가 뜬다. 루트파인딩 +1',
    effects: [
      { kind: 'injuryWarn', value: 1 },
      { kind: 'statBonus', stat: 'routefinding', value: 1 },
    ],
  },
]

export const getSkill = (id: string): Skill | undefined => SKILLS.find((s) => s.id === id)
