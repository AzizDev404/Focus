import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchChatMessages,
  sendChatMessage,
  type ChatMessage,
} from '../../lib/communityApi'
import { fetchShopItems } from '../../lib/profileApi'
import type { ShopItem } from '../../lib/auth/types'
import { mergeChatStickers } from '../../lib/chatStickers'
import { useFlocusStore } from '../../store/useFlocusStore'
import { SocialDmEditor } from '../social/SocialDmEditor'
import '../../styles/social-chat.css'

const POLL_INTERVAL_MS = 4000

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'now'
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

type Props = {
  embedded?: boolean
}

export function AccountChats({ embedded = false }: Props) {
  const profile = useFlocusStore((s) => s.profile)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  const ownedShopStickers = useMemo(() => {
    if (!profile?.inventory) return []
    return shopItems.filter((i) => i.type === 'sticker' && profile.inventory.includes(i.id))
  }, [profile?.inventory, shopItems])

  const chatStickers = useMemo(() => mergeChatStickers(ownedShopStickers), [ownedShopStickers])

  useEffect(() => {
    void fetchShopItems()
      .then(setShopItems)
      .catch(() => {})
  }, [])

  const refresh = useCallback(async (initial = false) => {
    try {
      const next = await fetchChatMessages(
        initial ? { limit: 50 } : { since: lastIdRef.current, limit: 50 },
      )
      if (!next.length) {
        if (initial) setLoading(false)
        return
      }
      setMessages((prev) => {
        const merged = initial ? next : [...prev, ...next]
        const trimmed = merged.slice(-200)
        const last = trimmed[trimmed.length - 1]
        if (last) lastIdRef.current = Math.max(lastIdRef.current, last.id)
        return trimmed
      })
      setError(null)
    } catch (e) {
      if (initial) setError(e instanceof Error ? e.message : 'Failed to load chat')
    } finally {
      if (initial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(true)
    const id = window.setInterval(() => void refresh(false), POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length])

  const onSend = async (html: string) => {
    if (!profile || sending) return
    setSending(true)
    setError(null)
    try {
      const msg = await sendChatMessage(html)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        const next = [...prev, msg].slice(-200)
        lastIdRef.current = Math.max(lastIdRef.current, msg.id)
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const ordered = useMemo(() => messages, [messages])

  const body = (
    <>
      <div ref={listRef} className="account-hub-chat-messages" aria-live="polite">
        {loading && <p className="account-hub-chat-empty">Loading messages…</p>}
        {!loading && !ordered.length && (
          <p className="account-hub-chat-empty">Be the first to say hi — or send a sticker.</p>
        )}
        {ordered.map((m) => {
          const isSelf = profile?.id === m.userId
          const html = m.html ?? (m.text.includes('<') ? m.text : null)
          const stickerOnly = Boolean(html?.includes('chat-sticker') && !html.replace(/<[^>]+>/g, '').trim())
          return (
            <article
              key={m.id}
              className={`account-hub-chat-bubble social-dm-bubble${isSelf ? ' is-self' : ''}${stickerOnly ? ' is-sticker' : ''}`}
            >
              {!isSelf && !stickerOnly ? (
                <span className="account-hub-chat-sender">{m.displayName}</span>
              ) : null}
              {html ? (
                <div
                  className="account-hub-chat-bubble-inner social-dm-bubble-body"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="account-hub-chat-bubble-inner social-dm-bubble-body">{m.text}</div>
              )}
              <time className="account-hub-chat-time">{relativeTime(m.createdAt)}</time>
            </article>
          )
        })}
      </div>
      {error ? <p className="account-chat-error">{error}</p> : null}
      {profile ? (
        <SocialDmEditor
          stickers={chatStickers}
          shopStickers={ownedShopStickers}
          onSend={(html) => void onSend(html)}
          disabled={sending}
          stickerSendsAlone
          placeholder="Message…"
        />
      ) : (
        <p className="account-hub-chat-empty">Sign in to chat.</p>
      )}
    </>
  )

  if (embedded) {
    return <div className="account-hub-lounge-panel">{body}</div>
  }

  return (
    <article className="account-hub-chat-card">
      <header className="account-hub-chat-card-head">
        <strong>Live lounge</strong>
        <p>Public room for all players. Notes, stickers & formatting welcome.</p>
      </header>
      <div className="account-hub-chat-card-body">{body}</div>
    </article>
  )
}
