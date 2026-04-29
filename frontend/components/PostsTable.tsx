'use client'

import type { Post } from '@/app/api/posts/route'
import { GAME_LABELS } from '@/lib/gameLabels'

interface PostsTableProps {
  posts: Post[]
  total: number
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  selectedKeywords?: string[]
  selectedSource?: string
}

export default function PostsTable({
  posts,
  total,
  page,
  totalPages,
  onPageChange,
  selectedKeywords = [],
  selectedSource = '',
}: PostsTableProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        선택한 조건에 맞는 근거 게시글이 없습니다.
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">전체 데이터 목록</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSource && (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
              {selectedSource}
            </span>
          )}
          {selectedKeywords.slice(0, 3).map((keyword) => (
            <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {posts.map((post, i) => {
          const matchedKeywords = selectedKeywords.filter((keyword) =>
            `${post.title} ${post.content ?? ''}`.toLowerCase().includes(keyword.toLowerCase())
          )

          return (
            <article
              key={`${post.url}-${i}`}
              className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <SourceBadge source={post.source} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {GAME_LABELS[post.game] ?? post.game}
                </span>
                <span className="text-xs text-slate-400">{formatDate(post.date)}</span>
                {post.source === 'bilibili' && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700">
                    자동 번역 확인 권장
                  </span>
                )}
              </div>

              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 text-base font-semibold text-slate-900 hover:text-blue-600"
              >
                {post.title}
              </a>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {post.content?.trim() || '본문 미리보기가 없습니다. 원문 링크에서 전체 내용을 확인하세요.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>작성자 {post.author || '-'}</span>
                {post.keyword && <span>검색 키워드 {post.keyword}</span>}
                {matchedKeywords.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                    매칭 키워드 {matchedKeywords.join(', ')}
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">총 {total}건</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs transition hover:bg-slate-100 disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1 text-xs text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs transition hover:bg-slate-100 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}

function SourceBadge({ source }: { source: string }) {
  const styles =
    source === 'reddit'
      ? 'bg-orange-100 text-orange-700'
      : source === 'bilibili'
      ? 'bg-pink-100 text-pink-700'
      : source === 'bahamut'
      ? 'bg-violet-100 text-violet-700'
      : 'bg-emerald-100 text-emerald-700'

  const label =
    source === 'reddit' ? 'Reddit' : source === 'bilibili' ? 'Bilibili' : source === 'bahamut' ? 'Bahamut' : '인벤'

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{label}</span>
}

function formatDate(value: string) {
  if (!value) return '-'

  const trimmed = value.trim()
  if (trimmed.length > 10) {
    const parsed = new Date(trimmed.replace(' ', 'T'))
    return Number.isNaN(parsed.getTime())
      ? trimmed
      : parsed.toLocaleString('ko-KR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
  }

  return trimmed.replace(/-/g, '. ')
}
