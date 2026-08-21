export type TabKey = 'home' | 'schedule' | 'climb' | 'growth' | 'more'

const TABS: { key: TabKey; ico: string; label: string }[] = [
  { key: 'home', ico: '🏠', label: '홈' },
  { key: 'schedule', ico: '🗓️', label: '일정' },
  { key: 'climb', ico: '🧗', label: '등반' },
  { key: 'growth', ico: '📈', label: '성장' },
  { key: 'more', ico: '⋯', label: '더보기' },
]

export function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button key={t.key} data-on={tab === t.key ? '1' : '0'} onClick={() => onChange(t.key)}>
          <span className="ico">{t.ico}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
