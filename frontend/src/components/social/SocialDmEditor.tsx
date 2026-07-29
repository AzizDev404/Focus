import { useId, useLayoutEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import {
  buildStickerHtml,
  getOwnedChatStickers,
  mergeChatStickers,
  stickerPreviewSrc,
  type ChatSticker,
} from '../../lib/chatStickers'
import type { ShopItem } from '../../lib/auth/types'
import { ArrowUp, Smile } from '../icons'
import { ChatStickerPicker } from './ChatStickerPicker'

type Props = {
  stickers: ChatSticker[]
  shopStickers?: ShopItem[]
  onSend: (html: string) => void
  disabled?: boolean
  stickerSendsAlone?: boolean
  placeholder?: string
}

export function SocialDmEditor({
  stickers,
  shopStickers = [],
  onSend,
  disabled,
  stickerSendsAlone = false,
  placeholder = 'Message…',
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const composeRef = useRef<HTMLDivElement>(null)
  const reactId = useId()
  const toolbarId = `social-dm-toolbar-${reactId.replace(/:/g, '')}`
  const [showStickers, setShowStickers] = useState(false)

  const pickerStickers = getOwnedChatStickers(shopStickers)
  const hasStickers = pickerStickers.length > 0
  const allStickers = stickers.length ? stickers : mergeChatStickers(shopStickers)

  useLayoutEffect(() => {
    const mount = mountRef.current
    const toolbar = document.getElementById(toolbarId)
    if (!mount || !toolbar) return

    mount.innerHTML = ''
    const quill = new Quill(mount, {
      theme: 'snow',
      modules: {
        toolbar: { container: `#${toolbarId}` },
      },
      placeholder,
    })

    quillRef.current = quill

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSendRef.current()
      }
    }
    quill.root.addEventListener('keydown', onKeyDown)

    return () => {
      quill.root.removeEventListener('keydown', onKeyDown)
      quillRef.current = null
      mount.innerHTML = ''
    }
  }, [toolbarId, placeholder])

  const handleSendRef = useRef<() => void>(() => {})
  handleSendRef.current = () => {
    const quill = quillRef.current
    if (!quill || disabled) return
    annotateStickerImages(quill.root, allStickers)
    let html = quill.root.innerHTML
    if (html === '<p><br></p>') html = ''
    if (!html.trim()) return
    onSend(html)
    quill.setText('')
    setShowStickers(false)
  }

  const sendSticker = (item: ChatSticker) => {
    if (disabled) return
    const quill = quillRef.current
    const html = buildStickerHtml(item)
    if (!html) return

    const isEmpty = !quill || quill.getText().trim().length === 0
    if (stickerSendsAlone && isEmpty) {
      onSend(html)
      quill?.setText('')
      setShowStickers(false)
      return
    }

    if (!quill) return
    const src = stickerPreviewSrc(item)
    if (!src) return
    const range = quill.getSelection(true)
    const index = range?.index ?? quill.getLength()
    quill.insertEmbed(index, 'image', src, 'user')
    annotateStickerImages(quill.root, allStickers, item.id)
    setShowStickers(false)
  }

  return (
    <div className="social-dm-editor">
      <div ref={composeRef} className="social-dm-compose-card glass-surface">
        {hasStickers ? (
          <ChatStickerPicker
            open={showStickers}
            stickers={pickerStickers}
            disabled={disabled}
            boundaryRef={composeRef}
            onClose={() => setShowStickers(false)}
            onPick={sendSticker}
          />
        ) : null}

        <div className="social-dm-quill-toolbar-wrap">
          <div
            role="toolbar"
            className="ql-toolbar ql-snow social-dm-quill-toolbar"
            id={toolbarId}
            aria-label="Formatting"
          >
            <span className="ql-formats">
              <button type="button" className="ql-bold" aria-label="Bold" />
              <button type="button" className="ql-italic" aria-label="Italic" />
              <button type="button" className="ql-underline" aria-label="Underline" />
            </span>
            <span className="ql-formats">
              <button type="button" className="ql-blockquote" aria-label="Quote" />
              <button type="button" className="ql-code-block" aria-label="Code" />
            </span>
          </div>

          {hasStickers ? (
            <button
              type="button"
              className={`social-dm-toolbar-extra social-dm-sticker-toggle${showStickers ? ' is-active' : ''}`}
              aria-label="Stickers"
              aria-expanded={showStickers}
              disabled={disabled}
              onClick={() => setShowStickers((v) => !v)}
            >
              <Smile size={16} strokeWidth={1.85} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="social-dm-quill-root">
          <div ref={mountRef} className="social-dm-quill-mount" />
        </div>

        <div className="social-dm-compose-footer">
          <span className="social-dm-compose-hint">Ctrl+Enter to send</span>
          <button
            type="button"
            className="social-dm-send"
            disabled={disabled}
            aria-label="Send message"
            onClick={() => handleSendRef.current()}
          >
            <ArrowUp size={17} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function annotateStickerImages(root: HTMLElement, stickers: ChatSticker[], forceId?: number) {
  root.querySelectorAll('img').forEach((img) => {
    img.classList.add('chat-sticker')
    if (!img.getAttribute('data-sticker-id')) {
      const match = stickers.find((s) => {
        const src = stickerPreviewSrc(s)
        if (!src) return false
        return img.src.includes(src) || img.src.endsWith(src.replace(/^\//, ''))
      })
      if (match) img.setAttribute('data-sticker-id', String(match.id))
      else if (forceId) img.setAttribute('data-sticker-id', String(forceId))
    }
  })
}
