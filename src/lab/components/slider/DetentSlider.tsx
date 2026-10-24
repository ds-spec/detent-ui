'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, Ref } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react'
import { tap } from '../../lib/feel'
import { useSize } from '../../lib/hooks'
import { ease, spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'

/** A value the slider catches on, with an optional name for the stretch around it. */
export type Detent = { value: number; label?: string; recommended?: boolean }
/** For demos and tests: slide to a value as a hand would, catching on detents on the way. */
export type DetentSliderHandle = { glide(to: number, ms?: number): Promise<void> }

/** How far either side of the thumb the ticks rise, in px. */
const SWELL = 46

/**
 * A slider on a ruler, with detents: values it catches on, like a dial clicking into its notches.
 * Fine ticks run the length of it, inked up to the value and rising as the thumb passes, so you
 * can see where you are without a track. Drag near a detent and the value sits on it, with a
 * click, until you pull clearly past; let go close to one and it settles there. Each detent can
 * name the stretch around it, the one you're in reads in ink, and the recommended one carries a
 * dot. The value rolls in large type above it, and the thumb lifts a little while you hold it.
 *
 * The arrow keys step, Shift and an arrow jumps to the next detent, and Home and End go to the ends.
 */
export function DetentSlider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  ticks = 41,
  detents = [],
  label,
  format = (v) => v.toFixed(2),
  unit,
  snap = 9,
  onDetent,
  ref,
}: {
  /** The current value. */
  value: number
  /** Called as the value changes, on the step and on detents. */
  onChange: (v: number) => void
  min?: number
  max?: number
  /** The smallest change, by drag or by arrow key. */
  step?: number
  /** How many ticks the ruler has, ends included. */
  ticks?: number
  /** The values it catches on, with names for the stretches between. */
  detents?: Detent[]
  /** What it sets, above the value. */
  label: string
  /** The value as text. */
  format?: (v: number) => string
  /** Shown after the value, in grey: a unit or the range, e.g. "/ 2". */
  unit?: string
  /** How close to a detent, in px, before the value catches on it. */
  snap?: number
  /** Called when the value lands on a detent. */
  onDetent?: (d: Detent) => void
  ref?: Ref<DetentSliderHandle>
}) {
  const ruler = useRef<HTMLDivElement>(null)
  const { w } = useSize(ruler)
  const reduce = useReducedMotion()
  const id = useId()
  const span = max - min
  const fracOf = (v: number) => (v - min) / span
  const f = useMotionValue(fracOf(value))
  const thumb = useTransform(f, (v) => `${v * 100}%`)
  const marks = useRef<(HTMLSpanElement | null)[]>([])
  const [held, setHeld] = useState(false)
  // While a hand is on it: the detent it's caught on, if any.
  const drag = useRef<{ caught: number | null } | null>(null)

  // The ruler: minor ticks, minus any that would sit on a detent, then the detents themselves.
  const minors = Array.from({ length: ticks }, (_, i) => i / (ticks - 1)).filter((t) => !detents.some((d) => Math.abs(fracOf(d.value) - t) < 0.5 / (ticks - 1)))
  const all = [...minors.map((t) => ({ t, major: false })), ...detents.map((d) => ({ t: fracOf(d.value), major: true }))]

  const paint = (fv: number) => {
    all.forEach(({ t, major }, i) => {
      const el = marks.current[i]
      if (!el) return
      const rise = Math.max(0, 1 - (Math.abs(t - fv) * (w || 300)) / SWELL)
      el.style.height = `${(major ? 18 : 10) + rise * rise * 12}px`
      el.style.opacity = t <= fv + 1e-6 ? '1' : major ? '0.4' : '0.18'
    })
  }
  useMotionValueEvent(f, 'change', paint)
  useEffect(() => paint(f.get()))

  // Follow the value when it changes from outside; while a hand is on it, the hand leads.
  useEffect(() => {
    if (drag.current) return
    const c = animate(f, fracOf(value), reduce ? { duration: 0 } : spring.snappy)
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce])

  const quantize = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min))
  /** The detent within `px` of a fraction along the ruler, if there is one. */
  const near = (t: number, px: number) => detents.find((d) => Math.abs(fracOf(d.value) - t) * (w || 300) < px)

  /** Where the hand is, as a fraction: catch on a detent if it's close, otherwise follow on the step. */
  const follow = (t: number) => {
    const d = drag.current
    const hit = near(t, snap)
    let v = hit ? hit.value : quantize(min + Math.min(1, Math.max(0, t)) * span)
    if (hit && d && d.caught !== hit.value) {
      d.caught = hit.value
      tap()
      onDetent?.(hit)
    } else if (!hit && d) {
      d.caught = null
    }
    if (!hit) v = Number(v.toFixed(6))
    f.set(fracOf(v))
    if (v !== value) onChange(v)
  }

  const fractionAt = (x: number) => {
    const r = ruler.current!.getBoundingClientRect()
    return (x - r.left) / r.width
  }
  const down = (e: PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    ;(e.currentTarget as HTMLElement).focus({ preventScroll: true })
    drag.current = { caught: null }
    setHeld(true)
    follow(fractionAt(e.clientX))
  }
  const move = (e: PointerEvent) => drag.current && follow(fractionAt(e.clientX))
  const up = () => {
    if (!drag.current) return
    drag.current = null
    setHeld(false)
    // Let go close to a detent and it settles there.
    const hit = near(f.get(), snap * 2.2)
    if (hit && hit.value !== value) {
      tap()
      onChange(hit.value)
      onDetent?.(hit)
    }
  }

  const sorted = [...detents].sort((a, b) => a.value - b.value)
  const key = (e: KeyboardEvent) => {
    let v: number | undefined
    const big = step * 10
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = e.shiftKey ? sorted.find((d) => d.value > value + 1e-9)?.value ?? max : value + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = e.shiftKey ? [...sorted].reverse().find((d) => d.value < value - 1e-9)?.value ?? min : value - step
    else if (e.key === 'PageUp') v = value + big
    else if (e.key === 'PageDown') v = value - big
    else if (e.key === 'Home') v = min
    else if (e.key === 'End') v = max
    if (v === undefined) return
    e.preventDefault()
    const next = Number(quantize(v).toFixed(6))
    const hit = detents.find((d) => Math.abs(d.value - next) < step / 2)
    if (hit) {
      tap()
      onDetent?.(hit)
    }
    onChange(hit ? hit.value : next)
  }

  useImperativeHandle(ref, () => ({
    glide: (to, ms = 1100) => {
      drag.current = { caught: null }
      setHeld(true)
      const from = f.get()
      return new Promise<void>((resolve) => {
        const p = { t: 0 }
        animate(p, { t: 1 }, {
          duration: ms / 1000,
          ease: ease.inOut,
          onUpdate: () => follow(from + (fracOf(to) - from) * p.t),
          onComplete: () => {
            up()
            resolve()
          },
        })
      })
    },
  }))

  // The stretch the value is in: the detent it's nearest.
  const zone = sorted.reduce<Detent | null>((best, d) => (!best || Math.abs(d.value - value) < Math.abs(best.value - value) ? d : best), null)
  const text = format(value)
  return (
    <div className="w-full select-none">
      <div className="flex items-end justify-between">
        <div>
          <p id={`${id}-label`} className="text-footnote text-ink-3">
            {label}
          </p>
          <p className="mt-0.5 flex items-center gap-[0.28em] text-large font-medium tracking-[-0.02em] text-ink">
            <RollingText text={text} />
            {unit && <span className="leading-[1.25em] text-ink-3">{unit}</span>}
          </p>
        </div>
      </div>

      {/* The ruler: ticks inked up to the value, rising as the thumb passes. */}
      <div
        ref={ruler}
        role="slider"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={zone?.label ? `${text}, ${zone.label}` : text}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        className="ring-focus relative mt-4 h-11 cursor-pointer touch-none rounded-[6px] outline-none"
      >
        {all.map(({ t, major }, i) => (
          <span
            key={i}
            ref={(el) => {
              marks.current[i] = el
            }}
            aria-hidden
            className="absolute top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `calc(${t * 100}% - 1px)`, height: major ? 18 : 10, opacity: major ? 0.4 : 0.18 }}
          />
        ))}
        {/* The thumb: a slim ink bar, ringed in the surface so it stands clear of the ticks. */}
        <motion.span aria-hidden className="absolute top-1/2 -ml-[2px] block h-9 w-1 -translate-y-1/2 rounded-full bg-ink shadow-[0_0_0_3px_var(--surface)]" style={{ left: thumb }} animate={{ scaleY: held ? 1.1 : 1 }} transition={spring.snappy} />
      </div>

      {/* Each detent's name under it; the stretch you're in reads in ink. */}
      {sorted.some((d) => d.label) && (
        <div className="relative mt-1.5 h-5 text-footnote">
          {sorted.map((d, i) =>
            d.label ? (
              <span
                key={d.value}
                className={`absolute top-0 flex items-center gap-1.5 whitespace-nowrap transition-colors duration-200 ${zone === d ? 'text-ink' : 'text-ink-3'}`}
                style={{ left: `${fracOf(d.value) * 100}%`, transform: `translateX(${i === 0 && fracOf(d.value) < 0.12 ? '0' : i === sorted.length - 1 && fracOf(d.value) > 0.88 ? '-100%' : '-50%'})` }}
              >
                {d.recommended && <span className="size-1.5 rounded-full bg-accent" />}
                {d.label}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
