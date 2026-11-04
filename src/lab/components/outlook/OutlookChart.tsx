'use client'

import { useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { smooth } from '@/lab/components/charts/parts'
import { at as lerpAt, clamp, dragProps, useDetent } from '@/lab/lib/detent'
import { useSize } from '@/lab/lib/hooks'
import { INK, InkDefs } from '@/lab/ui/ink'

export type Past = { label: string; value: number }
export type Ahead = { label: string; low: number; high: number }
export type OutlookHandle = {
  read(i: number): void
}

const H = 280
const T = 12
const B = 28
const AXIS = 'fill-[var(--ink-3)] font-mono text-[10px] uppercase tracking-[0.06em]'
const INKS = '[--ol-ink:#2f5fe0] dark:[--ol-ink:#7c9bf5]'
const ODDS = (t: number) => (t < 0.34 ? 'Likely' : t < 0.7 ? 'Possible' : 'A long shot')

export function OutlookChart({ history, forecast, format = (n) => n.toLocaleString('en-US'), unit = '', today = 'Today', odds = ODDS, look = 'ink', onRead, ref }: {
  history: Past[]
  forecast: Ahead[]
  format?: (n: number) => string
  unit?: string
  today?: string
  odds?: (t: number) => string
  look?: 'ink' | 'plain'
  onRead?: (i: number) => void
  ref?: Ref<OutlookHandle>
}) {
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const { w } = useSize(box)
  const ahead = forecast.length
  const [at, setAt] = useState(ahead - 1)
  const edge = history.length - 1
  const n = history.length + ahead
  const pick = (i: number) => {
    const k = Math.max(0, Math.min(ahead - 1, i))
    setAt(k)
    onRead?.(k)
  }
  const stops = useRef<number[]>([])
  if (stops.current.length !== ahead) stops.current = Array.from({ length: ahead }, (_, i) => i)
  const reader = useRef<SVGGElement>(null)
  const span = useRef<SVGLineElement>(null)
  const capTop = useRef<SVGLineElement>(null)
  const capLow = useRef<SVGLineElement>(null)
  const paint = (x: number) => {
    const u = Math.max(0, Math.min(ahead - 1, x))
    const hi = Y(lerpAt(forecast.map((f) => f.high), u))
    const lo = Y(lerpAt(forecast.map((f) => f.low), u))
    reader.current?.setAttribute('transform', `translate(${X(edge + u + 1).toFixed(2)} 0)`)
    span.current?.setAttribute('y1', hi.toFixed(2))
    span.current?.setAttribute('y2', lo.toFixed(2))
    capTop.current?.setAttribute('y1', hi.toFixed(2))
    capTop.current?.setAttribute('y2', hi.toFixed(2))
    capLow.current?.setAttribute('y1', lo.toFixed(2))
    capLow.current?.setAttribute('y2', lo.toFixed(2))
  }
  const dial = useDetent({
    value: ahead - 1,
    stops: stops.current,
    magnet: 0.5,
    reach: 0.35,
    throw: 0.08,
    spring: { w: 22, z: 1 },
    muted: true,
    onFrame: (x) => paint(x),
    onStop: (i) => {
      if (byHand.current) latest.current.pick(i)
    },
  })
  const byHand = useRef(false)
  const toAhead = (f: number) => clamp(f * (latest.current.n - 1) - latest.current.edge - 1, 0, latest.current.ahead - 1)
  const [hand] = useState(() =>
    dragProps(dial, () => ({
      box: () => box.current,
      units: latest.current.n - 1,
      absolute: toAhead,
      hover: true,
      follow: true,
      muted: true,
      onGrab: () => (byHand.current = true),
      onLeave: () => dial.to(dial.nearest(dial.get()).value, { spring: { w: 22, z: 1 } }),
      onTap: (f) => {
        byHand.current = false
        const i = Math.round(toAhead(f))
        dial.to(i, { spring: { w: 22, z: 1 } })
        latest.current.pick(i)
      },
      release: () => ({ flick: false }),
    })),
  )
  useImperativeHandle(ref, () => ({
    read: (i) => {
      byHand.current = false
      setAt(i)
      dial.to(i, { spring: { w: 18, z: 1 } })
    },
  }), [dial])

  const all = [...history.map((p) => p.value), ...forecast.flatMap((f) => [f.low, f.high])]
  const top = Math.max(...all)
  const low = Math.min(...all)
  const pad = (top - low) * 0.08 || 1
  const X = (i: number) => (i / (n - 1)) * w
  const Y = (v: number) => T + (1 - (v - (low - pad)) / (top - low + pad * 2)) * (H - T - B)
  const seam = history[edge].value
  const xs = [edge, ...forecast.map((_, k) => edge + k + 1)].map(X)
  const past = w ? smooth(history.map((_, i) => X(i)), history.map((p) => Y(p.value))) : ''
  const upper = w ? smooth(xs, [seam, ...forecast.map((f) => f.high)].map(Y)) : ''
  const lower = [...forecast].map((f, k) => `L${xs[k + 1].toFixed(1)},${Y(f.low).toFixed(1)}`).reverse().join(' ')
  const band = `${upper} ${lower} L${xs[0].toFixed(1)},${Y(seam).toFixed(1)} Z`
  const f = forecast[at]
  const sure = odds((at + 1) / ahead)
  const range = `${format(f.low)} to ${format(f.high)}${unit ? ` ${unit}` : ''}`
  const labels = [...history.map((p) => p.label), ...forecast.map((p) => p.label)]
  const room = Math.max(1, Math.ceil(n / (w / 92 || 1)))
  const every = Math.ceil(room / 7) * 7
  const latest = useRef({ n, edge, ahead, pick })
  useLayoutEffect(() => {
    latest.current = { n, edge, ahead, pick }
  })
  useLayoutEffect(() => paint(dial.get()))
  const onKey = (e: KeyboardEvent) => {
    const to = e.key === 'ArrowLeft' ? at - 1 : e.key === 'ArrowRight' ? at + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ahead - 1 : null
    if (to === null) return
    e.preventDefault()
    byHand.current = false
    const k = clamp(to, 0, ahead - 1)
    dial.to(k, { instant: e.repeat, spring: { w: 22, z: 1 } })
    pick(k)
  }
  return (
    <div className={`@container ${INKS}`}>
      <p aria-live="polite" className="min-h-[2lh] text-[clamp(22px,4.6cqi,30px)] leading-[1.24] tracking-[-0.03em] text-ink @[560px]:min-h-0">
        <span key={`${f.label}|${range}|${sure}`}>
          By {f.label}, {range}. <span className="text-ink-3">{sure}.</span>
        </span>
      </p>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label="Forecast"
        aria-valuemin={0}
        aria-valuemax={ahead - 1}
        aria-valuenow={at}
        aria-valuetext={`By ${f.label}, ${range}. ${sure}.`}
        className="ring-focus relative mt-6 cursor-ew-resize touch-pan-y select-none rounded-[6px]"
        {...hand}
        onKeyDown={onKey}
      >
        <svg width="100%" height={H} className="block overflow-visible" aria-hidden>
          {w > 0 && (
            <>
              <defs>
                <InkDefs id={id} />
                <linearGradient id={`${id}fade`} x1={xs[0]} x2={w} y1={0} y2={0} gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#fff" stopOpacity={1} />
                  <stop offset="0.45" stopColor="#fff" stopOpacity={0.7} />
                  <stop offset="1" stopColor="#fff" stopOpacity={0.12} />
                </linearGradient>
                <mask id={`${id}thin`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={H}>
                  <rect width={w} height={H} fill={`url(#${id}fade)`} />
                </mask>
              </defs>
              <g mask={`url(#${id}thin)`}>
                <path d={band} fill="var(--ol-ink)" opacity={look === 'ink' ? 0.9 : 0.22} filter={look === 'ink' ? `url(#${id}grain)` : undefined} className={INK} />
              </g>
              <path d={past} fill="none" stroke="var(--ink)" strokeWidth={1.75} />
              <line x1={xs[0]} x2={xs[0]} y1={T} y2={H - B} stroke="var(--ink)" strokeOpacity={0.3} />
              <text x={xs[0] - 8} y={T + 10} textAnchor="end" className={AXIS}>
                {today}
              </text>
              <g ref={reader} stroke="var(--ink)" strokeWidth={1.5}>
                <line ref={span} x1={0} x2={0} />
                <line ref={capTop} x1={-4} x2={4} />
                <line ref={capLow} x1={-4} x2={4} />
              </g>
              <line x1={0} x2={w} y1={H - B + 0.5} y2={H - B + 0.5} stroke="var(--line)" />
              {labels.map((l, i) =>
                i % every === 0 ? (
                  <text key={l} x={X(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className={AXIS}>
                    {l}
                  </text>
                ) : null,
              )}
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
