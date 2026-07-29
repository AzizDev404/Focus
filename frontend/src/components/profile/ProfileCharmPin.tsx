import { useCallback, useEffect, useRef, useState } from 'react'
import type { CharmPos } from '../../lib/charmPlacement'
import { BANNER_CHARM_POS, DEFAULT_CHARM_POS, loadCharmPos, saveCharmPos } from '../../lib/charmPlacement'
import { charmDisplaySize } from '../../lib/profileMediaFit'

type Visual =
  | { kind: 'image'; src: string }
  | { kind: 'emoji'; emoji: string }

type Props = {
  userId: number
  label: string
  visual: Visual
  /** Drag + save — only on Profile page */
  interactive?: boolean
  /** Pin to banner top area (full profile card) vs whole card */
  anchor?: 'card' | 'banner'
}

function defaultPos(anchor: 'card' | 'banner') {
  return anchor === 'banner' ? BANNER_CHARM_POS : DEFAULT_CHARM_POS
}

/** Fix positions saved by old leaderboard drag bug */
function normalizeSavedPos(pos: CharmPos, anchor: 'card' | 'banner'): CharmPos {
  if (anchor === 'banner') {
    if (pos.y > 72 || pos.y < 4 || pos.x < 50) return BANNER_CHARM_POS
    return pos
  }
  if (pos.y > 42 || pos.x < 6 || pos.x > 94) return DEFAULT_CHARM_POS
  return pos
}

export function ProfileCharmPin({
  userId,
  label,
  visual,
  interactive = false,
  anchor = 'card',
}: Props) {
  const readPos = useCallback(() => {
    const saved = loadCharmPos(userId)
    if (interactive) {
      return anchor === 'banner' ? normalizeSavedPos(saved, 'banner') : saved
    }
    return normalizeSavedPos(saved, anchor)
  }, [interactive, userId, anchor])

  const [pos, setPos] = useState<CharmPos>(() => readPos())
  const [charmSize, setCharmSize] = useState(96)
  const [dragging, setDragging] = useState(false)
  const posRef = useRef(pos)
  const dragRef = useRef<{ startX: number; startY: number; origin: CharmPos; moved: boolean } | null>(
    null,
  )

  useEffect(() => {
    const next = readPos()
    posRef.current = next
    setPos(next)
  }, [readPos])

  const capCharmSize = (size: number) => (anchor === 'banner' ? Math.min(size, 108) : size)

  useEffect(() => {
    if (visual.kind !== 'image') {
      setCharmSize(anchor === 'banner' ? 40 : 96)
      return
    }
    const probe = new Image()
    probe.onload = () => {
      setCharmSize(capCharmSize(charmDisplaySize(probe.naturalWidth, probe.naturalHeight)))
    }
    probe.src = visual.src
  }, [visual, anchor])

  const resolveBounds = useCallback(
    (el: HTMLElement) => {
      const sel = anchor === 'banner' ? '.profile-card-banner' : '.profile-card'
      return el.closest(sel) as HTMLElement | null
    },
    [anchor],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || e.button !== 0) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: posRef.current, moved: false }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const bounds = resolveBounds(e.currentTarget)
    if (!dragging || !drag || !bounds) return
    const rect = bounds.getBoundingClientRect()
    const dx = ((e.clientX - drag.startX) / rect.width) * 100
    const dy = ((e.clientY - drag.startY) / rect.height) * 100
    if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) drag.moved = true
    const next = {
      x: Math.min(96, Math.max(4, drag.origin.x + dx)),
      y: Math.min(92, Math.max(2, drag.origin.y + dy)),
    }
    posRef.current = next
    setPos(next)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    dragRef.current = null
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    saveCharmPos(userId, posRef.current)
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!interactive) return
    e.preventDefault()
    if (dragRef.current?.moved) return
    const reset = defaultPos(anchor)
    posRef.current = reset
    setPos(reset)
    saveCharmPos(userId, reset)
  }

  return (
    <div
      className={`profile-charm-pin${anchor === 'banner' ? ' profile-charm-pin--banner' : ''}${dragging ? ' is-dragging' : ''}${interactive ? '' : ' profile-charm-pin--static'}`}
      style={
        {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          '--profile-charm-size': `${charmSize}px`,
        } as React.CSSProperties
      }
      title={interactive ? `${label} — drag to move, double-click to reset` : label}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={interactive ? onDoubleClick : undefined}
    >
      <span className="profile-charm-string" aria-hidden />
      <div className="profile-charm-pendant">
        {visual.kind === 'image' ? (
          <img
            src={visual.src}
            alt=""
            className="profile-charm-img"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget
              setCharmSize(capCharmSize(charmDisplaySize(img.naturalWidth, img.naturalHeight)))
            }}
          />
        ) : (
          <span className="profile-charm-emoji">{visual.emoji}</span>
        )}
      </div>
    </div>
  )
}
