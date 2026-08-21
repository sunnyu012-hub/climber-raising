import { KIND_LABEL } from '../../content/quests'
import { activeQuests } from '../../game/quests'
import { useGame } from '../../store/gameStore'
import { Card, Empty } from '../bits'
import { useToast } from '../Toast'

/** 퀘스트 — 목표는 게임 로그로 자동 진행된다. 여기서 하는 건 보상 수령뿐. */
export function QuestScreen() {
  const state = useGame((s) => s.state)
  const claim = useGame((s) => s.claim)
  const toast = useToast()
  const list = activeQuests(state)

  return (
    <>
      <Card tight>
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          퀘스트는 실제로 한 행동을 보고 자동으로 진행돼요. 따로 수락하거나 제출할 필요 없어요.
        </div>
      </Card>

      {list.length === 0 && <Empty text="진행 중인 퀘스트가 없어요." />}

      {list.map(({ quest, progress }) => {
        const ready = progress.completed && !progress.claimed
        return (
          <div key={quest.id} className="plist" data-ready={ready ? '1' : '0'}>
            <div className="ph">
              <span className="chip">{KIND_LABEL[quest.kind]}</span>
              <span className="grow" style={{ fontSize: 14 }}>{quest.name}</span>
              {ready && <span className="chip on">완료!</span>}
            </div>
            <div className="mini" style={{ margin: '6px 0' }}>{quest.desc}</div>

            {quest.goals.map((g, i) => {
              const c = Math.min(g.count, progress.counts[i] ?? 0)
              return (
                <div key={i} className="stat-row">
                  <span className="lbl" style={{ width: 96 }}>{g.label}</span>
                  <span className="grow">
                    <div className="gauge exp"><i style={{ width: `${(c / g.count) * 100}%` }} /></div>
                  </span>
                  <span className="val">{c}/{g.count}</span>
                </div>
              )
            })}

            <div className="tiny muted" style={{ margin: '6px 0' }}>
              보상: {[
                quest.reward.exp && `${quest.reward.exp} EXP`,
                quest.reward.money && `${quest.reward.money.toLocaleString()}원`,
                quest.reward.fame && `명성 ${quest.reward.fame}`,
                quest.reward.skillPoint && `스킬포인트 ${quest.reward.skillPoint}`,
                quest.reward.itemId && '아이템',
                quest.reward.title && '칭호',
              ].filter(Boolean).join(' · ')}
            </div>

            <button
              className={`btn center${ready ? ' primary' : ''}`}
              disabled={!ready}
              onClick={() => toast(claim(quest.id) ?? '보상을 받았어요!')}
            >
              {ready ? '보상 받기' : '진행 중'}
            </button>
          </div>
        )
      })}
    </>
  )
}
