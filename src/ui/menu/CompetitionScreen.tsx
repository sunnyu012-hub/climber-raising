import { useState } from 'react'
import { getGym } from '../../content/gyms'
import { competitionOptions, type CompetitionResult } from '../../game/competition'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'

/** 미니대회 — 로컬 싱글. 평소 등반과 같은 판정식으로 문제 3개를 붙는다. */
export function CompetitionScreen() {
  const state = useGame((s) => s.state)
  const enter = useGame((s) => s.enterCompetition)
  const [result, setResult] = useState<CompetitionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return (
      <>
        <div className="center" style={{ padding: '8px 0 14px' }}>
          <div style={{ fontSize: 34 }}>🏆</div>
          <div style={{ fontSize: 18, marginTop: 6 }}>{result.tier}</div>
          <div className="mini muted">{result.score}점 · {result.topped}/{result.total} 완등</div>
        </div>
        <Card title="경기 내용">
          {result.lines.map((l, i) => (
            <div key={i} className="mini" style={{ padding: '3px 0' }}>· {l}</div>
          ))}
          <hr className="sep" />
          <div className="row small"><span className="grow muted">상금</span><span>+{result.money.toLocaleString()}원</span></div>
          <div className="row small"><span className="grow muted">명성</span><span>+{result.fame}</span></div>
        </Card>
        <button className="btn primary center" onClick={() => setResult(null)}>돌아가기</button>
      </>
    )
  }

  return (
    <>
      <Card tight>
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          참가비를 내고 문제 3개를 붙어요. 얼마나 올라갔는지로 점수가 나고 등급이 갈려요.<br />
          온라인 대회는 준비 중이에요 — 지금은 혼자 하는 기록 대회입니다.
        </div>
      </Card>

      {error && <div className="warn-box">{error}</div>}

      {competitionOptions(state).map(({ comp, blocked, record }) => (
        <div key={comp.id} className="plist">
          <div className="ph">
            <span className="grow" style={{ fontSize: 14 }}>{comp.name}</span>
            {record && <span className="chip on">최고 {record.bestTier}</span>}
          </div>
          <div className="mini" style={{ margin: '6px 0' }}>{comp.blurb}</div>
          <div>
            <span className="chip">{getGym(comp.gymId).branchName}</span>
            <span className="chip">문제 {comp.problemIds.length}개</span>
            <span className="chip">참가비 {comp.entryFee.toLocaleString()}원</span>
          </div>
          <div className="tiny muted" style={{ margin: '6px 0' }}>
            {comp.tiers.map((t) => `${t.minScore}점~ ${t.tier}`).join(' / ')}
          </div>
          {record && (
            <div className="tiny muted" style={{ marginBottom: 6 }}>
              참가 {record.entries}회 · 최고 {record.bestScore}점
            </div>
          )}
          <button
            className={`btn center${blocked ? '' : ' primary'}`}
            disabled={!!blocked}
            onClick={() => {
              const r = enter(comp.id)
              if (typeof r === 'string') setError(r)
              else { setError(null); setResult(r) }
            }}
          >
            {blocked ?? '참가하기'}
          </button>
        </div>
      ))}
    </>
  )
}
