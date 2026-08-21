import { GRADE_LABEL, STAT_LABEL } from '../game/balance'
import { isInjured, jointStage, JOINT_STAGE_LABEL, worstJoint } from '../game/character'
import { josa } from '../game/text'
import { getGym } from '../content/gyms'
import { problemsOfGym } from '../content/problems'
import { JOINT_LABEL } from '../game/balance'
import { useGame } from '../store/gameStore'
import { Card } from './bits'

export function ClimbScreen() {
  const state = useGame((s) => s.state)
  const startClimb = useGame((s) => s.startClimb)
  const gym = getGym(state.gymId)
  const problems = problemsOfGym(state.gymId)
  const injured = isInjured(state.climber.condition)
  const worst = worstJoint(state.climber.condition)
  const tired = state.climber.condition.hp < 15

  return (
    <div className="screen">
      <Card tight>
        <div style={{ fontSize: 15 }}>{gym.displayName}</div>
        <div className="mini">{gym.tagline}</div>
        <div style={{ marginTop: 6 }}>
          {gym.wallTypes.map((w) => <span key={w} className="chip">{w}</span>)}
        </div>
      </Card>

      {injured && (
        <div className="warn-box danger">
          ⚠️ {josa(JOINT_LABEL[worst.key], '이/가')} {JOINT_STAGE_LABEL[jointStage(worst.value)]} 상태예요.
          오늘은 등반 대신 재활·휴식 일정을 넣어주세요.
        </div>
      )}
      {!injured && tired && (
        <div className="warn-box">
          💡 체력이 거의 없어요. 붙어도 금방 떨어질 거예요.
        </div>
      )}

      {problems.map((p) => {
        const rec = state.records[p.id]
        return (
          <div key={p.id} className="plist">
            <div className="ph">
              <span className="grade">{GRADE_LABEL(p.grade)}</span>
              <span className="grow" style={{ fontSize: 14 }}>{p.name}</span>
              {rec?.cleared && <span className="chip on">{rec.onsight ? '초견 완등' : '완등'}</span>}
            </div>
            <div className="mini" style={{ margin: '6px 0' }}>{p.desc}</div>
            <div>
              <span className="chip">{p.wall}</span>
              <span className="chip">{p.steps.length}동작</span>
              {p.recommend.map((r) => <span key={r} className="chip">{STAT_LABEL[r]}</span>)}
            </div>
            <div className="tiny muted" style={{ margin: '6px 0' }}>
              {rec ? `시도 ${rec.attempts}회` : '아직 안 붙어봤어요 — 초견 보너스 있음'}
            </div>
            <button
              className={`btn ${rec?.cleared ? '' : 'primary'} center`}
              disabled={injured}
              onClick={() => startClimb(p.id)}
            >
              {injured ? '몸이 준비되지 않았어요' : rec?.cleared ? '다시 붙어보기' : '도전하기'}
            </button>
          </div>
        )
      })}

      <div className="tiny muted center" style={{ padding: '8px 0 0' }}>
        새 암장과 원정은 준비 중이에요.
      </div>
    </div>
  )
}
