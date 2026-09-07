export const FOCUS_APP_URL =
  import.meta.env.VITE_FOCUS_APP_URL ??
  (import.meta.env.PROD ? '/app' : 'http://localhost:5173/app')
