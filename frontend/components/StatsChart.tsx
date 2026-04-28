'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { GAME_LABELS } from '@/lib/gameLabels'

const SOURCE_META: Record<string, { label: string; color: string; ring: string }> = {
  reddit: { label: 'Reddit', color: '#f97316', ring: 'ring-orange-200' },
  bilibili: { label: 'Bilibili', color: '#ec4899', ring: 'ring-pink-200' },
  inven: { label: '인벤', color: '#22c55e', ring: 'ring-emerald-200' },
}

interface StatsChartProps {
  byGame: Record<string, number>
  bySource: Record<string, number>
  activeGame?: string
  activeSource?: string
  onGameSelect?: (game: string) => void
  onSourceSelect?: (source: string) => void
}

export default function StatsChart({
  byGame,
  bySource,
  activeGame = '',
  activeSource = '',
  onGameSelect,
  onSourceSelect,
}: StatsChartProps) {
  const gameData = Object.entries(byGame ?? {}).map(([key, value]) => ({
    key,
    name: GAME_LABELS[key] ?? key,
    count: value,
  }))

  const sourceData = Object.entries(bySource ?? {}).map(([key, value]) => ({
    key,
    name: SOURCE_META[key]?.label ?? key,
    value,
  }))

  const totalSources = sourceData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">게임별 관측</h3>
            <p className="mt-1 text-sm text-slate-500">
              어떤 게임에서 대화량이 집중되는지 빠르게 비교합니다.
            </p>
          </div>
          <button
            onClick={() => onGameSelect?.('')}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:bg-slate-50"
          >
            전체 보기
          </button>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={gameData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip cursor={{ fill: '#eff6ff' }} />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              fill="#2563eb"
              onClick={(data) => onGameSelect?.(data.key)}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 flex flex-wrap gap-2">
          {gameData.map((item) => (
            <button
              key={item.key}
              onClick={() => onGameSelect?.(item.key)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                activeGame === item.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.name} {item.count.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">플랫폼 분포</h3>
          <p className="mt-1 text-sm text-slate-500">
            이슈가 어느 커뮤니티에서 더 강하게 관측되는지 확인합니다.
          </p>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={sourceData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={82}
              label={({ percent }) =>
                `${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {sourceData.map((item) => (
                <Cell key={item.key} fill={SOURCE_META[item.key]?.color ?? '#94a3b8'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-2 space-y-3">
          {sourceData.map((item) => {
            const percent = totalSources === 0 ? 0 : Math.round((item.value / totalSources) * 100)
            const meta = SOURCE_META[item.key]

            return (
              <button
                key={item.key}
                onClick={() => onSourceSelect?.(item.key)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  activeSource === item.key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full ${meta?.ring ?? 'ring-slate-200'} ring-4`}
                  style={{ backgroundColor: meta?.color ?? '#94a3b8' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className={`text-xs ${activeSource === item.key ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.value.toLocaleString()}건 · {percent}%
                  </p>
                </div>
                <span className={`text-xs ${activeSource === item.key ? 'text-slate-300' : 'text-slate-400'}`}>
                  비교 보기
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
