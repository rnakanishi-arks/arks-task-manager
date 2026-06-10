'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, TaskStore, UserStore, GroupStore, NotifStore, seedIfEmpty } from '@/lib/store'
import type { User, Group, TaskStatus } from '@/lib/store'
import AppShell from '@/components/AppShell'

export default function NewTaskPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    seedIfEmpty()
    const u = Session.get()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    setUsers(UserStore.getAll().filter(x => x.id !== u.id))
    setGroups(GroupStore.getAll())
  }, [router])

  const toggleUser = (id: string) =>
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleGroup = (id: string) =>
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]
    let status: TaskStatus = '未完了'
    if (dueDate && dueDate < today) status = '期限超過'

    const task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      dueDate,
      status,
      createdBy: user.id,
      assignees: selectedUsers,
      groups: selectedGroups,
      updatedAt: now,
      createdAt: now,
      notifications: [],
    }
    TaskStore.save(task)

    // Notify assignees & group members
    const allGroups = GroupStore.getAll()
    NotifStore.notifyTaskUpdate(task, user.id,
      `「${task.title}」が${user.name}から共有されました`, allGroups)

    router.push(`/tasks/${task.id}`)
  }

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 12 }}>
            ← 戻る
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>タスクを作成</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, margin: '0 0 20px' }}>基本情報</h2>
            <div style={{ marginBottom: 18 }}>
              <label className="label">タイトル *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="タスクのタイトルを入力" required />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="label">内容・詳細</label>
              <textarea className="input" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="タスクの詳細を入力" rows={4} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">期日</label>
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ maxWidth: 200 }} />
            </div>
          </div>

          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>共有先</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px' }}>個人とグループを組み合わせて選択できます</p>

            <div style={{ marginBottom: 20 }}>
              <label className="label">個人に共有</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {users.map(u => (
                  <button key={u.id} type="button"
                    onClick={() => toggleUser(u.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px', borderRadius: 100,
                      border: selectedUsers.includes(u.id) ? '2px solid var(--teal)' : '1px solid var(--border)',
                      background: selectedUsers.includes(u.id) ? '#e0f7fa' : 'white',
                      color: selectedUsers.includes(u.id) ? 'var(--teal)' : 'var(--text)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
                    }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.name.charAt(0)}
                    </span>
                    {u.name}
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>({u.role === 'admin' ? '管理者' : 'メンバー'})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">グループに共有</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {groups.map(g => (
                  <button key={g.id} type="button"
                    onClick={() => toggleGroup(g.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px', borderRadius: 100,
                      border: selectedGroups.includes(g.id) ? '2px solid #0369a1' : '1px solid var(--border)',
                      background: selectedGroups.includes(g.id) ? '#e0f2fe' : 'white',
                      color: selectedGroups.includes(g.id) ? '#0369a1' : 'var(--text)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    {g.name}
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>({g.memberIds.length}人)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>キャンセル</button>
            <button type="submit" className="btn-primary" disabled={saving || !title.trim()}>
              {saving ? '作成中...' : 'タスクを作成'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
