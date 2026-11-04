'use client'

import { Fragment, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { ease, spring, dur } from '@/lab/lib/motion'
import { RollingText } from '@/lab/ui/RollingText'

export type Driver = {
  name: string
  note?: string
  amount: number
  phrase?: string
}

export type Metric = {
  id: string
  name: string
  value: number
  previous: number
  format?: (n: number) => string
  vs: string
  reason: string
  drivers: Driver[]
  basis?: string
}

const topDrivers = (m: Metric) => [...m.drivers].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 4)
const plain = (n: number) => Math.round(n).toLocaleString('en-US')
const signed = (n: number, format: (n: number) => string) => `${n < 0 ? '−' : '+'}${format(Math.abs(n))}`

export function MetricExplainer({
  metrics,
  metric,
  defaultMetric,
  onMetricChange,
  period,
  width = 640,
  footer,
  highlight = null,
}: {
  metrics: Metric[]
  metric?: string
  defaultMetric?: string
  onMetricChange?: (id: string) => void
  period?: string
  width?: number
  footer?: ReactNode
  highlight?: string | null
}) {
  const [own, setOwn] = useState(defaultMetric ?? metrics[0]?.id)
  const at = metric ?? own
  const m = metrics.find((x) => x.id === at) ?? metrics[0]
  const reduce = useReducedMotion()
  const group = useId()
  const [aim, setAim] = useState<{ metric: string; name: string } | null>(null)
  if (!m) return null

  const pick = (id: string) => {
    if (metric === undefined) setOwn(id)
    onMetricChange?.(id)
  }
  const format = m.format ?? plain
  const diff = m.value - m.previous
  const up = diff >= 0
  const pct = m.previous ? Math.abs(diff / m.previous) * 100 : 0
  const drivers = topDrivers(m)
  const withIt = (d: Driver) => (d.amount >= 0) === up
  const lit = (aim?.metric === m.id ? aim.name : null) ?? highlight
  const without = drivers.find((d) => d.name === lit)
  const point = (name: string | null) => setAim(name ? { metric: m.id, name } : null)
  const pointers = (name: string) => ({ onPointerEnter: () => point(name), onPointerLeave: () => point(null), onFocus: () => point(name), onBlur: () => point(null) })

  const parts: { text: string; driver?: string }[] = []
  let rest = m.reason
  for (;;) {
    const hits = drivers.filter((d) => d.phrase && rest.includes(d.phrase)).map((d) => ({ d, at: rest.indexOf(d.phrase!) }))
    if (!hits.length) break
    const first = hits.reduce((a, b) => (b.at < a.at ? b : a))
    if (first.at) parts.push({ text: rest.slice(0, first.at) })
    parts.push({ text: first.d.phrase!, driver: first.d.name })
    rest = rest.slice(first.at + first.d.phrase!.length)
  }
  if (rest) parts.push({ text: rest })
  let w = 0

  return (
    <div className="@container" style={{ width, maxWidth: '100%' }}>
    <div className="rounded-[22px] bg-surface p-5 shadow-[var(--card-edge)] @min-[520px]:p-7">
      <div className="flex flex-col gap-2 @min-[520px]:flex-row @min-[520px]:items-center @min-[520px]:justify-between @min-[520px]:gap-4">
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
                  className={`ring-focus relative h-8 shrink-0 rounded-full px-3 text-footnote transition-colors duration-150 pointer-coarse:h-9 @max-[400px]:px-2 ${on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
                >
                  {on && <motion.span layoutId="metric-tab" className="absolute inset-0 rounded-full bg-surface-2" transition={spring.snappy} />}
                  <span className="relative z-[1]">{x.name}</span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>
        {period && <span className="shrink-0 text-footnote text-ink-3">{period}</span>}
      </div>

      <div className="mt-7">
        <p className={`tnum flex text-[40px] @min-[520px]:text-[52px] font-normal leading-none tracking-[-0.045em] transition-colors duration-300 ${without ? 'text-quiet' : 'text-ink'}`}>
          <RollingText text={format(without ? m.value - without.amount : m.value)} proportional />
        </p>
        <div className="mt-2.5 grid min-h-5 text-callout text-ink-3 @min-[520px]:h-5">
          <p className="col-start-1 row-start-1 @min-[520px]:truncate">
            {without ? (
              <>
                <span className="text-ink">without {without.name}</span> · {signed(-without.amount, format)}, the rest of the change stays
              </>
            ) : (
              <>
                <span className="text-ink">
                  {up ? 'up' : 'down'} {format(Math.abs(diff))}
                </span>{' '}
                on {m.vs}, {pct.toFixed(1)}% {up ? 'more' : 'less'}
              </>
            )}
          </p>
          {metrics.map((x) => {
            const f = x.format ?? plain
            const d = x.value - x.previous
            const pc = x.previous ? Math.abs(d / x.previous) * 100 : 0
            const top = topDrivers(x)[0]
            return (
              <Fragment key={x.id}>
                <span aria-hidden className="invisible col-start-1 row-start-1 @min-[520px]:hidden">
                  {d >= 0 ? 'up' : 'down'} {f(Math.abs(d))} on {x.vs}, {pc.toFixed(1)}% {d >= 0 ? 'more' : 'less'}
                </span>
                {top && (
                  <span aria-hidden className="invisible col-start-1 row-start-1 @min-[520px]:hidden">
                    without {top.name} · {signed(-top.amount, f)}, the rest of the change stays
                  </span>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      <div className="mt-6 grid min-h-[120px] @min-[520px]:h-[72px] @min-[520px]:min-h-0 @min-[520px]:overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={m.id} className="col-start-1 row-start-1 text-[15px] leading-6 text-ink [text-wrap:wrap] @min-[520px]:line-clamp-3" exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }}>
            {parts.map((part, k) => {
              const words = part.text.split(/(\s+)/).map((x, i) =>
                /^\s+$/.test(x) || !x ? (
                  x
                ) : (
                  <motion.span key={i} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: reduce ? 0 : 0.08 + w++ * 0.024, ease: ease.out }}>
                    {x}
                  </motion.span>
                ),
              )
              if (!part.driver) return <span key={k}>{words}</span>
              const on = lit === part.driver
              return (
                <span
                  key={k}
                  {...pointers(part.driver)}
                  className={`cursor-default rounded-[4px] underline decoration-1 underline-offset-[5px] transition-[background-color,text-decoration-color] duration-200 ${on ? 'bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] decoration-[var(--accent)]' : 'decoration-[color-mix(in_oklch,var(--ink)_16%,transparent)]'}`}
                >
                  {words}
                </span>
              )
            })}
          </motion.p>
        </AnimatePresence>
        {metrics.map((x) => (
          <p key={x.id} aria-hidden className="invisible col-start-1 row-start-1 text-[15px] leading-6 [text-wrap:wrap] @min-[520px]:hidden">
            {x.reason}
          </p>
        ))}
      </div>

      <div className="mt-4 grid @min-[520px]:h-[196px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={m.id} className="col-start-1 row-start-1" exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }}>
            {drivers.map((d, i) => (
              <motion.li
                key={d.name}
                tabIndex={0}
                aria-label={`${d.name}, ${signed(d.amount, format)}. Show the number without it.`}
                {...pointers(d.name)}
                className="ring-focus grid cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 rounded-[2px] py-2.5 shadow-[inset_0_1px_0_var(--line)] outline-none @min-[520px]:h-[49px] @min-[520px]:grid-cols-[minmax(96px,128px)_minmax(0,1fr)_auto] @min-[520px]:gap-4 @min-[520px]:py-0"
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: lit && lit !== d.name ? 0.45 : 1, y: 0, transition: { ...spring.smooth, delay: reduce || lit ? 0 : 0.06 + i * 0.04, opacity: { duration: 0.2, ease: ease.out } } }}
              >
                <span className="truncate text-callout text-ink">{d.name}</span>
                <span className="col-span-2 row-start-2 text-footnote text-ink-3 @min-[520px]:col-span-1 @min-[520px]:row-start-auto @min-[520px]:truncate">{d.note}</span>
                <span className={`tnum text-right text-callout ${withIt(d) || lit === d.name ? 'text-ink' : 'text-ink-3'}`}>{signed(d.amount, format)}</span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
        {metrics.map((x) => (
          <ul key={x.id} aria-hidden className="invisible col-start-1 row-start-1 @min-[520px]:hidden">
            {topDrivers(x).map((d) => (
              <li key={d.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 py-2.5">
                <span className="truncate text-callout">{d.name}</span>
                <span className="col-span-2 row-start-2 text-footnote">{d.note}</span>
                <span className="tnum text-right text-callout">{signed(d.amount, x.format ?? plain)}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="mt-3 flex min-h-5 flex-col gap-2 @min-[520px]:h-5 @min-[520px]:flex-row @min-[520px]:items-center @min-[520px]:justify-between @min-[520px]:gap-4">
        <div className="grid min-w-0">
          <p className="col-start-1 row-start-1 min-w-0 text-footnote text-ink-3 @min-[520px]:truncate">{m.basis}</p>
          {metrics.map((x) => (
            <p key={x.id} aria-hidden className="invisible col-start-1 row-start-1 text-footnote @min-[520px]:hidden">
              {x.basis}
            </p>
          ))}
        </div>
        {footer && <div className="flex shrink-0 gap-4 text-footnote">{footer}</div>}
      </div>
    </div>
    </div>
  )
}
