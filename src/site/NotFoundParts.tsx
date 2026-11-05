'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Search } from '@/lab/icons'
import { Kbd } from '@/lab/ui/Kbd'
import { useSite } from './Providers'

const SEAT = { x: -148, y: -36 }
const REACH = 44
const FLOOR: [number, number] = [-20, 0]
const CLICK = { type: 'spring', stiffness: 900, damping: 21, mass: 0.6 } as const
const HOME = { type: 'spring', stiffness: 420, damping: 32 } as const
const SWAY = { type: 'spring', stiffness: 260, damping: 17 } as const

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const away = (x: number, y: number) => Math.hypot(x - SEAT.x, y - SEAT.y)
const lean = (d: number) => {
  const t = clamp((d - 12) / 150, 0, 1)
  return -90 * t * t * (3 - 2 * t)
}

export function Missing() {
  const { tick } = useSite()
  const x = useMotionValue(SEAT.x)
  const y = useMotionValue(SEAT.y)
  const turn = useMotionValue(0)
  const nudge = useMotionValue(0)
  const empty = useTransform(() => clamp(away(x.get(), y.get()) / 8, 0, 1))
  const [hot, setHot] = useState(false)
  const [fixed, setFixed] = useState(false)
  const [flash, setFlash] = useState(0)
  const dragged = useRef(false)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => void timers.current.push(window.setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const fall = () => {
    if (calm()) return void (x.set(clamp(x.get(), ...FLOOR)), y.set(0), turn.set(-90))
    const from = y.get()
    if (from >= 0) {
      animate(y, 0, HOME)
    } else {
      const t = 0.26 + -from / 1100
      animate(y, [from, 0, Math.min(-2, from / 40), 0], { duration: t * 1.4, times: [0, 0.7, 0.85, 1], ease: ['easeIn', 'easeOut', 'easeIn'] })
    }
    animate(x, clamp(x.get(), ...FLOOR), { duration: 0.5, ease: [0.2, 0.7, 0.3, 1] })
    animate(turn, -90, SWAY)
  }

  const seat = () => {
    const far = away(x.get(), y.get())
    setFixed(true)
    if (calm()) return void (x.set(SEAT.x), y.set(SEAT.y), turn.set(0), setFlash((f) => f + 1))
    const go = far > REACH ? HOME : CLICK
    animate(x, SEAT.x, go)
    animate(y, SEAT.y, go)
    animate(turn, 0, go)
    later(
      () => {
        tick()
        setFlash((f) => f + 1)
        animate(nudge, [0, -1.5, 0], { duration: 0.28, ease: 'easeOut' })
      },
      far > REACH ? 260 : 50,
    )
  }

  const unseat = () => {
    setFixed(false)
    if (calm()) return fall()
    animate(x, SEAT.x + 22, { duration: 0.16, ease: [0.4, 0, 0.6, 1] }).then(() => {
      animate(x, 0, { duration: 0.62, ease: [0.25, 0.6, 0.3, 1] })
      animate(y, [SEAT.y, SEAT.y - 6, 0, -3, 0], { duration: 0.66, times: [0, 0.2, 0.72, 0.86, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] })
      animate(turn, [0, -12, -90], { duration: 0.6, times: [0, 0.3, 1], ease: ['easeOut', [0.5, 0, 0.3, 1]] })
    })
  }

  const intro = useRef(0)
  useEffect(() => {
    if (calm()) return void (x.set(0), y.set(0), turn.set(-90))
    intro.current = window.setTimeout(unseat, 900)
    return () => clearTimeout(intro.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, [])

  return (
    <>
      <div className="relative h-[168px] w-[316px] max-w-full select-none text-ink">
        <svg width="316" height="168" viewBox="0 0 316 168" aria-hidden className="absolute inset-0 overflow-visible">
          <motion.rect x="0" y="24" width="44" height="144" rx="8.8" fill="currentColor" style={{ x: nudge }} />
          <motion.path
            d="M60.75 24.75a71.25 71.25 0 0 1 0 142.5z"
            fill="none"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            className="transition-[stroke] duration-150"
            style={{ stroke: hot ? 'var(--accent)' : 'var(--quiet)', opacity: empty }}
          />
        </svg>
        <motion.button
          type="button"
          aria-label={fixed ? 'Take the piece out again' : 'Put the missing piece back'}
          className="ring-focus absolute left-[208px] top-[60px] h-[144px] w-[72px] cursor-grab rounded-[4px] active:cursor-grabbing"
          style={{ x, y, rotate: turn, touchAction: 'none' }}
          drag
          dragMomentum={false}
          whileDrag={{ scale: 1.03 }}
          onDragStart={() => {
            dragged.current = true
            clearTimeout(intro.current)
            x.stop()
            y.stop()
            turn.stop()
            setFixed(false)
          }}
          onDrag={() => {
            const d = away(x.get(), y.get())
            turn.set(lean(d))
            setHot(d < REACH)
          }}
          onDragEnd={() => {
            setHot(false)
            if (away(x.get(), y.get()) < REACH) seat()
            else fall()
            later(() => (dragged.current = false), 0)
          }}
          onClick={() => {
            if (dragged.current) return
            if (away(x.get(), y.get()) < 2) unseat()
            else seat()
          }}
        >
          <svg width="72" height="144" viewBox="0 0 72 144" aria-hidden className="block overflow-visible">
            <path key={flash} d="M0 0a72 72 0 0 1 0 144z" fill="currentColor" className={flash ? 'seat-flash' : undefined} />
          </svg>
        </motion.button>
      </div>
      <p className="mt-12 flex items-center gap-2 text-footnote text-ink-3">
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--warn)]" />
        <span className="tnum font-mono text-[12px] text-ink-2">404</span>
        Not found
      </p>
      <h1 className="mt-5 text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink">
        This page is missing a piece.
        <Aside fixed={fixed} />
      </h1>
    </>
  )
}

function Aside({ fixed }: { fixed: boolean }) {
  const line = (on: boolean) => `col-start-1 row-start-1 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] ${on ? '' : 'opacity-0'}`
  return (
    <span className="-mb-[0.14em] grid overflow-hidden pb-[0.14em] text-quiet">
      <span aria-hidden={fixed} className={`${line(!fixed)} ${fixed ? '-translate-y-full' : ''}`}>
        Put it back, or head home.
      </span>
      <span aria-hidden={!fixed} className={`${line(fixed)} ${fixed ? '' : 'translate-y-full'}`}>
        Much better. Still no page.
      </span>
    </span>
  )
}

export type Page = { path: string; href: string }

function edits(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j)))
  const swapped = (i: number, j: number) => i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== b[j - 1]
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (swapped(i, j)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  const touched = new Set<number>()
  let i = a.length
  let j = b.length
  while (i > 0 || j > 0) {
    if (swapped(i, j) && d[i][j] === d[i - 2][j - 2] + 1) {
      touched.add(j - 1).add(j - 2)
      i -= 2
      j -= 2
    } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] !== b[j - 1]) touched.add(j - 1)
      i--
      j--
    } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) touched.add(--j)
    else i--
  }
  return { distance: d[a.length][b.length], touched }
}

const last = (p: string) => p.slice(p.lastIndexOf('/') + 1)

function nearest(asked: string, pages: Page[]) {
  const typed = asked.replace(/\/+$/, '') || '/'
  const want = typed.toLowerCase()
  let best: { href: string; score: number; whole: boolean } | null = null
  for (const p of pages) {
    const whole = edits(want, p.path).distance
    const part = last(want).length >= 3 ? edits(last(want), last(p.path)).distance : Infinity
    const byWhole = whole <= Math.max(2, Math.floor(p.path.length * 0.3)) ? whole : Infinity
    const byPart = part <= Math.max(1, Math.floor(last(p.path).length * 0.34)) ? part + 1 : Infinity
    const score = Math.min(byWhole, byPart)
    if (score < (best?.score ?? Infinity)) best = { href: p.href, score, whole: byWhole <= byPart && p.path === p.href }
  }
  if (!best) return null
  const { touched } = edits(typed, best.href)
  return { href: best.href, marks: best.whole && touched.size <= 4 ? touched : new Set<number>() }
}

const never = () => () => {}

export function Nearest({ pages }: { pages: Page[] }) {
  const path = usePathname()
  const ready = useSyncExternalStore(never, () => true, () => false)
  const asked = ready ? decode(path) : null
  const hit = useMemo(() => (asked ? nearest(asked, pages) : null), [asked, pages])
  return (
    <p className={`flex h-6 min-w-0 max-w-full items-center justify-center whitespace-nowrap text-body text-ink-3 transition-opacity duration-300 ${asked ? '' : 'opacity-0'}`}>
      {asked &&
        (hit ? (
          <>
            Did you mean&nbsp;
            <Link href={hit.href} className="ring-focus min-w-0 truncate rounded-[4px] font-mono text-callout text-ink underline-offset-4 hover:underline">
              {[...hit.href].map((c, i) => (hit.marks.has(i) ? <span key={i} className="text-[var(--accent-ink)]">{c}</span> : c))}
            </Link>
            ?
          </>
        ) : (
          <>
            There’s no page at&nbsp;<span className="min-w-0 truncate font-mono text-callout text-ink-2">{asked}</span>.
          </>
        ))}
    </p>
  )
}

function decode(path: string) {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

export function SearchPill() {
  const { openSearch } = useSite()
  return (
    <button
      type="button"
      onClick={openSearch}
      data-search
      className="ring-focus flex h-11 items-center gap-2.5 rounded-full bg-surface pl-4 pr-2 text-callout font-medium text-ink shadow-raised transition-shadow duration-150 hover:shadow-[var(--elev-raised-hover)] max-sm:pr-5"
    >
      <Search size={15} className="text-ink-3" />
      Search the library
      <span className="flex gap-0.5 pl-1 max-sm:hidden">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  )
}
