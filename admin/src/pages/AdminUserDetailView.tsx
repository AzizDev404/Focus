import {
  Activity,
  Coins,
  Flame,
  Shield,
  Sparkles,
  Target,
  Trophy,
} from '../components/icons'
import type { ShopItem } from '../lib/auth/types'
import type { AdminInventoryItem, AdminUserDetail } from '../lib/adminApi'
import { AdminNumberInput } from '../components/admin/ui/AdminNumberInput'
import { AdminTextInput } from '../components/admin/ui/AdminTextInput'
import { formatDate, formatDuration } from '../lib/adminDateUtils'

const SLOTS = ['background', 'avatar', 'frame', 'charm'] as const


function ItemPreview({ preview, emoji }: { preview: string; emoji?: string }) {
  if (preview.startsWith('/uploads/')) {
    return <img src={preview} alt="" className="adm-slot-preview-img" />
  }
  return (
    <span className="adm-slot-preview-css" style={{ background: preview || '#334155' }} aria-hidden>
      {emoji ?? '✨'}
    </span>
  )
}

function resolveSlotItem(
  slot: (typeof SLOTS)[number],
  detail: AdminUserDetail,
  shopItems: ShopItem[],
): AdminInventoryItem | ShopItem | null {
  const id = detail.equipped[slot]
  if (!id) return null
  return (
    shopItems.find((s) => s.id === id) ??
    detail.inventoryItems.find((i) => i.id === id) ??
    null
  )
}

type OverviewProps = {
  detail: AdminUserDetail
  shopItems: ShopItem[]
  editName: string
  editCoins: string
  editLevel: string
  editXp: string
  editVerified: boolean
  detailBusy: boolean
  onEditName: (v: string) => void
  onEditCoins: (v: string) => void
  onEditLevel: (v: string) => void
  onEditXp: (v: string) => void
  onEditVerified: (v: boolean) => void
  onSave: () => void
}

export function AdminUserOverview({
  detail,
  shopItems,
  editName,
  editCoins,
  editLevel,
  editXp,
  editVerified,
  detailBusy,
  onEditName,
  onEditCoins,
  onEditLevel,
  onEditXp,
  onEditVerified,
  onSave,
}: OverviewProps) {
  const unlocked = detail.achievements.filter((a) => a.unlockedAt != null).length
  const bannerStyle = detail.media.backgroundUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(8,10,16,0.15) 0%, rgba(8,10,16,0.88) 100%), url(${detail.media.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  const stats = [
    { label: 'Focus', value: formatDuration(detail.totalFocusSeconds), Icon: Flame },
    { label: 'Sessions', value: String(detail.totalSessions), Icon: Target },
    { label: 'Tasks', value: String(detail.totalTasksCompleted), Icon: Activity },
    { label: 'Coins', value: (detail.coins ?? 0).toLocaleString(), Icon: Coins },
    { label: 'Achievements', value: String(unlocked), Icon: Trophy },
  ]

  return (
    <div className="adm-user-detail">
      <article className="adm-profile-card">
        <div className="adm-profile-banner" style={bannerStyle} />
        <div className="adm-profile-avatar-wrap">
          {detail.media.avatarUrl ? (
            <img src={detail.media.avatarUrl} alt="" className="adm-profile-avatar" />
          ) : (
            <span className="adm-profile-avatar adm-profile-avatar--empty">
              {detail.displayName[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <div className="adm-profile-body">
          <div className="adm-profile-info">
            <h2>{detail.displayName === 'User' ? detail.email.split('@')[0] : detail.displayName}</h2>
            <p className="adm-profile-email">{detail.email}</p>
            {detail.displayName === 'User' ? (
              <p className="adm-profile-hint adm-muted">Default name — edit below to set display name.</p>
            ) : null}
            <div className="adm-profile-badges">
              <span className="adm-badge adm-badge--id">ID {detail.id}</span>
              <span className="adm-badge">Level {detail.level}</span>
              <span className="adm-badge">{detail.xp.toLocaleString()} XP</span>
              <span className={`adm-badge${detail.emailVerified ? ' adm-badge--ok' : ''}`}>
                {detail.emailVerified ? 'Verified' : 'Unverified'}
              </span>
              {detail.googleId ? <span className="adm-badge">Google</span> : null}
            </div>
          </div>
        </div>
      </article>

      <div className="adm-stat-grid adm-stat-grid--compact">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="adm-stat-card adm-stat-card--violet">
            <div className="adm-stat-icon">
              <Icon size={18} aria-hidden />
            </div>
            <div>
              <span className="adm-stat-label">{label}</span>
              <strong className="adm-stat-value">{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <section className="adm-panel">
        <h3>Equipped magazine items</h3>
        <ul className="adm-slot-grid">
          {SLOTS.map((slot) => {
            const item = resolveSlotItem(slot, detail, shopItems)
            return (
              <li key={slot} className="adm-slot-card">
                <div className="adm-slot-preview">
                  {item ? (
                    <ItemPreview preview={item.preview} emoji={'emoji' in item ? item.emoji : undefined} />
                  ) : (
                    <span className="adm-slot-empty">—</span>
                  )}
                </div>
                <div className="adm-slot-meta">
                  <span className="adm-slot-type">{slot}</span>
                  <strong>{item?.name ?? 'None equipped'}</strong>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="adm-panel">
        <h3>Account timeline</h3>
        <dl className="adm-dl-grid">
          <div>
            <dt>Last login</dt>
            <dd>{formatDate(detail.lastLoginAt)}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(detail.createdAt)}</dd>
          </div>
          <div>
            <dt>Inventory size</dt>
            <dd>{detail.inventory.length} items</dd>
          </div>
          <div>
            <dt>Mailbox</dt>
            <dd>{detail.mailbox.length} messages</dd>
          </div>
        </dl>
      </section>

      <section className="adm-panel adm-panel--form">
        <h3>
          <Shield size={16} aria-hidden /> Edit profile
        </h3>
        <div className="adm-form-grid">
          <label>
            Display name
            <AdminTextInput value={editName} onChange={(e) => onEditName(e.target.value)} />
          </label>
          <label>
            Coins
            <AdminNumberInput min={0} value={editCoins} onChange={onEditCoins} />
          </label>
          <label>
            Level
            <AdminNumberInput min={1} value={editLevel} onChange={onEditLevel} />
          </label>
          <label>
            XP
            <AdminNumberInput min={0} value={editXp} onChange={onEditXp} />
          </label>
        </div>
        <label className="adm-check-inline">
          <input type="checkbox" checked={editVerified} onChange={(e) => onEditVerified(e.target.checked)} />
          Email verified
        </label>
        <button type="button" className="adm-btn adm-btn--primary" disabled={detailBusy} onClick={onSave}>
          Save profile
        </button>
      </section>

      {unlocked > 0 ? (
        <section className="adm-panel">
          <h3>
            <Sparkles size={16} aria-hidden /> Unlocked achievements
          </h3>
          <ul className="adm-ach-list">
            {detail.achievements
              .filter((a) => a.unlockedAt)
              .map((a) => (
                <li key={a.id} className="adm-ach-unlock-row">
                  <Trophy size={14} aria-hidden />
                  <span>{a.id.replace(/_/g, ' ')}</span>
                  <time>{formatDate(a.unlockedAt)}</time>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export {}
