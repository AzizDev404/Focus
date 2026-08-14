import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { THEMES } from '../../data/catalog'
import type { DashboardMode } from '../../types'
import { useFlocusStore } from '../../store/useFlocusStore'
import { SettingsHeader, SettingsGroup, SettingsSection, SettingsInputGroup } from './settingsForm'
import { SettingsSelect } from './SettingsSelect'

const THEME_TYPES = ['All', 'World', 'Gradient', 'Solid Color', 'Animated'] as const
const THEME_ENV = ['All', 'Scenic', 'Urban', 'Nature', 'Interior', 'Abstract'] as const
const THEME_COLOR = ['All', 'Blue', 'Green', 'Pink', 'Purple', 'Orange/Yellow', 'Monochrome'] as const

const MIN_SCALE = 1
const MAX_SCALE = 3

const MODE_META: Record<
  DashboardMode,
  { paneId: string; title: string; subtitle: string; settingKey: 'themeHome' | 'themeFocus' }
> = {
  home: {
    paneId: 'settModal-homeTheme',
    title: 'Home Theme',
    subtitle: 'Pick your theme for Home. Switch to this mode to preview live.',
    settingKey: 'themeHome',
  },
  focus: {
    paneId: 'settModal-focusTheme',
    title: 'Focus Theme',
    subtitle: 'Pick your theme for Focus Mode. Switch to this mode to preview live.',
    settingKey: 'themeFocus',
  },
}

export function ThemeTabContent({ mode }: { mode: DashboardMode }) {
  const settings = useFlocusStore((s) => s.settings)
  const setSettings = useFlocusStore((s) => s.setSettings)
  const meta = MODE_META[mode]

  const [typeFilter, setTypeFilter] = useState('All')
  const [envFilter, setEnvFilter] = useState('All')
  const [colorFilter, setColorFilter] = useState('All')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const filteredThemes = useMemo(() => {
    return THEMES.filter((t) => {
      if (typeFilter !== 'All') {
        const typeMap: Record<string, string> = {
          World: 'world',
          Gradient: 'gradient',
          'Solid Color': 'solid',
          Animated: 'animated',
        }
        if (t.type !== typeMap[typeFilter]) return false
      }
      if (envFilter !== 'All' && t.environment?.toLowerCase() !== envFilter.toLowerCase()) return false
      if (colorFilter !== 'All' && !(t.color ?? t.name).toLowerCase().includes(colorFilter.split('/')[0].toLowerCase()))
        return false
      return true
    })
  }, [typeFilter, envFilter, colorFilter])

  const selectedId = settings[meta.settingKey]
  const custom = settings.customThemes[mode]
  const overlayPct = custom?.opacity ?? 35
  const scale = custom?.scale ?? 1
  const posX = custom?.posX ?? 50
  const posY = custom?.posY ?? 50

  const applyTheme = (themeId: string) => {
    setSettings({ [meta.settingKey]: themeId })
    useFlocusStore.getState().setMode(mode)
  }

  const updateCustom = (
    patch: Partial<{ dataUrl: string; opacity: number; kind?: 'image' | 'video'; scale: number; posX: number; posY: number }>,
  ) => {
    const existing = settings.customThemes[mode]
    if (!existing && !patch.dataUrl) return
    setSettings({
      customThemes: {
        ...settings.customThemes,
        [mode]: {
          dataUrl: patch.dataUrl ?? existing!.dataUrl,
          opacity: patch.opacity ?? existing?.opacity ?? 35,
          kind: patch.kind ?? existing?.kind ?? 'image',
          scale: patch.scale ?? existing?.scale ?? 1,
          posX: patch.posX ?? existing?.posX ?? 50,
          posY: patch.posY ?? existing?.posY ?? 50,
        },
      },
    })
  }

  const uploadTheme = (file: File) => {
    setUploadError(null)
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      setUploadError('Please choose an image file (JPG, PNG, WEBP).')
      return
    }
    if (isVideo) {
      setUploadError('Video uploads are disabled. Ask an administrator to add videos.')
      return
    }
    // no size limit enforced by app; browser or server may impose limits

    const existing = settings.customThemes[mode]
    if (existing?.kind === 'video' && existing.dataUrl?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(existing.dataUrl)
      } catch {
        /* ignore */
      }
    }

    const reader = new FileReader()
    reader.onload = () => {
      updateCustom({
        dataUrl: reader.result as string,
        kind: 'image',
        scale: 1,
        posX: 50,
        posY: 50,
      })
    }
    reader.onerror = () => setUploadError('Could not read that file. Try a different file.')
    reader.readAsDataURL(file)
  }

  const removeUpload = () => {
    const next = { ...settings.customThemes }
    const existing = next[mode]
    if (existing?.kind === 'video' && existing.dataUrl?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(existing.dataUrl)
      } catch {
        /* ignore */
      }
    }
    delete next[mode]
    setSettings({ customThemes: next })
    if (settings[meta.settingKey] === 'custom') {
      setSettings({ [meta.settingKey]: 'black' })
      useFlocusStore.getState().setMode(mode)
    }
  }

  const openPicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const f = input.files?.[0]
      if (f) uploadTheme(f)
    }
    input.click()
  }

  // ----- Drag-to-pan ----------------------------------------------------
  const previewRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const onPreviewPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!custom || scale <= 1) return
    const node = previewRef.current
    if (!node) return
    node.setPointerCapture(e.pointerId)
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: posX,
      baseY: posY,
    }
    setIsDragging(true)
  }

  const onPreviewPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = dragState.current
    const node = previewRef.current
    if (!s || !node) return
    const rect = node.getBoundingClientRect()
    // Convert pixel delta to percentage of the visible area, scaled to how far the
    // image can travel at this zoom. At scale=1 movement is 0, at scale=2 a full
    // sweep across the preview equals one half of the image.
    const range = Math.max(1, (scale - 1)) * 100
    const dxPct = (-(e.clientX - s.startX) / rect.width) * range
    const dyPct = (-(e.clientY - s.startY) / rect.height) * range
    const nx = clamp(s.baseX + dxPct, 0, 100)
    const ny = clamp(s.baseY + dyPct, 0, 100)
    updateCustom({ posX: nx, posY: ny })
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return
    previewRef.current?.releasePointerCapture(e.pointerId)
    dragState.current = null
    setIsDragging(false)
  }

  const resetCrop = () => updateCustom({ scale: 1, posX: 50, posY: 50 })

  const applyUpload = () => {
    setSettings({ [meta.settingKey]: 'custom' })
    useFlocusStore.getState().setMode(mode)
  }

  return (
    <div
      id={meta.paneId}
      className="tab-pane fade show active"
      role="tabpanel"
      data-widget={`${mode}Theme`}
      aria-labelledby={`settModal-${mode}Theme-tab`}
    >
      <SettingsHeader title={meta.title} subtitle={meta.subtitle} />

      <SettingsGroup>
        <SettingsSection
          title="Custom Background"
          description="Upload your own image, then zoom & drag to frame the perfect crop."
          className="theme-upload-section"
        >
          {!custom ? (
            <div
              className="theme-upload-drop"
              data-mode={mode}
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openPicker()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('is-dragging')
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('is-dragging')}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('is-dragging')
                const f = e.dataTransfer.files[0]
                if (f) uploadTheme(f)
              }}
            >
              <div className="theme-upload-drop-inner">
                <div className="theme-upload-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="theme-upload-title">Drop your image here</p>
                <p className="theme-upload-sub">
                  or <span>browse files</span>
                </p>
                  <span className="theme-upload-hint">JPG, PNG, WEBP</span>
              </div>
            </div>
          ) : (
            <div className="theme-upload-editor">
              <div
                ref={previewRef}
                className={`crop-preview${isDragging ? ' is-dragging' : ''}${scale > 1 ? ' is-pannable' : ''}`}
                style={{ ['--custom-bg-overlay' as string]: overlayPct / 100 } as CSSProperties}
                onPointerDown={onPreviewPointerDown}
                onPointerMove={onPreviewPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {custom.kind === 'video' ? (
                  <video
                    src={custom.dataUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    draggable={false}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${posX}% ${posY}%`,
                    }}
                  />
                ) : (
                  <img
                    src={custom.dataUrl}
                    alt=""
                    draggable={false}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${posX}% ${posY}%`,
                    }}
                  />
                )}
                <div className="crop-overlay" aria-hidden="true" />
                {scale > 1 ? (
                  <span className="crop-hint" aria-hidden="true">
                    Drag to reposition
                  </span>
                ) : null}
              </div>

              <div className="crop-controls">
                <div className="range-row">
                  <label htmlFor={`${mode}-zoom`}>Zoom</label>
                  <input
                    id={`${mode}-zoom`}
                    type="range"
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={0.05}
                    value={scale}
                    onChange={(e) => updateCustom({ scale: Number(e.target.value) })}
                  />
                  <span className="range-value">{scale.toFixed(2)}×</span>
                </div>

                <div className="range-row">
                  <label htmlFor={`${mode}-posx`}>Horizontal</label>
                  <input
                    id={`${mode}-posx`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={posX}
                    onChange={(e) => updateCustom({ posX: Number(e.target.value) })}
                  />
                  <span className="range-value">{Math.round(posX)}%</span>
                </div>

                <div className="range-row">
                  <label htmlFor={`${mode}-posy`}>Vertical</label>
                  <input
                    id={`${mode}-posy`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={posY}
                    onChange={(e) => updateCustom({ posY: Number(e.target.value) })}
                  />
                  <span className="range-value">{Math.round(posY)}%</span>
                </div>

                <div className="range-row">
                  <label htmlFor={`${mode}-overlay`}>Overlay</label>
                  <input
                    id={`${mode}-overlay`}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={overlayPct}
                    onChange={(e) => updateCustom({ opacity: Number(e.target.value) })}
                  />
                  <span className="range-value">{overlayPct}%</span>
                </div>
              </div>

              <div className="theme-upload-actions">
                <button type="button" className="btn btn-primary" onClick={applyUpload}>
                  Apply background
                </button>
                <button type="button" className="icon-btn" onClick={openPicker} aria-label="Replace image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </button>
                <button type="button" className="icon-btn" onClick={resetCrop} aria-label="Reset crop">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </button>
                <button type="button" className="icon-btn btn-danger" onClick={removeUpload} aria-label="Remove image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          )}

          {uploadError ? (
            <p className="theme-upload-error" role="alert">
              {uploadError}
            </p>
          ) : null}
        </SettingsSection>
      </SettingsGroup>

      <SettingsGroup className="theme-holder">
        <h4 className="title">Theme Library</h4>
        <div className="row filters">
          <div className="col-12 col-sm-6 col-xl">
            <SettingsInputGroup label="Type" htmlFor={`${mode}-filter-type`}>
              <SettingsSelect
                id={`${mode}-filter-type`}
                className="theme-filter-select"
                value={typeFilter}
                onValueChange={setTypeFilter}
                options={THEME_TYPES.map((o) => ({ value: o, label: o }))}
                aria-label="Filter by type"
              />
            </SettingsInputGroup>
          </div>
          <div className="col-12 col-sm-6 col-xl">
            <SettingsInputGroup label="Environment" htmlFor={`${mode}-filter-env`}>
              <SettingsSelect
                id={`${mode}-filter-env`}
                className="theme-filter-select"
                value={envFilter}
                onValueChange={setEnvFilter}
                options={THEME_ENV.map((o) => ({ value: o, label: o }))}
                aria-label="Filter by environment"
              />
            </SettingsInputGroup>
          </div>
          <div className="col-12 col-sm-6 col-xl">
            <SettingsInputGroup label="Color" htmlFor={`${mode}-filter-color`}>
              <SettingsSelect
                id={`${mode}-filter-color`}
                className="theme-filter-select"
                value={colorFilter}
                onValueChange={setColorFilter}
                options={THEME_COLOR.map((o) => ({ value: o, label: o }))}
                aria-label="Filter by color"
              />
            </SettingsInputGroup>
          </div>
        </div>
        <div className="theme-group">
          {filteredThemes.map((t) => {
            const bg = t.gradient ?? (t.image ? `url(${t.image}) center/cover` : '#333')
            const active = selectedId === t.id
            return (
              <label key={t.id} className={`theme form-check-label ${active ? 'active' : ''}`}>
                <input
                  type="radio"
                  className="visually-hidden"
                  name={`${mode}Theme`}
                  checked={active}
                  onChange={() => applyTheme(t.id)}
                />
                <span className="theme-thumb" style={{ background: bg }} />
                <span>{t.name}</span>
              </label>
            )
          })}
        </div>
      </SettingsGroup>
    </div>
  )
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}
