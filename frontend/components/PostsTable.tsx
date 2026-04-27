'use client'

import type { Post } from '@/app/api/posts/route'

const GAME_LABELS: Record<string, string> = {
  lineage_classic: '클래식',
  lineage_remaster: '리마스터',
  lineage2: '리니지2',
  lineage_m: '리니지M',
  lineage2m: '리니지2M',
  lineage_w: '리니지W',
}

interface PostsTableProps {
  posts: Post[]
  total: number
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}

export default function PostsTable({
  posts,
  total,
  page,
  totalPages,
  onPageChange,
}: PostsTableProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
        수집된 게시글이 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-gray-600 w-1/2">제목</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">게임</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">소스</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">작성자</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">날짜</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-2">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline line-clamp-1"
                >
                  {post.title}
                </a>
              </td>
              <td className="px-4 py-2 text-gray-600">
                {GAME_LABELS[post.game] ?? post.game}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    post.source === 'reddit'
                      ? 'bg-orange-100 text-orange-700'
                      : post.source === 'bilibili'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {post.source}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-600 truncate max-w-[120px]">
                {post.author}
              </td>
              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                {post.date ? (() => {
                  const d = new Date(post.date.replace(' ', 'T'))
                  return isNaN(d.getTime()) ? post.date : d.toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                })() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-500">총 {total}건</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
          >
            이전
          </button>
          <span className="px-3 py-1 text-xs">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
