'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Close } from '../../icons'
import { tap } from '../../lib/feel'
import { ease } from '../../lib/motion'
import { Orb } from '../../ui/Orb'

export type AgentEvent = { id: string; title: string; detail?: string; status: 'running' | 'done' | 'error'; action?: string }

const H = 64
const GAP = 10
const PEEK = 11
const R = 19
const C = 2 * Math.PI * R

/**
 * What an agent is doing, as toasts that update in place rather than pile up. Each carries
 * the agent's orb; while a step runs, a thin ring travels round it. When the step lands the
 * ring closes into a full circle, a badge settles on the orb, and the words roll over to what
 * happened, all where they already are. Newer events stack in front and older ones step back
 * behind them; point at the stack and it fans open into a list. It only ever grows upward into
 * space it already has.
 */
export function AgentToasts({
  events,
  agent = { name: 'Detent', hue: 310 },
  onAction,
  onDismiss,
  max = 3,
  expanded = false,
}: {
  /** What the agent did or is doing, newest last. */
  events: AgentEvent[]
  /** Who's working: the name seeds their orb and the hue colours it, unless you give an avatar of your own, 30px round. */
  agent?: { name: string; hue?: number; avatar?: ReactNode }
  /** Called with an event's id when a person presses its action. */
  onAction?: (id: string) => void
  /** Called with an event's id when it's closed. */
  onDismiss?: (id: string) => void
  /** How many show in the stack before older ones tuck behind. */
  max?: number
  /** Hold the stack open, e.g. while a demo shows it off. */
  expanded?: boolean
}) {
  const [hover, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const open = hover || expanded
  const shown = events.slice(-max)
  return (
    <div
      className="relative w-[360px] max-w-full"
      style={{ height: max * (H + GAP) }}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      role="log"
      aria-label={`${agent.name}'s activity`}
    >
      <AnimatePresence initial={false}>
        {shown.map((e, i) => {
          const depth = shown.length - 1 - i
          const run = e.status === 'running'
          const ok = e.status === 'done'
          return (
            <motion.div
              key={e.id}
              className="absolute inset-x-0 bottom-0 flex items-center gap-3 rounded-[22px] bg-surface pl-3 pr-2.5 shadow-float"
              style={{ height: H, zIndex: 10 - depth, transformOrigin: '50% 100%' }}
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{
                opacity: open ? 1 : depth > 2 ? 0 : 1 - depth * 0.1,
                y: open ? -depth * (H + GAP) : -depth * PEEK,
                scale: open ? 1 : 1 - depth * 0.045,
              }}
              exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2, ease: ease.out } }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              {/* Behind the front toast only the edge shows: its content steps back out of sight. */}
              <motion.span className="flex min-w-0 flex-1 items-center gap-3" initial={false} animate={{ opacity: open || depth === 0 ? 1 : 0 }} transition={{ duration: 0.2 }}>
                {/* The agent, with the ring that says it's working and the badge that says how it went. */}
                <span className="relative flex size-10 shrink-0 items-center justify-center">
                  {agent.avatar ?? <Orb seed={agent.name} hue={agent.hue} size={30} />}
                  <svg aria-hidden width="40" height="40" viewBox="0 0 40 40" className={`absolute inset-0 -rotate-90 ${run && !reduce ? 'motion-safe:animate-[spin_1.1s_linear_infinite]' : ''}`}>
                    <circle
                      cx="20"
                      cy="20"
                      r={R}
                      fill="none"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      className="transition-[stroke-dasharray,stroke,opacity] duration-500 ease-out"
                      style={{
                        stroke: ok ? 'var(--ok)' : e.status === 'error' ? 'var(--danger)' : 'var(--accent)',
                        strokeDasharray: run ? `${C * 0.28} ${C}` : `${C} 0`,
                        opacity: run ? 0.9 : 0,
                        transitionDelay: run ? '0ms' : '0ms, 0ms, 520ms',
                      }}
                    />
                  </svg>
                  <AnimatePresence>
                    {!run && (
                      <motion.span
                        key={e.status}
                        className="absolute -bottom-0.5 -right-0.5 flex size-[17px] items-center justify-center rounded-full text-white shadow-[0_0_0_2px_var(--surface)]"
                        style={{ background: ok ? 'var(--ok)' : 'var(--danger)' }}
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.3, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 520, damping: 22, delay: 0.18 }}
                      >
                        {ok ? <Check size={10} strokeWidth={3.2} /> : <span className="text-[11px] font-bold leading-none">!</span>}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                {/* Its words roll over in place when the step lands. */}
                <span className="relative h-10 min-w-0 flex-1">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={e.title}
                      className="absolute inset-0 flex flex-col justify-center"
                      initial={{ opacity: 0, y: 9 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -9 }}
                      transition={{ duration: 0.28, ease: ease.out }}
                    >
                      <span className={`truncate text-headline ${run && !reduce ? 'sheen' : 'text-ink'}`}>{e.title}</span>
                      {e.detail && <span className="truncate text-footnote text-ink-3">{e.detail}</span>}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <AnimatePresence>
                  {e.action && ok && (
                    <motion.button
                      type="button"
                      className="sink ring-focus h-8 shrink-0 rounded-full bg-ink px-3.5 text-footnote font-medium text-surface transition-opacity hover:opacity-90"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 } }}
                      exit={{ opacity: 0 }}
                      onPointerDown={tap}
                      onClick={() => onAction?.(e.id)}
                    >
                      {e.action}
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.span>
              {onDismiss && (
                <button type="button" aria-label={`Dismiss ${e.title}`} onPointerDown={tap} onClick={() => onDismiss(e.id)} className="ring-focus flex size-7 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
                  <Close size={12} />
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
