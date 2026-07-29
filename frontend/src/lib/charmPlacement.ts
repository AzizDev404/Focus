export type CharmPos = { x: number; y: number }

export const DEFAULT_CHARM_POS: CharmPos = { x: 86, y: 4 }

/** Charm anchored to the profile banner (hero layout). */
export const BANNER_CHARM_POS: CharmPos = { x: 90, y: 16 }

function storageKey(userId: number) {
  return `tsukiyomi-charm-pos-${userId}`
}

export function loadCharmPos(userId: number): CharmPos {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return DEFAULT_CHARM_POS
    const data = JSON.parse(raw) as Partial<CharmPos>
    if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return DEFAULT_CHARM_POS
    return {
      x: Math.min(96, Math.max(4, data.x!)),
      y: Math.min(92, Math.max(2, data.y!)),
    }
  } catch {
    return DEFAULT_CHARM_POS
  }
}

export function saveCharmPos(userId: number, pos: CharmPos) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(pos))
  } catch {
    /* ignore quota errors */
  }
}
