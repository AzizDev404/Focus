import { apiGet, apiPost } from './api'
import { getUserToken } from './authStorage'
import type { MailMessage } from './auth/types'

export async function fetchMail(): Promise<MailMessage[]> {
  const token = getUserToken()
  if (!token) return []
  const data = await apiGet<{ mail: MailMessage[] }>('/api/user/mail', token)
  return data.mail
}

export async function markMailRead(id: number): Promise<void> {
  const token = getUserToken()
  if (!token) return
  await apiPost(`/api/user/mail/${id}/read`, {}, token)
}
