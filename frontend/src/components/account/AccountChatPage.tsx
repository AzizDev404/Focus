import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle } from '../icons'
import { useIsLoggedIn, useOpenAuthModal } from '../../hooks/useAuthSession'
import { fetchDmInbox, type DmConversation } from '../../lib/socialApi'
import { fetchShopItems } from '../../lib/profileApi'
import type { ShopItem } from '../../lib/auth/types'
import { mergeChatStickers } from '../../lib/chatStickers'
import { useFlocusStore } from '../../store/useFlocusStore'
import { AccountSubpageToolbar } from './AccountSubpageToolbar'
import { AccountChats } from './AccountChats'
import { DmChatPanel } from '../social/DmChatPanel'
import '../../styles/account-hub-pages.css'
import '../../styles/social-chat.css'

type ChatMode = 'lounge' | 'direct'

function previewText(html: string) {
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.length > 72 ? `${plain.slice(0, 72)}…` : plain || 'Sticker'
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

export function AccountChatPage() {
  const isLoggedIn = useIsLoggedIn()
  const openAuth = useOpenAuthModal()
  const profile = useFlocusStore((s) => s.profile)
  const messagesTarget = useFlocusStore((s) => s.messagesTarget)
  const clearMessagesTarget = useFlocusStore((s) => s.clearMessagesTarget)

  const [mode, setMode] = useState<ChatMode>('lounge')
  const [conversations, setConversations] = useState<DmConversation[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [inboxError, setInboxError] = useState('')
  const [peer, setPeer] = useState<DmConversation | null>(null)

  const ownedShopStickers = useMemo(() => {
    if (!profile?.inventory) return []
    return shopItems.filter((i) => i.type === 'sticker' && profile.inventory.includes(i.id))
  }, [profile?.inventory, shopItems])

  const chatStickers = useMemo(() => mergeChatStickers(ownedShopStickers), [ownedShopStickers])

  const loadInbox = useCallback(async () => {
    if (!isLoggedIn) return
    setInboxLoading(true)
    setInboxError('')
    try {
      const [inbox, items] = await Promise.all([fetchDmInbox(), fetchShopItems()])
      setConversations(inbox)
      setShopItems(items)
    } catch (e) {
      setInboxError(e instanceof Error ? e.message : 'Could not load inbox')
    } finally {
      setInboxLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return
    void fetchShopItems()
      .then(setShopItems)
      .catch(() => {})
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || mode !== 'direct' || peer) return
    void loadInbox()
  }, [isLoggedIn, mode, peer, loadInbox])

  useEffect(() => {
    if (!peer || shopItems.length > 0) return
    void fetchShopItems()
      .then(setShopItems)
      .catch(() => {})
  }, [peer, shopItems.length])

  useEffect(() => {
    if (!messagesTarget) return
    setMode('direct')
    setPeer({
      peerId: messagesTarget.peerId,
      displayName: messagesTarget.displayName,
      lastMessage: {
        id: 0,
        html: '',
        createdAt: new Date().toISOString(),
        isSelf: false,
      },
    })
    clearMessagesTarget()
  }, [messagesTarget, clearMessagesTarget])

  if (!isLoggedIn) {
    return (
      <div className="account-chat-hub account-chat-hub--guest">
        <div className="account-hub-guest">
          <MessageCircle size={28} aria-hidden />
          <h3>Chat</h3>
          <p>Sign in to join the public lounge or send private notes.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openAuth('login')}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  if (peer) {
    return (
      <div className="account-chat-hub account-chat-hub--thread">
        <AccountSubpageToolbar
          backLabel="Direct"
          onBack={() => {
            setPeer(null)
            setMode('direct')
            void loadInbox()
          }}
          title={peer.displayName}
          meta="Private note"
        />
        <article
          className="account-hub-chat-shell account-hub-chat-shell--thread glass-surface"
          aria-label="Direct message thread"
        >
          <DmChatPanel
            peerId={peer.peerId}
            peerName={peer.displayName}
            stickerItems={chatStickers}
            shopStickers={ownedShopStickers}
            embedded
          />
        </article>
      </div>
    )
  }

  return (
    <div className="account-chat-hub">
      <div className="account-chat-segments" role="tablist" aria-label="Chat mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'lounge'}
          className={`account-chat-segment${mode === 'lounge' ? ' is-active' : ''}`}
          onClick={() => setMode('lounge')}
        >
          Lounge
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'direct'}
          className={`account-chat-segment${mode === 'direct' ? ' is-active' : ''}`}
          onClick={() => setMode('direct')}
        >
          Direct
        </button>
      </div>

      <article
        className="account-hub-chat-shell glass-surface"
        aria-label={mode === 'lounge' ? 'Public lounge' : 'Direct inbox'}
      >
        {mode === 'direct' ? (
          <header className="account-hub-chat-shell-bar">
            <p className="account-hub-chat-shell-bar-text">Messages</p>
            <button
              type="button"
              className="account-chat-refresh"
              disabled={inboxLoading}
              aria-label="Refresh inbox"
              onClick={() => void loadInbox()}
            >
              ↻
            </button>
          </header>
        ) : null}

        <div
          className={`account-hub-chat-shell-body${
            mode === 'direct' ? ' account-hub-chat-shell-body--inbox' : ' account-hub-chat-shell-body--lounge'
          }`}
        >
          {mode === 'lounge' ? (
            <AccountChats embedded />
          ) : (
            <>
              {inboxError ? <p className="account-chat-error">{inboxError}</p> : null}
              {inboxLoading && conversations.length === 0 ? (
                <p className="account-hub-chat-empty">Loading inbox…</p>
              ) : conversations.length === 0 ? (
                <p className="account-hub-chat-empty">
                  No conversations yet.
                  <br />
                  <small>Leaderboard → profile → Message</small>
                </p>
              ) : (
                <ul className="account-hub-inbox">
                  {conversations.map((c) => (
                    <li key={c.peerId}>
                      <button type="button" className="account-hub-inbox-row" onClick={() => setPeer(c)}>
                        <span className="account-hub-inbox-avatar" aria-hidden>
                          {c.displayName.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="account-hub-inbox-text">
                          <strong>{c.displayName}</strong>
                          <span>
                            {c.lastMessage.isSelf ? 'You: ' : ''}
                            {previewText(c.lastMessage.html)}
                          </span>
                        </span>
                        <time>{relativeTime(c.lastMessage.createdAt)}</time>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </article>
    </div>
  )
}
