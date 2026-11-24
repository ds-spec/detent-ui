'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, MotionConfig, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'

export type LivePerson = { id: string; name: string; hue: number }
export type LiveGroup = { id: string; label: string; hue: number }
export type LiveItem = { id: string; title: string; group: string; by: string; done?: boolean; at?: number }

export type LiveListProps = {
  title: string
  people: LivePerson[]
  groups: LiveGroup[]
  items?: LiveItem[]
  defaultItems?: LiveItem[]
  onItemsChange?: (items: LiveItem[]) => void
  me: string
  height?: number
  className?: string
}

type Snap = { order: string[]; done: Record<string, boolean>; keep: Record<string, LiveItem> }

const take = (list: LiveItem[]): Snap => ({ order: list.map((i) => i.id), done: Object.fromEntries(list.map((i) => [i.id, !!i.done])), keep: Object.fromEntries(list.map((i) => [i.id, i])) })

const ROW = 36
const FRESH = 2200
const SETTLE = 700
const EASE = [0.3, 0, 0.2, 1] as const
const GROW = { duration: 0.26, ease: EASE }
const IDLE = 4000
const ROLL = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 } as const
const CURVE = 'ease-[cubic-bezier(0.3,0,0.2,1)]'
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

const dot = (hue: number) => `oklch(0.72 0.13 ${hue})`
const mix = (hue: number, amount: number, base: string) => `color-mix(in oklch, oklch(0.72 0.12 ${hue}) ${amount}%, ${base})`

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function RollingText({ text, proportional = false, still = false }: { text: string; proportional?: boolean; still?: boolean }) {
  const chars = [...text]
  const probe = useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = useState<number[] | null>(null)

  useLayoutEffect(() => {
    if (!proportional || !probe.current) return
    const read = () => {
      const box = probe.current
      if (!box) return
      const z = box.offsetWidth ? box.getBoundingClientRect().width / box.offsetWidth : 1
      const em = parseFloat(getComputedStyle(box).fontSize) || 16
      setWidths([...box.children].map((c) => (c as HTMLElement).getBoundingClientRect().width / z / em))
    }
    read()
    document.fonts?.ready.then(read)
  }, [proportional])

  return (
    <span className={`relative inline-flex ${proportional ? '' : 'tabular-nums'}`} style={{ lineHeight: '1.25em', height: '1.25em' }}>
      <span className="sr-only">{text}</span>
      {proportional && (
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 size-0 overflow-hidden">
          <span ref={probe} className="invisible flex w-max whitespace-pre">
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      )}
      {chars.map((c, i) => {
        const key = chars.length - i
        return /\d/.test(c) ? (
          <Digit key={key} d={+c} width={proportional && widths ? widths[+c] : undefined} still={still} />
        ) : (
          <span key={`${key}${c}`} aria-hidden className="whitespace-pre">
            {c}
          </span>
        )
      })}
    </span>
  )
}

function Digit({ d, width, still }: { d: number; width?: number; still: boolean }) {
  const w = useMotionValue<string>(width === undefined ? '1ch' : `${width}em`)
  const had = useRef(width !== undefined)
  useLayoutEffect(() => {
    if (width === undefined) return
    if (!had.current) {
      had.current = true
      w.set(`${width}em`)
      return
    }
    const ctl = animate(w, `${width}em`, ROLL)
    return () => ctl.stop()
  }, [width, w])

  return (
    <motion.span aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1.25em', width: w }}>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col items-center" initial={false} animate={{ y: `${-d * 10}%` }} transition={still ? { duration: 0 } : ROLL}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block" style={{ height: '1.25em' }}>
            {n}
          </span>
        ))}
      </motion.span>
    </motion.span>
  )
}

function Face({ person, size = 20, ring = false }: { person?: LivePerson; size?: number; ring?: boolean }) {
  if (!person) return <span className="shrink-0" style={{ width: size }} />
  return (
    <span
      title={person.name}
      className={`grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.02em] ${ring ? 'shadow-[0_0_0_2px_var(--color-muted)]' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: mix(person.hue, 34, 'var(--color-background)'), color: mix(person.hue, 45, 'var(--color-foreground)') }}
    >
      {initials(person.name)}
    </span>
  )
}

function Pie({ part, still }: { part: number; still: boolean }) {
  const c = 2 * Math.PI * 2.25
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 -rotate-90" aria-hidden>
      <circle cx="6" cy="6" r="5.25" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <motion.circle cx="6" cy="6" r="2.25" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray={`${c} ${c}`} initial={false} animate={{ strokeDashoffset: c * (1 - part) }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 30 }} />
    </svg>
  )
}

function Box({ done, still }: { done: boolean; still: boolean }) {
  return (
    <span
      className={`relative grid size-[17px] shrink-0 place-items-center rounded-[5px] transition-[background-color,box-shadow] duration-150 ${CURVE} ${done ? 'bg-foreground' : 'bg-card shadow-[inset_0_0_0_1.5px_color-mix(in_oklch,var(--color-foreground)_24%,transparent)] group-hover/box:shadow-[inset_0_0_0_1.5px_color-mix(in_oklch,var(--color-foreground)_45%,transparent)]'}`}
    >
      <svg viewBox="0 0 12 12" className="size-[11px] stroke-background" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <motion.path d="M2.6 6.3 5 8.6 9.6 3.6" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={still ? { duration: 0 } : { duration: 0.22, ease: EASE }} />
      </svg>
    </span>
  )
}

export function LiveList({ title, people, groups, items: controlled, defaultItems = [], onItemsChange, me, height = 340, className = '' }: LiveListProps) {
  const [own, setOwn] = useState(defaultItems)
  const items = controlled ?? own
  const still = !!useReducedMotion()
  const [now, setNow] = useState(0)
  const [shut, setShut] = useState<Record<string, boolean>>({ __done: true })
  const [settling, setSettling] = useState<Record<string, boolean>>({})
  const [draft, setDraft] = useState('')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [snap, setSnap] = useState<Snap | null>(null)
  const [landed, setLanded] = useState<Record<string, boolean>>({})
  const inside = useRef({ hover: false, focus: false })

  const live = useRef({ items, controlled: controlled !== undefined, onItemsChange, still })
  useLayoutEffect(() => {
    live.current = { items, controlled: controlled !== undefined, onItemsChange, still }
  })

  const commit = useCallback((next: LiveItem[]) => {
    live.current.items = next
    if (!live.current.controlled) setOwn(next)
    live.current.onItemsChange?.(next)
  }, [])

  const toggle = useCallback(
    (id: string) => {
      const item = live.current.items.find((i) => i.id === id)
      if (!item) return
      const next = !item.done
      commit(live.current.items.map((i) => (i.id === id ? { ...i, done: next } : i)))
      setSnap((s) => (s ? { ...s, done: { ...s.done, [id]: next } } : s))
      clearTimeout(timers.current[id])
      if (next && !live.current.still) {
        setSettling((s) => ({ ...s, [id]: true }))
        timers.current[id] = setTimeout(() => setSettling((s) => ({ ...s, [id]: false })), SETTLE)
      } else setSettling((s) => ({ ...s, [id]: false }))
    },
    [commit],
  )

  const freshest = Math.max(0, ...items.map((i) => i.at ?? 0))
  useEffect(() => {
    if (!freshest) return
    const t = setTimeout(() => setNow(Date.now()), Math.max(0, freshest + FRESH - Date.now()) + 20)
    return () => clearTimeout(t)
  }, [freshest])
  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  const hold = () => setSnap((s) => s ?? take(live.current.items))
  const flush = (keep: boolean) => {
    if (!snap) return
    const ids = live.current.items.filter((i) => !Object.prototype.hasOwnProperty.call(snap.done, i.id)).map((i) => i.id)
    if (ids.length) {
      setLanded(Object.fromEntries(ids.map((id) => [id, true])))
      clearTimeout(timers.current.__landed)
      timers.current.__landed = setTimeout(() => setLanded({}), FRESH)
    }
    setSnap(keep ? take(live.current.items) : null)
  }
  const release = () => {
    if (!inside.current.hover && !inside.current.focus) flush(false)
  }

  const who = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])
  const total = items.length
  const finished = items.filter((i) => i.done).length
  const byId = new Map(items.map((i) => [i.id, i]))
  const seen = snap ? snap.order.map((id) => byId.get(id) ?? snap.keep[id]) : items
  const waiting = snap ? items.filter((i) => !Object.prototype.hasOwnProperty.call(snap.done, i.id)) : []
  const placed = (i: LiveItem) => (snap ? snap.done[i.id] : !!i.done)
  const done = seen.filter((i) => placed(i) && !settling[i.id])
  const isFresh = (i: LiveItem) => !!landed[i.id] || (!snap && i.at !== undefined && now - i.at < FRESH)
  const waitingBy = [...new Set(waiting.map((i) => i.by))].map((id) => who[id]).filter(Boolean)

  const add = (e: FormEvent) => {
    e.preventDefault()
    const tag = draft.match(/#(\w+)/)?.[1]?.toLowerCase()
    const group = groups.find((g) => tag && (g.id === tag || g.label.toLowerCase().startsWith(tag)))?.id ?? groups[0]?.id
    const text = draft.replace(/#\w+/, '').replace(/\s+/g, ' ').trim()
    if (!text || !group) return
    const item = { id: `${Date.now()}`, title: text, group, by: me, at: Date.now() }
    setSnap((s) => (s ? { order: [...s.order, item.id], done: { ...s.done, [item.id]: false }, keep: { ...s.keep, [item.id]: item } } : s))
    commit([...items, item])
    setDraft('')
    setShut((s) => ({ ...s, [group]: false }))
  }

  const hint = draft.match(/(?:^|\s)#(\w*)$/)?.[1]?.toLowerCase()
  const match = hint !== undefined ? groups.filter((g) => g.label.toLowerCase().startsWith(hint) || g.id.startsWith(hint)) : []
  const pick = (g: LiveGroup) => setDraft((d) => d.replace(/#\w*$/, `#${g.id} `))
  const tab = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && match.length && hint !== match[0].id) {
      e.preventDefault()
      pick(match[0])
    }
  }

  const avatars = people.slice(0, 4)
  const typed = draft.trim().length > 0

  return (
    <MotionConfig reducedMotion="user">
      <div data-slot="live-list" className={`flex w-full max-w-[400px] flex-col rounded-[22px] bg-muted p-1.5 text-foreground shadow-[0_0_0_1px_var(--color-border)] ${className}`}>
        <div className="flex h-[46px] items-center justify-between gap-3 pl-3 pr-2">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-medium leading-tight text-foreground">{title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] leading-none text-muted-foreground">
              <Pie part={total ? finished / total : 0} still={still} />
              <span className="flex items-center whitespace-nowrap">
                <RollingText text={`${finished}`} proportional still={still} />
                <span className="ml-[0.28em]">of {total} done</span>
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center -space-x-[3px]" role="img" aria-label={`${people.length} people on this list`}>
            {avatars.map((p) => (
              <Face key={p.id} person={p} size={22} ring />
            ))}
            {people.length > avatars.length && (
              <span className="grid size-[22px] place-items-center rounded-full bg-background text-[9.5px] font-medium text-foreground/70 shadow-[0_0_0_2px_var(--color-muted)]">+{people.length - avatars.length}</span>
            )}
          </div>
        </div>

        <div
          onPointerEnter={(e) => {
            if (e.pointerType !== 'mouse') return
            inside.current.hover = true
            hold()
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== 'mouse') return
            inside.current.hover = false
            release()
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse') return
            hold()
            clearTimeout(timers.current.__idle)
            timers.current.__idle = setTimeout(() => {
              if (!inside.current.focus) setSnap(null)
            }, IDLE)
          }}
          onFocus={(e) => {
            if (e.target.tagName !== 'INPUT' && !e.target.matches(':focus-visible')) return
            inside.current.focus = true
            hold()
          }}
          onBlur={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return
            inside.current.focus = false
            release()
          }}
          className="relative flex flex-col overflow-hidden rounded-[16px] bg-card text-card-foreground shadow-[0_0_0_1px_var(--color-border),0_1px_2px_rgb(0_0_0/.04),0_8px_24px_-12px_rgb(0_0_0/.12)]"
        >
          <div className="overflow-y-auto overscroll-contain px-1.5 py-1 [mask-image:linear-gradient(to_bottom,transparent,#000_8px,#000_calc(100%-14px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ height }}>
            {groups.map((g) => {
              const rows = seen.filter((i) => i.group === g.id && (!placed(i) || settling[i.id]))
              const closed = !!shut[g.id]
              return (
                <section key={g.id} className="pt-1">
                  <Header label={g.label} hue={g.hue} count={rows.filter((i) => !i.done).length} closed={closed} still={still} onToggle={() => setShut((s) => ({ ...s, [g.id]: !closed }))} />
                  <Fold open={!closed} still={still}>
                    <AnimatePresence initial={false}>
                      {rows.map((item) => (
                        <Grow key={item.id} still={still}>
                          <Row item={item} by={who[item.by]} still={still} onToggle={toggle} fresh={isFresh(item)} />
                        </Grow>
                      ))}
                      {!rows.length && (
                        <Grow key="__empty" still={still}>
                          <p className="flex h-full items-center px-2.5 text-[12.5px] text-muted-foreground">All clear</p>
                        </Grow>
                      )}
                    </AnimatePresence>
                  </Fold>
                </section>
              )
            })}

            <section className="mt-1 border-t border-border pt-1">
              <Header label="Done" count={done.length} closed={!!shut.__done} still={still} onToggle={() => setShut((s) => ({ ...s, __done: !s.__done }))} quiet />
              <Fold open={!shut.__done} still={still}>
                <AnimatePresence initial={false}>
                  {done.map((item) => (
                    <Grow key={item.id} still={still}>
                      <Row item={item} by={who[item.by]} still={still} onToggle={toggle} fresh={false} />
                    </Grow>
                  ))}
                </AnimatePresence>
              </Fold>
            </section>
          </div>

          <AnimatePresence>
            {waiting.length > 0 && (
              <motion.button
                type="button"
                aria-label={`Show ${waiting.length} new`}
                data-slot="live-list-new"
                onClick={() => flush(true)}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96, transition: { duration: still ? 0 : 0.14 } }}
                transition={{ duration: still ? 0 : 0.2, ease: EASE }}
                whileTap={{ scale: 0.96 }}
                className={`${FOCUS} absolute left-1/2 top-2 z-10 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground pl-1 pr-2.5 text-[12px] font-medium text-background shadow-[0_6px_16px_-6px_rgb(0_0_0/.35)]`}
              >
                <span className="flex -space-x-[4px]">
                  {waitingBy.slice(0, 3).map((p) => (
                    <span key={p.id} className="rounded-full shadow-[0_0_0_1.5px_var(--color-foreground)]">
                      <Face person={p} size={20} />
                    </span>
                  ))}
                </span>
                <span className="flex items-center whitespace-nowrap">
                  <RollingText text={`${waiting.length}`} proportional still={still} />
                  <span className="ml-[0.28em]">new</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          <form onSubmit={add} className="relative border-t border-border">
            <div className="flex h-[46px] items-center gap-2.5 px-4">
              <span aria-hidden className="grid size-[17px] shrink-0 place-items-center text-muted-foreground">
                <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={tab}
                aria-label="Add an item"
                data-slot="live-list-input"
                enterKeyHint="done"
                placeholder="Add an item, # for a group"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground max-sm:text-[16px]"
              />
              <motion.button
                type="submit"
                tabIndex={typed ? 0 : -1}
                aria-hidden={!typed}
                initial={false}
                animate={{ opacity: typed ? 1 : 0, scale: typed ? 1 : 0.9 }}
                transition={{ duration: still ? 0 : 0.15 }}
                whileTap={{ scale: 0.95 }}
                className={`${FOCUS} shrink-0 rounded-[7px] bg-foreground px-2 py-1 text-[11.5px] font-medium text-background ${typed ? '' : 'pointer-events-none'}`}
              >
                Add
              </motion.button>
            </div>
            <AnimatePresence>
              {match.length > 0 && (
                <motion.div
                  role="listbox"
                  aria-label="Groups"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                  className="absolute bottom-[calc(100%-6px)] left-10 z-10 flex max-w-[calc(100%-3rem)] gap-1 overflow-x-auto rounded-[10px] bg-popover p-1 text-popover-foreground shadow-[0_0_0_1px_var(--color-border),0_8px_24px_-8px_rgb(0_0_0/.25)] [scrollbar-width:none]"
                >
                  {match.map((g, k) => (
                    <button
                      key={g.id}
                      type="button"
                      role="option"
                      aria-selected={k === 0}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(g)}
                      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2 py-1 text-[12px] ${k === 0 ? 'bg-muted text-foreground' : 'text-foreground/70'}`}
                    >
                      <span className="size-2 rounded-[2.5px]" style={{ background: dot(g.hue) }} />
                      {g.label}
                      {k === 0 && <kbd className="ml-1 font-sans text-[10.5px] text-muted-foreground max-sm:hidden">Tab</kbd>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </MotionConfig>
  )
}

function Grow({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: ROW, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={still ? { duration: 0 } : GROW} className="overflow-hidden">
      {children}
    </motion.div>
  )
}

function Fold({ open, still, children }: { open: boolean; still: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.toggleAttribute('inert', !open)
  }, [open])
  return (
    <motion.div ref={ref} initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={still ? { duration: 0 } : GROW} className="overflow-hidden">
      {children}
    </motion.div>
  )
}

function Header({ label, hue, count, closed, still, onToggle, quiet = false }: { label: string; hue?: number; count: number; closed: boolean; still: boolean; onToggle: () => void; quiet?: boolean }) {
  return (
    <button type="button" aria-expanded={!closed} aria-label={`${label}, ${count}`} onClick={onToggle} className={`${FOCUS} group flex h-8 w-full items-center gap-2 rounded-[8px] px-2.5 text-left`}>
      {hue !== undefined && <span aria-hidden className="size-2 shrink-0 rounded-[2.5px]" style={{ background: dot(hue) }} />}
      <span className={`text-[12px] font-medium leading-none ${quiet ? 'text-muted-foreground' : 'text-foreground/70'}`}>{label}</span>
      <span className="flex items-center text-[12px] leading-none tabular-nums text-muted-foreground">
        <RollingText text={`${count}`} still={still} />
      </span>
      <span className="flex-1" />
      <motion.svg
        aria-hidden
        viewBox="0 0 12 12"
        className={`size-3 text-muted-foreground opacity-0 transition-opacity duration-150 ${CURVE} group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ rotate: closed ? -90 : 0 }}
        transition={still ? { duration: 0 } : GROW}
      >
        <path d="m3 4.5 3 3 3-3" />
      </motion.svg>
    </button>
  )
}

const Row = memo(function Row({ item, by, still, onToggle, fresh }: { item: LiveItem; by?: LivePerson; still: boolean; onToggle: (id: string) => void; fresh: boolean }) {
  const done = !!item.done
  const tint = by ? mix(by.hue, 14, 'var(--color-card)') : 'transparent'
  const edge = by ? `inset 0 0 0 1px ${mix(by.hue, 38, 'var(--color-card)')}` : 'none'
  return (
    <div className={`group relative flex items-center gap-2.5 rounded-[9px] px-2.5 transition-colors duration-150 ${CURVE} hover:bg-muted/70`} style={{ height: ROW }}>
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[9px]" initial={false} animate={{ opacity: fresh ? 1 : 0 }} transition={{ duration: still ? 0 : fresh ? 0.2 : 0.6 }} style={{ background: tint, boxShadow: edge }} />
      <button type="button" role="checkbox" data-slot="live-list-check" aria-checked={done} aria-label={item.title} onClick={() => onToggle(item.id)} className={`${FOCUS} group/box relative -m-1.5 grid shrink-0 place-items-center rounded-[7px] p-1.5`}>
        <Box done={done} still={still} />
      </button>
      <span className="relative min-w-0 flex-1 truncate text-[13px]">
        <span className={`transition-colors duration-200 ${CURVE} ${done ? 'text-muted-foreground' : 'text-foreground'}`}>{item.title}</span>
        <motion.span aria-hidden className="absolute left-0 top-1/2 h-px w-full origin-left bg-muted-foreground" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={still ? { duration: 0 } : { duration: 0.28, ease: EASE }} />
      </span>
      {by && (
        <motion.span
          aria-hidden={!fresh}
          initial={false}
          animate={{ opacity: fresh ? 1 : 0, x: fresh ? 0 : 4 }}
          transition={{ duration: still ? 0 : 0.2 }}
          className="pointer-events-none absolute right-[38px] top-[8px] whitespace-nowrap rounded-[6px] py-0.5 pl-3 text-[11.5px] leading-[16px] text-foreground/70 max-[360px]:hidden"
          style={{ background: `linear-gradient(to right, transparent, ${tint} 12px)` }}
        >
          {by.name.split(' ')[0]} · just now
        </motion.span>
      )}
      <span className="relative">
        <Face person={by} />
      </span>
    </div>
  )
})

export default LiveList
