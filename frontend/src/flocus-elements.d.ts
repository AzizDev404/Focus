import type { ButtonHTMLAttributes, HTMLAttributes, RefAttributes } from 'react'

type FlocusEl = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'flocus-sounds': FlocusEl
      'settings-panel': FlocusEl
      'daily-streaks': ButtonHTMLAttributes<HTMLButtonElement>
      'text-quote': FlocusEl
      'flocus-priorities': FlocusEl
      'flocus-notepad': FlocusEl
      'flocus-listgroup': FlocusEl
      'flocus-listitem': FlocusEl
      'plus-badge': FlocusEl
      'pomodoro-timer': FlocusEl & { 'data-mode'?: string }
    }
  }
}
