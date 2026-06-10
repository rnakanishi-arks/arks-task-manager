'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Session, TaskStore, UserStore, GroupStore, NotifStore, seedIfEmpty } from '@/lib/store'
import type { User, Task, TaskStatus } from '@/lib/store'
import AppShell from '@/components/AppShell'

const statusClass: Record<string, string> = {
  '未完了': 'badge-todo', '進行中': 'badge-wip', '完了': 'badge-done', '保留': 'badge-hold', '期限超過': 'badge-late'
}
const STATUSES: TaskStatus[] = ['未完了', '進行中', '完了', '保留', '期限超過']

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [task, setTask] = useState<Task | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDue, setEditDue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    seedIfEmpty()
    const u = Session.get()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    const t = TaskStore.getById(id)
    if (!t) { router.replace('/tasks'); return }
    setTask(t)
    setEditTitle(t.title)
    setEditDesc(t.description)
    setEditDue(t.dueDate)
  }, [id, router])

  const getName = (uid: string) => UserStore.getById(uid)?.name ?? uid
  const getGroup = (gid: string) => GroupStore.getById(gid)?.name ?? gid

  const canEdit = user && task && (
    user.role === 'admin' ||
    task.createdBy === user.id ||
    task.assignees.includes(user.id) ||
    task.groups.some(gid => {
      const g = GroupStore.getById(gid)
      return g?.memberIds.includes(user.id)
    })
  )

  const updateStatus = (newStatus: TaskStatus) => {
    if (!task || !user) return
    const now = new Date().toISOString()
    const updated: Task = {
      ...task,
      status: newStatus,
      updatedAt: now,
      completedBy: newStatus === '完了' ? user.id : task.completedBy,
      completedAt: newStatus === '完了' ? now : task.completedAt,
    }
    TaskStore.save(updated)
    const allGroups = GroupStore.getAll()
    NotifStore.notifyTaskUpdate(updated, user.id,
      `「${updated.title}」のステータスが「${newStatus}」に変更されました（${user.name}）`, allGroups)
    setTask(updated)
  }

  const saveEdit = () => {
    if (!task || !user) return
    setSaving(true)
    const now = new Date().toISOString()
    const updated: Task = { ...task, title: editTitle, description: editDesc, dueDate: editDue, updatedAt: now }
    TaskStore.save(updated)
    const allGroups = GroupStore.getAll()
    NotifStore.notifyTaskUpdate(updated, user.id,
      `「${updated.title}」の内容が${user.name}によって更新されました`, allGroups)
    setTask(updated)
    setEditing(false)
    setSaving(false)
  }

  const deleteTask = () => {
    if (!confirm('このタスクを削除しますか？')) return
    TaskStore.delete(id)
    router.replace('/tasks')
  }

  if (!user || !task) return null

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 760 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 16 }}>
          ← 戻る
        </button>

        <div className="card" style={{ padding: 32, marginBottom: 16 }}>
          {editing ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label className="label">タイトル</label>
                <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">内容</label>
                <textarea className="input" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="label">期日</label>
                <input className="input" type="date" value={editDue} onChange={e => setEditDue(e.target.value)} style={{ maxWidth: 200 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
                <button className="btn-secondary" onClick={() => setEditing(false)}>キャンセル</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{task.title}</h1>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {canEdit && (
                    <button className="btn-secondary" onClick={() => setEditing(true)} style={{ padding: '6px 14px', fontSize: 13 }}>編集</button>
                  )}
                  {(user.role === 'admin' || task.createdBy === user.id) && (
                    <button className="btn-danger" onClick={deleteTask} style={{ padding: '6px 14px', fontSize: 13 }}>削除</button>
                  )}
                </div>
              </div>

              {task.description && (
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>{task.description}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div className="label">期日</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: task.status === '期限超過' ? '#b91c1c' : 'var(--text)' }}>
                    {task.dueDate || '未設定'}
                  </div>
                </div>
                <div>
                  <div className="label">作成者</div>
                  <div style={{ fontSize: 14 }}>{getName(task.createdBy)}</div>
                </div>
                {task.completedBy && (
                  <div>
                    <div className="label">完了者</div>
                    <div style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>{getName(task.completedBy)}</div>
                  </div>
                )}
                <div>
                  <div className="label">最終更新</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(task.updatedAt).toLocaleString('ja-JP')}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status */}
        {canEdit && (
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>ステータスを変更</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s}
                  onClick={() => updateStatus(s)}
                  style={{
                    padding: '7px 16px', borderRadius: 100,
                    border: task.status === s ? '2px solid var(--navy-mid)' : '1px solid var(--border)',
                    background: task.status === s ? 'var(--navy-mid)' : 'white',
                    color: task.status === s ? 'white' : 'var(--text)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Share info */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>共有先</h2>
          {task.assignees.length === 0 && task.groups.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>共有先は設定されていません</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {task.assignees.map(uid => (
                <span key={uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f4f8', borderRadius: 100, padding: '5px 12px', fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getName(uid).charAt(0)}
                  </span>
                  {getName(uid)}
                </span>
              ))}
              {task.groups.map(gid => (
                <span key={gid} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e0f2fe', color: '#0369a1', borderRadius: 100, padding: '5px 12px', fontSize: 13 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  {getGroup(gid)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
