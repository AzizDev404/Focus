import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatSticker } from '../../lib/chatStickers'
import type { ShopItem } from '../../lib/auth/types'
import { fetchDmMessages, sendDmMessage, type DmMessage } from '../../lib/socialApi'
import { SocialDmEditor } from './SocialDmEditor'
import '../../styles/social-chat.css'

type Props = {
  peerId: number
  peerName: string
  stickerItems: ChatSticker[]
  shopStickers?: ShopItem[]
  onBack?: () => void
  /** Hide duplicate header when parent provides toolbar */
  embedded?: boolean
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'now'
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

export function DmChatPanel({
  peerId,
  peerName,
  stickerItems,
  shopStickers = [],
  embedded = false,
}: Props) {
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const lastIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(
    async (initial = false) => {
      try {
        const data = await fetchDmMessages(peerId, {
          limit: 80,
          since: initial ? 0 : lastIdRef.current,
        })
        if (!data.messages.length) {
          if (initial) setLoading(false)
          return
        }
        setMessages((prev) => {
          const merged = initial ? data.messages : [...prev, ...data.messages]
          const trimmed = merged.slice(-200)
          const last = trimmed[trimmed.length - 1]
          if (last) lastIdRef.current = Math.max(lastIdRef.current, last.id)
          return trimmed
        })
        setError('')
      } catch (e) {
        if (initial) setError(e instanceof Error ? e.message : 'Could not load chat')
      } finally {
        if (initial) setLoading(false)
      }
    },
    [peerId],
  )

  useEffect(() => {
    lastIdRef.current = 0
    setMessages([])
    setLoading(true)
    void refresh(true)
    const id = window.setInterval(() => void refresh(false), 4000)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length])

  const onSend = async (html: string) => {
    setSending(true)
    setError('')
    try {
      const msg = await sendDmMessage(peerId, html)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        const next = [...prev, msg].slice(-200)
        lastIdRef.current = Math.max(lastIdRef.current, msg.id)
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`social-dm-panel${embedded ? ' is-embedded' : ''}`}>
      {!embedded ? (
        <header className="social-dm-head">
          <h3>{peerName}</h3>
        </header>
      ) : null}

      <div ref={listRef} className="social-dm-messages account-hub-chat-messages">
        {loading ? (
          <p className="account-hub-chat-empty">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="account-hub-chat-empty">No messages yet. Follow them to start.</p>
        ) : (
          messages.map((m) => {
            const stickerOnly = m.html.includes('chat-sticker') && !m.html.replace(/<[^>]+>/g, '').trim()
            return (
              <article
                key={m.id}
                className={`account-hub-chat-bubble social-dm-bubble${m.isSelf ? ' is-self' : ''}${stickerOnly ? ' is-sticker' : ''}`}
              >
                <div
                  className="account-hub-chat-bubble-inner social-dm-bubble-body"
                  dangerouslySetInnerHTML={{ __html: m.html }}
                />
                <time className="account-hub-chat-time">{relativeTime(m.createdAt)}</time>
              </article>
            )
          })
        )}
      </div>

      {error ? <p className="account-chat-error">{error}</p> : null}

      <SocialDmEditor
        stickers={stickerItems}
        shopStickers={shopStickers}
        onSend={(html) => void onSend(html)}
        disabled={sending}
        stickerSendsAlone
        placeholder="Message…"
      />
    </div>
  )
}
