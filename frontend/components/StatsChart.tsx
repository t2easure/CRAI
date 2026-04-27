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
  Legend,
} from 'recharts'

const GAME_LABELS: Record<string, string> = {
  lineage_classic: '클래식',
  lineage_remaster: '리마스터',
  lineage2: '리니지2',
  lineage_m: '리니지M',
  lineage2m: '리니지2M',
  lineage_w: '리니지W',
}

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981']

interface StatsChartProps {
  byGame: Record<string, number>
  bySource: Record<string, number>
}

export default function StatsChart({ byGame, bySource }: StatsChartProps) {
  const gameData = Object.entries(byGame ?? {}).map(([key, value]) => ({
    name: GAME_LABELS[key] ?? key,
    count: value,
  }))

  const sourceData = Object.entries(bySource ?? {}).map(([key, value]) => ({
    name: key,
    value,
  }))

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">게임별 수집 건수</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={gameData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">소스별 수집 건수</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={sourceData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {sourceData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
