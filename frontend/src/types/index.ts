export type DashboardMode = 'home' | 'focus'

export type Panel = 'none' | 'settings' | 'sounds' | 'tasks' | 'notepad'

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch' | 'animedoro' | '52/17'

export type TimerSegment = 'focus' | 'shortBreak' | 'longBreak' | 'countdown' | 'stopwatch'

export type QuoteCategory = 'all' | 'motivational' | 'inspirational' | 'selfcare' | 'gratitude'

export type ClockFont =
  | 'default'
  | 'minimal'
  | 'minimal-wide'
  | 'serif'
  | 'serif-condensed'
  | 'handwritten'
  | 'pixel'

export type ThemeType = 'gradient' | 'world' | 'animated' | 'solid' | 'custom' | 'youtube'

export interface Theme {
  id: string
  name: string
  type: ThemeType
  plus?: boolean
  gradient?: string
  image?: string
  /** Optional portrait variant used on narrow viewports. */
  mobileImage?: string
  videoUrl?: string
  animated?: boolean
  environment?: string
  brightness?: 'dark' | 'light'
  color?: string
  sourceFile?: string
}

export type StatsPeriod = 'today' | 'week' | 'month'

export type UserRole =
  | 'student'
  | 'professional'
  | 'creator'
  | 'entrepreneur'
  | 'other'

export type FocusArea =
  | 'studying'
  | 'work'
  | 'creative'
  | 'reading'
  | 'other'

export interface Task {
  id: string
  text: string
  completed: boolean
  emoji?: string
  color?: string
  etaMinutes?: number
}

export interface SoundLayer {
  soundId: string
  volume: number
}

export interface CustomPlaylist {
  id: string
  name: string
  url: string
  service: 'spotify' | 'youtube' | 'apple' | 'soundcloud' | 'other'
}

export interface DayStats {
  date: string
  focusSeconds: number
  breakSeconds: number
  sessions: number
  tasksCompleted: number
}

export interface FlocusSettings {
  displayName: string
  isPlus: boolean
  clockFormat: '12' | '24'
  flipClock: boolean
  showClockSeconds: boolean
  dynamicGreetings: boolean
  showGreetings: boolean
  clockFont: ClockFont
  timerMode: TimerMode
  useTaskEtaTimer: boolean
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  countdownMinutes: number
  autoStart: boolean
  showProgressBar: boolean
  showNotification: boolean
  showStreakCounter: boolean
  showTaskInPip: boolean
  alertSound: string
  alertVolume: number
  staticTally: string
  dynamicTally: string | null
  quoteCategory: QuoteCategory
  showQuotesHome: boolean
  showQuotesFocus: boolean
  themeHome: string
  themeFocus: string
  customThemes: Partial<
    Record<
      DashboardMode,
      {
        dataUrl: string
        opacity: number
        scale?: number
        posX?: number
        posY?: number
      }
    >
  >
  disableAnimatedThemes: boolean
  clearMode: boolean
  preventSleep: boolean
  randomizeTheme: boolean
  showShareButton: boolean
  defaultSettingsTab: string
  breaksBetweenTasks: number
  autoStartBreaks: boolean
  showTasksProgressBar: boolean
  showTasksCount: boolean
  accentColor: string
  sideRailPosition: SideRailPosition
}

export interface TimerState {
  segment: TimerSegment
  secondsLeft: number
  secondsElapsed: number
  isRunning: boolean
  pomodoroCount: number
  currentTaskId: string | null
}

export interface MessagesTarget {
  peerId: number
  displayName: string
}

export type SideRailPosition = 'left' | 'right' | 'bottom'
