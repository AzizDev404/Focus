export type AuthUser = {
  id: number
  email: string
  displayName: string
  createdAt?: string
  lastLoginAt?: string | null
}

export type AdminUser = AuthUser & {
  totalFocusSeconds: number
  totalBreakSeconds: number
  totalSessions: number
  totalTasksCompleted: number
  coins?: number
  level?: number
}

export type ShopItemType = 'background' | 'avatar' | 'frame' | 'charm' | 'sticker'

export type ShopEventStatus = 'upcoming' | 'active' | 'ended' | 'disabled'

export type ShopEvent = {
  id: number
  slug: string
  title: string
  description: string
  startsAt: string | null
  endsAt: string | null
  enabled: boolean
  createdAt: string
  status: ShopEventStatus
  itemCount: number
}

export type ShopItem = {
  id: number
  type: ShopItemType
  name: string
  description: string
  preview: string
  emoji: string
  price: number
  discountPercent: number
  isFree: boolean
  isEvent: boolean
  eventId: number | null
  event?: ShopEvent | null
  stockLimit: number | null
  soldCount: number
  enabled: boolean
  effectivePrice?: number
  remaining?: number | null
  createdAt: string
}
