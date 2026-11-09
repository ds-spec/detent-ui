'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import { RollingText } from '../../ui/RollingText'

export type LivePerson = { id: string; name: string; hue: number }
export type LiveGroup = { id: string; label: string; hue: number }
export type LiveItem = { id: string; title: string; group: string; by: string; done?: boolean; at?: number }

const ROW = 36
const FRESH = 2200
const SETTLE = 700
const EASE = [0.3, 0, 0.2, 1] as const
const GROW = { duration: 0.26, ease: EASE }
const HAIR = 'border-[light-dark(rgb(0_0_0/.06),rgb(255_255_255/.07))]'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function Face({ person, size = 20, ring = false }: { person?: LivePerson; size?: number; ring?: boolean }) {
  if (!person) return <span className="shrink-0" style={{ width: size }} />
  return (
    <span
      title={person.name}
      className={`grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.02em] text-[light-dark(oklch(0.34_0.07_var(--h)),oklch(0.9_0.06_var(--h)))] ${ring ? 'shadow-[0_0_0_2px_var(--tray)]' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: `light-dark(oklch(0.91 0.06 ${person.hue}), oklch(0.36 0.07 ${person.hue}))`, ['--h' as string]: person.hue }}
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
    <span className={`relative grid size-[17px] shrink-0 place-items-center rounded-[5px] transition-[background-color,box-shadow] duration-150 ${done ? 'bg-ink' : 'bg-surface shadow-[inset_0_0_0_1.5px_light-dark(rgb(0_0_0/.22),rgb(255_255_255/.28))] group-hover/box:shadow-[inset_0_0_0_1.5px_light-dark(rgb(0_0_0/.42),rgb(255_255_255/.5))]'}`}>
      <svg viewBox="0 0 12 12" className="size-[11px]" fill="none" stroke="var(--surface)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <motion.path d="M2.6 6.3 5 8.6 9.6 3.6" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={still ? { duration: 0 } : { duration: 0.22, ease: EASE }} />
      </svg>
    </span>
  )
}

export function LiveList({
  title,
  people,
  groups,
  items: controlled,
  defaultItems = [],
  onItemsChange,
  me,
  height = 340,
}: {
  title: string
  people: LivePerson[]
  groups: LiveGroup[]
  items?: LiveItem[]
  defaultItems?: LiveItem[]
  onItemsChange?: (items: LiveItem[]) => void
  me: string
  height?: number
}) {
  const [own, setOwn] = useState(defaultItems)
  const items = controlled ?? own
  const still = !!useReducedMotion()
  const [now, setNow] = useState(0)
  const [shut, setShut] = useState<Record<string, boolean>>({ __done: true })
  const [settling, setSettling] = useState<Record<string, boolean>>({})
  const [draft, setDraft] = useState('')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

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

  const who = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])
  const total = items.length
  const finished = items.filter((i) => i.done).length
  const done = items.filter((i) => i.done && !settling[i.id])
  const isFresh = (i: LiveItem) => i.at !== undefined && now - i.at < FRESH

  const add = (e: FormEvent) => {
    e.preventDefault()
    const tag = draft.match(/#(\w+)/)?.[1]?.toLowerCase()
    const group = groups.find((g) => tag && (g.id === tag || g.label.toLowerCase().startsWith(tag)))?.id ?? groups[0]?.id
    const text = draft.replace(/#\w+/, '').replace(/\s+/g, ' ').trim()
    if (!text || !group) return
    commit([...items, { id: `${Date.now()}`, title: text, group, by: me, at: Date.now() }])
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
      <div className="flex w-full max-w-[400px] flex-col rounded-[22px] bg-[var(--tray)] p-1.5 shadow-[0_0_0_1px_light-dark(rgb(0_0_0/.06),rgb(255_255_255/.06))] [--tray:light-dark(#f4f4f5,#1c1c1f)]">
        <div className="flex h-[46px] items-center justify-between gap-3 pl-3 pr-2">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-medium leading-tight text-ink">{title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] leading-none text-ink-3">
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
            {people.length > avatars.length && <span className="grid size-[22px] place-items-center rounded-full bg-[light-dark(#e4e4e7,#2e2e33)] text-[9.5px] font-medium text-ink-2 shadow-[0_0_0_2px_var(--tray)]">+{people.length - avatars.length}</span>}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[16px] bg-surface shadow-[0_0_0_0.5px_light-dark(rgb(0_0_0/.09),rgb(255_255_255/.08)),0_1px_2px_rgb(0_0_0/.04),0_8px_24px_-12px_rgb(0_0_0/.12)]">
          <div className="overflow-y-auto overscroll-contain px-1.5 py-1 [mask-image:linear-gradient(to_bottom,transparent,#000_8px,#000_calc(100%-14px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ height }}>
            {groups.map((g) => {
              const rows = items.filter((i) => i.group === g.id && (!i.done || settling[i.id]))
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
                          <p className="flex h-full items-center px-2.5 text-[12.5px] text-ink-3">All clear</p>
                        </Grow>
                      )}
                    </AnimatePresence>
                  </Fold>
                </section>
              )
            })}

            <section className={`mt-1 border-t pt-1 ${HAIR}`}>
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

          <form onSubmit={add} className={`relative border-t ${HAIR}`}>
            <div className="flex h-[46px] items-center gap-2.5 px-4">
              <span aria-hidden className="grid size-[17px] shrink-0 place-items-center text-ink-3">
                <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={tab}
                aria-label="Add an item"
                enterKeyHint="done"
                placeholder="Add an item, # for a group"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3 max-sm:text-[16px]"
              />
              <motion.button
                type="submit"
                tabIndex={typed ? 0 : -1}
                aria-hidden={!typed}
                initial={false}
                animate={{ opacity: typed ? 1 : 0, scale: typed ? 1 : 0.9 }}
                transition={{ duration: still ? 0 : 0.15 }}
                whileTap={{ scale: 0.95 }}
                className={`ring-focus shrink-0 rounded-[7px] bg-ink px-2 py-1 text-[11.5px] font-medium text-surface ${typed ? '' : 'pointer-events-none'}`}
              >
                Add
              </motion.button>
            </div>
            <AnimatePresence>
              {match.length > 0 && (
                <motion.div role="listbox" aria-label="Groups" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }} className="absolute bottom-[calc(100%-6px)] left-10 z-10 flex max-w-[calc(100%-3rem)] gap-1 overflow-x-auto rounded-[10px] bg-surface p-1 shadow-[0_0_0_0.5px_light-dark(rgb(0_0_0/.12),rgb(255_255_255/.12)),0_8px_24px_-8px_rgb(0_0_0/.25)] [scrollbar-width:none]">
                  {match.map((g, k) => (
                    <button key={g.id} type="button" role="option" aria-selected={k === 0} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(g)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2 py-1 text-[12px] ${k === 0 ? 'bg-[light-dark(rgb(0_0_0/.05),rgb(255_255_255/.08))] text-ink' : 'text-ink-2'}`}>
                      <span className="size-2 rounded-[2.5px]" style={{ background: `oklch(0.72 0.13 ${g.hue})` }} />
                      {g.label}
                      {k === 0 && <kbd className="ml-1 font-sans text-[10.5px] text-ink-3 max-sm:hidden">Tab</kbd>}
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
  return (
    <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={still ? { duration: 0 } : GROW} className="overflow-hidden" inert={!open}>
      {children}
    </motion.div>
  )
}

function Header({ label, hue, count, closed, still, onToggle, quiet = false }: { label: string; hue?: number; count: number; closed: boolean; still: boolean; onToggle: () => void; quiet?: boolean }) {
  return (
    <button type="button" aria-expanded={!closed} aria-label={`${label}, ${count}`} onClick={onToggle} className="ring-focus group flex h-8 w-full items-center gap-2 rounded-[8px] px-2.5 text-left">
      {hue !== undefined && <span aria-hidden className="size-2 shrink-0 rounded-[2.5px]" style={{ background: `oklch(0.72 0.13 ${hue})` }} />}
      <span className={`text-[12px] font-medium leading-none ${quiet ? 'text-ink-3' : 'text-ink-2'}`}>{label}</span>
      <span className="flex items-center text-[12px] leading-none tabular-nums text-ink-3">
        <RollingText text={`${count}`} still={still} />
      </span>
      <span className="flex-1" />
      <motion.svg aria-hidden viewBox="0 0 12 12" className="size-3 text-ink-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ rotate: closed ? -90 : 0 }} transition={still ? { duration: 0 } : GROW}>
        <path d="m3 4.5 3 3 3-3" />
      </motion.svg>
    </button>
  )
}

const Row = memo(function Row({ item, by, still, onToggle, fresh }: { item: LiveItem; by?: LivePerson; still: boolean; onToggle: (id: string) => void; fresh: boolean }) {
  const done = !!item.done
  const tint = by ? `light-dark(oklch(0.965 0.035 ${by.hue}), oklch(0.3 0.045 ${by.hue}))` : 'transparent'
  const edge = by ? `inset 0 0 0 1px light-dark(oklch(0.9 0.06 ${by.hue}), oklch(0.42 0.06 ${by.hue}))` : 'none'
  return (
    <div className="group relative flex items-center gap-2.5 rounded-[9px] px-2.5 transition-colors duration-150 hover:bg-[light-dark(rgb(0_0_0/.03),rgb(255_255_255/.04))]" style={{ height: ROW }}>
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[9px]" initial={false} animate={{ opacity: fresh ? 1 : 0 }} transition={{ duration: still ? 0 : fresh ? 0.2 : 0.6 }} style={{ background: tint, boxShadow: edge }} />
      <button type="button" role="checkbox" aria-checked={done} aria-label={item.title} onClick={() => onToggle(item.id)} className="ring-focus group/box relative -m-1.5 grid shrink-0 place-items-center rounded-[7px] p-1.5">
        <Box done={done} still={still} />
      </button>
      <span className="relative min-w-0 flex-1 truncate text-[13px]">
        <span className={`transition-colors duration-200 ${done ? 'text-ink-3' : 'text-ink'}`}>{item.title}</span>
        <motion.span aria-hidden className="absolute left-0 top-1/2 h-px w-full origin-left bg-ink-3" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={still ? { duration: 0 } : { duration: 0.28, ease: EASE }} />
      </span>
      {by && (
        <motion.span aria-hidden={!fresh} initial={false} animate={{ opacity: fresh ? 1 : 0, x: fresh ? 0 : 4 }} transition={{ duration: still ? 0 : 0.2 }} className="pointer-events-none absolute right-[38px] top-[8px] whitespace-nowrap leading-[16px] rounded-[6px] py-0.5 pl-3 text-[11.5px] text-ink-2 max-[360px]:hidden" style={{ background: `linear-gradient(to right, transparent, ${tint} 12px)` }}>
          {by.name.split(' ')[0]} · just now
        </motion.span>
      )}
      <span className="relative">
        <Face person={by} />
      </span>
    </div>
  )
})
