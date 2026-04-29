'use client'

import { GAME_LABELS } from '@/lib/gameLabels'

export type Tab = 'dashboard' | 'reports' | 'data'

const GAMES = [
  { value: '', label: '전체' },
  ...Object.entries(GAME_LABELS).map(([value, label]) => ({ value, label })),
]

const SOURCES = [
  { value: '', label: '전체' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'bilibili', label: 'Bilibili' },
  { value: 'inven', label: '인벤' },
  { value: 'bahamut', label: 'Bahamut' },
]

const CATEGORIES = [
  { value: '', label: '전체 이슈' },
  { value: 'update', label: '업데이트' },
  { value: 'bot', label: '핵/봇' },
  { value: 'economy', label: '시세/거래' },
  { value: 'sentiment', label: '여론' },
]

const PERIODS = [
  { value: '24h', label: '24시간' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
]

const TABS: { value: Tab; label: string }[] = [
  { value: 'dashboard', label: '대시보드' },
  { value: 'reports', label: '리포트' },
  { value: 'data', label: '데이터' },
]

interface SidebarProps {
  tab: Tab
  game: string
  source: string
  category: string
  period: string
  onTabChange: (v: Tab) => void
  onGameChange: (v: string) => void
  onSourceChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onPeriodChange: (v: string) => void
}

export default function Sidebar({
  tab,
  game,
  source,
  category,
  period,
  onTabChange,
  onGameChange,
  onSourceChange,
  onCategoryChange,
  onPeriodChange,
}: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 text-white">
      <div className="flex h-full flex-col p-5">
        {/* 타이틀 */}
        <div className="mb-6">
          <h1 className="text-7xl font-bold tracking-wide">CRAI</h1>
        </div>

        {/* 탭 네비게이션 */}
        <nav className="mb-6 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => onTabChange(t.value)}
              className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                tab === t.value
                  ? 'bg-white text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="h-px bg-slate-800 mb-6" />

        {/* 탭별 필터 */}
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* 게임 필터: 전체 탭 */}
          <FilterSection title="게임">
            <FilterList items={GAMES} activeValue={game} onSelect={onGameChange} />
          </FilterSection>

          {/* 플랫폼 필터: 대시보드 + 데이터 탭 */}
          {(tab === 'dashboard' || tab === 'data') && (
            <FilterSection title="플랫폼">
              <FilterList items={SOURCES} activeValue={source} onSelect={onSourceChange} />
            </FilterSection>
          )}

          {/* 카테고리 필터: 리포트 탭 */}
          {tab === 'reports' && (
            <FilterSection title="카테고리">
              <FilterList items={CATEGORIES} activeValue={category} onSelect={onCategoryChange} />
            </FilterSection>
          )}

          {/* 기간 필터: 데이터 탭 */}
          {tab === 'data' && (
            <FilterSection title="기간">
              <div className="grid grid-cols-3 gap-2">
                {PERIODS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onPeriodChange(item.value)}
                    className={`rounded-xl px-2 py-2 text-xs transition ${
                      period === item.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}
        </div>
      </div>
    </aside>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      {children}
    </div>
  )
}

function FilterList({
  items,
  activeValue,
  onSelect,
}: {
  items: Array<{ value: string; label: string }>
  activeValue: string
  onSelect: (value: string) => void
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.value}>
          <button
            onClick={() => onSelect(item.value)}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
              activeValue === item.value
                ? 'bg-white text-slate-950 font-medium'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
