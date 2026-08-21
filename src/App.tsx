import { useEffect, useState } from 'react'
import { BALANCE, DAY_NAMES } from './game/balance'
import { now } from './game/clock'
import { remainingMsOfDay } from './game/progress'
import { getGym } from './content/gyms'
import { useGame } from './store/gameStore'
import { TabBar, type TabKey } from './ui/TabBar'
import { HomeScreen } from './ui/HomeScreen'
import { ScheduleScreen } from './ui/ScheduleScreen'
import { ClimbScreen } from './ui/ClimbScreen'
import { ClimbSessionView } from './ui/ClimbSessionView'
import { GrowthScreen } from './ui/GrowthScreen'
import { MenuScreen } from './ui/MenuScreen'
import { ToastHost } from './ui/Toast'
import { OfflineReport } from './ui/OfflineReport'
import { OnboardingFlow } from './ui/OnboardingFlow'

export default function App() {
  const ready = useGame((s) => s.ready)
  const draft = useGame((s) => s.draft)
  const state = useGame((s) => s.state)
  const session = useGame((s) => s.session)
  const init = useGame((s) => s.init)
  const tick = useGame((s) => s.tick)
  const [tab, setTab] = useState<TabKey>('home')
  const [remaining, setRemaining] = useState(0)

  useEffect(() => { void init() }, [init])

  // 게임 시계 — 일정 자동 진행. 탭 복귀 시에도 즉시 한 번 돈다.
  useEffect(() => {
    if (!ready || draft) return
    const id = setInterval(() => {
      tick()
      setRemaining(remainingMsOfDay(useGame.getState().state, now()))
    }, BALANCE.time.tickMs)
    // 탭에서 벗어났다 돌아온 경우에만 오프라인 리포트를 띄운다
    const onVisible = () => { if (!document.hidden) tick(true) }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [ready, draft, tick])

  if (!ready) {
    return (
      <div className="frame">
        <div className="screen center muted" style={{ paddingTop: 120 }}>불러오는 중…</div>
      </div>
    )
  }

  if (draft) {
    return (
      <div className="frame">
        <header className="topbar">
          <div>
            <div className="t-title">클라이머 만들기</div>
            <div className="t-sub">부산에서 시작합니다</div>
          </div>
        </header>
        <OnboardingFlow />
      </div>
    )
  }

  const climbing = !!session
  const gym = getGym(state.gymId)

  return (
    <ToastHost>
    <div className="frame">
      <header className="topbar">
        <div style={{ minWidth: 0 }}>
          <div className="t-title">
            {climbing ? session.problem.name : gym.displayName}
          </div>
          <div className="t-sub">
            {climbing
              ? `${session.stepIndex + 1} / ${session.problem.steps.length} 동작`
              : `${state.schedule.week}주차 ${DAY_NAMES[state.schedule.dayIndex]}요일`}
          </div>
        </div>
        <div className="t-money">
          {state.climber.money.toLocaleString()}원
        </div>
      </header>

      {climbing ? (
        <ClimbSessionView />
      ) : (
        <>
          {tab === 'home' && <HomeScreen go={setTab} remaining={remaining} />}
          {tab === 'schedule' && <ScheduleScreen />}
          {tab === 'climb' && <ClimbScreen />}
          {tab === 'growth' && <GrowthScreen />}
          {tab === 'menu' && <MenuScreen />}
        </>
      )}

      {!climbing && <TabBar tab={tab} onChange={setTab} />}
      <OfflineReport />
    </div>
    </ToastHost>
  )
}
