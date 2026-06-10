'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, seedIfEmpty } from '@/lib/store'
import type { User } from '@/lib/store'
import AppShell from '@/components/AppShell'

const SECTIONS = [
  {
    title: 'ダッシュボード',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    items: [
      'ログイン後に最初に表示される画面です。',
      '自分に割り当てられたタスクの件数・進捗状況を一覧できます。',
      '未読のお知らせがある場合、メニューに赤いバッジで件数が表示されます。',
    ],
  },
  {
    title: 'タスク一覧',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    items: [
      '全タスクをステータス・優先度・担当者でフィルタリングして表示できます。',
      'タスク名をクリックすると詳細ページを開けます。',
      '詳細ページではステータスの変更・コメントの投稿が行えます。',
    ],
  },
  {
    title: 'タスク作成',
    icon: 'M12 4v16m8-8H4',
    items: [
      '「タスク作成」メニューから新しいタスクを登録できます。',
      'タイトル・説明・期限・優先度・担当者・グループを設定できます。',
      '担当者に設定されたメンバーには通知が届きます。',
    ],
  },
  {
    title: '管理画面（管理者のみ）',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0',
    items: [
      '「ユーザー」タブでメンバーの追加・削除・ロール変更ができます。',
      '「グループ」タブでグループの作成・削除・メンバー編集ができます。',
      'ロールは「管理者」と「メンバー」の2種類があります。管理者のみ管理画面にアクセスできます。',
    ],
  },
]

const FAQ = [
  {
    q: 'パスワードを忘れてしまいました',
    a: '管理者にお問い合わせください。管理者はユーザーを一度削除して再登録することで対応できます。',
  },
  {
    q: 'タスクを削除したい',
    a: 'タスク詳細ページの「削除」ボタンから削除できます。削除したタスクは復元できません。',
  },
  {
    q: 'グループとは何ですか？',
    a: 'グループはメンバーをまとめる機能です。タスク作成時にグループを指定すると、そのグループのメンバー全員に通知が送られます。',
  },
  {
    q: 'データはどこに保存されますか？',
    a: 'データはお使いのブラウザのlocalStorageに保存されます。ブラウザのデータを削除するとデータが消えますのでご注意ください。',
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    seedIfEmpty()
    const u = Session.get()
    if (!u) { router.replace('/login'); return }
    if (u.role !== 'admin') { router.replace('/dashboard'); return }
    setUser(u)
  }, [router])

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 860 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>ヘルプ</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 32px' }}>
          ARKS タスク管理アプリの使い方ガイド
        </p>

        {/* 機能説明 */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>各機能の説明</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 36 }}>
          {SECTIONS.map(sec => (
            <div key={sec.title} className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={sec.icon} />
                  </svg>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{sec.title}</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {sec.items.map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>よくある質問</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36 }}>
          {FAQ.map((faq, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', padding: '14px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'left' }}>Q. {faq.q}</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                    A. {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* お問い合わせ */}
        <div className="card" style={{ padding: 24, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0c4a6e', marginBottom: 4 }}>お問い合わせ</div>
              <p style={{ margin: 0, fontSize: 13, color: '#0369a1', lineHeight: 1.7 }}>
                ご不明な点や不具合がございましたら、システム管理者までお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
