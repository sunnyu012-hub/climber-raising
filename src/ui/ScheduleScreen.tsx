import { useState } from 'react'
import { DAY_NAMES, JOINT_LABEL, STAT_LABEL } from '../game/balance'
import { buildWarnings } from '../game/character'
import { restDaysInWeek } from '../game/progress'
import { ACTIVITIES, KIND_LABEL, PRESETS, getActivity } from '../content/activities'
import { useGame } from '../store/gameStore'
import { Card, Warnings } from './bits'
import type { ActivityDefinition, JointKey, StatKey } from '../game/types'

function ActivityMeta({ a }: { a: ActivityDefinition }) {
  const parts: string[] = []
  if (a.hp) parts.push(`체력 ${a.hp > 0 ? '+' : ''}${a.hp}`)
  if (a.fatigue) parts.push(`피로 ${a.fatigue > 0 ? '+' : ''}${a.fatigue}`)
  if (a.money) parts.push(`${a.money > 0 ? '+' : ''}${a.money.toLocaleString()}원`)
  for (const [j, v] of Object.entries(a.joints) as [JointKey, number][]) {
    parts.push(`${JOINT_LABEL[j]} ${v > 0 ? '+' : ''}${v}`)
  }
  return <span>{parts.join(' · ')}</span>
}

export function ScheduleScreen() {
  const state = useGame((s) => s.state)
  const setDay = useGame((s) => s.setDay)
  const applyPreset = useGame((s) => s.applyPreset)
  const [picking, setPicking] = useState<number | null>(null)

  const warns = buildWarnings(state.climber, restDaysInWeek(state))

  return (
    <div className="screen">
      <Card title="추천 편성" right={<span className="tiny muted">한 번에 일주일</span>}>
        <div className="row wrap">
          {PRESETS.map((p) => (
            <button key={p.id} className="btn small" onClick={() => applyPreset(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 8 }}>
          {PRESETS.map((p) => `${p.name}: ${p.desc}`).join(' / ')}
        </div>
      </Card>

      {warns.length > 0 && (
        <Card title="편성 전에 확인해요">
          <Warnings items={warns} limit={4} />
        </Card>
      )}

      <Card title={`${state.schedule.week}주차 일정`} right={<span className="tiny muted">하루 1개</span>}>
        {DAY_NAMES.map((d, i) => {
          const a = getActivity(state.schedule.days[i])
          const isToday = i === state.schedule.dayIndex
          const done = i < state.schedule.dayIndex
          return (
            <button
              key={d}
              className="day-row"
              data-today={isToday ? '1' : '0'}
              onClick={() => setPicking(i)}
            >
              <span className="dname">{d}</span>
              <span className="dbody">
                <span className="dname-t">{a ? `${a.icon} ${a.name}` : '🕳️ 비어 있음'}</span>
                <span className="dmeta">{a ? <ActivityMeta a={a} /> : '탭해서 활동을 고르세요'}</span>
              </span>
              {done && <span className="done">완료</span>}
              {isToday && <span className="done" style={{ color: 'var(--coral-dark)' }}>진행 중</span>}
            </button>
          )
        })}
        <div className="tiny muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          일정은 실제 시간이 지나면 자동으로 진행돼요. 지나간 요일을 바꾸면 다음 주부터 적용됩니다.
        </div>
      </Card>

      {picking !== null && (
        <ActivityPicker
          day={picking}
          onPick={(id) => { setDay(picking, id); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

function ActivityPicker({ day, onPick, onClose }: {
  day: number; onPick: (id: string | null) => void; onClose: () => void
}) {
  const climber = useGame((s) => s.state.climber)
  const npc = useGame((s) => s.state.npc)

  const meets = (a: ActivityDefinition): boolean => {
    if (!a.requires) return true
    for (const [k, v] of Object.entries(a.requires.stats ?? {}) as [StatKey, number][]) {
      if (climber.stats[k] < v) return false
    }
    for (const [id, v] of Object.entries(a.requires.friendship ?? {})) {
      if ((npc[id] ?? 0) < v) return false
    }
    return true
  }

  const kinds: ActivityDefinition['kind'][] = ['train', 'rest', 'rehab', 'job', 'social']

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-title">
          <span>{DAY_NAMES[day]}요일에 무엇을 할까요?</span>
          <button className="btn small" onClick={onClose}>닫기</button>
        </div>

        {kinds.map((kind) => {
          const list = ACTIVITIES.filter((a) => a.kind === kind)
          if (list.length === 0) return null
          return (
            <div key={kind} style={{ marginBottom: 10 }}>
              <div className="tiny muted" style={{ marginBottom: 4 }}>{KIND_LABEL[kind]}</div>
              {list.map((a) => {
                const ok = meets(a)
                return (
                  <button
                    key={a.id}
                    className="day-row"
                    disabled={!ok}
                    style={!ok ? { opacity: 0.45 } : undefined}
                    onClick={() => ok && onPick(a.id)}
                  >
                    <span className="dname">{a.icon}</span>
                    <span className="dbody">
                      <span className="dname-t">{a.name}</span>
                      <span className="dmeta">
                        {ok ? <ActivityMeta a={a} /> : requireText(a)}
                      </span>
                      <span className="dmeta">{a.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}

        <button className="btn ghost center" onClick={() => onPick(null)}>비워두기</button>
      </div>
    </div>
  )
}

function requireText(a: ActivityDefinition): string {
  const s = Object.entries(a.requires?.stats ?? {})
    .map(([k, v]) => `${STAT_LABEL[k]} ${v}`)
    .join(', ')
  return `🔒 필요: ${s}`
}
