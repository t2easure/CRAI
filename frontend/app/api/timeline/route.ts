import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const res = await fetch(`${API}/stats/timeline?${searchParams.toString()}`, { cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json(data)
}
