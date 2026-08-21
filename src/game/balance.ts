/**
 * 밸런스 상수 단일 출처.
 * 다른 파일에 게임 숫자를 흩뿌리지 마라. 바꾸면 docs/BALANCE.md도 갱신한다.
 */

const IS_DEV = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV

export const BALANCE = {
  time: {
    /** 게임 내 하루 = 실제 시간. 개발 중엔 30초로 줄여 빠르게 검증한다. */
    dayMs: IS_DEV ? 30_000 : 30 * 60_000,
    /** 오프라인 인정 상한 (초과분은 버린다) */
    offlineCapHours: 12,
    /** 한 번에 소화할 수 있는 최대 일수. 배속을 올려도 수천 일이 한 번에 돌지 않게 막는다. */
    offlineCapDays: 30,
    tickMs: 1000,
    /** 개발자용 배속. 운영 기본은 1. 설정에서 1/6/30/60 */
    defaultTimeScale: 1,
    timeScaleOptions: [1, 6, 30, 60],
  },

  climb: {
    statWeight: 0.30,
    statPivot: 10,
    statScale: 12,
    masteryWeight: 0.18,
    fatiguePenalty: 0.25,
    hpPenalty: 0.15,
    hpSafeLine: 50,
    jointPenalty: 0.20,
    moodWeight: 0.05,
    gradeScale: 0.045,

    /** 행운 변동 폭. |luckShift| <= luckRange * choice.luckMult 를 항상 만족해야 한다. */
    luckRange: 0.10,
    /** 행운 능력치가 변동의 기댓값을 위로 민다(폭 자체는 안 커진다). */
    luckStatScale: 60,
    /** 추락이 귀여운 구조 사건으로 바뀔 확률 */
    luckyEventChance: 0.06,

    minChance: 0.05,
    maxChance: 0.95,
    critRatio: 0.22,
    partialBand: 0.45,

    reachFarPenalty: 0.12,
    reachCompressedBonus: 0.10,
    /** 짧은 리치는 중간 홀드를 더 잘 찾는다 */
    shortReachIntermediateBonus: 0.08,

    costByOutcome: { crit: 0.8, success: 1.0, partial: 1.25, fall: 1.4 } as const,
    masteryCostRelief: 0.30,
  },

  growth: {
    statExpBase: 60,
    statExpGrowth: 1.28,
    levelExpBase: 120,
    levelExpGrowth: 1.22,
    masteryGainBase: 7,
    masteryCurve: 1.8,
    /** 실패해도 남는 몫 */
    failExpRatio: 0.35,
    failMasteryRatio: 0.5,
  },

  directPlay: {
    /** 자동 진행 대비 직접 플레이 보상 배수 (요구 범위 1.30~1.60) */
    bonusRatio: 1.45,
    diminishStep: 0.15,
    diminishFloor: 0.45,
    /** 동작 1회 성공 = 하루의 6% 단축 */
    speedupPerStepRatio: 0.06,
    /** 완등 시 추가 단축 */
    speedupOnClearRatio: 0.18,
    onsightBonus: 1.5,
  },

  injury: {
    stages: { healthy: 85, caution: 70, stiff: 50, pain: 30 },
    warnAt: 55,
    blockClimbAt: 30,
    overtrainFatigue: 75,
    lowHp: 25,
    passiveFatigueRecovery: 4,
    passiveJointRecovery: 3,
    riskPerHardStep: 0.015,
    riskMaxMultiplier: 6,
    /** 이 아래로는 부상 판정을 아예 굴리지 않는다 — 부상은 누적의 결과여야 한다 */
    strainFatigue: 30,
    strainJoint: 88,
    /** 부상 발생 시 해당 관절 추가 하락 */
    injuryJointDrop: 12,
  },

  /** 캐릭터 생성 — 공정성 규칙의 숫자는 전부 여기 있다. */
  creation: {
    /** 모든 캐릭터의 시작 능력치 총합 (8종). 성별·나이·체형과 무관하게 항상 같다. */
    total: 76,
    min: 6,
    max: 13,
    /** 주특기가 옮겨오는 점수. 총합은 그대로다. */
    specialtyBonus: 2,
    masteryMin: 4,
    masteryMax: 10,
    startingMoney: 30000,
    ageMin: 18,
    ageMax: 60,
    ageDefault: 28,
  },

  /** 원정 · 방문 */
  travel: {
    /** 홈짐 변경 등록비 */
    homeGymChangeCost: 50000,
  },

  /** 대회 점수 */
  competition: {
    /** 완등 1개당 점수 */
    clearScore: 30,
    /** 동작 하나 성공당 점수 */
    stepScore: 4,
    /** 원트 보너스 */
    flashBonus: 10,
  },

  /** 프로젝트 문제 — 못 풀어도 남는 이해도 */
  project: {
    /** 동작 성공 시 오르는 이해도 */
    perStep: 2,
    /** 떨어져도 이만큼은 남는다 */
    perFail: 1,
    understandingMax: 100,
    /** 이해도 100일 때 성공률에 더해지는 최대치 */
    chanceBonus: 0.06,
  },

  npc: { maxFriendship: 100 },
  log: { max: 40 },
} as const

export const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'] as const

export const STAT_LABEL: Record<string, string> = {
  power: '힘',
  technique: '기술',
  flexibility: '유연성',
  stamina: '지구력',
  routefinding: '루트파인딩',
  mental: '멘탈',
  social: '인맥',
  luck: '행운',
}

export const JOINT_LABEL = { finger: '손가락', shoulder: '어깨', knee: '무릎' } as const

export const MOVE_LABEL: Record<string, string> = {
  highstep: '하이스텝',
  flagging: '플래깅',
  lockoff: '힘으로 버티기',
  intermediate: '중간 홀드 경유',
  heelhook: '힐 훅',
  dyno: '다이노',
  footswap: '발 바꾸기',
  rest: '휴식',
  chalk: '초크 사용',
  crimp: '크림프',
  toehook: '토 훅',
  matching: '매칭',
}

export const REACH_LABEL: Record<string, string> = {
  short: '짧은 리치',
  balanced: '균형형',
  long: '긴 리치',
}

export const GRADE_LABEL = (g: number) => `V${g}`
