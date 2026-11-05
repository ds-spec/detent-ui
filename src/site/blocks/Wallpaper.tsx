'use client'

import { GRAIN, paintOf, sheenOf } from '@/site/home/lights'
import type { Tone } from '@/site/home/lights'

export function Wallpaper({ tone = 'blue' }: { tone?: Tone }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" style={{ background: paintOf(tone) }}>
      <span className="absolute -inset-[15%]" style={{ background: `radial-gradient(34% 30% at 66% 26%, ${sheenOf(tone)}, transparent 70%)`, opacity: 0.4 }} />
      <span className="absolute inset-0 opacity-[0.1] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <span className="absolute inset-0 bg-black opacity-0 dark:opacity-45" />
      <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]" />
    </span>
  )
}
