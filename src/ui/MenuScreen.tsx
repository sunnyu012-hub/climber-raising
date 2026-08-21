import { useState } from 'react'
import { getGym } from '../content/gyms'
import { getTitle } from '../content/progression'
import { activeQuests } from '../game/quests'
import { useGame } from '../store/gameStore'
import { Card } from './bits'
import { WorldScreen } from './menu/WorldScreen'
import { QuestScreen } from './menu/QuestScreen'
import { NpcScreen } from './menu/NpcScreen'
import { CollectionScreen } from './menu/CollectionScreen'
import { RecordScreen } from './menu/RecordScreen'
import { CrewScreen } from './menu/CrewScreen'
import { RankingScreen } from './menu/RankingScreen'
import { CompetitionScreen } from './menu/CompetitionScreen'
import { AchievementScreen } from './menu/AchievementScreen'
import { SettingsScreen } from './menu/SettingsScreen'
import { DevScreen } from './menu/DevScreen'

/**
 * 메뉴 — 허브 화면.
 * 기능을 카드로 길게 늘어놓지 않고, 항목을 눌러 각 화면으로 들어간다.
 */
type MenuKey =
  | 'world' | 'quest' | 'npc' | 'collection' | 'crew' | 'ranking'
  | 'competition' | 'achievement' | 'record' | 'settings' | 'dev'

interface Item {
  key: MenuKey
  icon: string
  label: string
  hint: (badge: Badges) => string
  badge?: (b: Badges) => number
  devOnly?: boolean
}

interface Badges {
  questsReady: number
  gymName: string
  titleName: string
  collected: number
  collectTotal: number
  fame: number
}

const ITEMS: Item[] = [
  { key: 'world', icon: '🗺️', label: '지도와 원정', hint: (b) => `현재 ${b.gymName}` },
  { key: 'quest', icon: '📜', label: '퀘스트', hint: (b) => (b.questsReady > 0 ? '받을 보상이 있어요!' : '진행 중인 목표'), badge: (b) => b.questsReady },
  { key: 'npc', icon: '👥', label: 'NPC와 관계', hint: () => '암장 사람들' },
  { key: 'competition', icon: '🏆', label: '대회', hint: () => '미니대회 참가' },
  { key: 'collection', icon: '📖', label: '도감', hint: (b) => `${b.collected} / ${b.collectTotal}` },
  { key: 'achievement', icon: '🏅', label: '업적과 칭호', hint: (b) => `장착: ${b.titleName}` },
  { key: 'record', icon: '📊', label: '기록', hint: (b) => `명성 ${b.fame}` },
  { key: 'crew', icon: '🧗', label: '크루', hint: () => '서버 연결 필요' },
  { key: 'ranking', icon: '🥇', label: '랭킹', hint: () => '내 예상 점수' },
  { key: 'settings', icon: '⚙️', label: '설정', hint: () => '빠른 진행 · 데이터' },
  { key: 'dev', icon: '🛠️', label: '개발자 도구', hint: () => '개발 빌드 전용', devOnly: true },
]

export function MenuScreen() {
  const state = useGame((s) => s.state)
  const [open, setOpen] = useState<MenuKey | null>(null)

  const badges: Badges = {
    questsReady: activeQuests(state).filter((q) => q.progress.completed && !q.progress.claimed).length,
    gymName: getGym(state.gymId).branchName,
    titleName: state.equippedTitle ? (getTitle(state.equippedTitle)?.name ?? '없음') : '없음',
    collected: state.collection.problem.length + state.collection.gym.length
      + state.collection.npc.length + state.collection.equipment.length,
    collectTotal: 0,
    fame: Math.floor(state.world.fame),
  }

  if (open) {
    const back = () => setOpen(null)
    return (
      <div className="screen">
        <button className="btn ghost" style={{ marginBottom: 10 }} onClick={back}>← 메뉴로</button>
        {open === 'world' && <WorldScreen />}
        {open === 'quest' && <QuestScreen />}
        {open === 'npc' && <NpcScreen />}
        {open === 'collection' && <CollectionScreen />}
        {open === 'record' && <RecordScreen />}
        {open === 'crew' && <CrewScreen />}
        {open === 'ranking' && <RankingScreen />}
        {open === 'competition' && <CompetitionScreen />}
        {open === 'achievement' && <AchievementScreen />}
        {open === 'settings' && <SettingsScreen />}
        {open === 'dev' && <DevScreen />}
      </div>
    )
  }

  return (
    <div className="screen">
      <Card tight>
        <div className="row small" style={{ alignItems: 'center' }}>
          <span className="grow">{state.climber.name}</span>
          <span className="muted tiny">명성 {badges.fame}</span>
        </div>
        <div className="tiny muted" style={{ marginTop: 2 }}>
          {getGym(state.gymId).displayName} · {badges.titleName}
        </div>
      </Card>

      <div className="menu-grid">
        {ITEMS.filter((i) => !i.devOnly || import.meta.env.DEV).map((i) => {
          const n = i.badge?.(badges) ?? 0
          return (
            <button key={i.key} className="menu-item" onClick={() => setOpen(i.key)}>
              <span className="mi-icon">{i.icon}</span>
              <span className="mi-body">
                <span className="mi-label">
                  {i.label}
                  {n > 0 && <span className="mi-badge">{n}</span>}
                </span>
                <span className="mi-hint">{i.hint(badges)}</span>
              </span>
              <span className="mi-arrow">›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
