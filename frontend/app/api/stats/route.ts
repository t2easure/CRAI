import { NextResponse } from 'next/server'

const API = 'http://localhost:8001'

export async function GET() {
  const res = await fetch(`${API}/stats`, { cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json(data)
}
