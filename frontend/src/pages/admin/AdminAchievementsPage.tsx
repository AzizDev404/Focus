import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Pencil, Trash2, Trophy, Upload } from '../../components/icons'
import { AdminModal } from '../../components/admin/ui/AdminSheet'
import { AdminNumberInput } from '../../components/admin/ui/AdminNumberInput'
import { AdminSelect } from '../../components/admin/ui/AdminSelect'
import { AdminTextInput } from '../../components/admin/ui/AdminTextInput'
import { achievementImageUrl } from '../../lib/achievementAssets'
import {
  ApiError,
  createAchievementWithImage,
  createAdminAchievement,
  deleteAdminAchievement,
  fetchAdminAchievements,
  updateAdminAchievement,
  uploadAchievementImage,
  type AchievementDefinition,
} from '../../lib/adminApi'

const TRIGGER_OPTIONS = [
  { value: 'register', label: 'Register (auto on signup)' },
  { value: 'sessions', label: 'Focus sessions' },
  { value: 'focusMinutes', label: 'Focus minutes' },
  { value: 'tasks', label: 'Tasks completed' },
  { value: 'level', label: 'Reach level' },
]

function emptyForm() {
  return {
    id: '',
    title: '',
    description: '',
    icon: '✨',
    coinReward: 50,
    xpReward: 25,
    trigger: 'sessions',
    target: 1,
    enabled: true,
    image: null as File | null,
    imagePreview: '',
  }
}

function AchThumb({ item }: { item: AchievementDefinition }) {
  const src = achievementImageUrl(item.imageUrl)
  if (src) return <img src={src} alt="" className="adm-ach-thumb" />
  return <span className="adm-ach-thumb adm-ach-thumb--emoji">{item.icon}</span>
}

type Props = { token: string }

export function AdminAchievementsPage({ token }: Props) {
  const [items, setItems] = useState<AchievementDefinition[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editItem, setEditItem] = useState<AchievementDefinition | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    icon: '✨',
    coinReward: 0,
    xpReward: 0,
    trigger: 'sessions',
    target: 1,
    enabled: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setItems(await fetchAdminAchievements(token))
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
    if (!form.id.trim() || !form.title.trim()) {
      setError('ID and title are required.')
      return
    }
    if (!form.image) {
      setError('Upload a chibi / badge image (JPG, PNG or WEBP).')
      return
    }
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await createAchievementWithImage(form, token)
      setForm(emptyForm())
      if (fileRef.current) fileRef.current.value = ''
      setSuccess('Achievement created.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (item: AchievementDefinition) => {
    setEditItem(item)
    setEditForm({
      title: item.title,
      description: item.description,
      icon: item.icon,
      coinReward: item.coinReward,
      xpReward: item.xpReward,
      trigger: item.trigger,
      target: item.target,
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
      await updateAdminAchievement(editItem.id, editForm, token)
      setEditItem(null)
      setSuccess('Achievement updated.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const onUploadEditImage = async (file: File | null) => {
    if (!editItem || !file) return
    setBusy(true)
    setError('')
    try {
      await uploadAchievementImage(editItem.id, file, token)
      const fresh = await fetchAdminAchievements(token)
      setItems(fresh)
      setEditItem(fresh.find((i) => i.id === editItem.id) ?? null)
      setSuccess('Image updated.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (editFileRef.current) editFileRef.current.value = ''
    }
  }

  const onDelete = async (item: AchievementDefinition) => {
    if (!window.confirm(`Delete "${item.title}"? Users keep unlock history.`)) return
    setBusy(true)
    setError('')
    try {
      await deleteAdminAchievement(item.id, token)
      setSuccess('Achievement deleted.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const createWithoutImage = async () => {
    if (!form.id.trim() || !form.title.trim()) {
      setError('ID and title are required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await createAdminAchievement(
        {
          id: form.id.trim().toLowerCase(),
          title: form.title,
          description: form.description,
          icon: form.icon,
          coinReward: form.coinReward,
          xpReward: form.xpReward,
          trigger: form.trigger,
          target: form.target,
          enabled: form.enabled,
        },
        token,
      )
      setForm(emptyForm())
      setSuccess('Achievement created (no image yet — upload in edit).')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <p className="adm-eyebrow">Gamification</p>
          <h1>Achievements</h1>
          <p className="adm-muted">Create badges with custom chibi images. JPG, PNG or WEBP up to 5MB.</p>
        </div>
      </header>

      {error ? <p className="adm-banner adm-banner--error">{error}</p> : null}
      {success ? <p className="adm-banner adm-banner--ok">{success}</p> : null}

      <div className="adm-mag-layout">
        <form className="adm-card adm-form adm-mag-create" onSubmit={onCreate}>
          <h2>New achievement</h2>
            <label>
              ID (slug)
              <AdminTextInput
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase() }))}
                placeholder="moon_walker"
                pattern="[a-z][a-z0-9_]*"
                required
              />
            </label>
            <label>
              Title
              <AdminTextInput
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Description
              <AdminTextInput
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <div className="adm-form-row">
              <label>
                Trigger
                <AdminSelect
                  value={form.trigger}
                  onValueChange={(trigger) => setForm((f) => ({ ...f, trigger }))}
                  options={TRIGGER_OPTIONS}
                />
              </label>
              <label>
                Target
                <AdminNumberInput
                  min={1}
                  value={form.target}
                  onChange={(v) => setForm((f) => ({ ...f, target: Number(v) }))}
                />
              </label>
            </div>
            <div className="adm-form-row">
              <label>
                Coins
                <AdminNumberInput
                  min={0}
                  value={form.coinReward}
                  onChange={(v) => setForm((f) => ({ ...f, coinReward: Number(v) }))}
                />
              </label>
              <label>
                XP
                <AdminNumberInput
                  min={0}
                  value={form.xpReward}
                  onChange={(v) => setForm((f) => ({ ...f, xpReward: Number(v) }))}
                />
              </label>
            </div>
            <label>
              Image
              <div className="adm-upload-row">
                <button
                  type="button"
                  className="adm-btn adm-btn--ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} aria-hidden /> Choose image
                </button>
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="" className="adm-ach-preview" />
                ) : (
                  <span className="adm-muted">Required</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="adm-form-actions">
              <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
                Create with image
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                disabled={busy}
                onClick={() => void createWithoutImage()}
              >
                Create without image
              </button>
            </div>
        </form>

        <section className="adm-card">
          <h2>All achievements ({items.length})</h2>
          <ul className="adm-ach-list">
            {items.map((item) => (
              <li key={item.id} className={`adm-ach-row${item.enabled ? '' : ' is-disabled'}`}>
                <AchThumb item={item} />
                <div className="adm-ach-row-main">
                  <strong>{item.title}</strong>
                  <small>
                    {item.id} · {item.trigger} · target {item.target} · +{item.coinReward} coins · +{item.xpReward} XP
                  </small>
                </div>
                <div className="adm-ach-row-actions">
                  <button type="button" className="adm-icon-btn" onClick={() => openEdit(item)} aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn adm-icon-btn--danger"
                    onClick={() => void onDelete(item)}
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
            {!items.length ? (
              <li className="adm-muted adm-ach-empty">
                <Trophy size={18} aria-hidden /> No achievements yet.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <AdminModal open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)} title="Edit achievement">
        {editItem ? (
          <div className="adm-form">
            <p className="adm-muted">ID: {editItem.id}</p>
            <div className="adm-upload-row">
              <AchThumb item={editItem} />
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                onClick={() => editFileRef.current?.click()}
                disabled={busy}
              >
                <ImageIcon size={14} aria-hidden /> Replace image
              </button>
              <input
                ref={editFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onUploadEditImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <label>
              Title
              <AdminTextInput
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label>
              Description
              <AdminTextInput
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <div className="adm-form-row">
              <label>
                Trigger
                <AdminSelect
                  value={editForm.trigger}
                  onValueChange={(trigger) => setEditForm((f) => ({ ...f, trigger }))}
                  options={TRIGGER_OPTIONS}
                />
              </label>
              <label>
                Target
                <AdminNumberInput
                  min={1}
                  value={editForm.target}
                  onChange={(v) => setEditForm((f) => ({ ...f, target: Number(v) }))}
                />
              </label>
            </div>
            <div className="adm-form-row">
              <label>
                Coins
                <AdminNumberInput
                  min={0}
                  value={editForm.coinReward}
                  onChange={(v) => setEditForm((f) => ({ ...f, coinReward: Number(v) }))}
                />
              </label>
              <label>
                XP
                <AdminNumberInput
                  min={0}
                  value={editForm.xpReward}
                  onChange={(v) => setEditForm((f) => ({ ...f, xpReward: Number(v) }))}
                />
              </label>
            </div>
            <label className="adm-check">
              <input
                type="checkbox"
                checked={editForm.enabled}
                onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              Enabled (visible to players)
            </label>
            <div className="adm-form-actions">
              <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => void saveEdit()}>
                Save changes
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
