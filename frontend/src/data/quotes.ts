import type { QuoteCategory } from '../types'

export const QUOTES: Record<Exclude<QuoteCategory, 'all'>, string[]> = {
  motivational: [
    'Success all depends on the second letter.',
    'The secret of getting ahead is getting started.',
    'Focus on being productive instead of busy.',
    'Small steps every day lead to big changes.',
    'You don\'t have to be great to start, but you have to start to be great.',
  ],
  inspirational: [
    'The only way to do great work is to love what you do.',
    'Believe you can and you\'re halfway there.',
    'Your limitation is only your imagination.',
    'Dream bigger. Do bigger.',
    'Great things never come from comfort zones.',
  ],
  selfcare: [
    'Rest is not a reward — it\'s a requirement.',
    'Be gentle with yourself. You\'re doing the best you can.',
    'Taking care of yourself is productive.',
    'Pause. Breathe. Reset.',
    'You are allowed to be both a masterpiece and a work in progress.',
  ],
  gratitude: [
    'Gratitude turns what we have into enough.',
    'Joy is the simplest form of gratitude.',
    'Start each day with a grateful heart.',
    'The more grateful I am, the more beauty I see.',
    'Happiness is not by chance, but by choice.',
  ],
}

export function pickQuote(category: QuoteCategory): string {
  const pool =
    category === 'all'
      ? Object.values(QUOTES).flat()
      : QUOTES[category]
  return pool[Math.floor(Math.random() * pool.length)]
}
