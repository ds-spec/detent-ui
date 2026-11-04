'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useReducedMotion } from 'motion/react'
import { clamp, feedback, notched, useDetent } from '../../lib/detent'

export type RewindStep = { text: string; caret: number; t: number }
export type RewindCell = { id: number; c: string; born: number; died: number }
export type RewindHistory = { steps: RewindStep[]; tape: RewindCell[] }
type Token = { space: boolean; cells: number[] }

export type RewindProps = {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  history?: RewindHistory
  onHistory?: (history: RewindHistory) => void
  pill?: boolean
  lost?: string
  ghost?: number
  intro?: number
  rows?: number
  maxHeight?: number
  placeholder?: string
  label?: string
  className?: string
}

export const NEVER = Number.MAX_SAFE_INTEGER
const HOLD = 220
const PAUSE = 2.5
const GAIN = 0.75
const EDGE = 36
const GLIDE = 30
const LIMIT = 6000

const VERTEX = `attribute vec2 a;varying vec2 u;void main(){u=(a+1.)/2.;gl_Position=vec4(a,0.,1.);}`
const FRAGMENT = `precision highp float;
varying vec2 u;
uniform sampler2D T;
uniform vec3 ink,lost;
uniform float cell,ghost;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec4 t=texture2D(T,vec2(u.x,1.-u.y));
  if(t.a<.004){gl_FragColor=vec4(0.);return;}
  float L=t.r;
  vec2 g=gl_FragCoord.xy/cell;
  float h=hash(floor(g));
  float d=length(fract(g)-.5)*2.;
  float on=smoothstep(h-.08,h+.08,L*1.16-.08);
  float dot_=mix(smoothstep(1.05,.55,d),1.,smoothstep(.62,.98,L));
  float lit=L>.992?1.:on*dot_;
  float a=t.a*mix(ghost,1.,lit);
  vec3 c=t.g>.5?lost:ink;
  gl_FragColor=vec4(c*a,a);
}`

const rgb = (color: string) => {
  const x = document.createElement('canvas').getContext('2d')!
  x.fillStyle = '#000'
  x.fillStyle = color
  const v = x.fillStyle
  if (v.startsWith('#')) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
  return (v.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((n) => Number(n) / 255)
}

const living = (tape: RewindCell[]) => tape.filter((m) => m.died === NEVER)
const slot = (tape: RewindCell[], at: number) => {
  while (at < tape.length && tape[at].died !== NEVER) at++
  return at
}

function tokens(tape: RewindCell[]) {
  const out: Token[] = []
  tape.forEach((m, k) => {
    const space = /\s/.test(m.c)
    const top = out[out.length - 1]
    const dead = m.died !== NEVER
    if (top && !top.space && !space && (tape[top.cells[0]].died !== NEVER) === dead) top.cells.push(k)
    else out.push({ space, cells: [k] })
  })
  return out
}

const fresh = (text: string): RewindHistory => {
  return { steps: [{ text, caret: text.length, t: 0 }], tape: [...text].map((c, id) => ({ id, c, born: 0, died: NEVER })) }
}

const ago = (s: number) => (s < 5 ? 'Just now' : s < 60 ? `${Math.round(s / 5) * 5} seconds ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} hr ago`)

export function Rewind({ value, defaultValue = '', onChange, history: saved, onHistory, pill: showPill = true, lost = '#0a6cff', ghost = 0.13, intro, rows = 6, maxHeight, placeholder, label = 'Note', className = '' }: RewindProps) {
  const reduce = !!useReducedMotion()
  const seed = useMemo(() => saved ?? fresh(value ?? defaultValue), []) // eslint-disable-line react-hooks/exhaustive-deps
  const steps = useRef(seed.steps)
  const tape = useRef(seed.tape)
  const nextId = useRef(seed.tape.reduce((a, m) => Math.max(a, m.id + 1), 0))
  const [count, setCount] = useState(seed.steps.length)
  const [version, setVersion] = useState(0)
  const last = count - 1
  const marks = useMemo(() => {
    const h = steps.current
    return h.flatMap((s, i) => (i === 0 || i === h.length - 1 || h[i + 1]?.t - s.t > PAUSE ? [i] : []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const box = useRef<HTMLTextAreaElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const glow = useRef<HTMLCanvasElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const cells = useRef<(HTMLSpanElement | null)[]>([])
  const wordEls = useRef<(HTMLSpanElement | null)[]>([])
  const draft = useRef<HTMLCanvasElement | null>(null)
  const gl = useRef<{ c: WebGLRenderingContext; u: (n: string) => WebGLUniformLocation | null } | null>(null)
  const seats = useRef(new Map<number, { x: number; y: number }>())
  const drift = useRef(new Map<number, { x: number; y: number }>())
  const chase = useRef<number | null>(null)
  const raf = useRef(0)
  const then = useRef(0)
  const [plain, setPlain] = useState(false)
  const [at, setAt] = useState(seed.steps.length - 1)
  const [live, setLive] = useState(false)
  const shown = useRef(seed.steps.length - 1)
  const exact = useRef(seed.steps.length - 1)
  const playing = useRef(false)
  const hand = useRef(0)
  const home = useRef(0)
  const mouse = useRef<number | null>(null)
  const timer = useRef(0)
  const held = useRef(false)
  const composing = useRef(false)
  const edge = reduce ? 1 : EDGE
  const rest = at === last && !live
  const words = useMemo(() => (rest ? [] : tokens(tape.current)), [version, rest]) // eslint-disable-line react-hooks/exhaustive-deps
  const ready = useRef(false)
  const quiet = useRef(false)

  const draw = () => {
    const i = shown.current
    const soft = exact.current
    const el = glow.current, core = gl.current, root = view.current, type = layer.current
    if (!el || !core || !root || !type) return
    const dpr = Math.min(2, devicePixelRatio || 1)
    const W = Math.round(root.clientWidth * dpr), H = Math.round(root.clientHeight * dpr)
    if (!W || !H) return
    if (!draft.current) draft.current = document.createElement('canvas')
    const off = draft.current
    if (off.width !== W || off.height !== H) {
      off.width = el.width = W
      off.height = el.height = H
      core.c.viewport(0, 0, W, H)
    }
    const x = off.getContext('2d')!
    const end = steps.current.length - 1
    const style = getComputedStyle(type)
    x.setTransform(1, 0, 0, 1, 0, 0)
    x.clearRect(0, 0, W, H)
    x.setTransform(dpr, 0, 0, dpr, 0, 0)
    x.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    x.textBaseline = 'alphabetic'
    const lift = x.measureText('x').fontBoundingBoxAscent
    const size = parseFloat(style.fontSize)
    const top = root.scrollTop
    for (const w of words) {
      if (w.space) continue
      const shift = drift.current.get(w.cells[0])
      for (const k of w.cells) {
        const seat = seats.current.get(k)
        if (!seat) continue
        const y = seat.y - top + (shift?.y ?? 0)
        if (y < -size * 2 || y > root.clientHeight + size) continue
        const m = tape.current[k]
        const on = m.born <= i && i < m.died
        const L = i === end ? 1 : on ? clamp((soft - m.born + 1) / edge, 0, 1) : 0
        x.fillStyle = `rgb(${Math.round(L * 255)},${on && m.died !== NEVER ? 255 : 0},0)`
        x.fillText(m.c, seat.x + (shift?.x ?? 0), y + lift)
      }
    }
    const c = core.c
    c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, c.RGBA, c.UNSIGNED_BYTE, off)
    c.uniform3fv(core.u('ink'), rgb(getComputedStyle(root).color))
    c.uniform1f(core.u('cell'), 1.25 * dpr)
    c.clearColor(0, 0, 0, 0)
    c.clear(c.COLOR_BUFFER_BIT)
    c.drawArrays(c.TRIANGLES, 0, 3)
  }

  const settle = (now: number) => {
    const dt = Math.min(0.05, (now - then.current) / 1000)
    then.current = now
    let busy = false
    const e = Math.exp(-GLIDE * dt)
    drift.current.forEach((v, k) => {
      v.x *= e
      v.y *= e
      if (Math.abs(v.x) + Math.abs(v.y) < 0.15) drift.current.delete(k)
      else busy = true
    })
    const root = view.current
    if (root && chase.current !== null) {
      const left = chase.current - root.scrollTop
      if (Math.abs(left) < 1) chase.current = null
      else {
        root.scrollTop += left * (1 - Math.exp(-12 * dt))
        busy = true
      }
    }
    latest.current.draw()
    raf.current = busy ? requestAnimationFrame(latest.current.settle) : 0
  }
  const wake = () => {
    if (raf.current) return
    then.current = performance.now()
    raf.current = requestAnimationFrame(latest.current.settle)
  }

  const paint = (i: number) => {
    const end = steps.current.length - 1
    const root = page.current
    if (fill.current) fill.current.style.transform = `translate3d(${(i / Math.max(1, end) - 1) * 100}%,0,0)`
    if (!ready.current) return
    tape.current.forEach((m, k) => {
      const el = cells.current[k]
      if (!el) return
      const display = (m.born <= i && i < m.died) || m.died === NEVER ? '' : 'none'
      if (el.style.display !== display) el.style.display = display
    })
    if (root) {
      const r = root.getBoundingClientRect()
      const size_ = parseFloat(getComputedStyle(root).fontSize)
      words.forEach((w, n) => {
        const el = wordEls.current[n]
        if (!el) return
        const seen = w.cells.some((k) => cells.current[k]?.style.display !== 'none')
        el.style.display = seen ? '' : 'none'
        const after = words[n + 1]
        const ends = !after || tape.current[after.cells[0]].died === NEVER
        if (!w.space) el.style.marginRight = seen && ends && tape.current[w.cells[0]].died !== NEVER ? '.26em' : ''
      })
      for (const w of words) {
        if (w.space) continue
        let first = true
        for (const k of w.cells) {
          const el = cells.current[k]
          if (!el || el.style.display === 'none') {
            seats.current.delete(k)
            continue
          }
          const q = el.getBoundingClientRect()
          const seat = { x: q.left - r.left, y: q.top - r.top }
          const old = seats.current.get(k)
          if (old && first && !reduce) {
            const was = drift.current.get(w.cells[0]) ?? { x: 0, y: 0 }
            const dx = old.x + was.x - seat.x, dy = old.y + was.y - seat.y
            if (Math.abs(dy) > size_ / 2) drift.current.delete(w.cells[0])
            else if (Math.abs(dx) > 0.5) drift.current.set(w.cells[0], { x: dx, y: 0 })
          }
          first = false
          seats.current.set(k, seat)
        }
      }
    }
    const mark = bar.current, frame = view.current
    if (mark && root && frame) {
      let seen = 0
      let prior: HTMLSpanElement | null = null
      const want = steps.current[i].caret
      for (let k = 0; k < tape.current.length && seen < want; k++) {
        const m = tape.current[k]
        if (m.born <= i && i < m.died) {
          seen++
          prior = cells.current[k]
        }
      }
      const q = prior?.getBoundingClientRect(), r = root.getBoundingClientRect()
      const y = q ? q.top - r.top : 0
      mark.style.opacity = i === end ? '0' : '1'
      mark.style.height = q ? `${q.height}px` : '1.3em'
      mark.style.transform = `translate3d(${q ? q.right - r.left : 0}px,${y}px,0)`
      const pad = 48
      if (i !== end && (y < frame.scrollTop + pad || y > frame.scrollTop + frame.clientHeight - pad)) chase.current = clamp(y - frame.clientHeight / 2, 0, frame.scrollHeight - frame.clientHeight)
    }
    draw()
    if (drift.current.size || chase.current !== null) wake()
  }

  const show = (x: number) => {
    if (quiet.current) return
    exact.current = x
    if (playing.current) {
      const i = clamp(Math.round(x), 0, steps.current.length - 1)
      if (i !== shown.current) {
        shown.current = i
        setAt(i)
        paint(i)
      } else draw()
      return
    }
    const near = marks.reduce((a, m) => (Math.abs(m - x) < Math.abs(a - x) ? m : a), marks[0] ?? 0)
    const i = clamp(Math.round(notched(x, [near], 5, 0.6)), 0, steps.current.length - 1)
    if (i === shown.current) return draw()
    if (marks.includes(i)) feedback.tick()
    shown.current = i
    setAt(i)
    paint(i)
  }
  const latest = useRef({ show, draw, settle, glide: (_: number) => {} })
  latest.current = { ...latest.current, show, draw, settle }
  const goal = useRef(seed.steps.length - 1)
  const soft = useRef(seed.steps.length - 1)
  const trail = useRef(0)
  const trailed = useRef(0)
  const glide = (now: number) => {
    const dt = Math.min(0.05, (now - trailed.current) / 1000)
    trailed.current = now
    soft.current += (goal.current - soft.current) * (1 - Math.exp(-24 * dt))
    if (Math.abs(goal.current - soft.current) < 0.02) soft.current = goal.current
    latest.current.show(soft.current)
    trail.current = soft.current === goal.current ? 0 : requestAnimationFrame(latest.current.glide)
  }
  latest.current.glide = glide
  const follow = (x: number) => {
    goal.current = x
    if (reduce || quiet.current) {
      soft.current = x
      return show(x)
    }
    if (trail.current) return
    trailed.current = performance.now()
    trail.current = requestAnimationFrame(latest.current.glide)
  }
  const d = useDetent({ value: last, min: 0, max: Math.max(1, last), reach: 18, spring: { w: 18, z: 1 }, onFrame: (x) => follow(x) })

  useLayoutEffect(() => {
    if (!gl.current && glow.current) {
      const c = glow.current.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true })
      if (!c) setPlain(true)
      else {
        const sh = (t: number, src: string) => {
          const o = c.createShader(t)!
          c.shaderSource(o, src)
          c.compileShader(o)
          return o
        }
        const prog = c.createProgram()!
        c.attachShader(prog, sh(c.VERTEX_SHADER, VERTEX))
        c.attachShader(prog, sh(c.FRAGMENT_SHADER, FRAGMENT))
        c.linkProgram(prog)
        c.useProgram(prog)
        c.bindBuffer(c.ARRAY_BUFFER, c.createBuffer())
        c.bufferData(c.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), c.STATIC_DRAW)
        const a = c.getAttribLocation(prog, 'a')
        c.enableVertexAttribArray(a)
        c.vertexAttribPointer(a, 2, c.FLOAT, false, 0, 0)
        c.bindTexture(c.TEXTURE_2D, c.createTexture())
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.NEAREST)
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.NEAREST)
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.CLAMP_TO_EDGE)
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.CLAMP_TO_EDGE)
        const u = (n: string) => c.getUniformLocation(prog, n)
        c.uniform3fv(u('lost'), rgb(lost))
        c.uniform1f(u('ghost'), ghost)
        gl.current = { c, u }
      }
    }
    quiet.current = true
    if (rest) d.set(shown.current)
    quiet.current = false
    ready.current = !rest
    drift.current.clear()
    seats.current.clear()
    paint(shown.current)
    if (rest) return
    const again = () => {
      seats.current.clear()
      paint(shown.current)
    }
    void document.fonts?.ready.then(again)
    const watch = new ResizeObserver(again)
    if (view.current) watch.observe(view.current)
    return () => watch.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, rest])

  useEffect(() => {
    const el = box.current!
    el.value = steps.current[shown.current].text
    return () => {
      cancelAnimationFrame(raf.current)
      cancelAnimationFrame(trail.current)
    }
  }, [])

  const begin = () => {
    feedback.wake(true)
    home.current = shown.current
    hand.current = shown.current
    d.grab(hand.current)
    setLive(true)
  }
  const move = (px: number) => {
    hand.current += px * GAIN
    d.drag(hand.current)
  }
  const place = (i: number) => {
    const el = box.current
    if (!el) return
    const s = steps.current[i]
    el.value = s.text
    el.setSelectionRange(s.caret, s.caret)
  }
  const end = (keep: boolean) => {
    held.current = false
    mouse.current = null
    setLive(false)
    const i = keep ? shown.current : home.current
    d.release({ flick: false, home: i })
    place(i)
    box.current?.focus()
  }
  const stepTo = (i: number) => {
    feedback.wake()
    d.to(i, { spring: { w: 40, z: 1 } })
    place(i)
  }
  const prev = () => [...marks].reverse().find((m) => m < shown.current) ?? 0
  const next = () => marks.find((m) => m > shown.current) ?? steps.current.length - 1

  useEffect(() => {
    if (!live) return
    const over = (e: MouseEvent) => {
      if (!held.current) return
      if (mouse.current !== null) move(e.clientX - mouse.current)
      mouse.current = e.clientX
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      move((e.deltaX || e.deltaY) * -0.6)
    }
    const up = (e: KeyboardEvent) => {
      if (held.current && (e.key === 'Meta' || e.key === 'Control' || e.key.toLowerCase() === 'z')) end(true)
    }
    addEventListener('mousemove', over)
    addEventListener('wheel', wheel, { passive: false })
    addEventListener('keyup', up)
    return () => {
      removeEventListener('mousemove', over)
      removeEventListener('wheel', wheel)
      removeEventListener('keyup', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])

  const keys = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape' && live) return end(false)
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
    e.preventDefault()
    if (e.repeat) return
    if (e.shiftKey) return stepTo(next())
    window.clearTimeout(timer.current)
    const was = shown.current
    timer.current = window.setTimeout(() => {
      held.current = true
      begin()
    }, HOLD)
    const lift = (u: globalThis.KeyboardEvent) => {
      if (u.key !== 'Meta' && u.key !== 'Control' && u.key.toLowerCase() !== 'z') return
      removeEventListener('keyup', lift)
      window.clearTimeout(timer.current)
      if (!held.current && shown.current === was) stepTo(prev())
    }
    addEventListener('keyup', lift)
  }

  const record = (text: string, caret: number) => {
    const i = shown.current
    const old = steps.current[i].text
    if (text === old) return
    const step = i + 1
    tape.current = tape.current.filter((m) => m.born <= i)
    tape.current.forEach((m) => {
      if (m.died > i) m.died = NEVER
    })
    const keep = steps.current.slice(0, i + 1)
    let head = 0
    while (head < old.length && head < text.length && old[head] === text[head]) head++
    let tail = 0
    while (tail < old.length - head && tail < text.length - head && old[old.length - 1 - tail] === text[text.length - 1 - tail]) tail++
    const alive = living(tape.current)
    for (let k = head; k < old.length - tail; k++) alive[k].died = step
    const after = slot(tape.current, head ? tape.current.indexOf(alive[head - 1]) + 1 : 0)
    tape.current.splice(after, 0, ...[...text.slice(head, text.length - tail)].map((c) => ({ id: nextId.current++, c, born: step, died: NEVER })))
    const now = Date.now() / 1000
    if (!keep[0].t) keep[0] = { ...keep[0], t: now }
    keep.push({ text, caret, t: now })
    if (keep.length > LIMIT) {
      const cut = keep.length - LIMIT
      keep.splice(0, cut)
      tape.current = tape.current.filter((m) => m.died > cut).map((m) => ({ ...m, born: Math.max(0, m.born - cut), died: m.died === NEVER ? NEVER : m.died - cut }))
    }
    steps.current = keep
    shown.current = keep.length - 1
    setCount(keep.length)
    setAt(keep.length - 1)
    setVersion((v) => v + 1)
    quiet.current = true
    d.set(keep.length - 1)
    quiet.current = false
    onHistory?.({ steps: keep, tape: tape.current })
  }

  const input = () => {
    if (composing.current) return
    const el = box.current!
    record(el.value, el.selectionStart)
    onChange?.(el.value)
  }

  useEffect(() => {
    if (value !== undefined && value !== steps.current[shown.current].text) {
      record(value, value.length)
      if (box.current) box.current.value = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const press = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    begin()
    mouse.current = e.clientX
  }
  const drag = (e: ReactPointerEvent) => {
    if (mouse.current === null || held.current) return
    move(e.clientX - mouse.current)
    mouse.current = e.clientX
  }
  const show_ = useRef<number[]>([])
  const stopIntro = () => {
    show_.current.forEach((t) => window.clearTimeout(t))
    show_.current = []
    playing.current = false
  }
  useEffect(() => {
    if (intro === undefined || reduce) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        playing.current = true
        const end = steps.current.length - 1
        show_.current = [
          window.setTimeout(() => d.sweep(intro, 3400), 600),
          window.setTimeout(() => d.sweep(end, 2200), 5200),
          window.setTimeout(() => stopIntro(), 7600),
        ]
      },
      { threshold: 0.6 },
    )
    if (view.current) io.observe(view.current)
    return () => {
      io.disconnect()
      stopIntro()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro, reduce])
  const touched = (e: ReactPointerEvent) => {
    if (!playing.current) return
    stopIntro()
    if (!(e.target as HTMLElement).closest('[role=slider]')) stepTo(steps.current.length - 1)
  }

  const pillKeys = (e: ReactKeyboardEvent) => {
    const go = { ArrowLeft: prev, ArrowRight: next }[e.key]
    if (go) {
      e.preventDefault()
      return stepTo(go())
    }
    keys(e)
  }

  const word = at === last ? 'Now' : ago(steps.current[last].t - steps.current[at].t)
  return (
    <div onPointerDownCapture={touched} onKeyDownCapture={stopIntro} className={`w-full ${className}`}>
      <div className="relative">
        <div
          ref={view}
          onScroll={draw}
          className="overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maxHeight }}
        >
          <div ref={page} className="relative" style={{ minHeight: `${rows * 1.4}em` }}>
            <div ref={layer} aria-hidden className={`pointer-events-none min-h-[1lh] whitespace-pre-wrap break-words ${plain && !rest ? '' : 'text-transparent'}`}>
              {rest && steps.current[at].text}
              {words.map((w, n) => (
                <span
                  key={tape.current[w.cells[0]].id}
                  ref={(el) => {
                    wordEls.current[n] = el
                  }}
                  className={w.space ? undefined : 'inline-block'}
                >
                  {w.cells.map((k) => (
                    <span
                      key={tape.current[k].id}
                      ref={(el) => {
                        cells.current[k] = el
                      }}
                    >
                      {tape.current[k].c}
                    </span>
                  ))}
                </span>
              ))}
              {'​'}
            </div>
            <span ref={bar} aria-hidden className="pointer-events-none absolute left-0 top-0 w-[2px] rounded-full bg-current opacity-0" />
            <textarea
              ref={box}
              aria-label={label}
              placeholder={placeholder}
              spellCheck={false}
              readOnly={live}
              onChange={input}
              onCompositionStart={() => (composing.current = true)}
              onCompositionEnd={() => {
                composing.current = false
                input()
              }}
              onKeyDown={keys}
              className={`absolute inset-0 size-full resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent p-0 outline-none placeholder:text-current/40 [font:inherit] [letter-spacing:inherit] ${rest ? 'text-inherit' : 'text-transparent'}`}
              style={{ caretColor: rest ? 'currentColor' : 'transparent' }}
            />
          </div>
        </div>
        <canvas ref={glow} aria-hidden className={`pointer-events-none absolute inset-0 size-full ${plain || rest ? 'invisible' : ''}`} />
      </div>
      {showPill && (
        <div className="sticky bottom-6 mt-6 flex justify-center">
          <button
            type="button"
            role="slider"
            aria-label="Rewind"
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={at}
            aria-valuetext={word}
            onPointerDown={press}
            onPointerMove={drag}
            onPointerUp={() => mouse.current !== null && !held.current && end(true)}
            onPointerCancel={() => mouse.current !== null && !held.current && end(false)}
            onKeyDown={pillKeys}
            className={`ring-focus relative h-9 w-[148px] max-w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-full bg-surface text-[14px] font-medium not-italic leading-none tracking-[-.005em] shadow-[0_0_0_.5px_var(--line),0_1px_2px_rgb(0_0_0/.05)] transition-[scale,color] duration-150 before:absolute before:-inset-y-1.5 before:inset-x-0 active:scale-[.98] ${rest ? 'text-ink-3' : 'text-ink'}`}
          >
            <span ref={fill} aria-hidden className="absolute inset-0 bg-ink/[.07]" />
            <span className="tnum relative">{word}</span>
          </button>
        </div>
      )}
    </div>
  )
}
