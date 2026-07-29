import { useCallback, useEffect, useMemo, useState } from 'react'
import { Coins, Gift, Mail, RefreshCcw, Search, Trash2 } from '../../components/icons'
import type { AdminUser, ShopItem } from '../../lib/auth/types'
import {
  ApiError,
  deleteAdminUser,
  fetchAdminShopItems,
  fetchAdminUser,
  fetchAdminUsers,
  grantCoins,
  grantShopItem,
  revokeShopItem,
  sendUserMail,
  updateAdminUser,
  type AdminUserDetail,
} from '../../lib/adminApi'
import { AdminUserOverview, formatDate } from './AdminUserDetailView'
import { AdminSheet } from '../../components/admin/ui/AdminSheet'
import { AdminTabPanel, AdminTabs } from '../../components/admin/ui/AdminTabs'
import { AdminNumberInput } from '../../components/admin/ui/AdminNumberInput'
import { AdminSelect } from '../../components/admin/ui/AdminSelect'
import { AdminTextInput } from '../../components/admin/ui/AdminTextInput'

type DrawerTab = 'overview' | 'inventory' | 'mailbox' | 'actions'

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

function InvThumb({ preview, name }: { preview: string; name: string }) {
  if (preview.startsWith('/uploads/')) {
    return <img src={preview} alt="" className="adm-inv-thumb-img" />
  }
  return <span className="adm-inv-thumb-css" style={{ background: preview || '#334155' }} title={name} />
}

type Props = { token: string }

export function AdminUsersPage({ token }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [search, setSearch] = useState('')
  const [idLookup, setIdLookup] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)
  const [tab, setTab] = useState<DrawerTab>('overview')

  const [editName, setEditName] = useState('')
  const [editCoins, setEditCoins] = useState('0')
  const [editLevel, setEditLevel] = useState('1')
  const [editXp, setEditXp] = useState('0')
  const [editVerified, setEditVerified] = useState(false)

  const [grantAmount, setGrantAmount] = useState('100')
  const [grantNote, setGrantNote] = useState('')
  const [mailSubject, setMailSubject] = useState('')
  const [mailBody, setMailBody] = useState('')
  const [giftItemId, setGiftItemId] = useState('')
  const [giftNote, setGiftNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [u, items] = await Promise.all([fetchAdminUsers(token), fetchAdminShopItems(token)])
      setUsers(u)
      setShopItems(items.filter((i) => i.enabled !== false))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        String(u.id).includes(q),
    )
  }, [users, search])

  const applyDetail = (u: AdminUserDetail) => {
    setDetail(u)
    setEditName(u.displayName)
    setEditCoins(String(u.coins))
    setEditLevel(String(u.level))
    setEditXp(String(u.xp))
    setEditVerified(u.emailVerified)
  }

  const openUser = async (id: number) => {
    setSelectedId(id)
    setDetailBusy(true)
    setError('')
    setSuccess('')
    setTab('overview')
    try {
      applyDetail(await fetchAdminUser(id, token))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load user')
      setSelectedId(null)
    } finally {
      setDetailBusy(false)
    }
  }

  const openById = () => {
    const id = Number(idLookup.trim())
    if (!Number.isFinite(id) || id < 1) {
      setError('Enter a valid numeric user ID.')
      return
    }
    void openUser(id)
  }

  const closeDrawer = () => {
    setSelectedId(null)
    setDetail(null)
  }

  const refreshDetail = async () => {
    if (!detail) return
    applyDetail(await fetchAdminUser(detail.id, token))
  }

  const saveUser = async () => {
    if (!detail) return
    setDetailBusy(true)
    setError('')
    try {
      const updated = await updateAdminUser(
        detail.id,
        {
          displayName: editName,
          coins: Number(editCoins),
          level: Number(editLevel),
          xp: Number(editXp),
          emailVerified: editVerified,
        },
        token,
      )
      applyDetail(updated)
      setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
      setSuccess('Profile saved.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed')
    } finally {
      setDetailBusy(false)
    }
  }

  const onGrant = async () => {
    if (!detail) return
    const amount = Number(grantAmount)
    if (!amount) return
    setDetailBusy(true)
    setError('')
    try {
      const { user } = await grantCoins(detail.id, amount, grantNote, token)
      applyDetail(user)
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, coins: user.coins, level: user.level } : u)))
      setGrantAmount('100')
      setGrantNote('')
      setSuccess(`Granted ${amount} coins.`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Grant failed')
    } finally {
      setDetailBusy(false)
    }
  }

  const onSendMail = async () => {
    if (!detail || !mailSubject.trim() || !mailBody.trim()) {
      setError('Mail subject and message are required.')
      return
    }
    setDetailBusy(true)
    setError('')
    try {
      applyDetail(await sendUserMail(detail.id, { subject: mailSubject, body: mailBody }, token))
      setMailSubject('')
      setMailBody('')
      setTab('mailbox')
      setSuccess('Message sent to inbox.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Send failed')
    } finally {
      setDetailBusy(false)
    }
  }

  const onGift = async () => {
    if (!detail) return
    const itemId = Number(giftItemId)
    if (!itemId) {
      setError('Select an item to gift.')
      return
    }
    setDetailBusy(true)
    setError('')
    try {
      const { user } = await grantShopItem(detail.id, itemId, giftNote, token)
      applyDetail(user)
      setGiftItemId('')
      setGiftNote('')
      setTab('inventory')
      setSuccess('Gift sent — user received in-app mail.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gift failed')
    } finally {
      setDetailBusy(false)
    }
  }

  const onRevoke = async (itemId: number, name: string) => {
    if (!detail) return
    if (!window.confirm(`Remove "${name}" from this user's inventory?`)) return
    setDetailBusy(true)
    try {
      applyDetail(await revokeShopItem(detail.id, itemId, token))
      setSuccess('Item removed from inventory.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Revoke failed')
    } finally {
      setDetailBusy(false)
    }
  }

  const onDelete = async (id: number, email: string) => {
    if (!window.confirm(`Delete "${email}" permanently?`)) return
    try {
      await deleteAdminUser(id, token)
      setUsers((list) => list.filter((u) => u.id !== id))
      if (selectedId === id) closeDrawer()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Delete failed')
    }
  }

  const ownedIds = new Set(detail?.inventory ?? [])
  const giftOptions = shopItems.filter((i) => !ownedIds.has(i.id))

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1>Users</h1>
          <p className="adm-muted">Search, open by ID, view full profile, send mail & unique gifts.</p>
        </div>
        <button type="button" className="adm-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCcw size={14} aria-hidden /> Refresh
        </button>
      </header>

      {error ? <p className="adm-banner adm-banner--error">{error}</p> : null}
      {success ? <p className="adm-banner adm-banner--ok">{success}</p> : null}

      <div className="adm-toolbar adm-toolbar--split">
        <label className="adm-search">
          <Search size={16} aria-hidden />
          <input
            placeholder="Email, name, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="adm-id-lookup">
          <AdminNumberInput
            min={1}
            placeholder="User ID"
            value={idLookup}
            onChange={setIdLookup}
            showSteppers={false}
            onKeyDown={(e) => e.key === 'Enter' && openById()}
          />
          <button type="button" className="adm-btn adm-btn--primary" onClick={openById}>
            Open
          </button>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table adm-table--users">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Lv</th>
              <th>Coins</th>
              <th>Focus</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="adm-table-empty">
                  {loading ? 'Loading…' : 'No users found'}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className={selectedId === u.id ? 'is-selected' : ''}
                  onClick={() => void openUser(u.id)}
                >
                  <td>
                    <code className="adm-id-chip">{u.id}</code>
                  </td>
                  <td>
                    <div className="adm-user-cell">
                      <strong>{u.displayName}</strong>
                      <code className="adm-mail">{u.email}</code>
                    </div>
                  </td>
                  <td>{u.level ?? 1}</td>
                  <td>{(u.coins ?? 0).toLocaleString()}</td>
                  <td>{formatDuration(u.totalFocusSeconds)}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="adm-actions-cell">
                    <button
                      type="button"
                      className="adm-btn adm-btn--danger adm-btn--sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        void onDelete(u.id, u.email)
                      }}
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminSheet
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
        subtitle={detail ? `${detail.displayName} · ID ${detail.id}` : selectedId != null ? `ID ${selectedId}` : ''}
        title={detail?.email ?? (selectedId != null ? `User #${selectedId}` : 'User')}
        width="xl"
      >
        {detailBusy && !detail ? (
          <p className="adm-muted">Loading user…</p>
        ) : detail ? (
          <>
            <AdminTabs
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'inventory', label: `Inventory (${detail.inventory.length})` },
                { id: 'mailbox', label: `Mail (${detail.mailbox.length})` },
                { id: 'actions', label: 'Actions' },
              ]}
              value={tab}
              onValueChange={(v) => setTab(v as DrawerTab)}
            >
              <AdminTabPanel value="overview">
                <AdminUserOverview
                  detail={detail}
                  shopItems={shopItems}
                  editName={editName}
                  editCoins={editCoins}
                  editLevel={editLevel}
                  editXp={editXp}
                  editVerified={editVerified}
                  detailBusy={detailBusy}
                  onEditName={setEditName}
                  onEditCoins={setEditCoins}
                  onEditLevel={setEditLevel}
                  onEditXp={setEditXp}
                  onEditVerified={setEditVerified}
                  onSave={() => void saveUser()}
                />
              </AdminTabPanel>

              <AdminTabPanel value="inventory">
                <section className="adm-panel">
                  <h3>Owned items ({detail.inventoryItems.length})</h3>
                  {detail.inventoryItems.length === 0 ? (
                    <p className="adm-muted">No magazine items owned.</p>
                  ) : (
                    <ul className="adm-inv-grid adm-inv-grid--tiles">
                      {detail.inventoryItems.map((item) => (
                        <li key={item.id} className="adm-inv-tile">
                          <InvThumb preview={item.preview} name={item.name} />
                          <div className="adm-inv-tile-meta">
                            <strong>{item.name}</strong>
                            <small className="adm-muted">{item.type}</small>
                          </div>
                          <button
                            type="button"
                            className="adm-btn adm-btn--danger adm-btn--sm adm-btn--block"
                            disabled={detailBusy}
                            onClick={() => void onRevoke(item.id, item.name)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </AdminTabPanel>

              <AdminTabPanel value="mailbox">
                <section className="adm-panel">
                  <h3>In-app mailbox</h3>
                  {detail.mailbox.length === 0 ? (
                    <p className="adm-muted">No messages yet.</p>
                  ) : (
                    <ul className="adm-mail-list">
                      {detail.mailbox.map((m) => (
                        <li key={m.id} className={m.read ? '' : 'is-unread'}>
                          <div className="adm-mail-list-head">
                            <strong>{m.subject}</strong>
                            <time>{formatDate(m.createdAt)}</time>
                          </div>
                          <p>{m.body}</p>
                          {m.type ? <small className="adm-muted">{m.type}</small> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </AdminTabPanel>

              <AdminTabPanel value="actions">
                <div className="adm-actions-stack">
                  <section className="adm-panel adm-panel--form adm-drawer-section--grant">
                    <h3>
                      <Mail size={16} aria-hidden /> Send message
                    </h3>
                    <p className="adm-muted">Delivered to the user&apos;s in-app inbox (not email SMTP).</p>
                    <label>
                      Subject
                      <AdminTextInput
                        value={mailSubject}
                        maxLength={120}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="Event reward"
                      />
                    </label>
                    <label>
                      Message
                      <textarea
                        rows={4}
                        maxLength={2000}
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                        placeholder="Thanks for being part of Focus…"
                      />
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn--primary"
                      disabled={detailBusy}
                      onClick={() => void onSendMail()}
                    >
                      Send to inbox
                    </button>
                  </section>

                  <section className="adm-panel adm-panel--form adm-drawer-section--grant">
                    <h3>
                      <Gift size={16} aria-hidden /> Gift unique item
                    </h3>
                    <p className="adm-muted">
                      Adds a Magazine item to inventory without charging coins. User gets a gift mail.
                    </p>
                    <label>
                      Shop item
                      <AdminSelect
                        value={giftItemId}
                        onValueChange={setGiftItemId}
                        placeholder="Select item…"
                        options={giftOptions.map((i) => ({
                          value: String(i.id),
                          label: `${i.name} (${i.type}) — ${i.isFree ? 'free' : `${i.price} coins`}`,
                        }))}
                        disabled={giftOptions.length === 0}
                      />
                    </label>
                    {giftOptions.length === 0 ? (
                      <p className="adm-muted adm-hint">User owns all shop items, or Magazine is empty.</p>
                    ) : null}
                    <label>
                      Note (optional)
                      <AdminTextInput
                        value={giftNote}
                        onChange={(e) => setGiftNote(e.target.value)}
                        placeholder="Season 1 reward"
                      />
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn--accent"
                      disabled={detailBusy || !giftItemId}
                      onClick={() => void onGift()}
                    >
                      Send gift
                    </button>
                  </section>

                  <section className="adm-panel adm-panel--form adm-drawer-section--grant">
                    <h3>
                      <Coins size={16} aria-hidden /> Donate coins
                    </h3>
                    <div className="adm-form-grid">
                      <label>
                        Amount (+/-)
                        <AdminNumberInput value={grantAmount} onChange={setGrantAmount} />
                      </label>
                      <label>
                        Note
                        <AdminTextInput
                          value={grantNote}
                          onChange={(e) => setGrantNote(e.target.value)}
                          placeholder="Thank you!"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="adm-btn adm-btn--accent"
                      disabled={detailBusy}
                      onClick={() => void onGrant()}
                    >
                      Grant coins
                    </button>
                  </section>

                  <button
                    type="button"
                    className="adm-btn adm-btn--sm"
                    disabled={detailBusy}
                    onClick={() => void refreshDetail()}
                  >
                    <RefreshCcw size={13} aria-hidden /> Reload user
                  </button>
                </div>
              </AdminTabPanel>
            </AdminTabs>

            <button
              type="button"
              className="adm-btn adm-btn--danger adm-btn--block adm-sheet-footer-btn"
              onClick={() => void onDelete(detail.id, detail.email)}
            >
              <Trash2 size={14} aria-hidden /> Delete user
            </button>
          </>
        ) : null}
      </AdminSheet>
    </div>
  )
}
