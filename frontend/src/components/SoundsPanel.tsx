import { useEffect, useState } from 'react'
import { SOUNDS, SOUND_CATEGORIES, getSound } from '../data/catalog'
import { audioEngine } from '../lib/howlerAudio'
import { useFlocusStore } from '../store/useFlocusStore'
import '../styles/settings-controls.css'

const RESET_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 40" aria-hidden>
    <path
      d="M30.32 20.03v.54c0 3.3-1.19 6.09-3.59 8.4-2.4 2.31-5.3 3.46-8.73 3.46s-6.33-1.15-8.73-3.46c-2.4-2.31-3.59-5.1-3.59-8.4 0-3.31 1.16-6.1 3.49-8.41 2.24-2.22 4.98-3.37 8.25-3.45l-2.56 2.47 2.54 2.51 7.1-6.84L17.4 0l-2.55 2.46 2.79 2.69c-4.05.35-7.48 1.95-10.28 4.8-2.89 2.95-4.34 6.48-4.34 10.58 0 4.1 1.45 7.63 4.34 10.58 2.89 2.95 6.4 4.42 10.53 4.42s7.64-1.47 10.53-4.42c2.89-2.95 4.34-6.48 4.34-10.58v-.54h-4.46z"
      fill="#fff"
      fillRule="evenodd"
    />
  </svg>
)

export function SoundsPanel() {
  const layers = useFlocusStore((s) => s.soundLayers)
  const setLayers = useFlocusStore((s) => s.setSoundLayers)
  const [cat, setCat] = useState<string>('all')
  const [anyPlaying, setAnyPlaying] = useState(false)

  const maxLayers = 5

  useEffect(() => {
    layers.forEach((l) => {
      if (!audioEngine.isPlaying(l.soundId)) {
        audioEngine.playSound(l.soundId, l.volume)
      }
    })
    const activeIds = new Set(layers.map((l) => l.soundId))
    audioEngine.getActiveSoundIds().forEach((id) => {
      if (!activeIds.has(id)) audioEngine.stopSound(id)
    })
    if (!layers.length) audioEngine.stopAll()
    setAnyPlaying(layers.some((l) => audioEngine.isPlaying(l.soundId)))
  }, [layers])

  useEffect(() => {
    const host = document.querySelector('flocus-sounds.show')
    if (!host) return
    if (layers.length >= maxLayers) {
      host.classList.add('max-count')
    } else {
      host.classList.remove('max-count')
    }
  }, [layers.length, maxLayers])

  const toggleSound = (soundId: string) => {
    const def = getSound(soundId)
    if (!def) return

    const exists = layers.find((l) => l.soundId === soundId)
    if (exists) {
      audioEngine.stopSound(soundId)
      setLayers(layers.filter((l) => l.soundId !== soundId))
      return
    }

    if (layers.length >= maxLayers) return

    setLayers([...layers, { soundId, volume: 0.5 }])
  }

  const setVol = (soundId: string, volume: number) => {
    setLayers(layers.map((l) => (l.soundId === soundId ? { ...l, volume } : l)))
    audioEngine.setVolume(soundId, volume)
  }

  const togglePlay = () => {
    if (anyPlaying) {
      audioEngine.stopAll()
      setAnyPlaying(false)
      return
    }
    layers.forEach((l) => audioEngine.playSound(l.soundId, l.volume))
    setAnyPlaying(layers.length > 0)
  }

  const resetSounds = () => {
    if (!layers.length) return
    if (!window.confirm('Clear all of your sounds?')) return
    setLayers([])
    audioEngine.stopAll()
    setAnyPlaying(false)
  }

  const filtered = SOUNDS.filter((s) => cat === 'all' || s.category === cat)
  const hasBundledSounds = SOUNDS.length > 0
  const wrapperClassName = `soundscapes-wrapper${hasBundledSounds ? '' : ' soundscapes-wrapper--empty'}`
  const bodyClassName = `tab-pane fade active show sounds-body${hasBundledSounds ? '' : ' sounds-body--empty'}`

  return (
    <div className={wrapperClassName}>
      <header className="sounds-header">
        <div>
          <p className="music-section-label">
            Sounds
          </p>
          <p className="text-secondary">
            {hasBundledSounds ? 'Mix & match ambient layers — up to 5 at once' : 'Open-source safe build'}
          </p>
        </div>
        {hasBundledSounds ? (
          <>
            <button
              type="button"
              className={`play-button${anyPlaying ? ' paused' : ''}`}
              onClick={togglePlay}
              aria-label={anyPlaying ? 'Pause sounds' : 'Play sounds'}
              title={anyPlaying ? 'Pause' : 'Play'}
            />
            <button type="button" className="reset-button" onClick={resetSounds} title="Clear all sounds">
              {RESET_SVG}
            </button>
            <select
              className="form-select sounds-category-select"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              aria-label="Sound category"
            >
              {SOUND_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </header>

      <div className="tab-content" id="nav-main">
        {hasBundledSounds ? (
          <div
            className={bodyClassName}
            id="nav-sounds"
            role="tabpanel"
            aria-label="Ambient sounds"
          >
            {filtered.map((s) => {
              const active = layers.some((l) => l.soundId === s.id)
              const layer = layers.find((l) => l.soundId === s.id)
              return (
                <div
                  key={s.id}
                  className="sound"
                  data-sound={s.id}
                  data-active={active ? 'true' : 'false'}
                  data-types={s.category}
                >
                  <button
                    type="button"
                    onClick={() => toggleSound(s.id)}
                    title={s.name}
                  >
                    <span className="emoji">{s.emoji}</span>
                    <span className="name">{s.name}</span>
                  </button>
                  <input
                    type="range"
                    name={s.id}
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer?.volume ?? 0.5}
                    onChange={(e) => setVol(s.id, Number(e.target.value))}
                    aria-label={`${s.name} volume`}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className={bodyClassName}
            role="status"
            aria-live="polite"
          >
            <div className="glass-surface sounds-empty-card">
              <strong>No bundled audio pack</strong>
              <p className="text-secondary">
                This repository does <em>not</em> ship copyrighted ambient tracks, sound packs, or embedded music sources — your deployment stays fully compliant with open-source licenses.
              </p>
            </div>
            <div className="glass-surface sounds-empty-card">
              <strong>Bring your own sounds</strong>
              <p className="text-secondary">
                Add entries to <code>frontend/src/data/catalog.ts</code> and drop your audio files into <code>frontend/public/sounds/</code> (or point <code>url</code> / <code>file</code> fields at any private, self-hosted location).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
