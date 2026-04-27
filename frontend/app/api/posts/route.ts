import { NextRequest, NextResponse } from 'next/server'

const API = 'http://localhost:8001'

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const res = await fetch(`${API}/posts?${searchParams.toString()}`, { cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json(data)
}
