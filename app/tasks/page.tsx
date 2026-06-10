'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, TaskStore, GroupStore, UserStore, seedIfEmpty } from '@/lib/store'
import type { User, Task } from '@/lib/store'
import AppShell from '@/components/AppShell'

const statusClass: Record<string, string> = {
  '未完了': 'badge-todo', '進行中': 'badge-wip', '完了': 'badge-done', '保留': 'badge-hold', '期限超過': 'badge-late'
}

export default function TasksPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    seedIfEmpty()
    const u = Session.get()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    const groups = GroupStore.getAll()
    let t = u.role === 'admin' ? TaskStore.getAll() : TaskStore.forUser(u.id, groups)
    const today = new Date().toISOString().split('T')[0]
    t.forEach(task => {
      if (task.status === '未完了' && task.dueDate && task.dueDate < today) {
        task.status = '期限超過'; TaskStore.save(task)
      }
    })
    setTasks(t.slice().sort((a, b) => a.dueDate > b.dueDate ? 1 : -1))
  }, [router])

  const getName = (uid: string) => UserStore.getById(uid)?.name ?? uid
  const getGroup = (gid: string) => GroupStore.getById(gid)?.name ?? gid

  const filtered = tasks.filter(t => {
    const q = filter.toLowerCase()
    const matchText = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchText && matchStatus
  })

  if (!user) return null

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>タスク一覧</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{filtered.length} 件</p>
          </div>
          <button className="btn-primary" onClick={() => router.push('/tasks/new')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
            タスクを作成
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input className="input" placeholder="タスクを検索..." value={filter}
            onChange={e => setFilter(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">すべてのステータス</option>
            {['未完了', '進行中', '完了', '保留', '期限超過'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['タスク', '担当', '期日', 'ステータス', '共有先', '完了者'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase',
                    letterSpacing: '0.05em', background: '#f8fafc'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>タスクがありません</td></tr>
              ) : filtered.map((task, i) => (
                <tr key={task.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background .1s' }}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 16px', maxWidth: 280 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>
                    {task.assignees.map(uid => (
                      <span key={uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 4 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', color: 'white', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getName(uid).charAt(0)}
                        </span>
                        {getName(uid)}
                      </span>
                    ))}
                    {task.assignees.length === 0 && <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: task.status === '期限超過' ? '#b91c1c' : 'var(--text)', whiteSpace: 'nowrap' }}>
                    {task.dueDate || '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className={`badge ${statusClass[task.status] || 'badge-todo'}`}>{task.status}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--muted)' }}>
                    {task.groups.map(gid => (
                      <span key={gid} style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 100, padding: '2px 8px', marginRight: 4, fontSize: 11 }}>
                        {getGroup(gid)}
                      </span>
                    ))}
                    {task.groups.length === 0 && '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>
                    {task.completedBy ? getName(task.completedBy) : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
