'use client'

import { useBench } from './bench'
import { Prism } from '../components/prism/Prism'

export function PrismDemo() {
  const b = useBench()
  return (
    <div className="flex w-[860px] max-w-full flex-col items-center px-10 py-20 text-center">
      <span className="flex h-7 items-center gap-2 rounded-full bg-surface-2 px-3 text-footnote text-ink-2">
        <span className="size-1.5 rounded-full bg-accent" />
        Calm 2.0 is here
      </span>
      <Prism className="mt-7 max-w-[760px] text-[76px] font-semibold leading-[0.98] tracking-[-0.045em] text-ink" intensity={b.get('intensity', 1)} spread={b.get('spread', 1)} elevation={b.get('elevation', 1)}>
        Software that stays calm
      </Prism>
      <p className="mt-7 max-w-[460px] text-lead text-ink-3">Calm watches every release and rolls it back before anyone notices something went wrong.</p>
      <div className="mt-9 flex gap-3">
        <span className="flex h-11 items-center rounded-full bg-ink px-5 text-callout font-medium text-surface">Start for free</span>
        <span className="flex h-11 items-center rounded-full bg-surface-2 px-5 text-callout font-medium text-ink">Read the docs</span>
      </div>
    </div>
  )
}
