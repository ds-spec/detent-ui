'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, ChevronDown } from '@/lab/icons'
import { at, clamp, dragProps, glide, stepKey, useDetent, write } from '@/lab/lib/detent'
import { ease, spring, press } from '@/lab/lib/motion'

export type Model = {
  id: string
  name: string
  /** What it's for, in a few words. */
  blurb: string
  /** Seconds for a typical reply at medium effort. */
  time: number
  /** Dollars for a typical reply at medium effort. */
  cost: number
  /** False if effort makes no difference to this model. */
  reasons?: boolean
}
export type Effort = { label: string; time: number; cost: number }
export type ModelValue = { model: string; effort: number }
export type PickerHandle = { open(): void; close(): void; effort(i: number): void; choose(id: string): void }

const EFFORTS: Effort[] = [
  { label: 'Low', time: 0.5, cost: 0.55 },
  { label: 'Medium', time: 1, cost: 1 },
  { label: 'High', time: 2, cost: 1.9 },
  { label: 'Max', time: 3.5, cost: 3.4 },
]
const secs = (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n)}s`
const price = (n: number) => (n < 1 ? `${(n * 100).toFixed(1)}¢` : `$${n.toFixed(2)}`)

/**
 * Choosing a model, and how hard it should think.
 *
 * Effort is a real detent: drag or flick the plate along Low, Medium, High and Max and it catches in
 * each notch, while the time and cost on every row run continuously with your finger, so you feel
 * what thinking harder costs on each model before you choose. One soft plate marks the model in use.
 */
export function ModelPicker({ models, value, onChange, efforts = EFFORTS, defaultOpen = false, lift = 10, muted, ref }: {
  /** The models to choose from. */
  models: Model[]
  /** The model and effort in use. */
  value: ModelValue
  /** Called when either changes. */
  onChange: (v: ModelValue) => void
  /** The effort levels, with what each does to time and cost. */
  efforts?: Effort[]
  /** Start with the menu open. */
  defaultOpen?: boolean
  /** How far above the trigger the menu sits, in px, to clear a composer. */
  lift?: number
  /** Silence the soft tick effort makes as it catches a notch. */
  muted?: boolean
  ref?: Ref<PickerHandle>
}) {
  const uid = useId()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(defaultOpen)
  const [cursor, setCursor] = useState(-1)
  const box = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const current = models.find((m) => m.id === value.model) ?? models[0]
  const ofEffort = (m: Model) => (m.reasons === false ? efforts[1] ?? efforts[0] : efforts[value.effort])
  const say = (v: ModelValue) => onChange(v)

  // The dial: everything below is written straight from it, never through React.
  const n = efforts.length
  const stops = useRef(Array.from({ length: n }, (_, i) => i))
  if (stops.current.length !== n) stops.current = Array.from({ length: n }, (_, i) => i)
  const [first] = useState(value.effort)
  const plate = useRef<HTMLSpanElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const names = useRef<(HTMLSpanElement | null)[]>([])
  const figures = useRef<{ time: HTMLElement | null; cost: HTMLElement | null }[]>([])
  const latest = useRef({ value, models, efforts, onChange })
  useLayoutEffect(() => {
    latest.current = { value, models, efforts, onChange }
  })
  // What we last told the parent, so its answer coming back isn't taken for a new instruction.
  const told = useRef(value.effort)
  const byHand = useRef(false)
  const tell = (i: number) => {
    if (i === told.current) return
    told.current = i
    latest.current.onChange({ ...latest.current.value, effort: i })
  }
  const paint = (x: number, v = 0) => {
    const { models, efforts } = latest.current
    const e = clamp(x, 0, efforts.length - 1)
    // The plate runs a little long at speed and comes back as it arrives. Past an end it stays
    // inside the track, pressed against the wall and giving, rather than poking out.
    if (plate.current) {
      const over = x - e
      const stretch = Math.min(0.12, Math.abs(v) * 0.022, 2 * Math.min(e, efforts.length - 1 - e))
      plate.current.style.transformOrigin = over > 0 ? '100% 50%' : over < 0 ? '0% 50%' : '50% 50%'
      plate.current.style.transform = `translate3d(${e * 100}%,0,0) scaleX(${1 + stretch - Math.min(0.16, Math.abs(over) * 0.6)})`
    }
    names.current.forEach((el, i) => {
      if (el) el.style.opacity = String(0.56 + 0.44 * clamp(1 - Math.abs(x - i), 0, 1))
    })
    const time = at(efforts.map((f) => f.time), e, glide)
    const cost = at(efforts.map((f) => f.cost), e, glide)
    models.forEach((m, k) => {
      if (m.reasons === false) return
      write(figures.current[k]?.time as HTMLElement, secs(m.time * time))
      write(figures.current[k]?.cost as HTMLElement, price(m.cost * cost))
    })
  }
  const dial = useDetent({
    value: value.effort,
    stops: stops.current,
    magnet: 0.42,
    reach: 0.08,
    throw: 0.14,
    spring: { w: 19, z: 0.86 },
    muted,
    onFrame: (x, v) => paint(x, v),
    onStop: (i) => byHand.current && tell(i),
    onRest: (_, i) => {
      if (byHand.current) tell(i)
      byHand.current = false
    },
  })
  useEffect(() => {
    if (value.effort === told.current || dial.mode() === 'held') return
    told.current = value.effort
    dial.to(value.effort)
  }, [value.effort, dial])
  // The panel comes and goes; whatever it opens on is painted before it's seen.
  useLayoutEffect(() => {
    if (open) paint(dial.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, models, efforts])
  const [drag] = useState(() =>
    dragProps(dial, () => ({
      box: () => track.current,
      units: latest.current.efforts.length,
      muted,
      onGrab: () => (byHand.current = true),
      onTap: (f) => {
        const i = clamp(Math.floor(f * latest.current.efforts.length), 0, latest.current.efforts.length - 1)
        byHand.current = false
        dial.to(i, { feel: true })
        tell(i)
      },
    })),
  )

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    effort: (i) => say({ ...value, effort: i }),
    choose: (id) => say({ ...value, model: id }),
  }))

  useEffect(() => {
    if (!open) return
    const away = (e: globalThis.PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setCursor((c) => (c + 1) % models.length)
    else if (e.key === 'ArrowUp') setCursor((c) => (c <= 0 ? models.length : c) - 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      stepKey(dial, e)
      tell(dial.target())
    } else if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'Enter' && cursor >= 0) {
      say({ ...value, model: models[cursor].id })
      setOpen(false)
    } else return
    e.preventDefault()
  }
  return (
    <div ref={box} className="relative inline-flex" onKeyDown={onKey}>
      <motion.button whileTap={press} type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((o) => !o)} className="ring-focus flex h-8 items-center gap-1.5 rounded-full bg-surface-2 pl-3 pr-2 text-[13px] text-ink transition-colors hover:bg-[color-mix(in_oklch,var(--ink)_9%,transparent)]">
        {current.name}
        {current.reasons !== false && <span className="text-ink-3">{efforts[value.effort].label}</span>}
        <ChevronDown size={14} className={`text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            style={{ bottom: `calc(100% + ${lift}px)` }}
            className="absolute left-0 z-20 w-[444px] max-w-[calc(100vw-64px)] rounded-[20px] bg-surface p-2 shadow-float"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: ease.out }}
          >
            <div className="flex items-center gap-3 pb-2 pl-3">
              <span className="text-[13px] text-ink-3">Effort</span>
              {/* The track is the dial: grab it anywhere. A tap still lands on the level under it. */}
              <div ref={track} {...drag} className="relative grid min-w-0 flex-1 cursor-grab touch-pan-y select-none rounded-full bg-surface-2 p-0.5 active:cursor-grabbing" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                <span ref={plate} aria-hidden className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-full bg-surface shadow-[0_0_0_1px_var(--line),0_1px_3px_rgb(0_0_0/0.08)] will-change-transform dark:bg-[#2c2c2e]" style={{ width: `calc((100% - 4px) / ${n})`, transform: `translate3d(${first * 100}%,0,0)` }} />
                {efforts.map((e, i) => (
                  <button key={e.label} type="button" aria-pressed={i === value.effort} onClick={() => dial.mode() === 'rest' && dial.target() !== i && (dial.to(i), tell(i))} className="ring-focus relative h-9 cursor-[inherit] rounded-full text-[13px] text-ink">
                    <span
                      ref={(el) => {
                        names.current[i] = el
                      }}
                      className="relative"
                      style={{ opacity: i === first ? 1 : 0.56 }}
                    >
                      {e.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div role="listbox" aria-label="Model" className="flex flex-col">
              {models.map((m, k) => {
                const on = m.id === current.id
                const e = ofEffort(m)
                const time = m.time * e.time
                const cost = m.cost * e.cost
                // These two only ever set the first frame; the dial writes every one after it.
                const from = m.reasons === false ? e : efforts[first]
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    aria-label={`${m.name}, ${m.blurb}, about ${secs(time)} and ${price(cost)} a reply`}
                    onClick={() => {
                      say({ ...value, model: m.id })
                      setOpen(false)
                    }}
                    onPointerEnter={() => setCursor(k)}
                    onPointerLeave={() => setCursor(-1)}
                    className="ring-focus relative flex h-[60px] w-full items-center gap-3 rounded-[14px] px-3 text-left"
                  >
                    {/* Every plate is the row's full width: hover is a tint, the model in use one soft plate that glides. */}
                    {k === cursor && !on && <span aria-hidden className="absolute inset-0 rounded-[14px] bg-[color-mix(in_oklch,var(--ink)_4%,transparent)]" />}
                    {on && <motion.span aria-hidden layoutId={`${uid}model`} transition={reduce ? { duration: 0 } : spring.smooth} className="absolute inset-0 rounded-[14px] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] dark:bg-[color-mix(in_oklch,var(--accent)_20%,transparent)]" />}
                    <span className="relative min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[15px] leading-[21px] text-ink">
                        {m.name}
                        {on && <Check size={14} className="text-[var(--accent-ink)] dark:text-[var(--accent)]" />}
                      </span>
                      <span className="block truncate text-[13px] leading-[18px] text-ink-3">{m.blurb}</span>
                    </span>
                    {/* Two fixed columns, so the figures line up down the list and never push each other. */}
                    <span aria-hidden className="tnum relative flex shrink-0 gap-3 text-[13px] text-ink-2">
                      <span
                        ref={(el) => {
                          ;(figures.current[k] ??= { time: null, cost: null }).time = el
                        }}
                        className="w-[4.5ch] text-right [contain:layout_paint]"
                      >
                        {secs(m.time * from.time)}
                      </span>
                      <span
                        ref={(el) => {
                          ;(figures.current[k] ??= { time: null, cost: null }).cost = el
                        }}
                        className="w-[6ch] text-right text-ink-3 [contain:layout_paint]"
                      >
                        {price(m.cost * from.cost)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
