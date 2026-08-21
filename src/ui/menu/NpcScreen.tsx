import { NPCS } from '../../content/npcs'
import { activeQuests } from '../../game/quests'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'

/** 관계 단계 — 친밀도가 오르면 호칭이 바뀌고 특전과 퀘스트가 열린다. */
const STAGES = [
  { at: 0, name: '처음 본 사람' },
  { at: 10, name: '낯익은 사람' },
  { at: 25, name: '암장 지인' },
  { at: 45, name: '클라이밍 친구' },
  { at: 65, name: '친한 크루원' },
  { at: 85, name: '멘토' },
]

const stageOf = (f: number) => [...STAGES].reverse().find((s) => f >= s.at) ?? STAGES[0]

export function NpcScreen() {
  const state = useGame((s) => s.state)
  const quests = activeQuests(state)

  return (
    <>
      <Card tight>
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          같이 운동하고 알바하면 친해져요. 친해지면 특전과 부탁 퀘스트가 열려요.
        </div>
      </Card>

      {NPCS.map((n) => {
        const f = state.npc[n.id] ?? 0
        const stage = stageOf(f)
        const next = STAGES.find((s) => s.at > f)
        const line = f >= 45 ? n.lines.high : f >= 15 ? n.lines.greet : n.lines.low
        const myQuests = quests.filter((q) => q.quest.npcId === n.id)

        return (
          <Card key={n.id} title={n.role} right={<span className="chip on">{stage.name}</span>}>
            <div className="npc-card">
              <div className="npc-face">{n.emoji}</div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small">{n.name}</div>
                <div className="tiny muted" style={{ margin: '3px 0 5px' }}>{n.intro}</div>
                <div className="gauge mood"><i style={{ width: `${f}%` }} /></div>
                <div className="tiny muted" style={{ marginTop: 3 }}>
                  친밀도 {f}{next && ` · 「${next.name}」까지 ${next.at - f}`}
                </div>
              </div>
            </div>

            <div className="line-bubble" style={{ marginTop: 8 }}>💬 {line}</div>

            {myQuests.length > 0 && (
              <div className="warn-box info" style={{ marginTop: 4 }}>
                📜 부탁이 있어요 — {myQuests.map((q) => q.quest.name).join(', ')}
              </div>
            )}

            <div style={{ marginTop: 4 }}>
              {n.perks.map((p) => (
                <div key={p.at} className={`chip ${f >= p.at ? 'on' : 'lock'}`}>
                  {f >= p.at ? '✓ ' : '🔒 '}{p.desc}
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </>
  )
}
