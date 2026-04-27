'use client'

const GAMES = [
  { value: '', label: '전체' },
  { value: 'lineage_classic', label: '리니지 클래식' },
  { value: 'lineage_remaster', label: '리니지 리마스터' },
  { value: 'lineage2', label: '리니지2' },
  { value: 'lineage_m', label: '리니지M' },
  { value: 'lineage2m', label: '리니지2M' },
  { value: 'lineage_w', label: '리니지W' },
]

const SOURCES = [
  { value: '', label: '전체' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'bilibili', label: 'Bilibili' },
  { value: 'inven', label: '인벤' },
]

interface SidebarProps {
  game: string
  source: string
  onGameChange: (v: string) => void
  onSourceChange: (v: string) => void
}

export default function Sidebar({
  game,
  source,
  onGameChange,
  onSourceChange,
}: SidebarProps) {
  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-200 p-4 space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          게임
        </p>
        <ul className="space-y-1">
          {GAMES.map((g) => (
            <li key={g.value}>
              <button
                onClick={() => onGameChange(g.value)}
                className={`w-full text-left text-sm px-2 py-1 rounded ${
                  game === g.value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {g.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          소스
        </p>
        <ul className="space-y-1">
          {SOURCES.map((s) => (
            <li key={s.value}>
              <button
                onClick={() => onSourceChange(s.value)}
                className={`w-full text-left text-sm px-2 py-1 rounded ${
                  source === s.value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
