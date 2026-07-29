import { useEffect, useMemo, useState } from 'react'
import { getTheme } from '../data/catalog'
import { getAnimatedVideoUrl } from '../lib/themeMedia'
import type { DashboardMode } from '../types'
import { useFlocusStore } from '../store/useFlocusStore'

interface Props {
  mode: DashboardMode
}

const MOBILE_BP = 768

export function Background({ mode }: Props) {
  const settings = useFlocusStore((s) => s.settings)
  const themeId = mode === 'focus' ? settings.themeFocus : settings.themeHome

  const custom = settings.customThemes[mode]
  const theme = getTheme(themeId)

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BP : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const themeImageUrl =
    isMobile && theme?.mobileImage ? theme.mobileImage : theme?.image

  const videoUrl =
    theme?.type === 'animated' &&
    theme.animated &&
    !settings.disableAnimatedThemes
      ? theme.videoUrl ?? getAnimatedVideoUrl(themeId)
      : undefined

  const themeType = videoUrl
    ? 'video'
    : custom?.dataUrl || themeImageUrl || (theme && !theme.gradient)
      ? 'image'
      : 'gradient'

  const renderedImage = custom?.dataUrl ?? (!videoUrl ? themeImageUrl : undefined)

  const gradientStyle = useMemo(() => {
    if (renderedImage) return undefined
    if (theme?.gradient) return { background: theme.gradient } as const
    return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } as const
  }, [renderedImage, theme])

  const overlayOpacity = custom?.opacity ?? 35

  const wrapperStyle: React.CSSProperties = {
    ['--opac' as string]: overlayOpacity / 100,
    ...(renderedImage ? null : gradientStyle ?? {}),
  }

  // Apply per-upload zoom + pan only when the active image is the user's
  // custom upload. Defaults: scale 1, centered (50/50).
  const usingCustom = renderedImage === custom?.dataUrl && Boolean(custom?.dataUrl)
  const imgStyle: React.CSSProperties | undefined = usingCustom
    ? {
        transform: `scale(${custom?.scale ?? 1})`,
        transformOrigin: 'center center',
        objectPosition: `${custom?.posX ?? 50}% ${custom?.posY ?? 50}%`,
      }
    : undefined

  return (
    <div id="bg-wrapper" data-theme-type={themeType} style={wrapperStyle}>
      {videoUrl ? (
        <video key={videoUrl} id="bg-video" src={videoUrl} autoPlay loop muted playsInline />
      ) : renderedImage ? (
        <img
          key={renderedImage}
          id="bg-image"
          src={renderedImage}
          alt=""
          draggable={false}
          style={imgStyle}
        />
      ) : null}
    </div>
  )
}
