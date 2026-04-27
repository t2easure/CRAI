import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export async function POST() {
  const projectRoot = path.join(process.cwd(), '..')

  return new Promise<NextResponse>((resolve) => {
    exec(
      'python -m pipeline.crawler_runner',
      { cwd: projectRoot },
      (error, stdout, stderr) => {
        if (error) {
          resolve(
            NextResponse.json(
              { success: false, message: stderr || error.message },
              { status: 500 }
            )
          )
          return
        }
        resolve(NextResponse.json({ success: true, message: stdout }))
      }
    )
  })
}
