'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserStore, Session, seedIfEmpty } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { seedIfEmpty() }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 300))
    const user = UserStore.getByEmail(email.trim().toLowerCase())
    if (!user || user.passwordHash !== btoa(password)) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }
    Session.set(user)
    router.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2e50 0%, #1e4a7a 50%, #2a9db0 100%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)', marginBottom: 16
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>ARKS タスク管理</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>チーム共有タスク管理システム</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text)' }}>ログイン</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">メールアドレス</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label">パスワード</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="パスワードを入力" required />
            </div>
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 42 }}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
          <div style={{ marginTop: 24, padding: '14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>デモアカウント</p>
            <p>管理者: admin@arks.co.jp / admin123</p>
            <p>一般: tanaka@arks.co.jp / pass123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
