import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

export { BRIDGE } from './bridge'

export const LAYER = 760

export type Card = { id: string; line: string; paint: string; sheen: string; dot: string; emblem: ReactNode }

const field = (hi: string, body: string, deep: string, blush: string, base: string) =>
  [
    `radial-gradient(70% 55% at 78% 8%, ${hi} 0%, transparent 62%)`,
    `radial-gradient(60% 50% at 12% 30%, ${blush} 0%, transparent 70%)`,
    `radial-gradient(90% 70% at 20% 100%, ${deep} 0%, transparent 65%)`,
    `radial-gradient(80% 60% at 60% 55%, ${body} 0%, transparent 75%)`,
    base,
  ].join(', ')

const EMBLEM_PROMPT = (
  <svg viewBox="0 0 200 120" className="w-[148px]" aria-hidden>
    <rect x="10" y="38" width="180" height="48" rx="24" fill="none" stroke="white" strokeWidth="4" />
    <circle cx="164" cy="62" r="15" fill="white" />
    <path d="M164 70V55M157.5 60.5 164 54l6.5 6.5" fill="none" stroke="#1430c8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="32" y="54" width="3.5" height="16" rx="1.75" fill="white" />
  </svg>
)
const EMBLEM_ACTIVITY = (
  <svg viewBox="0 0 200 120" className="w-[148px]" aria-hidden>
    {[0, 1, 2].map((k) => (
      <g key={k} transform={`translate(0 ${6 + k * 38})`}>
        <circle cx="20" cy="16" r="10" fill={k === 1 ? 'none' : 'white'} stroke="white" strokeWidth="4" />
        <rect x="42" y="7" width={[86, 64, 74][k]} height="8" rx="4" fill="white" />
        <rect x="42" y="21" width={[120, 104, 96][k]} height="6" rx="3" fill="white" opacity="0.45" />
        <rect x="166" y="9" width="22" height="6" rx="3" fill="white" opacity="0.45" />
      </g>
    ))}
  </svg>
)
const EMBLEM_METRIC = (
  <svg viewBox="0 0 200 120" className="w-[124px]" aria-hidden>
    {[44, 68, 92, 116].map((h, k) => (
      <rect key={h} x={22 + k * 44} y={118 - h} width="26" height={h} rx="13" fill="white" opacity={k < 2 ? 1 : 0.32} />
    ))}
  </svg>
)
const EMBLEM_VOICE = (
  <svg viewBox="0 0 200 120" className="w-[148px]" aria-hidden>
    {[20, 46, 78, 104, 64, 96, 50, 28, 14].map((h, k) => (
      <rect key={k} x={12 + k * 21} y={60 - h / 2} width="10" height={h} rx="5" fill="white" />
    ))}
  </svg>
)

export const CARDS: Card[] = [
  { id: 'prompt', line: 'Grows as you type, stops mid-answer', paint: field('#b9d0ff', '#4d78ff', '#0d22b0', '#7d8cff', 'linear-gradient(165deg, #3f6dff, #1631cc)'), sheen: '#d9e5ff', dot: '#3f6dff', emblem: EMBLEM_PROMPT },
  { id: 'models', line: 'Choose the model, and how hard it thinks', paint: field('#ffe0b0', '#ff9a3c', '#b84300', '#ffb3a0', 'linear-gradient(165deg, #ff9a3a, #d85a08)'), sheen: '#fff0d8', dot: '#f5821f', emblem: EMBLEM_ACTIVITY },
  { id: 'voicenote', line: 'A voice reply you can read along with', paint: field('#ddd2ff', '#8466ff', '#3519b8', '#c5a8ff', 'linear-gradient(165deg, #7c5cff, #4426d0)'), sheen: '#efe8ff', dot: '#7c5cff', emblem: EMBLEM_VOICE },
  { id: 'metric', line: 'The number, and why it moved', paint: field('#ffd0de', '#f5568c', '#a3164b', '#ffb0c4', 'linear-gradient(165deg, #f4588d, #c02158)'), sheen: '#ffe6ee', dot: '#ec4f86', emblem: EMBLEM_METRIC },
]

const wideQuery = '(min-width: 1024px)'
export const useWide = () =>
  useSyncExternalStore(
    (f) => {
      const m = matchMedia(wideQuery)
      m.addEventListener('change', f)
      return () => m.removeEventListener('change', f)
    },
    () => matchMedia(wideQuery).matches,
    () => true,
  )

export const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

export type Tone = 'blue' | 'amber' | 'violet' | 'rose'
export const TONES: Tone[] = ['blue', 'violet', 'rose', 'amber']
const BY_TONE: Record<Tone, Card> = { blue: CARDS[0], amber: CARDS[1], violet: CARDS[2], rose: CARDS[3] }
export const paintOf = (t: Tone) => BY_TONE[t].paint
export const sheenOf = (t: Tone) => BY_TONE[t].sheen
