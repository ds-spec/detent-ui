'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, animate, motion, useAnimationControls, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { Check } from '../../icons'
import { feedback } from '../../lib/detent'
import { tap } from '../../lib/feel'
import { ease, spring } from '../../lib/motion'
import { Button } from '../../ui/Button'
import { Bloom, DrawnCheck } from '../../ui/Outcome'
import { RollingText } from '../../ui/RollingText'

/** An amount the wheel clicks into, and what it's called there: "Minimum", "Statement balance". */
export type SettleStop = { amount: number; label: string }

/** What an amount means for the person paying it. `value` rolls when it changes ("$17.36"), `label` follows it ("interest"). */
export type SettleReading = { tone: 'warn' | 'ok'; label: string; value?: string }

/**
 * For demos, films and tests. `glide` turns the wheel to an amount on its own; `hold` puts it where a
 * hand dragging it would, and `release` lets go (stops catch it either way, silently). `reset` goes
 * back to the start, gliding when given a duration.
 */
export type SettleHandle = { glide(to: number, ms?: number): Promise<void>; hold(at: number): void; release(): void; pay(): Promise<void>; reset(ms?: number): Promise<void> }

// An open ring: 280° of track, with the gap at the bottom for the two ends' labels.
const S = 312
const C = S / 2
const R = 114
/** The groove; the paid band runs inside it, a little narrower, so the groove's edges show round it. */
const W = 24
const BAND = 20
const SWEEP = 280
const START = -SWEEP / 2
/** The tick rim sits just outside the track: a tick every 2°, longer at a stop, swelling round the knob. */
const RIM = R + W / 2 + 7
const TICK = 5
const STOP_TICK = 11
const SWELL = 5
const SWELL_SPAN = 16
const KNOB = 32
/** The halftone: a hex grid of dots in the groove, sized by what each amount would still cost you. */
const DOT = 1.8
const DOT_ROW = 4.4
const DOT_STEP = (((DOT_ROW * Math.sqrt(3)) / 2 / R) * 180) / Math.PI

/**
 * The detent. Within CAPTURE degrees a stop pulls the knob in and holds it there; the knob only
 * follows a GIVE share of your pull until you're RELEASE degrees away, then lets go all at once.
 * Coming back, it catches again at CAPTURE, so a stop never flickers in and out under your hand.
 */
const CAPTURE = 4.5
const RELEASE = 8
const GIVE = 0.14

const rad = (deg: number) => (deg * Math.PI) / 180
const r2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
/** Where a point `arc` degrees along the track lands, at radius `r`. */
const at = (arc: number, r: number) => {
  const a = rad(START + arc)
  return [r2(C + r * Math.sin(a)), r2(C - r * Math.cos(a))] as const
}
/** Past an end the knob gives a few degrees and no more, firmer the further you pull. */
const rub = (x: number) => 7 * (1 - Math.exp(-x / 20))

const [X0, Y0] = at(0, R)
const [X1, Y1] = at(SWEEP, R)
const TRACK = `M ${X0} ${Y0} A ${R} ${R} 0 1 1 ${X1} ${Y1}`
/** The track's length in px. The fill is one dash of it, followed by a gap longer than the track, so it never repeats. */
const LENGTH = R * rad(SWEEP)
const TICKS = SWEEP / 2 + 1

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Settle: how much to pay, chosen on a dial. What each amount would still cost you is printed in
 * the groove as a halftone, heavy at the minimum and thinning to nothing where it stops costing
 * anything. Turn the knob (or press anywhere on the dial) and a band of ink covers the dots: you
 * pay the cost off as you go. It clicks into the amounts that matter, like the minimum and the
 * statement balance, seats there against a little pull, and gives when you mean it.
 */
export function Settle({
  min,
  max,
  stops,
  defaultValue,
  onChange,
  onPay,
  describe,
  cost,
  title,
  subtitle,
  source,
  currency = 'USD',
  locale = 'en-US',
  ref,
}: {
  /** The least that can be paid; the wheel starts here. */
  min: number
  /** The most that can be paid; the wheel ends here. */
  max: number
  /** The amounts the wheel clicks into, lowest first. Stops at `min` and `max` name the ends. */
  stops: SettleStop[]
  /** Where the wheel starts. Defaults to the first stop. */
  defaultValue?: number
  /** Every new amount, as it changes. */
  onChange?: (amount: number) => void
  /** Pay. While it runs the button spins; when it resolves, the card shows it's paid. */
  onPay?: (amount: number) => Promise<void> | void
  /** What an amount means: the line in the middle of the dial. */
  describe: (amount: number) => SettleReading
  /** What paying this amount would still cost, e.g. next month's interest. Drawn as the halftone in the groove; leave it out for none. */
  cost?: (amount: number) => number
  /** The account being paid, e.g. "Juniper Card". */
  title: ReactNode
  /** A quiet line under it, e.g. the due date. */
  subtitle?: ReactNode
  /** Where the money comes from, e.g. "Checking ••4021". */
  source: ReactNode
  /** ISO currency code for every amount. */
  currency?: string
  locale?: string
  ref?: Ref<SettleHandle>
}) {
  const reduce = useReducedMotion()
  const uid = `settle${useId().replace(/[^\w-]/g, '')}`
  const fmt = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency }), [locale, currency])
  const span = max - min
  const angleOf = (v: number) => (clamp(v, min, max) - min) * (SWEEP / span)
  const stopAt = stops.map((s) => angleOf(s.amount))

  // The halftone, laid out once: alternate columns of four and three dots, each sized by its column's cost against the most it can be.
  const field = useMemo(() => {
    if (!cost) return []
    const top = Math.max(...Array.from({ length: 9 }, (_, i) => cost(min + (i / 8) * span)), 1e-9)
    const dots: { x: number; y: number; r: number }[] = []
    for (let col = 0, a = DOT_STEP / 2; a < SWEEP; col++, a += DOT_STEP) {
      const k = cost(min + a * (span / SWEEP)) / top
      if (k <= 0.004) continue
      for (const o of col % 2 ? [-DOT_ROW, 0, DOT_ROW] : [-1.5 * DOT_ROW, -0.5 * DOT_ROW, 0.5 * DOT_ROW, 1.5 * DOT_ROW]) {
        const [x, y] = at(a, R + o)
        dots.push({ x, y, r: r2(DOT * Math.sqrt(Math.min(1, k))) })
      }
    }
    return dots
  }, [cost, min, span])

  const first = clamp(defaultValue ?? stops[0]?.amount ?? min, min, max)
  const firstSeat = stops.findIndex((s) => s.amount === first)

  const [amount, setAmount] = useState(first)
  const [seated, setSeated] = useState<number | null>(firstSeat >= 0 ? firstSeat : null)
  const [dragging, setDragging] = useState(false)
  const [gliding, setGliding] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'paying' | 'paid'>('idle')
  const [bloom, setBloom] = useState<number | null>(null)
  const [paidKey, setPaidKey] = useState<number | null>(null)

  // The angle you're asking for, and the angle the knob shows after the detents have had their say.
  const raw = useRef(angleOf(first))
  const seat = useRef<number | null>(firstSeat >= 0 ? firstSeat : null)
  const amt = useRef(first)
  const held = useRef(false)
  const last = useRef(0)
  // The phase, for handlers that run between renders; every change goes through here and setPhase together.
  const phaseRef = useRef<'idle' | 'paying' | 'paid'>('idle')

  const target = useMotionValue(angleOf(first))
  // A slightly underdamped spring: the knob has weight while you drag, and drops into a stop with a tiny overshoot.
  const knob = useSpring(target, { stiffness: 900, damping: 34, mass: 0.5 })
  const fill = useTransform(knob, (a) => `${r2((clamp(a, 0, SWEEP) / SWEEP) * LENGTH)} ${r2(LENGTH + W * 2)}`)
  const kx = useTransform(knob, (a) => at(a, R)[0] - KNOB / 2)
  const ky = useTransform(knob, (a) => at(a, R)[1] - KNOB / 2)
  const turn = useTransform(knob, (a) => START + a)

  const svg = useRef<SVGSVGElement>(null)
  const knobEl = useRef<HTMLDivElement>(null)
  const ticks = useRef<(SVGLineElement | null)[]>([])
  const click = useAnimationControls()

  const reading = describe(amount)

  // The rim breathes round the knob: ticks near it grow and darken, the rest stay fine.
  const swell = (a: number) => {
    for (let i = 0; i < TICKS; i++) {
      const el = ticks.current[i]
      if (!el) continue
      const d = Math.abs(i * 2 - a)
      const k = reduce || d >= SWELL_SPAN ? 0 : Math.cos((Math.PI / 2) * (d / SWELL_SPAN)) ** 2
      el.setAttribute('y2', String(r2(C - RIM - TICK - SWELL * k)))
      el.setAttribute('stroke-opacity', String(r2((i * 2 <= a ? 0.3 : 0.14) + 0.34 * k)))
    }
  }
  useMotionValueEvent(knob, 'change', swell)
  useEffect(() => swell(knob.get()))

  const report = (v: number) => {
    if (v === amt.current) return
    amt.current = v
    setAmount(v)
    onChange?.(v)
  }

  const pace = useRef(1)
  const moved = useRef(0)
  const seatAt = (s: number | null, user: boolean) => {
    if (s === seat.current) return
    seat.current = s
    setSeated(s)
    if (s === null) return
    // The click: a sound and a tap of haptics for real hands only, and a small dip of the knob for everyone.
    if (user) {
      feedback.tick(false, pace.current)
      tap()
    }
    if (!reduce) click.start({ scale: [1, 0.88, 1], transition: { duration: 0.22, ease: ease.out } })
  }

  /** Ask for an angle; the stops decide where the knob actually goes. */
  const turnTo = (a: number, user: boolean) => {
    const want = clamp(a, -60, SWEEP + 60)
    raw.current = want
    let s = seat.current
    let show = want
    if (s !== null) {
      const A = stopAt[s]
      const d = want - A
      const outward = (A <= 0.001 && d < 0) || (A >= SWEEP - 0.001 && d > 0)
      if (outward) show = A + Math.sign(d) * rub(Math.abs(d))
      else if (Math.abs(d) < RELEASE) show = A + d * GIVE
      else s = null
    }
    if (s === null) {
      const near = stopAt.findIndex((A) => Math.abs(want - A) < CAPTURE)
      if (near >= 0) {
        s = near
        show = stopAt[near] + (want - stopAt[near]) * GIVE
      } else if (want < 0) show = -rub(-want)
      else if (want > SWEEP) show = SWEEP + rub(want - SWEEP)
    }
    seatAt(s, user)
    target.set(show)
    report(s !== null ? stops[s].amount : clamp(Math.round(min + clamp(show, 0, SWEEP) * (span / SWEEP)), min, max))
  }

  /** Let go: a held stop pulls the knob the rest of the way in, and a stretched end springs back. */
  const settle = () => {
    const s = seat.current
    const home = s !== null ? stopAt[s] : clamp(target.get(), 0, SWEEP)
    raw.current = home
    target.set(home)
  }

  /** Jump to an exact amount, as the keys do. */
  const setTo = (v: number, user: boolean) => {
    const next = clamp(Math.round(v * 100) / 100, min, max)
    const i = stops.findIndex((s) => s.amount === next)
    raw.current = angleOf(next)
    seatAt(i >= 0 ? i : null, user)
    if (reduce) knob.jump(angleOf(next))
    target.set(angleOf(next))
    report(next)
  }

  // Crossing into "costs nothing" is the one moment worth a beat of colour.
  const tone = useRef(reading.tone)
  useEffect(() => {
    if (tone.current === 'warn' && reading.tone === 'ok' && phase === 'idle') setBloom((k) => (k ?? 0) + 1)
    tone.current = reading.tone
  }, [reading.tone, phase])

  const pay = async () => {
    if (phaseRef.current !== 'idle') return
    phaseRef.current = 'paying'
    setPhase('paying')
    await (onPay ? onPay(amt.current) : wait(900))
    phaseRef.current = 'paid'
    setPhase('paid')
    setPaidKey((k) => (k ?? 0) + 1)
  }

  const glide = (to: number, ms = 1000) =>
    new Promise<void>((done) => {
      if (phaseRef.current !== 'idle') return done()
      setGliding(true)
      animate(raw.current, angleOf(to), {
        duration: reduce ? 0 : ms / 1000,
        ease: ease.inOut,
        onUpdate: (a) => turnTo(a, false),
        onComplete: () => {
          settle()
          setGliding(false)
          done()
        },
      })
    })

  useImperativeHandle(ref, () => ({
    glide,
    hold: (at) => {
      if (phaseRef.current !== 'idle') return
      if (!held.current) {
        held.current = true
        setDragging(true)
      }
      turnTo(min === max ? 0 : (at - min) * (SWEEP / span), false)
    },
    release: () => {
      held.current = false
      setDragging(false)
      settle()
    },
    pay,
    reset: async (ms) => {
      phaseRef.current = 'idle'
      setPhase('idle')
      if (ms) await glide(first, ms)
      else setTo(first, false)
    },
  }))

  // Pointer angle in degrees from the top, clockwise; measured against the drawn size, so a zoomed stage still lines up.
  const pointer = (e: PointerEvent) => {
    const b = svg.current!.getBoundingClientRect()
    const k = b.width / S
    const x = (e.clientX - b.left) / k - C
    const y = (e.clientY - b.top) / k - C
    return { deg: (Math.atan2(x, -y) * 180) / Math.PI, dist: Math.hypot(x, y) }
  }

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'idle' || e.button !== 0) return
    const p = pointer(e)
    const onKnob = !!(e.target as Element).closest('[data-knob]')
    if (!onKnob && (p.dist < R - W / 2 - 10 || p.dist > R + W / 2 + 20)) return
    e.preventDefault()
    feedback.wake(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    knobEl.current?.focus({ preventScroll: true })
    held.current = true
    setDragging(true)
    last.current = p.deg
    // Pressing the ring sends the knob there round the track; the gap splits at the bottom between the two ends.
    if (!onKnob) turnTo(clamp(p.deg - START, 0, SWEEP), true)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!held.current) return
    const p = pointer(e)
    let d = p.deg - last.current
    if (d > 180) d -= 360
    if (d < -180) d += 360
    last.current = p.deg
    // How fast the hand turned it, as a share of a turn a second, is how loud the stops click.
    pace.current = (Math.abs(d) / Math.max(1, e.timeStamp - moved.current)) * 2.8
    moved.current = e.timeStamp
    turnTo(raw.current + d, true)
  }
  const up = () => {
    if (!held.current) return
    held.current = false
    setDragging(false)
    settle()
  }

  const key = (e: KeyboardEvent) => {
    if (phaseRef.current !== 'idle') return
    feedback.wake()
    pace.current = 1
    const cur = amt.current
    const step = e.shiftKey ? 10 : 1
    const amounts = stops.map((s) => s.amount)
    let next: number | null = null
    let arrow = false
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      next = cur + (e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step : -step)
      arrow = true
    } else if (e.key === 'PageUp') next = amounts.find((a) => a > cur) ?? max
    else if (e.key === 'PageDown') next = [...amounts].reverse().find((a) => a < cur) ?? min
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    else if (e.key === 'Enter') {
      e.preventDefault()
      pay()
      return
    }
    if (next === null) return
    e.preventDefault()
    // A stop in the way holds a key press too: the arrows stop on it before they carry on past.
    if (arrow) {
      const n = next
      const crossed = amounts.find((a) => (a > cur && a < n) || (a < cur && a > n))
      if (crossed !== undefined) next = crossed
    }
    setTo(next, true)
  }

  const parts = fmt.formatToParts(amount)
  const cents = parts.filter((p) => p.type === 'decimal' || p.type === 'fraction').map((p) => p.value).join('')
  const whole = parts.filter((p) => p.type !== 'decimal' && p.type !== 'fraction').map((p) => p.value).join('')
  const arc = angleOf(amount)
  // While a hand (or a glide) turns the wheel the numbers follow it frame by frame; they roll only when they step.
  const live = dragging || gliding
  const caption = phase === 'paid' ? 'Paid today' : seated !== null ? stops[seated].label : 'Payment'
  const ends = [stops.find((s) => s.amount === min), stops.find((s) => s.amount === max)]

  return (
    <div className="w-[380px] max-w-full select-none rounded-[28px] bg-surface p-6 shadow-raised">
      <div className="flex items-center gap-3">
        <CardFace />
        <div className="min-w-0">
          <p className="truncate text-headline text-ink">{title}</p>
          {subtitle && <p className="truncate text-footnote text-ink-3">{subtitle}</p>}
        </div>
      </div>

      <div className="relative mx-auto mt-3 touch-none" style={{ width: S, height: S }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <svg ref={svg} width={S} height={S} className="absolute inset-0 overflow-visible" aria-hidden>
          {Array.from({ length: TICKS }, (_, i) => (
            <line
              key={i}
              ref={(el) => {
                ticks.current[i] = el
              }}
              x1={C}
              x2={C}
              y1={C - RIM}
              y2={C - RIM - TICK}
              stroke="var(--ink)"
              strokeOpacity={0.16}
              strokeWidth={1}
              strokeLinecap="round"
              transform={`rotate(${START + i * 2} ${C} ${C})`}
            />
          ))}
          {stopAt.map((A, i) => (
            <line
              key={i}
              x1={C}
              x2={C}
              y1={C - RIM + 1}
              y2={C - RIM - STOP_TICK}
              stroke="var(--ink)"
              strokeOpacity={seated === i ? 0.9 : 0.42}
              strokeWidth={2}
              strokeLinecap="round"
              transform={`rotate(${r2(START + A)} ${C} ${C})`}
              style={{ transition: 'stroke-opacity 200ms ease-out' }}
            />
          ))}
          {/* The groove: a soft channel with a hairline at each edge, so it reads as cut into the card. */}
          <path d={TRACK} fill="none" stroke="color-mix(in oklch, var(--ink) 5%, transparent)" strokeWidth={W} strokeLinecap="round" />
          <path d={TRACK} fill="none" stroke="color-mix(in oklch, var(--ink) 9%, transparent)" strokeWidth={W} strokeLinecap="round" mask={`url(#${uid}-edge)`} />
          <defs>
            <mask id={`${uid}-edge`} maskUnits="userSpaceOnUse" x={0} y={0} width={S} height={S}>
              <path d={TRACK} fill="none" stroke="#fff" strokeWidth={W} strokeLinecap="round" />
              <path d={TRACK} fill="none" stroke="#000" strokeWidth={W - 2} strokeLinecap="round" />
            </mask>
          </defs>
          <g fill="var(--warn)">
            {field.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} />
            ))}
          </g>
          <motion.path d={TRACK} fill="none" strokeWidth={BAND} strokeLinecap="round" stroke="color-mix(in oklch, var(--ink) 92%, var(--surface))" style={{ strokeDasharray: fill }} />
          {/* A notch cut across the groove at each stop between the ends: light where the band has covered it, and green once it's the amount that stops costing anything. */}
          {stopAt.map((A, i) => {
            if (A <= 0.001 || A >= SWEEP - 0.001) return null
            const [x1, y1] = at(A, R - W / 2 + 3)
            const [x2, y2] = at(A, R + W / 2 - 3)
            const covered = A <= arc + 0.01
            const free = covered && describe(stops[i].amount).tone === 'ok'
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={2}
                strokeLinecap="round"
                stroke={free ? 'var(--ok)' : covered ? 'color-mix(in oklch, var(--surface) 75%, transparent)' : 'color-mix(in oklch, var(--ink) 24%, transparent)'}
                className="[transition:stroke_240ms_ease-out]"
              />
            )
          })}
          {/* The ring's whole width takes presses, a little wider than it looks. */}
          <path d={TRACK} fill="none" stroke="transparent" strokeWidth={W + 18} strokeLinecap="round" pointerEvents={phase === 'idle' ? 'stroke' : 'none'} className="cursor-pointer" />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-1">
          <Slot text={caption} />
          <p className="mt-1 flex items-start text-ink">
            <span className="text-[44px] font-semibold leading-none tracking-[-0.045em]">
              <Num text={whole} live={live} proportional />
            </span>
            <span className="ml-[3px] mt-[6px] text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink-3">
              <Num text={cents} live={live} proportional />
            </span>
          </p>
          <Chip reading={reading} live={live} />
        </div>

        {ends.map((stop, i) => {
          if (!stop) return null
          const [x, y] = at(i === 0 ? 0 : SWEEP, R)
          return (
            <div key={i} className="pointer-events-none absolute flex w-24 -translate-x-1/2 flex-col items-center text-center" style={{ left: x, top: y + W / 2 + 10 }}>
              <span className="text-caption text-ink-3">{stop.label}</span>
              <span className="tnum text-footnote font-medium text-ink-2">{fmt.format(stop.amount)}</span>
            </div>
          )
        })}

        <motion.div
          ref={knobEl}
          data-knob
          role="slider"
          tabIndex={phase === 'idle' ? 0 : -1}
          aria-label="Amount to pay"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={amount}
          aria-valuetext={`${fmt.format(amount)}${seated !== null ? `, ${stops[seated].label}` : ''}, ${reading.value ? `${reading.value} ` : ''}${reading.label}`}
          onKeyDown={key}
          className={`ring-focus absolute left-0 top-0 rounded-full ${phase === 'idle' ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          style={{ x: kx, y: ky, width: KNOB, height: KNOB }}
          initial={false}
          // Lifted while it's turned, seated a little lower when it's resting in a stop.
          animate={{ scale: dragging ? 1.1 : seated !== null ? 0.94 : 1 }}
          transition={spring.snappy}
        >
          <motion.div animate={click} className="relative size-full rounded-full">
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              initial={false}
              animate={{
                boxShadow: dragging
                  ? '0 0 0 1px rgb(0 0 0 / 0.1), 0 2px 4px rgb(0 0 0 / 0.12), 0 10px 22px -6px rgb(0 0 0 / 0.32)'
                  : seated !== null
                    ? '0 0 0 1px rgb(0 0 0 / 0.12), 0 1px 1.5px rgb(0 0 0 / 0.18), 0 2px 5px -2px rgb(0 0 0 / 0.2)'
                    : '0 0 0 1px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.14), 0 4px 10px -3px rgb(0 0 0 / 0.22)',
              }}
              transition={{ duration: 0.18 }}
            />
            {/* The index mark: always pointing out at the rim, like the line on a machined knob. */}
            <motion.div className="absolute inset-0" style={{ rotate: turn }}>
              <span className="absolute left-1/2 top-[5px] h-2 w-[2px] -translate-x-1/2 rounded-full bg-[#a1a1aa]" />
            </motion.div>
            <Bloom k={bloom} color="var(--ok)" radius="50%" spread={14} />
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="min-w-0">
          <p className="text-caption text-ink-3">From</p>
          <p className="truncate text-callout font-medium text-ink">{source}</p>
        </div>
        <span className="relative rounded-full">
          <Button
            variant="primary"
            size="lg"
            className="w-[168px] !rounded-full"
            loading={phase === 'paying'}
            done={
              phase === 'paid' ? (
                <>
                  <DrawnCheck size={15} />
                  Paid
                </>
              ) : undefined
            }
            onClick={pay}
          >
            Pay <Num text={fmt.format(amount)} live={live} />
          </Button>
          <Bloom k={paidKey} color="var(--ok)" radius={999} spread={10} />
        </span>
      </div>
    </div>
  )
}

/**
 * Figures that roll like an odometer when they step (a key press), and simply follow while the dial
 * is turning, because a roll that never catches up is unreadable.
 */
function Num({ text, live, proportional = false }: { text: string; live: boolean; proportional?: boolean }) {
  return <RollingText text={text} still={live} proportional={proportional} />
}

/** One line of text that rolls when it's replaced; both lines sit centred in the same fixed slot. */
function Slot({ text }: { text: string }) {
  return (
    <span className="relative block h-4 w-[180px] overflow-hidden text-caption text-ink-3">
      <AnimatePresence initial={false}>
        <motion.span
          key={text}
          className="absolute inset-0 whitespace-nowrap text-center"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0, transition: { duration: 0.14, ease: ease.out } }}
          transition={spring.snappy}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** The verdict under the amount. Its width springs to fit what it says; what it says crossfades in place. */
function Chip({ reading, live }: { reading: SettleReading; live: boolean }) {
  const probe = useRef<HTMLSpanElement>(null)
  const w = useMotionValue<number | string>('auto')
  const placed = useRef(false)
  useLayoutEffect(() => {
    const el = probe.current
    if (!el) return
    const read = () => {
      const next = el.offsetWidth
      if (!placed.current) {
        placed.current = true
        w.set(next)
      } else animate(w, next, spring.smooth)
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])

  const ok = reading.tone === 'ok'
  const color = ok ? 'color-mix(in oklch, var(--ok) 72%, var(--ink))' : 'var(--warn-ink)'
  const body = (
    <>
      {ok && <Check size={12} strokeWidth={2.8} />}
      {reading.value && <Num text={reading.value} live={live} />}
      {reading.label}
    </>
  )
  return (
    <motion.span
      className="relative mt-3 block h-6 overflow-hidden rounded-full"
      style={{ width: w, background: `color-mix(in oklch, ${ok ? 'var(--ok)' : 'var(--warn)'} 15%, transparent)`, transition: 'background-color 320ms ease-out' }}
    >
      <span ref={probe} aria-hidden className="invisible absolute left-0 top-0 flex h-6 w-max items-center gap-1 whitespace-nowrap px-2.5 text-footnote font-medium">
        {body}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={`${reading.tone}:${reading.label}`}
          className="absolute inset-0 flex items-center justify-center gap-1 whitespace-nowrap text-footnote font-medium"
          style={{ color }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.12, ease: ease.out } }}
          transition={spring.snappy}
        >
          {body}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

/** The card being paid, small: graphite with a chip, catching a little light. */
function CardFace() {
  return (
    <span
      aria-hidden
      className="relative h-[26px] w-[40px] shrink-0 overflow-hidden rounded-[6px]"
      style={{ background: 'linear-gradient(135deg, #4a4a52 0%, #26262b 55%, #1b1b1f 100%)', boxShadow: 'inset 0 0.5px 0 rgb(255 255 255 / 0.25), 0 1px 2px rgb(0 0 0 / 0.2)' }}
    >
      <span className="absolute left-[6px] top-[8px] h-[7px] w-[9px] rounded-[2px]" style={{ background: 'linear-gradient(135deg, #e9e9ee, #a9a9b2)' }} />
      <span className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.14) 50%, transparent 60%)' }} />
    </span>
  )
}
