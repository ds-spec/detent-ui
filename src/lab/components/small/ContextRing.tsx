'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { Check } from '../../icons'
import { tap } from '../../lib/feel'
import { press, spring } from '../../lib/motion'

export type ContextPart = {
  id: string
  label: string
  tokens: number
  /** Its colour in the bar. Defaults run neutral, then violet, then the accent for the conversation. */
  tint?: string
}
/** For demos and tests: open the breakdown and compact, without touching focus. */
export type ContextHandle = { open(v: boolean): void; compact(): void }

const TINTS = ['color-mix(in oklch, var(--ink) 42%, transparent)', 'light-dark(oklch(0.62 0.15 295), oklch(0.72 0.13 295))', 'var(--accent)']
const AMBER = 'var(--warn)'
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)))

/** A number that counts to its new value instead of jumping or rolling. */
function Count({ value, format = k }: { value: number; format?: (n: number) => string }) {
  const mv = useMotionValue(value)
  const [text, setText] = useState(format(value))
  useMotionValueEvent(mv, 'change', (v) => setText(format(v)))
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.7, ease: [0.2, 0.9, 0.25, 1] })
    return () => c.stop()
  }, [value, mv])
  return <span className="tnum">{text}</span>
}

/**
 * How full the context window is, as a ring small enough for a composer's toolbar. It fills as
 * the conversation grows and warms to amber near the limit, where a quiet suggestion to compact
 * appears beside it. Open it for the breakdown: one bar, a colour for each kind of context, and
 * the room that's left. Compact, and the conversation's share drains away while every number
 * counts down with it; a line says how much room it made.
 */
export function ContextRing({
  parts,
  limit,
  onCompact,
  warnAt = 0.8,
  ref,
}: {
  /** What fills the context window, e.g. the instructions, files and the conversation, in tokens. The last is the one compacting shrinks. */
  parts: ContextPart[]
  /** The window's size, in tokens. */
  limit: number
  /** Called when a person compacts the conversation to make room. */
  onCompact?: () => void
  /** How full, from 0 to 1, before it warms to amber and suggests compacting. */
  warnAt?: number
  ref?: Ref<ContextHandle>
}) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  const before = useRef<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const id = useId()
  const used = parts.reduce((n, p) => n + p.tokens, 0)
  const share = Math.min(1, used / limit)
  const hot = share >= warnAt

  const compact = () => {
    tap()
    before.current = used
    onCompact?.()
  }
  useImperativeHandle(ref, () => ({ open: setOpen, compact }))

  // When the conversation shrinks after a compact, say how much room it made, for a moment.
  useEffect(() => {
    if (before.current === null || used >= before.current) return
    setSaved(before.current - used)
    before.current = null
    const t = setTimeout(() => setSaved(null), 2800)
    return () => clearTimeout(t)
  }, [used])

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const tint = (i: number, p: ContextPart) => (hot && i === parts.length - 1 ? AMBER : (p.tint ?? TINTS[Math.min(i, TINTS.length - 1)]))

  return (
    <div ref={root} className="relative flex w-fit items-center gap-1.5" onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="dialog"
            aria-label="Context window"
            className="absolute bottom-full left-0 mb-3 w-[300px] rounded-[22px] bg-surface p-4 shadow-modal"
            style={{ transformOrigin: '20px 100%' }}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-headline text-ink">Context</p>
              <p className="text-footnote text-ink-3">
                <span className="text-ink">
                  <Count value={used} />
                </span>{' '}
                of {k(limit)}
              </p>
            </div>
            {/* One bar: a segment for each kind of context, then the room that's left. */}
            <div className="mt-3 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-surface-2">
              {parts.map((p, i) => (
                <motion.span key={p.id} className="h-full first:rounded-l-full" style={{ background: tint(i, p) }} initial={false} animate={{ width: `${(p.tokens / limit) * 100}%` }} transition={spring.smooth} />
              ))}
            </div>
            <ul className="mt-3.5 space-y-1.5">
              {parts.map((p, i) => (
                <li key={p.id} className="flex h-5 items-center gap-2.5 text-footnote text-ink-2">
                  <span className="size-2 rounded-full transition-colors duration-300" style={{ background: tint(i, p) }} />
                  <span className="flex-1">{p.label}</span>
                  <span className="text-ink-3">
                    <Count value={p.tokens} />
                  </span>
                </li>
              ))}
              <li className="flex h-5 items-center gap-2.5 text-footnote text-ink-3">
                <span className="size-2 rounded-full bg-surface-3" />
                <span className="flex-1">Free</span>
                <Count value={Math.max(0, limit - used)} />
              </li>
            </ul>
            <div className="relative mt-4 h-10">
              <AnimatePresence initial={false} mode="popLayout">
                {saved === null ? (
                  <motion.button
                    key="compact"
                    type="button"
                    whileTap={press}
                    onClick={compact}
                    className={`sink ring-focus absolute inset-0 flex items-center justify-center rounded-full text-callout font-medium transition-colors duration-150 ${hot ? 'bg-ink text-surface hover:opacity-90' : 'bg-surface-2 text-ink hover:bg-surface-3'}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    Compact the chat
                  </motion.button>
                ) : (
                  <motion.p
                    key="saved"
                    role="status"
                    className="absolute inset-0 flex items-center justify-center gap-2 rounded-full text-callout text-ink"
                    style={{ background: 'color-mix(in oklch, var(--ok) 12%, transparent)' }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <Check size={15} strokeWidth={2.6} className="text-ok" />
                    Made room for {k(saved)} tokens
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-2 text-center text-caption text-ink-3">Older messages become one short summary.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        data-invite
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Context window ${Math.round(share * 100)}% full`}
        whileTap={press}
        onPointerDown={tap}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        className={`sink ring-focus flex h-10 items-center gap-2 rounded-full pl-2.5 pr-3.5 text-callout font-medium transition-colors duration-150 ${open ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
      >
        <svg width="20" height="20" viewBox="0 0 18 18" className="-rotate-90" aria-hidden>
          <circle cx="9" cy="9" r="7" fill="none" stroke="var(--surface-3)" strokeWidth="2.25" />
          <motion.circle
            cx="9"
            cy="9"
            r="7"
            fill="none"
            strokeWidth="2.25"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: Math.max(0.02, share), stroke: hot ? AMBER : 'var(--ink-2)' }}
            transition={{ pathLength: { type: 'spring', stiffness: 120, damping: 20 }, stroke: { duration: 0.3 } }}
          />
        </svg>
        <span className="flex w-9">
          <Count value={share * 100} format={(n) => `${Math.round(n)}%`} />
        </span>
      </motion.button>

      {/* Near the limit, a quiet suggestion beside the ring. */}
      <AnimatePresence>
        {hot && !open && (
          <motion.button
            key="suggest"
            type="button"
            onClick={compact}
            className="ring-focus h-7 rounded-full px-2.5 text-footnote font-medium text-[var(--warn-ink)] transition-colors hover:bg-[color-mix(in_oklch,var(--warn)_14%,transparent)]"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4, transition: { duration: 0.14 } }}
          >
            Compact
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
