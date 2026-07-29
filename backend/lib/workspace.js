const MAX_TASKS = 200
const MAX_TASK_TEXT = 200
const MAX_NOTEPAD_HTML = 80_000

export function normalizeUserTasks(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = String(item.id ?? '').trim()
    const text = String(item.text ?? '').trim().slice(0, MAX_TASK_TEXT)
    if (!id) continue
    out.push({
      id,
      text,
      completed: Boolean(item.completed),
      ...(item.emoji && typeof item.emoji === 'string' ? { emoji: item.emoji.slice(0, 8) } : {}),
      ...(item.color && typeof item.color === 'string' ? { color: item.color.slice(0, 32) } : {}),
    })
    if (out.length >= MAX_TASKS) break
  }
  return out
}

export function normalizeNotepadDaily(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const out = {}
  for (const [date, html] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    out[date] = String(html ?? '').slice(0, MAX_NOTEPAD_HTML)
  }
  return out
}

export function workspacePayload(user) {
  const today = new Date().toISOString().slice(0, 10)
  const notepadDaily = user.notepadDaily ?? {}
  return {
    tasks: normalizeUserTasks(user.tasks),
    notepadDate: today,
    notepadHtml: notepadDaily[today] ?? '',
  }
}
