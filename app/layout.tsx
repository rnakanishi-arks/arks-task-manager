import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '成増運輸株式会社 タスク管理',
  description: 'チーム共有タスク管理アプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
