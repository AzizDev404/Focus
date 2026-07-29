import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Coins, Lock, Sparkles, X, Search, ShoppingBag } from '../icons'
import { ApiError } from '../../lib/api'
import type { ShopEvent, ShopEventStatus, ShopItem, ShopItemType, UserProfile } from '../../lib/auth/types'
import { isEquipSlotType } from '../../lib/auth/types'
import { equipItem, purchaseItem } from '../../lib/profileApi'
import {
  isShopImagePreview,
  isCssRingFrame,
  shopItemPreviewStyle,
} from '../../lib/shopItemVisuals'
import { useFlocusStore } from '../../store/useFlocusStore'
import { AccountFilterBar } from '../account/AccountFilterBar'
import { SettingsSelect } from '../settings/SettingsSelect'
import '../../styles/profile.css'
import '../../styles/magazine-shop.css'

const TYPE_LABELS: Record<ShopItemType, string> = {
  background: 'Backgrounds',
  avatar: 'Avatars',
  frame: 'Frames',
  charm: 'Charms',
  sticker: 'Stickers',
}

type BrowseFilter = 'all' | 'owned' | 'sale' | 'free'
type TypeFilter = 'all' | ShopItemType
type EventFilter = 'all' | string

const EVENT_STATUS_LABELS: Record<ShopEventStatus, string> = {
  active: 'Active now',
  upcoming: 'Coming soon',
  ended: 'Ended',
  disabled: 'Unavailable',
}

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All items' },
  ...(Object.keys(TYPE_LABELS) as ShopItemType[]).map((t) => ({
    id: t,
    label: TYPE_LABELS[t].replace(/s$/, ''),
  })),
]

const BROWSE_OPTIONS: { id: BrowseFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'free', label: 'Free' },
  { id: 'sale', label: 'On sale' },
]

function formatEventRange(event: ShopEvent) {
  if (!event.startsAt && !event.endsAt) return 'Limited time'
  const start = event.startsAt ? new Date(event.startsAt).toLocaleString() : '—'
  const end = event.endsAt ? new Date(event.endsAt).toLocaleString() : '—'
  return `${start} → ${end}`
}

function CoinAmount({
  value,
  size = 'md',
  showLabel,
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}) {
  const iconSize = size === 'lg' ? 18 : size === 'md' ? 14 : 12
  return (
    <span className={`profile-coin-amount profile-coin-amount--${size}`}>
      <Coins size={iconSize} aria-hidden />
      <strong>{value.toLocaleString()}</strong>
      {showLabel ? <small>coins</small> : null}
    </span>
  )
}

type Props = {
  profile: UserProfile
  shopItems: ShopItem[]
  shopEvents: ShopEvent[]
  onRefresh: () => Promise<void>
}

function ShopItemThumb({
  item,
  emojiClassName,
  imageClassName,
}: {
  item: ShopItem
  emojiClassName: string
  imageClassName: string
}) {
  if (isShopImagePreview(item.preview)) {
    return <img src={item.preview} alt="" className={imageClassName} />
  }
  return <span className={emojiClassName}>{item.emoji}</span>
}

function MagazineItemPreview({ item }: { item: ShopItem }) {
  if (item.type === 'frame') {
    const frameClass =
      item.preview === 'ring-gold'
        ? 'profile-frame-gold'
        : item.preview === 'ring-silver'
          ? 'profile-frame-silver'
          : 'profile-frame-default'

    return (
      <div className="profile-mag-preview profile-mag-preview--frame mag-shop-item-preview">
        <div className="mag-shop-frame-demo">
          {isShopImagePreview(item.preview) ? (
            <>
              <span className="mag-shop-frame-avatar" aria-hidden>
                {item.emoji || '🌙'}
              </span>
              <img src={item.preview} alt="" className="mag-shop-frame-overlay" />
            </>
          ) : isCssRingFrame(item.preview) ? (
            <div className={`profile-frame-ring ${frameClass}`.trim()}>
              <span className="mag-shop-frame-avatar mag-shop-frame-avatar--ring" aria-hidden>
                {item.emoji || '🌙'}
              </span>
            </div>
          ) : (
            <div
              className="mag-shop-frame-fill"
              style={shopItemPreviewStyle(item.preview, 'contain')}
            >
              <span className="mag-shop-frame-avatar" aria-hidden>
                {item.emoji || '🌙'}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const imageCover = item.type === 'background'

  return (
    <div className={`profile-mag-preview profile-mag-preview--${item.type} mag-shop-item-preview`}>
      {isShopImagePreview(item.preview) ? (
        <img
          src={item.preview}
          alt=""
          className={`profile-mag-preview-img${imageCover ? ' is-cover' : ''}`}
        />
      ) : (
        <div
          className={`profile-mag-preview-fill${imageCover ? ' is-cover' : ''}`}
          style={shopItemPreviewStyle(item.preview, imageCover ? 'cover' : 'contain')}
        >
          <span className="profile-mag-emoji">{item.emoji}</span>
        </div>
      )}
    </div>
  )
}

function MagazineItemAction({
  item,
  profile,
  busyId,
  onEquip,
  onBuy,
}: {
  item: ShopItem
  profile: UserProfile
  busyId: number | null
  onEquip: (item: ShopItem) => void
  onBuy: (item: ShopItem) => void
}) {
  const owned = profile.inventory.includes(item.id)
  const equipped =
    isEquipSlotType(item.type) && profile.equipped[item.type] === item.id
  const price = item.effectivePrice ?? item.price
  const soldOut = item.remaining === 0 && !owned
  const cantAfford = !item.isFree && profile.coins < price
  const eventStatus = item.event?.status
  const eventBlocked = !owned && Boolean(item.eventId && eventStatus && eventStatus !== 'active')

  if (owned) {
    if (item.type === 'sticker') {
      return (
        <span className="profile-mag-action-equipped">
          <Check size={12} aria-hidden /> Use in chat
        </span>
      )
    }
    if (equipped) {
      return (
        <span className="profile-mag-action-equipped">
          <Check size={12} aria-hidden /> Equipped
        </span>
      )
    }
    return (
      <button
        type="button"
        className="profile-mag-btn primary"
        disabled={busyId === item.id}
        onClick={() => void onEquip(item)}
      >
        {busyId === item.id ? '…' : 'Equip'}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`profile-mag-btn ${cantAfford || eventBlocked ? '' : 'primary'}`}
      disabled={busyId === item.id || soldOut || cantAfford || eventBlocked}
      onClick={() => onBuy(item)}
    >
      {soldOut ? (
        <>
          <Lock size={13} aria-hidden /> Sold out
        </>
      ) : eventBlocked ? (
        <>
          <Lock size={13} aria-hidden /> {eventStatus ? EVENT_STATUS_LABELS[eventStatus] : 'Unavailable'}
        </>
      ) : cantAfford ? (
        <>Need coins</>
      ) : busyId === item.id ? (
        '…'
      ) : item.isFree ? (
        'Claim free'
      ) : (
        'Buy'
      )}
    </button>
  )
}

function MagazineShopCard({
  item,
  profile,
  busyId,
  onEquip,
  onBuy,
}: {
  item: ShopItem
  profile: UserProfile
  busyId: number | null
  onEquip: (item: ShopItem) => void
  onBuy: (item: ShopItem) => void
}) {
  const owned = profile.inventory.includes(item.id)
  const equipped =
    isEquipSlotType(item.type) && profile.equipped[item.type] === item.id
  const price = item.effectivePrice ?? item.price
  const soldOut = item.remaining === 0 && !owned
  const showSale = !owned && !item.isFree && item.discountPercent > 0
  const showStock = item.remaining != null && item.remaining > 0 && !owned

  return (
    <article className={`mag-shop-card${owned ? ' is-owned' : ''}${equipped ? ' is-equipped' : ''}`}>
      <div className="mag-shop-card-preview">
        <MagazineItemPreview item={item} />
        <div className="mag-shop-card-badges">
          {showSale ? (
            <span className="mag-badge mag-badge--sale">-{item.discountPercent}%</span>
          ) : null}
          {item.isFree && !owned ? <span className="mag-badge mag-badge--free">Free</span> : null}
          {item.type === 'sticker' && owned ? (
            <span className="mag-badge mag-badge--owned">Chat sticker</span>
          ) : null}
          {equipped ? <span className="mag-badge mag-badge--equipped">Equipped</span> : null}
          {owned && !equipped && item.type !== 'sticker' ? (
            <span className="mag-badge mag-badge--owned">Owned</span>
          ) : null}
          {showStock ? (
            <span className="mag-badge mag-badge--stock">{item.remaining} left</span>
          ) : null}
          {soldOut ? <span className="mag-badge mag-badge--sold">Sold out</span> : null}
        </div>
      </div>
      <div className="mag-shop-card-body">
        <span className="mag-shop-card-type">{TYPE_LABELS[item.type].replace(/s$/, '')}</span>
        <h3>{item.name}</h3>
        <div className="mag-shop-card-price">
          {owned ? (
            <span className="mag-shop-owned-price">In collection</span>
          ) : item.isFree ? (
            <span className="profile-price free">Free</span>
          ) : (
            <span className="profile-price">
              {item.discountPercent > 0 ? (
                <s className="profile-coin-was">{item.price.toLocaleString()}</s>
              ) : null}
              <CoinAmount value={price} size="sm" />
            </span>
          )}
        </div>
        {item.type !== 'sticker' && !equipped ? (
          <div className="mag-shop-card-action">
            <MagazineItemAction
              item={item}
              profile={profile}
              busyId={busyId}
              onEquip={onEquip}
              onBuy={onBuy}
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}

function MagazineShopGrid({
  items,
  profile,
  busyId,
  onEquip,
  onBuy,
}: {
  items: ShopItem[]
  profile: UserProfile
  busyId: number | null
  onEquip: (item: ShopItem) => void
  onBuy: (item: ShopItem) => void
}) {
  return (
    <div className="mag-shop-grid">
      {items.map((item) => (
        <MagazineShopCard
          key={item.id}
          item={item}
          profile={profile}
          busyId={busyId}
          onEquip={onEquip}
          onBuy={onBuy}
        />
      ))}
    </div>
  )
}

export function ProfileMagazine({ profile, shopItems, shopEvents, onRefresh }: Props) {
  const setProfile = useFlocusStore((s) => s.setProfile)
  const [browse, setBrowse] = useState<BrowseFilter>('all')
  const [itemType, setItemType] = useState<TypeFilter>('all')
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<ShopItem | null>(null)

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    return shopItems
      .filter((i) => {
        if (browse === 'owned' && !profile.inventory.includes(i.id)) return false
        if (browse === 'sale' && (i.isFree || i.discountPercent <= 0)) return false
        if (browse === 'free' && !i.isFree) return false
        if (eventFilter !== 'all') {
          const eventId = Number(eventFilter)
          if (!Number.isFinite(eventId) || i.eventId !== eventId) return false
        }
        if (itemType !== 'all' && i.type !== itemType) return false
        return true
      })
      .filter((i) => {
        if (!q) return true
        return (
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          String(i.id).includes(q)
        )
      })
      .sort((a, b) => {
        const aSale = !a.isFree && a.discountPercent > 0
        const bSale = !b.isFree && b.discountPercent > 0
        if (aSale !== bSale) return aSale ? -1 : 1
        if (a.isEvent !== b.isEvent) return a.isEvent ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [shopItems, browse, itemType, eventFilter, profile.inventory, search])

  const showEventFolders = eventFilter !== 'all'

  const eventSections = useMemo(() => {
    if (!showEventFolders) return null
    const byEvent = new Map<number, ShopItem[]>()
    for (const item of items) {
      if (!item.eventId) continue
      const list = byEvent.get(item.eventId) ?? []
      list.push(item)
      byEvent.set(item.eventId, list)
    }
    const sections = shopEvents
      .filter((event) => byEvent.has(event.id))
      .map((event) => ({ event, items: byEvent.get(event.id)! }))
    const loose = items.filter((item) => !item.eventId && item.isEvent)
    if (loose.length) {
      sections.push({
        event: {
          id: -1,
          slug: 'other_events',
          title: 'Other events',
          description: '',
          startsAt: null,
          endsAt: null,
          enabled: true,
          createdAt: '',
          status: 'active',
          itemCount: loose.length,
        },
        items: loose,
      })
    }
    return sections
  }, [items, shopEvents, showEventFolders])

  const featured = useMemo(
    () =>
      shopItems
        .filter((i) => !i.isFree && (i.discountPercent > 0 || i.isEvent))
        .sort((a, b) => b.discountPercent - a.discountPercent)
        .slice(0, 4),
    [shopItems],
  )

  const performPurchase = async (item: ShopItem) => {
    setError('')
    setBusyId(item.id)
    try {
      const data = await purchaseItem(item.id)
      setProfile(data.profile)
      await onRefresh()
      setConfirm(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Purchase failed')
    } finally {
      setBusyId(null)
    }
  }

  const equip = async (item: ShopItem) => {
    setError('')
    setBusyId(item.id)
    try {
      const next = await equipItem(item.id)
      setProfile(next)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Equip failed')
    } finally {
      setBusyId(null)
    }
  }

  const handleBuy = (item: ShopItem) => {
    if (item.isFree) void performPurchase(item)
    else setConfirm(item)
  }

  const showFeatured =
    browse === 'all' && itemType === 'all' && eventFilter === 'all' && !search.trim() && featured.length > 0

  return (
    <>
    <div className="account-page-panel account-magazine">
      <div className="mag-shop">
        <header className="mag-shop-top glass-surface">
          <div className="mag-shop-top-meta">
            <h3>Collectibles shop</h3>
            <p>
              {items.length} item{items.length === 1 ? '' : 's'}
              {browse !== 'all' || itemType !== 'all' ? ' · filtered' : ''}
            </p>
          </div>
          <motion.div
            key={profile.coins}
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="profile-coin-wallet"
            aria-label={`${profile.coins} coins`}
          >
            <CoinAmount value={profile.coins} size="lg" showLabel />
          </motion.div>
        </header>

        <nav className="mag-shop-categories" aria-label="Item categories">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`mag-shop-cat${itemType === opt.id ? ' is-active' : ''}`}
              aria-pressed={itemType === opt.id}
              onClick={() => setItemType(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </nav>

        <div className="mag-shop-toolbar">
          <label className="account-search mag-shop-search glass-surface">
            <Search size={14} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collectibles…"
              aria-label="Search magazine"
            />
          </label>
          <div className="mag-shop-chips" role="group" aria-label="Browse filters">
            {BROWSE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`mag-shop-chip${browse === opt.id ? ' is-active' : ''}`}
                aria-pressed={browse === opt.id}
                onClick={() => setBrowse(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {shopEvents.length > 0 ? (
            <SettingsSelect
              value={eventFilter}
              onValueChange={setEventFilter}
              options={[
                { value: 'all', label: 'All events' },
                ...shopEvents.map((event) => ({ value: String(event.id), label: event.title })),
              ]}
              aria-label="Filter by event"
            />
          ) : null}
        </div>

        {showFeatured ? (
          <div className="mag-shop-featured">
            <span className="mag-shop-featured-label">
              <Sparkles size={13} aria-hidden /> Featured
            </span>
            <div className="mag-shop-featured-track">
              {featured.map((item) => (
                <MagazineShopCard
                  key={`featured-${item.id}`}
                  item={item}
                  profile={profile}
                  busyId={busyId}
                  onEquip={equip}
                  onBuy={handleBuy}
                />
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <motion.p
            className="profile-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        ) : null}

        {browse === 'owned' && !items.length ? (
          <div className="profile-empty">
            <Sparkles size={18} aria-hidden />
            <p>
              {search.trim()
                ? 'No owned items match your search.'
                : 'Nothing owned yet — browse the shop and claim free items.'}
            </p>
          </div>
        ) : null}

        {!items.length && browse !== 'owned' && search.trim() ? (
          <div className="profile-empty">
            <Search size={18} aria-hidden />
            <p>No items match your search.</p>
          </div>
        ) : null}

        {!items.length && browse !== 'owned' && !search.trim() && shopItems.length === 0 ? (
          <div className="profile-empty">
            <ShoppingBag size={18} aria-hidden />
            <p>Shop is empty — new items will appear here soon.</p>
          </div>
        ) : null}

        {!items.length && browse !== 'owned' && !search.trim() && shopItems.length > 0 ? (
          <div className="profile-empty">
            <Search size={18} aria-hidden />
            <p>No items match the current filters.</p>
          </div>
        ) : null}

        {items.length > 0 ? (
          showEventFolders && eventSections && eventSections.length > 0 ? (
            <div className="mag-shop-sections">
              {eventSections.map(({ event, items: sectionItems }) => (
                <section key={event.id} className="mag-shop-section">
                  <header className="mag-shop-event-banner">
                    <div>
                      <h4>{event.title}</h4>
                      {event.description ? <p>{event.description}</p> : null}
                      <small>{formatEventRange(event)}</small>
                    </div>
                    <span className={`profile-event-status profile-event-status--${event.status}`}>
                      {EVENT_STATUS_LABELS[event.status]}
                    </span>
                  </header>
                  <MagazineShopGrid
                    items={sectionItems}
                    profile={profile}
                    busyId={busyId}
                    onEquip={equip}
                    onBuy={handleBuy}
                  />
                </section>
              ))}
            </div>
          ) : (
            <MagazineShopGrid
              items={items}
              profile={profile}
              busyId={busyId}
              onEquip={equip}
              onBuy={handleBuy}
            />
          )
        ) : null}
      </div>
    </div>

    <AnimatePresence>
        {confirm ? (
          <motion.div
            className="profile-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirm(null)
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="profile-confirm-modal"
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <header>
                <h3 id="confirm-title">Confirm purchase</h3>
                <button
                  type="button"
                  className="profile-confirm-close"
                  onClick={() => setConfirm(null)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </header>
              <div className="profile-confirm-body">
                <div
                  className="profile-confirm-preview"
                  style={shopItemPreviewStyle(confirm.preview)}
                  aria-hidden
                >
                  {!isShopImagePreview(confirm.preview) ? <span>{confirm.emoji}</span> : null}
                </div>
                <div className="profile-confirm-meta">
                  <strong>{confirm.name}</strong>
                  <small>{confirm.description}</small>
                  <div className="profile-confirm-price">
                    <CoinAmount value={confirm.effectivePrice ?? confirm.price} size="md" />
                    {confirm.discountPercent > 0 ? (
                      <span className="profile-confirm-original">
                        (was <s className="profile-coin-was">{confirm.price.toLocaleString()}</s>)
                      </span>
                    ) : null}
                  </div>
                  <small>
                    Balance after:{' '}
                    <CoinAmount
                      value={profile.coins - (confirm.effectivePrice ?? confirm.price)}
                      size="sm"
                    />
                  </small>
                </div>
              </div>
              <footer>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busyId === confirm.id}
                  onClick={() => void performPurchase(confirm)}
                >
                  {busyId === confirm.id ? 'Processing…' : 'Confirm purchase'}
                </button>
              </footer>
            </motion.div>
          </motion.div>
        ) : null}
    </AnimatePresence>
  </>
  )
}

export function ProfileInventory({ profile, shopItems }: Omit<Props, 'onRefresh'>) {
  const setProfile = useFlocusStore((s) => s.setProfile)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [filter, setFilter] = useState<ShopItemType | 'all'>('all')

  const owned = useMemo(
    () =>
      shopItems.filter(
        (i) => profile.inventory.includes(i.id) && (filter === 'all' || i.type === filter),
      ),
    [shopItems, profile.inventory, filter],
  )

  if (!profile.inventory.length) {
    return (
      <section className="profile-section">
        <header className="profile-section-head">
          <h2>Your collection</h2>
        </header>
        <div className="profile-empty">
          <Sparkles size={18} aria-hidden />
          <p>Nothing owned yet — visit the Magazine.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-section">
      <header className="profile-section-head">
        <h2>Your collection</h2>
        <span className="profile-section-meta">{profile.inventory.length} items</span>
      </header>
      <AccountFilterBar
        groups={[
          {
            id: 'type',
            options: [
              { id: 'all', label: 'All' },
              ...(Object.keys(TYPE_LABELS) as ShopItemType[]).map((t) => ({
                id: t,
                label: TYPE_LABELS[t],
              })),
            ],
          },
        ]}
        value={filter}
        onChange={(id) => setFilter(id as ShopItemType | 'all')}
        aria-label="Collection filters"
      />
      <div className="profile-inv-grid">
        {owned.map((item) => {
          const equipped =
            isEquipSlotType(item.type) && profile.equipped[item.type] === item.id
          const isSticker = item.type === 'sticker'
          return (
            <motion.button
              key={item.id}
              type="button"
              className={`profile-inv-item${equipped ? ' is-equipped' : ''}${isSticker ? ' is-sticker' : ''}`}
              disabled={busyId === item.id || equipped || isSticker}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              onClick={async () => {
                setBusyId(item.id)
                try {
                  const next = await equipItem(item.id)
                  setProfile(next)
                } finally {
                  setBusyId(null)
                }
              }}
            >
              <ShopItemThumb
                item={item}
                imageClassName="profile-inv-thumb"
                emojiClassName="profile-inv-emoji"
              />
              <small className="profile-inv-name">{item.name}</small>
              <small className="profile-inv-type">{TYPE_LABELS[item.type]}</small>
              {isSticker ? (
                <em>Use in chat</em>
              ) : equipped ? (
                <em>
                  <Check size={11} aria-hidden /> Equipped
                </em>
              ) : busyId === item.id ? (
                <em>…</em>
              ) : null}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
