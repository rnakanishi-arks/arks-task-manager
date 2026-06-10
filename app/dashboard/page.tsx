'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, TaskStore, GroupStore, NotifStore, UserStore, seedIfEmpty } from '@/lib/store'
import type { User, Task, Notification } from '@/lib/store'
import AppShell from '@/components/AppShell'

const statusClass: Record<string, string> = {
  '未完了': 'badge-todo', '進行中': 'badge-wip', '完了': 'badge-done', '保留': 'badge-hold', '期限超過': 'badge-late'
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])

  useEffect(() => {
    seedIfEmpty()
    const u = Session.get()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    const groups = GroupStore.getAll()
    const tasks = TaskStore.forUser(u.id, groups)
    // Auto-flag overdue
    const today = new Date().toISOString().split('T')[0]
    tasks.forEach(t => {
      if (t.status === '未完了' && t.dueDate && t.dueDate < today) {
        t.status = '期限超過'; TaskStore.save(t)
      }
    })
    setMyTasks(tasks)
    setNotifs(NotifStore.forUser(u.id).slice().reverse().slice(0, 10))
  }, [router])

  if (!user) return null

  const counts = {
    todo: myTasks.filter(t => t.status === '未完了').length,
    wip: myTasks.filter(t => t.status === '進行中').length,
    done: myTasks.filter(t => t.status === '完了').length,
    late: myTasks.filter(t => t.status === '期限超過').length,
  }

  const markRead = (id: string) => {
    NotifStore.markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const getUserName = (uid: string) => UserStore.getById(uid)?.name ?? uid

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>ダッシュボード</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            こんにちは、{user.name}さん
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: '未完了', value: counts.todo, color: '#4b5e78', bg: '#f0f4f8' },
            { label: '進行中', value: counts.wip,  color: '#0369a1', bg: '#e0f2fe' },
            { label: '完了',   value: counts.done, color: '#15803d', bg: '#dcfce7' },
            { label: '期限超過', value: counts.late, color: '#b91c1c', bg: '#fee2e2' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* My Tasks */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>自分のタスク</h2>
              <a href="/tasks" style={{ fontSize: 13, color: 'var(--teal)', textDecoration: 'none' }}>すべて見る →</a>
            </div>
            {myTasks.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>タスクはありません</div>
            ) : (
              <div>
                {myTasks.slice(0, 8).map((task, i) => (
                  <div key={task.id}
                    style={{
                      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                      borderBottom: i < Math.min(myTasks.length, 8) - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s'
                    }}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        期日: {task.dueDate || '未設定'}
                      </div>
                    </div>
                    <span className={`badge ${statusClass[task.status] || 'badge-todo'}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>通知</h2>
              {notifs.some(n => !n.read) && (
                <button onClick={() => { NotifStore.markAllRead(user.id); setNotifs(prev => prev.map(n => ({ ...n, read: true }))) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 12 }}>
                  すべて既読
                </button>
              )}
            </div>
            {notifs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>通知はありません</div>
            ) : (
              <div>
                {notifs.map(n => (
                  <div key={n.id}
                    style={{
                      padding: '12px 20px', borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : '#f0f7ff',
                      cursor: 'pointer'
                    }}
                    onClick={() => { markRead(n.id); router.push(`/tasks/${n.taskId}`) }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a9db0', flexShrink: 0, marginTop: 5 }} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '3px 0 0' }}>
                          {new Date(n.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
