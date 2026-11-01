'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { smooth } from '@/lab/components/charts/parts'
import { at as lerpAt, clamp, dragProps, useDetent } from '@/lab/lib/detent'
import { useSize } from '@/lab/lib/hooks'
import { INK, InkDefs } from '@/lab/ui/ink'

export type Reading = { label: string; value: number }
export type BaselineHandle = {
  /** Make this reading the starting point. */
  start(i: number): void
  /** Point at a reading, or null to let go. */
  read(i: number | null): void
}

const H = 280
const T = 16
const B = 28
const AXIS = 'fill-[var(--ink-3)] font-mono text-[10px] uppercase tracking-[0.06em]'
const INKS = '[--bl-up:#2f5fe0] [--bl-down:#d24a4a] [--bl-word-up:#2f5fe0] [--bl-word-down:#c43c3c] dark:[--bl-up:#7c9bf5] dark:[--bl-down:#ef8a8a] dark:[--bl-word-up:#7c9bf5] dark:[--bl-word-down:#ef8a8a]'
const GLIDE = { w: 13, z: 1 }
const FOLLOW = { w: 22, z: 1 }

/**
 * A metric against any day you choose.
 *
 * Every number on a chart is relative to something, and here that something is yours to set. Click
 * a day and it becomes the level: what sits above it prints in blue, what sits below in red, and
 * the sentence over the chart reads again from there. Point along the line to read to any other day:
 * the reading runs along the line and catches on each day.
 */
export function BaselineChart({ data, start = 0, format = (n) => n.toLocaleString('en-US'), label = 'Metric', look = 'ink', onStart, ref }: {
  /** The readings, oldest first. */
  data: Reading[]
  /** Which reading it starts from. */
  start?: number
  /** Formats an amount for the sentence. */
  format?: (n: number) => string
  /** Names the chart for screen readers. */
  label?: string
  /** Grain ink, or flat fills. */
  look?: 'ink' | 'plain'
  /** Called with the reading a person chose to start from. */
  onStart?: (i: number) => void
  ref?: Ref<BaselineHandle>
}) {
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const { w } = useSize(box)
  const last = data.length - 1
  const [from, setFrom] = useState(Math.min(start, last))
  const [at, setAt] = useState<number | null>(null)
  const stops = useRef<number[]>([])
  if (stops.current.length !== last + 1) stops.current = data.map((_, i) => i)
  const byHand = useRef(false)
  const shapeEl = useRef<(SVGPathElement | null)[]>([])
  const clips = useRef<(SVGRectElement | null)[]>([])
  const levelLine = useRef<SVGLineElement>(null)
  const post = useRef<SVGLineElement>(null)
  const seatDot = useRef<SVGCircleElement>(null)
  const readDot = useRef<SVGCircleElement>(null)
  // Where the level is drawn, which glides to where it's been set: across and up at once, each keeping its speed.
  const paintSeat = () => {
    const sx = X(seatI.get())
    const lv = Y(seatV.get())
    const d = `${line} L${w},${lv.toFixed(2)} L0,${lv.toFixed(2)} Z`
    shapeEl.current.forEach((el) => el?.setAttribute('d', d))
    clips.current.forEach((el, i) => {
      if (!el) return
      el.setAttribute('x', sx.toFixed(2))
      if (i === 0) el.setAttribute('height', (lv + T).toFixed(2))
      if (i === 1) el.setAttribute('y', lv.toFixed(2))
    })
    if (levelLine.current) {
      levelLine.current.setAttribute('x1', sx.toFixed(2))
      levelLine.current.setAttribute('y1', lv.toFixed(2))
      levelLine.current.setAttribute('y2', lv.toFixed(2))
    }
    if (post.current) {
      post.current.setAttribute('x1', sx.toFixed(2))
      post.current.setAttribute('x2', sx.toFixed(2))
      post.current.setAttribute('y1', lv.toFixed(2))
    }
    seatDot.current?.setAttribute('cx', sx.toFixed(2))
    seatDot.current?.setAttribute('cy', lv.toFixed(2))
  }
  const seatI = useDetent({ value: from, muted: true, spring: GLIDE, onFrame: () => paintSeat() })
  const seatV = useDetent({ value: data[from].value, muted: true, spring: GLIDE, onFrame: () => paintSeat() })
  const paintRead = (x: number) => {
    const el = readDot.current
    if (!el) return
    const u = clamp(x, 0, last)
    el.setAttribute('cx', X(u).toFixed(2))
    el.setAttribute('cy', Y(lerpAt(values, u)).toFixed(2))
  }
  const reading = useDetent({
    value: last,
    stops: stops.current,
    magnet: 0.3,
    reach: 0.8,
    spring: FOLLOW,
    muted: true,
    onFrame: (x) => paintRead(x),
    onStop: (i) => {
      if (byHand.current) setAt(i)
    },
  })
  const hiding = () => readDot.current?.style.visibility === 'hidden'
  const point = (i: number | null, instant = false) => {
    byHand.current = false
    setAt(i)
    if (i === null) return
    // A reading that wasn't showing starts where it's asked for; one that was runs there.
    if (hiding()) reading.set(i)
    else reading.to(i, { spring: FOLLOW, instant })
  }

  useEffect(() => {
    seatI.to(from, { spring: GLIDE })
    seatV.to(data[from].value, { spring: GLIDE })
  }, [from, data, seatI, seatV])

  useImperativeHandle(ref, () => ({ start: (i) => setFrom(Math.max(0, Math.min(last, i))), read: point }), [last])

  const choose = (i: number) => {
    setFrom(i)
    onStart?.(i)
  }
  const values = data.map((d) => d.value)
  const top = Math.max(...values)
  const low = Math.min(...values)
  const pad = (top - low) * 0.12 || 1
  const X = (i: number) => (i / (last || 1)) * w
  const Y = (v: number) => T + (1 - (v - (low - pad)) / (top - low + pad * 2)) * (H - T - B)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const line = useMemo(() => (w ? smooth(data.map((_, i) => X(i)), values.map(Y)) : ''), [w, data])
  const seatX = X(seatI.get())
  const level = Y(seatV.get())
  const shape = `${line} L${w},${level} L0,${level} Z`
  const end = at !== null && at !== from ? at : last
  const gain = data[end].value - data[from].value
  const pct = Math.abs((gain / (data[from].value || 1)) * 100).toFixed(1)
  const word = gain > 0 ? `up ${format(gain)}` : gain < 0 ? `down ${format(-gain)}` : 'flat'
  // Reading back past the start, "since" no longer fits, so it compares the two days instead.
  const back = end < from
  const than = gain < 0 ? `${format(-gain)} lower` : `${format(gain)} higher`
  const said = back ? `${data[end].label} was ${than} than ${data[from].label}` : `Since ${data[from].label}, ${word} by ${data[end].label}`
  const filter = (name: string) => (look === 'ink' ? `url(#${id}${name})` : undefined)
  const room = Math.max(1, Math.ceil((last + 1) / (w / 92 || 1)))
  const every = Math.ceil(room / 7) * 7
  const latest = useRef({ last, choose, point })
  useLayoutEffect(() => {
    latest.current = { last, choose, point }
  })
  const toIndex = (f: number) => clamp(f, 0, 1) * latest.current.last
  const [hand] = useState(() =>
    dragProps(reading, () => ({
      box: () => box.current,
      units: latest.current.last,
      absolute: (f) => {
        const u = toIndex(f)
        if (hiding()) reading.set(u)
        return u
      },
      hover: true,
      follow: true,
      muted: true,
      onGrab: () => (byHand.current = true),
      onTap: (f) => {
        const i = Math.round(toIndex(f))
        latest.current.point(i)
        latest.current.choose(i)
      },
      onLeave: () => latest.current.point(null),
      release: () => ({ flick: false }),
    })),
  )
  useLayoutEffect(() => {
    paintSeat()
    paintRead(reading.get())
  })
  const onKey = (e: KeyboardEvent) => {
    const here = at ?? last
    if (e.key === 'ArrowLeft') point(Math.max(0, here - 1), e.repeat)
    else if (e.key === 'ArrowRight') point(Math.min(last, here + 1), e.repeat)
    else if (e.key === 'Home') point(0)
    else if (e.key === 'End') point(last)
    else if (e.key === 'Escape') point(null)
    else if (e.key === 'Enter' || e.key === ' ') choose(here)
    else return
    e.preventDefault()
  }
  return (
    <div className={`@container ${INKS}`}>
      <p aria-live="polite" className="min-h-[2lh] text-[clamp(22px,4.6cqi,30px)] leading-[1.24] tracking-[-0.03em] text-ink @[560px]:min-h-0">
        <span key={`${back}|${data[from].label}|${data[end].label}|${pct}|${back ? than : word}`}>
          {back ? `${data[end].label} was ` : `Since ${data[from].label}, `}
          <span className={gain >= 0 ? 'text-[var(--bl-word-up)]' : 'text-[var(--bl-word-down)]'}>{back ? than : word}</span>
          <span className="text-ink-3">{back ? ` than ${data[from].label}` : ` by ${data[end].label}`}, or {pct}%.</span>
        </span>
      </p>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={end}
        aria-valuetext={said}
        className="ring-focus relative mt-6 cursor-crosshair touch-pan-y select-none rounded-[6px]"
        {...hand}
        onKeyDown={onKey}
      >
        <svg width="100%" height={H} className="block overflow-visible" aria-hidden>
          {w > 0 && (
            <>
              <defs>
                <InkDefs id={id} />
                <clipPath id={`${id}up`}>
                  <rect ref={(el) => void (clips.current[0] = el)} x={seatX} y={-T} width={w} height={level + T} />
                </clipPath>
                <clipPath id={`${id}down`}>
                  <rect ref={(el) => void (clips.current[1] = el)} x={seatX} y={level} width={w} height={H} />
                </clipPath>
                <clipPath id={`${id}since`}>
                  <rect ref={(el) => void (clips.current[2] = el)} x={seatX} y={-T} width={w} height={H + T * 2} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}up)`}>
                <path ref={(el) => void (shapeEl.current[0] = el)} d={shape} fill="var(--bl-up)" opacity={look === 'ink' ? 0.6 : 0.16} filter={filter('grain')} className={INK} />
              </g>
              <g clipPath={`url(#${id}down)`}>
                <path ref={(el) => void (shapeEl.current[1] = el)} d={shape} fill="var(--bl-down)" opacity={look === 'ink' ? 0.6 : 0.16} filter={filter('grainB')} className={INK} />
              </g>
              <path d={line} fill="none" stroke="var(--ink)" strokeOpacity={0.2} strokeWidth={1.5} />
              <path d={line} fill="none" stroke="var(--ink)" strokeWidth={1.75} clipPath={`url(#${id}since)`} />
              <line ref={levelLine} x1={seatX} x2={w} y1={level} y2={level} stroke="var(--ink)" strokeOpacity={0.45} strokeDasharray="2 3" />
              <line ref={post} x1={seatX} x2={seatX} y1={level} y2={H - B} stroke="var(--ink)" strokeOpacity={0.25} />
              <circle ref={seatDot} cx={seatX} cy={level} r={3.5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
              <circle ref={readDot} r={3.5} fill="var(--ink)" style={{ visibility: at === null ? 'hidden' : undefined }} />
              <line x1={0} x2={w} y1={H - B + 0.5} y2={H - B + 0.5} stroke="var(--line)" />
              {data.map((d, i) =>
                i % every === 0 ? (
                  <text key={d.label} x={X(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} className={AXIS}>
                    {d.label}
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
