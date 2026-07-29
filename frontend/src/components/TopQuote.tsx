import { AnimatePresence, motion } from 'framer-motion'
import { useFlocusStore } from '../store/useFlocusStore'

export function TopQuote() {
  const quote = useFlocusStore((s) => s.currentQuote)
  const settings = useFlocusStore((s) => s.settings)
  const mode = useFlocusStore((s) => s.mode)

  const show =
    (mode === 'home' && settings.showQuotesHome) ||
    (mode === 'focus' && settings.showQuotesFocus)

  if (!show) return null

  return (
    <text-quote className={`top-quote ${mode === 'focus' ? 'quote-focus' : 'quote-home'}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={quote}
          className="content"
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {quote}
        </motion.span>
      </AnimatePresence>
    </text-quote>
  )
}
