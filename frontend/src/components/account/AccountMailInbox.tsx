import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, RefreshCcw } from '../icons'
import { fetchMail, markMailRead } from '../../lib/mailApi'
import type { MailMessage } from '../../lib/auth/types'

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export function AccountMailInbox() {
  const [mail, setMail] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setMail(await fetchMail())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onOpen = async (item: MailMessage) => {
    setOpenId((prev) => (prev === item.id ? null : item.id))
    if (!item.read) {
      await markMailRead(item.id)
      setMail((prev) => prev.map((m) => (m.id === item.id ? { ...m, read: true } : m)))
    }
  }

  const unreadCount = mail.filter((m) => !m.read).length

  return (
    <div className="account-mail">
      <div className="account-mail-toolbar">
        <span>
          <Mail size={14} aria-hidden /> {mail.length} total · {unreadCount} unread
        </span>
        <button
          type="button"
          className="account-mail-refresh"
          onClick={() => void load()}
          aria-label="Refresh"
        >
          <RefreshCcw size={13} aria-hidden /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="account-mail-empty">Loading mail…</p>
      ) : !mail.length ? (
        <p className="account-mail-empty">No messages yet.</p>
      ) : (
        <ul className="account-mail-list">
          <AnimatePresence initial={false}>
            {mail.map((item) => (
              <motion.li
                key={item.id}
                className={`account-mail-item${item.read ? '' : ' is-unread'}${openId === item.id ? ' is-open' : ''}`}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button type="button" className="account-mail-item-btn" onClick={() => void onOpen(item)}>
                  <span className="account-mail-row">
                    <span className="account-mail-subject">{item.subject}</span>
                    <span className="account-mail-time">{formatRelative(item.createdAt)}</span>
                  </span>
                  <span className="account-mail-body">
                    {openId === item.id ? item.body : `${item.body.slice(0, 110)}${item.body.length > 110 ? '…' : ''}`}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
