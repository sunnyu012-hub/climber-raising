import { useState } from 'react'
import { AGE, GENDER_LABEL, clampAge } from '../game/newGame'
import { SELECTABLE_GYMS } from '../content/gyms'
import { useGame } from '../store/gameStore'
import type { Gender } from '../game/types'

/**
 * 기존 사용자용 기본 정보 보완.
 * 마이그레이션에서 성별·나이를 임의로 확정하지 않았기 때문에 여기서 한 번 채운다.
 * 능력치·레벨·기록은 건드리지 않는다.
 */
export function ProfileSettings({ onClose }: { onClose: () => void }) {
  const climber = useGame((s) => s.state.climber)
  const gymId = useGame((s) => s.state.gymId)
  const patchProfile = useGame((s) => s.patchProfile)

  const [gender, setGender] = useState<Gender>(climber.gender)
  const [age, setAge] = useState<number>(climber.age ?? AGE.default)
  const [gym, setGym] = useState<string>(gymId)

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-title">
          <span>캐릭터 기본 정보 설정</span>
          <button className="btn small" onClick={onClose}>닫기</button>
        </div>

        <div className="tiny muted" style={{ marginBottom: 10, lineHeight: 1.6 }}>
          능력치·레벨·기록은 그대로예요. 표시 정보와 소속 지점만 바뀝니다.
        </div>

        <div className="card tight">
          <div className="card-title"><span>성별</span></div>
          <div className="row">
            {(['female', 'male'] as Gender[]).map((g) => (
              <button
                key={g}
                className={`btn center grow${gender === g ? ' primary' : ''}`}
                onClick={() => setGender(g)}
              >
                {GENDER_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="card tight">
          <div className="card-title"><span>나이</span><span className="b">{age}세</span></div>
          <div className="row" style={{ alignItems: 'center' }}>
            <button className="btn small" style={{ minWidth: 48 }} onClick={() => setAge(clampAge(age - 1))} aria-label="나이 줄이기">−</button>
            <input
              className="text-input center grow"
              type="number" inputMode="numeric"
              value={age} min={AGE.min} max={AGE.max}
              onChange={(e) => setAge(clampAge(Number(e.target.value)))}
              aria-label="나이"
            />
            <button className="btn small" style={{ minWidth: 48 }} onClick={() => setAge(clampAge(age + 1))} aria-label="나이 늘리기">＋</button>
          </div>
        </div>

        <div className="card tight">
          <div className="card-title"><span>소속 지점</span></div>
          {SELECTABLE_GYMS.map((g) => (
            <button
              key={g.id}
              className={`btn center${gym === g.id ? ' primary' : ''}`}
              style={{ marginBottom: 6 }}
              onClick={() => setGym(g.id)}
            >
              {g.branchName}
            </button>
          ))}
          <div className="tiny muted">지점 간 능력치·보상 차이는 없어요.</div>
        </div>

        <button
          className="btn primary center"
          onClick={() => { patchProfile({ gender, age, gymId: gym }); onClose() }}
        >
          저장
        </button>
      </div>
    </div>
  )
}
