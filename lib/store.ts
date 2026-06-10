// lib/store.ts
// localStorage-based data store. Drop-in replaceable with a real DB later.

export type Role = 'admin' | 'member'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string // simple btoa hash for demo; replace with bcrypt in prod
  role: Role
  createdAt: string
}

export type TaskStatus = '未完了' | '進行中' | '完了' | '保留' | '期限超過'

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  status: TaskStatus
  createdBy: string        // userId
  assignees: string[]      // userIds (individual)
  groups: string[]         // groupIds
  completedBy?: string     // userId
  completedAt?: string
  updatedAt: string
  createdAt: string
  notifications: Notification[]
}

export interface Notification {
  id: string
  taskId: string
  toUserId: string
  message: string
  read: boolean
  createdAt: string
}

export interface Group {
  id: string
  name: string
  memberIds: string[]
  createdAt: string
}

// ── Storage helpers ──────────────────────────────────────────────────────────
const KEY_USERS  = 'arks_users'
const KEY_TASKS  = 'arks_tasks'
const KEY_GROUPS = 'arks_groups'
const KEY_NOTIFS = 'arks_notifications'
const KEY_SESSION = 'arks_session'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}
function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Seed data ────────────────────────────────────────────────────────────────
export function seedIfEmpty() {
  const users = read<User[]>(KEY_USERS, [])
  if (users.length > 0) return

  const now = new Date().toISOString()
  const initUsers: User[] = [
    { id: 'u1', name: '管理者', email: 'admin@arks.co.jp', passwordHash: btoa('admin123'), role: 'admin', createdAt: now },
    { id: 'u2', name: '田中 花子', email: 'tanaka@arks.co.jp', passwordHash: btoa('pass123'), role: 'member', createdAt: now },
    { id: 'u3', name: '鈴木 一郎', email: 'suzuki@arks.co.jp', passwordHash: btoa('pass123'), role: 'member', createdAt: now },
    { id: 'u4', name: '佐藤 美咲', email: 'sato@arks.co.jp', passwordHash: btoa('pass123'), role: 'member', createdAt: now },
  ]
  const initGroups: Group[] = [
    { id: 'g1', name: '支援チーム', memberIds: ['u2', 'u3', 'u4'], createdAt: now },
    { id: 'g2', name: '管理チーム', memberIds: ['u1', 'u2'], createdAt: now },
  ]
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const initTasks: Task[] = [
    {
      id: 't1', title: '週次レポートの提出', description: '今週の支援記録をまとめて提出する',
      dueDate: tomorrow.toISOString().split('T')[0],
      status: '未完了', createdBy: 'u1', assignees: ['u2'], groups: [],
      updatedAt: now, createdAt: now, notifications: []
    },
    {
      id: 't2', title: 'クライアントへの連絡', description: '面談日程の調整メールを送付する',
      dueDate: yesterday.toISOString().split('T')[0],
      status: '期限超過', createdBy: 'u1', assignees: [], groups: ['g1'],
      updatedAt: now, createdAt: now, notifications: []
    },
    {
      id: 't3', title: '会議室の予約', description: '来週の全体会議の会議室を予約する',
      dueDate: tomorrow.toISOString().split('T')[0],
      status: '完了', createdBy: 'u2', assignees: ['u3'], groups: [],
      completedBy: 'u3', completedAt: now,
      updatedAt: now, createdAt: now, notifications: []
    },
  ]
  write(KEY_USERS, initUsers)
  write(KEY_GROUPS, initGroups)
  write(KEY_TASKS, initTasks)
  write(KEY_NOTIFS, [])
}

// ── User store ───────────────────────────────────────────────────────────────
export const UserStore = {
  getAll: () => read<User[]>(KEY_USERS, []),
  getById: (id: string) => read<User[]>(KEY_USERS, []).find(u => u.id === id),
  getByEmail: (email: string) => read<User[]>(KEY_USERS, []).find(u => u.email === email),
  save: (user: User) => {
    const users = read<User[]>(KEY_USERS, [])
    const idx = users.findIndex(u => u.id === user.id)
    if (idx >= 0) users[idx] = user; else users.push(user)
    write(KEY_USERS, users)
  },
  delete: (id: string) => {
    write(KEY_USERS, read<User[]>(KEY_USERS, []).filter(u => u.id !== id))
  },
}

// ── Task store ───────────────────────────────────────────────────────────────
export const TaskStore = {
  getAll: () => read<Task[]>(KEY_TASKS, []),
  getById: (id: string) => read<Task[]>(KEY_TASKS, []).find(t => t.id === id),
  save: (task: Task) => {
    const tasks = read<Task[]>(KEY_TASKS, [])
    const idx = tasks.findIndex(t => t.id === task.id)
    if (idx >= 0) tasks[idx] = task; else tasks.push(task)
    write(KEY_TASKS, tasks)
  },
  delete: (id: string) => {
    write(KEY_TASKS, read<Task[]>(KEY_TASKS, []).filter(t => t.id !== id))
  },
  // タスクが自分に関係するか（個別 or グループ経由）
  forUser: (userId: string, groups: Group[]) => {
    const userGroupIds = groups.filter(g => g.memberIds.includes(userId)).map(g => g.id)
    return read<Task[]>(KEY_TASKS, []).filter(t =>
      t.createdBy === userId ||
      t.assignees.includes(userId) ||
      t.groups.some(gid => userGroupIds.includes(gid))
    )
  }
}

// ── Group store ──────────────────────────────────────────────────────────────
export const GroupStore = {
  getAll: () => read<Group[]>(KEY_GROUPS, []),
  getById: (id: string) => read<Group[]>(KEY_GROUPS, []).find(g => g.id === id),
  save: (group: Group) => {
    const groups = read<Group[]>(KEY_GROUPS, [])
    const idx = groups.findIndex(g => g.id === group.id)
    if (idx >= 0) groups[idx] = group; else groups.push(group)
    write(KEY_GROUPS, groups)
  },
  delete: (id: string) => {
    write(KEY_GROUPS, read<Group[]>(KEY_GROUPS, []).filter(g => g.id !== id))
  },
}

// ── Notification store ───────────────────────────────────────────────────────
export const NotifStore = {
  getAll: () => read<Notification[]>(KEY_NOTIFS, []),
  forUser: (userId: string) => read<Notification[]>(KEY_NOTIFS, []).filter(n => n.toUserId === userId),
  unreadCount: (userId: string) => read<Notification[]>(KEY_NOTIFS, []).filter(n => n.toUserId === userId && !n.read).length,
  markRead: (id: string) => {
    const notifs = read<Notification[]>(KEY_NOTIFS, [])
    const n = notifs.find(x => x.id === id)
    if (n) { n.read = true; write(KEY_NOTIFS, notifs) }
  },
  markAllRead: (userId: string) => {
    const notifs = read<Notification[]>(KEY_NOTIFS, [])
    notifs.filter(n => n.toUserId === userId).forEach(n => n.read = true)
    write(KEY_NOTIFS, notifs)
  },
  push: (notif: Notification) => {
    const notifs = read<Notification[]>(KEY_NOTIFS, [])
    notifs.push(notif)
    write(KEY_NOTIFS, notifs)
  },
  // タスクのステータス変更時に関係者全員に通知
  notifyTaskUpdate: (task: Task, changedBy: string, message: string, groups: Group[]) => {
    const now = new Date().toISOString()
    const userGroupIds = task.groups
    const groupMembers = groups
      .filter(g => userGroupIds.includes(g.id))
      .flatMap(g => g.memberIds)
    const targets = [...new Set([task.createdBy, ...task.assignees, ...groupMembers])]
      .filter(uid => uid !== changedBy)
    targets.forEach(toUserId => {
      NotifStore.push({
        id: crypto.randomUUID(),
        taskId: task.id,
        toUserId,
        message,
        read: false,
        createdAt: now,
      })
    })
  }
}

// ── Session ──────────────────────────────────────────────────────────────────
export const Session = {
  get: (): User | null => read<User | null>(KEY_SESSION, null),
  set: (user: User) => write(KEY_SESSION, user),
  clear: () => { if (typeof window !== 'undefined') localStorage.removeItem(KEY_SESSION) },
}
