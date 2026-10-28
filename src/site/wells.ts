import type { Tone } from './home/lights'

/*
 * The well a part runs in on its page. In light it's paper with the part's light gathered in one
 * corner and the next one's wash opposite. In dark it's monochrome: near-black with a soft light
 * falling from above, so colour belongs to the part alone and never turns muddy on black.
 */

const HUES: Record<Tone, string> = { blue: '#4a72ff', violet: '#8a63ff', rose: '#f2558a', amber: '#ff9a3c' }
const NEXT: Record<Tone, Tone> = { blue: 'violet', violet: 'rose', rose: 'amber', amber: 'blue' }

export const wellOf = (t: Tone) =>
  `var(--well-glow), radial-gradient(70% 80% at 100% 0%, color-mix(in oklch, ${HUES[t]} var(--well-tint), transparent) 0%, transparent 64%), radial-gradient(70% 70% at 0% 100%, color-mix(in oklch, ${HUES[NEXT[t]]} calc(var(--well-tint) * 0.55), transparent) 0%, transparent 68%), var(--well)`
