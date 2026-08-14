import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthSession } from './hooks/useAuthSession'
import { useLocationSync } from './lib/locationSync'
import { Background } from './components/Background'
import { SideRail } from './components/SideRail'
import { FocusView } from './components/modes/FocusView'
import { HomeView } from './components/modes/HomeView'
import { OnboardingModal } from './components/OnboardingModal'
import { AuthModal } from './components/account/AccountAuthPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { PromoBanner } from './components/PromoBanner'
import { FlocusLogo } from './components/FlocusLogo'
import { TopQuote } from './components/TopQuote'
import { audioEngine } from './lib/howlerAudio'
import { THEMES } from './data/catalog'
import { useFlocusStore } from './store/useFlocusStore'
import { clockFontDataAttr } from './lib/clockFonts'
import { useWorkspaceSync } from './hooks/useWorkspaceSync'
import './styles/app.css'
import './styles/ui-polish.css'
import './styles/account-auth.css'

const modeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function App() {
  useAuthSession()
  useWorkspaceSync()
  useLocationSync()
  const mode = useFlocusStore((s) => s.mode)
  const panel = useFlocusStore((s) => s.panel)
  const settings = useFlocusStore((s) => s.settings)
  const setSettings = useFlocusStore((s) => s.setSettings)
  const setPanel = useFlocusStore((s) => s.setPanel)

  useEffect(() => {
    document.body.setAttribute('data-dashboard-mode', mode)
    document.body.setAttribute('data-clear-mode', settings.clearMode ? 'on' : 'off')
    document.body.setAttribute('data-font', clockFontDataAttr(settings.clockFont))
    document.body.classList.add('flocus-is-plus')
  }, [mode, settings.clearMode, settings.clockFont])

  useEffect(() => {
    const accent = settings.accentColor || '#0369A1'
    const lightAccent = `color-mix(in srgb, ${accent} 60%, #ffffff 40%)`
    // Native flocus-native.css declares many of these tokens on the `body`
    // selector (e.g. --fl-gradientBottom-color), so setting them on :root has
    // lower proximity and gets overridden. We mirror them on document.body so
    // they win for every dependent rule.
    const targets = [document.documentElement, document.body]
    const vars: Array<[string, string]> = [
      ['--fl-accent-color', accent],
      ['--bs-purple', accent],
      ['--bs-primary', accent],
      ['--fl-flip-bg-color', accent],
      ['--fl-ctrl-accent', accent],
      ['--fl-gradientBottom-color', accent],
      ['--fl-gradientTop-color', lightAccent],
    ]
    for (const el of targets) {
      for (const [k, v] of vars) el.style.setProperty(k, v)
    }
  }, [settings.accentColor])

  useEffect(() => {
    if (settings.preventSleep) void useFlocusStore.getState().requestWakeLock()
  }, [settings.preventSleep])

  useEffect(() => {
    if (!settings.randomizeTheme) return
    const pool = THEMES.filter((t) => t.type !== 'animated' || !settings.disableAnimatedThemes)
    if (!pool.length) return
    const pick = pool[Math.floor(Math.random() * pool.length)].id
    setSettings({ themeHome: pick, themeFocus: pick })
  }, [])

  useEffect(() => {
    const id = setInterval(() => useFlocusStore.getState().setQuote(), 1000 * 60 * 15)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const unlock = () => audioEngine.unlock()
    document.addEventListener('pointerdown', unlock, { once: true })
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  // Paint the WebKit slider track with a purple progress fill that follows
  // the current value. Without this hook the gradient sits at a static 50 %
  // because CSS can't read an input's value.
  useEffect(() => {
    const refreshFill = (el: HTMLInputElement) => {
      const min = Number(el.min || 0)
      const max = Number(el.max || 100)
      const value = Number(el.value)
      if (Number.isNaN(value) || max === min) return
      const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
      el.style.setProperty('--range-fill', `${pct}%`)
    }

    const refreshAll = () => {
      document
        .querySelectorAll<HTMLInputElement>('input[type="range"].form-range')
        .forEach(refreshFill)
    }

    const onInput = (e: Event) => {
      const target = e.target
      if (
        target instanceof HTMLInputElement &&
        target.type === 'range' &&
        target.classList.contains('form-range')
      ) {
        refreshFill(target)
      }
    }

    document.addEventListener('input', onInput, true)
    document.addEventListener('change', onInput, true)
    const initial = window.setTimeout(refreshAll, 0)
    // Re-paint whenever the settings panel (or any other surface containing
    // sliders) is mounted by React. The observer is cheap because it only
    // reacts to subtree changes, not every frame.
    const observer = new MutationObserver(refreshAll)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('change', onInput, true)
      clearTimeout(initial)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panel !== 'none') setPanel('none')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, setPanel])

  return (
    <>
      <PromoBanner />
      <div id="dashboard">
        <Background mode={mode} />
        <OnboardingModal />
        <AuthModal />

        <div id="top">
          <div id="top-left">
            <FlocusLogo />
          </div>
          <div id="top-right">
            <TopQuote />
          </div>
        </div>

        <div className="hero">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              variants={modeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="hero-content"
            >
              {mode === 'home' && <HomeView />}
              {mode === 'focus' && <FocusView />}
            </motion.div>
          </AnimatePresence>
        </div>

        <SideRail />

        <settings-panel
          className={`flocus-is-plus${panel === 'settings' ? ' show' : ''} settings-panel--position-${settings.sideRailPosition ?? 'left'}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPanel('none')
          }}
        >
          {panel === 'settings' && <SettingsPanel />}
        </settings-panel>
      </div>
    </>
  )
}
