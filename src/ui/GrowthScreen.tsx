import { MOVE_LABEL, STAT_LABEL } from '../game/balance'
import { GENDER_LABEL } from '../game/newGame'
import { getBodyType, getPersonality, getSpecialty } from '../content/traits'
import { Sprite } from './Sprite'
import { levelExpNeeded, statExpNeeded } from '../game/character'
import { ALL_MOVES } from '../content/moves'
import { BRANCH_BLURB, BRANCH_LABEL, SKILLS } from '../content/skills'
import { useGame } from '../store/gameStore'
import { Card, JointRow, StatLine, Soon } from './bits'
import type { SkillBranch, StatKey } from '../game/types'

export function GrowthScreen() {
  const c = useGame((s) => s.state.climber)
  const learnSkill = useGame((s) => s.learnSkill)
  const body = getBodyType(c.reach)
  const spec = getSpecialty(c.specialtyId)
  const pers = getPersonality(c.personalityId)

  const branches: SkillBranch[] = ['technician', 'power', 'wellness']

  return (
    <div className="screen">
      <Card title="캐릭터" right={<span className="tiny muted">{body.name}</span>}>
        <div className="row" style={{ alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Sprite pose="idle" size="medium" appearance={c.appearance} />
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15 }}>{c.name}</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {c.gender !== 'unset' ? GENDER_LABEL[c.gender] : '성별 미설정'}
              {c.age !== null ? ` · ${c.age}세` : ' · 나이 미설정'} · {c.height}cm
            </div>
            <div style={{ marginTop: 4 }}>
              <span className="chip on">{spec.name}</span>
              <span className="chip">{pers.name}</span>
            </div>
          </div>
        </div>
        <div className="line-bubble">💬 “{c.intro}”</div>
        <div className="tiny muted" style={{ marginBottom: 8 }}>{body.desc}</div>
        <div className="row small" style={{ marginBottom: 6 }}>
          <span className="grow">Lv.{c.level}</span>
          <span className="muted">{c.exp} / {levelExpNeeded(c.level)} EXP</span>
        </div>
        <StatLine label="레벨 경험치" value={c.exp} max={levelExpNeeded(c.level)} kind="exp" suffix="" />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          보유 금액 {c.money.toLocaleString()}원 · 스킬 포인트 {c.skillPoints}
        </div>
      </Card>

      <Card title="능력치">
        {(Object.keys(c.stats) as StatKey[]).map((k) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div className="row tiny" style={{ marginBottom: 2 }}>
              <span className="grow">{STAT_LABEL[k]}</span>
              <span className="muted">
                {c.stats[k]} · {Math.floor(c.statExp[k])}/{statExpNeeded(c.stats[k])}
              </span>
            </div>
            <div className="gauge exp">
              <i style={{ width: `${Math.min(100, (c.statExp[k] / statExpNeeded(c.stats[k])) * 100)}%` }} />
            </div>
          </div>
        ))}
      </Card>

      <Card title="컨디션">
        <StatLine label="체력" value={c.condition.hp} kind="hp" />
        <StatLine label="피로" value={c.condition.fatigue} kind="fatigue" />
        <StatLine label="의욕" value={c.condition.mood} kind="mood" />
        <div className="spacer" />
        <JointRow condition={c.condition} />
      </Card>

      <Card title="무브 숙련도" right={<span className="tiny muted">쓸수록 오르고, 높을수록 천천히</span>}>
        {ALL_MOVES.map((m) => (
          <div key={m} className="stat-row">
            <span className="lbl" style={{ width: 84 }}>{MOVE_LABEL[m]}</span>
            <span className="grow">
              <div className="gauge"><i style={{ width: `${c.mastery[m]}%` }} /></div>
            </span>
            <span className="val">{Math.floor(c.mastery[m])}</span>
          </div>
        ))}
      </Card>

      <Card title="스킬트리" right={<span className="tiny muted">포인트 {c.skillPoints}</span>}>
        {branches.map((b) => (
          <div key={b} style={{ marginBottom: 12 }}>
            <div className="small b">{BRANCH_LABEL[b]}</div>
            <div className="tiny muted" style={{ marginBottom: 6 }}>{BRANCH_BLURB[b]}</div>
            {SKILLS.filter((s) => s.branch === b).map((s) => {
              const owned = c.skills.includes(s.id)
              const locked = !!s.requires && !c.skills.includes(s.requires)
              const affordable = c.skillPoints >= s.cost
              return (
                <button
                  key={s.id}
                  className="skill-node"
                  data-owned={owned ? '1' : '0'}
                  data-locked={locked ? '1' : '0'}
                  disabled={owned || locked || !affordable}
                  onClick={() => learnSkill(s.id)}
                >
                  <div className="row small" style={{ alignItems: 'center' }}>
                    <span className="grow">{owned ? '✅ ' : locked ? '🔒 ' : ''}{s.name}</span>
                    <span className="tiny muted">{owned ? '습득' : `${s.cost}P`}</span>
                  </div>
                  <div className="tiny muted" style={{ marginTop: 3, lineHeight: 1.5 }}>{s.desc}</div>
                  {locked && (
                    <div className="tiny" style={{ color: 'var(--muted)', marginTop: 3 }}>
                      선행: {SKILLS.find((x) => x.id === s.requires)?.name}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
        <div className="tiny muted">유연성·지구력·소셜 계열은 다음 업데이트에 추가됩니다.</div>
      </Card>

      <Card title="장비">
        <Soon text="장비와 꾸미기" />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          암벽화·초크백·테이핑이 성공률과 관절에 영향을 줄 예정이에요.
        </div>
      </Card>
    </div>
  )
}
