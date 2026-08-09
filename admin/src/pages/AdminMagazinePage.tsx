import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, FolderOpen, ImageIcon, Pencil, RefreshCcw, Trash2, Upload } from '../components/icons'
import { AdminModal } from '../components/admin/ui/AdminSheet'
import { AdminNumberInput } from '../components/admin/ui/AdminNumberInput'
import { AdminSelect } from '../components/admin/ui/AdminSelect'
import { AdminTextInput } from '../components/admin/ui/AdminTextInput'
import type { ShopEvent, ShopEventStatus, ShopItem, ShopItemType } from '../lib/auth/types'
import {
  ApiError,
  createAdminShopEvent,
  createShopItemWithImage,
  deleteAdminShopEvent,
  deleteAdminShopItem,
  fetchAdminShopEvents,
  fetchAdminShopItems,
  updateAdminShopEvent,
  updateAdminShopItem,
  uploadShopPreview,
} from '../lib/adminApi'

const TYPE_LABELS: Record<ShopItemType, string> = {
  background: 'Background',
  avatar: 'Avatar',
  frame: 'Frame',
  charm: 'Charm',
  sticker: 'Sticker',
}

const VISUAL_TYPES = new Set<ShopItemType>(['background', 'avatar', 'frame', 'sticker'])

const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as ShopItemType[]).map((t) => ({
  value: t,
  label: TYPE_LABELS[t],
}))

/** Radix Select rejects empty string values — use a sentinel instead. */
const NO_EVENT = 'none'

function eventIdToFormValue(eventId: number | null | undefined) {
  return eventId == null ? NO_EVENT : String(eventId)
}

function eventIdFromFormValue(value: string) {
  return value === NO_EVENT || value === '' ? null : Number(value)
}

const EVENT_STATUS_LABELS: Record<ShopEventStatus, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  ended: 'Ended',
  disabled: 'Disabled',
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value: string) {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function emptyEventForm() {
  return {
    title: '',
    slug: '',
    description: '',
    startsAt: '',
    endsAt: '',
    enabled: true,
  }
}

function emptyForm() {
  return {
    type: 'background' as ShopItemType,
    name: '',
    description: '',
    price: 100,
    discountPercent: 10,
    useDiscount: false,
    isFree: false,
    isEvent: false,
    eventId: NO_EVENT,
    stockLimit: '',
    enabled: true,
    image: null as File | null,
    imagePreview: '' as string,
  }
}

function priceLabel(item: ShopItem) {
  if (item.isFree) return 'Free'
  const base = item.price
  if (item.discountPercent > 0) {
    const sale = Math.round(base * (1 - item.discountPercent / 100))
    return (
      <>
        <span className="adm-price-sale">{sale}</span>
        <span className="adm-price-was">{base}</span>
        <span className="adm-muted"> −{item.discountPercent}%</span>
      </>
    )
  }
  return `${base} coins`
}

function ItemThumb({ item }: { item: ShopItem }) {
  if (item.preview.startsWith('/') || item.preview.startsWith('http')) {
    return <img src={item.preview} alt="" className="adm-shop-thumb-img" />
  }
  return (
    <span className="adm-shop-thumb-css" style={{ background: item.preview }} aria-hidden>
      {item.emoji}
    </span>
  )
}

type Props = { token: string }

export function AdminMagazinePage({ token }: Props) {
  const [items, setItems] = useState<ShopItem[]>([])
  const [events, setEvents] = useState<ShopEvent[]>([])
  const [form, setForm] = useState(emptyForm)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [editItem, setEditItem] = useState<ShopItem | null>(null)
  const [editEvent, setEditEvent] = useState<ShopEvent | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    discountPercent: 0,
    useDiscount: false,
    isFree: false,
    isEvent: false,
    eventId: NO_EVENT,
    stockLimit: '',
    enabled: true,
  })
  const [editEventForm, setEditEventForm] = useState(emptyEventForm())
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const needsImage = VISUAL_TYPES.has(form.type)

  const eventOptions = useMemo(
    () => [
      { value: NO_EVENT, label: 'No event folder' },
      ...events.map((e) => ({ value: String(e.id), label: e.title })),
    ],
    [events],
  )

  const load = async () => {
    const [itemsResult, eventsResult] = await Promise.allSettled([
      fetchAdminShopItems(token),
      fetchAdminShopEvents(token),
    ])
    if (itemsResult.status === 'fulfilled') {
      setItems(itemsResult.value)
    } else {
      throw itemsResult.reason
    }
    if (eventsResult.status === 'fulfilled') {
      setEvents(eventsResult.value)
    } else {
      setEvents([])
      console.warn('[admin] shop events unavailable:', eventsResult.reason)
    }
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
  }, [token])

  useEffect(() => {
    return () => {
      if (form.imagePreview) URL.revokeObjectURL(form.imagePreview)
    }
  }, [form.imagePreview])

  const onPickImage = (file: File | null) => {
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview)
    if (!file) {
      setForm((f) => ({ ...f, image: null, imagePreview: '' }))
      return
    }
    setForm((f) => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }))
  }

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (needsImage && !form.image) {
      setError('Upload an image for background, avatar, frame, or sticker.')
      return
    }
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await createShopItemWithImage(
        {
          type: form.type,
          name: form.name,
          description: form.description,
          price: form.price,
          discountPercent: form.discountPercent,
          useDiscount: form.useDiscount,
          isFree: form.isFree,
          isEvent: form.isEvent || form.eventId !== NO_EVENT,
          eventId: form.eventId === NO_EVENT ? '' : form.eventId,
          stockLimit: form.stockLimit,
          enabled: form.enabled,
          image: form.image,
        },
        token,
      )
      setForm(emptyForm())
      if (fileRef.current) fileRef.current.value = ''
      setSuccess('Item published to the Magazine.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (item: ShopItem) => {
    setEditItem(item)
    setEditForm({
      name: item.name,
      description: item.description,
      price: item.price,
      discountPercent: item.discountPercent,
      useDiscount: item.discountPercent > 0,
      isFree: item.isFree,
      isEvent: item.isEvent,
      eventId: eventIdToFormValue(item.eventId),
      stockLimit: item.stockLimit == null ? '' : String(item.stockLimit),
      enabled: item.enabled,
    })
    setError('')
    setSuccess('')
  }

  const saveEdit = async () => {
    if (!editItem) return
    setBusy(true)
    setError('')
    try {
      await updateAdminShopItem(
        editItem.id,
        {
          name: editForm.name,
          description: editForm.description,
          price: editForm.isFree ? 0 : editForm.price,
          discountPercent: editForm.useDiscount ? editForm.discountPercent : 0,
          isFree: editForm.isFree,
          isEvent: editForm.isEvent || editForm.eventId !== NO_EVENT,
          eventId: eventIdFromFormValue(editForm.eventId),
          stockLimit: editForm.stockLimit === '' ? null : Number(editForm.stockLimit),
          enabled: editForm.enabled,
        },
        token,
      )
      const file = editFileRef.current?.files?.[0]
      if (file) await uploadShopPreview(editItem.id, file, token)
      setEditItem(null)
      setSuccess('Item updated.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
    } finally {
      setBusy(false)
      if (editFileRef.current) editFileRef.current.value = ''
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this item from the Magazine?')) return
    try {
      await deleteAdminShopItem(id, token)
      if (editItem?.id === id) setEditItem(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const onCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventForm.title.trim()) {
      setError('Event title is required.')
      return
    }
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await createAdminShopEvent(
        {
          title: eventForm.title.trim(),
          slug: eventForm.slug.trim() || undefined,
          description: eventForm.description.trim(),
          startsAt: fromDatetimeLocal(eventForm.startsAt),
          endsAt: fromDatetimeLocal(eventForm.endsAt),
          enabled: eventForm.enabled,
        },
        token,
      )
      setEventForm(emptyEventForm())
      setSuccess('Event folder created.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create event failed')
    } finally {
      setBusy(false)
    }
  }

  const openEditEvent = (event: ShopEvent) => {
    setEditEvent(event)
    setEditEventForm({
      title: event.title,
      slug: event.slug,
      description: event.description,
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: toDatetimeLocal(event.endsAt),
      enabled: event.enabled,
    })
    setError('')
    setSuccess('')
  }

  const saveEditEvent = async () => {
    if (!editEvent) return
    setBusy(true)
    setError('')
    try {
      await updateAdminShopEvent(
        editEvent.id,
        {
          title: editEventForm.title.trim(),
          slug: editEventForm.slug.trim() || undefined,
          description: editEventForm.description.trim(),
          startsAt: fromDatetimeLocal(editEventForm.startsAt),
          endsAt: fromDatetimeLocal(editEventForm.endsAt),
          enabled: editEventForm.enabled,
        },
        token,
      )
      setEditEvent(null)
      setSuccess('Event folder updated.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save event failed')
    } finally {
      setBusy(false)
    }
  }

  const onDeleteEvent = async (id: number) => {
    if (!window.confirm('Delete this event folder? Items will be unlinked but kept in the shop.')) return
    try {
      await deleteAdminShopEvent(id, token)
      if (editEvent?.id === id) setEditEvent(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete event failed')
    }
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items],
  )

  const itemsByEvent = useMemo(() => {
    const map = new Map<number | 'none', ShopItem[]>()
    for (const item of sorted) {
      const key = item.eventId ?? 'none'
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [sorted])

  const eventTitle = (eventId: number | null) =>
    eventId == null ? null : events.find((e) => e.id === eventId)?.title ?? null

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1>Magazine</h1>
          <p className="adm-page-sub">Shop items, chat stickers, and event folders.</p>
        </div>
        <button type="button" className="adm-btn" onClick={() => void load()}>
          <RefreshCcw size={14} aria-hidden /> Refresh
        </button>
      </header>

      {error ? <p className="adm-banner adm-banner--error">{error}</p> : null}
      {success ? <p className="adm-banner adm-banner--ok">{success}</p> : null}

      <div className="adm-mag-events">
        <form className="adm-card adm-form adm-mag-event-create" onSubmit={onCreateEvent}>
          <h2>
            <FolderOpen size={16} aria-hidden /> Event folder
          </h2>
          <label>
            Title
            <AdminTextInput
              value={eventForm.title}
              onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Summer Time Limit"
              required
              maxLength={80}
            />
          </label>
          <label>
            Slug (optional)
            <AdminTextInput
              value={eventForm.slug}
              onChange={(e) => setEventForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="summer_time_limit"
              maxLength={48}
            />
          </label>
          <label>
            Description
            <textarea
              rows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short note shown in the shop"
              maxLength={500}
            />
          </label>
          <div className="adm-form-grid">
            <label>
              Starts
              <AdminTextInput
                type="datetime-local"
                value={eventForm.startsAt}
                onChange={(e) => setEventForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </label>
            <label>
              Ends
              <AdminTextInput
                type="datetime-local"
                value={eventForm.endsAt}
                onChange={(e) => setEventForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </label>
          </div>
          <label className="adm-check-inline">
            <input
              type="checkbox"
              checked={eventForm.enabled}
              onChange={(e) => setEventForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            Enabled
          </label>
          <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
            {busy ? 'Creating…' : 'Create'}
          </button>
        </form>

        <div className="adm-mag-event-list">
          {events.length === 0 ? (
            <p className="adm-table-empty">
              <Calendar size={18} aria-hidden /> No events yet
            </p>
          ) : (
            events.map((event) => (
              <article key={event.id} className="adm-mag-event-card">
                <div className="adm-mag-event-card-head">
                  <div>
                    <strong>{event.title}</strong>
                    <span className={`adm-event-status adm-event-status--${event.status}`}>
                      {EVENT_STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="adm-mag-event-actions">
                    <button type="button" className="adm-btn adm-btn--sm" onClick={() => openEditEvent(event)}>
                      <Pencil size={13} aria-hidden /> Edit
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn--danger adm-btn--sm"
                      onClick={() => void onDeleteEvent(event.id)}
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </div>
                </div>
                {event.description ? <p className="adm-muted">{event.description}</p> : null}
                <small className="adm-muted adm-block">
                  {event.itemCount} item{event.itemCount === 1 ? '' : 's'}
                  {event.startsAt || event.endsAt
                    ? ` · ${event.startsAt ? new Date(event.startsAt).toLocaleString() : '—'} → ${event.endsAt ? new Date(event.endsAt).toLocaleString() : '—'}`
                    : ' · No time limit set'}
                </small>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="adm-mag-layout">
        <form className="adm-card adm-form adm-mag-create" onSubmit={onCreate}>
          <h2>New item</h2>

          <label>
            Type
            <AdminSelect
              value={form.type}
              onValueChange={(type) => {
                setForm((f) => ({
                  ...f,
                  type: type as ShopItemType,
                  image: null,
                  imagePreview: '',
                }))
                if (fileRef.current) fileRef.current.value = ''
              }}
              options={TYPE_OPTIONS}
            />
          </label>

          {form.type === 'sticker' ? (
            <p className="adm-mag-sticker-hint">
              Chat stickers appear in chat after users purchase them from the Magazine shop.
            </p>
          ) : null}

          <div
            className={`adm-upload-zone${form.imagePreview ? ' has-preview' : ''}`}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {form.imagePreview ? (
              <img src={form.imagePreview} alt="Preview" className="adm-upload-preview" />
            ) : (
              <>
                <Upload size={28} aria-hidden />
                <strong>
                  {form.type === 'sticker'
                    ? 'Upload sticker image'
                    : needsImage
                      ? 'Upload image'
                      : 'Image (optional)'}
                </strong>
                <span className="adm-muted">PNG or WEBP recommended · 5 MB max</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="adm-form-grid">
            <label>
              Name
              <AdminTextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Midnight Bloom"
                required
                maxLength={80}
              />
            </label>
            <label>
              Stock (count)
              <AdminNumberInput
                min={0}
                placeholder="Unlimited"
                value={form.stockLimit}
                onChange={(v) => setForm((f) => ({ ...f, stockLimit: v }))}
                showSteppers={false}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short text shown in the shop"
              maxLength={500}
            />
          </label>

          <div className="adm-pricing-block">
            <label className="adm-check-inline">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
              />
              Free (0 coins)
            </label>
            {!form.isFree ? (
              <label>
                Price (coins)
                <AdminNumberInput
                  min={1}
                  value={form.price}
                  onChange={(v) => setForm((f) => ({ ...f, price: Number(v) || 0 }))}
                />
              </label>
            ) : null}
            <label className="adm-check-inline">
              <input
                type="checkbox"
                checked={form.useDiscount}
                disabled={form.isFree}
                onChange={(e) => setForm((f) => ({ ...f, useDiscount: e.target.checked }))}
              />
              Discount
            </label>
            {form.useDiscount && !form.isFree ? (
              <label>
                Discount %
                <AdminNumberInput
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(v) => setForm((f) => ({ ...f, discountPercent: Number(v) || 0 }))}
                />
              </label>
            ) : null}
          </div>

          <div className="adm-check-row">
            <label>
              Event folder
              <AdminSelect
                value={form.eventId}
                onValueChange={(eventId) =>
                  setForm((f) => ({
                    ...f,
                    eventId,
                    isEvent: eventId !== NO_EVENT ? true : f.isEvent,
                  }))
                }
                options={eventOptions}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              Visible in shop
            </label>
          </div>

          <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </form>

        <div className="adm-mag-catalog">
          {events.map((event) => {
            const folderItems = itemsByEvent.get(event.id) ?? []
            if (!folderItems.length) return null
            return (
              <section key={`folder-${event.id}`} className="adm-mag-event-folder">
                <header className="adm-mag-event-folder-head">
                  <FolderOpen size={15} aria-hidden />
                  <div>
                    <strong>{event.title}</strong>
                    <span className={`adm-event-status adm-event-status--${event.status}`}>
                      {EVENT_STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <small className="adm-muted">{folderItems.length} items</small>
                </header>
                <div className="adm-table-card">
                  <table className="adm-table">
                    <tbody>
                      {folderItems.map((item) => (
                        <tr key={item.id} className="adm-mag-row">
                          <td>
                            <div className="adm-shop-thumb">
                              <ItemThumb item={item} />
                            </div>
                          </td>
                          <td>
                            <strong>{item.name}</strong>
                            <small className="adm-muted adm-block">
                              <span className={`adm-type-pill adm-type-pill--${item.type}`}>
                                {TYPE_LABELS[item.type]}
                              </span>
                            </small>
                          </td>
                          <td>{priceLabel(item)}</td>
                          <td>
                            {item.soldCount}/{item.stockLimit ?? '∞'}
                          </td>
                          <td className="adm-actions-cell">
                            <button type="button" className="adm-btn adm-btn--sm" onClick={() => openEdit(item)}>
                              <Pencil size={13} aria-hidden /> Edit
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn--danger adm-btn--sm"
                              onClick={() => void onDelete(item.id)}
                            >
                              <Trash2 size={13} aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}

          {(itemsByEvent.get('none') ?? []).length > 0 ? (
            <section className="adm-mag-event-folder">
              <header className="adm-mag-event-folder-head">
                <strong>General catalog</strong>
                <small className="adm-muted">{(itemsByEvent.get('none') ?? []).length} items</small>
              </header>
              <div className="adm-table-card">
                <table className="adm-table">
                  <tbody>
                    {(itemsByEvent.get('none') ?? []).map((item) => (
                      <tr key={item.id} className="adm-mag-row">
                        <td>
                          <div className="adm-shop-thumb">
                            <ItemThumb item={item} />
                          </div>
                        </td>
                        <td>
                          <strong>{item.name}</strong>
                          <small className="adm-muted adm-block">
                            <span className={`adm-type-pill adm-type-pill--${item.type}`}>
                              {TYPE_LABELS[item.type]}
                            </span>
                          </small>
                        </td>
                        <td>{priceLabel(item)}</td>
                        <td>
                          {item.soldCount}/{item.stockLimit ?? '∞'}
                        </td>
                        <td className="adm-actions-cell">
                          <button type="button" className="adm-btn adm-btn--sm" onClick={() => openEdit(item)}>
                            <Pencil size={13} aria-hidden /> Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn--danger adm-btn--sm"
                            onClick={() => void onDelete(item.id)}
                          >
                            <Trash2 size={13} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {!sorted.length ? (
            <div className="adm-table-card">
              <p className="adm-table-empty">
                <ImageIcon size={18} aria-hidden /> No items yet
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <AdminModal
        open={editItem != null}
        onOpenChange={(open) => {
          if (!open) setEditItem(null)
        }}
        title={editItem ? `Edit · ${editItem.name}` : 'Edit item'}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setEditItem(null)}>
              Cancel
            </button>
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => void saveEdit()}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        {editItem ? (
          <div className="adm-form">
            <div className="adm-edit-preview-row">
              <div className="adm-shop-thumb adm-shop-thumb--lg">
                <ItemThumb item={editItem} />
              </div>
              <label className="adm-upload-btn adm-upload-btn--block">
                <Upload size={14} aria-hidden /> Replace image
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                />
              </label>
            </div>
            <label>
              Name
              <AdminTextInput
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <div className="adm-form-grid">
              <label>
                Stock
                <AdminNumberInput
                  min={0}
                  placeholder="∞"
                  value={editForm.stockLimit}
                  onChange={(v) => setEditForm((f) => ({ ...f, stockLimit: v }))}
                  showSteppers={false}
                />
              </label>
              <label className="adm-check-inline adm-check-inline--top">
                <input
                  type="checkbox"
                  checked={editForm.isFree}
                  onChange={(e) => setEditForm((f) => ({ ...f, isFree: e.target.checked }))}
                />
                Free
              </label>
            </div>
            {!editForm.isFree ? (
              <div className="adm-form-grid">
                <label>
                  Price
                  <AdminNumberInput
                    min={0}
                    value={editForm.price}
                    onChange={(v) => setEditForm((f) => ({ ...f, price: Number(v) || 0 }))}
                  />
                </label>
                <label>
                  Discount %
                  <AdminNumberInput
                    min={0}
                    max={100}
                    disabled={!editForm.useDiscount}
                    value={editForm.discountPercent}
                    onChange={(v) => setEditForm((f) => ({ ...f, discountPercent: Number(v) || 0 }))}
                  />
                </label>
              </div>
            ) : null}
            <label className="adm-check-inline">
              <input
                type="checkbox"
                checked={editForm.useDiscount}
                disabled={editForm.isFree}
                onChange={(e) => setEditForm((f) => ({ ...f, useDiscount: e.target.checked }))}
              />
              Use discount
            </label>
            <div className="adm-check-row">
              <label>
                Event folder
                <AdminSelect
                  value={editForm.eventId}
                  onValueChange={(eventId) =>
                    setEditForm((f) => ({
                      ...f,
                      eventId,
                      isEvent: eventId !== NO_EVENT ? true : f.isEvent,
                    }))
                  }
                  options={eventOptions}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editForm.enabled}
                  onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                Live in shop
              </label>
            </div>
            {editForm.eventId !== NO_EVENT ? (
              <p className="adm-muted">{eventTitle(eventIdFromFormValue(editForm.eventId))}</p>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={editEvent != null}
        onOpenChange={(open) => {
          if (!open) setEditEvent(null)
        }}
        title={editEvent ? `Edit event · ${editEvent.title}` : 'Edit event'}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setEditEvent(null)}>
              Cancel
            </button>
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => void saveEditEvent()}>
              {busy ? 'Saving…' : 'Save event'}
            </button>
          </>
        }
      >
        {editEvent ? (
          <div className="adm-form">
            <label>
              Title
              <AdminTextInput
                value={editEventForm.title}
                onChange={(e) => setEditEventForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label>
              Slug
              <AdminTextInput
                value={editEventForm.slug}
                onChange={(e) => setEditEventForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                rows={2}
                value={editEventForm.description}
                onChange={(e) => setEditEventForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <div className="adm-form-grid">
              <label>
                Starts
                <AdminTextInput
                  type="datetime-local"
                  value={editEventForm.startsAt}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </label>
              <label>
                Ends
                <AdminTextInput
                  type="datetime-local"
                  value={editEventForm.endsAt}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </label>
            </div>
            <label className="adm-check-inline">
              <input
                type="checkbox"
                checked={editEventForm.enabled}
                onChange={(e) => setEditEventForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              Enabled
            </label>
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
