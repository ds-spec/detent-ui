'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { useReducedMotion } from 'motion/react'
import { at, clamp, createRoller, dragProps, feedback, springStep, stepKey, useDetent } from '@/lab/lib/detent'
import type { Body } from '@/lab/lib/detent'
import { RollingText } from '@/lab/ui/RollingText'
import { compact } from './parts'

export { ChartCard } from './ChartCard'
export { compact } from './parts'

/** A goal and how far it had got by each day so far: `series[i]` is the running total at the end of day i. */
export type Goal = { id: string; label: string; goal: number; series: number[]; format?: (n: number) => string }
export type GoalsHandle = {
  point(id: string | null): void
  /** Goes to a day, or back to today with null. */
  scrub(day: number | null): void
  /** Walks to a day at a hand's pace, for a demo. Pressing against a goal works just as it does by hand. */
  sweep(day: number, ms: number): void
}

/** What follows the count: after a dot, or on its own line where the row is narrow. */
const Note = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <span className={`${className} @max-[300px]:block`}>
    <span className="@max-[300px]:hidden"> · </span>
    {children}
  </span>
)

/** The fill's colour, soft enough to read type through: the accent, or amber past the goal. */
const FILL = 'bg-[color-mix(in_oklch,var(--accent)_15%,transparent)] dark:bg-[color-mix(in_oklch,var(--accent)_30%,transparent)]'
const FILL_OVER = 'bg-[color-mix(in_oklch,var(--warn)_24%,transparent)] dark:bg-[color-mix(in_oklch,var(--warn)_20%,transparent)]'

/** How far a bar's end gives before it breaks, as a share of its width. */
const GIVE = 0.022
const HOLDING = { w: 46, z: 1 }
const SNAPPING = { w: 30, z: 0.34 }
const FLOOD = { w: 15, z: 1 }
const CATCH_UP = { w: 22, z: 1 }
const RISE = { w: 8.5, z: 1 }

/** One goal's own physics, all of it driven by the day. */
type Row = { through: boolean; held: Body; strain: Body; flood: Body; last: number; pct: number; wall: number }
type Parts = { track: HTMLElement | null; fill: HTMLElement | null; over: HTMLElement | null; number: ((v: number, speed: number) => void) | null }

/** How much further than the goal the hand must push before it gives way: about a day and a half. */
const wallOf = (g: Goal) => {
  const i = g.series.findIndex((v) => v >= g.goal)
  const daily = i > 0 ? g.series[i] - g.series[i - 1] : 0
  return Math.max(0.018, (daily / g.goal) * 1.5)
}
const blank = (): Row => ({ through: false, held: { x: 0, v: 0 }, strain: { x: 0, v: 0 }, flood: { x: 0, v: 0 }, last: 0, pct: 0, wall: 0.02 })

/**
 * Goals you can read at a glance. Each goal is one soft bar that fills as far as it has got, with its
 * percentage set large on top, the bar and the number turning on the same value. Under the goals is
 * the period: drag or flick along it and the whole card runs back through the days with momentum.
 *
 * A goal is a wall. Push a bar into 100% and it stops, the number holding while the end of the bar
 * gives under your hand; keep pushing and it breaks through, the number running up to where it really
 * is and the bar flooding amber from the far end. Pull back and it closes again.
 */
export function GoalNumerals({
  goals,
  days,
  today,
  dayLabel = (d) => `Day ${d + 1}`,
  onDayChange,
  onOver,
  muted,
  ref,
}: {
  goals: Goal[]
  /** How many days the period has. */
  days: number
  /** Which day is today, counting from 0. The scrubber stops here. */
  today: number
  /** How to name a day on the scrubber, e.g. (d) => `Oct ${d + 1}`. */
  dayLabel?: (day: number) => string
  /** Called with the day being read, or null when it's back on today. */
  onDayChange?: (day: number | null) => void
  /** Called with the goals past their wall, the moment one breaks through or falls back. */
  onOver?: (ids: string[]) => void
  /** Silence the soft click as a bar breaks through. */
  muted?: boolean
  ref?: Ref<GoalsHandle>
}) {
  const reduce = useReducedMotion()
  const [hovered, setAt] = useState<string | null>(null)
  const [day, setDayState] = useState<number | null>(null)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const setDay = (d: number | null) => {
    setDayState(d)
    onDayChange?.(d)
  }
  const mark = (id: string, on: boolean) => {
    setBroken((b) => ({ ...b, [id]: on }))
    latest.current.onOver?.(Object.entries(rows.current).flatMap(([k, r]) => (r.through ? [k] : [])))
  }

  const stops = useMemo(() => Array.from({ length: today + 1 }, (_, i) => i), [today])
  const walls = useMemo(() => Object.fromEntries(goals.map((g) => [g.id, wallOf(g)])), [goals])
  const parts = useRef<Record<string, Parts>>({})
  const rows = useRef<Record<string, Row>>({})
  // The bars rise from empty the first time, on the same physics, so the first look is the fill arriving.
  const rise = useRef<Body>({ x: reduce ? 1 : 0, v: 0 })
  const thumb = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)
  const byHand = useRef(false)
  const latest = useRef({ goals, today, days, muted, setDay, walls, onOver })
  useLayoutEffect(() => {
    latest.current = { goals, today, days, muted, setDay, walls, onOver }
  })

  const paint = (x: number, v: number, dt: number) => {
    const { goals, today, days, muted, walls } = latest.current
    const reading = clamp(x, 0, today)
    const e = rise.current
    if (reduce) e.x = 1
    let more = false
    if (dt > 0 && e.x < 1) {
      springStep(e, 1, RISE, dt)
      if (1 - e.x < 0.002) {
        e.x = 1
        e.v = 0
      }
    }
    if (e.x < 1) more = true
    for (const g of goals) {
      const row = (rows.current[g.id] ??= blank())
      const el = parts.current[g.id]
      if (!el) continue
      const p = (at(g.series, Math.min(reading, g.series.length - 1)) / g.goal) * e.x
      const pressing = dt > 0 && v > 0.04
      const wall = walls[g.id] ?? 0.02
      // Moving into it, it holds. Stopped, it can't: a number at rest always tells the truth.
      if (p <= 1 && row.through) {
        row.through = false
        mark(g.id, false)
      } else if (p > 1 && !row.through && (p > 1 + wall || !pressing)) {
        row.through = true
        // What the bar was holding back runs out through the same place.
        row.held.x = 1 - p
        row.held.v = 0
        mark(g.id, true)
        if (byHand.current && !muted) feedback.tick(true, Math.abs(v) / 8)
      }
      const push = !row.through && p > 1 ? (p - 1) / wall : 0
      const give = push > 0 ? GIVE * (1 - 1 / (1 + push * 2.2)) * 1.45 : 0
      if (reduce) {
        row.strain.x = row.strain.v = row.held.x = row.held.v = 0
        row.flood.x = row.through ? 1 : 0
      } else if (dt > 0) {
        springStep(row.strain, give, row.through ? SNAPPING : HOLDING, dt)
        springStep(row.flood, row.through ? 1 : 0, FLOOD, dt)
        if (row.held.x || row.held.v) springStep(row.held, 0, CATCH_UP, dt)
      }
      const q = row.through ? p + row.held.x : Math.min(p, 1)
      const flood = clamp(row.flood.x, 0, 1)
      const speed = dt > 0 ? (q * 100 - row.pct) / dt : 0
      row.pct = q * 100
      if (el.track) el.track.style.transform = `scaleX(${1 + Math.max(-0.006, row.strain.x)})`
      if (el.fill) {
        el.fill.style.transform = `translate3d(${(Math.min(1, q) - 1) * 100}%,0,0)`
        el.fill.style.opacity = String(1 - flood)
      }
      if (el.over) el.over.style.transform = `translate3d(${(1 - flood) * 100}%,0,0)`
      el.number?.(Math.max(0, Math.min(999, q * 100)), speed)
      if (Math.abs(row.strain.x) + Math.abs(row.strain.v) > 1e-4 || Math.abs(row.held.x) + Math.abs(row.held.v) > 1e-3 || Math.abs(row.flood.x - (row.through ? 1 : 0)) > 1e-3) more = true
    }
    const span = Math.max(1, days - 1)
    if (thumb.current) thumb.current.style.transform = `translate3d(${(x / span) * 100}%,0,0)`
    if (line.current) line.current.style.transform = `translate3d(${(x / span - 1) * 100}%,0,0)`
    return more
  }

  const dial = useDetent({
    value: today,
    stops,
    min: 0,
    reach: 1.1,
    throw: 0.2,
    spring: { w: 12.5, z: 1 },
    catch: { w: 26, z: 1 },
    muted: true,
    onFrame: (x, v, { dt }) => paint(x, v, dt),
    onStop: (i) => latest.current.setDay(i),
    onRest: (_, i) => {
      byHand.current = false
      if (i === latest.current.today) latest.current.setDay(null)
    },
  })
  useImperativeHandle(ref, () => ({
    point: setAt,
    // A script never takes it out of a hand.
    scrub: (d) => void (dial.mode() !== 'held' && dial.to(d === null ? today : clamp(d, 0, today), { spring: { w: 22, z: 1 } })),
    sweep: (d, ms) => void (dial.mode() !== 'held' && dial.sweep(clamp(d, 0, today), ms)),
  }))

  // Painted once before it's seen, then the rise plays.
  useLayoutEffect(() => {
    paint(dial.get(), 0, 0)
    dial.wake()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial])

  const d = day ?? today
  const pace = (d + 1) / days

  // A finger can't leave: what it touched stays shown until a tap lands somewhere else.
  const root = useRef<HTMLDivElement>(null)
  const touched = hovered !== null || day !== null
  useEffect(() => {
    if (!touched) return
    const away = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'touch' || root.current?.contains(e.target as Node)) return
      setAt(null)
      dial.to(today)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [touched, dial, today])

  return (
    <div ref={root} className="@container" onPointerLeave={(e) => e.pointerType !== 'touch' && setAt(null)}>
      <ul className="flex flex-col gap-2">
        {goals.map((g) => {
          const f = g.format ?? compact
          const v = g.series[Math.min(d, g.series.length - 1)] ?? 0
          const p = v / g.goal
          const pct = Math.min(999, Math.round(p * 100))
          const over = !!broken[g.id]
          const ahead = !over && p > pace + 0.04
          const even = !over && !ahead && p > pace - 0.04
          const el = (parts.current[g.id] ??= { track: null, fill: null, over: null, number: null })
          return (
            <li key={g.id}>
              <button
                type="button"
                onPointerEnter={() => setAt(g.id)}
                onFocus={() => setAt(g.id)}
                onBlur={() => setAt(null)}
                aria-label={`${g.label}: ${f(v)} of ${f(g.goal)}, ${pct}%${p > 1 ? `, ${pct - 100}% over` : ahead ? ', ahead of pace' : ''}`}
                className={`ring-focus relative flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-opacity duration-150 ${hovered && hovered !== g.id ? 'opacity-45' : ''}`}
              >
                {/* The bar is its own layer, so it can give under the hand without the type moving. */}
                <span
                  aria-hidden
                  ref={(n) => {
                    el.track = n
                  }}
                  className="absolute inset-0 origin-left overflow-hidden rounded-[16px] bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] will-change-transform"
                >
                  <span
                    ref={(n) => {
                      el.fill = n
                    }}
                    className={`absolute inset-0 rounded-[16px] ${FILL}`}
                    style={{ transform: 'translate3d(-100%,0,0)' }}
                  />
                  <span
                    ref={(n) => {
                      el.over = n
                    }}
                    className={`absolute inset-0 rounded-[16px] ${FILL_OVER}`}
                    style={{ transform: 'translate3d(100%,0,0)' }}
                  />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-callout text-ink">{g.label}</span>
                  <span className="tnum mt-0.5 block truncate text-footnote text-ink-2 @max-[300px]:min-h-[2lh] @max-[300px]:whitespace-normal">
                    {f(v)} of {f(g.goal)}
                    {over ? <Note className="text-warn-ink">{Math.max(0, pct - 100)}% over</Note> : ahead ? <Note>ahead of pace</Note> : even ? <Note>on pace</Note> : null}
                  </span>
                </span>
                <span className={`relative flex items-center text-[38px] leading-[44px] tracking-[-0.035em] transition-colors duration-200 @max-[300px]:text-[30px] ${over ? 'text-warn-ink' : 'text-ink'}`}>
                  <span className="sr-only">{pct}</span>
                  <Wheels onReady={(set) => (el.number = set)} />
                  <span aria-hidden className="ml-1 self-start pt-[5px] text-[17px] leading-[20px] tracking-normal opacity-55 @max-[300px]:text-[14px]">
                    %
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <DayScrubber goals={goals} days={days} today={today} day={day} label={dayLabel} dial={dial} thumb={thumb} line={line} byHand={byHand} muted={muted} />
    </div>
  )
}

const whole = (n: number) => String(Math.round(n))

/** The percentage on its wheels. React only ever renders the empty slot; the dial turns them. */
function Wheels({ onReady }: { onReady: (set: (v: number, speed: number) => void) => void }) {
  const el = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const set = createRoller(el.current!, whole, 3)
    set(0, 0)
    onReady(set)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <span ref={el} aria-hidden className="tnum inline-flex" style={{ lineHeight: '1.25em', height: '1.25em', minWidth: '3ch', justifyContent: 'flex-end' }} />
}

/**
 * The period. Hover or drag along it to read a day, flick it and the whole card runs on with
 * momentum and comes to rest on a day; arrow keys step it. Days still to come are out of reach, so
 * the end gives like a rubber band, and an amber dot sits on the day each goal went over.
 */
function DayScrubber({ goals, days, today, day, label, dial, thumb, line, byHand, muted }: { goals: Goal[]; days: number; today: number; day: number | null; label: (d: number) => string; dial: ReturnType<typeof useDetent>; thumb: Ref<HTMLSpanElement>; line: Ref<HTMLSpanElement>; byHand: { current: boolean }; muted?: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const d = day ?? today
  const crossed = [...new Set(goals.map((g) => g.series.findIndex((v) => v >= g.goal)).filter((i) => i >= 0))]
  const x = (i: number) => `${(i / Math.max(1, days - 1)) * 100}%`
  const span = useRef(days - 1)
  const end = useRef(today)
  const quiet = useRef(muted)
  useLayoutEffect(() => {
    span.current = days - 1
    end.current = today
    quiet.current = muted
  })
  const [drag] = useState(() =>
    dragProps(dial, () => ({
      box: () => track.current,
      units: span.current,
      absolute: (f) => f * span.current,
      hover: true,
      muted: quiet.current,
      onGrab: () => (byHand.current = true),
      onTap: (f) => dial.to(Math.round(clamp(f * span.current, 0, end.current)), { spring: { w: 22, z: 1 } }),
      onLeave: () => dial.to(end.current),
    })),
  )
  const key = (e: KeyboardEvent) => {
    if (stepKey(dial, e)) return
    if (e.key === 'Home') dial.to(0)
    else if (e.key === 'End' || e.key === 'Escape') dial.to(today)
    else return
    e.preventDefault()
  }

  return (
    <div className="mt-3 flex items-center gap-4">
      <p className="tnum flex w-[92px] shrink-0 items-center text-footnote">
        <RollingText text={label(d)} className="text-ink" proportional still={day !== null} />
        {day === null && <span className="text-ink-3">&nbsp;· today</span>}
      </p>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Read the goals on a day"
        aria-valuemin={1}
        aria-valuemax={today + 1}
        aria-valuenow={d + 1}
        aria-valuetext={label(d)}
        onKeyDown={key}
        {...drag}
        className="ring-focus relative flex h-8 flex-1 cursor-ew-resize touch-pan-y select-none items-center rounded-full pointer-coarse:h-10"
      >
        {/* The whole period, the days so far, and the days being read: three depths of one line. */}
        <span className="absolute inset-x-0 h-1.5 rounded-full bg-[color-mix(in_oklch,var(--ink)_6%,transparent)]" />
        <span className="absolute left-0 h-1.5 rounded-full bg-[color-mix(in_oklch,var(--ink)_8%,transparent)]" style={{ width: x(today) }} />
        <span className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full">
          <span ref={line} className="absolute inset-0 rounded-full bg-accent" style={{ transform: `translate3d(${(today / Math.max(1, days - 1) - 1) * 100}%,0,0)` }} />
        </span>
        {crossed.map((i) => (
          <span key={i} className={`absolute size-[6px] -translate-x-1/2 rounded-full bg-warn shadow-[0_0_0_2px_var(--surface)] transition-opacity duration-150 ${i > d ? 'opacity-55' : ''}`} style={{ left: x(i) }} />
        ))}
        <span ref={thumb} aria-hidden className="pointer-events-none absolute inset-x-0 h-[18px]" style={{ transform: `translate3d(${(today / Math.max(1, days - 1)) * 100}%,0,0)` }}>
          <span className="absolute left-0 top-0 size-[18px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_0.5px_rgb(0_0_0/0.14),0_1px_4px_rgb(0_0_0/0.2)]" />
        </span>
      </div>
    </div>
  )
}
