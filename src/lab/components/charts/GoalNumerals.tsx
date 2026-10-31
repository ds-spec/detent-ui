'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { DotType } from '@/lab/ui/DotType'
import { RollingText } from '@/lab/ui/RollingText'
import { useSize } from '@/lab/lib/hooks'
import { compact } from './parts'

export { ChartCard } from './ChartCard'
export { compact } from './parts'

/** A goal and how far it had got by each day so far: `series[i]` is the running total at the end of day i. */
export type Goal = { id: string; label: string; goal: number; series: number[]; format?: (n: number) => string }
export type GoalsHandle = { point(id: string | null): void; scrub(day: number | null): void }

const DOT = 5
const GAP = 2.5
/** What follows the count: after a dot, or on its own line where the row is narrow. */
const Note = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <span className={`${className} @max-[380px]:block`}>
    <span className="@max-[380px]:hidden"> · </span>
    {children}
  </span>
)

/**
 * Goals as their own numbers. Each percentage is set large in a dot matrix and is its own bar: the
 * dots ink from the bottom up as far as the goal has got, and past the goal the top rows turn amber.
 * A notch beside each number marks where it should be by now, so a number filled past its notch is
 * running ahead. Under the goals, a ruler of the period's days: run along it and every number
 * relights to that day, dot by dot, with amber marks on the days a goal went over. Let go and it
 * springs back to today.
 */
export function GoalNumerals({
  goals,
  days,
  today,
  dayLabel = (d) => `Day ${d + 1}`,
  onDayChange,
  ref,
}: {
  goals: Goal[]
  /** How many days the period has. */
  days: number
  /** Which day is today, counting from 0. The ruler stops here. */
  today: number
  /** How to name a day on the ruler, e.g. (d) => `Oct ${d + 1}`. */
  dayLabel?: (day: number) => string
  /** Called with the day being read, or null when it's back on today. */
  onDayChange?: (day: number | null) => void
  ref?: Ref<GoalsHandle>
}) {
  const reduce = useReducedMotion()
  const [at, setAt] = useState<string | null>(null)
  const [day, setDayState] = useState<number | null>(null)
  const setDay = (d: number | null) => {
    setDayState(d)
    onDayChange?.(d)
  }
  useImperativeHandle(ref, () => ({ point: setAt, scrub: (d) => setDay(d === null ? null : Math.max(0, Math.min(today, d))) }))
  // The numbers arrive empty and fill on the next frame, so the first look is the fill rising.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const f = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(f)
  }, [])

  const d = day ?? today
  const pace = (d + 1) / days
  const scrubbing = day !== null

  // A finger can't leave: what it touched stays shown until a tap lands somewhere else.
  const root = useRef<HTMLDivElement>(null)
  // On a narrow card the numerals shrink so the goal's name and figures keep their room.
  const rw = useSize(root).w
  const narrow = rw > 0 && rw < 260
  const dot = narrow ? 3.5 : DOT
  const gap = narrow ? 2 : GAP
  const tall = 7 * (dot + gap) - gap
  const touched = at !== null || day !== null
  useEffect(() => {
    if (!touched) return
    const away = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'touch' || root.current?.contains(e.target as Node)) return
      setAt(null)
      setDay(null)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched])

  return (
    <div ref={root} onPointerLeave={(e) => e.pointerType !== 'touch' && setAt(null)}>
      <ul className="divide-y divide-line">
        {goals.map((g) => {
          const f = g.format ?? compact
          const v = g.series[Math.min(d, g.series.length - 1)] ?? 0
          const p = v / g.goal
          const pct = Math.min(999, Math.round(p * 100))
          const over = p > 1
          const ahead = !over && p > pace + 0.04
          const even = !over && !ahead && p > pace - 0.04
          return (
            <li key={g.id}>
              <button
                type="button"
                onPointerEnter={() => setAt(g.id)}
                onFocus={() => setAt(g.id)}
                onBlur={() => setAt(null)}
                aria-label={`${g.label}: ${f(v)} of ${f(g.goal)}, ${pct}%${over ? `, ${pct - 100}% over` : ahead ? ', ahead of pace' : ''}`}
                className={`ring-focus flex w-full items-center gap-4 rounded-[12px] py-3.5 text-left transition-opacity duration-150 ${at && at !== g.id ? 'opacity-40' : ''}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-callout text-ink">{g.label}</span>
                  <span className="tnum mt-0.5 block truncate text-footnote text-ink-3 @max-[380px]:whitespace-normal">
                    {f(v)} of {f(g.goal)}
                    {over ? <Note className="text-warn-ink">{pct - 100}% over</Note> : ahead ? <Note className="text-ink-2">ahead of pace</Note> : even ? <Note>on pace</Note> : null}
                  </span>
                </span>
                <span className="relative flex items-end gap-1.5">
                  {/* Where it should be by now: a small caret pointing into the number at that height. */}
                  <motion.svg
                    aria-hidden
                    width="5"
                    height="7"
                    viewBox="0 0 5 7"
                    className="absolute -left-2.5 bottom-0 text-ink-3"
                    initial={false}
                    animate={{ y: -Math.min(1, pace) * tall + 3.5, opacity: shown ? 1 : 0 }}
                    transition={reduce || scrubbing ? { duration: reduce ? 0 : 0.09 } : { type: 'spring', stiffness: 260, damping: 30 }}
                  >
                    <path d="M0 0.5 L4.5 3.5 L0 6.5 Z" fill="currentColor" />
                  </motion.svg>
                  <DotType text={`${pct}`} slots={3} dot={dot} gap={gap} level={shown ? Math.min(1, p) : 0} over={shown && over ? p - 1 : 0} quick={scrubbing} />
                  <span className="text-title font-normal leading-none text-ink-3">%</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <DayRuler goals={goals} days={days} today={today} day={day} label={dayLabel} onDay={setDay} reduce={!!reduce} />
    </div>
  )
}

/**
 * A ruler of the period's days. Hovering or dragging along it reads that day; arrow keys step it.
 * Days still to come are faint and out of reach, today carries the accent, and an amber mark sits
 * over the day each goal went over.
 */
function DayRuler({ goals, days, today, day, label, onDay, reduce }: { goals: Goal[]; days: number; today: number; day: number | null; label: (d: number) => string; onDay: (d: number | null) => void; reduce: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const held = useRef(false)
  const d = day ?? today
  const crossed = goals.map((g) => g.series.findIndex((v) => v >= g.goal)).filter((i) => i >= 0)

  const read = (e: PointerEvent) => {
    const r = track.current?.getBoundingClientRect()
    if (!r) return
    const i = Math.round(((e.clientX - r.left) / r.width) * (days - 1))
    onDay(Math.max(0, Math.min(today, i)))
  }
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onDay(Math.max(0, d - 1))
    else if (e.key === 'ArrowRight') onDay(d + 1 >= today ? null : d + 1)
    else if (e.key === 'Home') onDay(0)
    else if (e.key === 'End' || e.key === 'Escape') onDay(null)
    else return
    e.preventDefault()
  }

  return (
    <div className="mt-1 flex items-center gap-4 border-t border-line pt-3.5">
      <p className="tnum flex w-[92px] shrink-0 items-center text-footnote">
        <RollingText text={label(d)} className="text-ink" proportional />
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
        onPointerMove={(e) => (held.current || e.pointerType === 'mouse') && read(e)}
        onPointerDown={(e) => {
          held.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          read(e)
        }}
        onPointerUp={() => (held.current = false)}
        onPointerLeave={(e) => e.pointerType !== 'touch' && !held.current && onDay(null)}
        onLostPointerCapture={(e) => {
          held.current = false
          if (e.pointerType !== 'touch') onDay(null)
        }}
        className="ring-focus relative flex h-7 pointer-coarse:h-9 flex-1 cursor-ew-resize touch-pan-y items-end justify-between rounded-[4px]"
      >
        {Array.from({ length: days }, (_, i) => {
          const future = i > today
          const week = i % 7 === 0
          return (
            <span key={i} className="relative flex w-0 justify-center">
              {crossed.includes(i) && <span className="absolute -top-[13px] size-[4px] rounded-full bg-warn" />}
              <span
                className={`block shrink-0 rounded-full transition-colors duration-100 ${i === today ? 'w-[1.5px] bg-accent' : `w-px ${future ? 'bg-line' : i <= d ? 'bg-ink-3' : 'bg-line-strong'}`}`}
                style={{ height: i === today ? 12 : week ? 9 : 6 }}
              />
            </span>
          )
        })}
        {/* The day being read: a taller ink tick that follows the hand. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-[18px] w-[2px] -translate-x-1/2 rounded-full bg-ink"
          initial={false}
          animate={{ left: `${(d / (days - 1)) * 100}%`, opacity: day === null ? 0 : 1 }}
          transition={reduce ? { duration: 0 } : day === null ? { type: 'spring', stiffness: 300, damping: 32 } : { duration: 0.06 }}
        />
      </div>
    </div>
  )
}
