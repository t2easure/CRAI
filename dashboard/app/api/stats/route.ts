import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

function getSourceFromPath(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const dataIdx = parts.findLastIndex((p) => p === 'data')
  return parts[dataIdx + 1] ?? 'unknown'
}

function getGameFromItem(
  item: Record<string, unknown>,
  filePath: string
): string {
  if (item.game) return item.game as string
  const parts = filePath.replace(/\\/g, '/').split('/')
  const dataIdx = parts.findLastIndex((p) => p === 'data')
  return parts[dataIdx + 2] ?? 'unknown'
}

export async function GET() {
  const dataDir = path.join(process.cwd(), '..', 'data')

  const patterns = [
    path.join(dataDir, '*', '**', '*.json').replace(/\\/g, '/'),
    path.join(dataDir, '*', '*.json').replace(/\\/g, '/'),
  ]

  const fileSet = new Set<string>()
  for (const pattern of patterns) {
    glob.sync(pattern).forEach((f) => fileSet.add(f))
  }

  const files = Array.from(fileSet).filter((f) => !f.endsWith('last_run.json'))

  let total = 0
  const byGame: Record<string, number> = {}
  const bySource: Record<string, number> = {}

  for (const f of files) {
    try {
      const items: Record<string, unknown>[] = JSON.parse(
        fs.readFileSync(f, 'utf-8')
      )
      const source = getSourceFromPath(f)

      for (const item of items) {
        total++
        const game = getGameFromItem(item, f)
        byGame[game] = (byGame[game] ?? 0) + 1
        bySource[source] = (bySource[source] ?? 0) + 1
      }
    } catch {
      // 파싱 실패 파일 무시
    }
  }

  let lastRun = '없음'
  try {
    const lastRunPath = path.join(dataDir, 'last_run.json')
    const data = JSON.parse(fs.readFileSync(lastRunPath, 'utf-8'))
    lastRun = data.timestamp ?? '없음'
  } catch {
    // last_run.json 없음
  }

  return NextResponse.json({ total, byGame, bySource, lastRun })
}
