import type { CustomPlaylist } from '../types'

/**
 * Parse an arbitrary playlist / video URL and tag it with the streaming service.
 * Returns `null` if the input is empty or the URL is recognised as YouTube but
 * doesn't contain a valid 11-character video id (so callers can show an error).
 */
export function parsePlaylistUrl(url: string): Omit<CustomPlaylist, 'id' | 'name'> | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const spotifyPlaylist = trimmed.match(
    /open\.spotify\.com\/(?:embed\/)?playlist\/([a-zA-Z0-9]+)/,
  )
  if (spotifyPlaylist) {
    return { url: trimmed, service: 'spotify' }
  }

  const spotifyTrack = trimmed.match(/open\.spotify\.com\/(?:embed\/)?track\/([a-zA-Z0-9]+)/)
  if (spotifyTrack) {
    return { url: trimmed, service: 'spotify' }
  }

  if (isYouTubeUrl(trimmed)) {
    // Only accept the URL if we can extract a video id — otherwise the embed
    // would silently render an empty player.
    return extractYouTubeId(trimmed)
      ? { url: trimmed, service: 'youtube' }
      : null
  }

  if (/music\.apple\.com/.test(trimmed)) {
    return { url: trimmed, service: 'apple' }
  }

  if (/soundcloud\.com/.test(trimmed)) {
    return { url: trimmed, service: 'soundcloud' }
  }

  return { url: trimmed, service: 'other' }
}

export function spotifyEmbedSrc(url: string, spotifyId?: string): string | null {
  if (spotifyId) {
    return `https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`
  }
  const m = url.match(/playlist\/([a-zA-Z0-9]+)/)
  if (m) return `https://open.spotify.com/embed/playlist/${m[1]}?utm_source=generator&theme=0`
  const track = url.match(/track\/([a-zA-Z0-9]+)/)
  if (track) return `https://open.spotify.com/embed/track/${track[1]}?utm_source=generator&theme=0`
  return null
}

/** Quick host check — accepts youtu.be, youtube.com (any subdomain), youtube-nocookie.com. */
export function isYouTubeUrl(url: string): boolean {
  return /(?:^|\/\/|\.)(?:youtube(?:-nocookie)?\.com|youtu\.be)\//i.test(url.trim())
}

/**
 * Extract the 11-character YouTube video id from any of these formats:
 *   https://www.youtube.com/watch?v=ID&t=10s
 *   https://youtu.be/ID
 *   https://youtu.be/ID?si=...
 *   https://m.youtube.com/watch?v=ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/live/ID
 *   https://www.youtube.com/v/ID
 *   https://www.youtube-nocookie.com/embed/ID
 *   Or just the raw 11-char id pasted on its own.
 */
export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  // 1. Raw 11-char id (only when there's nothing else)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  // 2. Standard / embed / shorts / live / v paths on any youtube host
  const pathMatch = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  if (pathMatch) return pathMatch[1]

  // 3. URL with the id buried somewhere in the query string (?vi=, &vi=)
  const queryMatch = trimmed.match(/[?&](?:v|vi)=([a-zA-Z0-9_-]{11})/)
  if (queryMatch) return queryMatch[1]

  return null
}
