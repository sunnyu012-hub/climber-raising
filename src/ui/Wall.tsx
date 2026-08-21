import { useMemo } from 'react'
import { Sprite } from './Sprite'
import type { Appearance, ClimbingProblem, PoseKey, WallType } from '../game/types'

/**
 * 절차적 클라이밍 벽.
 * 홀드 이미지를 문제마다 만들지 않는다 — 기본 형태 6개를 색/크기/위치로 조합한다.
 * 같은 문제 id는 항상 같은 벽이 나온다(해시 기반).
 */

const HOLD_COLORS = ['#e8916f', '#8faa86', '#a8c8dd', '#f0c088', '#b49bc8', '#e0d3b8']

const WALL_BG: Record<WallType, string> = {
  '슬랩': '#cdd8c6',
  '수직': '#d3cdbb',
  '오버행': '#c8bda9',
  '루프': '#bdb098',
}

function hash(s: string): () => number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 홀드 기본 형태 6종. 전부 픽셀 사각형 조합이다. */
function holdShape(kind: number, x: number, y: number, color: string, key: string) {
  const dark = shade(color, -28)
  switch (kind) {
    case 0: // 저그
      return (
        <g key={key}>
          <rect x={x} y={y} width={10} height={6} fill={color} />
          <rect x={x + 1} y={y + 6} width={8} height={2} fill={dark} />
        </g>
      )
    case 1: // 크림프
      return (
        <g key={key}>
          <rect x={x + 1} y={y + 1} width={8} height={3} fill={color} />
          <rect x={x + 1} y={y + 4} width={8} height={1} fill={dark} />
        </g>
      )
    case 2: // 슬로퍼
      return (
        <g key={key}>
          <rect x={x} y={y + 1} width={12} height={4} fill={color} />
          <rect x={x + 2} y={y} width={8} height={1} fill={color} />
          <rect x={x} y={y + 5} width={12} height={1} fill={dark} />
        </g>
      )
    case 3: // 핀치
      return (
        <g key={key}>
          <rect x={x} y={y} width={3} height={7} fill={color} />
          <rect x={x + 5} y={y} width={3} height={7} fill={color} />
          <rect x={x} y={y + 7} width={8} height={1} fill={dark} />
        </g>
      )
    case 4: // 포켓
      return (
        <g key={key}>
          <rect x={x} y={y} width={8} height={8} fill={color} />
          <rect x={x + 2} y={y + 2} width={4} height={3} fill={dark} />
        </g>
      )
    default: // 볼륨
      return (
        <g key={key}>
          <rect x={x} y={y + 4} width={14} height={5} fill={color} />
          <rect x={x + 3} y={y + 1} width={8} height={3} fill={shade(color, 14)} />
          <rect x={x} y={y + 9} width={14} height={1} fill={dark} />
        </g>
      )
  }
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, v + amt)),
  )
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

interface Props {
  problem: ClimbingProblem
  /** 0(스타트) ~ 1(탑) */
  progress: number
  pose: PoseKey
  height?: number
  /** 빠른 진행 설정 — 이동 연출을 짧게 한다 */
  fast?: boolean
  appearance?: Appearance
}

export function Wall({ problem, progress, pose, height = 232, fast = false, appearance }: Props) {
  const holds = useMemo(() => {
    const rnd = hash(problem.id)
    const count = problem.steps.length * 3 + 4
    const items: { x: number; y: number; kind: number; color: string }[] = []
    for (let i = 0; i < count; i++) {
      const t = i / count
      const zig = Math.sin(i * 1.9) * 26
      items.push({
        x: 46 + zig + (rnd() - 0.5) * 16,
        y: 138 - t * 126 + (rnd() - 0.5) * 6,
        kind: Math.floor(rnd() * 6),
        color: HOLD_COLORS[Math.floor(rnd() * HOLD_COLORS.length)],
      })
    }
    return items
  }, [problem.id])

  const bg = WALL_BG[problem.wall]
  const bottom = 12 + progress * 62 // %

  return (
    <div className="climb-stage" style={{ height }}>
      <svg
        viewBox="0 0 120 160"
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* 벽 패널 */}
        <rect x={0} y={0} width={120} height={148} fill={bg} />
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => (
            <rect key={`b${r}${c}`} x={12 + c * 24} y={8 + r * 24} width={1} height={1} fill={shade(bg, -30)} />
          )),
        )}
        <rect x={0} y={0} width={120} height={2} fill={shade(bg, -40)} />
        {/* 안내판 */}
        <rect x={4} y={6} width={16} height={10} fill="#fffaf0" />
        <rect x={6} y={9} width={12} height={1} fill="#8a7a6d" />
        <rect x={6} y={12} width={8} height={1} fill="#8a7a6d" />
        {/* 홀드 */}
        {holds.map((h, i) => holdShape(h.kind, Math.round(h.x), Math.round(h.y), h.color, `h${i}`))}
        {/* 탑 홀드 */}
        <rect x={50} y={6} width={16} height={7} fill="#4a3b32" />
        <rect x={52} y={13} width={12} height={2} fill="#2f3a4a" />
        {/* 매트 */}
        <rect x={0} y={148} width={120} height={12} fill="#7b8fa8" />
        <rect x={0} y={148} width={120} height={2} fill="#5f7288" />
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={`m${i}`} x={i * 30} y={150} width={1} height={10} fill="#5f7288" />
        ))}
        {/* 벤치 */}
        <rect x={94} y={138} width={22} height={4} fill="#a98d6b" />
        <rect x={96} y={142} width={2} height={6} fill="#8a7157" />
        <rect x={112} y={142} width={2} height={6} fill="#8a7157" />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: '38%',
          bottom: `${bottom}%`,
          transition: fast ? 'bottom 0.15s steps(3)' : 'bottom 0.45s steps(6)',
          pointerEvents: 'none',
        }}
      >
        <Sprite pose={pose} size="action" appearance={appearance} />
      </div>
    </div>
  )
}
