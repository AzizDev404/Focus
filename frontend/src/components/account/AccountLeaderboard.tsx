import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCcw, Search } from '../icons'
import { fetchLeaderboard, type LeaderboardUser } from '../../lib/communityApi'
import { fetchProfile, fetchShopItems } from '../../lib/profileApi'
import type { ShopItem } from '../../lib/auth/types'
import { useFlocusStore } from '../../store/useFlocusStore'
import {
  LeaderboardProfileCard,
  leaderboardUserFromEntry,
  type LeaderboardSortKey,
} from './LeaderboardProfileCard'
import { LeaderboardPlayerRow } from './LeaderboardPlayerRow'
import { PublicUserProfilePage } from './PublicUserProfilePage'
import '../../styles/profile.css'
import '../../styles/leaderboard-senkuro.css'
import '../../styles/account-hub-pages.css'

const SORT_OPTIONS: { id: LeaderboardSortKey; label: string }[] = [
  { id: 'level', label: 'Level' },
  { id: 'focus', label: 'Focus time' },
  { id: 'coins', label: 'Coins' },
]

function sortMeta(sort: LeaderboardSortKey) {
  switch (sort) {
    case 'level':
      return { label: 'level' }
    case 'focus':
      return { label: 'focus time' }
    case 'coins':
      return { label: 'coins' }
  }
}

function matchesQuery(user: LeaderboardUser, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (String(user.id).includes(q)) return true
  return user.displayName.toLowerCase().includes(q)
}

const PODIUM_ORDER = [2, 1, 3] as const

function podiumRanks(top: LeaderboardUser[]): (LeaderboardUser | null)[] {
  return PODIUM_ORDER.map((rank) => top.find((u) => u.rank === rank) ?? null)
}

export function AccountLeaderboard() {
  const selfId = useFlocusStore((s) => s.profile?.id ?? null)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)
  const setProfile = useFlocusStore((s) => s.setProfile)
  const leaderboardResetToken = useFlocusStore((s) => s.leaderboardResetToken)
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [sort, setSort] = useState<LeaderboardSortKey>('level')
  const [query, setQuery] = useState('')
  const [idLookup, setIdLookup] = useState('')
  const [idError, setIdError] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    else setRefreshing(true)
    setLoadError('')
    try {
      const [list, items, me] = await Promise.all([
        fetchLeaderboard(50, sort),
        fetchShopItems(),
        fetchProfile(),
      ])
      setUsers(list)
      setShopItems(items)
      if (me) setProfile(me)
    } catch {
      setLoadError('Could not load leaderboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [sort, setProfile])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setSelectedId(null)
  }, [leaderboardResetToken])

  const filtered = useMemo(
    () => users.filter((u) => matchesQuery(u, query)),
    [users, query],
  )

  const selfEntry = useMemo(
    () => (selfId != null ? users.find((u) => u.id === selfId) : undefined),
    [users, selfId],
  )

  const openProfile = useCallback(
    (id: number) => {
      if (selfId != null && id === selfId) {
        setSettingsTab('profile')
        return
      }
      setSelectedId(id)
    },
    [selfId, setSettingsTab],
  )

  const openById = () => {
    const id = Number(idLookup.trim())
    if (!Number.isFinite(id) || id < 1) {
      setIdError('Enter a valid user ID.')
      return
    }
    setIdError('')
    openProfile(id)
  }

  if (loading) {
    return (
      <div className="account-page-panel account-leaderboard">
        <p className="lb-rank-empty">Loading leaderboard…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="account-page-panel account-leaderboard">
        <p className="lb-rank-empty">{loadError}</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
          Retry
        </button>
      </div>
    )
  }

  if (selectedId != null) {
    return (
      <PublicUserProfilePage
        userId={selectedId}
        sort={sort}
        rank={users.find((u) => u.id === selectedId)?.rank}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  const top = filtered.filter((u) => u.rank <= 3)
  const rest = filtered.filter((u) => u.rank > 3)
  const podiumSlots = podiumRanks(top)

  const renderFeaturedCard = (user: LeaderboardUser) => (
    <LeaderboardProfileCard
      key={user.id}
      user={leaderboardUserFromEntry(user)}
      shopItems={shopItems}
      sort={sort}
      rank={user.rank}
      isSelf={user.id === selfId}
      onClick={() => openProfile(user.id)}
    />
  )

  return (
    <div className="account-page-panel account-leaderboard">
        <div className="lb-rank">
          <header className="lb-rank-top glass-surface">
            <div className="lb-rank-top-meta">
              <h3>Top players</h3>
              <p>Best by {sortMeta(sort).label}</p>
            </div>
            {selfEntry ? (
              <span className="lb-rank-self">
                Your rank <strong>#{selfEntry.rank}</strong>
              </span>
            ) : null}
            <button
              type="button"
              className="lb-rank-refresh glass-surface"
              onClick={() => void load({ silent: true })}
              disabled={refreshing}
              aria-label="Refresh leaderboard"
            >
              <RefreshCcw size={14} className={refreshing ? 'is-spinning' : undefined} aria-hidden />
            </button>
          </header>

          <div className="lb-rank-controls glass-surface">
            <nav className="lb-rank-categories" aria-label="Leaderboard sort">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`lb-rank-cat${sort === opt.id ? ' is-active' : ''}`}
                  aria-pressed={sort === opt.id}
                  onClick={() => setSort(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </nav>

            <div className="lb-rank-toolbar">
              <label className="account-search lb-rank-search lb-rank-field">
                <Search size={14} aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search player…"
                  aria-label="Search leaderboard"
                />
              </label>
              <div className="lb-rank-id">
                <label className="lb-rank-id-input lb-rank-field">
                  <span>ID</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={idLookup}
                    onChange={(e) => {
                      setIdLookup(e.target.value.replace(/[^0-9]/g, ''))
                      setIdError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openById()
                    }}
                    placeholder="123"
                    aria-label="User ID lookup"
                  />
                </label>
                <button type="button" className="lb-rank-id-btn lb-rank-field" onClick={openById}>
                  View
                </button>
              </div>
            </div>
          </div>
          {idError ? <p className="lb-rank-id-error">{idError}</p> : null}

          {!filtered.length ? (
            <p className="lb-rank-empty">No players match your search.</p>
          ) : (
            <>
              {top.length > 0 ? (
                <section className="lb-podium-section" aria-label="Top 3 players">
                  <header className="lb-section-label">
                    <span>Podium</span>
                    <small>Top 3</small>
                  </header>
                  <div className="lb-podium">
                    {podiumSlots.map((user, idx) => {
                      const slotRank = PODIUM_ORDER[idx]
                      return user ? (
                        <div
                          key={user.id}
                          className={`lb-podium-slot lb-podium-slot--rank-${user.rank}`}
                        >
                          {renderFeaturedCard(user)}
                        </div>
                      ) : (
                        <div
                          key={`empty-${slotRank}`}
                          className={`lb-podium-spacer lb-podium-slot--rank-${slotRank}`}
                          aria-hidden
                        />
                      )
                    })}
                  </div>
                </section>
              ) : null}

              {rest.length > 0 ? (
                <section className="lb-rank-list">
                  <header className="lb-list-label">
                    <span>All rankings</span>
                    <small>{rest.length} players</small>
                  </header>
                  <div className="lb-table glass-surface">
                    <div className="lb-table-head" aria-hidden>
                      <span>#</span>
                      <span aria-hidden />
                      <span>Player</span>
                      <span>Lv</span>
                      <span>Focus</span>
                      <span>Coins</span>
                    </div>
                    <div className="lb-row-list">
                      {rest.map((user) => (
                        <LeaderboardPlayerRow
                          key={user.id}
                          user={user}
                          sort={sort}
                          shopItems={shopItems}
                          isSelf={user.id === selfId}
                          onClick={() => openProfile(user.id)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
  )
}
