import { useState } from 'react'
import { GYMS } from '../../content/gyms'
import { REGIONS } from '../../content/regions'
import { EQUIPMENT } from '../../content/equipment'
import { NPCS } from '../../content/npcs'
import { validateContent } from '../../content/validate'
import { addItem } from '../../game/equipment'
import { dayLengthMs } from '../../game/progress'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'
import { useToast } from '../Toast'
import type { StatKey } from '../../game/types'

/**
 * 개발자 도구 — **개발 빌드에서만** 보인다 (메뉴가 `import.meta.env.DEV`로 거른다).
 * 스토어의 `devApply`도 운영 빌드에서는 아무 일도 하지 않는다.
 */
export function DevScreen() {
  const state = useGame((s) => s.state)
  const dev = useGame((s) => s.devApply)
  const toast = useToast()
  const [wipe, setWipe] = useState(false)

  if (!import.meta.env.DEV) {
    return <div className="warn-box">개발 빌드에서만 쓸 수 있어요.</div>
  }

  const report = validateContent()

  const exportSave = () => {
    void navigator.clipboard?.writeText(JSON.stringify({ version: state.version, state }))
      .then(() => toast('세이브를 클립보드에 복사했어요'))
      .catch(() => toast('복사에 실패했어요'))
  }

  const Btn = ({ label, run, msg }: { label: string; run: (s: Parameters<Parameters<typeof dev>[0]>[0]) => void; msg: string }) => (
    <button className="btn small" onClick={() => { dev(run); toast(msg) }}>{label}</button>
  )

  return (
    <>
      <div className="warn-box">🛠️ 개발 빌드 전용 도구입니다. 운영 배포에는 나타나지 않아요.</div>

      <Card title="시간">
        <div className="tiny muted" style={{ marginBottom: 6 }}>
          하루 = {Math.round(dayLengthMs(state) / 1000)}초
        </div>
        <div className="row wrap">
          <Btn label="+1일" msg="하루 진행" run={(s) => { s.clock.bonusMs += dayLengthMs(s) }} />
          <Btn label="+1주" msg="일주일 진행" run={(s) => { s.clock.bonusMs += dayLengthMs(s) * 7 }} />
        </div>
      </Card>

      <Card title="캐릭터">
        <div className="row wrap">
          <Btn label="레벨 +1" msg="레벨 +1" run={(s) => { s.climber.level += 1; s.climber.skillPoints += 1 }} />
          <Btn label="레벨 +5" msg="레벨 +5" run={(s) => { s.climber.level += 5; s.climber.skillPoints += 5 }} />
          <Btn label="돈 +50만" msg="50만원 지급" run={(s) => { s.climber.money += 500000 }} />
          <Btn
            label="능력치 +3" msg="전 능력치 +3"
            run={(s) => { for (const k of Object.keys(s.climber.stats) as StatKey[]) s.climber.stats[k] += 3 }}
          />
          <Btn
            label="몸 상태 회복" msg="컨디션 회복"
            run={(s) => {
              s.climber.condition = { hp: 100, fatigue: 0, mood: 100, joints: { finger: 100, shoulder: 100, knee: 100 } }
            }}
          />
          <Btn
            label="피로/부상 세팅" msg="망가진 상태로"
            run={(s) => { s.climber.condition.fatigue = 90; s.climber.condition.joints.finger = 25 }}
          />
        </div>
      </Card>

      <Card title="해금">
        <div className="row wrap">
          <Btn
            label="암장 전부 방문" msg="모든 암장 방문 처리"
            run={(s) => { for (const g of GYMS) if (!s.world.visitedGyms.includes(g.id)) s.world.visitedGyms.push(g.id) }}
          />
          <Btn
            label="지역 해금" msg="열 수 있는 지역 해금"
            run={(s) => {
              for (const r of REGIONS) {
                if (!r.unlock.comingSoon && !s.world.unlockedRegions.includes(r.id)) s.world.unlockedRegions.push(r.id)
              }
            }}
          />
          <Btn label="명성 +500" msg="명성 +500" run={(s) => { s.world.fame += 500 }} />
          <Btn
            label="NPC 친밀도 MAX" msg="NPC 친밀도 최대"
            run={(s) => { for (const n of NPCS) s.npc[n.id] = 100 }}
          />
        </div>
      </Card>

      <Card title="장비">
        <Btn
          label="전 장비 지급" msg="전 장비 지급"
          run={(s) => { for (const e of EQUIPMENT) addItem(s, e.id) }}
        />
      </Card>

      <Card title="세이브">
        <div className="row wrap">
          <button className="btn small" onClick={exportSave}>내보내기(복사)</button>
          <button className="btn small" onClick={() => toast(`시드 ${state.climber.seed}`)}>랜덤 시드 확인</button>
        </div>
        <div className="tiny muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          가져오기는 브라우저 콘솔에서
          <code> localStorage.setItem('climber.save.v1', 붙여넣기) </code>
          후 새로고침하세요.
        </div>
        <div className="spacer" />
        {wipe ? (
          <>
            <div className="warn-box danger">정말 전부 지울까요? 되돌릴 수 없어요.</div>
            <button className="btn accent center" onClick={() => { localStorage.clear(); location.reload() }}>
              지우고 새로고침
            </button>
            <div className="spacer" />
            <button className="btn ghost center" onClick={() => setWipe(false)}>취소</button>
          </>
        ) : (
          <button className="btn ghost center" onClick={() => setWipe(true)}>세이브 즉시 삭제</button>
        )}
      </Card>

      <Card
        title="콘텐츠 검사"
        right={<span className={`chip ${report.errors.length ? '' : 'on'}`}>
          {report.errors.length ? `오류 ${report.errors.length}` : '정상'}
        </span>}
      >
        <div className="tiny muted" style={{ marginBottom: 6 }}>
          {Object.entries(report.counts).map(([k, v]) => `${k} ${v}`).join(' · ')}
        </div>
        {report.errors.length === 0 && report.warnings.length === 0 && (
          <div className="mini muted">끊어진 참조나 중복 ID가 없어요.</div>
        )}
        {report.errors.map((e, i) => <div key={`e${i}`} className="warn-box danger">{e}</div>)}
        {report.warnings.map((w, i) => <div key={`w${i}`} className="warn-box">{w}</div>)}
      </Card>
    </>
  )
}
