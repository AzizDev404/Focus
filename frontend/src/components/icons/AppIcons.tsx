import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { size?: number }

const BASE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Svg({ size = 22, children, ...rest }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...BASE} {...rest}>
      {children}
    </svg>
  )
}

/** Ambient — 4-point sparkle, geometric centre at (12, 12) with equal arms. */
export function IconSparkle(props: Props) {
  return (
    <Svg {...props}>
      <path d="M12 4.5C12 10 14 12 19.5 12 14 12 12 14 12 19.5 12 14 10 12 4.5 12 10 12 12 10 12 4.5Z" />
    </Svg>
  )
}

/** Home — minimalist house with door. */
export function IconHouse(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10.5V19a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 4 0v5h3.5a1 1 0 0 0 1-1v-8.5" />
    </Svg>
  )
}

/** Focus — classic lightbulb (idea / focus). */
export function IconLamp(props: Props) {
  return (
    <Svg {...props}>
      <path d="M12 3a6 6 0 0 0-3 11v3h6v-3a6 6 0 0 0-3-11Z" />
      <path d="M10 20h4" />
      <path d="M10.5 22h3" />
    </Svg>
  )
}
