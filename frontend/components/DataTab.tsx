'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { GAME_LABELS } from '@/lib/gameLabels'

interface TimelineRow { date: string; source: string; cnt: number }
interface ByGame { [game: string]: number }
interface BySource { [source: string]: number }

const SOURCE_COLOR: Record<string, string> = {
  inven: '#6366f1',
  reddit: '#f97316',
  bilibili: '#06b6d4',
  bahamut: '#8b5cf6',
}

const RADAR_DUMMY = [
  { category: '핵/봇',    value: 38 },
  { category: '여론',      value: 55 },
  { category: '업데이트', value: 72 },
  { category: '시세/거래', value: 44 },
]

export default function DataTab({
  byGame,
  bySource,
  activeGame,
  activeSource,
}: {
  byGame: ByGame
  bySource: BySource
  activeGame: string
  activeSource: string
}) {
  const [timeline, setTimeline] = useState<TimelineRow[]>([])

  useEffect(() => {
    fetch('/api/timeline?days=14')
      .then((r) => r.json())
      .then(setTimeline)
      .catch(() => {})
  }, [])

  const timelineByDate: Record<string, Record<string, number>> = {}
  timeline.forEach(({ date, source, cnt }) => {
    if (!timelineByDate[date]) timelineByDate[date] = {}
    timelineByDate[date][source] = cnt
  })
  const timelineData = Object.entries(timelineByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sources]) => ({
      date: date.slice(5),
      inven: sources['inven'] ?? 0,
      reddit: sources['reddit'] ?? 0,
      bilibili: sources['bilibili'] ?? 0,
      bahamut: sources['bahamut'] ?? 0,
    }))

  const gameData = Object.entries(byGame)
    .sort(([, a], [, b]) => b - a)
    .map(([game, cnt]) => ({ game: GAME_LABELS[game] ?? game, cnt }))

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* 블록 1: 플랫폼별 수집량 추이 */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">플랫폼별 수집량 추이</h3>
              <p className="text-xs text-slate-400 mt-0.5">최근 14일</p>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">실제 연동</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="inven" name="인벤" stackId="1" stroke={SOURCE_COLOR.inven} fill={SOURCE_COLOR.inven} fillOpacity={0.15} />
              <Area type="monotone" dataKey="reddit" name="Reddit" stackId="1" stroke={SOURCE_COLOR.reddit} fill={SOURCE_COLOR.reddit} fillOpacity={0.15} />
              <Area type="monotone" dataKey="bilibili" name="Bilibili" stackId="1" stroke={SOURCE_COLOR.bilibili} fill={SOURCE_COLOR.bilibili} fillOpacity={0.15} />
              <Area type="monotone" dataKey="bahamut" name="Bahamut" stackId="1" stroke={SOURCE_COLOR.bahamut} fill={SOURCE_COLOR.bahamut} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 블록 3: 카테고리 레이더 (목업) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">카테고리별 이슈 분포</h3>
              <p className="text-xs text-slate-400 mt-0.5">AI 분류 결과 기반</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">목업</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DUMMY}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <Radar name="이슈 비중" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
