import { useEffect, useState } from 'react'
import { fetchFollowers, fetchFollowing, type FollowUser } from '../../lib/socialApi'
import { useFlocusStore } from '../../store/useFlocusStore'

type Props = {
  userId: number
  kind: 'followers' | 'following'
  onClose: () => void
}

export function FollowListSheet({ userId, kind, onClose }: Props) {
  const openMessagesWith = useFlocusStore((s) => s.openMessagesWith)
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    void (async () => {
      try {
        const list = kind === 'followers' ? await fetchFollowers(userId) : await fetchFollowing(userId)
        if (!cancelled) setUsers(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load list')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, kind])

  const title = kind === 'followers' ? 'Followers' : 'Following'

  return (
    <div className="follow-list-backdrop" role="presentation" onClick={onClose}>
      <div
        className="follow-list-sheet glass-surface"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="follow-list-sheet-head">
          <h4>{title}</h4>
          <button type="button" className="follow-list-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="follow-list-sheet-body">
          {loading ? <p className="follow-list-empty">Loading…</p> : null}
          {error ? <p className="follow-list-error">{error}</p> : null}
          {!loading && !error && users.length === 0 ? (
            <p className="follow-list-empty">No one here yet.</p>
          ) : null}
          {!loading && !error && users.length > 0 ? (
            <ul className="follow-list">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="follow-list-row"
                    onClick={() => {
                      openMessagesWith(u.id, u.displayName)
                      onClose()
                    }}
                  >
                    <span className="follow-list-avatar" aria-hidden>
                      {u.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="follow-list-name">{u.displayName}</span>
                    <span className="follow-list-action">Message</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
