'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Play, Stop } from '../../icons'
import { tap } from '../../lib/feel'
import { press } from '../../lib/motion'
import { Kbd } from '../../ui/Kbd'
import { Morph } from '../../ui/Morph'
import { RollingText } from '../../ui/RollingText'
import { Bloom, DrawnCheck } from '../../ui/Outcome'

export type RunState = 'idle' | 'running' | 'stopped' | 'done'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function Well({ progress, children }: { progress?: number; children: React.ReactNode }) {
  return (
    <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.12] dark:bg-black/[0.08]">
      {progress !== undefined && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
          <motion.circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" initial={false} animate={{ pathLength: Math.max(0.03, progress) }} transition={{ type: 'spring', stiffness: 90, damping: 22 }} />
        </svg>
      )}
      {children}
    </span>
  )
}

export function RunButton({
  state,
  progress,
  step,
  index,
  total,
  seconds,
  onRun,
  onStop,
  onResume,
  label = 'Run agent',
}: {
  state: RunState
  progress: number
  step: string
  index: number
  total: number
  seconds: number
  onRun: () => void
  onStop: () => void
  onResume: () => void
  label?: string
}) {
  const views = {
    idle: (
      <span className="flex h-14 items-center gap-3 pl-2 pr-4 text-headline">
        <Well>
          <Play size={15} />
        </Well>
        {label}
        <Kbd onInk>⌘↵</Kbd>
      </span>
    ),
    running: (
      <span className="flex h-14 w-[318px] items-center gap-3 pl-2 pr-5">
        <span className="sr-only">Stop the run: </span>
        <Well progress={progress}>
          <Stop size={12} />
        </Well>
        <span className="min-w-0 flex-1 text-left">
          <span className="relative block h-5 overflow-hidden text-headline">
            <AnimatePresence initial={false}>
              <motion.span key={step} className="absolute inset-0 truncate" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
                {step}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="tnum flex text-caption opacity-70">
            Step&nbsp;
            <RollingText text={String(index)} />
            &nbsp;of {total}
          </span>
        </span>
        <span className="tnum flex text-callout opacity-70">
          <RollingText text={clock(seconds)} />
        </span>
      </span>
    ),
    stopped: (
      <span className="flex h-14 w-[318px] items-center gap-3 pl-5 pr-2">
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-caption text-ink-3">Stopped at step {index}</span>
          <span className="block truncate text-headline text-ink">{step}</span>
        </span>
        <span className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-callout font-medium text-surface">
          <Play size={12} />
          Resume
        </span>
      </span>
    ),
    done: (
      <span className="flex h-14 items-center gap-3 pl-2 pr-5 text-headline">
        <motion.span className="flex size-10 items-center justify-center rounded-full bg-ok text-white" initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.5 }}>
          <DrawnCheck size={17} strokeWidth={2.6} delay={0.18} />
        </motion.span>
        Done in <span className="tnum">{clock(seconds)}</span>
      </span>
    ),
  }
  const act = state === 'idle' ? onRun : state === 'running' ? onStop : state === 'stopped' ? onResume : onRun
  return (
    <motion.button type="button" data-invite whileTap={press} onPointerDown={tap} onClick={act} className="sink ring-focus relative rounded-full">
      <Morph
        view={state}
        views={views}
        radius={28}
        anchor="center"
        justify="start"
        className={`transition-[background-color,color,box-shadow] ${state === 'done' ? 'duration-0' : 'duration-200'} ${
          state === 'stopped'
            ? 'bg-surface text-ink shadow-float'
            : state === 'done'
              ? 'bg-surface text-ink shadow-float'
              : 'bg-ink text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.2),0_10px_24px_-10px_rgb(0_0_0/0.45)]'
        }`}
      />
      <Bloom k={state === 'done' ? 'done' : null} radius={28} delay={0.12} />
    </motion.button>
  )
}
