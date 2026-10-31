'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'
import { Layer, fill, frameOf, inFrame, place, useDismiss, useHost, useReposition } from '@/lab/lib/layer'
import { ease, spring } from '@/lab/lib/motion'

/*
 * A time you can say. Type "3p", "1530", "9:45a" or "noon" and the field reads it on every key,
 * showing what it understood before you commit; a bare "3" means the afternoon, the way people
 * mean it. Or open the list and point, or step with the arrow keys. The small clock in the field
 * turns its hands to the time, always the short way round.
 *
 * As a range, the end list counts from the start: each time says how long the meeting would be,
 * and moving the start carries the end along so the length holds. The same moment can be shown
 * in other time zones underneath, for the people on the other end of the call.
 */

/** Minutes since midnight. */
export type Minutes = number
export type TimeHandle = {
  open(which: Which): void
  close(): void
  /** Types into a field without taking focus, as a person would. */
  type(which: Which, text: string): void
  /** Commits what's typed, or the pointed-at time when the list is open. */
  commit(which: Which): void
  /** Points at the list's n-th time from the current one. */
  point(steps: number): void
  /** Steps a field by its interval, as the arrow keys do. */
  nudge(which: Which, steps: number): void
}
type Which = 'start' | 'end'

const ROW = 36
const ROWS = 7
const DAY = 1440

const mod = (n: number, m: number) => ((n % m) + m) % m

/** "9:30 AM", or "09:30" on a 24-hour clock. */
export function formatTime(min: Minutes, hour12 = true) {
  const t = mod(Math.round(min), DAY)
  const h = Math.floor(t / 60)
  const m = String(t % 60).padStart(2, '0')
  if (!hour12) return `${String(h).padStart(2, '0')}:${m}`
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

/** "45 min", "1 hr", "2 hr 15 min". */
export function formatLength(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} hr ${m} min` : `${h} hr`
}

/**
 * Reads a typed time: "3", "3p", "3:15pm", "315", "1530", "15:30", "noon", "midnight". A time
 * without am or pm is read the way people say it: 1 to 6 is the afternoon, 7 to 11 the morning.
 * With `after`, it's the first reading later than that, so an end time lands after its start.
 */
export function parseTime(text: string, after?: Minutes): Minutes | null {
  const t = text.trim().toLowerCase().replace(/\s+|\./g, '')
  if (!t) return null
  if (t === 'noon' || t === 'midday') return 720
  if (t === 'midnight') return 0
  const m = t.match(/^(\d{1,4})(?::(\d{0,2}))?(a|am|p|pm)?$/)
  if (!m) return null
  let h: number
  let min: number
  if (m[2] !== undefined) {
    h = Number(m[1])
    // A minute being typed: "3:1" is on its way to 3:10.
    min = m[2] === '' ? 0 : Number(m[2].padEnd(2, '0'))
  } else if (m[1].length <= 2) {
    h = Number(m[1])
    min = 0
  } else {
    h = Number(m[1].slice(0, -2))
    min = Number(m[1].slice(-2))
  }
  if (h > 23 || min > 59) return null
  const half = m[3]?.[0]
  if (half) {
    if (h < 1 || h > 12) return null
    return ((h % 12) + (half === 'p' ? 12 : 0)) * 60 + min
  }
  if (h === 0 || h > 12) return h * 60 + min
  const am = (h % 12) * 60 + min
  const pm = am + 720
  if (after !== undefined) return [am, pm, am + DAY, pm + DAY].find((x) => x > after)! % DAY
  return h >= 1 && h <= 6 ? pm : h === 12 ? 720 + min : am
}

/** The same moment, today, as it reads in another zone: "11:30 PM". */
function inZone(min: Minutes, zone: string) {
  const d = new Date()
  d.setHours(Math.floor(min / 60), min % 60, 0, 0)
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(d)
}
const cityOf = (zone: string) => zone.split('/').pop()!.replace(/_/g, ' ')

export function TimePicker({
  defaultValue = 570,
  defaultLength,
  step = 15,
  hour12 = true,
  zones = [],
  label = 'Time',
  onChange,
  ref,
}: {
  /** The start, in minutes since midnight. */
  defaultValue?: Minutes
  /** Make it a range: how long it runs, in minutes. */
  defaultLength?: number
  /** Minutes between the times in the list, and per arrow key. */
  step?: number
  hour12?: boolean
  /** Other time zones to show the same moment in, as IANA names: "Asia/Kolkata". A label can replace the city: "Asia/Kolkata|Bengaluru". */
  zones?: string[]
  label?: string
  /** Hears the start and, for a range, its length. */
  onChange?: (value: { start: Minutes; length?: number }) => void
  ref?: Ref<TimeHandle>
}) {
  const range = defaultLength !== undefined
  const [start, setStart] = useState(defaultValue)
  const [length, setLength] = useState(defaultLength ?? 0)
  const [draft, setDraft] = useState<{ which: Which; text: string } | null>(null)
  const [open, setOpen] = useState<Which | null>(null)
  const [hi, setHi] = useState(0)
  const [at, setAt] = useState<ReturnType<typeof place> | null>(null)
  const startField = useRef<HTMLInputElement>(null)
  const endField = useRef<HTMLInputElement>(null)
  const startAnchor = useRef<HTMLDivElement>(null)
  const endAnchor = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const { contained, frame } = useHost()
  const reduce = useReducedMotion()
  const listId = useId()
  const plate = useId()

  const end = start + length
  /** The times on offer: the whole day for the start; for the end, every time after the start, each with its length. */
  const slots = (which: Which) => (which === 'start' ? Array.from({ length: DAY / step }, (_, i) => i * step) : Array.from({ length: DAY / step - 1 }, (_, i) => start + (i + 1) * step))
  const valueOf = (which: Which) => (which === 'start' ? start : end)
  const nearest = (which: Which, v: Minutes) => {
    const s = slots(which)
    const target = which === 'end' ? start + mod(v - start - 1, DAY) + 1 : mod(v, DAY)
    let best = 0
    s.forEach((x, i) => Math.abs(x - target) < Math.abs(s[best] - target) && (best = i))
    return best
  }

  const set = (which: Which, v: Minutes) => {
    if (which === 'start') {
      const s = mod(v, DAY)
      setStart(s)
      onChange?.({ start: s, length: range ? length : undefined })
    } else {
      // An end is a length: the first time it comes round after the start.
      const len = mod(v - start - 1, DAY) + 1
      setLength(len)
      onChange?.({ start, length: len })
    }
  }

  const reading = draft ? parseTime(draft.text, draft.which === 'end' ? start : undefined) : null

  const commit = (which: Which) => {
    if (open === which && !draft) set(which, slots(which)[hi])
    else if (draft?.which === which && reading !== null) set(which, reading)
    setDraft(null)
    setOpen(null)
  }

  const nudge = (which: Which, steps: number) => {
    const v = valueOf(which)
    // Off the grid, the first step lands on it.
    const snapped = steps > 0 ? Math.floor(v / step) * step + step * steps : Math.ceil(v / step) * step + step * steps
    if (which === 'end' && snapped - start < step) return
    set(which, snapped)
  }

  const show = (which: Which) => {
    setAt(null)
    setOpen(which)
    setHi(nearest(which, valueOf(which)))
  }

  // Measure where the list goes, once it exists; then centre the current time in it.
  const measure = () => {
    const a = open === 'start' ? startAnchor.current : open === 'end' ? endAnchor.current : null
    if (!panel.current || !a) return
    const f = frameOf(frame)
    setAt(place(inFrame(a.getBoundingClientRect(), f), { w: panel.current.offsetWidth, h: panel.current.offsetHeight }, f, 'bottom', 'start', 6))
  }
  useLayoutEffect(() => {
    if (open && !at) measure()
  })
  useLayoutEffect(() => {
    // One panel serves both fields, so moving between them keeps a single list to scroll.
    if (open && list.current) list.current.scrollTop = hi * ROW - ((ROWS - 1) / 2) * ROW
    // Only when it opens: after that the list scrolls where the person takes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  useReposition(!!open, measure)
  useDismiss(!!open, [layer, startAnchor, endAnchor], () => {
    setOpen(null)
    setDraft(null)
  })

  /** Keeps the highlighted time in view, without jumping when it already is. */
  const reveal = (i: number) => {
    const el = list.current
    if (!el) return
    if (i * ROW < el.scrollTop) el.scrollTop = i * ROW
    else if ((i + 1) * ROW > el.scrollTop + el.clientHeight) el.scrollTop = (i + 1) * ROW - el.clientHeight
  }

  useImperativeHandle(ref, () => ({
    open: show,
    close: () => setOpen(null),
    type: (which, text) => {
      setDraft({ which, text })
      if (!open) show(which)
      const v = parseTime(text, which === 'end' ? start : undefined)
      if (v !== null) {
        const i = nearest(which, v)
        setHi(i)
        reveal(i)
      }
    },
    commit,
    point: (n) => {
      if (!open) return
      const i = Math.min(slots(open).length - 1, Math.max(0, hi + n))
      setHi(i)
      reveal(i)
    },
    nudge,
  }))

  const keys = (which: Which) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const d = e.key === 'ArrowDown' ? 1 : -1
      if (open === which) {
        const i = Math.min(slots(which).length - 1, Math.max(0, hi + d * (e.shiftKey ? 4 : 1)))
        setHi(i)
        reveal(i)
      } else nudge(which, -d * (e.shiftKey ? 60 / step : 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit(which)
    } else if (e.key === 'Escape' && (open || draft)) {
      e.preventDefault()
      e.stopPropagation()
      setDraft(null)
      setOpen(null)
    }
  }

  const field = (which: Which) => {
    const typing = draft?.which === which
    const v = valueOf(which)
    return (
      <div ref={which === 'start' ? startAnchor : endAnchor} className={`@container relative ${range ? 'min-w-0 flex-1' : 'w-[124px]'}`}>
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 @max-[108px]:hidden">
          <Clock minutes={typing && reading !== null ? reading : v} />
        </span>
        <input
          ref={which === 'start' ? startField : endField}
          role="combobox"
          aria-label={range ? `${label}, ${which === 'start' ? 'from' : 'to'}` : label}
          aria-expanded={open === which}
          aria-controls={open === which ? listId : undefined}
          aria-activedescendant={open === which ? `${listId}-${hi}` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={typing ? draft.text : formatTime(v, hour12)}
          onChange={(e) => {
            setDraft({ which, text: e.target.value })
            if (open !== which) show(which)
            const parsed = parseTime(e.target.value, which === 'end' ? start : undefined)
            if (parsed !== null) {
              const i = nearest(which, parsed)
              setHi(i)
              reveal(i)
            }
          }}
          onFocus={(e) => e.currentTarget.select()}
          onClick={() => open !== which && show(which)}
          onKeyDown={keys(which)}
          onBlur={() => {
            if (draft?.which === which && reading !== null) set(which, reading)
            setDraft(null)
          }}
          className="ring-focus h-10 w-full rounded-[10px] bg-surface pl-9 pr-2 text-callout @max-[108px]:pl-3 tabular-nums text-ink shadow-[0_0_0_1px_var(--line-strong)] outline-none transition-shadow focus:shadow-field"
        />
        {/* What the typing reads as, before it's committed. */}
        <AnimatePresence>
          {typing && (
            <motion.span
              key="reading"
              aria-live="polite"
              className={`pointer-events-none absolute left-0 top-full mt-1.5 whitespace-nowrap px-1 text-caption tabular-nums ${reading === null ? 'text-danger' : 'text-ink-3'}`}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.15 }}
            >
              {reading === null ? 'Not a time yet' : `Reads as ${formatTime(reading, hour12)}`}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const items = open ? slots(open) : []
  const now = new Date().getHours() * 60 + new Date().getMinutes()

  return (
    <div className="inline-flex max-w-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        {!range && field('start')}
        {range && (
          <>
            <div className="flex w-[278px] max-w-full items-center gap-2">
              {field('start')}
              <ArrowRight size={14} className="shrink-0 text-ink-3" />
              {field('end')}
            </div>
            {/* The length, in a fixed slot so a longer one doesn't push anything. */}
            <span className="relative ml-1 h-6 w-[92px] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={length}
                  className="absolute left-0 top-0 inline-flex h-6 items-center whitespace-nowrap rounded-full bg-surface-2 px-2.5 text-caption font-medium tabular-nums text-ink-2"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: ease.out }}
                >
                  {formatLength(length)}
                </motion.span>
              </AnimatePresence>
            </span>
          </>
        )}
      </div>
      {zones.length > 0 && (
        <p className="mt-7 flex min-h-4 flex-wrap items-center gap-x-3 text-caption text-ink-3">
          {zones.map((z) => {
            const [zone, name] = z.split('|')
            return (
              <span key={z} className="tabular-nums">
                <span className="text-ink-2">{inZone(start, zone)}</span>
                {range && <span> – {inZone(mod(end, DAY), zone)}</span>} in {name ?? cityOf(zone)}
              </span>
            )
          })}
        </p>
      )}

      <Layer>
        <div ref={layer} className={`${fill(contained)} pointer-events-none z-50`}>
          <AnimatePresence>
            {open && (
              <motion.div
                key="times"
                ref={panel}
                className="pointer-events-auto absolute left-0 top-0 rounded-[14px] bg-surface p-1 shadow-float ring-1 ring-[color-mix(in_oklch,var(--ink)_8%,transparent)]"
                style={{ left: at?.x ?? 0, top: at?.y ?? 0, visibility: at ? 'visible' : 'hidden', width: open === 'end' ? 216 : 152, transformOrigin: 'top left' }}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.12, ease: ease.exit } }}
                transition={spring.snappy}
                onPointerDown={(e) => e.preventDefault()}
              >
                <div ref={list} id={listId} role="listbox" aria-label={open === 'end' ? 'End times' : 'Times'} className="relative overflow-y-auto overscroll-contain" style={{ height: ROW * ROWS }}>
                  {items.map((m, i) => {
                    const chosen = m === valueOf(open)
                    const isNow = open === 'start' && now >= m && now < m + step
                    return (
                      <div
                        key={m}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={chosen}
                        onPointerEnter={() => setHi(i)}
                        onClick={() => {
                          tap()
                          set(open, m)
                          setDraft(null)
                          setOpen(null)
                        }}
                        className="relative flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-2.5 text-footnote tabular-nums"
                        style={{ height: ROW }}
                      >
                        {i === hi && <motion.span layoutId={plate} className="absolute inset-0 rounded-[10px] bg-surface-2" transition={reduce ? { duration: 0 } : spring.move} />}
                        {/* Above every plate, not just this row's: a plate on its way down passes over the rows before it. */}
                        <span className={`relative z-[1] ${chosen ? 'font-medium text-ink' : 'text-ink-2'}`}>{formatTime(m, hour12)}</span>
                        <span className="relative z-[1] text-caption text-ink-3">{open === 'end' ? formatLength(m - start) : isNow ? 'Now' : ''}</span>
                        {chosen && <span className="absolute left-0.5 top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layer>
    </div>
  )
}

/** A small clock face whose hands turn to the time, always the short way round. */
function Clock({ minutes }: { minutes: Minutes }) {
  const hour = useMotionValue((minutes % 720) * 0.5)
  const minute = useMotionValue((minutes % 60) * 6)
  const reduce = useReducedMotion()
  useEffect(() => {
    const go = (mv: typeof hour, to: number, full: number) => {
      const from = mv.get()
      const target = from + (((to - (from % full)) % full) + full * 1.5) % full - full / 2
      if (reduce) mv.set(target)
      else animate(mv, target, spring.smooth)
    }
    go(hour, (minutes % 720) * 0.5, 360)
    go(minute, (minutes % 60) * 6, 360)
  }, [minutes, hour, minute, reduce])
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.6" strokeWidth="1.5" />
      <motion.line x1="8" y1="8" x2="8" y2="4.6" strokeWidth="1.7" style={{ rotate: hour, originX: '8px', originY: '8px', transformBox: 'view-box' }} />
      <motion.line x1="8" y1="8" x2="8" y2="3.2" strokeWidth="1.2" style={{ rotate: minute, originX: '8px', originY: '8px', transformBox: 'view-box' }} />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
