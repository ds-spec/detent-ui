'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, Ref, RefObject } from 'react'

export type Reading = { label: string; value: number }

export type BaselineHandle = {
  start(i: number): void
  read(i: number | null): void
}

export type BaselineChartProps = {
  data: Reading[]
  start?: number
  format?: (n: number) => string
  label?: string
  look?: 'ink' | 'plain'
  onStart?: (i: number) => void
  ref?: Ref<BaselineHandle>
}

type Spring = { w: number; z: number }
type Body = { x: number; v: number }
type Mode = 'rest' | 'held' | 'coast' | 'settle'

type DetentOptions = {
  value: number
  stops?: number[]
  magnet?: number
  reach?: number
  spring?: Spring
  reduce?: boolean
  onFrame: (x: number) => void
  onStop?: (i: number) => void
}

type Detent = ReturnType<typeof createDetent>

type DragConfig = {
  box: () => HTMLElement | null
  absolute: (fraction: number) => number
  onTap: (fraction: number) => void
  onLeave: () => void
  onGrab: () => void
}

const H = 280
const T = 16
const B = 28
const AXIS = 'fill-[var(--muted-foreground)] font-mono text-[10px] uppercase tracking-[0.06em]'
const INKS =
  '[--bl-up:#2f5fe0] [--bl-down:#d24a4a] [--bl-word-up:#2f5fe0] [--bl-word-down:#c43c3c] [.dark_&]:[--bl-up:#7c9bf5] [.dark_&]:[--bl-down:#ef8a8a] [.dark_&]:[--bl-word-up:#7c9bf5] [.dark_&]:[--bl-word-down:#ef8a8a]'
const INK = 'mix-blend-multiply [.dark_&]:mix-blend-screen'
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
const GLIDE: Spring = { w: 13, z: 1 }
const FOLLOW: Spring = { w: 22, z: 1 }
const SPRING: Spring = { w: 17, z: 0.92 }
const CATCH: Spring = { w: 24, z: 1 }
const MOMENTUM = 1
const SLOP = { mouse: 5, touch: 10 }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpAt = (list: number[], i: number) => {
  const a = clamp(Math.floor(i), 0, list.length - 1)
  return lerp(list[a], list[Math.min(list.length - 1, a + 1)], clamp(i - a, 0, 1))
}

function smooth(xs: number[], ys: number[]) {
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

function springStep(b: Body, target: number, { w, z }: Spring, dt: number) {
  const a = b.x - target
  if (z >= 1) {
    const e = Math.exp(-w * dt)
    const k = b.v + w * a
    b.x = target + (a + k * dt) * e
    b.v = (b.v - k * w * dt) * e
    return b
  }
  const wd = w * Math.sqrt(1 - z * z)
  const e = Math.exp(-z * w * dt)
  const c = Math.cos(wd * dt)
  const s = Math.sin(wd * dt)
  const k = (b.v + z * w * a) / wd
  b.x = target + e * (a * c + k * s)
  b.v = e * ((k * wd - z * w * a) * c - (a * wd + z * w * k) * s)
  return b
}

const still = (b: Body, target: number, eps: number) => Math.abs(b.x - target) < eps && Math.abs(b.v) < eps * 12

const rubber = (d: number, reach: number, s: number) => reach * (1 - 1 / (1 + (s * d) / reach))

function tracker(window = 90) {
  const samples: [number, number][] = []
  return {
    clear: () => (samples.length = 0),
    add(t: number, x: number) {
      samples.push([t, x])
      while (samples.length > 2 && t - samples[0][0] > window) samples.shift()
    },
    read(now: number) {
      const n = samples.length
      if (n < 2 || now - samples[n - 1][0] > 60) return 0
      const mt = samples.reduce((s, p) => s + p[0], 0) / n
      const mx = samples.reduce((s, p) => s + p[1], 0) / n
      const num = samples.reduce((s, p) => s + (p[0] - mt) * (p[1] - mx), 0)
      const den = samples.reduce((s, p) => s + (p[0] - mt) ** 2, 0)
      return den > 0 ? (num / den) * 1000 : 0
    },
  }
}

function createDetent(read: () => DetentOptions) {
  const init = read()
  const body: Body = { x: init.value, v: 0 }
  const residual: Body = { x: 0, v: 0 }
  const track = tracker()
  let mode: Mode = 'rest'
  let hand = init.value
  let target = init.value
  let spring = SPRING
  let friction = 4
  let frame = 0
  let then = 0
  let stop = -1
  let shown = init.value

  const span = () => {
    const o = read()
    const s = o.stops
    return { o, s, lo: s?.[0] ?? -Infinity, hi: s?.[s.length - 1] ?? Infinity, m: o.reduce ? 0 : (o.magnet ?? 0), reach: o.reach ?? (s && s.length > 1 ? s[1] - s[0] : 1) * 0.5 }
  }

  const out = (u: number) => {
    const { s, lo, hi, m, reach } = span()
    if (u < lo) return lo - rubber(lo - u, reach, 1 - m)
    if (u > hi) return hi + rubber(u - hi, reach, 1 - m)
    if (!s || s.length < 2 || !m) return u
    let i = 0
    while (i < s.length - 2 && u > s[i + 1]) i++
    const t = (u - s[i]) / (s[i + 1] - s[i])
    return s[i] + (s[i + 1] - s[i]) * (t - (m * Math.sin(2 * Math.PI * t)) / (2 * Math.PI))
  }
  const nearest = (x: number) => {
    const { s, lo, hi } = span()
    if (!s?.length) return { i: -1, value: clamp(x, lo, hi) }
    let i = 0
    for (let k = 1; k < s.length; k++) if (Math.abs(s[k] - x) < Math.abs(s[i] - x)) i = k
    return { i, value: s[i] }
  }
  const gap = () => {
    const { s } = span()
    return s && s.length > 1 ? (s[s.length - 1] - s[0]) / (s.length - 1) : 1
  }
  const landing = (s: Spring, v: number): Spring => (Math.abs(v) > gap() * MOMENTUM ? s : { ...s, z: 1 })
  const coastEnd = () => gap() * 0.7
  const settleEps = () => gap() * 0.0015

  const start = () => {
    if (frame || typeof requestAnimationFrame === 'undefined') return
    then = performance.now()
    frame = requestAnimationFrame(loop)
  }

  const land = () => {
    mode = 'rest'
    body.x = target
    body.v = 0
  }

  const emit = () => {
    const { o } = span()
    const x = out(body.x)
    shown = x
    const n = nearest(x).i
    if (n !== stop) {
      if (stop >= 0) o.onStop?.(n)
      stop = n
    }
    o.onFrame(x)
  }

  function advance(dt: number, now: number) {
    if (mode === 'held') {
      springStep(residual, 0, CATCH, dt)
      body.x = hand + residual.x
      body.v = track.read(now) + residual.v
      return
    }
    if (mode === 'coast') {
      const e = Math.exp(-friction * dt)
      body.x += (body.v / friction) * (1 - e)
      body.v *= e
      const left = Math.abs(target - body.x)
      if (left < coastEnd() || Math.abs(body.v) < 0.5 * coastEnd() || Math.sign(target - body.x) !== Math.sign(body.v)) mode = 'settle'
      return
    }
    if (mode === 'settle') {
      springStep(body, target, spring, dt)
      if (still(body, target, settleEps())) land()
    }
  }

  function loop(now: number) {
    frame = 0
    const dt = clamp((now - then) / 1000, 1 / 240, 0.05)
    then = now
    if (mode !== 'rest') advance(dt, now)
    emit()
    if (mode !== 'rest') frame = requestAnimationFrame(loop)
  }

  const launch = () => {
    const away = target - body.x
    if (Math.abs(away) > gap() * 1.6 && Math.sign(away) === Math.sign(body.v)) {
      friction = clamp(Math.abs(body.v / away), 2.5, 9)
      mode = 'coast'
    } else mode = 'settle'
    start()
  }

  const to = (value: number, opts: { spring?: Spring; instant?: boolean } = {}) => {
    const { o, lo, hi } = span()
    target = clamp(value, lo, hi)
    if (opts.instant || o.reduce) {
      land()
      emit()
      return
    }
    if (mode === 'held') {
      body.x = hand + residual.x
      residual.x = residual.v = 0
    }
    spring = opts.spring ?? landing(o.spring ?? SPRING, 0)
    mode = 'settle'
    start()
  }

  return {
    get: () => shown,
    mode: () => mode,
    set(value: number) {
      body.x = target = hand = value
      body.v = residual.x = residual.v = 0
      mode = 'rest'
      stop = -1
      emit()
      stop = nearest(shown).i
    },
    to,
    grab(place: number) {
      const { o } = span()
      residual.x = o.reduce ? 0 : body.x - place
      residual.v = o.reduce ? 0 : body.v
      hand = place
      track.clear()
      track.add(performance.now(), place)
      mode = 'held'
      start()
    },
    drag(place: number) {
      if (mode !== 'held') return
      hand = place
      track.add(performance.now(), place)
    },
    release(home?: number) {
      if (mode !== 'held') return
      const { o, lo, hi } = span()
      body.x = hand + residual.x
      body.v = residual.v
      residual.x = residual.v = 0
      const rest = home ?? nearest(clamp(body.x, lo, hi)).value
      target = rest
      spring = landing(o.spring ?? SPRING, body.v)
      if (o.reduce) {
        to(rest)
        return
      }
      launch()
    },
    dispose() {
      cancelAnimationFrame(frame)
      frame = 0
    },
  }
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduce(q.matches)
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])
  return reduce
}

function useDetent(options: Omit<DetentOptions, 'reduce'>) {
  const reduce = useReducedMotion()
  const [[d, update]] = useState(() => {
    let latest: DetentOptions = { ...options, reduce }
    return [createDetent(() => latest), (next: DetentOptions) => (latest = next)] as const
  })
  useLayoutEffect(() => {
    update({ ...options, reduce })
  })
  useLayoutEffect(() => () => d.dispose(), [d])
  return d
}

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function dragProps(d: Detent, read: () => DragConfig) {
  let press: { id: number; px: number; py: number; moved: boolean; held: boolean } | null = null
  const place = (e: ReactPointerEvent) => {
    const c = read()
    const r = c.box()?.getBoundingClientRect()
    if (!r) return null
    const size = r.width || 1
    return { fraction: (e.clientX - r.left) / size, c }
  }
  const take = (e: ReactPointerEvent) => {
    if (!press) return
    const p = place(e)
    if (!p) return
    press.held = true
    p.c.onGrab()
    d.grab(p.c.absolute(p.fraction))
  }
  return {
    onPointerDown(e: ReactPointerEvent) {
      if (e.button) return
      e.currentTarget.setPointerCapture?.(e.pointerId)
      press = { id: e.pointerId, px: e.clientX, py: e.clientY, moved: false, held: false }
      if (e.pointerType !== 'touch') take(e)
    },
    onPointerMove(e: ReactPointerEvent) {
      if (press) {
        if (e.pointerId !== press.id) return
        if (!press.moved && Math.hypot(e.clientX - press.px, e.clientY - press.py) > (e.pointerType === 'touch' ? SLOP.touch : SLOP.mouse)) press.moved = true
        if (!press.held && press.moved) take(e)
        const p = place(e)
        if (p && press.held) d.drag(p.c.absolute(p.fraction))
        return
      }
      if (e.pointerType !== 'mouse') return
      const p = place(e)
      if (!p) return
      const at = p.c.absolute(p.fraction)
      if (d.mode() === 'held') d.drag(at)
      else {
        p.c.onGrab()
        d.grab(at)
      }
    },
    onPointerUp(e: ReactPointerEvent) {
      if (!press || e.pointerId !== press.id) return
      const { moved, held } = press
      const p = place(e)
      press = null
      if (!moved && p) {
        if (held) d.release(d.get())
        p.c.onTap(p.fraction)
      } else if (held) d.release()
    },
    onPointerCancel(e: ReactPointerEvent) {
      if (!press || e.pointerId !== press.id) return
      const { held } = press
      press = null
      if (held) d.release()
      read().onLeave()
    },
    onPointerLeave(e: ReactPointerEvent) {
      if (press || e.pointerType !== 'mouse') return
      if (d.mode() === 'held') d.release(d.get())
      read().onLeave()
    },
  }
}

function Grain({ id }: { id: string }) {
  return (
    <>
      {(
        [
          ['grain', 7],
          ['grainB', 31],
        ] as const
      ).map(([name, seed]) => (
        <filter key={name} id={`${id}${name}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed={seed} stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.55" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      ))}
    </>
  )
}

export function BaselineChart({ data, start = 0, format = (n) => n.toLocaleString('en-US'), label = 'Metric', look = 'ink', onStart, ref }: BaselineChartProps) {
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const w = useWidth(box)
  const last = data.length - 1
  const [from, setFrom] = useState(Math.min(start, last))
  const [at, setAt] = useState<number | null>(null)
  const stops = useMemo(() => Array.from({ length: last + 1 }, (_, i) => i), [last])
  const byHand = useRef(false)
  const shapeEl = useRef<(SVGPathElement | null)[]>([])
  const clips = useRef<(SVGRectElement | null)[]>([])
  const levelLine = useRef<SVGLineElement>(null)
  const post = useRef<SVGLineElement>(null)
  const seatDot = useRef<SVGCircleElement>(null)
  const readDot = useRef<SVGCircleElement>(null)
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
  const seatI = useDetent({ value: from, spring: GLIDE, onFrame: () => paintSeat() })
  const seatV = useDetent({ value: data[from].value, spring: GLIDE, onFrame: () => paintSeat() })
  const paintRead = (x: number) => {
    const el = readDot.current
    if (!el) return
    const u = clamp(x, 0, last)
    el.setAttribute('cx', X(u).toFixed(2))
    el.setAttribute('cy', Y(lerpAt(values, u)).toFixed(2))
  }
  const reading = useDetent({
    value: last,
    stops,
    magnet: 0.3,
    reach: 0.8,
    spring: FOLLOW,
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
    if (hiding()) reading.set(i)
    else reading.to(i, { spring: FOLLOW, instant })
  }

  useEffect(() => {
    seatI.to(from, { spring: GLIDE })
    seatV.to(data[from].value, { spring: GLIDE })
  }, [from, data, seatI, seatV])

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
  const line = useMemo(() => {
    if (!w) return ''
    const vs = data.map((d) => d.value)
    const hi = Math.max(...vs)
    const lo = Math.min(...vs)
    const p = (hi - lo) * 0.12 || 1
    const n = data.length - 1 || 1
    return smooth(
      vs.map((_, i) => (i / n) * w),
      vs.map((v) => T + (1 - (v - (lo - p)) / (hi - lo + p * 2)) * (H - T - B)),
    )
  }, [w, data])
  const seatX = X(seatI.get())
  const level = Y(seatV.get())
  const shape = `${line} L${w},${level} L0,${level} Z`
  const end = at !== null && at !== from ? at : last
  const gain = data[end].value - data[from].value
  const pct = Math.abs((gain / (data[from].value || 1)) * 100).toFixed(1)
  const word = gain > 0 ? `up ${format(gain)}` : gain < 0 ? `down ${format(-gain)}` : 'flat'
  const back = end < from
  const than = gain < 0 ? `${format(-gain)} lower` : `${format(gain)} higher`
  const said = back ? `${data[end].label} was ${than} than ${data[from].label}` : `Since ${data[from].label}, ${word} by ${data[end].label}`
  const filter = (name: string) => (look === 'ink' ? `url(#${id}${name})` : undefined)
  const room = Math.max(1, Math.ceil((last + 1) / (w / 92 || 1)))
  const every = last + 1 <= 7 ? room : Math.ceil(room / 7) * 7
  const latest = useRef({ last, choose, point })
  useLayoutEffect(() => {
    latest.current = { last, choose, point }
  })
  useImperativeHandle(ref, () => ({ start: (i) => setFrom(Math.max(0, Math.min(last, i))), read: (i) => latest.current.point(i) }), [last])
  const toIndex = (f: number) => clamp(f, 0, 1) * latest.current.last
  const [[hand, aim]] = useState(() => {
    let read: () => DragConfig
    return [dragProps(reading, () => read()), (next: () => DragConfig) => (read = next)] as const
  })
  useLayoutEffect(() => {
    aim(() => ({
      box: () => box.current,
      absolute: (f) => {
        const u = toIndex(f)
        if (hiding()) {
          reading.set(u)
          setAt(Math.round(u))
        }
        return u
      },
      onGrab: () => (byHand.current = true),
      onTap: (f) => {
        const i = Math.round(toIndex(f))
        latest.current.point(i)
        latest.current.choose(i)
      },
      onLeave: () => latest.current.point(null),
    }))
  })
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
      <p aria-live="polite" className="min-h-[2lh] text-[clamp(22px,4.6cqi,30px)] leading-[1.24] tracking-[-0.03em] text-foreground @[560px]:min-h-0">
        <span key={`${back}|${data[from].label}|${data[end].label}|${pct}|${back ? than : word}`}>
          {back ? `${data[end].label} was ` : `Since ${data[from].label}, `}
          <span className={gain >= 0 ? 'text-[var(--bl-word-up)]' : 'text-[var(--bl-word-down)]'}>{back ? than : word}</span>
          <span className="text-muted-foreground">
            {back ? ` than ${data[from].label}` : ` by ${data[end].label}`}, or {pct}%.
          </span>
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
        className={`${FOCUS} relative mt-6 cursor-crosshair touch-pan-y select-none rounded-[6px]`}
        {...hand}
        onKeyDown={onKey}
      >
        <svg width="100%" height={H} className="block overflow-visible" aria-hidden>
          {w > 0 && (
            <>
              <defs>
                <Grain id={id} />
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
              <path d={line} fill="none" stroke="var(--foreground)" strokeOpacity={0.2} strokeWidth={1.5} />
              <path d={line} fill="none" stroke="var(--foreground)" strokeWidth={1.75} clipPath={`url(#${id}since)`} />
              <line ref={levelLine} x1={seatX} x2={w} y1={level} y2={level} stroke="var(--foreground)" strokeOpacity={0.45} strokeDasharray="2 3" />
              <line ref={post} x1={seatX} x2={seatX} y1={level} y2={H - B} stroke="var(--foreground)" strokeOpacity={0.25} />
              <circle ref={seatDot} cx={seatX} cy={level} r={3.5} fill="var(--background)" stroke="var(--foreground)" strokeWidth={1.5} />
              <circle ref={readDot} r={3.5} fill="var(--foreground)" style={{ visibility: at === null ? 'hidden' : undefined }} />
              <line x1={0} x2={w} y1={H - B + 0.5} y2={H - B + 0.5} stroke="var(--border)" />
              {data.map((d, i) =>
                i % every === 0 ? (
                  <text key={i} x={X(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} className={AXIS}>
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

export default BaselineChart
