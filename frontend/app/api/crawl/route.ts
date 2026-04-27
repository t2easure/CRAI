import { NextResponse } from 'next/server'

const API = 'http://localhost:8000'

export async function POST() {
  const res = await fetch(`${API}/crawl`, { method: 'POST' })
  const data = await res.json()
  return NextResponse.json(data)
}
