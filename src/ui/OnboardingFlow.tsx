import { useMemo, useState } from 'react'
import { generateCharacter, newSeed, rollNickname } from '../game/characterGen'
import { AGE, GENDER_LABEL, clampAge, draftBlocker } from '../game/newGame'
import { systemRng } from '../game/rng'
import { NICKNAME_RULE, isValidNickname } from '../content/nicknames'
import { SELECTABLE_GYMS, getGym } from '../content/gyms'
import { getBodyType } from '../content/traits'
import { useGame } from '../store/gameStore'
import { CharacterCard } from './CharacterCard'
import { Sprite } from './Sprite'
import type { Gender, OnboardingDraft } from '../game/types'

const STEPS = ['기본 정보', '내 클라이머', '시작 암장'] as const

/**
 * 3단계 온보딩.
 * 랜덤 생성과 능력치 배분은 전부 game/characterGen.ts의 순수 함수가 한다 —
 * 이 컴포넌트는 draft를 고치고 결과를 보여줄 뿐이다.
 */
export function OnboardingFlow() {
  const draft = useGame((s) => s.draft)!
  const setDraft = useGame((s) => s.setDraft)
  const finishOnboarding = useGame((s) => s.finishOnboarding)
  const applyAppearanceOnly = useGame((s) => s.applyAppearanceOnly)
  const cancelOnboarding = useGame((s) => s.cancelOnboarding)
  const resetGame = useGame((s) => s.resetGame)
  // 이미 플레이 중인 사용자가 더보기에서 연 경우 = 다시 만들기
  const isRecreate = useGame((s) => s.state.onboardingCompleted)

  const climber = useMemo(
    () => generateCharacter({
      seed: draft.seed, nickname: draft.nickname.trim() || '이름없음',
      gender: draft.gender, age: draft.age,
    }),
    [draft.seed, draft.nickname, draft.gender, draft.age],
  )

  const patch = (p: Partial<OnboardingDraft>) => setDraft({ ...draft, ...p })
  const go = (step: OnboardingDraft['step']) => patch({ step })

  return (
    <div className="screen" style={{ paddingBottom: 20 }}>
      {draft.step < 4 && (
        <div className="steps">
          {STEPS.map((label, i) => (
            <div key={label} className="step" data-on={draft.step === i + 1 ? '1' : '0'} data-done={draft.step > i + 1 ? '1' : '0'}>
              <span className="n">{draft.step > i + 1 ? '✓' : i + 1}</span>
              <span className="l">{label}</span>
            </div>
          ))}
        </div>
      )}

      {draft.step === 1 && <StepBasics draft={draft} patch={patch} onNext={() => go(2)} />}
      {draft.step === 2 && (
        <StepCharacter
          draft={draft}
          climber={climber}
          onReroll={() => patch({ seed: newSeed() })}
          onBack={() => go(1)}
          onNext={() => go(3)}
        />
      )}
      {draft.step === 3 && (
        <StepGym draft={draft} patch={patch} onBack={() => go(2)} onNext={() => go(4)} />
      )}
      {draft.step === 4 && (
        <StepConfirm
          draft={draft}
          climber={climber}
          isRecreate={isRecreate}
          onBack={() => go(3)}
          onStart={() => finishOnboarding()}
          onAppearanceOnly={() => applyAppearanceOnly(draft)}
          onCancel={cancelOnboarding}
          onFullReset={() => { void resetGame() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- 1단계
function StepBasics({ draft, patch, onNext }: {
  draft: OnboardingDraft
  patch: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
}) {
  const nameOk = isValidNickname(draft.nickname)

  return (
    <>
      <div className="card tight">
        <div className="card-title">
          <span>닉네임</span>
          <button className="btn small" onClick={() => patch({ nickname: rollNickname(systemRng) })}>
            🎲 다른 이름
          </button>
        </div>
        <input
          className="text-input"
          value={draft.nickname}
          maxLength={NICKNAME_RULE.max}
          onChange={(e) => patch({ nickname: e.target.value })}
          placeholder="2~10자"
          aria-label="닉네임"
        />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          {nameOk
            ? '암장에서 이렇게 불릴 거예요.'
            : `${NICKNAME_RULE.min}~${NICKNAME_RULE.max}자로 정해주세요.`}
        </div>
      </div>

      <div className="card tight">
        <div className="card-title"><span>성별</span></div>
        <div className="row">
          {(['female', 'male'] as Gender[]).map((g) => (
            <button
              key={g}
              className={`btn center grow${draft.gender === g ? ' primary' : ''}`}
              onClick={() => patch({ gender: g })}
            >
              {GENDER_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          능력치에는 전혀 영향을 주지 않아요. 외형 후보와 소개 문구에만 쓰여요.
        </div>
      </div>

      <div className="card tight">
        <div className="card-title">
          <span>나이</span>
          <span className="b">{draft.age}세</span>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button
            className="btn small"
            style={{ minWidth: 48 }}
            onClick={() => patch({ age: clampAge(draft.age - 1) })}
            aria-label="나이 줄이기"
          >−</button>
          <input
            className="text-input center grow"
            type="number"
            inputMode="numeric"
            value={draft.age}
            min={AGE.min}
            max={AGE.max}
            onChange={(e) => patch({ age: clampAge(Number(e.target.value)) })}
            aria-label="나이"
          />
          <button
            className="btn small"
            style={{ minWidth: 48 }}
            onClick={() => patch({ age: clampAge(draft.age + 1) })}
            aria-label="나이 늘리기"
          >＋</button>
        </div>
        <input
          type="range"
          min={AGE.min}
          max={AGE.max}
          value={draft.age}
          onChange={(e) => patch({ age: clampAge(Number(e.target.value)) })}
          style={{ width: '100%', accentColor: 'var(--coral)', height: 32, marginTop: 8 }}
          aria-label="나이 슬라이더"
        />
        <div className="row tiny muted" style={{ justifyContent: 'space-between' }}>
          <span>{AGE.min}세</span><span>{AGE.max}세</span>
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          나이는 프로필과 대사에만 쓰여요. 능력치 유불리는 없어요.
        </div>
      </div>

      <button className="btn primary center" disabled={!nameOk} onClick={onNext}>
        다음: 내 클라이머 만나기
      </button>
      {!nameOk && <div className="tiny muted center" style={{ marginTop: 8 }}>닉네임을 정하면 다음으로 갈 수 있어요.</div>}
    </>
  )
}

// ---------------------------------------------------------------- 2단계
function StepCharacter({ draft, climber, onReroll, onBack, onNext }: {
  draft: OnboardingDraft
  climber: ReturnType<typeof generateCharacter>
  onReroll: () => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div className="center tiny muted" style={{ marginBottom: 8 }}>
        성별과 나이는 그대로 두고 나머지를 다시 뽑을 수 있어요.
      </div>

      <CharacterCard climber={climber} sparkle={draft.seed} />

      <div className="row">
        <button className="btn accent center grow" onClick={onReroll}>🎲 다시 뽑기</button>
        <button className="btn ghost center grow" onClick={onBack}>기본 정보 수정</button>
      </div>
      <div className="spacer" />
      <button className="btn primary center" onClick={onNext}>이 캐릭터로 시작</button>
    </>
  )
}

// ---------------------------------------------------------------- 3단계
function StepGym({ draft, patch, onBack, onNext }: {
  draft: OnboardingDraft
  patch: (p: Partial<OnboardingDraft>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div className="center tiny muted" style={{ marginBottom: 8 }}>
        어느 지점을 골라도 능력치와 보상은 같아요. 분위기만 달라요.
      </div>

      {SELECTABLE_GYMS.map((g) => {
        const on = draft.gymId === g.id
        return (
          <button
            key={g.id}
            className="gym-card"
            data-on={on ? '1' : '0'}
            onClick={() => patch({ gymId: g.id })}
          >
            <GymThumb sign={g.theme.sign} wall={g.theme.wall} accent={g.theme.accent} />
            <span className="gym-body">
              <span className="gym-name">{g.branchName} {on && '✓'}</span>
              <span className="tiny muted">부산 · {g.character}</span>
              <span className="mini" style={{ marginTop: 4, display: 'block' }}>{g.tagline}</span>
            </span>
          </button>
        )
      })}

      <div className="row">
        <button className="btn ghost center grow" onClick={onBack}>← 이전</button>
        <button className="btn primary center grow" disabled={!draft.gymId} onClick={onNext}>
          다음
        </button>
      </div>
      {!draft.gymId && (
        <div className="tiny muted center" style={{ marginTop: 8 }}>지점을 고르면 다음으로 갈 수 있어요.</div>
      )}
    </>
  )
}

/** 지점 미리보기 — 이미지 파일 없이 도트 사각형으로만 그린다. */
function GymThumb({ sign, wall, accent }: { sign: string; wall: string; accent: string }) {
  return (
    <svg width={56} height={56} viewBox="0 0 28 28" shapeRendering="crispEdges" aria-hidden="true">
      <rect x={0} y={0} width={28} height={22} fill={wall} />
      <rect x={0} y={22} width={28} height={6} fill="#7b8fa8" />
      <rect x={0} y={0} width={28} height={3} fill={sign} />
      <rect x={5} y={7} width={4} height={3} fill={accent} />
      <rect x={17} y={5} width={3} height={3} fill={accent} />
      <rect x={11} y={13} width={4} height={2} fill={accent} />
      <rect x={20} y={14} width={3} height={3} fill={accent} />
      <rect x={6} y={17} width={3} height={2} fill={accent} />
    </svg>
  )
}

// ---------------------------------------------------------------- 4단계
function StepConfirm({ draft, climber, isRecreate, onBack, onStart, onAppearanceOnly, onCancel, onFullReset }: {
  draft: OnboardingDraft
  climber: ReturnType<typeof generateCharacter>
  isRecreate: boolean
  onBack: () => void
  onStart: () => void
  onAppearanceOnly: () => void
  onCancel: () => void
  onFullReset: () => void
}) {
  const gym = getGym(draft.gymId ?? '')
  const body = getBodyType(climber.reach)
  const blocker = draftBlocker(draft)
  const [wipeConfirm, setWipeConfirm] = useState(false)

  return (
    <>
      <div className="center" style={{ padding: '8px 0 12px' }}>
        <Sprite pose="lookUp" size="medium" appearance={climber.appearance} />
        <div style={{ fontSize: 17, marginTop: 6 }}>{climber.name}의 클라이밍 생활</div>
        <div className="small muted" style={{ marginTop: 4 }}>
          {GENDER_LABEL[climber.gender]} · {climber.age}세 · {body.name}
        </div>
        <div className="small" style={{ marginTop: 6 }}>
          시작 암장: <span className="b">{gym.displayName}</span>
        </div>
        <div className="mini muted" style={{ marginTop: 10 }}>이제 첫 문제를 만나러 가볼까요?</div>
      </div>

      {blocker && <div className="warn-box" style={{ marginBottom: 8 }}>{blocker}</div>}

      {!isRecreate ? (
        <button className="btn primary center" disabled={!!blocker} onClick={onStart}>
          클라이밍 생활 시작!
        </button>
      ) : (
        <>
          <div className="warn-box">
            캐릭터를 다시 만들면 외형과 기본 특성이 변경됩니다.<br />
            현재 레벨, 돈, 스킬과 기록은 유지할까요?
          </div>
          <button className="btn primary center" disabled={!!blocker} onClick={onAppearanceOnly}>
            외형과 기본 정보만 변경 (기록 유지)
          </button>
          <div className="spacer" />
          {wipeConfirm ? (
            <>
              <div className="warn-box danger">
                레벨·돈·스킬·완등 기록이 전부 사라져요. 되돌릴 수 없어요.
              </div>
              <button className="btn accent center" disabled={!!blocker} onClick={onFullReset}>
                네, 전부 초기화하고 새로 시작
              </button>
              <div className="spacer" />
              <button className="btn ghost center" onClick={() => setWipeConfirm(false)}>아니요</button>
            </>
          ) : (
            <button className="btn ghost center" onClick={() => setWipeConfirm(true)}>
              전체 데이터를 초기화하고 새로 시작
            </button>
          )}
          <div className="spacer" />
          <button className="btn ghost center" onClick={onCancel}>취소하고 돌아가기</button>
        </>
      )}

      <div className="spacer" />
      <button className="btn ghost center" onClick={onBack}>← 암장 다시 고르기</button>
    </>
  )
}
