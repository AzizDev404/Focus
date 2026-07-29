import type { AuthSession, UserProfile } from './types'

export function toAuthSession(user: { email: string; displayName: string }): AuthSession {
  return {
    email: user.email,
    displayName: user.displayName,
  }
}

export function profileToSession(profile: UserProfile): AuthSession {
  return {
    email: profile.email,
    displayName: profile.displayName,
  }
}
