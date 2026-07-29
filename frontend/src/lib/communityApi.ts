import { apiGet, apiPost } from './api'
import { getUserToken } from './authStorage'

export type LeaderboardUser = {
  rank: number
  id: number
  displayName: string
  level: number
  coins: number
  totalFocusSeconds: number
  totalTasksCompleted: number
  xpProgress: number
  xpToNext: number
  media: {
    avatarUrl: string | null
    backgroundUrl: string | null
  }
  equipped: {
    background: number | null
    avatar: number | null
    frame: number | null
    charm: number | null
  }
}

export type PublicUserAchievement = {
  id: string
  title: string
  description: string
  imageUrl?: string
  unlocked: boolean
  unlockedAt: string | null
}

export type PublicUserCard = {
  id: number
  displayName: string
  level: number
  xp: number
  xpProgress: number
  xpToNext: number
  coins: number
  equipped: {
    background: number | null
    avatar: number | null
    frame: number | null
    charm: number | null
  }
  media: {
    avatarUrl: string | null
    backgroundUrl: string | null
  }
  totals: {
    totalFocusSeconds: number
    totalBreakSeconds: number
    totalSessions: number
    totalTasksCompleted: number
  }
  achievements: PublicUserAchievement[]
  achievementsUnlocked: number
  achievementsTotal: number
  createdAt?: string
  followersCount?: number
  followingCount?: number
  isFollowing?: boolean
  isFollowedBy?: boolean
}

export async function fetchLeaderboard(limit = 20, sort: 'level' | 'focus' | 'coins' = 'level') {
  const data = await apiGet<{ users: LeaderboardUser[] }>(
    `/api/leaderboard?limit=${limit}&sort=${sort}`,
  )
  return data.users
}

export async function fetchPublicUser(id: number) {
  const token = getUserToken()
  const data = await apiGet<{ user: PublicUserCard }>(`/api/users/${id}`, token)
  return data.user
}

export type ChatMessage = {
  id: number
  userId: number
  displayName: string
  text: string
  html?: string
  createdAt: string
}

export async function fetchChatMessages(opts: { since?: number; limit?: number } = {}) {
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.since) params.set('since', String(opts.since))
  const qs = params.toString()
  const data = await apiGet<{ messages: ChatMessage[] }>(
    `/api/chat${qs ? `?${qs}` : ''}`,
  )
  return data.messages
}

export async function sendChatMessage(html: string) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const data = await apiPost<{ message: ChatMessage }>(
    '/api/chat',
    { html },
    token,
  )
  return data.message
}
