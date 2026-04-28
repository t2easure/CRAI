import { NextResponse } from 'next/server'

const API = 'http://localhost:8001'

export async function POST() {
  try {
    const res = await fetch(`${API}/crawl`, { method: 'POST', signal: AbortSignal.timeout(900000) })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, message: `백엔드 연결 실패: ${msg}` })
  }
}
