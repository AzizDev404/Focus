import type { Task } from '../types'
import { apiGet, apiPut } from './api'
import { getUserToken } from './authStorage'

export type WorkspaceData = {
  tasks: Task[]
  notepadDate: string
  notepadHtml: string
}

export function todayDateKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function fetchWorkspace() {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  return apiGet<WorkspaceData>('/api/user/workspace', token)
}

export async function saveWorkspaceTasks(tasks: Task[]) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const data = await apiPut<{ tasks: Task[] }>('/api/user/workspace/tasks', { tasks }, token)
  return data.tasks
}

export async function saveWorkspaceNotepad(html: string, date = todayDateKey()) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  return apiPut<{ date: string; saved: boolean }>(
    '/api/user/workspace/notepad',
    { date, html },
    token,
  )
}
