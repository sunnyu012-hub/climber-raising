import { MOVE_LABEL, GRADE_LABEL } from '../../game/balance'
import { getGym } from '../../content/gyms'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'
import type { MoveKey } from '../../game/types'

const Row = ({ k, v }: { k: string; v: string | number }) => (
  <div className="row small" style={{ padding: '3px 0' }}>
    <span className="grow muted">{k}</span><span>{v}</span>
  </div>
)

/** 기록 — 숫자를 다 늘어놓지 않고 핵심과 최근 성장만 먼저 보여준다. */
export function RecordScreen() {
  const state = useGame((s) => s.state)
  const st = state.stats
  const topMoves = (Object.entries(st.moveUse) as [MoveKey, number][])
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
  const rate = st.attempts > 0 ? Math.round((st.clears / st.attempts) * 100) : 0

  return (
    <>
      <Card title="한눈에">
        <div className="kpi">
          <div><b>{st.clears}</b><span>완등</span></div>
          <div><b>{st.bestGrade >= 0 ? GRADE_LABEL(st.bestGrade) : '-'}</b><span>최고 난도</span></div>
          <div><b>{rate}%</b><span>완등률</span></div>
          <div><b>{Math.floor(state.world.fame)}</b><span>명성</span></div>
        </div>
      </Card>

      <Card title="등반">
        <Row k="총 도전" v={st.attempts} />
        <Row k="완등" v={st.clears} />
        <Row k="초견 완등" v={st.onsights} />
        <Row k="원트" v={st.flashes} />
        <Row k="추락" v={st.falls} />
      </Card>

      <Card title="많이 쓴 무브">
        {topMoves.length === 0
          ? <div className="mini muted">아직 기록이 없어요.</div>
          : topMoves.map(([m, n]) => (
              <div key={m} className="stat-row">
                <span className="lbl" style={{ width: 96 }}>{MOVE_LABEL[m]}</span>
                <span className="grow">
                  <div className="gauge exp"><i style={{ width: `${(n / topMoves[0][1]) * 100}%` }} /></div>
                </span>
                <span className="val">{n}</span>
              </div>
            ))}
      </Card>

      <Card title="생활">
        <Row k="총 플레이 일수" v={`${st.days}일`} />
        <Row k="알바" v={`${st.jobs}회`} />
        <Row k="번 돈" v={`${st.earned.toLocaleString()}원`} />
        <Row k="쓴 돈" v={`${st.spent.toLocaleString()}원`} />
        <Row k="휴식" v={`${st.rests}회`} />
        <Row k="부상" v={`${st.injuries}회`} />
        <Row k="원정" v={`${st.expeditions}회`} />
        <Row k="대회" v={`${st.competitions}회`} />
      </Card>

      <Card title="암장별">
        {Object.keys(st.gymVisits).length === 0
          ? <div className="mini muted">아직 기록이 없어요.</div>
          : Object.entries(st.gymVisits).map(([id, n]) => (
              <Row key={id} k={getGym(id).branchName} v={`방문 ${n} · 완등 ${st.gymClears[id] ?? 0}`} />
            ))}
      </Card>

      <Card title="서버 연결 후">
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          이 기록은 지금 이 기기에만 있어요. 랭킹은 서버가 같은 기록을 다시 계산해서 매깁니다 —
          그래야 점수를 조작할 수 없어요.
        </div>
      </Card>
    </>
  )
}
