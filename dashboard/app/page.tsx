'use client'

import { useCallback, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import StatsChart from '@/components/StatsChart'
import PostsTable from '@/components/PostsTable'
import CrawlButton from '@/components/CrawlButton'
import type { Post } from '@/app/api/posts/route'

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
            <StatsChart byGame={stats.byGame} bySource={stats.bySource} />
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

        {/* AI 분석 리포트 섹션 (준비 중) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">AI 분석 리포트</h2>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center"
              >
                <p className="text-sm text-gray-400">AI 분석 리포트는 준비 중입니다</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
