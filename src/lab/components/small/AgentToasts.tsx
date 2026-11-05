'use client'

import { useEffect, useRef, useState } from 'react'
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

export function AgentToasts({
  events,
  agent = { name: 'Detent', hue: 310 },
  onAction,
  onDismiss,
  max = 3,
  expanded = false,
}: {
  events: AgentEvent[]
  agent?: { name: string; hue?: number; avatar?: ReactNode }
  onAction?: (id: string) => void
  onDismiss?: (id: string) => void
  max?: number
  expanded?: boolean
}) {
  const [hover, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const open = hover || expanded
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hover) return
    const away = (e: PointerEvent) => e.pointerType === 'touch' && !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [hover])
  const shown = events.slice(-max)
  return (
    <div
      ref={root}
      className="relative w-[360px] max-w-full"
      style={{ height: max * (H + GAP) }}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && setOpen(false)}
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
              <motion.span className="flex min-w-0 flex-1 items-center gap-3" initial={false} animate={{ opacity: open || depth === 0 ? 1 : 0 }} transition={{ duration: 0.2 }}>
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
                      className="sink ring-focus h-8 pointer-coarse:h-9 shrink-0 rounded-full bg-ink px-3.5 text-footnote font-medium text-surface transition-opacity hover:opacity-90"
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
                <button type="button" aria-label={`Dismiss ${e.title}`} onPointerDown={tap} onClick={() => onDismiss(e.id)} className="ring-focus flex size-7 pointer-coarse:size-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
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
