'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Search } from '@/lab/icons'

/*
 * The list in the frame's sidebar: what's in this part of the library, group by group. Flat
 * rows, a quiet fill under the one you point at and a firmer one under the one on show, and each
 * group folds away under its name. Typing filters by name or line. Point at a name for a moment
 * and, where the page has one, a small live preview of it opens beside the list.
 */

/** `pro` marks it Pro; `free`, where a list mixes both, says so too. Components only mark Pro. */
export type RailItem = { id: string; name: string; line?: string; pro?: boolean; free?: boolean }
export type RailGroup = { id: string; name: string; icon?: ReactNode; color?: string; items: RailItem[] }

export function Rail({ groups, current, onPick, label, preview }: { groups: RailGroup[]; current: string; onPick: (id: string) => void; label: string; preview?: (id: string, onReady: () => void) => ReactNode }) {
  const reduce = useReducedMotion()
  const [q, setQ] = useState('')
  const [shut, setShut] = useState<string[]>([])
  const [peek, setPeek] = useState<{ id: string; y: number; x: number } | null>(null)
  // What the card shows: the last preview that was ready. The next one loads out of sight behind it
  // and takes over only once it's ready, so moving down the list never flashes a blank card.
  const [shownAt, setShownAt] = useState<{ id: string; y: number; x: number } | null>(null)
  const [readyId, setReadyId] = useState<string | null>(null)
  // The one under the pointer is ready: it takes the card (state derived while rendering, so there's no extra frame).
  if (peek && readyId === peek.id && (shownAt?.id !== peek.id || shownAt.y !== peek.y)) setShownAt(peek)
  const list = useRef<HTMLDivElement>(null)
  const timer = useRef(0)
  const all = groups.flatMap((g) => g.items)
  const words = q.trim().toLowerCase()
  const shown = groups.map((g) => ({ ...g, items: g.items.filter((x) => !words || `${x.name} ${x.line ?? ''}`.toLowerCase().includes(words)) })).filter((g) => g.items.length)

  // The one on show stays in sight in the list.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-id="${current}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [current, reduce])
  useEffect(() => () => clearTimeout(timer.current), [])

  const aim = (id: string, el: HTMLElement) => {
    if (!preview) return
    clearTimeout(timer.current)
    const r = el.getBoundingClientRect()
    const at = { id, y: r.top + r.height / 2, x: r.right + 18 }
    // Waits a beat on the first name, then follows at once while a preview is open.
    timer.current = window.setTimeout(() => setPeek(at), peek ? 0 : 420)
  }
  const leave = () => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setPeek(null)
      setShownAt(null)
      setReadyId(null)
    }, 120)
  }
  const peeked = shownAt ? all.find((x) => x.id === shownAt.id) : null
  const top = shownAt ? Math.max(72, Math.min(shownAt.y - 112, (typeof window === 'undefined' ? 900 : innerHeight) - 252)) : 0
  const layers = [shownAt?.id, peek?.id].filter((x, i, a): x is string => !!x && a.indexOf(x) === i)

  return (
    <div aria-label={label} role="navigation" className="relative z-30 flex min-h-0 flex-1 flex-col">
      {/* A list short enough to take in at a glance has nothing to filter. */}
      {all.length > 8 && (
        <label className="mr-3 flex h-8 items-center gap-2 rounded-[8px] px-2 text-ink-3 transition-colors focus-within:bg-[var(--shell-on)] hover:bg-[var(--shell-hover)]">
          <Search size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${all.length} ${label.toLowerCase()}`} aria-label={`Filter ${label.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3" />
        </label>
      )}

      <div ref={list} onPointerLeave={leave} className="min-h-0 flex-1 overflow-y-auto pb-6 pr-3 [mask-image:linear-gradient(to_bottom,transparent,black_8px,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shown.map((g) => {
          const open = words.length > 0 || !shut.includes(g.id)
          return (
            <div key={g.id} className="pt-3">
              <button type="button" aria-expanded={open} onClick={() => setShut((s) => (s.includes(g.id) ? s.filter((x) => x !== g.id) : [...s, g.id]))} className="ring-focus group/g flex h-7 w-full items-center gap-1.5 rounded-[7px] px-2 text-left text-[12px] text-ink-3 transition-colors hover:text-ink-2">
                {g.name}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`opacity-0 transition-[transform,opacity] duration-200 group-hover/g:opacity-100 ${open ? 'rotate-90' : ''}`}>
                  <path d="M9.5 6l6 6-6 6" />
                </svg>
                <span className="tnum ml-auto">{g.items.length}</span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div key="items" className="flex flex-col gap-0.5 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 40, opacity: { duration: 0.15 } }}>
                    {g.items.map((x) => {
                      const on = x.id === current
                      return (
                        <button
                          key={x.id}
                          type="button"
                          data-id={x.id}
                          aria-current={on ? 'page' : undefined}
                          onClick={() => onPick(x.id)}
                          onPointerEnter={(e) => aim(x.id, e.currentTarget)}
                          onFocus={(e) => aim(x.id, e.currentTarget)}
                          onBlur={leave}
                          className={`ring-focus flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[13.5px] transition-colors duration-150 ${on ? 'bg-[var(--shell-on)] text-ink' : 'text-ink-2 hover:bg-[var(--shell-hover)] hover:text-ink'}`}
                        >
                          <span className="min-w-0 flex-1 truncate">{x.name}</span>
                          {x.pro ? <span className="text-[11px] text-ink-3">Pro</span> : x.free && <span className="text-[11px] text-ink-3">Free</span>}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        {!shown.length && <p className="px-2 pt-6 text-[13px] text-ink-3">Nothing called “{q}”.</p>}
      </div>

      {/* The preview of the name under the pointer, beside the list. */}
      <AnimatePresence>
        {peek && preview && (
          <motion.div
            key="peek"
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-50 w-[288px] overflow-hidden rounded-[16px] bg-surface shadow-modal"
            initial={{ opacity: 0, scale: 0.97, x: peek.x, y: top }}
            animate={shownAt ? { opacity: 1, scale: 1, x: shownAt.x, y: top } : { opacity: 0, scale: 0.97, x: peek.x, y: top }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 42 }}
          >
            <div className="relative h-[172px] overflow-hidden">
              {layers.map((id) => (
                <div key={id} className="absolute inset-0 transition-opacity duration-150" style={{ opacity: id === shownAt?.id ? 1 : 0 }}>
                  {preview(id, () => setReadyId(id))}
                </div>
              ))}
            </div>
            <div className="px-3.5 pb-3 pt-2.5 shadow-[inset_0_1px_0_var(--line)]">
              <p className="truncate text-[13px] text-ink">{peeked?.name}</p>
              {peeked?.line && <p className="truncate text-[12px] text-ink-3">{peeked.line}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
