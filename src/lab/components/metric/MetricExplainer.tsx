'use client'

import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { ease, spring } from '@/lab/lib/motion'
import { RollingText } from '@/lab/ui/RollingText'

export type Driver = {
  /** What moved it, e.g. "AWS". */
  name: string
  /** What happened, in a few words, e.g. "the new eu-west region, live since Oct 9". */
  note?: string
  /** How much it moved the metric, in the metric's own unit: +8920 pushed it up by 8,920. */
  amount: number
}

export type Metric = {
  id: string
  /** Its name on the tab, e.g. "Burn". */
  name: string
  value: number
  /** The value the period before, so the change can be said in words. */
  previous: number
  /** How a value reads, e.g. dollars. A string that starts with a symbol rolls best. */
  format?: (n: number) => string
  /** The period it's compared with, as it reads in a sentence, e.g. "September". */
  vs: string
  /** Why it moved, in a sentence or two. The AI's reading of the drivers. */
  reason: string
  /** What moved it, biggest first. The first four are shown. */
  drivers: Driver[]
  /** Where the reading comes from, e.g. "From 1,284 transactions in the ledger". */
  basis?: string
}

const plain = (n: number) => Math.round(n).toLocaleString('en-US')
const signed = (n: number, format: (n: number) => string) => `${n < 0 ? '−' : '+'}${format(Math.abs(n))}`

/**
 * A metric that explains itself. The number first, the change said in words, then why it moved:
 * the AI's reading in a sentence, and the drivers behind it ranked by how much each contributed,
 * each with what happened. Pick another metric and the number rolls to it, the reading arrives
 * word by word, and the drivers re-rank in place. It holds one size whichever metric is shown.
 */
export function MetricExplainer({
  metrics,
  metric,
  defaultMetric,
  onMetricChange,
  period,
  width = 640,
  footer,
}: {
  metrics: Metric[]
  /** The metric shown, if you control it. */
  metric?: string
  /** The metric shown first, if you don't. */
  defaultMetric?: string
  onMetricChange?: (id: string) => void
  /** What the numbers cover, at the top right, e.g. "October · as of Oct 28". */
  period?: string
  /** Its width. The height never changes as metrics switch. */
  width?: number
  /** Quiet actions under the basis line, e.g. "Show the AWS lines". */
  footer?: ReactNode
}) {
  const [own, setOwn] = useState(defaultMetric ?? metrics[0]?.id)
  const at = metric ?? own
  const m = metrics.find((x) => x.id === at) ?? metrics[0]
  const reduce = useReducedMotion()
  const group = useId()
  if (!m) return null

  const pick = (id: string) => {
    if (metric === undefined) setOwn(id)
    onMetricChange?.(id)
  }
  const format = m.format ?? plain
  const diff = m.value - m.previous
  const up = diff >= 0
  const pct = m.previous ? Math.abs(diff / m.previous) * 100 : 0
  const drivers = [...m.drivers].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 4)
  // What carried the change in its direction reads in ink; what pulled the other way, quietly.
  const withIt = (d: Driver) => (d.amount >= 0) === up
  const words = m.reason.split(/(\s+)/)

  return (
    <div className="rounded-[22px] bg-surface p-7 shadow-[var(--card-edge)]" style={{ width, maxWidth: '100%' }}>
      <div className="flex items-center justify-between gap-4">
        <LayoutGroup id={group}>
          <div role="tablist" aria-label="Metric" className="-ml-1 flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none]">
            {metrics.map((x) => {
              const on = x.id === m.id
              return (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => pick(x.id)}
                  className={`ring-focus relative h-8 shrink-0 rounded-full px-3 text-footnote transition-colors duration-150 ${on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
                >
                  {on && <motion.span layoutId="metric-tab" className="absolute inset-0 rounded-full bg-surface-2" transition={spring.snappy} />}
                  <span className="relative">{x.name}</span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>
        {period && <span className="shrink-0 text-footnote text-ink-3">{period}</span>}
      </div>

      {/* The number, and the change in words. */}
      <div className="mt-7">
        <p className="tnum flex text-[52px] font-normal leading-none tracking-[-0.045em] text-ink">
          <RollingText text={format(m.value)} proportional />
        </p>
        <p className="mt-2.5 h-5 truncate text-callout text-ink-3">
          <span className="text-ink">
            {up ? 'up' : 'down'} {format(Math.abs(diff))}
          </span>{' '}
          on {m.vs}, {pct.toFixed(1)}% {up ? 'more' : 'less'}
        </p>
      </div>

      {/* Why it moved: the reading arrives word by word, in a space held for three lines. */}
      <div className="mt-6 h-[72px] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={m.id} className="line-clamp-3 text-[15px] leading-6 text-ink" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {words.map((w, i) =>
              /^\s+$/.test(w) ? (
                w
              ) : (
                <motion.span key={i} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: reduce ? 0 : 0.08 + i * 0.012, ease: ease.out }}>
                  {w}
                </motion.span>
              ),
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* What moved it, biggest first, in rows of fixed height. A new metric's drivers swap in as one list:
          the old ones fade out first, so two sets of rows never draw over each other. */}
      <div className="mt-4 h-[196px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={m.id} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {drivers.map((d, i) => (
              <motion.li
                key={d.name}
                className="grid h-[49px] grid-cols-[minmax(96px,128px)_minmax(0,1fr)_auto] items-center gap-4 shadow-[inset_0_1px_0_var(--line)]"
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { ...spring.smooth, delay: reduce ? 0 : 0.06 + i * 0.04 } }}
              >
                <span className="truncate text-callout text-ink">{d.name}</span>
                <span className="truncate text-footnote text-ink-3">{d.note}</span>
                <span className={`tnum text-right text-callout ${withIt(d) ? 'text-ink' : 'text-ink-3'}`}>{signed(d.amount, format)}</span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex h-5 items-center justify-between gap-4">
        <p className="min-w-0 truncate text-footnote text-ink-3">{m.basis}</p>
        {footer && <div className="flex shrink-0 gap-4 text-footnote">{footer}</div>}
      </div>
    </div>
  )
}
