'use client'

import { useCallback, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import StatsChart from '@/components/StatsChart'
import PostsTable from '@/components/PostsTable'
import CrawlButton from '@/components/CrawlButton'
import TrendReport, { type Report } from '@/components/TrendReport'
import type { Post } from '@/app/api/posts/route'
import { GAME_LABELS } from '@/lib/gameLabels'

const DUMMY_REPORTS: Report[] = [
  {
    id: 1,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage_m',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '리니지M 커뮤니티에서 다이아 아이템 관련 게시글이 전주 대비 40% 급증하였습니다.',
    category_filter: '총 125건 수집, 광고/도배 8건 제거, 유효 125건',
    category_translation: '번역 대상 없음 (전체 한국어)',
    category_classification: '아이템/거래 40% · 일반 35% · 공략 15% · 기타 10%',
    category_analysis: '다이아 아이템 급등으로 인한 커뮤니티 반응 증가. 환전소 이상 신호 감지.',
    full_report: '## 리니지M 주간 트렌드 리포트\n\n...',
    keywords: ['다이아', '아이템', '환전소', '거래', '급등'],
    trend_level: 'hot',
    post_count: 125,
  },
  {
    id: 2,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage_classic',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '리니지 클래식 신규 업데이트 패치 관련 긍정/부정 반응이 혼재합니다.',
    category_filter: '총 134건 수집, 광고 12건 제거, 유효 122건',
    category_translation: '번역 대상 없음 (전체 한국어)',
    category_classification: '업데이트/패치 45% · 일반 30% · 아이템 15% · 기타 10%',
    category_analysis: '패치 내용에 대한 긍정 반응 우세. 밸런스 조정 관련 불만 일부 감지.',
    full_report: '## 리니지 클래식 주간 트렌드 리포트\n\n...',
    keywords: ['업데이트', '패치', '밸런스', '신규', '이벤트'],
    trend_level: 'rising',
    post_count: 122,
  },
  {
    id: 3,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage2',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '리니지2 커뮤니티는 이번 주 핵/봇 관련 신고 게시글이 증가하였습니다.',
    category_filter: '총 31건 수집, 제거 없음, 유효 31건',
    category_translation: '영어 게시글 3건 번역 완료',
    category_classification: '핵/봇 의심 50% · 일반 30% · 여론 20%',
    category_analysis: '특정 던전에서 봇 의심 유저 신고 집중. 운영 대응 요구 여론 형성.',
    full_report: '## 리니지2 주간 트렌드 리포트\n\n...',
    keywords: ['봇', '핵', '신고', '운영', '던전'],
    trend_level: 'hot',
    post_count: 31,
  },
]

interface Stats {
  total: number
  byGame: Record<string, number>
  bySource: Record<string, number>
  lastRun: string
}

interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  totalPages: number
}

export default function Home() {
  const [game, setGame] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const [reportGame, setReportGame] = useState('')

  const [stats, setStats] = useState<Stats | null>(null)
  const [postsData, setPostsData] = useState<PostsResponse | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    setStats(await res.json())
  }, [])

  const fetchPosts = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (game) params.set('game', game)
    if (source) params.set('source', source)
    const res = await fetch(`/api/posts?${params}`)
    setPostsData(await res.json())
  }, [game, source, page])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    setPage(1)
  }, [game, source])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  function handleCrawlComplete() {
    fetchStats()
    fetchPosts()
  }

  function formatDate(iso: string) {
    if (!iso || iso === '없음') return '없음'
    try {
      return new Date(iso).toLocaleString('ko-KR')
    } catch {
      return iso
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        game={game}
        source={source}
        onGameChange={setGame}
        onSourceChange={setSource}
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 수집 현황 요약 */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">수집 현황</h1>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">마지막 크롤링</p>
              <p className="text-sm font-medium text-gray-800">
                {stats ? formatDate(stats.lastRun) : '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">전체 수집 건수</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats ? stats.total.toLocaleString() : '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center">
              <CrawlButton onComplete={handleCrawlComplete} />
            </div>
          </div>

          {stats && (
            <StatsChart byGame={stats.byGame ?? (stats as any).by_game ?? {}} bySource={stats.bySource ?? (stats as any).by_source ?? {}} />
          )}
        </div>

        {/* 게시글 목록 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">게시글 목록</h2>
          {postsData ? (
            <PostsTable
              posts={postsData.posts}
              total={postsData.total}
              page={postsData.page}
              totalPages={postsData.totalPages}
              onPageChange={setPage}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
              로딩 중...
            </div>
          )}
        </div>

        {/* AI 트렌드 분석 리포트 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">AI 트렌드 분석 리포트</h2>

          {/* 요약 카드 3개 */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">총 분석 건수</p>
              <p className="text-2xl font-bold text-blue-600">{DUMMY_REPORTS.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">이번 주 트렌드 수</p>
              <p className="text-2xl font-bold text-orange-500">
                {DUMMY_REPORTS.filter((r) => r.trend_level !== 'normal').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">마지막 분석</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(DUMMY_REPORTS[0]?.created_at ?? '')}
              </p>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 flex-wrap mb-5">
            {['', ...Object.keys(GAME_LABELS)].map((key) => (
              <button
                key={key}
                onClick={() => setReportGame(key)}
                className={
                  reportGame === key
                    ? 'bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full'
                    : 'bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-gray-200 transition-colors'
                }
              >
                {key === '' ? '전체' : GAME_LABELS[key]}
              </button>
            ))}
          </div>

          {/* 리포트 리스트 */}
          <div className="space-y-4">
            {DUMMY_REPORTS.filter((r) => reportGame === '' || r.game === reportGame).map((report) => (
              <TrendReport key={report.id} report={report} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
