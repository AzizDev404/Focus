import { useMemo, useState } from 'react'
import YouTube from 'react-youtube'
import { CURATED_PLAYLISTS } from '../data/catalog'
import {
  extractYouTubeId,
  parsePlaylistUrl,
  spotifyEmbedSrc,
} from '../lib/playlistUtils'
import { useFlocusStore } from '../store/useFlocusStore'

export function MusicPanel({ variant = 'music' }: { variant?: 'music' | 'library' }) {
  const activePlaylist = useFlocusStore((s) => s.activePlaylist)
  const customPlaylists = useFlocusStore((s) => s.customPlaylists)
  const musicVolume = useFlocusStore((s) => s.musicVolume)
  const [url, setUrl] = useState('')

  const setActive = (id: string | null) =>
    useFlocusStore.setState({ activePlaylist: id })

  const addCustom = () => {
    if (!url.trim()) return
    const parsed = parsePlaylistUrl(url)
    if (!parsed) return
    useFlocusStore.setState({
      customPlaylists: [
        ...customPlaylists,
        {
          id: crypto.randomUUID(),
          name: 'Custom playlist',
          ...parsed,
        },
      ],
    })
    setUrl('')
  }

  const embed = useMemo(() => {
    if (!activePlaylist) return null
    const curated = CURATED_PLAYLISTS.find((p) => p.id === activePlaylist)
    if (curated) {
      return {
        type: 'spotify' as const,
        src: spotifyEmbedSrc('', curated.spotifyId)!,
      }
    }
    const custom = customPlaylists.find((p) => p.id === activePlaylist)
    if (!custom) return null
    if (custom.service === 'spotify') {
      const src = spotifyEmbedSrc(custom.url)
      return src ? { type: 'spotify' as const, src } : null
    }
    if (custom.service === 'youtube') {
      const id = extractYouTubeId(custom.url)
      return id ? { type: 'youtube' as const, id } : null
    }
    return null
  }, [activePlaylist, customPlaylists])

  const playlists = variant === 'library' ? CURATED_PLAYLISTS : [...CURATED_PLAYLISTS]

  return (
    <div className="music-panel-body">
      {variant === 'music' && (
        <>
          <p className="music-section-label">Custom playlists</p>
          <div className="flex gap-2 mb-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Spotify or YouTube URL"
              className="input-flocus flex-1 text-xs"
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={addCustom}>
              Add
            </button>
          </div>
          {customPlaylists.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(activePlaylist === p.id ? null : p.id)}
              className={`music-row ${activePlaylist === p.id ? 'active' : ''}`}
            >
              🎵 {p.name}
            </button>
          ))}
        </>
      )}

      <p className="music-section-label">{variant === 'library' ? 'Playlist Library' : 'Playlists'}</p>
      <div className="music-list">
        {playlists.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(activePlaylist === p.id ? null : p.id)}
            className={`music-row ${activePlaylist === p.id ? 'active' : ''}`}
          >
            <span className="music-emoji">{p.emoji}</span>
            <span>
              <strong>{p.name}</strong>
              <br />
              <small>{p.description}</small>
            </span>
          </button>
        ))}
      </div>

      {embed && (
        <div className="music-embed mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-secondary" style={{ fontSize: 10 }}>
              Now playing
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) =>
                useFlocusStore.setState({ musicVolume: Number(e.target.value) })
              }
              className="flocus-range w-24"
            />
          </div>
          {embed.type === 'spotify' ? (
            <iframe
              title="Spotify"
              src={embed.src}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded"
            />
          ) : (
            <YouTube
              videoId={embed.id}
              opts={{
                height: '152',
                width: '100%',
                playerVars: { autoplay: 1, controls: 1, modestbranding: 1 },
              }}
              className="overflow-hidden rounded"
            />
          )}
        </div>
      )}
    </div>
  )
}
