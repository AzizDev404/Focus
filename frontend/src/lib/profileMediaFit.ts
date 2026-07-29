/** Fit profile banner height to image aspect ratio (no letterbox bars). */
export function bannerHeightForWidth(
  containerWidth: number,
  naturalWidth: number,
  naturalHeight: number,
  { minPx = 96, maxPx = 168, scale = 0.72 } = {},
) {
  if (!containerWidth || !naturalWidth || !naturalHeight) return minPx
  const natural = containerWidth * (naturalHeight / naturalWidth) * scale
  return Math.round(Math.min(maxPx, Math.max(minPx, natural)))
}

/** Charm display size from asset pixels. */
export function charmDisplaySize(naturalWidth: number, naturalHeight: number) {
  const base = Math.max(naturalWidth, naturalHeight)
  if (!base) return 96
  return Math.round(Math.min(128, Math.max(84, base * 0.55)))
}
