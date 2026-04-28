'use client'

import { GAME_LABELS } from '@/lib/gameLabels'

export interface Report {
  id: number
  created_at: string
  game: string
  period_start: string
  period_end: string
  summary: string
  category_filter: string
  category_translation: string
  category_classification: string
  category_analysis: string
  full_report: string
  keywords: string[]
  trend_level: 'hot' | 'rising' | 'normal'
  post_count: number
  source_focus?: string[]
  issue_category?: string
}

const TREND_BADGE: Record<string, { label: string; className: string }> = {
  hot: { label: '급상승', className: 'bg-red-100 text-red-700' },
  rising: { label: '상승', className: 'bg-orange-100 text-orange-700' },
  normal: { label: '일반', className: 'bg-gray-100 text-gray-600' },
}

export default function TrendReport({
  report,
  selected = false,
  onSelect,
}: {
  report: Report
  selected?: boolean
  onSelect?: () => void
}) {
  const trend = TREND_BADGE[report.trend_level]
  const gameLabel = GAME_LABELS[report.game] ?? report.game
  const periodLabel = `${report.period_start.slice(5)} ~ ${report.period_end.slice(5)}`

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
        selected
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${trend.className}`}>
          {trend.label}
        </span>
        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
          {gameLabel}
        </span>
        {report.issue_category && (
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              selected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {report.issue_category}
          </span>
        )}
        <span className={`ml-auto text-xs ${selected ? 'text-slate-300' : 'text-slate-400'}`}>
          {periodLabel}
        </span>
      </div>

      <p className={`mb-4 text-sm leading-relaxed ${selected ? 'text-slate-100' : 'text-slate-700'}`}>
        {report.summary}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {report.keywords.map((kw) => (
          <span
            key={kw}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {kw}
          </span>
        ))}
      </div>

      <div
        className={`mt-4 flex items-center justify-between border-t pt-3 ${
          selected ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
            근거 게시글 {report.post_count}건
          </span>
        </div>
        <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-slate-500'}`}>
          {selected ? '선택됨' : '상세 보기'}
        </span>
      </div>
    </button>
  )
}

