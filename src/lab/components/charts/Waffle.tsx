'use client'

import { useImperativeHandle, useState } from 'react'
import type { Ref } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { spring } from '@/lab/lib/motion'
import { GHOST, Key, SERIES, compact } from './parts'

export { ChartCard } from './ChartCard'
export { SERIES, compact } from './parts'

export type Part = { id: string; label: string; value: number; color?: string }
export type WaffleHandle = { point(id: string | null): void }

export function Waffle({ parts, columns = 10, format = compact, ref }: { parts: Part[]; columns?: 10 | 20 | 25; format?: (n: number) => string; ref?: Ref<WaffleHandle> }) {
  const [at, setAt] = useState<string | null>(null)
  const reduce = useReducedMotion()
  useImperativeHandle(ref, () => ({ point: setAt }))
  const sorted = [...parts].sort((x, y) => y.value - x.value)
  const shown: Part[] = sorted.length > 5 ? [...sorted.slice(0, 4), { id: 'other', label: 'Other', value: sorted.slice(4).reduce((t, p) => t + p.value, 0), color: GHOST }] : sorted
  const total = shown.reduce((t, p) => t + p.value, 0) || 1
  const exact = shown.map((p) => (p.value / total) * 100)
  const cells = exact.map(Math.floor)
  exact
    .map((e, i) => [e - Math.floor(e), i] as const)
    .sort((x, y) => y[0] - x[0])
    .slice(0, 100 - cells.reduce((t, c) => t + c, 0))
    .forEach(([, i]) => cells[i]++)
  const owners = cells.flatMap((c, i) => Array.from({ length: c }, () => i))
  const rows = 100 / columns
  const colour = (p: Part) => p.color ?? SERIES[parts.findIndex((x) => x.id === p.id) % SERIES.length]
  return (
    <div className="@container" onPointerLeave={() => setAt(null)}>
      <div className={columns === 10 ? 'flex flex-col gap-4 @min-[420px]:flex-row @min-[420px]:items-center @min-[420px]:gap-7' : 'flex flex-col gap-4'}>
        <div className="grid w-full shrink-0 gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)`, gridAutoFlow: 'column', maxWidth: columns * 22 }} role="img" aria-label={shown.map((p, i) => `${p.label} ${cells[i]}%`).join(', ')}>
          {owners.map((o, i) => {
            const p = shown[o]
            return (
              <motion.span
                key={i}
                onPointerEnter={() => setAt(p.id)}
                className="aspect-square rounded-[3px] transition-[background-color] duration-300"
                style={{ backgroundColor: colour(p), transitionDelay: `${(Math.floor(i / rows) + (i % rows)) * 8}ms` }}
                initial={reduce ? false : { opacity: 0, scale: 0.3 }}
                animate={{ opacity: at && at !== p.id ? 0.14 : 1, scale: 1 }}
                transition={reduce ? { duration: 0 } : { scale: { ...spring.snappy, delay: (Math.floor(i / rows) + (i % rows)) * 0.016 }, opacity: { duration: 0.15, delay: 0 } }}
              />
            )
          })}
        </div>
        <ul className="min-w-0 flex-1">
          {shown.map((p, i) => (
            <li key={p.id}>
              <button type="button" onPointerEnter={() => setAt(p.id)} onFocus={() => setAt(p.id)} onBlur={() => setAt(null)} className={`ring-focus -mx-2 flex h-8 w-[calc(100%+16px)] items-center gap-2.5 rounded-[8px] px-2 text-left text-footnote transition-[background-color,opacity] ${at === p.id ? 'bg-surface-2' : ''} ${at && at !== p.id ? 'opacity-50' : ''}`}>
                <Key color={colour(p)} area />
                <span className="min-w-0 flex-1 truncate text-ink-2">{p.label}</span>
                <span className="font-medium tabular-nums text-ink">{format(p.value)}</span>
                <span className="w-9 text-right font-mono text-[11px] tabular-nums text-ink-3">{cells[i]}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
