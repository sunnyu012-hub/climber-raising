import { DAY_NAMES } from '../game/balance'
import { formatDuration } from '../game/clock'
import { buildWarnings, levelExpNeeded } from '../game/character'
import { GENDER_LABEL } from '../game/newGame'
import { getBodyType, getSpecialty } from '../content/traits'
import { restDaysInWeek } from '../game/progress'
import { getActivity } from '../content/activities'
import { getGym } from '../content/gyms'
import { problemsOfGym } from '../content/problems'
import { activeQuests } from '../game/quests'
import { useGame } from '../store/gameStore'
import { Card, Gauge, JointRow, StatLine, Warnings } from './bits'
import { SpriteButton } from './Sprite'
import type { TabKey } from './TabBar'

export function HomeScreen({ go, remaining }: { go: (t: TabKey) => void; remaining: number }) {
  const state = useGame((s) => s.state)
  const c = state.climber
  const gym = getGym(state.gymId)
  const today = getActivity(state.schedule.days[state.schedule.dayIndex])
  const warns = buildWarnings(c, restDaysInWeek(state))
  const problems = problemsOfGym(state.gymId)
  const body = getBodyType(c.reach)
  const spec = getSpecialty(c.specialtyId)
  const quests = activeQuests(state)
  const readyQuests = quests.filter((q) => q.progress.completed && !q.progress.claimed)
  const inProgress = quests.filter((q) => !q.progress.completed)
  const cleared = problems.filter((p) => state.records[p.id]?.cleared).length

  const pose = c.condition.fatigue > 70 || c.condition.hp < 25 ? 'tired'
    : today?.kind === 'rest' || today?.kind === 'rehab' ? 'rest'
    : today?.kind === 'train' ? 'lookUp'
    : 'idle'

  return (
    <div className="screen">
      <Card tight>
        <div className="profile">
          {/* 캐릭터가 작아져도 터치 영역은 44px을 유지한다 */}
          <SpriteButton
            pose={pose}
            size="small"
            appearance={c.appearance}
            onClick={() => go('growth')}
            label={`${c.name} 성장 화면 열기`}
          />
          <div className="p-body">
            {/* 정보 우선순위: 닉네임·레벨 → 암장 → 체형·주특기 → 성별·나이 */}
            <div className="p-name">{c.name} <span className="muted small">Lv.{c.level}</span></div>
            <div className="p-gym">{gym.displayName}</div>
            <div className="p-traits">{body.name} · {spec.name}</div>
            <div className="p-sub">
              {c.gender === 'unset' && c.age === null
                ? '기본 정보 미설정 · 더보기에서 설정할 수 있어요'
                : [
                    c.gender !== 'unset' ? GENDER_LABEL[c.gender] : null,
                    c.age !== null ? `${c.age}세` : null,
                    `${c.height}cm`,
                  ].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <Gauge value={c.exp} max={levelExpNeeded(c.level)} kind="exp" />
          <div className="tiny muted" style={{ marginTop: 3 }}>
            다음 레벨까지 {Math.max(0, levelExpNeeded(c.level) - c.exp)} EXP
          </div>
        </div>
      </Card>

      <Card
        title={`${state.schedule.week}주차 ${DAY_NAMES[state.schedule.dayIndex]}요일 · 오늘의 일정`}
        right={<span className="tiny muted">남은 시간 {formatDuration(remaining)}</span>}
      >
        {today ? (
          <>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{today.icon} {today.name}</div>
            <div className="mini">{today.desc}</div>
          </>
        ) : (
          <div className="mini">오늘은 일정이 비어 있어요. 그냥 쉬는 것도 나쁘지 않아요.</div>
        )}
        <div className="spacer" />
        <button className="btn ghost center" onClick={() => go('schedule')}>일정 편성하기 →</button>
      </Card>

      <Card title="컨디션">
        <StatLine label="체력" value={c.condition.hp} kind="hp" />
        <StatLine label="피로" value={c.condition.fatigue} kind="fatigue" />
        <StatLine label="의욕" value={c.condition.mood} kind="mood" />
        <div className="spacer" />
        <JointRow condition={c.condition} />
      </Card>

      {warns.length > 0 && (
        <Card title="몸이 하는 말">
          <Warnings items={warns} limit={3} />
        </Card>
      )}

      <Card title="오늘의 암장">
        <div className="row" style={{ alignItems: 'center', gap: 8 }}>
          <span className="slot-swatch" style={{ background: gym.theme.sign, borderColor: gym.theme.accent }} />
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="small" style={{ display: 'block' }}>{gym.displayName}</span>
            <span className="tiny muted">
              친숙도 {Math.floor(state.world.gymFamiliarity[gym.id] ?? 0)} ·
              문제 {problems.length}개 · 완등 {cleared}개
            </span>
          </span>
        </div>
      </Card>

      <Card title="지금 할 수 있는 것">
        <button className="btn primary center" onClick={() => go('climb')}>
          🧗 문제에 도전한다 ({cleared}/{problems.length} 완등)
        </button>
        <div className="spacer" />
        <div className="row">
          <button className="btn ghost center grow" onClick={() => go('growth')}>📈 성장</button>
          <button className="btn ghost center grow" onClick={() => go('menu')}>👥 사람들</button>
        </div>
        <div className="tiny muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          직접 등반하면 오늘 일정이 앞당겨지고 경험치도 더 받아요.
          접속 못 해도 일정은 알아서 굴러가니 걱정 마세요.
        </div>
      </Card>

      {readyQuests.length > 0 && (
        <Card title="받을 보상이 있어요" right={<span className="mi-badge">{readyQuests.length}</span>}>
          {readyQuests.map(({ quest }) => (
            <div key={quest.id} className="row small" style={{ padding: '3px 0' }}>
              <span className="grow">📜 {quest.name}</span>
              <span className="tiny muted">완료</span>
            </div>
          ))}
          <div className="spacer" />
          <button className="btn primary center" onClick={() => go('menu')}>메뉴 → 퀘스트에서 받기</button>
        </Card>
      )}

      {inProgress.length > 0 && (
        <Card title="진행 중인 목표">
          {inProgress.slice(0, 3).map(({ quest, progress }) => {
            const g = quest.goals[0]
            const cur = Math.min(g.count, progress.counts[0] ?? 0)
            return (
              <div key={quest.id} style={{ marginBottom: 8 }}>
                <div className="row tiny" style={{ marginBottom: 2 }}>
                  <span className="grow">{quest.name}</span>
                  <span className="muted">{cur}/{g.count}</span>
                </div>
                <div className="gauge exp"><i style={{ width: `${(cur / g.count) * 100}%` }} /></div>
              </div>
            )
          })}
        </Card>
      )}

      <Card title="최근 기록">
        {state.log.length === 0 ? (
          <div className="mini muted">아직 기록이 없어요.</div>
        ) : (
          state.log.slice(0, 6).map((l, i) => (
            <div key={i} className="mini" style={{ padding: '3px 0' }}>
              {l.icon} {l.text}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
