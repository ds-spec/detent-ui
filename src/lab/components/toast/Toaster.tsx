'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue, PanInfo } from 'motion/react'
import { Check, Close } from '../../icons'
import { Layer, fill, useHost } from '../../lib/layer'
import { spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'

/*
 * Toasts that keep to a corner. They stack, newest in front and the rest stepping back behind it,
 * each the height of the front one so the stack's edge never jumps. Point at the stack, or press
 * Alt+T, and it fans out into a list, every timer waiting while you read. A hairline along the
 * bottom drains with the time left. Swipe one away and it fades with the distance you throw it.
 *
 * Toasts are more than a line of text: a promise is one toast that settles in place, an upload
 * carries its progress, a message carries who sent it and quick replies, and Undo counts down
 * in a ring on its own button. The same toast twice doesn't stack up; it counts.
 *
 * Each `createToaster()` is its own store, so two on one page never echo each other; `toast` is
 * the default one.
 */

export type ToastKind = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export type ToastInput = {
  title: string
  description?: string
  kind?: ToastKind
  /** A button beside the text. */
  action?: { label: string; onClick: () => void }
  /** Shows an Undo button whose ring counts down the time left to use it. */
  undo?: () => void
  /** For a message: who it's from. Their picture, or initials, stand where the icon would. */
  from?: { name: string; image?: string }
  /** For a message: short answers, one press each. The toast settles to say it was sent. */
  replies?: string[]
  onReply?: (reply: string) => void
  /** 0 to 1: a bar under the text, for an upload or an export. Stays until it reaches 1. */
  progress?: number
  /** How long it stays, in ms. Loading and unfinished progress stay until updated. */
  duration?: number
}
type Toast = ToastInput & { id: number; kind: ToastKind; duration: number; count: number; stamp: number; fixed?: number }
type Options = Omit<ToastInput, 'title' | 'kind'>

const GAP = 10
const PEEK = 14
const SHOWN = 3

/** How long a toast stays: longer when there's something to do with it. */
const lasts = (t: ToastInput) => (t.kind === 'loading' || (t.progress !== undefined && t.progress < 1) ? Infinity : t.replies ? 9000 : t.undo || t.action ? 6500 : t.kind === 'error' ? 6000 : 4200)
/** Toasts that say the same thing fold into one. Anything that changes or carries a person doesn't. */
const sameness = (t: ToastInput & { kind: ToastKind }) => (t.kind === 'loading' || t.progress !== undefined || t.from || t.undo ? null : `${t.kind}\u0000${t.title}\u0000${t.description ?? ''}`)

export function createToaster() {
  let toasts: Toast[] = []
  let next = 1
  let stamps = 1
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  const add = (t: ToastInput) => {
    const kind = t.kind ?? 'default'
    const key = sameness({ ...t, kind })
    const twin = key ? toasts.find((x) => sameness(x) === key) : undefined
    if (twin) {
      // Counted, brought to the front, and its time starts over.
      toasts = [{ ...twin, count: twin.count + 1, stamp: stamps++ }, ...toasts.filter((x) => x !== twin)]
      emit()
      return twin.id
    }
    const id = next++
    toasts = [{ ...t, id, kind, fixed: t.duration, duration: t.duration ?? lasts({ ...t, kind }), count: 1, stamp: stamps++ }, ...toasts]
    emit()
    return id
  }
  const update = (id: number, patch: Partial<ToastInput>) => {
    toasts = toasts.map((x) => {
      if (x.id !== id) return x
      const merged = { ...x, ...patch, kind: patch.kind ?? x.kind }
      const duration = patch.duration ?? x.fixed ?? lasts(merged)
      // Settling (a spinner becoming a check, a bar reaching the end) gives it its full time.
      return { ...merged, duration, stamp: duration !== x.duration || merged.kind !== x.kind ? stamps++ : x.stamp }
    })
    emit()
  }
  const dismiss = (id?: number) => {
    toasts = id === undefined ? [] : toasts.filter((x) => x.id !== id)
    emit()
  }
  const kind = (k: ToastKind) => (title: string, o: Options = {}) => add({ ...o, title, kind: k })
  const toast = Object.assign((title: string, o: Options = {}) => add({ ...o, title }), {
    success: kind('success'),
    error: kind('error'),
    warning: kind('warning'),
    info: kind('info'),
    loading: kind('loading'),
    /** A message from someone: `toast.message('Maya Chen', { description, from: { name: 'Maya Chen' }, replies: ['On it'] })`. */
    message: (title: string, o: Options & { from: { name: string; image?: string } }) => add({ ...o, title }),
    /** One toast for a promise: loading while it runs, then success or error in the same place. */
    promise: <T,>(p: Promise<T>, m: { loading: string; success: string | ((v: T) => string); error: string | ((e: unknown) => string); description?: string }) => {
      const id = add({ title: m.loading, kind: 'loading', description: m.description })
      p.then(
        (v) => update(id, { title: typeof m.success === 'function' ? m.success(v) : m.success, kind: 'success' }),
        (e) => update(id, { title: typeof m.error === 'function' ? m.error(e) : m.error, kind: 'error' }),
      )
      return p
    },
    update,
    dismiss,
  })
  function Toaster({ position = 'bottom-right', expand = false, hotkey = true }: { position?: ToastPosition; /** Keep the stack fanned out as a list. */ expand?: boolean; /** Alt+T moves focus to the toasts. */ hotkey?: boolean }) {
    const list = useSyncExternalStore(
      (l) => {
        listeners.add(l)
        return () => listeners.delete(l)
      },
      () => toasts,
      () => toasts,
    )
    return <Stack toasts={list} position={position} expand={expand} hotkey={hotkey} onDismiss={dismiss} onUpdate={update} />
  }
  return { toast, Toaster }
}

/** The default toaster: `toast('Saved')` anywhere, `<Toaster />` once. */
export const { toast, Toaster } = createToaster()

function Stack({ toasts, position, expand, hotkey, onDismiss, onUpdate }: { toasts: Toast[]; position: ToastPosition; expand: boolean; hotkey: boolean; onDismiss: (id: number) => void; onUpdate: (id: number, p: Partial<ToastInput>) => void }) {
  const [hover, setHover] = useState(false)
  const [focused, setFocused] = useState(false)
  const list = useRef<HTMLOListElement>(null)
  // Fanned out only while there's something to fan.
  const open = (expand || hover || focused) && toasts.length > 1
  const [heights, setHeights] = useState<Record<number, number>>({})
  const { contained } = useHost()
  const [v, h] = position.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right']
  const bottom = v === 'bottom'
  const front = heights[toasts[0]?.id] ?? 64
  // Fanned out, each sits beyond the newer ones by their real heights.
  const offsets = toasts.map((_, i) => toasts.slice(0, i).reduce((a, t) => a + (heights[t.id] ?? 64) + GAP, 0))

  useEffect(() => {
    if (!hotkey) return
    const on = (e: KeyboardEvent) => {
      if (!e.altKey || e.code !== 'KeyT' || !list.current?.childElementCount) return
      e.preventDefault()
      list.current.focus()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [hotkey])

  // Esc closes the toast that has focus, or the front one.
  const keys = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Escape' || !toasts.length) return
    e.preventDefault()
    const own = Number((e.target as HTMLElement).closest('li')?.dataset.id)
    onDismiss(own || toasts[0].id)
    if (toasts.length === 1) list.current?.blur()
  }

  return (
    <Layer>
      <div className={`${fill(contained)} pointer-events-none z-[60]`}>
        <motion.ol
          ref={list}
          tabIndex={-1}
          aria-label={hotkey ? 'Notifications (Alt+T)' : 'Notifications'}
          // Glides when it changes corner; a stack growing or fanning keeps its edge where it is.
          layout="position"
          layoutDependency={position}
          transition={spring.move}
          className={`ring-focus pointer-events-auto absolute w-[min(372px,calc(100%-32px))] rounded-[18px] ${bottom ? 'bottom-4' : 'top-4'} ${h === 'left' ? 'left-4' : h === 'right' ? 'right-4' : 'inset-x-0 mx-auto'}`}
          style={{ height: open ? (offsets[offsets.length - 1] ?? 0) + (heights[toasts[toasts.length - 1]?.id] ?? 64) : front }}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
          onKeyDown={keys}
        >
          <AnimatePresence initial={false}>
            {toasts.map((t, i) => (
              <Item
                key={t.id}
                t={t}
                i={i}
                open={open}
                paused={hover || focused}
                bottom={bottom}
                side={h}
                y={open ? offsets[i] : i * PEEK}
                frontHeight={front}
                onHeight={(px) => setHeights((m) => (m[t.id] === px ? m : { ...m, [t.id]: px }))}
                onDismiss={() => onDismiss(t.id)}
                onUpdate={(p) => onUpdate(t.id, p)}
              />
            ))}
          </AnimatePresence>
        </motion.ol>
      </div>
    </Layer>
  )
}

function Item({ t, i, open, paused, bottom, side, y, frontHeight, onHeight, onDismiss, onUpdate }: { t: Toast; i: number; open: boolean; paused: boolean; bottom: boolean; side: 'left' | 'center' | 'right'; y: number; frontHeight: number; onHeight: (h: number) => void; onDismiss: () => void; onUpdate: (p: Partial<ToastInput>) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [gone, setGone] = useState<0 | 1 | -1>(0)
  const back = i > 0 && !open
  // The time left, from 1 to 0: it drains the hairline and the Undo ring alike.
  const left = useMotionValue(1)
  const x = useMotionValue(0)
  // Thrown, it fades with the distance.
  const fade = useTransform(x, [-220, -60, 0, 60, 220], [0, 0.85, 1, 0.85, 0])
  const done = useRef(onDismiss)
  const stamp = useRef(t.stamp)
  useLayoutEffect(() => {
    done.current = onDismiss
  })

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
    // Measured once per toast; the parent keeps the latest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Its time runs only while it's among the front few and nobody is reading the stack.
  useEffect(() => {
    if (stamp.current !== t.stamp) {
      stamp.current = t.stamp
      left.jump(1)
    }
    if (!Number.isFinite(t.duration) || paused || i >= SHOWN) return
    const run = animate(left, 0, { duration: (left.get() * t.duration) / 1000, ease: 'linear', onComplete: () => done.current() })
    return () => run.stop()
  }, [paused, i, t.duration, t.stamp, left])

  const drop = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 480) {
      setGone(info.offset.x > 0 ? 1 : -1)
      onDismiss()
    }
  }

  const reply = (r: string) => {
    t.onReply?.(r)
    onUpdate({ kind: 'success', title: `Sent to ${t.from?.name.split(' ')[0] ?? 'them'}`, description: `“${r}”`, from: undefined, replies: undefined })
  }

  const sign = bottom ? -1 : 1
  const timed = Number.isFinite(t.duration) && !t.undo
  const tone = TONE[t.kind]
  return (
    <motion.li
      data-id={t.id}
      role={t.kind === 'error' ? 'alert' : 'status'}
      aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
      aria-atomic
      className="absolute inset-x-0 touch-pan-y"
      style={{ [bottom ? 'bottom' : 'top']: 0, zIndex: 100 - i, transformOrigin: bottom ? 'bottom center' : 'top center', x }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -sign * 48, scale: 0.94 }}
      animate={{ opacity: i >= SHOWN && !open ? 0 : 1, y: sign * y, scale: back ? 1 - i * 0.055 : 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: gone ? gone * 420 : 0, y: gone ? sign * y : sign * y - sign * 14, scale: gone ? 1 : 0.94, transition: { duration: gone ? 0.26 : 0.2 } }}
      transition={reduce ? { duration: 0 } : spring.smooth}
      drag={i === 0 || open ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: side === 'right' ? 0.25 : 0.9, right: side === 'left' ? 0.25 : 0.9 }}
      dragSnapToOrigin
      onDragEnd={drop}
    >
      <motion.div
        ref={box}
        className="relative flex items-start gap-3 overflow-hidden rounded-[18px] bg-surface p-3 pr-2.5 shadow-float ring-1 ring-[color-mix(in_oklch,var(--ink)_8%,transparent)]"
        // Behind the front one, a toast takes its height, so the stack's edge never jumps.
        style={{ height: back ? frontHeight : undefined, opacity: fade }}
      >
        {/* Further back, a touch darker: depth without a shadow pile. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-ink transition-opacity duration-300" style={{ opacity: back ? Math.min(0.06, i * 0.03) : 0 }} />
        {t.from ? <Face from={t.from} /> : <Badge kind={t.kind} />}
        <div className={`min-w-0 flex-1 py-px transition-opacity duration-200 ${back ? 'opacity-0' : ''}`}>
          <div className="flex min-h-7 items-center gap-1.5">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p key={t.title} className="min-w-0 truncate text-footnote font-medium text-ink" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                {t.title}
              </motion.p>
            </AnimatePresence>
            {t.count > 1 && (
              <motion.span key={t.count} className="shrink-0 rounded-full bg-[color-mix(in_oklch,var(--ink)_8%,transparent)] px-1.5 text-[11px] font-semibold leading-[18px] tabular-nums text-ink-2" initial={reduce ? false : { scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 18 }}>
                ×{t.count}
              </motion.span>
            )}
          </div>
          {t.description && <p className="-mt-0.5 text-caption leading-[1.45] text-ink-3">{t.description}</p>}
          {t.progress !== undefined && <Progress value={t.progress} tone={t.kind === 'success' ? 'var(--ok)' : 'var(--ink)'} />}
          {t.replies && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {t.replies.map((r) => (
                <button key={r} type="button" onClick={() => reply(r)} className="ring-focus h-7 rounded-full bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] px-3 text-caption font-medium text-ink transition-colors hover:bg-[color-mix(in_oklch,var(--ink)_10%,transparent)]">
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        {(t.action || t.undo) && (
          <button
            type="button"
            onClick={() => {
              ;(t.undo ?? t.action!.onClick)()
              onDismiss()
            }}
            className={`ring-focus mt-0.5 flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-ink pl-3 text-caption font-medium text-surface transition-opacity ${t.undo ? 'pr-1.5' : 'pr-3'} ${back ? 'opacity-0' : ''}`}
          >
            {t.undo ? 'Undo' : t.action!.label}
            {t.undo && <Countdown left={left} />}
          </button>
        )}
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className={`ring-focus mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-ink-3 transition-[opacity,color,background-color] hover:bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] hover:text-ink ${back ? 'opacity-0' : ''}`}>
          <Close size={12} strokeWidth={2.4} />
        </button>
        {timed && !back && <motion.span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left" style={{ scaleX: left, background: `color-mix(in oklch, ${tone ?? 'var(--ink)'} ${tone ? 55 : 20}%, transparent)` }} />}
      </motion.div>
    </motion.li>
  )
}

const TONE: Record<ToastKind, string | null> = { default: null, loading: null, success: 'var(--ok)', error: 'var(--danger)', warning: 'var(--warn)', info: 'var(--accent)' }

/** The icon on the left, on a tint of its colour: a spinner that becomes a check or a cross in the same place. */
function Badge({ kind }: { kind: ToastKind }) {
  const tone = TONE[kind]
  const icons: Record<ToastKind, ReactNode> = {
    default: null,
    loading: (
      <svg viewBox="0 0 16 16" className="size-4 animate-spin" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    success: <Check size={14} strokeWidth={2.8} />,
    error: <Close size={12} strokeWidth={3} />,
    warning: (
      <svg viewBox="0 0 16 16" className="size-[15px]" fill="currentColor" aria-hidden>
        <path d="M6.6 2.4a1.6 1.6 0 0 1 2.8 0l5.3 9.3a1.6 1.6 0 0 1-1.4 2.4H2.7a1.6 1.6 0 0 1-1.4-2.4z" />
        <path d="M8 5.6v3.6" stroke="var(--surface)" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="8" cy="11.4" r="1" fill="var(--surface)" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 16 16" className="size-[15px]" fill="currentColor" aria-hidden>
        <circle cx="8" cy="8" r="7" />
        <path d="M8 7.3v4" stroke="var(--surface)" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="8" cy="4.8" r="1" fill="var(--surface)" />
      </svg>
    ),
  }
  if (kind === 'default') return null
  return (
    <span className="relative grid size-7 shrink-0 place-items-center rounded-full transition-[background-color,color] duration-300" style={{ background: `color-mix(in oklch, ${tone ?? 'var(--ink)'} ${tone ? 15 : 7}%, transparent)`, color: kind === 'warning' ? 'var(--warn-ink)' : (tone ?? 'var(--ink-2)') }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={kind} className="grid place-items-center" initial={{ scale: 0.3, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.3, opacity: 0 }} transition={spring.snappy}>
          {icons[kind]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Who a message is from: their picture, or their initials on a soft tint. */
function Face({ from }: { from: { name: string; image?: string } }) {
  const initials = from.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return from.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={from.image} alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-[color-mix(in_oklch,var(--ink)_8%,transparent)]" />
  ) : (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--accent)_16%,var(--surface))] text-[11px] font-semibold text-[var(--accent-ink,var(--accent))]">
      {initials}
    </span>
  )
}

/** A bar for work in progress, with its percentage rolling beside it. */
function Progress({ value, tone }: { value: number; tone: string }) {
  const reduce = useReducedMotion()
  const p = Math.max(0, Math.min(1, value))
  return (
    <div className="mt-2 flex items-center gap-2.5 pb-0.5">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--ink)_8%,transparent)]">
        <motion.div className="h-full origin-left rounded-full transition-colors duration-300" style={{ background: tone }} initial={false} animate={{ scaleX: p }} transition={reduce ? { duration: 0 } : spring.smooth} />
      </div>
      <span className="flex w-9 justify-end font-mono text-[11px] font-medium text-ink-2">
        <RollingText text={`${Math.round(p * 100)}%`} />
      </span>
    </div>
  )
}

/** The time left to undo, as a ring that drains. */
function Countdown({ left }: { left: MotionValue<number> }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px] -rotate-90" aria-hidden>
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
      <motion.circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ pathLength: left }} />
    </svg>
  )
}
