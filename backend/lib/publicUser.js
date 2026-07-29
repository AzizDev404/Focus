export function publicUser(user) {
  const email = user.email ?? user.address
  return {
    id: user.id,
    email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}
