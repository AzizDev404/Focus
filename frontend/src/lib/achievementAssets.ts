/** Admin-uploaded image only — no built-in fallback assets. */
export function achievementImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null
  return imageUrl
}
