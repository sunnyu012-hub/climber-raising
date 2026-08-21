import { useMemo, useState } from 'react'
import { GRADE_LABEL, MOVE_LABEL } from '../game/balance'
import { formatDuration } from '../game/clock'
import { collectModifiers } from '../game/character'
import { TIER_LABEL, baseChanceOf, chanceTier } from '../game/climb'
import { getGym } from '../content/gyms'
import { useGame } from '../store/gameStore'
import { Wall } from './Wall'
import type { BetaChoice, Outcome, PoseKey } from '../game/types'

const OUTCOME_LABEL: Record<Outcome, string> = {
  crit: '대성공!', success: '성공', partial: '버텼다', fall: '추락',
}

/** 등반 세션 — 타이밍 입력 없음. 상황을 읽고 베타를 고르면 즉시 결과가 나온다. */
export function ClimbSessionView() {
  const state = useGame((s) => s.state)
  const session = useGame((s) => s.session)!
  const chooseBeta = useGame((s) => s.chooseBeta)
  const exitClimb = useGame((s) => s.exitClimb)
  const [showing, setShowing] = useState(false)
  const fast = state.settings.fastMode

  const mods = useMemo(
    () => collectModifiers(state.climber, state.npc, getGym(state.gymId)),
    [state.climber, state.npc, state.gymId],
  )

  const { problem, stepIndex, status, lastResult } = session
  const finished = status !== 'active'
  const step = problem.steps[Math.min(stepIndex, problem.steps.length - 1)]
  const progress = finished && status === 'cleared' ? 1 : stepIndex / problem.steps.length

  const pose: PoseKey = status === 'fallen' ? 'fall'
    : status === 'cleared' ? 'top'
    : showing && lastResult ? lastResult.pose
    : stepIndex === 0 ? 'lookUp' : 'idle'

  const onChoose = (c: BetaChoice) => {
    if (showing) return
    chooseBeta(c.id)   // 판정은 게임 레이어에서 — UI는 결과를 표시만 한다
    setShowing(true)   // 선택 즉시(다음 프레임) 반응이 시작된다
  }

  // 완등/추락이어도 마지막 연출 문구를 먼저 보여준 뒤 결과 화면으로 넘어간다.
  if (finished && !showing) {
    return (
      <ClimbFinish
        cleared={status === 'cleared'}
        onExit={exitClimb}
      />
    )
  }

  return (
    <div className="screen">
      <div className="row" style={{ alignItems: 'center', marginBottom: 8 }}>
        <span className="grade">{GRADE_LABEL(problem.grade)}</span>
        <span className="grow" style={{ fontSize: 14 }}>{problem.name}</span>
        <span className="step-dots">
          {problem.steps.map((_, i) => (
            <i key={i} data-on={i < stepIndex ? '1' : '0'} data-cur={i === stepIndex ? '1' : '0'} />
          ))}
        </span>
      </div>

      <Wall problem={problem} progress={progress} pose={pose} fast={fast} appearance={state.climber.appearance} />

      {showing && lastResult ? (
        <button
          className="btn ghost"
          style={{ padding: 0, border: 0, boxShadow: 'none', marginTop: 12, textAlign: 'left' }}
          onClick={() => setShowing(false)}
        >
          <div className={`result-text ${lastResult.outcome}`}>
            <div className="small b" style={{ marginBottom: 4 }}>
              {OUTCOME_LABEL[lastResult.outcome]}
              {lastResult.luckyEvent && ' 🍀'}
            </div>
            {lastResult.text}
            <div className="tiny muted" style={{ marginTop: 6 }}>
              체력 {fmt(-lastResult.cost.hp)} · 피로 {fmt(lastResult.cost.fatigue)}
              {session.hurt && ' · 어딘가 삐끗했다'}
            </div>
          </div>
          <div className="tiny muted center" style={{ padding: '8px 0' }}>
            {finished ? '탭해서 결과 보기' : '탭하면 다음 동작으로'}
          </div>
        </button>
      ) : (
        <>
          <div className="situation">{step.situation}</div>
          <div className="line-bubble">💬 {step.line}</div>
          {session.retries > 0 && (
            <div className="warn-box">
              버티는 중이에요. 여기서 한 번 더 실패하면 떨어져요. (남은 기회 {3 - session.retries}회)
            </div>
          )}
          {step.choices.map((c) => {
            const chance = baseChanceOf({ climber: state.climber, problem, mods }, c)
            const tier = chanceTier(chance)
            const risky = mods.injuryWarn > 0 && (c.cost.finger ?? 0) + (c.cost.shoulder ?? 0) + (c.cost.knee ?? 0) >= 5
            return (
              <button key={c.id} className="btn" style={{ marginBottom: 8 }} onClick={() => onChoose(c)}>
                <div className="row" style={{ alignItems: 'center' }}>
                  <span className="grow">{c.label}</span>
                  <span className={`tier ${tier}`}>
                    {mods.revealChance > 0 ? `${Math.round(chance * 100)}%` : TIER_LABEL[tier]}
                  </span>
                </div>
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  {c.moves.map((m) => MOVE_LABEL[m]).join(' + ')}
                  {risky && ' · ⚠️ 관절 부담 큼'}
                </div>
              </button>
            )
          })}
          <button className="btn ghost center" onClick={exitClimb}>내려오기</button>
          <div className="tiny muted center" style={{ marginTop: 8 }}>
            내려오면 이번 시도는 없던 일이 돼요.
          </div>
        </>
      )}
    </div>
  )
}

const fmt = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v)}`

function ClimbFinish({ cleared, onExit }: { cleared: boolean; onExit: () => void }) {
  const session = useGame((s) => s.session)!
  const state = useGame((s) => s.state)
  const rec = state.records[session.problem.id]

  return (
    <div className="screen">
      <div className="center" style={{ padding: '10px 0' }}>
        <div style={{ fontSize: 34 }}>{cleared ? '🏁' : '💥'}</div>
        <div style={{ fontSize: 18, margin: '6px 0' }}>
          {cleared ? '완등!' : '떨어졌다'}
        </div>
        <div className="mini">{session.problem.name}</div>
      </div>

      <Wall problem={session.problem} progress={cleared ? 1 : 0} pose={cleared ? 'top' : 'mat'} height={180} appearance={state.climber.appearance} />

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-title"><span>결과</span></div>
        <Row k="획득 경험치" v={`+${session.gainedExp} EXP`} />
        {cleared && rec?.onsight && <Row k="초견 보너스" v="적용됨 🌟" />}
        <Row k="일정 단축" v={formatDuration(session.speedupTotal)} />
        {session.hurt && <Row k="상태" v="어딘가 삐끗했어요 🤕" />}
        <hr className="sep" />
        <div className="mini">
          {cleared
            ? session.problem.flavor
            : '실패해도 무브 숙련도와 경험치는 남았어요. 다음엔 다른 베타를 써볼까요?'}
        </div>
      </div>

      <button className="btn primary center" onClick={onExit}>돌아가기</button>
    </div>
  )
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="row small" style={{ padding: '3px 0' }}>
    <span className="grow muted">{k}</span>
    <span>{v}</span>
  </div>
)
