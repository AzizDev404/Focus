import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FocusArea, UserRole } from '../types'
import { useFlocusStore } from '../store/useFlocusStore'
import { useOpenAuthModal } from '../hooks/useAuthSession'

const ROLES: { id: UserRole; label: string; emoji: string }[] = [
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'creator', label: 'Creator', emoji: '🎨' },
  { id: 'entrepreneur', label: 'Entrepreneur', emoji: '🚀' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

const FOCUS_AREAS: { id: FocusArea; label: string; emoji: string }[] = [
  { id: 'studying', label: 'Studying', emoji: '📚' },
  { id: 'work', label: 'Work', emoji: '💻' },
  { id: 'creative', label: 'Creative', emoji: '🖌️' },
  { id: 'reading', label: 'Reading', emoji: '📖' },
  { id: 'other', label: 'Other', emoji: '🌙' },
]

export function OnboardingModal() {
  const showOnboarding = useFlocusStore((s) => s.showOnboarding)
  const setUserRole = useFlocusStore((s) => s.setUserRole)
  const setFocusArea = useFlocusStore((s) => s.setFocusArea)
  const completeOnboarding = useFlocusStore((s) => s.completeOnboarding)
  const openAuth = useOpenAuthModal()
  const FLOCUS_PRIMARY = useFlocusStore((s) => s.settings.accentColor) || '#7432FF'

  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [selectedArea, setSelectedArea] = useState<FocusArea | null>(null)

  if (!showOnboarding) return null

  const openRegister = () => {
    completeOnboarding()
    openAuth('register')
  }

  const openLogin = () => {
    completeOnboarding()
    openAuth('login')
  }

  const finish = () => {
    if (selectedRole) setUserRole(selectedRole)
    if (selectedArea) setFocusArea(selectedArea)
    completeOnboarding()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flocus-offcanvas w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div className="mb-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= step ? FLOCUS_PRIMARY : 'rgba(255,255,255,0.15)' }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-degular-semibold)' }}>
                Welcome to Focus
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Build your workspace and sync your progress.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openRegister}
                  className="rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ background: FLOCUS_PRIMARY }}
                >
                  Create free account
                </button>
                <button
                  type="button"
                  onClick={openLogin}
                  className="rounded-xl border border-white/20 py-2.5 text-sm text-white/80 hover:bg-white/10"
                >
                  I already have an account
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-white/50 hover:text-white"
                >
                  Continue as guest
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="role" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h2 className="text-xl font-bold text-white">What best describes you?</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`rounded-xl p-3 text-left text-sm ${
                      selectedRole === r.id ? 'ring-2' : 'bg-white/5 hover:bg-white/10'
                    }`}
                    style={
                      selectedRole === r.id
                        ? {
                            background: `${FLOCUS_PRIMARY}33`,
                            boxShadow: `0 0 0 2px ${FLOCUS_PRIMARY}`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <p className="mt-1 text-white">{r.label}</p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!selectedRole}
                onClick={() => setStep(2)}
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: FLOCUS_PRIMARY }}
              >
                Next
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="focus" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h2 className="text-xl font-bold text-white">What do you want to focus on?</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {FOCUS_AREAS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedArea(a.id)}
                    className={`rounded-xl p-3 text-left text-sm ${
                      selectedArea === a.id ? 'ring-2' : 'bg-white/5 hover:bg-white/10'
                    }`}
                    style={
                      selectedArea === a.id
                        ? {
                            background: `${FLOCUS_PRIMARY}33`,
                            boxShadow: `0 0 0 2px ${FLOCUS_PRIMARY}`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <p className="mt-1 text-white">{a.label}</p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!selectedArea}
                onClick={finish}
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: FLOCUS_PRIMARY }}
              >
                Get started
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step > 0 && step < 2 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mt-3 text-xs text-white/40 hover:text-white"
          >
            Back
          </button>
        )}
      </motion.div>
    </div>
  )
}
