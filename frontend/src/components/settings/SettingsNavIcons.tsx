/**
 * Settings nav icons — single-stroke line set drawn from scratch.
 * Different visual language from the previous dual-fill/stroke icons.
 *
 * The three Theme sub-tabs deliberately reuse the side-rail icons so the
 * settings entries visually match the navigation buttons they configure.
 */

import type { ReactNode, SVGProps } from 'react'
import { IconHouse, IconLamp } from '../icons/AppIcons'

type Props = SVGProps<SVGSVGElement>

const BASE: Props = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function Svg({ children, ...rest }: Props & { children: ReactNode }) {
  return (
    <svg {...BASE} {...rest}>
      {children}
    </svg>
  )
}

export function SettingsNavIcon({ name }: { name: string }) {
  switch (name) {
    /* Themes group header — paint-palette swatches. */
    case 'themes':
      return (
        <Svg>
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-1 1.2-1.95-.4-.8.2-1.8 1.1-1.8H17a5 5 0 0 0 5-5 9 9 0 0 0-10-9.25Z" />
          <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="11" cy="7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
        </Svg>
      )

    /* Home theme — reuse side-rail Home icon. */
    case 'homeTheme':
      return <IconHouse size={18} strokeWidth={1.6} />

    /* Focus theme — reuse side-rail Focus (lightbulb) icon. */
    case 'focusTheme':
      return <IconLamp size={18} strokeWidth={1.6} />

    /* Focus timer — stopwatch with crown stem. */
    case 'timer':
      return (
        <Svg>
          <path d="M10 2h4" />
          <path d="M12 2v3" />
          <path d="M18 6l1.5-1.5" />
          <circle cx="12" cy="14" r="7.5" />
          <path d="M12 10v4l2.5 1.5" />
        </Svg>
      )

    /* Clock — face with 12/3/6/9 ticks. */
    case 'clock':
      return (
        <Svg>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
          <path d="M12 3v1" />
          <path d="M12 20v1" />
          <path d="M3 12h1" />
          <path d="M20 12h1" />
        </Svg>
      )

    /* Stats — bar chart (varied heights). */
    case 'stats':
      return (
        <Svg>
          <path d="M3 21h18" />
          <rect x="5" y="13" width="3" height="6" rx="0.8" />
          <rect x="10.5" y="9" width="3" height="10" rx="0.8" />
          <rect x="16" y="5" width="3" height="14" rx="0.8" />
        </Svg>
      )

    /* Quotes — single quote bubble with mark. */
    case 'quotes':
      return (
        <Svg>
          <path d="M4 19V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-3.5 3a.5.5 0 0 1-.85-.35V19" />
          <path d="M8 11c0-1.4 1-2.4 2.4-2.4M14 11c0-1.4 1-2.4 2.4-2.4" />
          <path d="M9.5 9v3.5h-2v-2" />
          <path d="M15.5 9v3.5h-2v-2" />
        </Svg>
      )

    /* Extras — sparkles / magic wand stars. */
    case 'extras':
      return (
        <Svg>
          <path d="m6 5 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
          <path d="m18 14 1.2 2.4L21.6 17.6 19.2 18.8 18 21.2 16.8 18.8 14.4 17.6 16.8 16.4Z" />
          <path d="m13 4 .7 1.4L15.1 6.1 13.7 6.8 13 8.2 12.3 6.8 10.9 6.1 12.3 5.4Z" />
        </Svg>
      )

    /* Profile — person bust inside circle. */
    case 'profile':
      return (
        <Svg>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="3" />
          <path d="M5.5 19a7 7 0 0 1 13 0" />
        </Svg>
      )

    /* Magazine — shopping bag. */
    case 'magazine':
      return (
        <Svg>
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" />
          <path d="M10 12h0M14 12h0" />
        </Svg>
      )

    /* Achievements — trophy cup. */
    case 'achievements':
      return (
        <Svg>
          <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
          <path d="M16 6h2a2 2 0 0 1-2 2M8 6H6a2 2 0 0 0 2 2" />
          <path d="M12 11v4M9 19h6M10 15h4" />
        </Svg>
      )

    /* Collection — stacked cards. */
    case 'collection':
      return (
        <Svg>
          <rect x="5" y="7" width="10" height="12" rx="1.5" />
          <path d="M9 5h8a2 2 0 0 1 2 2v10" />
        </Svg>
      )

    case 'leaderboard':
      return (
        <Svg>
          <path d="M4 20h16" />
          <rect x="6" y="12" width="3" height="6" rx="0.8" />
          <rect x="10.5" y="9" width="3" height="9" rx="0.8" />
          <rect x="15" y="6" width="3" height="12" rx="0.8" />
        </Svg>
      )

    case 'chat':
    case 'chats':
    case 'messages':
      return (
        <Svg>
          <path d="M4 18V7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-1z" />
          <path d="M10 10h7a2 2 0 0 1 2 2v7l-3-2h-6a2 2 0 0 1-2-2v-1" />
        </Svg>
      )

    case 'mail':
      return (
        <Svg>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="m4 8 8 6 8-6" />
        </Svg>
      )

    /* Support — speech bubble with question mark. */
    case 'support':
      return (
        <Svg>
          <path d="M4 19V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-3.5 3a.5.5 0 0 1-.85-.35V19" />
          <path d="M10 10a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.6" />
          <circle cx="12" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
        </Svg>
      )

    /* What's new — gift box with bow. */
    case 'whatsnew':
      return (
        <Svg>
          <rect x="3" y="9" width="18" height="12" rx="1.5" />
          <path d="M3 13h18" />
          <path d="M12 9v12" />
          <path d="M12 9c-2.5 0-4-1.2-4-2.5S9 4 10 5s2 4 2 4Z" />
          <path d="M12 9c2.5 0 4-1.2 4-2.5S15 4 14 5s-2 4-2 4Z" />
        </Svg>
      )

    default:
      return null
  }
}
