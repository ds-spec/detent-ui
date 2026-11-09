'use client'

import { memo, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from 'motion/react'
import { RollingText } from '../../ui/RollingText'

export type ShiftItem = { id: string; label: string; value: number; delta?: number; icon: ReactNode }
export type ShiftView = 'list' | 'bars' | 'change'

const VIEWS: { id: ShiftView; label: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'bars', label: 'Bars' },
  { id: 'change', label: 'Change' },
]

const MOVE = { type: 'spring', stiffness: 250, damping: 30, mass: 0.9 } as const
const FILL = 'bg-[light-dark(#f1f1f3,#2e2e33)]'
const FILL_LEAD = 'bg-[light-dark(#e2e2e7,#3c3c42)]'
const FILL_ON = 'group-data-[on]:bg-[light-dark(#d6d6dc,#4a4a51)]'
const UP = 'text-[light-dark(#16a34a,#4ade80)]'
const DOWN = 'text-[light-dark(#dc2626,#f87171)]'
const ROW = 33
const GAP = 5

const count = (n: number) => n.toLocaleString('en-US')
const lag = (i: number) => ({ ...MOVE, delay: i * 0.03 })
const signed = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d).toFixed(1)}%`

type Focus = { get: () => string | null; set: (id: string | null) => void; leave: (id: string) => void; sub: (fn: () => void) => () => void }

function makeFocus(): Focus {
  let id: string | null = null
  let t: ReturnType<typeof setTimeout> | undefined
  const fns = new Set<() => void>()
  const set = (next: string | null) => {
    clearTimeout(t)
    if (next === id) return
    id = next
    fns.forEach((fn) => fn())
  }
  return {
    get: () => id,
    set,
    leave: (from) => {
      clearTimeout(t)
      t = setTimeout(() => id === from && set(null), 120)
    },
    sub: (fn) => (fns.add(fn), () => void fns.delete(fn)),
  }
}

const useFocused = (focus: Focus) => useSyncExternalStore(focus.sub, focus.get, () => null)

const Other = () => (
  <svg viewBox="0 0 16 16" aria-hidden fill="light-dark(#71717a,#a1a1aa)">
    <circle cx="3.5" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="12.5" cy="8" r="1.5" />
  </svg>
)

export function Shift({
  title,
  items,
  period,
  unit = 'visitors',
  delta,
  limit = 6,
  view: controlled,
  defaultView = 'list',
  onViewChange,
  format = count,
}: {
  title: string
  items: ShiftItem[]
  period?: string
  unit?: string
  delta?: number
  limit?: number
  view?: ShiftView
  defaultView?: ShiftView
  onViewChange?: (view: ShiftView) => void
  format?: (n: number) => string
}) {
  const [own, setOwn] = useState<ShiftView>(defaultView)
  const view = controlled ?? own
  const [focus] = useState(makeFocus)
  const reduce = !!useReducedMotion()
  const scope = useId()

  const data = useMemo(() => {
    const sorted = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value)
    const keep = Math.max(2, limit)
    const rows =
      sorted.length > keep
        ? [...sorted.slice(0, keep - 1), { id: '__other', label: `${sorted.length - keep + 1} more`, value: sorted.slice(keep - 1).reduce((s, i) => s + i.value, 0), icon: <Other /> }]
        : sorted
    const sum = rows.reduce((s, i) => s + i.value, 0)
    return { rows, sum, total: sum || 1, max: rows[0]?.value || 1 }
  }, [items, limit])

  const pct = useMemo(() => (v: number) => `${((v / data.total) * 100).toFixed(v / data.total < 0.1 ? 1 : 0)}%`, [data.total])
  const area = Math.max(180, data.rows.length * (ROW + GAP) - GAP)
  const ctx = useMemo(() => ({ items: data.rows, scope, max: data.max, total: data.total, pct, format, focus, area, reduce }), [data, scope, pct, format, focus, area, reduce])

  const set = (v: ShiftView) => {
    focus.set(null)
    if (!controlled) setOwn(v)
    onViewChange?.(v)
  }

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : MOVE}>
      <div className="w-full max-w-[380px] rounded-[22px] bg-[light-dark(#f4f4f5,#1c1c1f)] p-1.5 shadow-[0_0_0_1px_light-dark(rgb(0_0_0/.06),rgb(255_255_255/.06))]">
        <div className="flex items-center justify-between gap-3 py-1 pl-3 pr-0.5">
          <h3 className="truncate text-[13px] font-medium text-ink">{title}</h3>
          <Switch view={view} set={set} scope={scope} />
        </div>
        <div className="rounded-[16px] bg-surface px-4 pb-4 pt-3.5 shadow-[0_0_0_0.5px_light-dark(rgb(0_0_0/.09),rgb(255_255_255/.08)),0_1px_2px_rgb(0_0_0/.04),0_8px_24px_-12px_rgb(0_0_0/.12)] max-[360px]:px-3">
          <Head focus={focus} items={data.rows} total={data.sum} unit={unit} period={period} delta={delta} pct={pct} format={format} still={reduce} />
          {data.rows.length === 0 ? (
            <div className="grid place-items-center text-[12.5px] text-ink-3" style={{ height: area }}>
              No {unit} yet
            </div>
          ) : (
            <LayoutGroup id={scope}>
              <div role="group" aria-label={`${title}, ${view} view`} className="relative" style={{ height: area }}>
                {view === 'list' && <List {...ctx} />}
                {view === 'bars' && <Bars {...ctx} />}
                {view === 'change' && <Change {...ctx} />}
              </div>
            </LayoutGroup>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}

function Head({ focus, items, total, unit, period, delta, pct, format, still }: { focus: Focus; items: ShiftItem[]; total: number; unit: string; period?: string; delta?: number; pct: (v: number) => string; format: (n: number) => string; still: boolean }) {
  const id = useFocused(focus)
  const on = items.find((i) => i.id === id)
  const shown = on ? on.delta : delta
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <p className="flex min-w-0 items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink">
          <RollingText text={format(on ? on.value : total)} proportional still={still} />
        </span>
        <span className="truncate text-[12.5px] text-ink-3">{on ? `from ${on.label}` : unit}</span>
      </p>
      <p className="flex shrink-0 items-center gap-2 pb-0.5 text-[12px]">
        {shown !== undefined && <span className={shown >= 0 ? UP : DOWN}>{signed(shown)}</span>}
        <span className="text-ink-3 max-[360px]:hidden">{on ? `${pct(on.value)} of ${unit}` : period}</span>
      </p>
    </div>
  )
}

type Ctx = { items: ShiftItem[]; scope: string; max: number; total: number; pct: (v: number) => string; format: (n: number) => string; focus: Focus; area: number; reduce: boolean }

function Hit({ focus, item, pct, format, className, style, children }: { focus: Focus; item: ShiftItem; pct: (v: number) => string; format: (n: number) => string; className: string; style?: CSSProperties; children: ReactNode }) {
  const on = useFocused(focus) === item.id
  const touch = useRef(false)
  const step = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    if (!(e.key in keys)) return
    e.preventDefault()
    const all = [...(e.currentTarget.closest('[role=group]')?.querySelectorAll<HTMLButtonElement>('[data-hit]') ?? [])]
    all[(all.indexOf(e.currentTarget) + keys[e.key] + all.length) % all.length]?.focus()
  }
  return (
    <button
      type="button"
      data-hit
      data-on={on || undefined}
      aria-pressed={on}
      aria-label={`${item.label}, ${format(item.value)}, ${pct(item.value)}`}
      onPointerEnter={(e: ReactPointerEvent) => e.pointerType === 'mouse' && focus.set(item.id)}
      onPointerLeave={(e: ReactPointerEvent) => e.pointerType === 'mouse' && focus.get() === item.id && focus.leave(item.id)}
      onPointerDown={(e: ReactPointerEvent) => (touch.current = e.pointerType !== 'mouse')}
      onClick={() => focus.set(touch.current && on ? null : item.id)}
      onFocus={(e) => e.currentTarget.matches(':focus-visible') && focus.set(item.id)}
      onBlur={() => focus.get() === item.id && focus.set(null)}
      onKeyDown={step}
      className={`group cursor-default text-left outline-none [-webkit-tap-highlight-color:transparent] ${className}`}
      style={style}
    >
      {children}
    </button>
  )
}

function Shape({ id, i, scope, className, style }: { id: string; i: number; scope: string; className: string; style?: CSSProperties }) {
  return <motion.span layoutId={`${scope}-shape-${id}`} transition={lag(i)} className={`absolute ${className}`} style={{ borderRadius: 8, ...style }} />
}

function Ring({ radius = 8 }: { radius?: number }) {
  return <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_0_1px_light-dark(rgb(0_0_0/.1),rgb(255_255_255/.12))] transition-opacity duration-150 group-focus-visible:opacity-100 group-focus-visible:shadow-[inset_0_0_0_2px_var(--accent,#3b82f6)]" style={{ borderRadius: radius }} />
}

function Icon({ item, i, scope }: { item: ShiftItem; i: number; scope: string }) {
  return (
    <motion.span
      layout="position"
      layoutId={`${scope}-icon-${item.id}`}
      transition={lag(i)}
      aria-hidden
      className="relative grid size-[22px] shrink-0 place-items-center rounded-[6px] bg-[light-dark(#fff,#2a2a2e)] shadow-[0_0_0_0.5px_light-dark(rgb(0_0_0/.12),rgb(255_255_255/.1)),0_1px_1.5px_rgb(0_0_0/.06)] [&_svg]:size-[13px]"
    >
      {item.icon}
    </motion.span>
  )
}

function Label({ item, i, scope, className = '' }: { item: ShiftItem; i: number; scope: string; className?: string }) {
  return (
    <motion.span layout="position" layoutId={`${scope}-label-${item.id}`} transition={lag(i)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-hidden className={`relative min-w-0 truncate text-[13px] text-ink ${className}`}>
      {item.label}
    </motion.span>
  )
}

function Value({ item, i, scope, text, still, className = '', style }: { item: ShiftItem; i: number; scope: string; text: string; still: boolean; className?: string; style?: CSSProperties }) {
  return (
    <motion.span layout="position" layoutId={`${scope}-value-${item.id}`} transition={lag(i)} aria-hidden style={style} className={`relative flex shrink-0 items-center whitespace-nowrap text-[13px] leading-none text-ink ${className}`}>
      <RollingText text={text} proportional still={still} />
    </motion.span>
  )
}

const List = memo(function List({ items, scope, max, format, pct, focus, reduce }: Ctx) {
  return (
    <div className="flex h-full flex-col" style={{ gap: GAP }}>
      {items.map((item, i) => (
        <Hit key={item.id} focus={focus} item={item} pct={pct} format={format} className="relative flex shrink-0 items-center gap-2.5 px-1.5" style={{ height: ROW }}>
          <Shape id={item.id} i={i} scope={scope} className={`inset-y-0 left-0 transition-colors duration-150 ${i === 0 ? FILL_LEAD : FILL} ${FILL_ON}`} style={{ width: `${Math.max(12, (item.value / max) * 100)}%` }} />
          <Ring />
          <Icon item={item} i={i} scope={scope} />
          <Label item={item} i={i} scope={scope} />
          <span className="flex-1" />
          {item.delta !== undefined && (
            <motion.span aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: reduce ? 0 : 0.18 + i * 0.03 } }} className={`relative shrink-0 text-[11.5px] tabular-nums max-[340px]:hidden ${item.delta >= 0 ? UP : DOWN}`}>
              {signed(item.delta)}
            </motion.span>
          )}
          <Value item={item} i={i} scope={scope} text={format(item.value)} still={reduce} className="min-w-[46px] justify-end" />
        </Hit>
      ))}
    </div>
  )
})

const Bars = memo(function Bars({ items, scope, max, pct, format, focus, area, reduce }: Ctx) {
  const tall = area - 58
  return (
    <div className="flex h-full items-end gap-2 max-[360px]:gap-1.5">
      {items.map((item, i) => (
        <Hit key={item.id} focus={focus} item={item} pct={pct} format={format} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <Value item={item} i={i} scope={scope} text={pct(item.value)} still={reduce} className="text-[12px] text-ink-2" />
          <span className="relative block w-full" style={{ height: Math.max(8, (item.value / max) * tall) }}>
            <Shape id={item.id} i={i} scope={scope} className={`inset-0 transition-colors duration-150 ${i === 0 ? FILL_LEAD : FILL} ${FILL_ON}`} />
            <Ring />
          </span>
          <Icon item={item} i={i} scope={scope} />
        </Hit>
      ))}
    </div>
  )
})

const GROW = 'bg-[light-dark(oklch(0.93_0.07_150),oklch(0.5_0.1_150/.32))]'
const SHRINK = 'bg-[light-dark(oklch(0.93_0.05_25),oklch(0.5_0.12_25/.32))]'

const Change = memo(function Change({ items, scope, pct, format, focus, reduce }: Ctx) {
  const rows = [...items].sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
  const up = Math.max(0, ...rows.map((r) => r.delta ?? 0))
  const down = Math.max(0, ...rows.map((r) => -(r.delta ?? 0)))
  const room = 0.24
  const axis = down ? 0.36 : 0
  const scale = Math.max(up / (1 - axis - room), down ? down / (axis - room) : 0, 1)
  return (
    <div className="flex h-full flex-col" style={{ gap: GAP }}>
      {rows.map((item, i) => {
        const d = item.delta ?? 0
        const w = (Math.abs(d) / scale) * 100
        const pos = d >= 0
        return (
          <Hit key={item.id} focus={focus} item={item} pct={pct} format={format} className="relative flex shrink-0 items-center gap-2.5 px-1.5" style={{ height: ROW }}>
            <Icon item={item} i={i} scope={scope} />
            <span className="relative h-full min-w-0 flex-1">
              <span aria-hidden className="absolute inset-y-[-3px] w-px bg-[light-dark(rgb(0_0_0/.12),rgb(255_255_255/.14))]" style={{ left: `${axis * 100}%` }} />
              <span className="absolute inset-y-[5px]" style={pos ? { left: `${axis * 100}%`, width: `${Math.max(w, 1.5)}%` } : { right: `${(1 - axis) * 100}%`, width: `${Math.max(w, 1.5)}%` }}>
                <Shape id={item.id} i={i} scope={scope} className={`inset-0 transition-[filter] duration-150 group-data-[on]:brightness-95 ${pos ? GROW : SHRINK}`} style={{ borderRadius: 6 }} />
                <Ring radius={6} />
              </span>
              <span className="absolute inset-y-0 flex items-center" style={pos ? { left: `calc(${axis * 100 + Math.max(w, 1.5)}% + 6px)` } : { right: `calc(${(1 - axis) * 100 + Math.max(w, 1.5)}% + 6px)` }}>
                <Value item={item} i={i} scope={scope} text={item.delta === undefined ? '–' : signed(d)} still={reduce} className="text-[12px] font-medium tabular-nums" style={{ color: item.delta === undefined ? 'var(--color-ink-3)' : pos ? 'light-dark(#16a34a,#4ade80)' : 'light-dark(#dc2626,#f87171)' }} />
              </span>
            </span>
          </Hit>
        )
      })}
    </div>
  )
})

function Switch({ view, set, scope }: { view: ShiftView; set: (v: ShiftView) => void; scope: string }) {
  const keys = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = VIEWS[(VIEWS.findIndex((v) => v.id === view) + d + VIEWS.length) % VIEWS.length]
    set(next.id)
    ;(e.currentTarget.parentElement?.querySelector(`[data-view=${next.id}]`) as HTMLElement | null)?.focus()
  }
  return (
    <div role="radiogroup" aria-label="View" className="flex shrink-0 gap-0.5 rounded-[10px] p-0.5">
      {VIEWS.map((v) => {
        const on = v.id === view
        return (
          <motion.button
            key={v.id}
            type="button"
            role="radio"
            data-view={v.id}
            aria-checked={on}
            aria-label={v.label}
            tabIndex={on ? 0 : -1}
            title={v.label}
            onClick={() => set(v.id)}
            onKeyDown={keys}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.1 }}
            className={`ring-focus relative grid size-7 place-items-center rounded-[8px] transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
          >
            {on && <motion.span layoutId={`${scope}-switch`} transition={{ type: 'spring', stiffness: 520, damping: 40 }} className="absolute inset-0 rounded-[8px] bg-surface shadow-[0_0_0_0.5px_light-dark(rgb(0_0_0/.1),rgb(255_255_255/.1)),0_1px_2px_rgb(0_0_0/.08)]" />}
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="relative" fill="currentColor">
              {v.id === 'list' && (
                <>
                  <rect x="2" y="3" width="12" height="2.2" rx="1.1" />
                  <rect x="2" y="6.9" width="8.5" height="2.2" rx="1.1" opacity=".75" />
                  <rect x="2" y="10.8" width="5" height="2.2" rx="1.1" opacity=".5" />
                </>
              )}
              {v.id === 'bars' && (
                <>
                  <rect x="2.5" y="2.5" width="2.6" height="11" rx="1.1" />
                  <rect x="6.7" y="6" width="2.6" height="7.5" rx="1.1" opacity=".75" />
                  <rect x="10.9" y="9.5" width="2.6" height="4" rx="1.1" opacity=".5" />
                </>
              )}
              {v.id === 'change' && (
                <>
                  <rect x="5.4" y="1.5" width="1.2" height="13" rx=".6" opacity=".5" />
                  <rect x="6.6" y="3" width="7.4" height="2.4" rx="1.1" />
                  <rect x="6.6" y="6.8" width="4.6" height="2.4" rx="1.1" opacity=".75" />
                  <rect x="2" y="10.6" width="3.4" height="2.4" rx="1.1" opacity=".5" />
                </>
              )}
            </svg>
          </motion.button>
        )
      })}
    </div>
  )
}
