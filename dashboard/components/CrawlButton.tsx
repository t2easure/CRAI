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
      const res = await fetch('/api/crawl', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMessage('크롤링이 완료되었습니다.')
        onComplete()
      } else {
        setMessage(`오류: ${data.message}`)
      }
    } catch {
      setMessage('크롤링 요청 중 오류가 발생했습니다.')
    } finally {
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
