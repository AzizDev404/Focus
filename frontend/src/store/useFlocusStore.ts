import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEMES } from '../data/catalog'
import { normalizeClockFont } from '../lib/clockFonts'
import type {
  CustomPlaylist,
  DashboardMode,
  DayStats,
  FlocusSettings,
  FocusArea,
  Panel,
  SoundLayer,
  StatsPeriod,
  Task,
  TimerState,
  UserRole,
} from '../types'
import { pickQuote } from '../data/quotes'
import { todayKey } from '../lib/focusScore'
import { STORAGE_KEYS } from '../lib/auth/constants'
import { hydrateProfileFromCache, readSession, updateSessionProfile } from '../lib/authSessionCache'
import { getUserToken } from '../lib/authStorage'
import type { AuthModalTab, AuthSession, UserProfile } from '../lib/auth/types'
import { syncBreakSession, syncFocusSession, syncTaskComplete } from '../lib/userStatsSync'

const defaultSettings: FlocusSettings = {
  displayName: 'Focus User',
  isPlus: true,
  clockFormat: '12',
  flipClock: false,
  showClockSeconds: false,
  dynamicGreetings: true,
  showGreetings: true,
  clockFont: 'default',
  timerMode: 'pomodoro',
  useTaskEtaTimer: false,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  countdownMinutes: 25,
  autoStart: false,
  showProgressBar: false,
  showNotification: false,
  showStreakCounter: true,
  showTaskInPip: false,
  alertSound: 'chime',
  alertVolume: 0.5,
  staticTally: 'dots',
  dynamicTally: null,
  quoteCategory: 'all',
  showQuotesHome: true,
  showQuotesFocus: true,
  themeHome: 'black',
  themeFocus: 'black',
  customThemes: {},
  disableAnimatedThemes: false,
  clearMode: false,
  preventSleep: false,
  randomizeTheme: false,
  showShareButton: true,
  defaultSettingsTab: 'timer',
  breaksBetweenTasks: 5,
  autoStartBreaks: false,
  showTasksProgressBar: true,
  showTasksCount: true,
  accentColor: '#0369A1',
}

const defaultTimer: TimerState = {
  segment: 'focus',
  secondsLeft: 25 * 60,
  secondsElapsed: 0,
  isRunning: false,
  pomodoroCount: 0,
  currentTaskId: null,
}

interface FlocusStore {
  mode: DashboardMode
  settings: FlocusSettings
  tasks: Task[]
  timer: TimerState
  soundLayers: SoundLayer[]
  activePlaylist: string | null
  customPlaylists: CustomPlaylist[]
  notepad: string
  currentQuote: string
  statsHistory: Record<string, DayStats>
  streak: number
  longestStreak: number
  lastActiveDate: string | null
  panel: Panel
  settingsTab: string
  musicVolume: number
  wakeLock: WakeLockSentinel | null
  showOnboarding: boolean
  userEmail: string
  userRole: UserRole | null
  focusArea: FocusArea | null
  statsPeriod: StatsPeriod
  authModalOpen: boolean
  authModalTab: AuthModalTab
  profile: UserProfile | null
  leaderboardResetToken: number

  setMode: (m: DashboardMode) => void
  setSettings: (partial: Partial<FlocusSettings>) => void
  setPanel: (p: Panel) => void
  setSettingsTab: (t: string) => void
  setNotepad: (t: string) => void
  setQuote: () => void
  setShowOnboarding: (v: boolean) => void
  setUserEmail: (email: string) => void
  setAuth: (user: AuthSession) => void
  clearAuth: () => void
  setUserRole: (role: UserRole) => void
  setFocusArea: (area: FocusArea) => void
  setStatsPeriod: (p: StatsPeriod) => void
  setAuthModalOpen: (v: boolean) => void
  setAuthModalTab: (tab: AuthModalTab) => void
  setProfile: (profile: UserProfile | null) => void
  bumpLeaderboardReset: () => void
  completeOnboarding: () => void
  addTask: (text: string) => void
  updateTask: (id: string, partial: Partial<Task>) => void
  removeTask: (id: string) => void
  reorderTasks: (from: number, to: number) => void
  completeTask: (id: string) => void
  resetTasks: () => void
  setTimer: (partial: Partial<TimerState>) => void
  resetTimer: () => void
  setSoundLayers: (layers: SoundLayer[]) => void
  recordFocusSession: (seconds: number) => void
  recordBreak: (seconds: number) => void
  recordTaskComplete: () => void
  updateStreak: () => void
  getTodayStats: () => DayStats
  exportSettings: () => string
  importSettings: (json: string) => void
  requestWakeLock: () => Promise<void>
  releaseWakeLock: () => void
}

function emptyDay(date: string): DayStats {
  return { date, focusSeconds: 0, breakSeconds: 0, sessions: 0, tasksCompleted: 0 }
}

export const useFlocusStore = create<FlocusStore>()(
  persist(
    (set, get) => ({
      mode: 'home',
      settings: defaultSettings,
      tasks: [],
      timer: defaultTimer,
      soundLayers: [],
      activePlaylist: null,
      customPlaylists: [],
      notepad: '',
      currentQuote: pickQuote('all'),
      statsHistory: {},
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      panel: 'none',
      settingsTab: 'timer',
      musicVolume: 0.5,
      wakeLock: null,
      showOnboarding: true,
      userEmail: '',
      userRole: null,
      focusArea: null,
      statsPeriod: 'week',
      authModalOpen: false,
      authModalTab: 'register',
      profile: null,
      messagesTarget: null,
      leaderboardResetToken: 0,

      setMode: (m) => set({ mode: (m as string) === 'ambient' ? 'home' : m }),
      setSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      setPanel: (p) => set({ panel: p }),
      setSettingsTab: (t) => set({ settingsTab: t }),
      setNotepad: (t) => set({ notepad: t }),
      setQuote: () =>
        set({ currentQuote: pickQuote(get().settings.quoteCategory) }),
      setShowOnboarding: (v) => set({ showOnboarding: v }),
      setUserEmail: (email) => set({ userEmail: email }),
      setAuth: ({ email, displayName }) =>
        set((s) => ({
          userEmail: email,
          settings: { ...s.settings, displayName },
        })),
      clearAuth: () =>
        set((s) => ({
          userEmail: '',
          profile: null,
          settings: { ...s.settings, displayName: 'Focus User' },
        })),
      setUserRole: (role) => set({ userRole: role }),
      setFocusArea: (area) => set({ focusArea: area }),
      setStatsPeriod: (p) => set({ statsPeriod: p }),
      setAuthModalOpen: (v) => set({ authModalOpen: v }),
      setAuthModalTab: (tab) => set({ authModalTab: tab }),
      setProfile: (profile) =>
        set((s) => {
          if (profile && getUserToken()) {
            try {
              updateSessionProfile(profile)
            } catch {
              /* session not ready */
            }
          }
          return {
            profile,
            userEmail: profile?.email ?? s.userEmail,
            settings: profile
              ? { ...s.settings, displayName: profile.displayName }
              : s.settings,
          }
        }),

      openMessagesWith: (peerId, displayName) =>
        set({ messagesTarget: { peerId, displayName }, settingsTab: 'chat' }),

      clearMessagesTarget: () => set({ messagesTarget: null }),

      bumpLeaderboardReset: () =>
        set((s) => ({ leaderboardResetToken: s.leaderboardResetToken + 1 })),

      completeOnboarding: () => set({ showOnboarding: false }),

      addTask: (text) => {
        const { tasks } = get()
        const max = 999
        if (tasks.filter((t) => !t.completed).length >= max) return
        set({
          tasks: [
            ...tasks,
            { id: crypto.randomUUID(), text, completed: false },
          ],
        })
      },

      updateTask: (id, partial) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      reorderTasks: (from, to) =>
        set((s) => {
          const arr = [...s.tasks]
          const [item] = arr.splice(from, 1)
          arr.splice(to, 0, item)
          return { tasks: arr }
        }),

      completeTask: (id) => {
        get().recordTaskComplete()
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completed: true } : t,
          ),
        }))
      },

      resetTasks: () => set({ tasks: [] }),

      setTimer: (partial) =>
        set((s) => ({ timer: { ...s.timer, ...partial } })),

      resetTimer: () => {
        const { settings, tasks } = get()
        const activeTask = tasks.find((t) => !t.completed)
        let secs =
          settings.timerMode === 'countdown'
            ? settings.countdownMinutes * 60
            : settings.focusMinutes
        if (settings.useTaskEtaTimer && activeTask?.etaMinutes) {
          secs = activeTask.etaMinutes * 60
        }
        set({
          timer: {
            ...defaultTimer,
            secondsLeft: secs,
            currentTaskId: activeTask?.id ?? null,
            segment:
              settings.timerMode === 'stopwatch' ? 'stopwatch' : 'focus',
          },
        })
      },

      setSoundLayers: (layers) => {
        set({ soundLayers: layers })
      },

      recordFocusSession: (seconds) => {
        const key = todayKey()
        set((s) => {
          const day = s.statsHistory[key] ?? emptyDay(key)
          return {
            statsHistory: {
              ...s.statsHistory,
              [key]: {
                ...day,
                focusSeconds: day.focusSeconds + seconds,
                sessions: day.sessions + 1,
              },
            },
          }
        })
        get().updateStreak()
        syncFocusSession(seconds)
      },

      recordBreak: (seconds) => {
        const key = todayKey()
        set((s) => {
          const day = s.statsHistory[key] ?? emptyDay(key)
          return {
            statsHistory: {
              ...s.statsHistory,
              [key]: {
                ...day,
                breakSeconds: day.breakSeconds + seconds,
              },
            },
          }
        })
        syncBreakSession(seconds)
      },

      recordTaskComplete: () => {
        const key = todayKey()
        set((s) => {
          const day = s.statsHistory[key] ?? emptyDay(key)
          return {
            statsHistory: {
              ...s.statsHistory,
              [key]: { ...day, tasksCompleted: day.tasksCompleted + 1 },
            },
          }
        })
        syncTaskComplete()
      },

      updateStreak: () => {
        const today = todayKey()
        const { lastActiveDate, streak, longestStreak } = get()
        if (lastActiveDate === today) return
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yKey = yesterday.toISOString().slice(0, 10)
        let newStreak = 1
        if (lastActiveDate === yKey) newStreak = streak + 1
        else if (lastActiveDate === today) newStreak = streak
        set({
          streak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastActiveDate: today,
        })
      },

      getTodayStats: () => {
        const key = todayKey()
        return get().statsHistory[key] ?? emptyDay(key)
      },

      exportSettings: () => {
        const { settings, tasks, statsHistory, streak, notepad, userEmail } = get()
        return JSON.stringify(
          { settings, tasks, statsHistory, streak, notepad, userEmail },
          null,
          2,
        )
      },

      importSettings: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.settings) set({ settings: { ...defaultSettings, ...data.settings } })
          if (data.tasks) set({ tasks: data.tasks })
          if (data.statsHistory) set({ statsHistory: data.statsHistory })
          if (data.streak != null) set({ streak: data.streak })
          if (data.notepad) set({ notepad: data.notepad })
          if (data.userEmail) set({ userEmail: data.userEmail })
        } catch {
          /* */
        }
      },

      requestWakeLock: async () => {
        if (!('wakeLock' in navigator)) return
        try {
          const lock = await navigator.wakeLock.request('screen')
          set({ wakeLock: lock })
        } catch {
          /* */
        }
      },

      releaseWakeLock: () => {
        get().wakeLock?.release()
        set({ wakeLock: null })
      },
    }),
    {
      name: STORAGE_KEYS.persist,
      version: 6,
      migrate: (persisted: unknown, fromVersion) => {
        const p = (persisted ?? {}) as Partial<FlocusStore> & {
          userAddress?: string
          userNickname?: string
        }
        const legacyEmail = p.userEmail?.trim() || p.userAddress?.trim() || ''
        const rawSettings = { ...(p.settings ?? {}), isPlus: true } as Partial<FlocusSettings> & {
          themeAmbient?: string
        }
        if (rawSettings.defaultSettingsTab === 'ambientTheme' || rawSettings.defaultSettingsTab === 'themeAmbient') {
          rawSettings.defaultSettingsTab = 'homeTheme'
        }
        delete rawSettings.themeAmbient
        const next = {
          ...p,
          mode: (p.mode as string) === 'ambient' ? 'home' : p.mode,
          userEmail: legacyEmail,
          settings: rawSettings,
        }
        delete (next as { userAddress?: string }).userAddress
        delete (next as { userNickname?: string }).userNickname
        if (fromVersion < 3 && legacyEmail && !next.settings?.displayName) {
          next.settings = { ...next.settings, displayName: 'Focus User' }
        }
        return next as unknown
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FlocusStore>
        const validIds = new Set(THEMES.map((t) => t.id))
        const persistedSettings = (p.settings ?? {}) as Partial<FlocusSettings>
        const persistedWithLegacy = persistedSettings as Partial<FlocusSettings> & { themeAmbient?: string }
        const sanitizeTheme = <K extends 'themeHome' | 'themeFocus'>(key: K) => {
          const candidate = persistedWithLegacy[key]
          return typeof candidate === 'string' && validIds.has(candidate)
            ? candidate
            : current.settings[key]
        }
        const defaultTab =
          persistedWithLegacy.defaultSettingsTab === 'ambientTheme' ||
          persistedWithLegacy.defaultSettingsTab === 'themeAmbient'
            ? 'homeTheme'
            : persistedWithLegacy.defaultSettingsTab
        const { themeAmbient: _legacyAmbient, ...restPersistedSettings } = persistedWithLegacy
        return {
          ...current,
          ...p,
          mode: (p.mode as string) === 'ambient' ? 'home' : current.mode,
          profile: null,
          settings: {
            ...current.settings,
            ...restPersistedSettings,
            isPlus: true,
            themeHome: sanitizeTheme('themeHome'),
            themeFocus: sanitizeTheme('themeFocus'),
            defaultSettingsTab: defaultTab ?? current.settings.defaultSettingsTab,
            clockFont: normalizeClockFont(persistedSettings.clockFont),
            staticTally:
              persistedSettings.staticTally === 'tomato'
                ? 'dots'
                : (persistedSettings.staticTally ?? current.settings.staticTally),
          },
        }
      },
      onRehydrateStorage: () => (state) => {
        const session = readSession()
        if (session) {
          if (!state?.profile?.id) {
            state?.setProfile(session.profile)
            state?.setAuth({
              email: session.profile.email,
              displayName: session.profile.displayName,
            })
          }
          return
        }
        if (!getUserToken()) {
          state?.clearAuth()
        } else if (!state?.profile) {
          hydrateProfileFromCache(
            (profile) => state?.setProfile(profile),
            (auth) => state?.setAuth(auth),
          )
        }
      },
      partialize: (s) => ({
        settings: s.settings,
        tasks: s.tasks,
        statsHistory: s.statsHistory,
        streak: s.streak,
        longestStreak: s.longestStreak,
        lastActiveDate: s.lastActiveDate,
        notepad: s.notepad,
        customPlaylists: s.customPlaylists,
        showOnboarding: s.showOnboarding,
        userEmail: s.userEmail,
        userRole: s.userRole,
        focusArea: s.focusArea,
        statsPeriod: s.statsPeriod,
        themeIds: {
          home: s.settings.themeHome,
          focus: s.settings.themeFocus,
        },
      }),
    },
  ),
)
