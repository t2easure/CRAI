'use client'

import { useState } from 'react'

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
}

const GAME_LABELS: Record<string, string> = {
  lineage_classic: '리니지 클래식',
  lineage_remaster: '리니지 리마스터',
  lineage2: '리니지2',
  lineage_m: '리니지M',
  lineage2m: '리니지2M',
  lineage_w: '리니지W',
}

const TREND_BADGE: Record<string, { label: string; className: string }> = {
  hot: { label: '🔥 급상승', className: 'bg-red-100 text-red-700' },
  rising: { label: '📈 상승', className: 'bg-orange-100 text-orange-700' },
  normal: { label: '📊 일반', className: 'bg-gray-100 text-gray-600' },
}

export default function TrendReport({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false)

  const trend = TREND_BADGE[report.trend_level]
  const gameLabel = GAME_LABELS[report.game] ?? report.game
  const periodLabel = `${report.period_start.slice(5)} ~ ${report.period_end.slice(5)}`

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${trend.className}`}>
          {trend.label}
        </span>
        <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          {gameLabel}
        </span>
        <span className="ml-auto text-xs text-gray-400">{periodLabel}</span>
      </div>

      {/* 요약 */}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{report.summary}</p>

      {/* 키워드 */}
      <div className="flex gap-2 flex-wrap mb-4">
        {report.keywords.map((kw) => (
          <span key={kw} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
            {kw}
          </span>
        ))}
      </div>

      {/* 하단 바 */}
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">분석 게시글 {report.post_count}건</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="bg-white text-gray-500 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {expanded ? '접기 ▲' : '자세히 보기 >'}
        </button>
      </div>

      {/* 아코디언 상세 */}
      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          {[
            { label: '필터', value: report.category_filter },
            { label: '번역', value: report.category_translation },
            { label: '분류', value: report.category_classification },
            { label: '분석', value: report.category_analysis },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4">
              <span className="text-sm font-medium text-gray-500 w-10 shrink-0">{label}</span>
              <span className="text-sm text-gray-700 leading-relaxed">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
