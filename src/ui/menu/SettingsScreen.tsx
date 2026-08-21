import { useState } from 'react'
import { BALANCE } from '../../game/balance'
import { formatDuration } from '../../game/clock'
import { dayLengthMs } from '../../game/progress'
import { useGame } from '../../store/gameStore'
import { ProfileSettings } from '../ProfileSettings'
import { Card } from '../bits'

export function SettingsScreen() {
  const state = useGame((s) => s.state)
  const setFastMode = useGame((s) => s.setFastMode)
  const setTimeScale = useGame((s) => s.setTimeScale)
  const resetGame = useGame((s) => s.resetGame)
  const beginOnboarding = useGame((s) => s.beginOnboarding)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const c = state.climber
  const needsProfile = c.gender === 'unset' || c.age === null

  return (
    <>
      <Card title="게임">
        <button className="btn" onClick={() => setFastMode(!state.settings.fastMode)}>
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="grow">빠른 진행</span>
            <span className={`chip ${state.settings.fastMode ? 'on' : ''}`}>
              {state.settings.fastMode ? '켜짐' : '꺼짐'}
            </span>
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>등반 연출을 짧게 넘깁니다.</div>
        </button>
      </Card>

      <Card title="캐릭터">
        {needsProfile && (
          <div className="warn-box info">성별과 나이가 아직 설정되지 않았어요.</div>
        )}
        <button className="btn center" onClick={() => setProfileOpen(true)}>캐릭터 기본 정보 설정</button>
        <div className="tiny muted" style={{ margin: '6px 0 10px' }}>
          성별·나이·소속 지점만 바꿔요. 능력치와 기록은 그대로예요.
        </div>
        <button className="btn ghost center" onClick={beginOnboarding}>캐릭터 생성 화면 미리보기</button>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          지금 세이브를 지우지 않아요. 마지막에 어떻게 적용할지 고를 수 있어요.
        </div>
      </Card>

      <Card title="시간">
        <div className="tiny muted" style={{ marginBottom: 6 }}>
          현재 게임 내 하루 = {formatDuration(dayLengthMs(state))}
        </div>
        <div className="row wrap">
          {BALANCE.time.timeScaleOptions.map((v) => (
            <button
              key={v}
              className={`btn small${state.settings.devTimeScale === v ? ' primary' : ''}`}
              onClick={() => setTimeScale(v)}
            >×{v}</button>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          운영 배포에서는 ×1로 고정됩니다. 테스트용 설정이에요.
        </div>
      </Card>

      <Card title="데이터">
        <div className="tiny muted" style={{ marginBottom: 8, lineHeight: 1.6 }}>
          저장 위치: 이 브라우저(로컬)<br />
          Supabase 계정 연동은 준비 중이에요. 지금 진행은 이 기기에만 남습니다.
        </div>
        {confirming ? (
          <>
            <div className="warn-box danger">
              전체 데이터를 초기화하면 레벨·돈·스킬·기록이 모두 사라져요. 되돌릴 수 없어요.
            </div>
            <button className="btn accent center" onClick={() => { void resetGame(); setConfirming(false) }}>
              네, 전부 지우고 새로 시작할게요
            </button>
            <div className="spacer" />
            <button className="btn ghost center" onClick={() => setConfirming(false)}>취소</button>
          </>
        ) : (
          <button className="btn ghost center" onClick={() => setConfirming(true)}>전체 데이터 초기화</button>
        )}
      </Card>

      {profileOpen && <ProfileSettings onClose={() => setProfileOpen(false)} />}
    </>
  )
}
