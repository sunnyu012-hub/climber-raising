import type { ReactNode } from 'react'
import { JOINT_LABEL } from '../game/balance'
import { JOINT_STAGE_EMOJI, JOINT_STAGE_LABEL, jointStage } from '../game/character'
import type { Condition, JointKey } from '../game/types'
import type { Warning } from '../game/character'

export const Card = ({ title, right, children, tight }: {
  title?: string; right?: ReactNode; children: ReactNode; tight?: boolean
}) => (
  <section className={`card${tight ? ' tight' : ''}`}>
    {title && <div className="card-title"><span>{title}</span>{right}</div>}
    {children}
  </section>
)

export const Gauge = ({ value, max = 100, kind = 'hp' }: { value: number; max?: number; kind?: string }) => (
  <div className={`gauge ${kind}`}>
    <i style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
  </div>
)

export const StatLine = ({ label, value, max = 100, kind, suffix }: {
  label: string; value: number; max?: number; kind?: string; suffix?: string
}) => (
  <div className="stat-row">
    <span className="lbl">{label}</span>
    <span className="grow"><Gauge value={value} max={max} kind={kind} /></span>
    <span className="val">{Math.round(value)}{suffix ?? ''}</span>
  </div>
)

export const Warnings = ({ items, limit }: { items: Warning[]; limit?: number }) => {
  const list = limit ? items.slice(0, limit) : items
  if (list.length === 0) return null
  return (
    <>
      {list.map((w, i) => (
        <div key={i} className={`warn-box ${w.level}`}>
          {w.level === 'danger' ? '⚠️ ' : w.level === 'warn' ? '💡 ' : 'ℹ️ '}{w.text}
        </div>
      ))}
    </>
  )
}

export const JointRow = ({ condition }: { condition: Condition }) => (
  <div className="row" style={{ gap: 6 }}>
    {(Object.keys(condition.joints) as JointKey[]).map((j) => {
      const st = jointStage(condition.joints[j])
      return (
        <div key={j} className="grow center" style={{ border: '2px solid var(--line)', padding: '6px 2px' }}>
          <div className="tiny muted">{JOINT_LABEL[j]}</div>
          <div style={{ fontSize: 18, lineHeight: 1.4 }}>{JOINT_STAGE_EMOJI[st]}</div>
          <div className="tiny">{JOINT_STAGE_LABEL[st]}</div>
        </div>
      )
    })}
  </div>
)

export const Empty = ({ text }: { text: string }) => (
  <div className="center muted small" style={{ padding: '28px 12px' }}>{text}</div>
)

export const Soon = ({ text }: { text: string }) => (
  <div className="card tight center muted small">🚧 {text} — 준비 중</div>
)
