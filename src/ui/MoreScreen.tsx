import { useState } from 'react'
import { BALANCE } from '../game/balance'
import { formatDuration } from '../game/clock'
import { dayLengthMs } from '../game/progress'
import { ACTIVITIES } from '../content/activities'
import { NPCS } from '../content/npcs'
import { PROBLEMS } from '../content/problems'
import { useGame } from '../store/gameStore'
import { ProfileSettings } from './ProfileSettings'
import { Card, Soon } from './bits'

export function MoreScreen() {
  const state = useGame((s) => s.state)
  const setFastMode = useGame((s) => s.setFastMode)
  const setTimeScale = useGame((s) => s.setTimeScale)
  const resetGame = useGame((s) => s.resetGame)
  const [confirming, setConfirming] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const beginOnboarding = useGame((s) => s.beginOnboarding)
  const climber = state.climber
  const needsProfile = climber.gender === 'unset' || climber.age === null

  const jobs = ACTIVITIES.filter((a) => a.kind === 'job')
  const earned = PROBLEMS.filter((p) => p.achievement && state.achievements.includes(p.achievement.id))

  return (
    <div className="screen">
      <Card title="암장 사람들">
        {NPCS.map((n) => {
          const f = state.npc[n.id] ?? 0
          const next = n.perks.find((p) => f < p.at)
          const line = f >= 40 ? n.lines.high : f >= 15 ? n.lines.greet : n.lines.low
          return (
            <div key={n.id} style={{ marginBottom: 12 }}>
              <div className="npc-card">
                <div className="npc-face">{n.emoji}</div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small">{n.name} <span className="tiny muted">· {n.role}</span></div>
                  <div className="tiny muted" style={{ margin: '3px 0 5px' }}>{n.intro}</div>
                  <div className="gauge mood"><i style={{ width: `${f}%` }} /></div>
                  <div className="tiny muted" style={{ marginTop: 3 }}>친밀도 {f}</div>
                </div>
              </div>
              <div className="line-bubble" style={{ marginTop: 6 }}>💬 {line}</div>
              {n.perks.map((p) => (
                <div key={p.at} className={`chip ${f >= p.at ? 'on' : 'lock'}`}>
                  {f >= p.at ? '✓ ' : '🔒 '}{p.desc}
                </div>
              ))}
              {next && (
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  다음 특전까지 친밀도 {next.at - f}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <Card title="알바">
        {jobs.map((j) => (
          <div key={j.id} style={{ marginBottom: 8 }}>
            <div className="small">{j.icon} {j.name} <span className="tiny muted">· {j.money.toLocaleString()}원</span></div>
            <div className="tiny muted">{j.desc}</div>
          </div>
        ))}
        <div className="tiny muted" style={{ marginTop: 4 }}>
          일정 탭에서 요일에 배치하면 자동으로 진행돼요. 루트 세팅·촬영·대회 스태프는 준비 중이에요.
        </div>
      </Card>

      <Card title={`업적 (${earned.length}/${PROBLEMS.filter((p) => p.achievement).length})`}>
        {PROBLEMS.filter((p) => p.achievement).map((p) => {
          const got = state.achievements.includes(p.achievement!.id)
          return (
            <div key={p.id} className="row small" style={{ padding: '3px 0' }}>
              <span className="grow" style={{ opacity: got ? 1 : 0.45 }}>
                {got ? '🏅' : '🔒'} {p.achievement!.name}
              </span>
              <span className="tiny muted">{got ? '달성' : p.name}</span>
            </div>
          )
        })}
      </Card>

      <Card title="랭킹">
        <Soon text="시즌 랭킹 · 크루 · 친구" />
        <div className="tiny muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          종합 성장 / 최고 난도 완등왕 / 초견왕 / 리치 극복왕 / 인맥왕 / 원정왕 / 알바왕 …
          점수는 서버에서 계산할 예정이라 아직 열지 않았어요.
        </div>
      </Card>

      <Card title="설정">
        <button className="btn" onClick={() => setFastMode(!state.settings.fastMode)}>
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="grow">빠른 진행</span>
            <span className={`chip ${state.settings.fastMode ? 'on' : ''}`}>
              {state.settings.fastMode ? '켜짐' : '꺼짐'}
            </span>
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>등반 연출을 짧게 넘깁니다.</div>
        </button>

        <div className="spacer" />
        <div className="tiny muted" style={{ marginBottom: 6 }}>
          개발자용 시간 배속 — 현재 하루 = {formatDuration(dayLengthMs(state))}
        </div>
        <div className="row wrap">
          {BALANCE.time.timeScaleOptions.map((v) => (
            <button
              key={v}
              className={`btn small${state.settings.devTimeScale === v ? ' primary' : ''}`}
              onClick={() => setTimeScale(v)}
            >
              ×{v}
            </button>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          운영 배포에서는 ×1로 고정됩니다. 테스트용 설정이에요.
        </div>
      </Card>

      <Card title="캐릭터">
        {needsProfile && (
          <div className="warn-box info">
            성별과 나이가 아직 설정되지 않았어요. 한 번만 정해두면 프로필에 표시돼요.
          </div>
        )}
        <button className="btn center" onClick={() => setProfileOpen(true)}>
          캐릭터 기본 정보 설정
        </button>
        <div className="tiny muted" style={{ margin: '6px 0 10px' }}>
          성별·나이·소속 지점만 바꿔요. 능력치와 기록은 그대로예요.
        </div>
        <button className="btn ghost center" onClick={beginOnboarding}>
          캐릭터 생성 화면 미리보기
        </button>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          지금 세이브를 지우지 않아요. 마지막에 어떻게 적용할지 고를 수 있어요.
        </div>
      </Card>

      <Card title="데이터">
        <div className="tiny muted" style={{ marginBottom: 8, lineHeight: 1.6 }}>
          저장 위치: 이 브라우저(로컬) · 모드: 게스트 클라이머 데모<br />
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

      <Card title="개발 정보">
        <div className="tiny muted" style={{ lineHeight: 1.7 }}>
          클라이머 키우기 MVP 0.1.0<br />
          하루 기본 길이 {formatDuration(BALANCE.time.dayMs)} · 오프라인 인정 상한 {BALANCE.time.offlineCapHours}시간<br />
          등반 문제 {PROBLEMS.length}개 · 활동 {ACTIVITIES.length}개 · NPC {NPCS.length}명<br />
          모든 에셋은 코드로 생성한 자체 도트입니다.
        </div>
      </Card>
    </div>
  )
}
