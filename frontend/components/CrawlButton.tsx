'use client'

import { useState } from 'react'

interface CrawlButtonProps {
  onComplete: () => void
}

export default function CrawlButton({ onComplete }: CrawlButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleCrawl() {
    setLoading(true)
    setMessage(null)
    try {
      // 크롤링 시작 전 현재 수집 건수 및 마지막 로그 시각 저장
      const [beforeStatsRes, beforeLogsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/logs'),
      ])
      const beforeStats = await beforeStatsRes.json()
      const beforeTotal = beforeStats.total ?? 0
      const beforeLogs = await beforeLogsRes.json().catch(() => [])
      const lastLogBefore: string | null = Array.isArray(beforeLogs) && beforeLogs[0]
        ? beforeLogs[0].run_at
        : null

      const res = await fetch('/api/crawl', { method: 'POST' })
      const data = await res.json()
      if (!data.success) {
        setMessage(`오류: ${data.message || '알 수 없는 오류가 발생했습니다.'}`)
        setLoading(false)
        return
      }

      setMessage('크롤링 진행 중...')

      // 완료될 때까지 10초마다 stats 폴링
      const MAX_WAIT = 60 * 15 * 1000 // 최대 15분
      const INTERVAL = 10000
      const startTime = Date.now()

      const poll = async (): Promise<void> => {
        if (Date.now() - startTime > MAX_WAIT) {
          setMessage('크롤링이 진행 중입니다. 잠시 후 새로고침하세요.')
          setLoading(false)
          onComplete()
          return
        }
        const statsRes = await fetch('/api/stats')
        const stats = await statsRes.json()
        const logs = await fetch('/api/logs').then(r => r.json()).catch(() => [])
        const lastLog = Array.isArray(logs) ? logs[0] : null
        const elapsed = Math.round((Date.now() - startTime) / 1000)

        // 크롤링 시작 전 마지막 로그보다 최신 로그가 생겼으면 완료로 판단
        const isNewLog = lastLog && lastLog.run_at !== lastLogBefore
        if (isNewLog) {
          const newCount = (stats.total ?? 0) - beforeTotal
          setMessage(`크롤링 완료! ${newCount > 0 ? `${newCount}건 새로 수집` : '새 데이터 없음'} (${elapsed}초 소요)`)
          setLoading(false)
          onComplete()
          return
        }

        setMessage(`크롤링 진행 중... (${elapsed}초)`)
        setTimeout(poll, INTERVAL)
      }

      setTimeout(poll, INTERVAL)
    } catch {
      setMessage('크롤링 요청 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCrawl}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            크롤링 중...
          </>
        ) : (
          '지금 크롤링 실행'
        )}
      </button>
      {message && (
        <span
          className={`text-sm ${
            message.startsWith('오류') ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {message}
        </span>
      )}
    </div>
  )
}
