'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { Moon, Sun } from '@/lab/icons'
import { useSite } from './Providers'

type Choice = 'light' | 'dark' | 'system'
const dark = () => matchMedia('(prefers-color-scheme: dark)').matches
/** The saved choice is the store: no saved theme means light. */
const readChoice = (): Choice => {
  try {
    const s = localStorage.getItem('theme')
    return s === 'dark' || s === 'system' ? s : 'light'
  } catch {
    return 'light'
  }
}
const onChoice = (cb: () => void) => {
  window.addEventListener('detent:theme', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('detent:theme', cb)
    window.removeEventListener('storage', cb)
  }
}

/** Light, dark, or whatever the system says: a plate glides to the choice, and the page follows at once. */
export function ThemeSwitch() {
  const id = useId()
  const choice = useSyncExternalStore<Choice | null>(onChoice, readChoice, () => null)
  const pick = (c: Choice) => {
    document.documentElement.setAttribute('data-theme', c === 'system' ? (dark() ? 'dark' : 'light') : c)
    try {
      localStorage.setItem('theme', c)
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event('detent:theme'))
  }
  const items: [Choice, string, ReactNode][] = [
    ['light', 'Light', <Sun key="l" size={14} />],
    ['dark', 'Dark', <Moon key="d" size={14} />],
    [
      'system',
      'Match the system',
      <svg key="s" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="12.5" rx="2.5" />
        <path d="M9 20.5h6M12 16.5v4" />
      </svg>,
    ],
  ]
  return (
    <span role="radiogroup" aria-label="Theme" className="flex h-8 items-center rounded-full bg-surface-2 p-[3px]">
      {items.map(([c, label, icon]) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={choice === c}
          aria-label={label}
          title={label}
          onClick={() => pick(c)}
          className={`ring-focus relative flex h-full w-8 items-center justify-center rounded-full transition-colors duration-200 ${choice === c ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {choice === c && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-plate shadow-raised" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span className="relative">{icon}</span>
        </button>
      ))}
    </span>
  )
}

/* ───────────────────────────── The wordmark ───────────────────────────── */

const CLICK = { type: 'spring', stiffness: 900, damping: 21, mass: 0.6 } as const
const RISE = { type: 'spring', stiffness: 260, damping: 22, mass: 0.9 } as const
const SEAT = { type: 'spring', stiffness: 520, damping: 24, mass: 0.8 } as const

/*
 * The wordmark's layout, measured from Geist at weight 760 and 300 units, tracked -16. The D is
 * the mark itself, scaled to Geist's cap height (213), so the logo and the word are one object;
 * the letters sit as close to it as they sit to each other. Each letter is placed at its measured
 * origin, and the view box stops 38 units above the baseline, so the word sinks off the page.
 */
const CAP = 213
const S = CAP / 18 // the mark's grid unit, so its D is exactly a capital tall
const BASE = 213
const VIEW = { w: 931, h: 175 }
const LETTERS: [string, number][] = [
  ['e', 200.65],
  ['t', 361.23],
  ['e', 477.9],
  ['n', 643.18],
  ['t', 802.01],
]
const WEIGHT = 760
const MARK_AT = `translate(${-3.75 * S} ${BASE - 21 * S}) scale(${S})`

/**
 * The foot of every page: the name, monumental, sinking off the bottom edge. The first time it
 * comes into view the letters rise into their places one after another and settle with a little
 * give, and last of all the D's half-disc rises into its seat and clicks, landing in the accent
 * before it cools to ink. While it's on screen a soft glint of light crosses the letters now and then.
 * Point at a letter and it lifts and drops back into place, like a key.
 */
export function Wordmark() {
  const { tick } = useSite()
  const box = useRef<SVGSVGElement>(null)
  const id = 'wm' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const half = useMotionValue(VIEW.h + 20)
  const rise = useMotionValue(VIEW.h + 20)
  const [seen, setSeen] = useState(false)
  const [live, setLive] = useState(false)
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setLive(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The D's slab rises first; last of all its half-disc rises into its seat and clicks.
  useEffect(() => {
    if (!seen) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rise.set(0)
      half.set(0)
      return
    }
    const up = animate(rise, 0, RISE)
    const t = setTimeout(() => {
      animate(half, 0, SEAT)
      setFlash((f) => f + 1)
    }, 760)
    return () => {
      up.stop()
      clearTimeout(t)
    }
  }, [seen, half, rise])

  const clickD = () => {
    if (!seen) return
    animate(half, -16, { duration: 0.12, ease: [0.3, 0, 0.6, 1] }).then(() => {
      animate(half, 0, CLICK)
      setTimeout(tick, 60)
    })
  }

  return (
    <svg ref={box} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label="Detent" className={`block h-auto w-full select-none text-ink ${live ? 'glint-on' : ''}`}>
      <defs>
        {/* The word sinks: full ink at the top, softer where the page cuts it off. */}
        <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VIEW.h}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.45" />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="-400" width={VIEW.w} height={VIEW.h + 800}>
          <rect x="0" y="-400" width={VIEW.w} height="400" fill="#fff" />
          <rect x="0" y="0" width={VIEW.w} height={VIEW.h + 400} fill={`url(#${id}f)`} />
        </mask>
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" className="glint-stop glint-edge" />
          <stop offset="0.3" className="glint-stop glint-half" />
          <stop offset="0.5" className="glint-stop glint-peak" />
          <stop offset="0.7" className="glint-stop glint-half" />
          <stop offset="1" className="glint-stop glint-edge" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <g transform={MARK_AT}>
            <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" />
            <path d="M11.25 3a9 9 0 0 1 0 18z" />
          </g>
          {LETTERS.map(([c, x], i) => (
            <text key={i} x={x} y={BASE} fontSize="300" fontWeight={WEIGHT} letterSpacing="-16" style={{ fontFamily: 'var(--font-geist)' }}>
              {c}
            </text>
          ))}
        </clipPath>
      </defs>

      <g fill="currentColor" mask={`url(#${id}m)`}>
        <motion.g style={{ y: rise }}>
          <rect transform={MARK_AT} x="3.75" y="3" width="5.5" height="18" rx="1.1" />
        </motion.g>
        <motion.g style={{ y: half }} onPointerEnter={clickD}>
          <g key={flash} transform={MARK_AT} className={flash ? 'seat-flash' : undefined}>
            <path d="M11.25 3a9 9 0 0 1 0 18z" />
          </g>
        </motion.g>
        {LETTERS.map(([c, x], i) => (
          <Letter key={i} c={c} x={x} seen={seen} delay={0.08 + i * 0.07} onPress={tick} />
        ))}
      </g>

      {/* The glint: a soft band of light crossing the word inside its letters. */}
      <g clipPath={`url(#${id}c)`} pointerEvents="none">
        <g transform={`rotate(14 ${VIEW.w / 2} ${VIEW.h / 2})`}>
          <rect className="glint glint-wide" x="-260" y="-200" width="180" height="600" fill={`url(#${id}g)`} />
        </g>
      </g>
    </svg>
  )
}

/** One letter of the wordmark: rises into place when first seen, and lifts and drops back under the pointer. */
function Letter({ c, x, seen, delay, onPress }: { c: string; x: number; seen: boolean; delay: number; onPress: () => void }) {
  const y = useMotionValue(VIEW.h + 20)
  useEffect(() => {
    if (!seen) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return void y.set(0)
    const run = animate(y, 0, { ...RISE, delay })
    return () => run.stop()
  }, [seen, delay, y])
  const lift = () => {
    if (!seen) return
    animate(y, -16, { duration: 0.12, ease: [0.3, 0, 0.6, 1] }).then(() => {
      animate(y, 0, CLICK)
      setTimeout(onPress, 60)
    })
  }
  return (
    <motion.text x={x} y={BASE} fontSize="300" fontWeight={WEIGHT} letterSpacing="-16" style={{ y, fontFamily: 'var(--font-geist)' }} onPointerEnter={lift}>
      {c}
    </motion.text>
  )
}

/* ───────────────────────────── Layout shift, measured ───────────────────────────── */

type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean }
let shifted = 0
let watching = false
const heard = new Set<() => void>()
const measurable = () => typeof PerformanceObserver !== 'undefined' && !!PerformanceObserver.supportedEntryTypes?.includes('layout-shift')
const watchShift = (cb: () => void) => {
  heard.add(cb)
  if (!watching && measurable()) {
    watching = true
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Shift[]) if (!e.hadRecentInput) shifted += e.value
      heard.forEach((h) => h())
    }).observe({ type: 'layout-shift', buffered: true })
  }
  return () => void heard.delete(cb)
}

/**
 * The library's promise, checked live: how far this visit's layout has shifted, measured by the
 * browser's own Layout Instability API. Its slot is held from the first paint and it fades in
 * once there's a number, so the readout never shifts anything itself. Browsers that can't
 * measure it leave the slot empty rather than claim a number.
 */
export function ShiftReadout() {
  const v = useSyncExternalStore(
    watchShift,
    () => (measurable() ? shifted : -1),
    () => -1,
  )
  const shown = v >= 0
  return (
    <span className={`flex items-center gap-2 text-ink-3 transition-opacity duration-500 ${shown ? '' : 'opacity-0'}`} title="Measured live in your browser by the Layout Instability API, since you arrived." aria-hidden={!shown}>
      <span className={`size-1.5 rounded-full ${v < 0.001 ? 'bg-ok' : 'bg-[var(--warn)]'}`} />
      <span className="tnum font-mono text-[12px] text-ink-2">{Math.max(0, v).toFixed(3)}</span>
      layout shift this visit
    </span>
  )
}
