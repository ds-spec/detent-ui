'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'

export type PopupProps = {
  options: string[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  label?: string
  name?: string
  radius?: number
  textClass?: string
  className?: string
}

const ROW = 36
const PAD = 6
const LEFT = 14
const RIGHT = 34
const OPEN = { type: 'spring', bounce: 0, duration: 0.3 } as const
const SHUT = { type: 'spring', bounce: 0, duration: 0.24 } as const
const FOLLOW = { type: 'spring', stiffness: 900, damping: 60 } as const
const LOST = 48
const NOW = { duration: 0 } as const
const EDGE = 'drop-shadow(0 0 .5px color-mix(in oklch, var(--color-foreground) 30%, transparent)) drop-shadow(0 1px 1px rgb(0 0 0 / .05))'
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rubber = (d: number) => 18 * (1 - 1 / (1 + d / 60))

const notched = (x: number, centres: number[], reach: number, hold = 0.7) => {
  for (const c of centres) {
    const d = (x - c) / reach
    if (Math.abs(d) < 1) return x - ((hold * reach) / Math.PI) * Math.sin(Math.PI * d) * ((1 + Math.cos(Math.PI * d)) / 2)
  }
  return x
}

const feedback = (() => {
  let audio: AudioContext | null = null
  let last = 0
  let asked = false
  let cancel: (() => void) | null = null
  let holding = false
  const open = () => {
    cancel = null
    audio ??= new AudioContext()
    if (asked && audio.state === 'suspended') void audio.resume()
  }
  const warm = () => {
    if (audio || cancel || holding || typeof AudioContext === 'undefined') return
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
  const play = () => {
    if (!audio) return
    const t = audio.currentTime
    const tone = audio.createOscillator()
    const gain = audio.createGain()
    tone.frequency.setValueAtTime(1500, t)
    tone.frequency.exponentialRampToValueAtTime(420, t + 0.014)
    gain.gain.setValueAtTime(0.02, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.016)
    tone.connect(gain).connect(audio.destination)
    tone.start(t)
    tone.stop(t + 0.034)
  }
  return {
    grab() {
      asked = true
      if (audio) {
        if (audio.state === 'suspended') void audio.resume()
      } else if (!holding && typeof AudioContext !== 'undefined') {
        cancel?.()
        cancel = null
        holding = true
        addEventListener('pointerup', letGo)
        addEventListener('pointercancel', letGo)
      }
    },
    tick() {
      if (!asked) return
      const now = performance.now()
      if (now - last < 34) return
      last = now
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(4)
      if (!audio) return
      if (audio.state === 'running') play()
      else void audio.resume().then(play)
    },
  }
})()

const stack: object[] = []

function useDismiss(active: boolean, inside: RefObject<HTMLElement | null>[], onDismiss: (why: 'escape' | 'outside') => void) {
  const me = useRef({})
  const latest = useRef({ inside, onDismiss })
  useLayoutEffect(() => {
    latest.current = { inside, onDismiss }
  })
  useEffect(() => {
    if (!active) return
    const token = me.current
    stack.push(token)
    const top = () => stack[stack.length - 1] === token
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !top()) return
      e.stopPropagation()
      latest.current.onDismiss('escape')
    }
    const press = (e: PointerEvent) => {
      if (!top()) return
      const t = e.target as Node
      if (latest.current.inside.some((r) => r.current?.contains(t))) return
      latest.current.onDismiss('outside')
    }
    document.addEventListener('keydown', key, true)
    document.addEventListener('pointerdown', press, true)
    return () => {
      stack.splice(stack.indexOf(token), 1)
      document.removeEventListener('keydown', key, true)
      document.removeEventListener('pointerdown', press, true)
    }
  }, [active])
}

function useReposition(active: boolean, fn: () => void) {
  const latest = useRef(fn)
  useLayoutEffect(() => {
    latest.current = fn
  })
  useEffect(() => {
    if (!active) return
    const run = () => latest.current()
    addEventListener('resize', run)
    addEventListener('scroll', run, true)
    return () => {
      removeEventListener('resize', run)
      removeEventListener('scroll', run, true)
    }
  }, [active])
}

function Check() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="absolute right-3.5 size-3.5 self-center" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7.5 5.6 10.5 11.5 3.5" />
    </svg>
  )
}

function Updown() {
  return (
    <svg viewBox="0 0 10 14" aria-hidden className="h-3.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5 5 2l3 3M2 9l3 3 3-3" />
    </svg>
  )
}

export function Popup({ options, value: controlled, defaultValue, onChange, label, name, radius = 10, textClass = 'text-[14px] font-medium', className = '' }: PopupProps) {
  const reduce = !!useReducedMotion()
  const id = useId()
  const [inner, setInner] = useState(() => Math.max(0, options.indexOf(defaultValue ?? '')))
  const value = controlled === undefined ? inner : Math.max(0, options.indexOf(controlled))
  const start = value
  const [shown, setShown] = useState(false)
  const [active, setActive] = useState(start)
  const [from, setFrom] = useState(start)
  const [spot, setSpot] = useState({ x: 0, y: 0 })
  const [width, setWidth] = useState(0)

  const pill = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const probes = useRef<(HTMLSpanElement | null)[]>([])
  const nudge = useRef({ x: 0, y: 0 })
  const live = useRef({ mode: 'shut' as 'shut' | 'press' | 'tap', y0: 0, u0: 0, left: false, lost: false, active: start, value: start, l: 0, r: 0 })

  const open = useMotionValue(0)
  const anchor = useMotionValue(start)
  const plate = useMotionValue(start * ROW)
  const pull = useMotionValue(0)
  const pillW = useMotionValue(0)
  const on = useMotionValue(1)
  const fade = useMotionValue(0)
  const pillO = useTransform(fade, (f) => 1 - f)
  const height = PAD * 2 + ROW * options.length
  const widthRef = useRef(0)

  const y = useTransform([open, anchor, pull], ([o, a, p]: number[]) => -(PAD + ROW * a) + nudge.current.y * o + p)
  const x = useTransform(open, (o) => nudge.current.x * o)
  const clip = useTransform([open, anchor, pillW], ([o, a, w]: number[]) => {
    const top = (PAD + ROW * a) * (1 - o)
    const bottom = (height - PAD - ROW * (a + 1)) * (1 - o)
    return `inset(${top}px ${(widthRef.current - w) * (1 - o)}px ${bottom}px 0 round ${lerp(radius, 16, o)}px)`
  })
  const window_ = useTransform(plate, (p) => `inset(${PAD + p}px ${PAD}px ${height - PAD - ROW - p}px ${PAD}px round 10px)`)
  const inverted = useTransform([open, on], ([o, v]: number[]) => clamp((o - 0.3) / 0.5, 0, 1) * v)

  const widths = () => probes.current.map((p) => (p?.offsetWidth ?? 0) + LEFT + RIGHT)

  useLayoutEffect(() => {
    const read = () => {
      const all = widths()
      pillW.set(all[live.current.value])
      widthRef.current = Math.max(...all)
      setWidth(widthRef.current)
    }
    read()
    void document.fonts?.ready.then(read)
  }, [options.join('\n')])

  useEffect(() => {
    if (live.current.mode !== 'shut' || live.current.value === value) return
    live.current.value = value
    anchor.set(value)
    pillW.set(widths()[value])
  }, [value])

  const measure = () => {
    const r = pill.current!.getBoundingClientRect()
    return { f: { width: innerWidth, height: innerHeight }, box: { x: r.left, y: r.top } }
  }

  const mark = (i: number) => {
    if (live.current.active === i) return
    live.current.active = i
    setActive(i)
  }

  const show = (instant: boolean) => {
    const s = live.current
    const { f, box } = measure()
    const top = box.y - PAD - ROW * s.value
    nudge.current = {
      x: Math.min(0, f.width - 8 - (box.x + widthRef.current)),
      y: top < 12 ? 12 - top : Math.min(0, f.height - 12 - (top + height)),
    }
    setSpot({ x: box.x, y: box.y })
    s.l = box.x + nudge.current.x
    s.r = s.l + widthRef.current
    s.active = s.value
    setActive(s.value)
    setFrom(s.value)
    plate.set(s.value * ROW)
    fade.set(1)
    on.set(1)
    if (sheet.current) sheet.current.style.pointerEvents = ''
    setShown(true)
    anchor.set(s.value)
    animate(pull, 0, NOW)
    animate(open, 1, instant || reduce ? NOW : OPEN)
  }

  const hide = (instant = false) => {
    const s = live.current
    s.mode = 'shut'
    if (sheet.current) sheet.current.style.pointerEvents = 'none'
    animate(pull, 0, SHUT)
    animate(pillW, widths()[s.value], instant || reduce ? NOW : SHUT)
    animate(fade, 0, instant || reduce ? NOW : { duration: 0.18, ease: [0.2, 0.9, 0.25, 1] })
    animate(open, 0, instant || reduce ? NOW : SHUT).then(() => {
      if (live.current.mode === 'shut') setShown(false)
    })
  }

  const commit = (i: number) => {
    const changed = live.current.value !== i
    live.current.value = i
    setInner(i)
    hide()
    if (changed) onChange?.(options[i])
  }

  const down = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const s = live.current
    feedback.grab()
    if (s.mode !== 'shut') return hide()
    e.currentTarget.setPointerCapture(e.pointerId)
    s.mode = 'press'
    s.y0 = e.clientY
    s.u0 = s.value * ROW
    s.left = false
    s.lost = false
    show(false)
  }

  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = live.current
    if (s.mode !== 'press') return
    const d = e.clientY - s.y0
    s.lost = e.clientX < s.l - LOST || e.clientX > s.r + LOST
    on.set(s.lost ? 0 : 1)
    const hi = ROW * (options.length - 1)
    const u = s.u0 + d
    pull.set(u < 0 ? -rubber(-u) : u > hi ? rubber(u - hi) : 0)
    const near = clamp(u, 0, hi)
    plate.set(notched(near, options.map((_, i) => i * ROW), ROW / 2, 0.9))
    const i = Math.round(near / ROW)
    if (i !== s.active) {
      s.left = true
      mark(i)
      feedback.tick()
    }
  }

  const up = () => {
    const s = live.current
    if (s.mode !== 'press') return
    if (s.lost) return hide()
    if (!s.left) {
      s.mode = 'tap'
      pull.set(0)
      animate(plate, s.active * ROW, FOLLOW)
      return
    }
    commit(s.active)
  }

  const hover = (i: number) => {
    if (live.current.mode !== 'tap') return
    mark(i)
    animate(plate, i * ROW, reduce ? NOW : FOLLOW)
  }

  const keys = (e: ReactKeyboardEvent) => {
    const s = live.current
    if (s.mode === 'shut') {
      if (!['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return
      e.preventDefault()
      s.mode = 'tap'
      return show(true)
    }
    const last = options.length - 1
    const go = ({ ArrowUp: s.active - 1, ArrowDown: s.active + 1, Home: 0, End: last } as Record<string, number>)[e.key]
    if (go !== undefined) {
      e.preventDefault()
      const i = clamp(go, 0, last)
      mark(i)
      plate.set(i * ROW)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(s.active)
    }
  }

  useDismiss(shown, [pill, sheet], (why) => hide(why === 'escape'))
  useReposition(shown, () => {
    const { box } = measure()
    setSpot({ x: box.x, y: box.y })
  })

  const rows = (ghost: boolean) =>
    options.map((o, i) => (
      <div
        key={o}
        id={ghost ? undefined : `${id}-${i}`}
        role={ghost ? undefined : 'option'}
        data-slot={ghost ? undefined : 'popup-item'}
        aria-selected={ghost ? undefined : i === value}
        onPointerMove={ghost ? undefined : () => hover(i)}
        onClick={ghost ? undefined : () => live.current.mode === 'tap' && commit(i)}
        className="relative flex items-center whitespace-nowrap"
        style={{ height: ROW, paddingLeft: LEFT }}
      >
        {o}
        {i === from && <Check />}
      </div>
    ))

  return (
    <div data-slot="popup" className={`relative inline-block max-w-full align-middle ${className}`} style={{ height: ROW }}>
      {name && <input type="hidden" name={name} value={options[value]} />}
      <motion.button
        ref={pill}
        type="button"
        data-slot="popup-trigger"
        aria-haspopup="listbox"
        aria-expanded={shown}
        aria-label={label}
        aria-activedescendant={shown ? `${id}-${active}` : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => hide()}
        onTouchEnd={(e) => e.preventDefault()}
        onKeyDown={keys}
        onBlur={() => live.current.mode === 'tap' && hide(true)}
        className={`${FOCUS} relative flex touch-none select-none items-center whitespace-nowrap bg-popover text-popover-foreground before:absolute before:-inset-y-1 before:inset-x-0 ${textClass}`}
        style={{ height: ROW, paddingLeft: LEFT, paddingRight: 10, filter: EDGE, borderRadius: radius, touchAction: 'none', opacity: pillO }}
      >
        <span style={{ paddingRight: RIGHT - 10 }}>{options[value]}</span>
        <span className="absolute right-[9px] text-muted-foreground">
          <Updown />
        </span>
      </motion.button>

      <div aria-hidden className={`pointer-events-none invisible absolute left-0 top-0 ${textClass}`}>
        {options.map((o, i) => (
          <span
            key={o}
            ref={(el) => {
              probes.current[i] = el
            }}
            className="absolute whitespace-nowrap"
          >
            {o}
          </span>
        ))}
      </div>

      {shown &&
        createPortal(
          <motion.div className="pointer-events-none fixed z-50" style={{ left: spot.x, top: spot.y, x, y, width, height, opacity: fade }}>
            <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[0_18px_36px_-6px_rgb(0_0_0/0.22)]" style={{ opacity: open }} />
            <div className="absolute inset-0" style={{ filter: EDGE }}>
              <motion.div
                ref={sheet}
                role="listbox"
                data-slot="popup-content"
                aria-label={label}
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                className={`pointer-events-auto relative select-none bg-popover text-popover-foreground ${textClass}`}
                style={{ clipPath: clip, width, height, paddingTop: PAD, paddingBottom: PAD }}
              >
                {rows(false)}
                <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-popover-foreground text-popover" style={{ clipPath: window_, opacity: inverted, paddingTop: PAD }}>
                  {rows(true)}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>,
          document.body,
        )}
    </div>
  )
}

export default Popup
