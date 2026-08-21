import type { Appearance, HairKey, PoseKey, SpriteSize } from '../game/types'

/**
 * 도트 캐릭터.
 * 포즈마다 스프라이트 시트를 만들지 않는다 — 몸통은 고정이고 팔/다리 사각형 좌표만 바꾼다.
 * 16×22 픽셀 그리드, SVG rect, shapeRendering="crispEdges".
 *
 * 크기는 화면마다 임의의 px를 쓰지 않고 아래 4단계만 쓴다.
 * 전부 **16의 정수배**라 픽셀이 뭉개지지 않는다.
 */

type Rect = [x: number, y: number, w: number, h: number]

/** 픽셀 정렬을 위해 16(그리드 너비)의 정수배만 쓴다. */
export const SPRITE_SIZE: Record<SpriteSize, number> = {
  tiny: 32,    // 목록 · 상태 카드 · NPC 관계
  small: 48,   // 홈 프로필 카드 · 일정 결과
  medium: 64,  // 캐릭터 생성 미리보기 · 성장 화면
  action: 32,  // 등반 장면 — 벽과 홀드가 크게 느껴지도록 일부러 제일 작게
}

interface Pose {
  arms: Rect[]
  legs: Rect[]
  headDy?: number
  bodyDy?: number
}

/** 15개 포즈 — 전부 같은 16×22 그리드와 같은 발 기준선을 쓴다(바닥에서 뜨지 않게). */
const POSES: Record<PoseKey, Pose> = {
  idle:     { arms: [[4, 8, 2, 5], [10, 8, 2, 5]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]] },
  lookUp:   { arms: [[4, 8, 2, 5], [10, 8, 2, 5]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]], headDy: -1 },
  reach:    { arms: [[4, 8, 2, 5], [10, 3, 2, 6]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]] },
  stepUp:   { arms: [[4, 8, 2, 5], [10, 8, 2, 5]], legs: [[6, 14, 2, 6], [9, 11, 2, 3], [10, 13, 2, 2]] },
  pull:     { arms: [[4, 7, 2, 2], [3, 9, 2, 4], [10, 7, 2, 2], [11, 9, 2, 4]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]] },
  highstep: { arms: [[4, 8, 2, 5], [10, 6, 2, 4]], legs: [[6, 14, 2, 6], [10, 9, 2, 2], [11, 11, 2, 3]] },
  flag:     { arms: [[4, 8, 2, 5], [10, 6, 2, 5]], legs: [[7, 14, 2, 6], [2, 17, 5, 2]] },
  heel:     { arms: [[4, 8, 2, 5], [10, 8, 2, 4]], legs: [[6, 14, 2, 6], [10, 7, 2, 2], [12, 6, 2, 2]] },
  dyno:     { arms: [[4, 2, 2, 6], [10, 2, 2, 6]], legs: [[6, 13, 2, 4], [8, 13, 2, 4]], bodyDy: -1 },
  wobble:   { arms: [[3, 7, 2, 5], [11, 8, 2, 5]], legs: [[5, 14, 2, 6], [9, 14, 2, 6]] },
  fall:     { arms: [[3, 4, 2, 5], [11, 4, 2, 5]], legs: [[4, 14, 3, 5], [9, 14, 3, 5]] },
  mat:      { arms: [[3, 5, 2, 4], [11, 5, 2, 4]], legs: [[4, 15, 3, 4], [9, 15, 3, 4]] },
  top:      { arms: [[4, 1, 2, 7], [10, 1, 2, 7]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]] },
  tired:    { arms: [[4, 10, 2, 5], [10, 10, 2, 5]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]], headDy: 1 },
  rest:     { arms: [[4, 8, 2, 5], [11, 11, 2, 5]], legs: [[6, 14, 2, 6], [8, 14, 2, 6]] },
}

/** 머리 형태 6종. 새 이미지를 만들지 않고 사각형 좌표만 더한다. */
const HAIRS: Record<HairKey, Rect[]> = {
  short: [[5, 2, 6, 2], [4, 3, 1, 2], [11, 3, 1, 2]],
  long:  [[5, 2, 6, 2], [4, 3, 1, 7], [11, 3, 1, 7], [4, 9, 2, 1], [10, 9, 2, 1]],
  bun:   [[5, 2, 6, 2], [4, 3, 1, 2], [11, 3, 1, 2], [6, 0, 3, 2], [9, 1, 1, 1]],
  curly: [[5, 1, 6, 3], [4, 2, 1, 3], [11, 2, 1, 3], [4, 1, 2, 1], [10, 1, 2, 1]],
  twin:  [[5, 2, 6, 2], [3, 4, 2, 4], [11, 4, 2, 4], [4, 3, 1, 2], [11, 3, 1, 2]],
  cap:   [[4, 2, 8, 2], [5, 1, 6, 1], [11, 4, 3, 1], [4, 4, 1, 1]],
}

/** 팔레트만 바꿔서 외형을 확장한다(파츠를 무한히 늘리지 않는다). */
export interface Palette {
  skin: string
  hair: string
  shirt: string
  pants: string
  shoe: string
  chalkbag: string
}

export const DEFAULT_PALETTE: Palette = {
  skin: '#f0c9a4',
  hair: '#4a3b32',
  shirt: '#e8916f',
  pants: '#2f3a4a',
  shoe: '#c96f4e',
  chalkbag: '#d9b06a',
}

interface Props {
  pose: PoseKey
  /** 크기 단계. px를 직접 넘기지 마라. */
  size?: SpriteSize
  flip?: boolean
  /** 저장된 외형. 없으면 기본 팔레트 */
  appearance?: Appearance
  className?: string
}

const paletteOf = (a?: Appearance): Palette =>
  a ? { skin: a.skin, hair: a.hairColor, shirt: a.shirt, pants: a.pants, shoe: a.shoe, chalkbag: a.chalkbag }
    : DEFAULT_PALETTE

export function Sprite({ pose, size = 'small', flip = false, appearance, className = '' }: Props) {
  const px = SPRITE_SIZE[size]
  const p = paletteOf(appearance)
  const hairRects = HAIRS[appearance?.hair ?? 'short'] ?? HAIRS.short
  const d = POSES[pose] ?? POSES.idle
  const hy = d.headDy ?? 0
  const by = d.bodyDy ?? 0
  const anim = pose === 'idle' ? 'idle'
    : pose === 'wobble' ? 'wobble'
    : pose === 'fall' ? 'fall'
    : pose === 'top' ? 'top' : ''

  return (
    <svg
      className={`sprite ${anim} ${className}`}
      width={px}
      height={(px / 16) * 22}
      viewBox="0 0 16 22"
      shapeRendering="crispEdges"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      {/* 팔 (몸 뒤) */}
      {d.arms.map((r, i) => (
        <rect key={`a${i}`} x={r[0]} y={r[1] + by} width={r[2]} height={r[3]} fill={p.skin} />
      ))}
      {/* 다리 + 암벽화 */}
      {d.legs.map((r, i) => (
        <g key={`l${i}`}>
          <rect x={r[0]} y={r[1] + by} width={r[2]} height={r[3]} fill={p.pants} />
          <rect x={r[0]} y={r[1] + by + r[3] - 1} width={r[2]} height={1} fill={p.shoe} />
        </g>
      ))}
      {/* 몸통 */}
      <rect x={6} y={8 + by} width={4} height={6} fill={p.shirt} />
      <rect x={6} y={13 + by} width={4} height={1} fill={p.pants} />
      {/* 초크백 (허리 뒤) */}
      <rect x={4} y={12 + by} width={2} height={3} fill={p.chalkbag} />
      {/* 머리 */}
      <rect x={5} y={4 + hy + by} width={6} height={4} fill={p.skin} />
      {hairRects.map((r, i) => (
        <rect key={`h${i}`} x={r[0]} y={r[1] + hy + by} width={r[2]} height={r[3]} fill={p.hair} />
      ))}
      {/* 눈 — 작게 표시돼도 구분되도록 2px 높이 */}
      {pose === 'tired' || pose === 'fall' ? (
        <>
          <rect x={6} y={6 + hy + by} width={2} height={1} fill="#3b2f2a" />
          <rect x={9} y={6 + hy + by} width={2} height={1} fill="#3b2f2a" />
        </>
      ) : (
        <>
          <rect x={6} y={5 + hy + by} width={1} height={2} fill="#3b2f2a" />
          <rect x={9} y={5 + hy + by} width={1} height={2} fill="#3b2f2a" />
        </>
      )}
      {/* 볼 */}
      <rect x={5} y={7 + hy + by} width={1} height={1} fill="#e8a487" />
      <rect x={10} y={7 + hy + by} width={1} height={1} fill="#e8a487" />
    </svg>
  )
}

/**
 * 캐릭터를 눌러야 하는 자리용 래퍼.
 * 스프라이트가 작아져도 터치 영역은 40×40px 아래로 내려가지 않는다.
 */
export function SpriteButton(
  { onClick, label, ...rest }: Props & { onClick: () => void; label: string },
) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        minWidth: 44, minHeight: 44, display: 'grid', placeItems: 'center',
        background: 'none', border: 0, padding: 4, cursor: 'pointer',
      }}
    >
      <Sprite {...rest} />
    </button>
  )
}
