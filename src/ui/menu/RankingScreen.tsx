import { myRankings } from '../../game/ranking'
import { CURRENT_SEASON_ID, SEASONS } from '../../content/progression'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'

/**
 * 랭킹 — 로컬에서는 **내 예상 점수만** 계산한다.
 * 가짜 경쟁 순위를 만들지 않는다. 실제 순위는 서버가 같은 식으로 다시 계산한다.
 */
export function RankingScreen() {
  const state = useGame((s) => s.state)
  const rows = myRankings(state)
  const season = SEASONS.find((s) => s.id === CURRENT_SEASON_ID)

  return (
    <>
      <div className="warn-box info">
        🔌 <b>순위는 서버 연결 후 표시됩니다</b><br />
        지금은 내 점수가 어떻게 계산되는지만 보여줘요. 다른 사람과 비교하려면 계정 연동이 필요해요.
      </div>

      {season && (
        <Card title="시즌" right={<span className="chip">{season.weeks}주</span>}>
          <div className="small">{season.name}</div>
          <div className="tiny muted" style={{ marginTop: 4 }}>{season.blurb}</div>
          <div className="tiny muted" style={{ marginTop: 6 }}>
            시즌 시작·종료 시각은 서버가 정해요. 기기 시간으로 굴리면 조작할 수 있으니까요.
          </div>
        </Card>
      )}

      <Card title="내 예상 점수" right={<span className="tiny muted">범위: 전체 · 누적</span>}>
        {rows.map(({ category, score }) => (
          <div key={category.id} style={{ padding: '7px 0', borderBottom: '1px dashed var(--line)' }}>
            <div className="row small">
              <span className="grow">{category.name}</span>
              <span className="b">{score.toLocaleString()}</span>
            </div>
            <div className="tiny muted" style={{ marginTop: 2 }}>{category.desc}</div>
            <div className="tiny" style={{ color: 'var(--muted)', marginTop: 2 }}>순위 — 서버 연결 후</div>
          </div>
        ))}
      </Card>

      <Card title="범위">
        <div className="row wrap">
          {['전체', '친구', '크루', '주간', '시즌', '누적'].map((s) => (
            <span key={s} className="chip lock">🔒 {s}</span>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>서버 연결 후 열립니다.</div>
      </Card>
    </>
  )
}
