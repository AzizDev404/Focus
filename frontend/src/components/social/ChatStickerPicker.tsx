import { useEffect, useRef, type RefObject } from 'react'
import { stickerPreviewSrc, type ChatSticker } from '../../lib/chatStickers'
import { Smile, X } from '../icons'

type Props = {
  open: boolean
  stickers: ChatSticker[]
  disabled?: boolean
  boundaryRef: RefObject<HTMLElement | null>
  onClose: () => void
  onPick: (sticker: ChatSticker) => void
}

export function ChatStickerPicker({
  open,
  stickers,
  disabled,
  boundaryRef,
  onClose,
  onPick,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const boundary = boundaryRef.current
      if (boundary?.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, boundaryRef])

  if (!open) return null

  return (
    <div ref={sheetRef} className="chat-sticker-sheet" role="dialog" aria-label="Stickers">
      <div className="chat-sticker-sheet-head">
        <span className="chat-sticker-sheet-title">
          <Smile size={16} strokeWidth={1.85} aria-hidden />
          Pick a sticker
        </span>
        <button type="button" className="chat-sticker-sheet-close" onClick={onClose} aria-label="Close">
          <X size={15} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      {stickers.length === 0 ? (
        <p className="chat-sticker-sheet-empty">
          No stickers yet. Get them in <strong>Magazine → Shop</strong>.
        </p>
      ) : (
        <div className="chat-sticker-sheet-grid">
          {stickers.map((s) => {
            const src = stickerPreviewSrc(s)
            return (
              <button
                key={s.id}
                type="button"
                className="chat-sticker-sheet-item"
                title={s.name}
                disabled={disabled}
                onClick={() => {
                  onPick(s)
                  onClose()
                }}
              >
                {src ? (
                  <img src={src} alt="" draggable={false} />
                ) : (
                  <span className="chat-sticker-sheet-emoji">{s.emoji || '✨'}</span>
                )}
                <span className="chat-sticker-sheet-name">{s.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
