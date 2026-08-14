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

  const themeImageUrl = isMobile && theme?.mobileImage ? theme.mobileImage : theme?.image

  const themeVideoUrl =
    theme?.type === 'animated' && theme.animated && !settings.disableAnimatedThemes
      ? theme.videoUrl ?? getAnimatedVideoUrl(themeId)
      : undefined

  const customIsVideo = custom?.kind === 'video'
  const themeType = customIsVideo
    ? 'video'
    : themeVideoUrl
    ? 'video'
    : custom?.dataUrl || themeImageUrl || (theme && !theme.gradient)
    ? 'image'
    : 'gradient'

  const renderedImage = customIsVideo ? undefined : custom?.dataUrl ?? (!themeVideoUrl ? themeImageUrl : undefined)

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
  const usingCustom = Boolean(custom?.dataUrl)
  const imgStyle: React.CSSProperties | undefined = usingCustom
    ? {
        transform: `scale(${custom?.scale ?? 1})`,
        transformOrigin: `${custom?.posX ?? 50}% ${custom?.posY ?? 50}%`,
      }
    : undefined

  return (
    <div id="bg-wrapper" data-theme-type={themeType} style={wrapperStyle}>
      {customIsVideo ? (
        <video
          key={custom!.dataUrl}
          id="bg-video"
          src={custom!.dataUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={imgStyle as React.CSSProperties}
        />
      ) : themeVideoUrl ? (
        <video
          key={themeVideoUrl}
          id="bg-video"
          src={themeVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
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
