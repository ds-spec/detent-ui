'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { clamp, dragProps, useDetent } from '@/lab/lib/detent'
import { press } from '@/lab/lib/motion'

/*
 * The titles are the pager. Instead of dots, each slide's name sits under the picture in large
 * type, so you can see what's there before you go to it. The current one fills with ink as its
 * slide plays, and pointing at the carousel holds it where it is.
 *
 * The pictures sit on one strip and the hand carries it: the picture is under your finger from the
 * first pixel, stops at each slide, gives at the ends, and a flick coasts. The ink is worked out from
 * the same value, so it drains from a word exactly as its picture leaves, with your hand on it.
 */

export type Slide = {
  id: string
  /** The word that stands for it in the pager. */
  title: string
  /** A picture to fill the frame. */
  src?: string
  /** What the picture shows, for screen readers. */
  alt?: string
  /** Anything else to fill the frame, instead of a picture. */
  content?: ReactNode
}
export type CarouselHandle = { go(i: number): void; next(): void; prev(): void }

/** The space between pictures on the strip, in px. */
const GAP = 8
const CONTROL = 'a,button,input,textarea,select,[role="button"]'
const SOON = { w: 13, z: 1 }
const AUTO = { w: 9, z: 1 }
const REST = 'color-mix(in oklch, var(--ink) 22%, transparent)'

/** A word with ink between two points along it, each edge soft, closing to nothing as they meet. */
const inked = (from: number, to: number) => {
  const a = from * 130
  const b = to * 130
  const s = Math.min(30, b - a)
  return s <= 0.01 ? `linear-gradient(90deg, ${REST}, ${REST})` : `linear-gradient(90deg, ${REST} ${(a - s).toFixed(2)}%, var(--ink) ${a.toFixed(2)}%, var(--ink) ${(b - s).toFixed(2)}%, ${REST} ${b.toFixed(2)}%)`
}
const shift = (slots: number) => (slots ? `translate3d(calc(${slots * 100}% + ${slots * GAP}px),0,0)` : '')

export function Carousel({ slides, autoplay = 5000, aspect = '16 / 8.4', label = 'Slides', onChange, ref }: {
  /** The slides, each with a title for the pager. */
  slides: Slide[]
  /** How long each slide stays, in ms. 0 leaves it to the person. */
  autoplay?: number
  /** The frame's shape. */
  aspect?: string
  /** Names it for screen readers. */
  label?: string
  /** Called with the slide it moved to. */
  onChange?: (i: number) => void
  ref?: Ref<CarouselHandle>
}) {
  const n = slides.length
  const [i, setI] = useState(0)
  const [hover, setHover] = useState(false)
  const [moving, setMoving] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const pictures = useRef<(HTMLDivElement | null)[]>([])
  const words = useRef<HTMLDivElement>(null)
  const clock = useMotionValue(0)
  const reduce = !!useReducedMotion()
  const seen = useInView(box, { amount: 0.4 })
  // A picture on a clipped strip never counts as near the screen, so all of them load together
  // once the carousel itself is close.
  const near = useInView(box, { once: true, margin: '300px' })

  const timed = !!autoplay && !reduce
  const latest = useRef({ n, timed, onChange })
  useLayoutEffect(() => {
    latest.current = { n, timed, onChange }
  })
  // The slide that holds the clock's ink, and the last one anyone was told about.
  const holder = useRef(0)
  const told = useRef(0)
  const inks = useRef<string[]>([])
  const moved = useRef<[number, number]>([0, 0])

  const paint = (x: number) => {
    const { n, timed } = latest.current
    if (strip.current) strip.current.style.transform = `translate3d(calc(${(-x * 100).toFixed(3)}% - ${(x * GAP).toFixed(2)}px),0,0)`
    // Going round from an end, the first or last picture waits just past the other end of the strip.
    const hi = stops.current[stops.current.length - 1]
    const lo = stops.current[0]
    const first = hi === n && x > (n - 1) / 2 ? n : 0
    const last = lo === -1 && x < (n - 1) / 2 ? -n : 0
    if (first !== moved.current[0]) {
      moved.current[0] = first
      const el = pictures.current[0]
      if (el) el.style.transform = shift(first)
    }
    if (last !== moved.current[1]) {
      moved.current[1] = last
      const el = pictures.current[n - 1]
      if (el) el.style.transform = shift(last)
    }
    const c = clock.get()
    const count = words.current?.children.length ?? 0
    for (let k = 0; k < count; k++) {
      // Going round, the far end of the strip is the same word as the near end.
      const pos = first && x > n - 1 && k === 0 ? x - n : last && x < 0 && k === n - 1 ? x + n : x
      const t = clamp(pos - k, -1, 1)
      let ink: string
      if (timed) {
        const on = k === holder.current
        ink = !on ? inked(0, 0) : t >= 0 ? inked(c * t, c) : inked(0, c * (1 + t))
      } else ink = t >= 0 ? inked(t, 1) : inked(0, 1 + t)
      if (ink !== inks.current[k]) {
        inks.current[k] = ink
        ;(words.current?.children[k] as HTMLElement).style.backgroundImage = ink
      }
    }
  }

  // Read live by the engine, so a step off either end can carry on round instead of rewinding.
  const stops = useRef(Array.from({ length: n }, (_, k) => k))
  const span = (lo: number, hi: number) => {
    stops.current.length = 0
    for (let k = lo; k <= hi; k++) stops.current.push(k)
  }
  const dial = useDetent({
    value: 0,
    stops: stops.current,
    reach: 0.16,
    throw: 0.28,
    spring: { w: 14, z: 0.96 },
    muted: true,
    onFrame: (x) => paint(x),
    onRest: (x) => {
      const { n } = latest.current
      const r = Math.round(x)
      const k = ((r % n) + n) % n
      span(0, n - 1)
      if (r !== k) dial.set(k)
      else paint(k)
      if (k !== holder.current) {
        holder.current = k
        clock.set(0)
      }
      if (k !== told.current) {
        told.current = k
        latest.current.onChange?.(k)
      }
      setI(k)
      setMoving(false)
    },
  })
  useMotionValueEvent(clock, 'change', () => paint(dial.get()))
  useLayoutEffect(() => {
    if (stops.current[stops.current.length - 1] === n - 1 && stops.current[0] === 0) return
    span(0, n - 1)
    dial.set(clamp(holder.current, 0, n - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
  useLayoutEffect(() => paint(dial.get()))

  const go = (k: number, instant = false) => {
    const { n } = latest.current
    if (n < 2) return
    const to = ((k % n) + n) % n
    // Already going round: finish that at once, so the next step starts from a real slide.
    if (dial.target() < 0 || dial.target() >= n) dial.set(((dial.target() % n) + n) % n)
    const from = Math.round(dial.target())
    if (to === from && dial.mode() === 'rest') return
    let place = to
    if (k >= n && from === n - 1) {
      span(0, n)
      place = n
    } else if (k < 0 && from === 0) {
      span(-1, n - 1)
      place = -1
    }
    setI(to)
    setMoving(true)
    if (to !== told.current) {
      told.current = to
      latest.current.onChange?.(to)
    }
    dial.to(place, { spring: instant ? undefined : Math.abs(place - dial.get()) > 1 ? { w: 11, z: 1 } : SOON, instant })
  }
  const step = useRef(go)
  useEffect(() => {
    step.current = go
  })

  useEffect(() => {
    if (!autoplay || reduce || hover || !seen || moving) return
    const c = animate(clock, 1, { duration: ((1 - clock.get()) * autoplay) / 1000, ease: 'linear', onComplete: () => autoStep.current() })
    return () => c.stop()
  }, [i, autoplay, reduce, hover, seen, moving, clock])
  // The clock's own step is the gentlest move there is: nobody asked for it.
  const autoStep = useRef(() => {})
  useEffect(() => {
    autoStep.current = () => {
      const { n } = latest.current
      if (n < 2) return
      const k = holder.current + 1
      if (k >= n) span(0, n)
      setMoving(true)
      setI(k % n)
      if (k % n !== told.current) {
        told.current = k % n
        latest.current.onChange?.(k % n)
      }
      dial.to(k, { spring: AUTO })
    }
  })

  useEffect(() => {
    const w = words.current
    const el = w?.children[i] as HTMLElement | undefined
    if (w && el) w.scrollTo({ left: el.offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth' })
  }, [i, reduce])

  useImperativeHandle(ref, () => ({ go: (k) => step.current(k), next: () => step.current(i + 1), prev: () => step.current(i - 1) }), [i])

  const [drag] = useState(() =>
    dragProps(dial, () => {
      // One frame's width of hand moves the strip one frame's width: a slide is that plus the gap.
      const w = frame.current?.clientWidth || 1
      return { box: () => frame.current, units: -w / (w + GAP), muted: true, onGrab: () => setMoving(true) }
    }),
  )
  const onDown = (e: PointerEvent) => {
    // A control inside a slide keeps its press.
    if (!(e.target as Element).closest?.(CONTROL)) drag.onPointerDown(e)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(i + 1, e.repeat)
    else if (e.key === 'ArrowLeft') go(i - 1, e.repeat)
    else return
    e.preventDefault()
  }
  return (
    <div
      ref={box}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="@container"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onKeyDown={onKey}
    >
      <div
        ref={frame}
        {...drag}
        onPointerDown={onDown}
        className="relative cursor-grab touch-pan-y select-none overflow-hidden rounded-[14px] bg-surface-2 active:cursor-grabbing"
        style={{ aspectRatio: aspect }}
      >
        <div ref={strip} className="absolute inset-0 flex will-change-transform" style={{ gap: GAP }}>
          {slides.map((s, k) => (
            <div
              key={s.id}
              ref={(el) => {
                pictures.current[k] = el
              }}
              aria-hidden={k !== i}
              inert={k !== i}
              className="h-full w-full shrink-0 overflow-hidden"
            >
              {s.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt={s.alt ?? s.title} draggable={false} loading={near ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover" />
              ) : (
                s.content
              )}
            </div>
          ))}
        </div>
      </div>
      <div ref={words} className="relative mt-[clamp(16px,3cqi,24px)] flex justify-between gap-7 overflow-x-auto px-2 [scrollbar-width:none]">
        {slides.map((s, k) => (
          <motion.button
            key={s.id}
            type="button"
            whileTap={press}
            aria-current={k === i}
            onClick={() => go(k)}
            className="ring-focus shrink-0 rounded-md bg-clip-text pointer-coarse:py-1.5 text-[clamp(22px,4cqi,32px)] leading-[1.25] tracking-[-0.03em] text-transparent transition-opacity hover:opacity-70"
            style={{ backgroundImage: inked(0, 0) }}
          >
            {s.title}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
