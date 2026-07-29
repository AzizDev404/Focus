/** @typedef {'upcoming' | 'active' | 'ended' | 'disabled'} ShopEventStatus */

/**
 * @param {{ enabled?: boolean; startsAt?: string | null; endsAt?: string | null }} event
 * @param {Date} [now]
 * @returns {ShopEventStatus}
 */
export function shopEventStatus(event, now = new Date()) {
  if (event.enabled === false) return 'disabled'
  const start = event.startsAt ? new Date(event.startsAt) : null
  const end = event.endsAt ? new Date(event.endsAt) : null
  if (start && !Number.isNaN(start.getTime()) && now < start) return 'upcoming'
  if (end && !Number.isNaN(end.getTime()) && now > end) return 'ended'
  return 'active'
}

/**
 * @param {{ enabled?: boolean; startsAt?: string | null; endsAt?: string | null }} event
 * @param {Date} [now]
 */
export function isShopEventLive(event, now = new Date()) {
  return shopEventStatus(event, now) === 'active'
}

/**
 * @param {Record<string, unknown>} event
 * @param {number} [itemCount]
 */
export function serializeShopEvent(event, itemCount = 0) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description ?? '',
    startsAt: event.startsAt ?? null,
    endsAt: event.endsAt ?? null,
    enabled: event.enabled !== false,
    createdAt: event.createdAt,
    status: shopEventStatus(event),
    itemCount,
  }
}

export function slugifyEventTitle(title) {
  return String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}
