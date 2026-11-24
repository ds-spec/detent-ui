'use client'

import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'

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

export type MetricExplainerProps = {
  metrics: Metric[]
  metric?: string
  defaultMetric?: string
  onMetricChange?: (id: string) => void
  period?: string
  width?: number
  footer?: ReactNode
  highlight?: string | null
  tabs?: boolean
}

const EASE = [0.2, 0.9, 0.25, 1] as const
const EXIT = { opacity: 0, transition: { duration: 0.12, ease: EASE } }
const SNAPPY = { type: 'spring', stiffness: 560, damping: 42, mass: 0.6 } as const
const SMOOTH = { type: 'spring', bounce: 0, duration: 0.36 } as const
const ROLL = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 } as const
const CURVE = 'ease-[cubic-bezier(0.2,0.9,0.25,1)]'
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

const topDrivers = (m: Metric) => [...m.drivers].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 4)
const plain = (n: number) => Math.round(n).toLocaleString('en-US')
const signed = (n: number, format: (n: number) => string) => `${n < 0 ? '−' : '+'}${format(Math.abs(n))}`

function RollingText({ text }: { text: string }) {
  const chars = [...text]
  const probe = useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = useState<number[] | null>(null)

  useLayoutEffect(() => {
    if (!probe.current) return
    const read = () => {
      const box = probe.current
      if (!box) return
      const z = box.offsetWidth ? box.getBoundingClientRect().width / box.offsetWidth : 1
      const em = parseFloat(getComputedStyle(box).fontSize) || 16
      setWidths([...box.children].map((c) => (c as HTMLElement).getBoundingClientRect().width / z / em))
    }
    read()
    document.fonts?.ready.then(read)
  }, [])

  return (
    <span className="relative inline-flex" style={{ lineHeight: '1.25em', height: '1.25em' }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 size-0 overflow-hidden">
        <span ref={probe} className="invisible flex w-max whitespace-pre">
          {Array.from({ length: 10 }, (_, n) => (
            <span key={n}>{n}</span>
          ))}
        </span>
      </span>
      {chars.map((c, i) => {
        const key = chars.length - i
        return /\d/.test(c) ? (
          <Digit key={key} d={+c} width={widths ? widths[+c] : undefined} />
        ) : (
          <span key={`${key}${c}`} aria-hidden className="whitespace-pre">
            {c}
          </span>
        )
      })}
    </span>
  )
}

function Digit({ d, width }: { d: number; width?: number }) {
  const w = useMotionValue<string>(width === undefined ? '1ch' : `${width}em`)
  const had = useRef(width !== undefined)
  useLayoutEffect(() => {
    if (width === undefined) return
    if (!had.current) {
      had.current = true
      w.set(`${width}em`)
      return
    }
    const ctl = animate(w, `${width}em`, ROLL)
    return () => ctl.stop()
  }, [width, w])

  return (
    <motion.span aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1.25em', width: w }}>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col items-center" initial={false} animate={{ y: `${-d * 10}%` }} transition={ROLL}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block" style={{ height: '1.25em' }}>
            {n}
          </span>
        ))}
      </motion.span>
    </motion.span>
  )
}

export function MetricExplainer({ metrics, metric, defaultMetric, onMetricChange, period, width = 640, footer, highlight = null, tabs = true }: MetricExplainerProps) {
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
    const source = rest
    const hits = drivers.flatMap((d) => (d.phrase && source.includes(d.phrase) ? [{ name: d.name, phrase: d.phrase, at: source.indexOf(d.phrase) }] : []))
    if (!hits.length) break
    const first = hits.reduce((a, b) => (b.at < a.at ? b : a))
    if (first.at) parts.push({ text: rest.slice(0, first.at) })
    parts.push({ text: first.phrase, driver: first.name })
    rest = rest.slice(first.at + first.phrase.length)
  }
  if (rest) parts.push({ text: rest })
  let w = 0

  return (
    <div data-slot="metric-explainer" className="@container" style={{ width, maxWidth: '100%' }}>
      <div className="rounded-[22px] bg-card p-5 text-card-foreground shadow-[0_0_0_1px_var(--color-border),0_1px_2px_rgb(0_0_0/.04)] @min-[520px]:p-7">
        <div className="flex flex-col gap-2 @min-[520px]:flex-row @min-[520px]:items-center @min-[520px]:justify-between @min-[520px]:gap-4">
          {tabs && (
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
                      data-slot="metric-tab"
                      onClick={() => pick(x.id)}
                      className={`${FOCUS} relative h-8 shrink-0 rounded-full px-3 text-[13px] leading-[18px] transition-colors duration-150 ${CURVE} [@media(pointer:coarse)]:h-9 @max-[400px]:px-2 ${on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}
                    >
                      {on && <motion.span layoutId="metric-tab" className="absolute inset-0 rounded-full bg-muted" transition={SNAPPY} />}
                      <span className="relative z-[1]">{x.name}</span>
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
          )}
          {!tabs && <span className="text-[13px] font-medium leading-[18px] text-foreground">{m.name}</span>}
          {period && <span className="shrink-0 text-[13px] leading-[18px] text-muted-foreground">{period}</span>}
        </div>

        <div className="mt-7">
          <p
            className={`flex text-[40px] font-normal leading-none tracking-[-0.045em] tabular-nums transition-colors duration-300 ${CURVE} @min-[520px]:text-[52px] ${without ? 'text-[color-mix(in_oklch,var(--color-muted-foreground)_72%,var(--color-card))]' : 'text-foreground'}`}
          >
            <RollingText text={format(without ? m.value - without.amount : m.value)} />
          </p>
          <div className="mt-2.5 grid min-h-5 text-[14px] leading-5 tracking-[-0.003em] text-muted-foreground @min-[520px]:h-5">
            <p className="col-start-1 row-start-1 @min-[520px]:truncate">
              {without ? (
                <>
                  <span className="text-foreground">without {without.name}</span> · {signed(-without.amount, format)}, the rest of the change stays
                </>
              ) : (
                <>
                  <span className="text-foreground">
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
            <motion.p key={m.id} className="col-start-1 row-start-1 text-[15px] leading-6 text-foreground [text-wrap:wrap] @min-[520px]:line-clamp-3" exit={EXIT}>
              {parts.map((part, k) => {
                const words = part.text.split(/(\s+)/).map((x, i) =>
                  /^\s+$/.test(x) || !x ? (
                    x
                  ) : (
                    <motion.span key={i} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: reduce ? 0 : 0.08 + w++ * 0.024, ease: EASE }}>
                      {x}
                    </motion.span>
                  ),
                )
                if (!part.driver) return <span key={k}>{words}</span>
                const on = lit === part.driver
                return (
                  <span
                    key={k}
                    data-slot="metric-phrase"
                    {...pointers(part.driver)}
                    className={`cursor-default rounded-[4px] underline decoration-1 underline-offset-[5px] transition-[background-color,text-decoration-color] duration-200 ${CURVE} ${on ? 'bg-[color-mix(in_oklch,oklch(0.62_0.19_264)_12%,transparent)] decoration-[oklch(0.62_0.19_264)]' : 'decoration-[color-mix(in_oklch,var(--color-foreground)_16%,transparent)]'}`}
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
            <motion.ul key={m.id} className="col-start-1 row-start-1" exit={EXIT}>
              {drivers.map((d, i) => (
                <motion.li
                  key={d.name}
                  tabIndex={0}
                  data-slot="metric-driver"
                  aria-label={`${d.name}, ${signed(d.amount, format)}. Show the number without it.`}
                  {...pointers(d.name)}
                  className={`${FOCUS} grid cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 rounded-[2px] py-2.5 shadow-[inset_0_1px_0_var(--color-border)] @min-[520px]:h-[49px] @min-[520px]:grid-cols-[minmax(96px,128px)_minmax(0,1fr)_auto] @min-[520px]:gap-4 @min-[520px]:py-0`}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: lit && lit !== d.name ? 0.45 : 1, y: 0, transition: { ...SMOOTH, delay: reduce || lit ? 0 : 0.06 + i * 0.04, opacity: { duration: 0.2, ease: EASE } } }}
                >
                  <span className="truncate text-[14px] leading-5 tracking-[-0.003em] text-foreground">{d.name}</span>
                  <span className="col-span-2 row-start-2 text-[13px] leading-[18px] text-muted-foreground @min-[520px]:col-span-1 @min-[520px]:row-start-auto @min-[520px]:truncate">{d.note}</span>
                  <span className={`text-right text-[14px] leading-5 tracking-[-0.003em] tabular-nums ${withIt(d) || lit === d.name ? 'text-foreground' : 'text-muted-foreground'}`}>{signed(d.amount, format)}</span>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
          {metrics.map((x) => (
            <ul key={x.id} aria-hidden className="invisible col-start-1 row-start-1 @min-[520px]:hidden">
              {topDrivers(x).map((d) => (
                <li key={d.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 py-2.5">
                  <span className="truncate text-[14px] leading-5 tracking-[-0.003em]">{d.name}</span>
                  <span className="col-span-2 row-start-2 text-[13px] leading-[18px]">{d.note}</span>
                  <span className="text-right text-[14px] leading-5 tracking-[-0.003em] tabular-nums">{signed(d.amount, x.format ?? plain)}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="mt-3 flex min-h-5 flex-col gap-2 @min-[520px]:h-5 @min-[520px]:flex-row @min-[520px]:items-center @min-[520px]:justify-between @min-[520px]:gap-4">
          <div className="grid min-w-0">
            <p className="col-start-1 row-start-1 min-w-0 text-[13px] leading-[18px] text-muted-foreground @min-[520px]:truncate">{m.basis}</p>
            {metrics.map((x) => (
              <p key={x.id} aria-hidden className="invisible col-start-1 row-start-1 text-[13px] leading-[18px] @min-[520px]:hidden">
                {x.basis}
              </p>
            ))}
          </div>
          {footer && <div className="flex shrink-0 gap-4 text-[13px] leading-[18px]">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export default MetricExplainer
