import { useState } from 'react'
import { STAT_LABEL } from '../game/balance'
import { GENDER_LABEL } from '../game/newGame'
import { getBodyType, getPersonality, getSpecialty } from '../content/traits'
import { Sprite } from './Sprite'
import type { Climber, StatKey } from '../game/types'

/** 캐릭터 미리보기 카드. 상위 능력치 3개만 먼저 보여주고 나머지는 펼쳐보기. */
export function CharacterCard({ climber, sparkle }: { climber: Climber; sparkle?: number }) {
  const [open, setOpen] = useState(false)
  const body = getBodyType(climber.reach)
  const spec = getSpecialty(climber.specialtyId)
  const pers = getPersonality(climber.personalityId)

  const sorted = (Object.entries(climber.stats) as [StatKey, number][])
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="card tight">
      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <div
          key={sparkle}
          className="sprite-stage"
          style={{ background: 'var(--cream-2)', border: '2px solid var(--line)', padding: '6px 10px' }}
        >
          <Sprite pose="idle" size="medium" appearance={climber.appearance} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16 }}>{climber.name}</div>
          <div className="small muted" style={{ marginTop: 2 }}>
            {GENDER_LABEL[climber.gender]}
            {climber.age !== null && ` · ${climber.age}세`}
          </div>
          <div className="small" style={{ marginTop: 2 }}>
            {climber.height}cm · {body.name}
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>🏅 {climber.title}</div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <span className="chip on">주특기 {spec.name}</span>
        <span className="chip">성격 {pers.name}</span>
      </div>

      <div className="line-bubble" style={{ marginTop: 8 }}>💬 “{climber.intro}”</div>

      <div className="tiny muted" style={{ marginBottom: 4 }}>잘하는 것</div>
      <div>
        {sorted.slice(0, 3).map(([k, v]) => (
          <span key={k} className="chip on">{STAT_LABEL[k]} {v}</span>
        ))}
      </div>

      {open && (
        <div style={{ marginTop: 8 }}>
          {sorted.map(([k, v]) => (
            <div key={k} className="stat-row">
              <span className="lbl">{STAT_LABEL[k]}</span>
              <span className="grow">
                <div className="gauge exp"><i style={{ width: `${(v / 16) * 100}%` }} /></div>
              </span>
              <span className="val">{v}</span>
            </div>
          ))}
          <div className="tiny muted">{body.desc}</div>
          <div className="tiny muted" style={{ marginTop: 4 }}>{pers.desc}</div>
        </div>
      )}

      <button className="btn ghost center" style={{ marginTop: 8 }} onClick={() => setOpen((v) => !v)}>
        {open ? '접기' : '능력치 자세히 보기'}
      </button>
    </div>
  )
}
