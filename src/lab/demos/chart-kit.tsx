'use client'

import { useEffect, useId, useRef } from 'react'
import { motion } from 'motion/react'
import { SERIES } from '../components/charts/parts'
import { spring } from '@/lab/lib/motion'
import { RollingText } from '@/lab/ui/RollingText'

/*
 * What the chart demos share: one account's usage, seeded so it's the same on every visit, a small
 * segmented control for ranges and views, and the script runner every demo plays to.
 */

/** A small seeded generator, so the numbers are the same on every visit. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Range = '7d' | '30d' | '90d'
export const DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }
export const RANGES: [Range, string][] = [
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['90d', 'Last 90 days'],
]
/** How far ahead a trend projects. */
const AHEAD: Record<Range, number> = { '7d': 2, '30d': 7, '90d': 14 }
const END = new Date(2026, 9, 23)
export const sum = (a: number[]) => a.reduce((t, v) => t + v, 0)
const dayOf = (back: number) => {
  const d = new Date(END)
  d.setDate(d.getDate() - back)
  return d
}
const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

/** Readings for a stretch of days ending today: weekdays busier than weekends, growing, a little noise. */
export const walk = (days: number, seed: number, base: number, growth: number, offset = 0) => {
  const r = seeded(seed + days)
  return Array.from({ length: days }, (_, i) => Math.round(base * (1 + (growth * i) / days) * (weekend(dayOf(days - 1 - i + offset)) ? 0.64 : 1) * (0.88 + r() * 0.24)))
}

/** Tokens per day by model for a range, the same days the period before, and a projection ahead. */
export function usage(range: Range) {
  const n = DAYS[range]
  const f = AHEAD[range]
  const labels = Array.from({ length: n + f }, (_, i) => dayOf(n - 1 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  const sonnet = walk(n, 3, 210_000, 0.5)
  const haiku = walk(n, 7, 120_000, 0.2)
  const opus = walk(n, 11, 52_000, 0.9)
  const total = sonnet.map((v, i) => v + haiku[i] + opus[i])
  // The days ahead, projected from the last week: the same weekday rhythm, the growth carried on, no noise.
  const pace = sum(total.slice(-7)) / 7
  const ahead = Array.from({ length: f }, (_, j) => Math.round(pace * (1 + 0.012 * (j + 1)) * (weekend(dayOf(-1 - j)) ? 0.71 : 1.11)))
  const before = walk(n + f, 19, 330_000, 0.35, n - f)
  return {
    n,
    f,
    labels,
    sonnet,
    haiku,
    opus,
    total,
    ahead,
    before,
    tokens: sum(total),
    change: sum(total) / sum(before.slice(0, n)) - 1,
    // Moments worth marking, placed by how far back they were.
    notes: [
      { back: 4, label: 'v2.3 shipped' },
      { back: 17, label: 'Batch jobs moved to Haiku' },
      { back: 52, label: 'Prompt caching on' },
    ]
      .filter((m) => m.back < n)
      .map((m) => ({ at: n - 1 - m.back, label: m.label })),
  }
}

/** A model keeps its colour on every chart: identity, not rank. */
export const COLOUR: Record<string, string> = { sonnet: SERIES[0], haiku: SERIES[1], opus: SERIES[2], embeddings: SERIES[3] }
export const dollars = (v: number) => `$${Math.abs(v) >= 1e4 ? `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K` : Math.round(v).toLocaleString('en-US')}`

/** A headline number that rolls to its new value. */
export const Big = ({ children }: { children: string }) => (
  <p className="flex text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink">
    <RollingText text={children} proportional />
  </p>
)

/** A row of choices with a plate that slides to the chosen one. */
export function Segmented<T extends string>({ label, value, options, onChange, small = false }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; small?: boolean }) {
  const plate = useId()
  return (
    <div role="radiogroup" aria-label={label} className={`flex w-fit max-w-full overflow-x-auto rounded-full p-0.5 [scrollbar-width:none] ${small ? 'bg-[color-mix(in_oklch,var(--ink)_5%,transparent)]' : 'bg-[color-mix(in_oklch,var(--ink)_6%,transparent)]'}`}>
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`ring-focus relative shrink-0 whitespace-nowrap rounded-full font-medium ${small ? 'h-6 px-2.5 text-[11px]' : 'h-7 px-3 text-caption'}`}>
          {value === v && <motion.span layoutId={plate} transition={spring.move} className="absolute inset-0 rounded-full bg-surface shadow-raised" />}
          <span className={`relative z-[1] ${value === v ? 'text-ink' : 'text-ink-3'}`}>{l}</span>
        </button>
      ))}
    </div>
  )
}

type Clock = { tick: (ms: number) => Promise<void>; beat: (ms: number) => Promise<void> }

/**
 * Plays a demo's script on a loop. `beat` waits while someone is pointing at the demo; any press
 * or key hands it over for good. Spread the returned handlers on the demo's root.
 */
export function useScript(play: (clock: Clock) => Promise<void>) {
  const held = useRef(false)
  const touched = useRef(false)
  const script = useRef(play)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const loop = async () => {
      for (;;) await script.current({ tick, beat })
    }
    loop().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return {
    onPointerEnter: () => (held.current = true),
    onPointerLeave: () => (held.current = false),
    onPointerDownCapture: () => (touched.current = true),
    onKeyDownCapture: () => (touched.current = true),
  }
}
