'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, UserStore, GroupStore, TaskStore, seedIfEmpty } from '@/lib/store'
import type { User, Group, Role } from '@/lib/store'
import AppShell from '@/components/AppShell'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [tab, setTab] = useState<'users' | 'groups'>('users')

  // User form
  const [showUserForm, setShowUserForm] = useState(false)
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPass, setFPass] = useState('')
  const [fRole, setFRole] = useState<Role>('member')
  const [fError, setFError] = useState('')

  // Group form
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [gName, setGName] = useState('')
  const [gMembers, setGMembers] = useState<string[]>([])

  useEffect(() => {
    seedIfEmpty()
    const u = Session.get()
    if (!u) { router.replace('/login'); return }
    if (u.role !== 'admin') { router.replace('/dashboard'); return }
    setUser(u)
    setUsers(UserStore.getAll())
    setGroups(GroupStore.getAll())
  }, [router])

  const reload = () => { setUsers(UserStore.getAll()); setGroups(GroupStore.getAll()) }

  const addUser = (e: React.FormEvent) => {
    e.preventDefault()
    setFError('')
    if (UserStore.getByEmail(fEmail.trim().toLowerCase())) { setFError('このメールアドレスは既に使用されています'); return }
    const now = new Date().toISOString()
    UserStore.save({ id: crypto.randomUUID(), name: fName.trim(), email: fEmail.trim().toLowerCase(), passwordHash: btoa(fPass), role: fRole, createdAt: now })
    setFName(''); setFEmail(''); setFPass(''); setFRole('member'); setShowUserForm(false)
    reload()
  }

  const deleteUser = (id: string) => {
    if (!confirm('このユーザーを削除しますか？')) return
    UserStore.delete(id); reload()
  }

  const toggleRole = (u: User) => {
    UserStore.save({ ...u, role: u.role === 'admin' ? 'member' : 'admin' }); reload()
  }

  const addGroup = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    GroupStore.save({ id: crypto.randomUUID(), name: gName.trim(), memberIds: gMembers, createdAt: now })
    setGName(''); setGMembers([]); setShowGroupForm(false); reload()
  }

  const deleteGroup = (id: string) => {
    if (!confirm('このグループを削除しますか？')) return
    GroupStore.delete(id); reload()
  }

  const toggleMember = (uid: string) =>
    setGMembers(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])

  const tasks = TaskStore.getAll()

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 900 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>管理画面</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px' }}>ユーザー・グループの管理</p>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'ユーザー数', value: users.length },
            { label: 'グループ数', value: groups.length },
            { label: '総タスク数', value: tasks.length },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {(['users', 'groups'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--navy-mid)' : '2px solid transparent',
              color: tab === t ? 'var(--navy-mid)' : 'var(--muted)',
              fontWeight: tab === t ? 600 : 400, fontSize: 14, cursor: 'pointer',
              marginBottom: -1
            }}>
              {t === 'users' ? 'ユーザー' : 'グループ'}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button className="btn-primary" onClick={() => setShowUserForm(!showUserForm)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
                ユーザーを追加
              </button>
            </div>

            {showUserForm && (
              <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>新規ユーザー</h3>
                <form onSubmit={addUser}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div><label className="label">名前</label><input className="input" value={fName} onChange={e => setFName(e.target.value)} required /></div>
                    <div><label className="label">メールアドレス</label><input className="input" type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} required /></div>
                    <div><label className="label">パスワード</label><input className="input" type="password" value={fPass} onChange={e => setFPass(e.target.value)} required minLength={6} /></div>
                    <div><label className="label">ロール</label>
                      <select className="input" value={fRole} onChange={e => setFRole(e.target.value as Role)}>
                        <option value="member">メンバー</option>
                        <option value="admin">管理者</option>
                      </select>
                    </div>
                  </div>
                  {fError && <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>{fError}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn-primary">追加</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowUserForm(false)}>キャンセル</button>
                  </div>
                </form>
              </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['名前', 'メール', 'ロール', '担当タスク', '操作'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--teal)', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {u.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: u.role === 'admin' ? '#fef3c7' : '#f0f4f8', color: u.role === 'admin' ? '#92400e' : '#4b5e78', fontWeight: 500 }}>
                          {u.role === 'admin' ? '管理者' : 'メンバー'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {tasks.filter(t => t.assignees.includes(u.id)).length} 件
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.id !== user.id && (
                            <>
                              <button className="btn-secondary" onClick={() => toggleRole(u)} style={{ padding: '5px 10px', fontSize: 12 }}>
                                {u.role === 'admin' ? 'メンバーに変更' : '管理者に変更'}
                              </button>
                              <button className="btn-danger" onClick={() => deleteUser(u.id)} style={{ padding: '5px 10px', fontSize: 12 }}>削除</button>
                            </>
                          )}
                          {u.id === user.id && <span style={{ fontSize: 12, color: 'var(--muted)' }}>（自分）</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'groups' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button className="btn-primary" onClick={() => setShowGroupForm(!showGroupForm)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
                グループを作成
              </button>
            </div>

            {showGroupForm && (
              <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>新規グループ</h3>
                <form onSubmit={addGroup}>
                  <div style={{ marginBottom: 14 }}>
                    <label className="label">グループ名</label>
                    <input className="input" value={gName} onChange={e => setGName(e.target.value)} required style={{ maxWidth: 300 }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">メンバーを選択</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {users.map(u => (
                        <button key={u.id} type="button" onClick={() => toggleMember(u.id)}
                          style={{
                            padding: '6px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 13,
                            border: gMembers.includes(u.id) ? '2px solid var(--teal)' : '1px solid var(--border)',
                            background: gMembers.includes(u.id) ? '#e0f7fa' : 'white',
                            color: gMembers.includes(u.id) ? 'var(--teal)' : 'var(--text)',
                            fontWeight: 500, transition: 'all 0.15s'
                          }}>
                          {u.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn-primary" disabled={!gName.trim()}>作成</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowGroupForm(false)}>キャンセル</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {groups.map(g => (
                <div key={g.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{g.name}</h3>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>{g.memberIds.length}人のメンバー</p>
                    </div>
                    <button className="btn-danger" onClick={() => deleteGroup(g.id)} style={{ padding: '4px 10px', fontSize: 12 }}>削除</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {g.memberIds.map(uid => (
                      <span key={uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0f4f8', borderRadius: 100, padding: '4px 10px', fontSize: 12 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--teal)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {UserStore.getById(uid)?.name.charAt(0) ?? '?'}
                        </span>
                        {UserStore.getById(uid)?.name ?? uid}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
