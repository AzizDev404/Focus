import { apiDelete, apiGet, apiPost } from './api'
import { getUserToken } from './authStorage'

export type FollowStatus = {
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isFollowedBy: boolean
}

export type FollowUser = {
  id: number
  displayName: string
}

export type DmMessage = {
  id: number
  fromId: number
  toId: number
  html: string
  createdAt: string
  isSelf: boolean
}

export async function fetchFollowStatus(userId: number) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  return apiGet<FollowStatus>(`/api/social/users/${userId}/status`, token)
}

export async function followUser(userId: number) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  return apiPost<FollowStatus>(`/api/social/users/${userId}/follow`, {}, token)
}

export async function unfollowUser(userId: number) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  return apiDelete<FollowStatus>(`/api/social/users/${userId}/follow`, token)
}

export async function fetchFollowers(userId: number) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const data = await apiGet<{ users: FollowUser[] }>(`/api/social/users/${userId}/followers`, token)
  return data.users
}

export async function fetchFollowing(userId: number) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const data = await apiGet<{ users: FollowUser[] }>(`/api/social/users/${userId}/following`, token)
  return data.users
}

export async function fetchDmMessages(peerId: number, opts: { since?: number; limit?: number } = {}) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.since) params.set('since', String(opts.since))
  const qs = params.toString()
  return apiGet<{ messages: DmMessage[]; peer: { id: number; displayName: string } }>(
    `/api/dm/${peerId}/messages${qs ? `?${qs}` : ''}`,
    token,
  )
}

export async function sendDmMessage(peerId: number, html: string) {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const data = await apiPost<{ message: DmMessage }>(
    `/api/dm/${peerId}/messages`,
    { html },
    token,
  )
  return data.message
}

export type DmConversation = {
  peerId: number
  displayName: string
  lastMessage: {
    id: number
    html: string
    createdAt: string
    isSelf: boolean
  }
}

export async function fetchDmInbox() {
  const token = getUserToken()
  if (!token) throw new Error('Not authenticated')
  const data = await apiGet<{ conversations: DmConversation[] }>('/api/dm/inbox', token)
  return data.conversations
}
