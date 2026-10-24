'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { Check } from '../../icons'
import { tap } from '../../lib/feel'
import { press } from '../../lib/motion'

export type ContextPart = {
  id: string
  label: string
  tokens: number
  /** Its shade on the ruler. Defaults run from light ink to full ink, the last part darkest. */
  tint?: string
}
/** For demos and tests: open the breakdown and compact, without touching focus. */
export type ContextHandle = { open(v: boolean): void; compact(): void }

const AMBER = 'var(--warn)'
const REDLINE = 'color-mix(in oklch, var(--warn) 34%, transparent)'
const EMPTY = 'color-mix(in oklch, var(--ink) 13%, transparent)'
const SHADES = [28, 52, 100].map((p) => `color-mix(in oklch, var(--ink) ${p}%, transparent)`)
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)))

/** A number that counts to its new value instead of jumping. */
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
 * Ticks that follow a count as it changes: each tick takes its new colour a beat after the one
 * before it, starting from where the count was, so a fill runs forward and a compact sweeps back.
 */
function useSweep(filled: number, step: number) {
  const [was, setWas] = useState({ at: filled, from: filled })
  if (was.at !== filled) setWas({ at: filled, from: was.at })
  return (i: number) => `${Math.max(0, (filled >= was.from ? i - was.from : was.from - 1 - i) * step)}ms`
}

/**
 * How full the context window is, as a dial of ticks small enough for a composer's toolbar. The
 * ticks fill as the conversation grows; the last stretch, past `warnAt`, is the redline, marked in
 * amber, and once the fill reaches it a quiet suggestion to compact appears beside the dial. Open
 * it for the breakdown: the count in large type, and a ruler of ticks shaded by what fills them.
 * Compact, and the ticks sweep back as the conversation folds away, every number counting down.
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
  /** How full, from 0 to 1, before it's in the redline and suggests compacting. */
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
    const made = before.current - used
    before.current = null
    const on = setTimeout(() => setSaved(made))
    const off = setTimeout(() => setSaved(null), 2800)
    return () => {
      clearTimeout(on)
      clearTimeout(off)
    }
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

  // The ruler: a tick for every 1/52 of the window.
  const RULER = 52
  const rulerOn = Math.round(share * RULER)
  const rulerDelay = useSweep(rulerOn, 9)

  // The dial's fill springs to the share; past the redline the rest of it is amber.
  const fill = useMotionValue(share)
  useEffect(() => {
    const c = animate(fill, share, { type: 'spring', stiffness: 120, damping: 20 })
    return () => c.stop()
  }, [share, fill])
  const inkDash = useTransform(fill, (v) => `${Math.min(v, warnAt)} 1`)
  const redDash = useTransform(fill, (v) => `${Math.max(0, v - warnAt)} 1`)

  // Which part fills each ruler tick: walk the parts in order, a tick per 1/RULER of the window.
  const ends = parts.reduce<number[]>((a, p) => [...a, (a.at(-1) ?? 0) + p.tokens / limit], [])
  const shade = (i: number, p?: ContextPart) => p?.tint ?? SHADES[Math.min(SHADES.length - 1, Math.max(0, i - (parts.length - SHADES.length)))]
  // A tick past the redline is amber: faint while empty, full once the fill reaches it.
  const tickColour = (t: number, n: number, on: number) => {
    const at = (t + 0.5) / n
    if (t >= on) return at >= warnAt ? REDLINE : EMPTY
    if (at >= warnAt) return AMBER
    const i = Math.max(0, ends.findIndex((e) => at <= e))
    return shade(i, parts[i])
  }

  return (
    <div ref={root} className="relative flex w-fit items-center gap-1.5" onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="dialog"
            aria-label="Context window"
            className="absolute bottom-full left-0 z-20 mb-3 w-[300px] rounded-[22px] bg-surface p-4 pt-3.5 shadow-modal"
            style={{ transformOrigin: '20px 100%' }}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
          >
            <p className="text-footnote text-ink-3">Context window</p>
            {/* The count is the headline: what's used in ink, the window's size after it in grey. */}
            <p className="mt-0.5 text-large font-medium leading-9 tracking-[-0.02em] text-ink">
              <Count value={used} />
              <span className="text-ink-3"> / {k(limit)}</span>
            </p>
            {/* The ruler: a tick for every 1/52 of the window, shaded by what fills it, amber past the redline. */}
            <div className="relative mt-3 flex h-5 items-end justify-between" aria-hidden>
              {Array.from({ length: RULER }, (_, t) => (
                <span
                  key={t}
                  className="w-[2px] rounded-full"
                  style={{
                    height: t === Math.round(warnAt * RULER) ? 20 : 14,
                    background: tickColour(t, RULER, rulerOn),
                    transition: `background-color 160ms ease ${rulerDelay(t)}`,
                  }}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-1.5">
              {parts.map((p, i) => (
                <li key={p.id} className="flex h-5 items-center gap-2.5 text-footnote text-ink-2">
                  <span className="h-2.5 w-[2px] rounded-full" style={{ background: shade(i, p) }} />
                  <span className="flex-1">{p.label}</span>
                  <span className="text-ink-3">
                    <Count value={p.tokens} />
                  </span>
                </li>
              ))}
              <li className="flex h-5 items-center gap-2.5 text-footnote text-ink-3">
                <span className="h-2.5 w-[2px] rounded-full" style={{ background: EMPTY }} />
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
                    className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-surface-2 text-callout text-ink"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <Check size={15} strokeWidth={2.6} />
                    <span>
                      Made room for <span className="tnum">{k(saved)}</span> <span className="text-ink-3">tokens</span>
                    </span>
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
        {/* The dial: a ring from twelve o'clock. Its last stretch, past the redline, is faintly amber, and the fill turns amber when it gets there. */}
        <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90" aria-hidden>
          <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2.4" pathLength={1} style={{ stroke: EMPTY, strokeDasharray: `${warnAt - 0.012} 1` }} />
          <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2.4" pathLength={1} style={{ stroke: REDLINE, strokeDasharray: `${1 - warnAt - 0.012} 1`, strokeDashoffset: -warnAt }} />
          <motion.circle cx="11" cy="11" r="8" fill="none" strokeWidth="2.4" pathLength={1} style={{ stroke: 'var(--ink)', strokeDasharray: inkDash }} />
          <motion.circle cx="11" cy="11" r="8" fill="none" strokeWidth="2.4" pathLength={1} style={{ stroke: AMBER, strokeDasharray: redDash, strokeDashoffset: -warnAt }} />
        </svg>
        <span className="flex w-9">
          <Count value={share * 100} format={(n) => `${Math.round(n)}%`} />
        </span>
      </motion.button>

      {/* In the redline, a quiet suggestion beside the dial. */}
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
