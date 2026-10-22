'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { motion } from 'motion/react'
import { Fit } from '../Fit'

/** Waits, unless the reader has moved on to another chapter, in which case the script stops. */
export type Beat = (ms: number) => Promise<void>

export type Chapter = {
  title: string
  /** The quieter second line. */
  aside: string
  body: string
  /** The part this chapter is about, by its data-part name; it gets a ring on the stage. */
  part?: string
  /** Puts the live component into this chapter's state, usually on a loop. */
  play: (beat: Beat) => Promise<void>
}

const SPRING = { type: 'spring', stiffness: 260, damping: 32 } as const

/**
 * A component told in chapters. The stage stays pinned while short chapters scroll past;
 * whichever one crosses the middle of the screen takes over the live component and plays it
 * into the state it describes, and a soft ring shows the part it means. Scroll back and the
 * earlier chapter takes it back. Nothing on the stage is a recording.
 */
export function Chapters({ chapters, children }: { chapters: Chapter[]; children: ReactNode }) {
  const [active, setActive] = useState(0)
  const items = useRef<(HTMLElement | null)[]>([])
  const stage = useRef<HTMLDivElement>(null)
  const run = useRef(0)

  // The chapter crossing the middle of the viewport is the one being read.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.n))
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    items.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [chapters.length])

  // Each chapter runs its own script; moving on stops the last one where it is.
  useEffect(() => {
    const gen = ++run.current
    const beat: Beat = (ms) => new Promise((ok, stop) => setTimeout(() => (run.current === gen ? ok() : stop(new Error('moved on'))), ms))
    chapters[active]?.play(beat).catch(() => {})
  }, [active, chapters])
  useEffect(() => () => void ++run.current, [])

  return (
    <div className="grid gap-x-16 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* The stage: pinned on wide screens, a sticky band on top on phones. */}
      <div className="sticky top-16 z-10 order-first h-[52vh] py-3 lg:order-last lg:top-[88px] lg:h-[calc(100dvh-120px)] lg:py-0">
        <div ref={stage} className="relative h-full overflow-hidden rounded-[32px] bg-card">
          <Fit pad={48} max={1.35} min={0.62}>
            {children}
          </Fit>
          <Ring stage={stage} part={chapters[active]?.part} />
          <Progress n={chapters.length} at={active} />
        </div>
      </div>

      <div className="pb-[30vh] lg:pb-[40vh]">
        {chapters.map((c, i) => (
          <section
            key={c.title}
            ref={(el) => {
              items.current[i] = el
            }}
            data-n={i}
            className="flex min-h-[64vh] flex-col justify-center py-10 lg:min-h-[80vh]"
          >
            <motion.div initial={false} animate={{ opacity: i === active ? 1 : 0.28 }} transition={{ duration: 0.4 }}>
              <p className="tnum font-mono text-caption text-ink-3">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 text-[clamp(28px,2.6vw,36px)] font-normal leading-[1.1] tracking-[-0.04em] text-ink">
                {c.title}
                <span className="block text-quiet">{c.aside}</span>
              </h3>
              <p className="mt-4 max-w-[360px] text-body text-ink-3">{c.body}</p>
            </motion.div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** A soft ring around the part the chapter is about, following it as it moves and resizes. */
function Ring({ stage, part }: { stage: RefObject<HTMLDivElement | null>; part?: string }) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number; r: number } | null>(null)
  useEffect(() => {
    const s = stage.current
    if (!s || !part) return
    let raf = 0
    let last = ''
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = s.querySelector<HTMLElement>(`[data-part="${part}"]`)
      // Not until the stage has sized the component and shown it, so the ring never sweeps in from a corner.
      if (!el || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') {
        if (last) {
          last = ''
          setBox(null)
        }
        return
      }
      const sr = s.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const scale = el.offsetWidth ? r.width / el.offsetWidth : 1
      const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12, el.offsetHeight / 2) * scale
      const out = 6
      const next = { x: r.left - sr.left - out, y: r.top - sr.top - out, w: r.width + out * 2, h: r.height + out * 2, r: radius + out }
      const key = Object.values(next).map(Math.round).join()
      if (key !== last) {
        last = key
        setBox(next)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stage, part])

  // No part, no ring. Moving between parts, the ring glides from one to the next.
  if (!box || !part) return null
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{ boxShadow: '0 0 0 1.5px color-mix(in oklch, var(--accent) 55%, transparent), 0 0 0 6px color-mix(in oklch, var(--accent) 10%, transparent)' }}
      initial={false}
      animate={{ x: box.x, y: box.y, width: box.w, height: box.h, borderRadius: box.r }}
      transition={SPRING}
    />
  )
}

/** Which chapter the stage is playing, as a row of short segments. */
function Progress({ n, at }: { n: number; at: number }) {
  return (
    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <motion.span key={i} className="h-1 rounded-full" initial={false} animate={{ width: i === at ? 20 : 6, backgroundColor: i === at ? 'var(--ink)' : 'var(--line-strong)' }} transition={SPRING} />
      ))}
    </div>
  )
}
