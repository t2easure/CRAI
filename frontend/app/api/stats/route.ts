import { NextResponse } from 'next/server'

const API = 'http://localhost:8000'

export async function GET() {
  const res = await fetch(`${API}/stats`)
  const data = await res.json()
  return NextResponse.json(data)
}
