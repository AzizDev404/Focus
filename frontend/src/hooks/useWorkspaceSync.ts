import { useEffect, useRef } from 'react'
import { fetchWorkspace, saveWorkspaceNotepad, saveWorkspaceTasks, todayDateKey } from '../lib/workspaceApi'
import { getUserToken } from '../lib/authStorage'
import { useFlocusStore } from '../store/useFlocusStore'

/** Load tasks + today's notepad from API; debounce saves while logged in. */
export function useWorkspaceSync() {
  const profileId = useFlocusStore((s) => s.profile?.id)
  const tasks = useFlocusStore((s) => s.tasks)
  const notepad = useFlocusStore((s) => s.notepad)
  const setNotepad = useFlocusStore((s) => s.setNotepad)
  const loadedFor = useRef<number | null>(null)
  const skipTaskSave = useRef(true)
  const skipNotepadSave = useRef(true)

  useEffect(() => {
    if (!profileId || !getUserToken()) {
      loadedFor.current = null
      skipTaskSave.current = true
      skipNotepadSave.current = true
      return
    }
    if (loadedFor.current === profileId) return

    let cancelled = false
    void (async () => {
      try {
        const data = await fetchWorkspace()
        if (cancelled) return
        useFlocusStore.setState({ tasks: data.tasks })
        const today = todayDateKey()
        if (data.notepadDate === today) {
          setNotepad(data.notepadHtml)
        } else {
          setNotepad(data.notepadHtml || '')
        }
        loadedFor.current = profileId
      } catch {
        loadedFor.current = profileId
      } finally {
        skipTaskSave.current = false
        skipNotepadSave.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [profileId, setNotepad])

  useEffect(() => {
    if (!profileId || !getUserToken() || skipTaskSave.current) return
    const id = window.setTimeout(() => {
      void saveWorkspaceTasks(tasks).catch(() => {})
    }, 700)
    return () => window.clearTimeout(id)
  }, [tasks, profileId])

  useEffect(() => {
    if (!profileId || !getUserToken() || skipNotepadSave.current) return
    const id = window.setTimeout(() => {
      void saveWorkspaceNotepad(notepad, todayDateKey()).catch(() => {})
    }, 900)
    return () => window.clearTimeout(id)
  }, [notepad, profileId])
}
