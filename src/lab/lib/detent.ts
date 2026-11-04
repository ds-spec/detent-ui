import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useReducedMotion } from 'motion/react'

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const glide = (a: number, b: number, t: number) => (a > 0 && b > 0 ? a * Math.pow(b / a, t) : lerp(a, b, t))

export const notched = (x: number, centres: number[], reach: number, hold = 0.7) => {
  for (const c of centres) {
    const d = (x - c) / reach
    if (Math.abs(d) < 1) return x - ((hold * reach) / Math.PI) * Math.sin(Math.PI * d) * ((1 + Math.cos(Math.PI * d)) / 2)
  }
  return x
}

export const at = (list: number[], i: number, mix = lerp) => {
  const a = clamp(Math.floor(i), 0, list.length - 1)
  return mix(list[a], list[Math.min(list.length - 1, a + 1)], clamp(i - a, 0, 1))
}

export type Spring = { w: number; z: number }
export type Body = { x: number; v: number }

export function springStep(b: Body, target: number, { w, z }: Spring, dt: number) {
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
  const B = (b.v + z * w * a) / wd
  b.x = target + e * (a * c + B * s)
  b.v = e * ((B * wd - z * w * a) * c - (a * wd + z * w * B) * s)
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

export const feedback = (() => {
  let audio: AudioContext | null = null
  let last = 0
  let asked = false
  let on = true
  let cancel: (() => void) | null = null
  let holding = false
  const open = () => {
    cancel = null
    audio ??= new AudioContext()
    if (asked && audio.state === 'suspended') void audio.resume()
  }
  const warm = () => {
    if (!on || audio || cancel || holding || typeof AudioContext === 'undefined') return
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(open, { timeout: 300 })
      cancel = () => cancelIdleCallback(id)
    } else {
      const id = setTimeout(open, 60)
      cancel = () => clearTimeout(id)
    }
  }
  const letGo = () => {
    holding = false
    removeEventListener('pointerup', letGo)
    removeEventListener('pointercancel', letGo)
    warm()
  }
  const play = (heavy: boolean, loud: number) => {
    if (!audio) return
    const t = audio.currentTime
    const tone = audio.createOscillator()
    const gain = audio.createGain()
    tone.frequency.setValueAtTime(heavy ? 900 : 1500, t)
    tone.frequency.exponentialRampToValueAtTime(heavy ? 240 : 420, t + 0.014)
    gain.gain.setValueAtTime((heavy ? 0.034 : 0.02) * loud, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (heavy ? 0.03 : 0.016))
    tone.connect(gain).connect(audio.destination)
    tone.start(t)
    tone.stop(t + 0.034)
  }
  return {
    set(next: boolean) {
      on = next
      if (on) return
      cancel?.()
      cancel = null
      void audio?.suspend()
    },
    warm,
    wake(grab = false) {
      if (!on) return
      asked = true
      if (audio) {
        if (audio.state === 'suspended') void audio.resume()
      } else if (!grab) warm()
      else if (!holding && typeof AudioContext !== 'undefined') {
        cancel?.()
        cancel = null
        holding = true
        addEventListener('pointerup', letGo)
        addEventListener('pointercancel', letGo)
      }
    },
    tick(heavy = false, speed = 1) {
      if (!on || !asked) return
      const now = performance.now()
      if (now - last < 34) return
      last = now
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(heavy ? 10 : 4)
      if (!audio) return
      const loud = 0.45 + 0.55 * clamp(speed, 0, 1)
      if (audio.state === 'running') play(heavy, loud)
      else void audio.resume().then(() => on && play(heavy, loud))
    },
  }
})()

export type FrameInfo = {
  dt: number
  mode: Mode
  live: boolean
}
export type Mode = 'rest' | 'held' | 'coast' | 'settle' | 'sweep'

export type DetentOptions = {
  value: number
  stops?: number[]
  min?: number
  max?: number
  magnet?: number
  reach?: number
  throw?: number
  spring?: Spring
  catch?: Spring
  muted?: boolean
  reduce?: boolean
  onFrame: (x: number, v: number, info: FrameInfo) => boolean | void
  onStop?: (i: number) => void
  onRest?: (x: number, i: number) => void
}

export type Detent = ReturnType<typeof createDetent>

const SPRING: Spring = { w: 17, z: 0.92 }
const CATCH: Spring = { w: 24, z: 1 }
const MOMENTUM = 1
const SWIFT = 8

export function createDetent(read: () => DetentOptions) {
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
  let feel = false
  let stop = -1
  let shown = init.value
  let sweep = { from: 0, to: 0, t: 0, T: 1 }
  let keyAt = 0

  const span = () => {
    const o = read()
    const s = o.stops
    return { o, s, lo: o.min ?? s?.[0] ?? -Infinity, hi: o.max ?? s?.[s.length - 1] ?? Infinity, m: o.reduce ? 0 : o.magnet ?? 0, reach: o.reach ?? ((s && s.length > 1 ? s[1] - s[0] : 1) * 0.5) }
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
  const slope = (u: number) => {
    const e = 1e-4
    return (out(u + e) - out(u - e)) / (2 * e)
  }
  const nearest = (x: number) => {
    const { s, lo, hi } = span()
    if (!s?.length) return { i: -1, value: clamp(x, lo, hi) }
    let i = 0
    for (let k = 1; k < s.length; k++) if (Math.abs(s[k] - x) < Math.abs(s[i] - x)) i = k
    return { i, value: s[i] }
  }

  const start = () => {
    if (frame || typeof requestAnimationFrame === 'undefined') return
    then = performance.now()
    frame = requestAnimationFrame(loop)
  }

  const land = () => {
    mode = 'rest'
    body.x = target
    body.v = 0
    feel = false
  }

  const emit = (dt: number) => {
    const { o } = span()
    const x = out(body.x)
    const v = slope(body.x) * body.v
    shown = x
    const n = nearest(x).i
    if (n !== stop) {
      if (stop >= 0) {
        o.onStop?.(n)
        if (feel && !o.muted) feedback.tick(false, Math.abs(v) / (gap() * SWIFT))
      }
      stop = n
    }
    return o.onFrame(x, v, { dt, mode, live: mode === 'held' || mode === 'coast' })
  }

  function advance(dt: number, now: number) {
    const { o } = span()
    if (mode === 'held' || mode === 'sweep') {
      if (mode === 'sweep') {
        sweep.t = Math.min(sweep.T, sweep.t + dt)
        const p = sweep.t / sweep.T
        const next = lerp(sweep.from, sweep.to, p * p * p * (p * (6 * p - 15) + 10))
        body.v = dt > 0 ? (next - hand) / dt + residual.v : body.v
        hand = next
      }
      springStep(residual, 0, o.catch ?? CATCH, dt)
      body.x = hand + residual.x
      if (mode === 'held') body.v = track.read(now) + residual.v
      if (mode === 'sweep' && sweep.t >= sweep.T && still(residual, 0, 1e-3)) {
        target = sweep.to
        land()
        return true
      }
      return false
    }
    if (mode === 'coast') {
      const e = Math.exp(-friction * dt)
      body.x += (body.v / friction) * (1 - e)
      body.v *= e
      const left = Math.abs(target - body.x)
      if (left < coastEnd() || Math.abs(body.v) < 0.5 * coastEnd() || Math.sign(target - body.x) !== Math.sign(body.v)) mode = 'settle'
      return false
    }
    if (mode === 'settle') {
      springStep(body, target, spring, dt)
      if (still(body, target, settleEps())) {
        land()
        return true
      }
    }
    return false
  }
  const gap = () => {
    const { s } = span()
    return s && s.length > 1 ? (s[s.length - 1] - s[0]) / (s.length - 1) : 1
  }
  const landing = (s: Spring, v: number): Spring => (Math.abs(v) > gap() * MOMENTUM ? s : { ...s, z: 1 })
  const coastEnd = () => gap() * 0.7
  const settleEps = () => gap() * 0.0015

  function loop(now: number) {
    frame = 0
    const dt = clamp((now - then) / 1000, 1 / 240, 0.05)
    then = now
    const was = mode
    const landed = was !== 'rest' && advance(dt, now)
    const more = emit(dt)
    if (landed) {
      const { o } = span()
      o.onRest?.(out(body.x), nearest(out(body.x)).i)
    }
    if (mode !== 'rest' || more) frame = requestAnimationFrame(loop)
  }

  const launch = () => {
    const away = target - body.x
    if (Math.abs(away) > gap() * 1.6 && Math.sign(away) === Math.sign(body.v)) {
      friction = clamp(Math.abs(body.v / away), 2.5, 9)
      mode = 'coast'
    } else mode = 'settle'
    start()
  }

  const to = (value: number, opts: { spring?: Spring; instant?: boolean; velocity?: number; feel?: boolean } = {}) => {
    const { o, lo, hi } = span()
    target = clamp(value, lo, hi)
    if (opts.velocity !== undefined) body.v = opts.velocity
    feel = !!opts.feel
    if (opts.instant || o.reduce) {
      land()
      emit(0)
      o.onRest?.(target, nearest(target).i)
      return
    }
    if (mode === 'held') {
      body.x = hand + residual.x
      residual.x = residual.v = 0
    }
    spring = opts.spring ?? landing(o.spring ?? SPRING, opts.velocity ?? 0)
    mode = 'settle'
    start()
  }

  const api = {
    get: () => shown,
    place: () => body.x + (mode === 'rest' ? 0 : body.v / (span().o.catch ?? CATCH).w),
    velocity: () => slope(body.x) * body.v,
    mode: () => mode,
    target: () => target,
    nearest,

    set(value: number) {
      body.x = target = hand = value
      body.v = residual.x = residual.v = 0
      mode = 'rest'
      feel = false
      stop = -1
      emit(0)
      stop = nearest(shown).i
    },
    to,

    grab(place: number, { feel: touching = true }: { feel?: boolean } = {}) {
      const { o } = span()
      residual.x = o.reduce ? 0 : body.x - place
      residual.v = o.reduce ? 0 : body.v
      hand = place
      track.clear()
      track.add(performance.now(), place)
      feel = touching
      mode = 'held'
      start()
    },
    drag(place: number) {
      if (mode !== 'held') return
      hand = place
      track.add(performance.now(), place)
    },
    release({ flick = true, home }: { flick?: boolean; home?: number } = {}) {
      if (mode !== 'held') return
      const { o, lo, hi } = span()
      const flung = flick ? track.read(performance.now()) : 0
      body.x = hand + residual.x
      body.v = flung + residual.v
      residual.x = residual.v = 0
      const rest = home ?? nearest(clamp(body.x + flung * (o.throw ?? 0.16), lo, hi)).value
      target = rest
      spring = landing(o.spring ?? SPRING, body.v)
      if (o.reduce) {
        to(rest)
        return
      }
      launch()
    },
    fling(velocity: number) {
      const { o, lo, hi } = span()
      const rest = nearest(clamp(body.x + velocity * (o.throw ?? 0.16), lo, hi)).value
      if (o.reduce) return to(rest)
      residual.x = residual.v = 0
      body.v = velocity
      feel = false
      target = rest
      spring = o.spring ?? SPRING
      launch()
    },
    sweep(value: number, ms: number) {
      const { o } = span()
      if (o.reduce) return to(value)
      residual.x = 0
      residual.v = body.v
      hand = body.x
      sweep = { from: body.x, to: value, t: 0, T: Math.max(0.05, ms / 1000) }
      feel = false
      mode = 'sweep'
      start()
    },
    step(by: number, repeat = false) {
      const { o, s, lo, hi } = span()
      const now = performance.now()
      const quick = repeat || now - keyAt < 110
      keyAt = now
      if (!o.muted) feedback.wake()
      const from = mode === 'rest' ? body.x : target
      const next = s ? s[clamp(nearest(from).i + by, 0, s.length - 1)] : clamp(from + by, lo, hi)
      to(next, { instant: quick, feel: !quick })
      return next
    },
    wake: start,
    dispose() {
      cancelAnimationFrame(frame)
      frame = 0
    },
  }
  return api
}

export function useDetent(options: Omit<DetentOptions, 'reduce'>) {
  const reduce = !!useReducedMotion()
  const latest = useRef<DetentOptions>({ ...options, reduce })
  useLayoutEffect(() => {
    latest.current = { ...options, reduce }
  })
  const [d] = useState(() => createDetent(() => latest.current))
  useLayoutEffect(() => () => d.dispose(), [d])
  return d
}

export type DragConfig = {
  axis?: 'x' | 'y'
  box: () => HTMLElement | null
  units: number
  absolute?: (fraction: number) => number
  hover?: boolean
  follow?: boolean
  onTap?: (fraction: number) => void
  onLeave?: () => void
  onGrab?: () => void
  release?: () => { flick?: boolean; home?: number }
  muted?: boolean
}

const SLOP = { mouse: 5, touch: 10 }

export function dragProps(d: Detent, read: () => DragConfig) {
  let press: { id: number; px: number; py: number; from: number; moved: boolean; held: boolean; caught: boolean } | null = null
  const place = (e: ReactPointerEvent) => {
    const c = read()
    const r = c.box()?.getBoundingClientRect()
    if (!r) return null
    const horizontal = (c.axis ?? 'x') === 'x'
    const size = (horizontal ? r.width : r.height) || 1
    const px = horizontal ? e.clientX : e.clientY
    return { fraction: (px - (horizontal ? r.left : r.top)) / size, px, unit: size / c.units, c }
  }
  const hand = (e: ReactPointerEvent) => {
    const p = place(e)
    if (!p || !press) return null
    return p.c.absolute && !press.caught ? p.c.absolute(p.fraction) : press.from + (p.px - ((p.c.axis ?? 'x') === 'x' ? press.px : press.py)) / p.unit
  }
  const take = (e: ReactPointerEvent) => {
    if (!press) return
    const at = hand(e)
    if (at === null) return
    press.held = true
    read().onGrab?.()
    d.grab(at)
  }
  const inFlight = () => d.mode() !== 'rest' && d.mode() !== 'held' && d.mode() !== 'sweep'
  return {
    onPointerDown(e: ReactPointerEvent) {
      if (e.button) return
      const c = read()
      if (!c.muted) feedback.wake(true)
      e.currentTarget.setPointerCapture?.(e.pointerId)
      press = { id: e.pointerId, px: e.clientX, py: e.clientY, from: d.place(), moved: false, held: false, caught: inFlight() && !c.follow }
      if (e.pointerType !== 'touch' || press.caught || !c.absolute) take(e)
    },
    onPointerMove(e: ReactPointerEvent) {
      const c = read()
      if (!c.muted && e.pointerType === 'mouse') feedback.warm()
      if (press) {
        if (e.pointerId !== press.id) return
        if (!press.moved && Math.hypot(e.clientX - press.px, e.clientY - press.py) > (e.pointerType === 'touch' ? SLOP.touch : SLOP.mouse)) press.moved = true
        if (!press.held && press.moved) take(e)
        const at = hand(e)
        if (at !== null && press.held) d.drag(at)
        return
      }
      if (!c.hover || e.pointerType !== 'mouse' || (inFlight() && !c.follow)) return
      const p = place(e)
      if (!p || !c.absolute) return
      const at = c.absolute(p.fraction)
      if (d.mode() === 'held') d.drag(at)
      else {
        c.onGrab?.()
        d.grab(at, { feel: false })
      }
    },
    onPointerUp(e: ReactPointerEvent) {
      if (!press || e.pointerId !== press.id) return
      const { moved, held } = press
      const p = place(e)
      const c = read()
      press = null
      if (!moved && c.onTap && p) {
        if (held) d.release({ flick: false, home: d.get() })
        c.onTap(p.fraction)
      } else if (held) d.release(c.release?.())
    },
    onPointerCancel(e: ReactPointerEvent) {
      if (!press || e.pointerId !== press.id) return
      const { held } = press
      press = null
      if (held) d.release({ flick: false })
      read().onLeave?.()
    },
    onPointerLeave(e: ReactPointerEvent) {
      if (press || e.pointerType !== 'mouse') return
      const c = read()
      if (!c.hover) return
      if (d.mode() === 'held') d.release({ flick: false, home: d.get() })
      c.onLeave?.()
    },
  }
}

export const stepKey = (d: Detent, e: KeyboardEvent, keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 }) => {
  const by = keys[e.key]
  if (!by) return false
  e.preventDefault()
  d.step(by, e.repeat)
  return true
}

const COLUMN = 'display:inline-block;height:1.25em;overflow:hidden;vertical-align:top'
const STRIP = '0123456789'

export function createRoller(el: HTMLElement, format: (n: number) => string, pad = 0, built?: (columns: HTMLElement[]) => void) {
  let shape = ''
  let wheels: { strip: HTMLElement; col: HTMLElement }[] = []
  let scale = 1

  const build = (s: string, digits: number) => {
    el.textContent = ''
    wheels = []
    const col = () => {
      const c = document.createElement('span')
      c.style.cssText = COLUMN
      const strip = document.createElement('span')
      strip.style.cssText = 'display:block;will-change:transform'
      strip.innerHTML = [...STRIP, '0'].map((n) => `<span style="display:block;height:1.25em">${n}</span>`).join('')
      c.append(strip)
      el.append(c)
      wheels.push({ strip, col: c })
    }
    let padded = Math.max(0, pad - digits)
    let leading = true
    for (const ch of s) {
      if (/\d/.test(ch)) {
        if (leading) for (; padded > 0; padded--) col()
        leading = false
        col()
      } else {
        const c = document.createElement('span')
        c.textContent = ch
        c.style.whiteSpace = 'pre'
        el.append(c)
      }
    }
    built?.([...el.children] as HTMLElement[])
  }

  return (value: number, speed = 0) => {
    const s = format(value)
    const digits = s.replace(/\D/g, '')
    const next = s.replace(/\d/g, '0')
    if (next !== shape) {
      shape = next
      build(s, digits.length)
    }
    const numeric = s.replace(/[^\d.]/g, '').replace(/\.$/, '')
    const shownNumber = parseFloat(numeric)
    const decimals = numeric.includes('.') ? numeric.length - numeric.indexOf('.') - 1 : 0
    if (shownNumber > 0) scale = Math.abs(value) / shownNumber
    const place = Math.pow(10, -decimals) * (scale || 1)
    const q = Math.abs(value) / place
    const free = clamp(Math.abs(speed) / (place * 6), 0, 1)
    const count = wheels.length
    const whole = digits.padStart(count, '0')
    for (let k = 0; k < count; k++) {
      const { strip, col } = wheels[count - 1 - k]
      const unit = Math.pow(10, k)
      const lower = q % unit
      const carry = k === 0 ? q - Math.floor(q) : clamp(lower - (unit - 1), 0, 1)
      const running = (Math.floor(q / unit) % 10) + carry
      const digit = +whole[count - 1 - k]
      const off = ((digit - running + 15) % 10) - 5
      const pos = (running + off * (1 - free) + 10) % 10
      strip.style.transform = `translateY(${(-pos * 100) / 11}%)`
      if (pad) {
        const higher = Math.floor(q / unit)
        const fade = k === 0 ? 1 : higher > 0 ? 1 : clamp(lower - (unit - 1), 0, 1)
        col.style.opacity = String(fade)
      }
    }
  }
}

export const write = (el: HTMLElement | null | undefined, text: string) => {
  if (el && el.textContent !== text) el.textContent = text
}
