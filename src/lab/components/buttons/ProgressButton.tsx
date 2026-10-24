'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'

/**
 * A button that shows its own work: Deploy, Export, Upload. Press it and it fills with its
 * progress from the left, the label becomes what it's doing and the percentage rolls up beside
 * it; when it's done, the fill clears and it says so. Every label shares one slot sized to the
 * widest, and the percentage has its own fixed slot, so the button never changes width.
 */
export function ProgressButton({
  progress,
  done = false,
  children,
  icon,
  working = 'Deploying',
  finished = 'Deployed',
  onClick,
}: {
  /** How far along, from 0 to 1, while it works; null when it's idle. */
  progress: number | null
  /** The work has finished: it says so until progress goes back to null. */
  done?: boolean
  /** The label while it's idle, e.g. "Deploy". */
  children: ReactNode
  /** An icon before the idle label. */
  icon?: ReactNode
  /** The label while it works. */
  working?: string
  /** The label once it's done. */
  finished?: string
  /** Called when it's pressed while idle. Start the work here. */
  onClick: () => void
}) {
  const busy = progress !== null && !done
  const state = done ? 'done' : busy ? 'busy' : 'idle'
  const pct = `${Math.round((progress ?? 0) * 100)}%`
  const faces: [string, ReactNode][] = [
    [
      'idle',
      <>
        {icon}
        {children}
      </>,
    ],
    [
      'busy',
      <>
        {working}
        <span className="flex w-[3.6ch] justify-end text-[color-mix(in_oklch,var(--surface)_62%,transparent)]">
          <RollingText text={pct} />
        </span>
      </>,
    ],
    [
      'done',
      <>
        <Check size={15} strokeWidth={2.6} />
        {finished}
      </>,
    ],
  ]
  return (
    <motion.button
      type="button"
      whileTap={state === 'idle' ? press : undefined}
      aria-busy={busy || undefined}
      aria-live="polite"
      onPointerDown={() => state === 'idle' && tap()}
      onClick={() => state === 'idle' && onClick()}
      className="sink ring-focus relative inline-flex h-9 select-none items-center overflow-hidden rounded-control bg-ink px-3.5 text-callout font-medium text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.16)]"
    >
      {/* The fill: a lighter band growing from the left with the work. */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 left-0 w-full origin-left bg-[color-mix(in_oklch,var(--surface)_16%,transparent)]"
        initial={false}
        animate={{ scaleX: progress ?? 0, opacity: busy ? 1 : 0 }}
        transition={{ scaleX: { duration: 0.3, ease: 'linear' }, opacity: { duration: 0.3 } }}
      />
      {/* Every face in one slot, the widest setting the width; the current one rolls in. */}
      <span className="relative grid overflow-hidden">
        {faces.map(([key, face], i) => {
          const at = faces.findIndex(([k]) => k === state)
          return (
            <motion.span
              key={key}
              aria-hidden={key !== state}
              className="flex items-center justify-center gap-2 whitespace-nowrap [grid-area:1/1]"
              initial={false}
              animate={{ y: i === at ? '0%' : i < at ? '-110%' : '110%', opacity: i === at ? 1 : 0 }}
              transition={{ duration: 0.24, ease: ease.out }}
            >
              {face}
            </motion.span>
          )
        })}
      </span>
    </motion.button>
  )
}
