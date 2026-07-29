/** Looping background videos for animated themes (Mixkit, royalty-free). */
export const ANIMATED_THEME_VIDEOS: Record<string, string> = {
  'lofi-cafe':
    'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-cafe-4260-large.mp4',
  'lofi-clouds':
    'https://assets.mixkit.co/videos/preview/mixkit-white-clouds-in-blue-sky-2408-large.mp4',
  'cozy-fireplace':
    'https://assets.mixkit.co/videos/preview/mixkit-fireplace-burning-in-the-dark-426-large.mp4',
  fireplace:
    'https://assets.mixkit.co/videos/preview/mixkit-fireplace-burning-in-the-dark-426-large.mp4',
  'rainy-nyc-evening':
    'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-window-18305-large.mp4',
  'night-lofi-bedroom':
    'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-a-laptop-at-night-4261-large.mp4',
}

export function getAnimatedVideoUrl(themeId: string): string | undefined {
  return ANIMATED_THEME_VIDEOS[themeId]
}
