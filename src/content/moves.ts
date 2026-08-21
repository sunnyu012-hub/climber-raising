import type { JointKey, MoveKey, PoseKey } from '../game/types'

/** 무브별 주 사용 관절과 기본 포즈. 콘텐츠가 pose를 생략하면 이 값을 쓴다. */
export const MOVE_INFO: Record<MoveKey, { joint: JointKey; pose: PoseKey; blurb: string }> = {
  highstep:     { joint: 'knee',     pose: 'highstep', blurb: '발을 높이 올려 무게중심을 넘긴다' },
  flagging:     { joint: 'knee',     pose: 'flag',     blurb: '반대쪽 다리로 균형을 잡는다' },
  lockoff:      { joint: 'shoulder', pose: 'pull',     blurb: '팔을 접어 버틴다' },
  intermediate: { joint: 'finger',   pose: 'reach',    blurb: '중간 홀드를 거쳐 간다' },
  heelhook:     { joint: 'knee',     pose: 'heel',     blurb: '뒤꿈치를 걸어 당긴다' },
  dyno:         { joint: 'shoulder', pose: 'dyno',     blurb: '몸을 던져 잡는다' },
  footswap:     { joint: 'knee',     pose: 'stepUp',   blurb: '발을 바꿔 자세를 정리한다' },
  rest:         { joint: 'shoulder', pose: 'rest',     blurb: '털고 숨을 고른다' },
  chalk:        { joint: 'finger',   pose: 'idle',     blurb: '초크를 바른다' },
  crimp:        { joint: 'finger',   pose: 'pull',     blurb: '손가락을 세워 작은 홀드를 잡는다' },
  toehook:      { joint: 'knee',     pose: 'heel',     blurb: '발등을 걸어 몸을 붙인다' },
  matching:     { joint: 'finger',   pose: 'reach',    blurb: '한 홀드에 두 손을 모은다' },
}

export const ALL_MOVES = Object.keys(MOVE_INFO) as MoveKey[]
