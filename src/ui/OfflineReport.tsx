import { DAY_NAMES, JOINT_LABEL } from '../game/balance'
import { formatDuration } from '../game/clock'
import { useGame } from '../store/gameStore'
import { Sprite } from './Sprite'
import type { JointKey } from '../game/types'

const sign = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)}`

/** 오프라인 복귀 리포트 — 없는 동안 무슨 일이 있었는지 요약한다. */
export function OfflineReport() {
  const report = useGame((s) => s.state.pendingReport)
  const appearance = useGame((s) => s.state.climber.appearance)
  const dismiss = useGame((s) => s.dismissReport)
  if (!report) return null

  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="center" style={{ marginBottom: 8 }}>
          <Sprite pose="rest" size="small" appearance={appearance} />
          <div style={{ fontSize: 16, marginTop: 4 }}>다녀오셨어요!</div>
          <div className="tiny muted">
            {formatDuration(report.awayMs)} 만에 왔네요 · {report.daysRun}일 진행
          </div>
          {report.cappedMs > 0 && (
            <div className="tiny muted" style={{ marginTop: 4 }}>
              (오프라인 인정은 최대치까지만 계산했어요)
            </div>
          )}
        </div>

        <div className="card tight">
          <div className="row small"><span className="grow muted">번 돈</span><span>{sign(report.totalMoney)}원</span></div>
          <div className="row small"><span className="grow muted">경험치</span><span>+{report.totalExp}</span></div>
          {report.levelUps > 0 && (
            <div className="row small"><span className="grow muted">레벨업</span><span>+{report.levelUps} 🎉</span></div>
          )}
          <div className="row small"><span className="grow muted">체력</span><span>{sign(report.hpDelta)}</span></div>
          <div className="row small"><span className="grow muted">피로</span><span>{sign(report.fatigueDelta)}</span></div>
          {(Object.keys(report.jointDelta) as JointKey[]).map((j) => (
            <div key={j} className="row small">
              <span className="grow muted">{JOINT_LABEL[j]}</span>
              <span>{sign(report.jointDelta[j])}</span>
            </div>
          ))}
        </div>

        <div className="card tight">
          <div className="card-title"><span>그동안 있었던 일</span></div>
          {report.results.slice(-7).map((r, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div className="small">
                {r.week}주 {DAY_NAMES[r.dayIndex]} · {r.activityName}
              </div>
              {r.lines.map((l, j) => (
                <div key={j} className="tiny muted" style={{ paddingLeft: 8 }}>· {l}</div>
              ))}
            </div>
          ))}
          {report.results.length > 7 && (
            <div className="tiny muted center">…앞선 {report.results.length - 7}일은 생략했어요</div>
          )}
        </div>

        <button className="btn primary center" onClick={dismiss}>확인</button>
      </div>
    </div>
  )
}
