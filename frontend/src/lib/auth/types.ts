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

export type AuthSession = {
  email: string
  displayName: string
}

export type ShopItemType = 'background' | 'avatar' | 'frame' | 'charm' | 'sticker'

export type EquipSlotType = Exclude<ShopItemType, 'sticker'>

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

export type EquippedSlots = {
  background: number | null
  avatar: number | null
  frame: number | null
  charm: number | null
}

export function isEquipSlotType(type: ShopItemType): type is EquipSlotType {
  return type !== 'sticker'
}

export type AchievementView = {
  id: string
  title: string
  description: string
  icon: string
  imageUrl?: string
  coinReward: number
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
  progress: number
  target: number
}

export type UserProfile = {
  id: number
  email: string
  displayName: string
  emailVerified?: boolean
  provider?: 'google' | 'password'
  coins: number
  level: number
  xp: number
  xpProgress: number
  xpToNext: number
  nextLevelXp: number
  currentLevelXp: number
  equipped: EquippedSlots
  media: {
    avatarUrl: string | null
    backgroundUrl: string | null
  }
  inventory: number[]
  achievements: AchievementView[]
  totals?: {
    totalFocusSeconds: number
    totalBreakSeconds: number
    totalSessions: number
    totalTasksCompleted: number
  }
  createdAt?: string
  lastLoginAt?: string | null
  followersCount?: number
  followingCount?: number
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

export type AuthModalTab = 'register' | 'login' | 'verify' | 'reset'

export type AuthConfig = {
  googleEnabled: boolean
  googleClientId: string | null
  requireEmailVerification: boolean
  devMailMode?: boolean
}

export type MailMessage = {
  id: number
  type: 'password_reset' | string
  subject: string
  body: string
  read: boolean
  createdAt: string
}
