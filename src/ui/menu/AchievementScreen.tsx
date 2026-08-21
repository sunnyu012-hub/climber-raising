import { ACHIEVEMENTS, TITLES, getTitle } from '../../content/progression'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'

/** 업적과 칭호. 칭호는 하나를 골라 프로필에 장착한다. */
export function AchievementScreen() {
  const state = useGame((s) => s.state)
  const setTitle = useGame((s) => s.setTitle)
  const earned = state.achievements

  return (
    <>
      <Card title="칭호" right={<span className="tiny muted">{state.titles.length}/{TITLES.length}</span>}>
        <div className="tiny muted" style={{ marginBottom: 8 }}>
          하나를 골라 프로필에 달 수 있어요. 대부분은 수집용이지만 작은 효과가 붙은 것도 있어요.
        </div>
        {TITLES.map((t) => {
          const owned = state.titles.includes(t.id)
          const on = state.equippedTitle === t.id
          return (
            <button
              key={t.id}
              className="skill-node"
              data-owned={on ? '1' : '0'}
              disabled={!owned}
              style={!owned ? { opacity: 0.45 } : undefined}
              onClick={() => setTitle(on ? null : t.id)}
            >
              <div className="row small" style={{ alignItems: 'center' }}>
                <span className="grow">{owned ? (on ? '🎖️ ' : '') : '🔒 '}{owned ? t.name : '???'}</span>
                {on && <span className="chip on">장착 중</span>}
              </div>
              <div className="tiny muted" style={{ marginTop: 3 }}>
                {owned ? t.desc : '아직 얻지 못했어요'}
                {owned && t.effect && ' · 효과 있음'}
              </div>
            </button>
          )
        })}
      </Card>

      <Card title={`업적 (${earned.length}/${ACHIEVEMENTS.length})`}>
        {ACHIEVEMENTS.map((a) => {
          const got = earned.includes(a.id)
          const prog = state.achievementProgress[a.id] ?? []
          return (
            <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
              <div className="row small">
                <span className="grow" style={{ opacity: got ? 1 : 0.6 }}>
                  {got ? '🏅' : '⬜'} {a.name}
                </span>
                {a.reward?.title && (
                  <span className="tiny muted">칭호 «{getTitle(a.reward.title)?.name}»</span>
                )}
              </div>
              <div className="tiny muted" style={{ marginTop: 2 }}>{a.desc}</div>
              {!got && a.goals.map((g, i) => (
                <div key={i} className="tiny muted" style={{ marginTop: 2 }}>
                  {g.label} {Math.min(g.count, prog[i] ?? 0)}/{g.count}
                </div>
              ))}
            </div>
          )
        })}
      </Card>
    </>
  )
}
