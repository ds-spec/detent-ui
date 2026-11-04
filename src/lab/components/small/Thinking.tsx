'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, spring, dur } from '../../lib/motion'

export type ThoughtKind = 'think' | 'read' | 'search' | 'compare' | 'write'

const VERBS: [RegExp, ThoughtKind][] = [
  [/^(search|find|brows|query|fetch|look)/i, 'search'],
  [/^(read|open|scan|review|parse)/i, 'read'],
  [/^(compar|weigh|check|verif|match|test)/i, 'compare'],
  [/^(writ|draft|answer|summar|compos|edit)/i, 'write'],
]

export const kindOf = (step: string): ThoughtKind => VERBS.find(([r]) => r.test(step.trim()))?.[1] ?? 'think'

const N = 5
const DIM = 0.1
const CHECK = [15, 21, 17, 13, 9]
const RING = [0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5]
const clamp = (v: number) => Math.min(1, Math.max(0, v))

export type Pattern = ThoughtKind | 'done'

const STILL: Record<ThoughtKind, number[]> = {
  think: [1, 2, 3, 4, 12],
  read: [0, 1, 2, 3, 4, 10, 11, 12, 13, 20, 21],
  search: [12, 8, 4, 3, 9],
  compare: [6, 11, 16, 21, 18, 23],
  write: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

function level(p: Pattern, t: number, i: number): number {
  const r = Math.floor(i / N)
  const c = i % N
  switch (p) {
    case 'think': {
      if (i === 12) return 0.35 + 0.2 * Math.sin(t * 3)
      const k = RING.indexOf(i)
      if (k < 0) return 0
      const d = (t * 13 - k + 160) % 16
      return clamp(1 - d / 5)
    }
    case 'read': {
      const d = (t * 16 - i + 300) % 30
      return d > 25 ? 0 : clamp(1 - d / 5)
    }
    case 'search': {
      if (i === 12) return 0.7
      const a = Math.atan2(r - 2, c - 2)
      const d = (((t * 4.2 - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      return clamp(1 - d / 2.4) * (Math.hypot(r - 2, c - 2) > 1.5 ? 1 : 0.8)
    }
    case 'compare': {
      if (c !== 1 && c !== 3) return 0
      const h = 2.6 + (c === 1 ? 1 : -1) * 1.6 * Math.sin(t * 3.2)
      return clamp(h - (N - 1 - r))
    }
    case 'write': {
      const head = (t * 11) % 34
      return head > 30 ? clamp(1 - (head - 30) / 3) : head > i ? (head - i < 1.4 ? 1 : 0.62) : 0
    }
    case 'done': {
      const k = CHECK.indexOf(i)
      return k < 0 ? 0 : clamp((t - k * 0.055) / 0.12)
    }
  }
}

export function Dots({ kind, size = 17, still = false, tint }: { kind: Pattern; size?: number; still?: boolean; tint?: string }) {
  const refs = useRef<(SVGCircleElement | null)[]>([])
  const reduce = useReducedMotion()
  const swap = useRef({ from: kind, to: kind, at: 0, t0: 0 })

  useEffect(() => {
    const s = swap.current
    if (s.to === kind) return
    s.from = s.to
    s.to = kind
    s.at = performance.now()
    if (kind === 'done') s.t0 = s.at
  }, [kind])

  useEffect(() => {
    const paint = (now: number) => {
      const s = swap.current
      const t = (now - (s.to === 'done' ? s.t0 : 0)) / 1000
      const m = clamp((now - s.at) / 260)
      const k = m * m * (3 - 2 * m)
      const base = s.to === 'done' ? DIM + (0.03 - DIM) * k : DIM
      refs.current.forEach((dot, i) => {
        if (!dot) return
        const a = level(s.from, s.from === 'done' ? t : now / 1000, i)
        const b = level(s.to, t, i)
        dot.style.opacity = String(base + (1 - base) * (a + (b - a) * k))
      })
      return s.to === 'done' && t > 0.8
    }
    if (still || reduce) {
      const to = swap.current.to
      if (to === 'done') paint(swap.current.t0 + 900)
      else refs.current.forEach((dot, i) => dot && (dot.style.opacity = String(STILL[to].includes(i) ? 1 : DIM)))
      return
    }
    let raf = 0
    const frame = (now: number) => {
      if (!paint(now)) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [kind, still, reduce])

  const pitch = size / (N - 0.3)
  const rad = pitch * 0.35
  return (
    <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" style={{ color: tint }}>
      {Array.from({ length: N * N }, (_, i) => (
        <circle key={i} ref={(el) => void (refs.current[i] = el)} cx={rad + (i % N) * pitch} cy={rad + Math.floor(i / N) * pitch} r={rad} fill="currentColor" opacity={DIM} />
      ))}
    </svg>
  )
}

function TwoTone({ text }: { text: string }) {
  const at = text.indexOf(' ')
  return at < 0 ? <>{text}</> : (
    <>
      {text.slice(0, at)}
      <span className="text-ink-3">{text.slice(at)}</span>
    </>
  )
}

const secs = (ms: number) => (ms < 9500 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 1000)}s`)

export function Thinking({ steps, done, expanded = false }: {
  steps: string[]
  done: boolean
  expanded?: boolean
}) {
  const [mine, setOpen] = useState(false)
  const open = done && (mine || expanded)
  const clock = useRef({ marks: [] as number[], end: 0 })
  const [time, setTime] = useState({ elapsed: 0, took: [] as number[] })
  const [accent, setAccent] = useState(false)

  useEffect(() => {
    const c = clock.current
    const at = performance.now()
    for (let i = 0; i < Math.max(1, steps.length); i++) c.marks[i] ??= at
    if (done) c.end ||= at
    const read = () => {
      const n = done ? c.end : performance.now()
      setTime({ elapsed: n - c.marks[0], took: c.marks.map((m, i) => (c.marks[i + 1] ?? n) - m) })
    }
    const first = window.setTimeout(read)
    const tick = done ? 0 : window.setInterval(read, 100)
    return () => {
      clearTimeout(first)
      clearInterval(tick)
    }
  }, [steps.length, done])

  useEffect(() => {
    if (!done) return
    const on = window.setTimeout(() => setAccent(true))
    const off = window.setTimeout(() => setAccent(false), 900)
    return () => {
      clearTimeout(on)
      clearTimeout(off)
    }
  }, [done])

  const elapsed = time.elapsed
  const step = steps[steps.length - 1] ?? 'Thinking'
  const kind: Pattern = done ? 'done' : kindOf(step)
  const took = (i: number) => time.took[i] ?? 0

  return (
    <div className="relative w-[320px] max-w-full">
      <button
        type="button"
        data-invite
        disabled={!done}
        aria-expanded={done ? open : undefined}
        aria-live="polite"
        onPointerDown={() => done && tap()}
        onClick={() => setOpen((o) => !o)}
        className="sink ring-focus relative flex h-12 w-full items-center gap-3 rounded-full bg-surface pl-4 pr-4 text-left shadow-raised enabled:cursor-pointer"
      >
        <span className={`flex transition-colors duration-500 ${accent ? 'text-accent' : 'text-ink'}`}>
          <Dots kind={kind} size={18} />
        </span>
        <span className="relative h-5 min-w-0 flex-1 overflow-hidden text-headline">
          <AnimatePresence initial={false}>
            <motion.span
              key={done ? 'done' : step}
              className="absolute inset-0 truncate text-ink"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={spring.move}
            >
              <TwoTone text={done ? `Thought for ${secs(elapsed).replace('.0s', 's')}` : step} />
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="flex w-10 shrink-0 justify-end">
          {done ? (
            <motion.span className="flex text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: open ? 180 : 0 }} transition={spring.snappy}>
              <ChevronDown size={15} />
            </motion.span>
          ) : (
            <span className="tnum text-footnote text-ink-3">{secs(elapsed)}</span>
          )}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ol
            aria-label="Steps"
            className="glass absolute inset-x-0 top-[calc(100%+8px)] z-10 rounded-[22px] bg-surface p-1.5 shadow-modal"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: dur.exit, ease: ease.out } }}
            transition={{ duration: 0.2, ease: ease.out }}
            style={{ transformOrigin: '50% 0%' }}
          >
            {steps.map((s, i) => (
              <motion.li key={s} className="flex h-9 items-center gap-3 rounded-[14px] px-3 text-callout text-ink" initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035, duration: 0.2, ease: ease.out }}>
                <span className="flex text-ink-2">
                  <Dots kind={kindOf(s)} size={13} still />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <TwoTone text={s} />
                </span>
                <span className="tnum text-footnote text-ink-3">{secs(took(i))}</span>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  )
}
