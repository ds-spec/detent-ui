import type { Tone } from './home/lights'

const HUES: Record<Tone, string> = { blue: '#4a72ff', violet: '#8a63ff', rose: '#f2558a', amber: '#ff9a3c' }
const NEXT: Record<Tone, Tone> = { blue: 'violet', violet: 'rose', rose: 'amber', amber: 'blue' }

export const wellOf = (t: Tone) =>
  `var(--well-glow), radial-gradient(70% 80% at 100% 0%, color-mix(in oklch, ${HUES[t]} var(--well-tint), transparent) 0%, transparent 64%), radial-gradient(70% 70% at 0% 100%, color-mix(in oklch, ${HUES[NEXT[t]]} calc(var(--well-tint) * 0.55), transparent) 0%, transparent 68%), var(--well)`
