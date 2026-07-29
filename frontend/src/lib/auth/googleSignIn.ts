// Google Identity Services loader. The script is lightweight and idempotent —
// repeated calls await the same promise.

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let loader: Promise<void> | null = null

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (resp: { credential: string }) => void
            auto_select?: boolean
            ux_mode?: 'popup' | 'redirect'
            context?: 'signin' | 'signup' | 'use'
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'small' | 'medium' | 'large'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: number | string
            },
          ) => void
          prompt: () => void
          cancel: () => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.google?.accounts?.id) return Promise.resolve()
  if (loader) return loader

  loader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('GIS load failed')))
      if (window.google?.accounts?.id) resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('GIS load failed'))
    document.head.appendChild(script)
  })

  return loader
}
