import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRAI',
  description: '게임 커뮤니티 모니터링 대시보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
