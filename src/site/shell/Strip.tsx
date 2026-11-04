'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { usePeek } from '../exhibit/Rail'
import type { RailGroup, RailItem } from '../exhibit/Rail'

/*
 * The library's index, the way Skiper keeps its own: a panel of its own floating down the left,
 * every piece numbered against a ruler of fine ticks that runs the whole height. Each piece's tick
 * is a little longer than the ruler's; where a family starts it's longer again. The one on show is
 * in blue with a line run in from the edge to it; point at another and it takes the line too, and
 * the piece opens beside the panel, running live. It hides with one press and remembers.
 */

export const STRIP_W = 248
/** Room between the panel and the window's edge, and between the panel and the page. */
export const STRIP_GAP = 8
const ROW = 28

type Row = { item: RailItem; n: number; first: boolean }

export function Strip({ groups, current, onPick, preview, label = 'Components', open, onHide }: { groups: RailGroup[]; current: string; onPick: (id: string) => void; preview?: (id: string, onReady: () => void) => ReactNode; label?: string; open: boolean; onHide: () => void }) {
  const [order, setOrder] = useState<'family' | 'name'>('family')
  const all = groups.flatMap((g) => g.items)
  // Numbers stay with the piece whichever way the list is sorted.
  const number = new Map(all.map((x, i) => [x.id, i + 1]))
  const rows: Row[] =
    order === 'name'
      ? [...all].sort((a, b) => a.name.localeCompare(b.name)).map((item) => ({ item, n: number.get(item.id) ?? 0, first: false }))
      : groups.flatMap((g) => g.items.map((item, i) => ({ item, n: number.get(item.id) ?? 0, first: i === 0 })))
  const { aim, leave, card } = usePeek(all, preview)
  const [hover, setHover] = useState<string | null>(null)

  // The one on show sits a third of the way down when the page opens, and stays in sight as you move.
  const list = useRef<HTMLDivElement>(null)
  const arrived = useRef(false)
  useLayoutEffect(() => {
    const box = list.current
    const el = box?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!box || !el || !open) return
    const top = el.offsetTop - box.clientHeight / 3
    if (!arrived.current) box.scrollTop = top
    else if (el.offsetTop < box.scrollTop + 40 || el.offsetTop > box.scrollTop + box.clientHeight - 60) box.scrollTo({ top, behavior: 'smooth' })
    arrived.current = true
  }, [current, order, open])

  return (
    <>
    <nav
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      className={`fixed z-20 hidden flex-col overflow-hidden rounded-[16px] bg-[var(--panel)] shadow-[var(--panel-edge)] transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(0.2,0.9,0.25,1)] lg:flex ${open ? '' : 'pointer-events-none -translate-x-[calc(100%+16px)] opacity-0'}`}
      style={{ top: STRIP_GAP, bottom: STRIP_GAP, left: STRIP_GAP, width: STRIP_W }}
    >
      <div className="flex h-14 shrink-0 items-center gap-1 pl-2 pr-2">
        <button type="button" onClick={onHide} aria-label="Hide the index" title="Hide" className="ring-focus grid size-8 place-items-center rounded-[9px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-[var(--shell-hover)] hover:text-ink active:scale-[0.94]">
          <PanelIcon />
        </button>
        <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
          {label}
          <sup className="tnum ml-0.5 text-[10.5px] text-ink-3">[{all.length}]</sup>
        </p>
        {all.length > 3 && (
          <button type="button" onClick={() => setOrder(order === 'family' ? 'name' : 'family')} className="ring-focus flex h-8 items-center gap-1 rounded-[9px] px-2 text-[13px] text-ink-3 transition-colors hover:bg-[var(--shell-hover)] hover:text-ink">
            {order === 'family' ? 'By family' : 'A to Z'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
            </svg>
          </button>
        )}
      </div>
      <div
        ref={list}
        onPointerLeave={() => {
          setHover(null)
          leave()
        }}
        className="relative min-h-0 flex-1 overflow-y-auto pb-[30vh] [mask-image:linear-gradient(to_bottom,transparent,black_16px,black_calc(100%-80px),transparent)] [scrollbar-width:none]"
      >
        {/* The ruler: fine ticks the whole way down, three to a row. */}
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 w-[7px] bg-[repeating-linear-gradient(to_bottom,var(--line-strong)_0_1px,transparent_1px_9.333px)]" style={{ height: rows.length * ROW + 64, backgroundPositionY: ROW / 2 - 0.5 }} />
        {rows.map(({ item, n, first }) => {
          const here = item.id === current
          const lit = here || item.id === hover
          return (
            <button
              key={item.id}
              type="button"
              aria-current={here ? 'page' : undefined}
              onClick={() => onPick(item.id)}
              onPointerEnter={(e) => {
                setHover(item.id)
                aim(item.id, e.currentTarget)
              }}
              onFocus={(e) => aim(item.id, e.currentTarget)}
              onBlur={leave}
              className="ring-focus relative flex w-full items-center text-left"
              style={{ height: ROW }}
            >
              <span aria-hidden className={`absolute left-0 top-1/2 h-px -translate-y-1/2 transition-[width,background-color] duration-200 [transition-timing-function:cubic-bezier(0.2,0.9,0.25,1)] ${here ? 'w-[34px] bg-[var(--accent)]' : lit ? 'w-[34px] bg-ink' : first && order === 'family' ? 'w-[16px] bg-ink-3' : 'w-[11px] bg-ink-3/60'}`} />
              <span className={`flex min-w-0 flex-1 items-baseline gap-2.5 pl-[22px] transition-[transform,color] duration-200 [transition-timing-function:cubic-bezier(0.2,0.9,0.25,1)] ${lit ? 'translate-x-[18px]' : ''} ${here ? 'text-[var(--accent-ink)]' : lit ? 'text-ink' : 'text-ink-2'}`}>
                <span className={`tnum w-5 shrink-0 text-[12px] ${lit ? '' : 'text-ink-3'}`}>{String(n).padStart(2, '0')}</span>
                <span className="truncate pr-6 text-[13.5px]">{item.name}</span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
    {/* Outside the panel, which clips and moves: the preview's place is the window's. */}
    {open && card}
    </>
  )
}

/** A panel beside a page: the shape of the button that hides or shows the index. */
export function PanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M9.5 4.5v15" />
    </svg>
  )
}
