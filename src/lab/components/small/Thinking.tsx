'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, spring } from '../../lib/motion'
import { Glow, aiInk, aiText, useTone } from '../../ui/Intelligence'

/**
 * A model at work, in one pill. The mark steps round an eighth at a time, clicking like a
 * detent; the current step rolls in below the last, and a clock keeps time. When it's done the
 * pill settles into "Thought for 6s", and opens to the steps it took, over whatever is below,
 * so nothing moves.
 */
export function Thinking({ steps, done, expanded = false }: {
  /** What it's thought so far, a line each. The newest shows on the one line. */
  steps: string[]
  /** Thinking has finished: the line settles into how long it took. */
  done: boolean
  /** Open the steps from outside, e.g. in a demo. */
  expanded?: boolean
}) {
  const [seconds, setSeconds] = useState(0)
  const [mine, setOpen] = useState(false)
  const open = done && (mine || expanded)
  const [turn, setTurn] = useState(0)
  const t0 = useRef(0)

  useEffect(() => {
    if (done) return
    t0.current = performance.now() - seconds * 1000
    const t = window.setInterval(() => {
      setSeconds(Math.floor((performance.now() - t0.current) / 1000))
      setTurn((n) => n + 1)
    }, 260)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const step = steps[steps.length - 1] ?? 'Thinking'
  // The spectrum the first time it thinks; after that the same motion in ink.
  const tone = useTone(!done, 'thinking')
  return (
    <div className="relative w-[320px]">
      {/* While it works, the pill wears Intelligence; when it's done, the light cools away. */}
      <Glow on={!done} layer="halo" radius={28} style={{ height: 56, bottom: 'auto' }} tone={tone} />
      <button
        type="button"
        data-invite
        disabled={!done}
        aria-expanded={done ? open : undefined}
        onPointerDown={() => done && tap()}
        onClick={() => setOpen((o) => !o)}
        className="sink ring-focus relative flex h-14 w-full items-center gap-3 rounded-full bg-surface pl-2 pr-5 text-left shadow-float enabled:cursor-pointer"
      >
        {/* The mark clicks round an eighth at a time while it works, then the well fills and shows a check. */}
        <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${done ? 'bg-ink text-surface' : 'bg-surface-2'}`}>
          <AnimatePresence initial={false} mode="popLayout">
            {done ? (
              <motion.span key="ok" className="flex" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 24 }}>
                <Check size={17} strokeWidth={2.6} />
              </motion.span>
            ) : (
              <motion.svg key="mark" width="22" height="22" viewBox="0 0 18 18" animate={{ rotate: turn * 45 }} transition={{ type: 'spring', stiffness: 520, damping: 18 }} exit={{ scale: 0.5, opacity: 0 }}>
                {Array.from({ length: 8 }, (_, q) => (
                  <rect key={q} x="8.1" y="1" width="1.8" height="4.2" rx="0.9" fill={tone === 'loud' ? aiInk(q / 7) : 'var(--ink)'} opacity={[1, 0.22, 0.22, 0.26, 0.32, 0.42, 0.6, 0.82][q]} transform={`rotate(${q * 45} 9 9)`} />
                ))}
              </motion.svg>
            )}
          </AnimatePresence>
        </span>
        <span className="min-w-0 flex-1">
          <span className="relative block h-5 overflow-hidden text-headline">
            <AnimatePresence initial={false}>
              <motion.span
                key={done ? 'done' : step}
                className={`absolute inset-0 truncate ${done ? 'text-ink' : aiText(tone)}`}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                {done ? `Thought for ${Math.max(1, seconds)}s` : step}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="tnum block text-footnote text-ink-3">{done ? `${steps.length} steps · show them` : `Step ${Math.max(1, steps.length)} · ${seconds}s`}</span>
        </span>
        {done && (
          <motion.span className="flex text-ink-3" animate={{ rotate: open ? 180 : 0 }} transition={spring.snappy}>
            <ChevronDown size={15} />
          </motion.span>
        )}
      </button>
      <Glow on={!done} layer="ring" radius={28} style={{ height: 56, bottom: 'auto' }} tone={tone} />
      <AnimatePresence>
        {open && (
          <motion.ol
            className="glass absolute inset-x-0 top-[calc(100%+12px)] z-10 rounded-[24px] bg-surface p-2 shadow-modal"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: ease.out }}
            style={{ transformOrigin: '50% 0%' }}
          >
            {steps.map((s, i) => (
              <motion.li key={s} className="flex h-9 items-center gap-2.5 px-3 text-callout text-ink-2" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }}>
                <Check size={13} strokeWidth={2.6} className="text-ink-3" />
                {s}
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  )
}
