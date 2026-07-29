import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 2,
}

/** Music / Sounds — from flocus-sounds button */
export function IconMusic(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}

/** Tasks / priorities */
export function IconTasks(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
    </svg>
  )
}

/** Notepad */
export function IconNotepad(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="m15.232 5.232 3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

/** More menu — vertical dots (opens settings panel) */
export function IconMore(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <circle cx="12" cy="5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Settings gear */
export function IconSettings(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
  )
}

/** Account / profile */
export function IconAccount(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  )
}

/** Fullscreen */
/** Share / gift — from shared bottom-right button */
export function IconShare(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      {...rest}
    >
      <path d="M9 5.25v11M3.75 3.5c0-.966.784-1.75 1.75-1.75 2.589 0 3.5 3.5 3.5 3.5H5.5A1.75 1.75 0 0 1 3.75 3.5M12.5 5.25H9s.911-3.5 3.5-3.5a1.75 1.75 0 0 1 0 3.5M14.25 8.25v6a2 2 0 0 1-2 2h-6.5a2 2 0 0 1-2-2v-6" />
      <rect width={14.5} height={3} x={1.75} y={5.25} rx={1} ry={1} />
    </svg>
  )
}

export function IconExpand(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0-5 5M4 16v4m0 0h4m-4 0 5-5m11 5-5-5m5 5v-4m0 4h-4" />
    </svg>
  )
}

export function IconClose(props: IconProps) {
  const { size = 12, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M6 6l12 12M18 6 6 18" strokeWidth={2.5} />
    </svg>
  )
}

export function IconAmbient(props: IconProps) {
  const { size = 36, ...rest } = props
  return (
    <svg
      data-mode="ambient"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      data-clickable
      aria-hidden
      {...rest}
    >
      <path d="M18.7612 27C17.4629 26.8575 16.224 26.5092 15.0444 25.955C13.8648 25.4008 12.8317 24.6488 11.945 23.6987C11.0583 22.7487 10.3498 21.6206 9.81937 20.3144C9.28896 19.0081 9.01583 17.5396 9 15.9088C10.52 15.9246 11.8817 16.174 13.085 16.6569C14.2883 17.1398 15.3096 17.8444 16.1487 18.7706C16.9879 19.6969 17.6331 20.8488 18.0844 22.2262C18.5356 23.6038 18.7612 25.195 18.7612 27ZM18.4762 19.685C18.0171 18.8933 17.55 18.2442 17.075 17.7375C16.6 17.2308 15.9429 16.7083 15.1037 16.17C15.1671 15.4733 15.2977 14.7569 15.4956 14.0206C15.6935 13.2844 15.9429 12.56 16.2438 11.8475C16.5446 11.135 16.885 10.4462 17.265 9.78125C17.645 9.11625 18.0487 8.5225 18.4762 8C18.9037 8.5225 19.3115 9.11229 19.6994 9.76937C20.0873 10.4265 20.4356 11.1231 20.7444 11.8594C21.0531 12.5956 21.3065 13.3398 21.5044 14.0919C21.7023 14.844 21.8329 15.5763 21.8962 16.2887C21.1996 16.6054 20.5583 17.0725 19.9725 17.69C19.3867 18.3075 18.8879 18.9725 18.4762 19.685ZM20.1862 26.6437C20.1388 25.6304 20.0437 24.6488 19.9012 23.6987C19.7587 22.7487 19.5529 21.9254 19.2837 21.2288C19.9646 19.6929 21.0967 18.4065 22.68 17.3694C24.2633 16.3323 26.0367 15.8296 28 15.8612C27.8733 18.7113 27.1292 21.0427 25.7675 22.8556C24.4058 24.6685 22.5454 25.9312 20.1862 26.6437Z" />
    </svg>
  )
}

export function IconHome(props: IconProps) {
  const { size = 36, ...rest } = props
  return (
    <svg
      data-mode="home"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="-6 -6 36 36"
      data-clickable
      tabIndex={0}
      aria-hidden
      {...rest}
    >
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
}

export function IconFocus(props: IconProps) {
  const { size = 36, ...rest } = props
  return (
    <svg
      data-mode="focus"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="-6 -6 36 36"
      data-clickable
      tabIndex={0}
      aria-hidden
      {...rest}
    >
      <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
    </svg>
  )
}

// Legacy aliases used elsewhere
export { IconMusic as IconVolume }

export function IconChevronDown(props: IconProps) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...STROKE} {...rest}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconReset(props: IconProps) {
  const { size, ...rest } = props
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

export function IconPip(props: IconProps) {
  const { size, ...rest } = props
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18v14H3V5z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 11h6v6h-6v-6z"
        fill="currentColor"
      />
    </svg>
  )
}
