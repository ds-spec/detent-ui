'use client'

import { useImperativeHandle, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Key, SERIES, compact, morph, scale } from './parts'

export { ChartCard } from './ChartCard'
export { Change, SERIES, compact } from './parts'

export type BarSeries = { id: string; label: string; values: number[]; color?: string }
export type BarHandle = { point(i: number | null): void }

/**
 * Columns as capsules rising inside their own faint tracks. The first series fills; a second,
 * last period, is a small tick on each track, so the comparison never crowds the bars. A goal is
 * a line across them all.
 */
export function BarChart({ categories, series, target, format = compact, height = 210, ref }: { categories: string[]; series: BarSeries[]; target?: { value: number; label: string }; format?: (n: number) => string; height?: number; ref?: Ref<BarHandle> }) {
  const [at, setAt] = useState<number | null>(null)
  const reduce = useReducedMotion()
  useImperativeHandle(ref, () => ({ point: setAt }))
  const [main, before] = series
  const color = main.color ?? SERIES[0]
  // Each column is its track over a 24px label.
  const plot = height - 24
  const { top } = scale(Math.max(...series.flatMap((s) => s.values), target?.value ?? 0) * 1.05)
  const pct = (v: number) => (v / top) * 100
  const peak = main.values.indexOf(Math.max(...main.values))
  return (
    <div className="w-full">
      {before && (
        <div className="-ml-2.5 mb-2 flex flex-wrap">
          <span className="flex h-7 items-center gap-2 px-2.5 text-caption font-medium text-ink-2">
            <Key color={color} area />
            {main.label}
          </span>
          <span className="flex h-7 items-center gap-2 px-2.5 text-caption font-medium text-ink-3">
            <span className="h-[3px] w-3 rounded-full bg-[var(--ink-2)]" />
            {before.label}
          </span>
        </div>
      )}
      <div className="relative" style={{ height }} onPointerLeave={() => setAt(null)} role="img" aria-label={`${main.label} by ${categories.join(', ')}`}>
        {target && (
          <div className="pointer-events-none absolute inset-x-0 z-[2] flex items-center" style={{ bottom: 24 + (target.value / top) * plot - 10 }}>
            <span className="h-px flex-1 bg-[color-mix(in_oklch,var(--ink)_32%,transparent)]" />
            <span className="ml-2 rounded-full bg-surface px-1.5 text-[10.5px] font-medium text-ink-2 shadow-[0_0_0_1px_var(--line-strong)]">
              {target.label} {format(target.value)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-around gap-2 pr-16">
          {categories.map((c, i) => {
            const on = at === i
            const dim = at !== null && !on
            return (
              <div key={c} className="flex h-full min-w-0 flex-1 cursor-default flex-col items-center" onPointerEnter={() => setAt(i)}>
                <div className="relative w-full max-w-[26px] flex-1 rounded-full transition-colors duration-200" style={{ background: `color-mix(in oklch, var(--ink) ${on ? 9 : 5}%, transparent)` }}>
                  <motion.div
                    className="absolute inset-x-0 bottom-0 rounded-full"
                    style={{ background: `linear-gradient(to top, ${color}, color-mix(in oklch, ${color} 72%, white))` }}
                    initial={reduce ? false : { height: '0%', opacity: 0 }}
                    animate={{ height: `${pct(main.values[i])}%`, opacity: dim ? 0.4 : 1 }}
                    transition={reduce ? { duration: 0 } : { height: { ...morph, delay: i * 0.05 }, opacity: { duration: 0.15 } }}
                  />
                  {before && (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-x-1 h-[3px] rounded-full bg-[var(--ink-2)] ring-2 ring-[var(--surface)]"
                      initial={false}
                      animate={{ bottom: `calc(${pct(before.values[i])}% - 1.5px)`, opacity: dim ? 0.35 : 1 }}
                      transition={reduce ? { duration: 0 } : morph}
                    />
                  )}
                  <AnimatePresence>
                    {(on || (at === null && i === peak)) && (
                      <motion.span
                        key="v"
                        className={`absolute left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${on ? 'bg-ink text-surface shadow-float' : 'text-ink'}`}
                        style={{ bottom: `calc(${pct(main.values[i])}% + 6px)` }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.15 }}
                      >
                        {format(main.values[i])}
                        {on && before && <span className="font-normal opacity-60"> / {format(before.values[i])}</span>}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`mt-2 h-4 font-mono text-[10.5px] transition-colors ${on ? 'text-ink' : 'text-ink-3'}`}>{c}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
