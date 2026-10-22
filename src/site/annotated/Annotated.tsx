'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Fit } from '../Fit'

/** Waits, unless another note has taken over, in which case the script stops where it is. */
export type Beat = (ms: number) => Promise<void>

export type Note = {
  title: string
  aside: string
  /** One sentence for the caption line under the stage. */
  line: string
  /** The part it's about, by data-part name. */
  part: string
  /** Plays the live component into this note's behaviour, usually on a loop. */
  play: (beat: Beat) => Promise<void>
}

type Pt = { x: number; y: number }
type Laid = { side: 'left' | 'right'; top: number; anchor: Pt; elbow: number; part: { x: number; y: number; w: number; h: number; r: number }; gone?: boolean }

const NOTE_W = 240
const NOTE_H = 52
const DWELL = 4600
const SPRING = { type: 'spring', stiffness: 300, damping: 34 } as const

/**
 * A live component that explains itself. Notes sit in the margins, each tied by a hairline to
 * the part it describes. Left alone, the component narrates: it plays one behaviour at a time,
 * the matching note lights up, its leader draws in and a ring settles on the part. Point at a
 * note and it plays that behaviour for you; point at a part and its note answers.
 */
export function Annotated({ notes, children, className = 'h-[clamp(520px,calc(100dvh-236px),680px)]' }: { notes: Note[]; children: ReactNode; /** The canvas's size; by default, most of the screen. */ className?: string }) {
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const [laid, setLaid] = useState<Laid[] | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const canvas = useRef<HTMLDivElement>(null)
  const run = useRef(0)

  // The active note runs its script; anything else taking over stops it.
  useEffect(() => {
    const gen = ++run.current
    const beat: Beat = (ms) => new Promise((ok, stop) => setTimeout(() => (run.current === gen ? ok() : stop(new Error('moved on'))), ms))
    notes[active]?.play(beat).catch(() => {})
  }, [active, notes])
  useEffect(() => () => void ++run.current, [])

  // Narration: one note after another, until someone points at a note.
  useEffect(() => {
    if (held) return
    const t = window.setTimeout(() => setActive((a) => (a + 1) % notes.length), DWELL)
    return () => clearTimeout(t)
  }, [active, held, notes.length])

  // Lay the notes out against the parts they describe, every frame, so they follow the component.
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    let raf = 0
    let last = ''
    // Where each part was last seen: a part that's briefly gone (a closed panel) keeps its note in place.
    const seen: (Laid | null)[] = []
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const fit = c.querySelector<HTMLElement>('[data-fit]')
      if (!fit || getComputedStyle(fit).visibility === 'hidden') return
      const cr = c.getBoundingClientRect()
      const fr = fit.getBoundingClientRect()
      const frame = { l: fr.left - cr.left, r: fr.right - cr.left }
      const mid = (frame.l + frame.r) / 2
      const raw = notes.map((n, i) => {
        const el = c.querySelector<HTMLElement>(`[data-part="${n.part}"]`)
        if (!el || !el.getClientRects().length) return seen[i] ? { side: seen[i]!.side, part: seen[i]!.part, gone: true } : null
        const r = el.getBoundingClientRect()
        const scale = el.offsetWidth ? r.width / el.offsetWidth : 1
        const part = { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height, r: Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 10, el.offsetHeight / 2) * scale }
        const side: Laid['side'] = part.x + part.w / 2 < mid ? 'left' : 'right'
        return { side, part, gone: false }
      })
      const out: (Laid | null)[] = raw.map((a) => {
        if (!a) return null
        const { side, part, gone } = a
        const anchor = { x: side === 'left' ? part.x : part.x + part.w, y: part.y + Math.min(part.h / 2, 22) }
        const elbow = side === 'left' ? frame.l - 20 : frame.r + 20
        return { side, part, anchor, elbow, top: anchor.y - 14, gone }
      })
      out.forEach((o, i) => {
        if (o && !o.gone) seen[i] = o
      })
      // Notes on the same side never overlap: each one sits at least a note's height below the last.
      for (const side of ['left', 'right'] as const) {
        const col = out.filter((o): o is Laid => !!o && o.side === side).sort((a, b) => a.top - b.top)
        for (let i = 1; i < col.length; i++) col[i].top = Math.max(col[i].top, col[i - 1].top + NOTE_H + 16)
      }
      const key = JSON.stringify(out.map((o) => o && [o.side, Math.round(o.top), Math.round(o.anchor.x), Math.round(o.anchor.y), Math.round(o.elbow), o.gone])) + cr.width
      if (key !== last) {
        last = key
        setLaid(out as Laid[])
        setSize({ w: cr.width, h: cr.height })
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [notes])

  const take = (i: number) => {
    setHeld(true)
    setActive(i)
  }
  const now = laid?.[active]?.gone ? null : laid?.[active]

  return (
    <div className="flex h-full flex-col" onPointerLeave={() => setHeld(false)}>
      <div ref={canvas} className={`relative ${className}`}>
        <Fit pad={56} max={1.3} min={0.62}>
          <div
            onPointerOver={(e) => {
              // Pointing at a part answers with its note.
              const part = (e.target as Element).closest('[data-part]')?.getAttribute('data-part')
              const i = notes.findIndex((n) => n.part === part)
              if (i >= 0 && i !== active && notes[active]?.part !== part) take(i)
            }}
          >
            {children}
          </div>
        </Fit>

        {/* Leaders and the ring, under the notes and over the stage. */}
        <svg className="pointer-events-none absolute inset-0 hidden size-full overflow-visible md:block" aria-hidden>
          {laid?.map((o, i) => {
            if (!o || o.gone) return null
            const on = i === active
            const x0 = o.side === 'left' ? NOTE_W + 12 : size.w - NOTE_W - 12
            const y0 = o.top + 14
            const d = `M ${x0} ${y0} H ${o.elbow} L ${o.anchor.x} ${o.anchor.y}`
            return (
              <g key={i}>
                {/* The active leader draws itself in from the note to the part. */}
                <motion.path
                  key={on ? `on-${active}` : 'off'}
                  d={d}
                  fill="none"
                  strokeWidth={1}
                  stroke={on ? 'var(--accent)' : 'var(--line-strong)'}
                  initial={on ? { pathLength: 0 } : false}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: [0.2, 0.9, 0.25, 1] }}
                />
                <motion.circle cx={o.anchor.x} cy={o.anchor.y} initial={false} animate={{ r: on ? 3.5 : 2.5, fill: on ? 'var(--accent)' : 'var(--ink-3)' }} transition={SPRING} />
              </g>
            )
          })}
        </svg>
        {now && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0"
            style={{ boxShadow: '0 0 0 1.5px color-mix(in oklch, var(--accent) 50%, transparent), 0 0 0 6px color-mix(in oklch, var(--accent) 9%, transparent)' }}
            initial={false}
            animate={{ x: now.part.x - 5, y: now.part.y - 5, width: now.part.w + 10, height: now.part.h + 10, borderRadius: now.part.r + 5 }}
            transition={SPRING}
          />
        )}

        {/* One line along the bottom says what's happening; it rolls to each note. */}
        <div className="absolute inset-x-0 bottom-0 mx-auto h-6 max-w-[640px] overflow-hidden text-center text-body text-ink-2" aria-live="polite">
          <AnimatePresence initial={false}>
            <motion.p key={active} className="absolute inset-0 truncate" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', stiffness: 420, damping: 36 }}>
              {notes[active]?.line}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* The notes, in the margins. */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {laid?.map((o, i) => {
            if (!o) return null
            const on = i === active
            return (
              <motion.button
                key={notes[i].title}
                type="button"
                onPointerEnter={() => take(i)}
                onFocus={() => take(i)}
                onClick={() => take(i)}
                className={`ring-focus pointer-events-auto absolute flex flex-col rounded-[12px] px-3 py-2 ${o.side === 'left' ? 'items-end text-right' : 'items-start text-left'}`}
                style={{ width: NOTE_W, [o.side]: 0 }}
                initial={false}
                animate={{ top: o.top - 8, opacity: on ? 1 : 0.45 }}
                transition={{ top: SPRING, opacity: { duration: 0.3 } }}
              >
                <span className="text-body font-medium text-ink">{notes[i].title}</span>
                <span className="text-footnote text-ink-3">{notes[i].aside}</span>
              </motion.button>
            )
          })}
        </div>
      </div>


      {/* On phones the notes are a row of chips under the stage; tapping one plays it. */}
      <div className="mt-3 flex shrink-0 flex-wrap justify-center gap-2 px-4 md:hidden">
        {notes.map((n, i) => (
          <button key={n.title} type="button" onClick={() => take(i)} className={`ring-focus h-9 rounded-full px-3.5 text-footnote transition-colors ${i === active ? 'bg-ink text-surface' : 'bg-surface-2 text-ink-2'}`}>
            {n.title}
          </button>
        ))}
      </div>
    </div>
  )
}
