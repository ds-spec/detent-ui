'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { ArrowUp } from '@/lab/icons'
import { ease, spring } from '@/lab/lib/motion'

export const SERIES = ['light-dark(#135fc8, #498beb)', 'light-dark(#127541, #29ac68)', 'light-dark(#5b4fe0, #8470e5)', 'light-dark(#a8530b, #d67523)'] as const
export const GHOST = 'color-mix(in oklch, var(--ink) 26%, transparent)'

export const compact = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`
  if (a >= 1e4) return `${(n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '')}K`
  return Math.round(n).toLocaleString('en-US')
}

export const detent = { type: 'spring', stiffness: 900, damping: 52, mass: 0.6 } as const
export const morph = spring.data
export const sweep = { type: 'spring', stiffness: 60, damping: 18, mass: 1 } as const

const lerp = (a: number[], b: number[], t: number) => (a.length === b.length ? b.map((y, i) => a[i] + (y - a[i]) * t) : b)

export function useMorph(target: number[], still = false) {
  const key = target.join(',')
  const t = useMotionValue(1)
  const a = useRef(target)
  const b = useRef(target)
  const reduce = useReducedMotion()
  useEffect(() => {
    const next = key ? key.split(',').map(Number) : []
    if (next.join(',') === b.current.join(',')) return
    a.current = lerp(a.current, b.current, t.get())
    b.current = next
    if (still || reduce) {
      a.current = next
      t.jump(1)
      return
    }
    t.jump(0)
    const run = animate(t, 1, morph)
    return () => run.stop()
  }, [key, t, reduce, still])
  return useTransform(t, (v) => lerp(a.current, b.current, v))
}

export function scale(max: number, steps = 4) {
  const raw = Math.max(max, 1e-9) / steps
  const p = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * p >= raw) ?? 10) * p
  const top = Math.max(step, Math.ceil(max / step) * step)
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) }
}

export function smooth(xs: number[], ys: number[]) {
  const n = xs.length
  if (n < 2) return n ? `M${xs[0]},${ys[0]}` : ''
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1))
  const m = [d[0], ...d.slice(1).map((s, i) => (s * d[i] <= 0 ? 0 : (s + d[i]) / 2)), d[n - 2]]
  let p = `M${xs[0]},${ys[0]}`
  for (let i = 0; i < n - 1; i++) {
    const h = (xs[i + 1] - xs[i]) / 3
    p += `C${xs[i] + h},${ys[i] + m[i] * h} ${xs[i + 1] - h},${ys[i + 1] - m[i + 1] * h} ${xs[i + 1]},${ys[i + 1]}`
  }
  return p
}

export const Key = ({ color, area = false }: { color: string; area?: boolean }) =>
  area ? <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} /> : <span className="h-[3px] w-3 shrink-0 rounded-full" style={{ background: color }} />

export function Change({ value, good = 'up' }: { value: number; good?: 'up' | 'down' }) {
  const up = value >= 0
  const happy = up === (good === 'up')
  const tone = happy ? 'var(--ok)' : 'var(--danger)'
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px text-caption font-medium tabular-nums" style={{ color: tone, background: `color-mix(in oklch, ${tone} 13%, transparent)` }}>
      <ArrowUp size={11} strokeWidth={2.6} style={{ transform: up ? undefined : 'rotate(180deg)' }} />
      {Math.abs(value * 100).toFixed(1)}%
    </span>
  )
}

export function Drawn({ d, still, color, width = 2 }: { d: MotionValue<string>; still: string; color: string; width?: number }) {
  const reduce = useReducedMotion()
  return <motion.path d={reduce ? still : d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: ease.out }} />
}

export function Pulse({ cx, cy, color }: { cx: number | MotionValue<number>; cy: MotionValue<number>; color: string }) {
  const reduce = useReducedMotion()
  return (
    <>
      {!reduce && <motion.circle cx={cx} cy={cy} r={4.5} fill={color} initial={{ opacity: 0.4, scale: 1 }} animate={{ opacity: 0, scale: 3.2 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />}
      <motion.circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
    </>
  )
}
