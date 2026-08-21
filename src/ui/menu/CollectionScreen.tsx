import { useState } from 'react'
import { GYMS } from '../../content/gyms'
import { PROBLEMS } from '../../content/problems'
import { NPCS } from '../../content/npcs'
import { EQUIPMENT } from '../../content/equipment'
import { GRADE_LABEL } from '../../game/balance'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'
import type { CollectionKind } from '../../game/types'

/** 도감 — 미발견은 ??? 로 가린다. 발견 판정은 이벤트 스파인이 한다. */
const TABS: { key: CollectionKind; label: string }[] = [
  { key: 'problem', label: '문제' },
  { key: 'gym', label: '암장' },
  { key: 'npc', label: 'NPC' },
  { key: 'equipment', label: '장비' },
]

export function CollectionScreen() {
  const state = useGame((s) => s.state)
  const [tab, setTab] = useState<CollectionKind>('problem')

  const rows: { id: string; name: string; sub: string }[] =
    tab === 'problem' ? PROBLEMS.map((p) => ({ id: p.id, name: p.name, sub: `${GRADE_LABEL(p.grade)} · ${p.wall}` }))
    : tab === 'gym' ? GYMS.map((g) => ({ id: g.id, name: g.displayName, sub: g.tagline }))
    : tab === 'npc' ? NPCS.map((n) => ({ id: n.id, name: `${n.emoji} ${n.name}`, sub: n.role }))
    : EQUIPMENT.map((e) => ({ id: e.id, name: e.name, sub: e.desc }))

  const found = state.collection[tab]

  return (
    <>
      <div className="seg">
        {TABS.map((t) => (
          <button key={t.key} data-on={tab === t.key ? '1' : '0'} onClick={() => setTab(t.key)}>
            {t.label}
            <span className="seg-count">{state.collection[t.key].length}/{
              t.key === 'problem' ? PROBLEMS.length
              : t.key === 'gym' ? GYMS.length
              : t.key === 'npc' ? NPCS.length : EQUIPMENT.length
            }</span>
          </button>
        ))}
      </div>

      <Card tight>
        <div className="tiny muted">직접 만나거나 써본 것만 기록돼요.</div>
      </Card>

      {rows.map((r) => {
        const got = found.includes(r.id)
        return (
          <div key={r.id} className="dex-row" data-got={got ? '1' : '0'}>
            <span className="dex-mark">{got ? '✓' : '?'}</span>
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="small" style={{ display: 'block' }}>{got ? r.name : '???'}</span>
              <span className="tiny muted">{got ? r.sub : '아직 만나지 못했어요'}</span>
            </span>
          </div>
        )
      })}
    </>
  )
}
