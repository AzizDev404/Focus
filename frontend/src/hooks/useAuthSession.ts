import { useEffect, useRef } from 'react'
import { migrateAuthStorage, readSession } from '../lib/authSessionCache'
import { getUserToken, useUserToken } from '../lib/authStorage'
import { restoreSessionFromStorage, scrubStaleSession, logoutUser } from '../lib/establishSession'
import type { UserProfile } from '../lib/auth/types'
import { apiGet, ApiError } from '../lib/api'
import { establishUserSession } from '../lib/establishSession'
import { useFlocusStore } from '../store/useFlocusStore'

export function useAuthSession() {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    migrateAuthStorage()
    scrubStaleSession()
    restoreSessionFromStorage()

    const token = getUserToken()
    if (!token) return

    void apiGet<{ user: UserProfile }>('/api/auth/me', token)
      .then(({ user }) => {
        establishUserSession(token, user)
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          logoutUser()
          return
        }
        restoreSessionFromStorage()
      })
  }, [])
}

export function useIsLoggedIn() {
  useUserToken()
  const profile = useFlocusStore((s) => s.profile)
  const session = readSession()
  if (session?.token && session.profile?.id) return true
  return Boolean(getUserToken()) && Boolean(profile?.id)
}

function openProfileSettings() {
  const store = useFlocusStore.getState()
  store.setSettingsTab('profile')
  store.setPanel('settings')
  store.setAuthModalOpen(false)
}

export function useOpenAuthModal() {
  const setAuthModalOpen = useFlocusStore((s) => s.setAuthModalOpen)
  const setAuthModalTab = useFlocusStore((s) => s.setAuthModalTab)
  const isLoggedIn = useIsLoggedIn()

  return (tab: 'register' | 'login' = 'login') => {
    if (isLoggedIn) {
      openProfileSettings()
      return
    }
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }
}

export function useOpenAccount() {
  const setPanel = useFlocusStore((s) => s.setPanel)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)
  const isLoggedIn = useIsLoggedIn()

  return () => {
    if (isLoggedIn) {
      setSettingsTab('profile')
      setPanel('settings')
    } else {
      useFlocusStore.getState().setAuthModalTab('login')
      useFlocusStore.getState().setAuthModalOpen(true)
    }
  }
}

export function useOpenAccountSettings() {
  return () => openProfileSettings()
}
