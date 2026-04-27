import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

export interface Post {
  game: string
  source: string
  title: string
  url: string
  author: string
  date: string
  views?: string
  recommend?: string
  keyword?: string
  content?: string
}

function normalizePost(raw: Record<string, unknown>, filePath: string): Post {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const dataIdx = parts.findLastIndex((p) => p === 'data')
  const source = (parts[dataIdx + 1] ?? '') as string

  if (source === 'reddit') {
    return {
      game: (raw.game as string) ?? 'unknown',
      source: 'reddit',
      title: (raw.title as string) ?? '',
      url: (raw.url as string) ?? '',
      author: (raw.username as string) ?? '',
      date: (raw.createdAt as string) ?? '',
      content: (raw.body as string) ?? '',
    }
  }

  if (source === 'bilibili') {
    return {
      game: (raw.game as string) ?? 'unknown',
      source: 'bilibili',
      title: (raw.title as string) ?? '',
      url: (raw.url as string) ?? '',
      author: (raw.authorName as string) ?? '',
      date: (raw.publishDate as string) ?? '',
      keyword: (raw.keyword as string) ?? '',
    }
  }

  // inven
  return {
    game: (raw.game as string) ?? parts[dataIdx + 2] ?? 'unknown',
    source: 'inven',
    title: (raw.title as string) ?? '',
    url: (raw.url as string) ?? '',
    author: (raw.author as string) ?? '',
    date: (raw.date as string) ?? '',
    views: raw.views as string | undefined,
    recommend: raw.recommend as string | undefined,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const game = searchParams.get('game') || null
  const source = searchParams.get('source') || null
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  const dataDir = path.join(process.cwd(), '..', 'data')

  // 소스별로 구조가 다름: inven은 {source}/{game}/*.json, reddit/bilibili는 {source}/*.json
  const patterns = source
    ? [
        path.join(dataDir, source, '**', '*.json'),
      ]
    : [
        path.join(dataDir, '*', '**', '*.json'),
        path.join(dataDir, '*', '*.json'),
      ]

  const fileSet = new Set<string>()
  for (const pattern of patterns) {
    const matched = glob.sync(pattern.replace(/\\/g, '/'))
    matched.forEach((f) => fileSet.add(f))
  }

  // last_run.json 제외
  const files = Array.from(fileSet).filter((f) => !f.endsWith('last_run.json'))

  let posts: Post[] = []
  for (const f of files) {
    try {
      const raw: unknown[] = JSON.parse(fs.readFileSync(f, 'utf-8'))
      const normalized = raw.map((item) =>
        normalizePost(item as Record<string, unknown>, f)
      )
      posts = posts.concat(normalized)
    } catch {
      // 파싱 실패 파일 무시
    }
  }

  if (game) {
    posts = posts.filter((p) => p.game === game)
  }

  const total = posts.length
  const totalPages = Math.ceil(total / limit)
  const paginated = posts.slice((page - 1) * limit, page * limit)

  return NextResponse.json({ posts: paginated, total, page, totalPages })
}
