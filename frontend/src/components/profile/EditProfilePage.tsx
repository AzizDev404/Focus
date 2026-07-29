import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Check, ImageIcon, Save, Upload } from '../icons'
import type { ShopItem, ShopItemType, UserProfile, EquipSlotType } from '../../lib/auth/types'
import { isEquipSlotType } from '../../lib/auth/types'
import {
  equipItem,
  resetProfileSlot,
  shopItemById,
  unequipItem,
  updateDisplayName,
  uploadAvatar,
  uploadBackground,
} from '../../lib/profileApi'
import { ApiError } from '../../lib/api'
import {
  equippedAvatarEmoji,
  equippedAvatarSrc,
  equippedBannerStyle,
  isShopImagePreview,
  shopItemPreviewStyle,
} from '../../lib/shopItemVisuals'
import { useFlocusStore } from '../../store/useFlocusStore'
import { ProfileCard } from './ProfileHero'

function MediaPreview({
  kind,
  imgSrc,
  emoji,
  style,
  emptyIcon: EmptyIcon,
  emptyLabel,
}: {
  kind: 'banner' | 'avatar'
  imgSrc: string | null
  emoji: string | null
  style?: CSSProperties
  emptyIcon: typeof ImageIcon
  emptyLabel: string
}) {
  const className = `edit-profile-preview ${kind === 'banner' ? 'banner-preview' : 'avatar-preview'}`

  if (imgSrc) {
    return (
      <div className={className}>
        <img src={imgSrc} alt="" className="edit-profile-preview-img" />
      </div>
    )
  }

  if (style) {
    return (
      <div className={className} style={style}>
        {emoji ? <span className="edit-profile-preview-emoji">{emoji}</span> : null}
      </div>
    )
  }

  if (emoji) {
    return (
      <div className={className}>
        <span className="edit-profile-preview-emoji">{emoji}</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <span className="edit-profile-preview-empty">
        <EmptyIcon size={18} aria-hidden />
        {emptyLabel}
      </span>
    </div>
  )
}

function CosmeticThumb({ item }: { item: ShopItem }) {
  if (isShopImagePreview(item.preview)) {
    return <img src={item.preview} alt="" className="edit-cosmetic-thumb" />
  }
  return (
    <span className="edit-cosmetic-swatch" style={shopItemPreviewStyle(item.preview, 'contain')}>
      {item.emoji ? <span className="edit-cosmetic-emoji">{item.emoji}</span> : null}
    </span>
  )
}

function OwnedItemGrid({
  items,
  equippedId,
  busyEquipId,
  onEquip,
}: {
  items: ShopItem[]
  equippedId: number | null
  busyEquipId: number | null
  onEquip: (item: ShopItem) => void
}) {
  if (items.length === 0) return null

  return (
    <ul className="edit-cosmetic-grid edit-owned-grid">
      {items.map((item) => {
        const isEquipped = equippedId === item.id
        return (
          <li key={item.id}>
            <button
              type="button"
              className={`edit-cosmetic-item${isEquipped ? ' is-equipped' : ''}`}
              disabled={busyEquipId === item.id || isEquipped}
              onClick={() => void onEquip(item)}
              title={item.name}
            >
              <CosmeticThumb item={item} />
              <span className="edit-cosmetic-name">{item.name}</span>
              {isEquipped ? (
                <span className="edit-cosmetic-equipped">
                  <Check size={12} /> Equipped
                </span>
              ) : busyEquipId === item.id ? (
                <span className="edit-cosmetic-equipped">Equipping…</span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

const COSMETIC_SLOTS: EquipSlotType[] = ['frame', 'charm']

const SLOT_LABELS: Record<EquipSlotType, string> = {
  background: 'Background',
  avatar: 'Avatar',
  frame: 'Frame',
  charm: 'Charm',
}

type Props = {
  profile: UserProfile
  shopItems: ShopItem[]
  onBack: () => void
  onProfileChange?: (profile: UserProfile) => void
}

export function EditProfilePage({ profile, shopItems, onBack, onProfileChange }: Props) {
  const setProfile = useFlocusStore((s) => s.setProfile)
  const setSettings = useFlocusStore((s) => s.setSettings)
  const [name, setName] = useState(profile.displayName)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [busySlot, setBusySlot] = useState<'avatar' | 'background' | null>(null)
  const [busyEquipId, setBusyEquipId] = useState<number | null>(null)
  const avatarRef = useRef<HTMLInputElement | null>(null)
  const bannerRef = useRef<HTMLInputElement | null>(null)

  const media = profile.media ?? { avatarUrl: null, backgroundUrl: null }

  useEffect(() => {
    setName(profile.displayName)
  }, [profile.displayName])

  const ownedByType = useMemo(() => {
    const map: Record<EquipSlotType, ShopItem[]> = {
      background: [],
      avatar: [],
      frame: [],
      charm: [],
    }
    for (const item of shopItems) {
      if (!isEquipSlotType(item.type)) continue
      if (profile.inventory.includes(item.id)) map[item.type].push(item)
    }
    return map
  }, [shopItems, profile.inventory])

  const equippedBg = shopItemById(shopItems, profile.equipped.background)
  const equippedAvatarItem = shopItemById(shopItems, profile.equipped.avatar)

  const coverImgSrc =
    media.backgroundUrl ?? (isShopImagePreview(equippedBg?.preview) ? equippedBg.preview : null)
  const coverStyle = !coverImgSrc ? equippedBannerStyle(media, equippedBg) : undefined

  const avatarImgSrc = equippedAvatarSrc(media, equippedAvatarItem)
  const avatarEmoji = equippedAvatarEmoji(media, equippedAvatarItem)

  const applyProfile = (next: UserProfile) => {
    setProfile(next)
    onProfileChange?.(next)
  }

  const saveName = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === profile.displayName) return
    setSaving(true)
    setFeedback(null)
    try {
      const updated = await updateDisplayName(trimmed)
      applyProfile(updated)
      setSettings({ displayName: updated.displayName })
      setFeedback({ tone: 'success', message: 'Display name saved.' })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Could not save name.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (slot: 'avatar' | 'background', file?: File | null) => {
    if (!file) return
    setBusySlot(slot)
    setFeedback(null)
    try {
      const updated = slot === 'avatar' ? await uploadAvatar(file) : await uploadBackground(file)
      applyProfile(updated)
      setFeedback({ tone: 'success', message: 'Image uploaded.' })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Upload failed.',
      })
    } finally {
      setBusySlot(null)
    }
  }

  const equip = async (item: ShopItem) => {
    setBusyEquipId(item.id)
    setFeedback(null)
    try {
      const next = await equipItem(item.id)
      applyProfile(next)
      setFeedback({ tone: 'success', message: `${item.name} equipped.` })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Equip failed.',
      })
    } finally {
      setBusyEquipId(null)
    }
  }

  const unequip = async (type: ShopItemType) => {
    setBusyEquipId(-1)
    setFeedback(null)
    try {
      const next = await unequipItem(type)
      applyProfile(next)
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Unequip failed.',
      })
    } finally {
      setBusyEquipId(null)
    }
  }

  const resetSlot = async (type: 'background' | 'avatar') => {
    setBusyEquipId(-1)
    setFeedback(null)
    try {
      const next = await resetProfileSlot(type)
      applyProfile(next)
      setFeedback({ tone: 'success', message: 'Reset to default.' })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Reset failed.',
      })
    } finally {
      setBusyEquipId(null)
    }
  }

  return (
    <motion.div
      className="edit-profile-page"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="edit-profile-page-toolbar">
        <button type="button" className="edit-profile-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden /> Back to profile
        </button>
        {feedback ? (
          <p className={`edit-profile-page-feedback edit-profile-page-feedback-${feedback.tone}`}>
            {feedback.message}
          </p>
        ) : null}
      </div>

      <div className="edit-profile-page-layout">
        <aside className="edit-profile-page-preview" aria-label="Live preview">
          <p className="edit-profile-page-preview-label">Live preview</p>
          <div className="edit-profile-live-preview">
            <ProfileCard profile={profile} shopItems={shopItems} previewMode />
          </div>
        </aside>

        <div className="edit-profile-page-sections">
          <section className="edit-profile-panel">
            <header className="edit-profile-panel-head">
              <h3>Display name</h3>
            </header>
            <label className="edit-profile-field">
              <span>Name shown on your card</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                className="form-control"
              />
            </label>
            <div className="edit-profile-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void saveName()}
                disabled={saving || !name.trim() || name.trim() === profile.displayName}
              >
                {saving ? (
                  'Saving…'
                ) : (
                  <>
                    <Save size={14} aria-hidden /> Save name
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="edit-profile-panel">
            <header className="edit-profile-panel-head">
              <h3>Cover</h3>
              {(profile.equipped.background || media.backgroundUrl) && (
                <button
                  type="button"
                  className="edit-cosmetic-unequip"
                  onClick={() => void resetSlot('background')}
                  disabled={busyEquipId !== null}
                >
                  Reset
                </button>
              )}
            </header>
            <div className="edit-profile-upload edit-profile-upload--page">
              <MediaPreview
                kind="banner"
                imgSrc={coverImgSrc}
                emoji={null}
                style={coverStyle}
                emptyIcon={ImageIcon}
                emptyLabel="No cover"
              />
              <div className="edit-profile-upload-controls">
                <p>
                  {media.backgroundUrl
                    ? 'Custom upload'
                    : equippedBg
                      ? `Magazine · ${equippedBg.name}`
                      : 'Default cover'}
                </p>
                <input
                  ref={bannerRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleUpload('background', e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => bannerRef.current?.click()}
                  disabled={busySlot === 'background'}
                >
                  <Upload size={14} aria-hidden />
                  {busySlot === 'background' ? 'Uploading…' : 'Upload cover'}
                </button>
              </div>
            </div>
            {ownedByType.background.length > 0 ? (
              <OwnedItemGrid
                items={ownedByType.background}
                equippedId={profile.equipped.background}
                busyEquipId={busyEquipId}
                onEquip={equip}
              />
            ) : (
              <p className="edit-profile-hint">Buy covers in the Magazine tab.</p>
            )}
          </section>

          <section className="edit-profile-panel">
            <header className="edit-profile-panel-head">
              <h3>Avatar</h3>
              {(profile.equipped.avatar || media.avatarUrl) && (
                <button
                  type="button"
                  className="edit-cosmetic-unequip"
                  onClick={() => void resetSlot('avatar')}
                  disabled={busyEquipId !== null}
                >
                  Reset
                </button>
              )}
            </header>
            <div className="edit-profile-upload edit-profile-upload--page">
              <MediaPreview
                kind="avatar"
                imgSrc={avatarImgSrc}
                emoji={avatarEmoji}
                emptyIcon={Camera}
                emptyLabel="No avatar"
              />
              <div className="edit-profile-upload-controls">
                <p>
                  {media.avatarUrl
                    ? 'Custom upload'
                    : equippedAvatarItem
                      ? `Magazine · ${equippedAvatarItem.name}`
                      : 'Default avatar'}
                </p>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleUpload('avatar', e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => avatarRef.current?.click()}
                  disabled={busySlot === 'avatar'}
                >
                  <Upload size={14} aria-hidden />
                  {busySlot === 'avatar' ? 'Uploading…' : 'Upload avatar'}
                </button>
              </div>
            </div>
            {ownedByType.avatar.length > 0 ? (
              <OwnedItemGrid
                items={ownedByType.avatar}
                equippedId={profile.equipped.avatar}
                busyEquipId={busyEquipId}
                onEquip={equip}
              />
            ) : (
              <p className="edit-profile-hint">Buy avatars in the Magazine tab.</p>
            )}
          </section>

          {COSMETIC_SLOTS.map((type) => {
            const equippedId = profile.equipped[type]
            const equipped = shopItemById(shopItems, equippedId)
            const owned = ownedByType[type]

            return (
              <section key={type} className="edit-profile-panel">
                <header className="edit-profile-panel-head">
                  <h3>{SLOT_LABELS[type]}</h3>
                  {equipped ? (
                    <button
                      type="button"
                      className="edit-cosmetic-unequip"
                      onClick={() => void unequip(type)}
                      disabled={busyEquipId !== null}
                    >
                      Unequip
                    </button>
                  ) : null}
                </header>
                {owned.length === 0 ? (
                  <p className="edit-cosmetic-empty">
                    No {SLOT_LABELS[type].toLowerCase()} owned. Visit the Magazine to get one.
                  </p>
                ) : (
                  <OwnedItemGrid
                    items={owned}
                    equippedId={equippedId}
                    busyEquipId={busyEquipId}
                    onEquip={equip}
                  />
                )}
              </section>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
