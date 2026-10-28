'use client'

import { useImperativeHandle, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, ChevronDown, Close } from '../../icons'
import { ease, spring } from '../../lib/motion'
import { Dots, kindOf } from '../small/Thinking'

export type RunStatus = 'running' | 'waiting' | 'failed' | 'done'
export type RunStep = { id: string; title: string; detail?: string; sources?: string[]; status: 'pending' | 'running' | 'done' }
export type AgentRun = {
  id: string
  agent: string
  status: RunStatus
  /** One line: what it's doing, what it wants from you, why it stopped, or what it came to. */
  line: string
  /** When it last moved, as it should read: "2m", "Yesterday", "Oct 26". */
  when: string
  /** The day it's filed under: "Today", "Yesterday", "Oct 26". Runs keep the order they're given. */
  day: string
  /** Its steps, shown when the run is opened. */
  steps?: RunStep[]
  /** The reasoning streaming under the step in hand. */
  thought?: string
}
export type Filter = 'all' | 'running' | 'you'
export type ActivityHandle = { open(id: string | null): void; filter(f: Filter): void }

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['running', 'Running'],
  ['you', 'Needs you'],
]
const needsYou = (r: AgentRun) => r.status === 'waiting' || r.status === 'failed'

/**
 * Every agent's runs, filed by day. Each run is one line on what it's doing or what it came to, so
 * the list reads at a glance; one that needs you says so in its own row, with Approve or Retry
 * right there. Open a run and its steps unfold under it: done steps quiet, the step in hand playing
 * its dot field with the reasoning arriving beneath it, and the sources it leaned on.
 */
export function AgentActivity({
  runs,
  onApprove,
  onRetry,
  ref,
}: {
  runs: AgentRun[]
  /** Called when a person lets a waiting run go ahead. */
  onApprove: (id: string) => void
  /** Called when a person retries a failed run. */
  onRetry: (id: string) => void
  ref?: Ref<ActivityHandle>
}) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  useImperativeHandle(ref, () => ({ open: setOpen, filter: setFilter }))

  const shown = runs.filter((r) => filter === 'all' || (filter === 'running' ? r.status === 'running' : needsYou(r)))
  const days = [...new Set(shown.map((r) => r.day))]
  const running = runs.filter((r) => r.status === 'running').length
  const you = runs.filter(needsYou).length
  const glide = reduce ? { duration: 0 } : spring.smooth

  return (
    // One fixed size: the list scrolls inside it, so opening a run or filtering never resizes the card.
    <div className="flex h-[560px] w-[440px] max-w-full flex-col overflow-hidden rounded-[22px] bg-surface shadow-float">
      <header className="flex shrink-0 items-end justify-between gap-4 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-headline text-ink">Agents</p>
          <p className="tnum mt-0.5 text-footnote text-ink-3">
            <span className="text-ink-2">{running} running</span>
            {you > 0 && ` · ${you} need${you === 1 ? 's' : ''} you`}
          </p>
        </div>
        {/* Text tabs; the one in use carries a short accent mark beneath it. */}
        <div role="tablist" aria-label="Show" className="-mr-1.5 flex items-center">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={`ring-focus relative h-7 rounded-full px-2 text-footnote transition-colors ${filter === id ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}>
              {label}
              {filter === id && <motion.span layoutId="activity-tab" className="absolute bottom-0.5 left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-full bg-accent" transition={reduce ? { duration: 0 } : spring.snappy} />}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)] [scrollbar-width:thin]">
        <AnimatePresence initial={false} mode="popLayout">
          {days.map((day) => (
            <motion.section key={day} layout="position" transition={glide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <div className="flex items-center gap-3 px-3 pb-1 pt-2.5">
                <span className="text-footnote text-ink-3">{day}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <AnimatePresence initial={false} mode="popLayout">
                {shown
                  .filter((r) => r.day === day)
                  .map((r) => (
                    <motion.div key={r.id} layout="position" transition={glide} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                      <Run run={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} onApprove={() => onApprove(r.id)} onRetry={() => onRetry(r.id)} reduce={!!reduce} />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Run({ run: r, open, onToggle, onApprove, onRetry, reduce }: { run: AgentRun; open: boolean; onToggle: () => void; onApprove: () => void; onRetry: () => void; reduce: boolean }) {
  const roll = { duration: reduce ? 0 : 0.24, ease: ease.out }
  const current = r.steps?.find((s) => s.status === 'running')
  const word = r.status === 'running' ? { text: 'running', tone: 'text-ink-3' } : r.status === 'waiting' ? { text: 'needs you', tone: 'text-accent' } : r.status === 'failed' ? { text: 'failed', tone: 'text-danger' } : null

  // The second line: the step in hand with its dot field, a question with its answer, a failure with Retry, or what it came to.
  const line: ReactNode =
    r.status === 'running' ? (
      <span className="flex min-w-0 items-center gap-2">
        <Dots kind={kindOf(current?.title ?? r.line)} size={12} />
        <span className="truncate text-ink-2">{current?.title ?? r.line}</span>
      </span>
    ) : r.status === 'waiting' ? (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-ink-2">{r.line}</span>
        <Act onClick={onApprove} primary>
          Approve
        </Act>
      </span>
    ) : r.status === 'failed' ? (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-ink-2">{r.line}</span>
        <Act onClick={onRetry}>Retry</Act>
      </span>
    ) : (
      <span className="truncate">{r.line}</span>
    )

  return (
    <div className={`rounded-[14px] transition-colors duration-200 ${open ? 'bg-surface-2' : ''}`}>
      <div role="button" tabIndex={0} aria-expanded={r.steps ? open : undefined} onClick={() => r.steps && onToggle()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && r.steps && (e.preventDefault(), onToggle())} className={`ring-focus group flex h-[58px] items-start gap-3 rounded-[14px] px-3 pt-2.5 transition-colors ${r.steps ? 'cursor-pointer' : ''} ${open ? '' : 'hover:bg-surface-2'}`}>
        <Mark status={r.status} reduce={reduce} />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2 truncate text-callout leading-5">
            <span className="text-ink">{r.agent}</span>
            <span className="relative h-4 overflow-hidden text-footnote leading-4">
              <AnimatePresence initial={false} mode="popLayout">
                {word && (
                  <motion.span key={word.text} className={`block ${word.tone}`} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={roll}>
                    {word.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </p>
          <div className="relative mt-1 h-[22px] overflow-hidden text-footnote leading-[22px] text-ink-3">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div key={`${r.status}-${current?.id ?? r.line}`} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={roll}>
                {line}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <span className="tnum font-mono text-[11px] text-ink-3">{r.when}</span>
          {r.steps && (
            <motion.span className="flex text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" style={open ? { opacity: 1 } : undefined} animate={{ rotate: open ? 180 : 0 }} transition={reduce ? { duration: 0 } : spring.snappy}>
              <ChevronDown size={12} />
            </motion.span>
          )}
        </span>
      </div>

      {/* The run's steps, unfolding under it. */}
      <AnimatePresence initial={false}>
        {open && r.steps && (
          <motion.div key="steps" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduce ? { duration: 0 } : spring.smooth} className="overflow-hidden">
            <ol className="relative pl-3 pr-4 pt-0.5">
              {/* The rail the steps hang from, under the run's mark. */}
              <span aria-hidden className="absolute bottom-4 left-[18.5px] top-2 w-px bg-line-strong" />
              {r.steps.map((s) => (
                <Step key={s.id} step={s} />
              ))}
            </ol>
            {/* The reasoning, in one place that never moves: under the steps, three lines kept for it. */}
            <div className="mx-3 mb-3 mt-1.5 h-[70px] rounded-[10px] bg-surface px-3 py-2 shadow-[0_0_0_1px_var(--line)]">
              <p className="line-clamp-3 text-[12px] leading-[18px] text-ink-2">
                {r.thought ? (
                  r.thought.split(' ').map((w, i) => (
                    <motion.span key={`${i}-${w}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: ease.out }}>
                      {w}{' '}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-ink-3">{r.status === 'running' ? 'Thinking…' : r.line}</span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** One step under an open run: always two lines tall, so a step starting or finishing never moves the ones below it. */
function Step({ step: s }: { step: RunStep }) {
  const shown = s.status !== 'pending'
  return (
    <li className="relative flex h-[42px] gap-3 py-0.5">
      <span className="relative z-10 flex h-5 w-[14px] shrink-0 items-center justify-center bg-surface-2">
        {s.status === 'running' ? <Dots kind={kindOf(s.title)} size={13} /> : s.status === 'done' ? <span className="size-[7px] rounded-full bg-ink-3" /> : <span className="size-[7px] rounded-full border border-line-strong" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-footnote leading-5 transition-colors duration-300 ${s.status === 'running' ? 'text-ink' : 'text-ink-3'}`}>{s.title}</p>
        <p className={`truncate text-[12px] leading-[18px] text-ink-3 transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}>
          {s.detail}
          {s.sources && <span className="text-ink-3/70"> · via {s.sources.join(', ')}</span>}
        </p>
      </div>
    </li>
  )
}

function Act({ onClick, primary = false, children }: { onClick: () => void; primary?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`ring-focus h-[22px] shrink-0 rounded-full px-2.5 text-[12px] font-medium transition-transform active:scale-[0.97] ${primary ? 'bg-ink text-surface' : 'bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line-strong)] hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

/** A run's mark: a turning arc while it works, a ring asking for you, a cross when it failed, a check when it's done. */
function Mark({ status, reduce }: { status: RunStatus; reduce: boolean }) {
  return (
    <span className="relative mt-[3px] flex size-[14px] shrink-0 items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout">
        {status === 'done' ? (
          <motion.span key="done" className="flex size-[14px] items-center justify-center rounded-full bg-ink text-surface" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0 } : spring.snappy}>
            <Check size={9} strokeWidth={3.2} />
          </motion.span>
        ) : status === 'failed' ? (
          <motion.span key="failed" className="flex size-[14px] items-center justify-center rounded-full bg-danger text-white" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0 } : spring.snappy}>
            <Close size={8} strokeWidth={3.2} />
          </motion.span>
        ) : status === 'waiting' ? (
          <motion.span key="waiting" className="flex size-[14px] items-center justify-center rounded-full border-[1.5px] border-accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <motion.span className="size-1 rounded-full bg-accent" animate={reduce ? undefined : { scale: [1, 1.6, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          </motion.span>
        ) : (
          <motion.svg key="run" viewBox="0 0 14 14" className="size-[14px] text-accent" initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: reduce ? 0 : 360 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.15 }, rotate: { duration: 0.9, ease: 'linear', repeat: Infinity } }}>
            <circle cx="7" cy="7" r="5.75" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
            <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 40" />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  )
}
