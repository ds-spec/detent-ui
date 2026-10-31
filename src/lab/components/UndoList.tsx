'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { Bin, Undo } from '../icons'
import { useStack } from '../lib/hooks'
import { ease, press, spring } from '../lib/motion'
import { RollingText } from '../ui/RollingText'
import { Button } from '../ui/Button'
import { FileGlyph } from '../ui/FileGlyph'
import { Kbd } from '../ui/Kbd'

export type Entry = { id: string; name: string; meta: string; /** A CSS background for image files. */ preview?: string }
/** For demos and tests: point at a row, delete, undo and start over without touching focus. */
export type UndoHandle = { point(id: string | null): void; remove(id: string): void; undo(): void; reset(): void }

const ROW = 56
const THUMB = 28
const THUMB_W = 23
/** Resting tilt of the thumbnails in the tray, oldest first. */
const TILT = [-9, 5, -3]
const fold = { type: 'spring', bounce: 0, duration: 0.36 } as const

/**
 * A file list where delete is instant and forgiving. The row folds away and its thumbnail
 * drops into a tray at the bottom of the card; everything deleted in a burst gathers there
 * as one batch with a single Undo. Each new delete restarts the clock, hovering the tray
 * pauses it, and ⌘Z works too. Undo puts every file back in its original place.
 *
 * The list and the tray both reserve their space, so nothing outside the card ever moves.
 */
export function UndoList({
  initial,
  title = 'Recent files',
  seconds = 5,
  onDelete,
  onUndo,
  ref,
}: {
  /** The files to list. */
  initial: Entry[]
  /** The list's heading. */
  title?: string
  /** How long a deleted batch can be undone. Every new delete restarts it. */
  seconds?: number
  /** Called once the undo window closes, with every file deleted in that batch. Delete them for real here. */
  onDelete?: (entries: Entry[]) => void
  /** Called with the files put back by Undo or ⌘Z. */
  onUndo?: (entries: Entry[]) => void
  ref?: Ref<UndoHandle>
}) {
  const [items, setItems] = useState(initial)
  const itemsRef = useRef(items)
  const calls = useRef({ onDelete, onUndo })
  useLayoutEffect(() => {
    itemsRef.current = items
    calls.current = { onDelete, onUndo }
  })
  const [trash, setTrash] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [pointed, setPointed] = useState<string | null>(null)
  const left = useMotionValue(1)
  const pausedRef = useRef(false)
  const trashRef = useRef(trash)
  trashRef.current = trash
  const rows = useRef<Record<string, HTMLDivElement | null>>({})
  const badges = useRef<Record<string, HTMLSpanElement | null>>({})
  const from = useRef(new Map<string, DOMRect>())
  // Rows fold by their own height and are stacked by transform, so one folding never moves the rows below it in the layout.
  const list = useRef<HTMLUListElement>(null)
  useStack(list)

  const visible = items.filter((i) => !trash.includes(i.id))
  const binned = trash.map((id) => items.find((i) => i.id === id)!).filter(Boolean)

  const remove = (id: string) => {
    if (trashRef.current.includes(id)) return
    const badge = badges.current[id]
    if (badge) from.current.set(id, badge.getBoundingClientRect())
    // Keep keyboard users in the list: focus moves to the neighbour.
    const at = visible.findIndex((i) => i.id === id)
    const next = visible[at + 1] ?? visible[at - 1]
    if (next && document.activeElement === rows.current[id]) rows.current[next.id]?.focus()
    setTrash((t) => [...t, id])
  }
  const restore = () => {
    const back = itemsRef.current.filter((i) => trashRef.current.includes(i.id))
    setTrash([])
    if (back.length) calls.current.onUndo?.(back)
  }

  useImperativeHandle(ref, () => ({
    point: setPointed,
    remove: (id) => {
      setPointed(null)
      remove(id)
    },
    undo: restore,
    reset: () => {
      setTrash([])
      setItems(initial)
    },
  }))

  // One clock for the whole batch. It restarts on every delete and only drains while
  // nobody is hovering the tray.
  useEffect(() => {
    if (!trash.length) return
    left.set(1)
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      // Real elapsed time, capped so a long-hidden tab doesn't expire on return.
      const dt = Math.min(500, t - last)
      last = t
      if (!pausedRef.current) {
        const next = left.get() - dt / (seconds * 1000)
        if (next <= 0) {
          left.set(0)
          const gone = trashRef.current
          calls.current.onDelete?.(itemsRef.current.filter((i) => gone.includes(i.id)))
          setItems((l) => l.filter((i) => !gone.includes(i.id)))
          setTrash([])
          return
        }
        left.set(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [trash, seconds, left])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && trashRef.current.length) {
        e.preventDefault()
        restore()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const hold = (on: boolean) => {
    pausedRef.current = on
    setPaused(on)
  }

  return (
    <div className="w-[440px] max-w-full rounded-card bg-surface p-2 shadow-float">
      <div className="flex h-11 items-center justify-between px-3">
        <span className="text-callout font-medium">{title}</span>
        <span className="flex items-center gap-1 text-footnote text-ink-3">
          <RollingText text={String(visible.length)} className="tnum" />
          {visible.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Fixed height: rows fold away inside it, never moving what sits below the card. */}
      <div className="relative" style={{ height: ROW * initial.length }}>
        <ul ref={list} className="relative">
          <AnimatePresence initial={false}>
            {visible.map((it) => (
              <motion.li
                key={it.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: ROW, opacity: 1 }}
                exit={{ height: 0, opacity: 0, transition: { ...fold, opacity: { duration: 0.12 } } }}
                transition={fold}
                className="overflow-hidden"
              >
                <div
                  ref={(el) => {
                    rows.current[it.id] = el
                  }}
                  tabIndex={0}
                  aria-label={`${it.name}, ${it.meta}. Press Delete to remove.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                      e.preventDefault()
                      remove(it.id)
                    }
                  }}
                  className={`group/row flex items-center gap-3 rounded-row px-2.5 outline-none transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2 ${pointed === it.id ? 'bg-surface-2' : ''}`}
                  data-pointed={pointed === it.id || undefined}
                  style={{ height: ROW }}
                >
                  <span
                    ref={(el) => {
                      badges.current[it.id] = el
                    }}
                    className="flex"
                  >
                    <FileGlyph name={it.name} preview={it.preview} size={34} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-callout font-medium leading-5 text-ink">{it.name}</span>
                    <span className="block truncate text-footnote text-ink-3">{it.meta}</span>
                  </span>
                  <motion.button
                    tabIndex={-1}
                    aria-label={`Delete ${it.name}`}
                    onClick={() => remove(it.id)}
                    whileTap={press}
                    className="flex size-8 pointer-coarse:size-9 shrink-0 items-center justify-center rounded-full text-ink-3 opacity-0 pointer-coarse:opacity-100 transition-[color,background-color,opacity] duration-150 hover:bg-[color-mix(in_oklch,var(--danger)_11%,transparent)] hover:text-danger group-hover/row:opacity-100 group-focus-visible/row:opacity-100 group-data-[pointed]/row:opacity-100"
                  >
                    <Bin size={16} />
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <AnimatePresence>
          {visible.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              <span className="text-callout text-ink-2">Nothing left here</span>
              <Button
                size="sm"
                onClick={() => {
                  setTrash([])
                  setItems(initial)
                }}
              >
                <Undo size={15} />
                Restore files
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The tray. Its space is always reserved: a hint at rest, the undo bar while something is pending. */}
      <div className="relative mt-1 h-[56px]" onPointerEnter={() => hold(true)} onPointerLeave={() => hold(false)}>
        <AnimatePresence initial={false}>
          {binned.length ? (
            <motion.div
              key="bar"
              className="absolute inset-0 rounded-row bg-surface-2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: ease.out } }}
              transition={{ duration: 0.24, ease: ease.out }}
            />
          ) : (
            <motion.div
              key="hint"
              className="absolute inset-0 flex items-center justify-center gap-1.5 text-footnote text-ink-3 pointer-coarse:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.24 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <Kbd>⌫</Kbd> to delete
              <span className="mx-1 size-[3px] rounded-full bg-line-strong" />
              <Kbd>⌘</Kbd>
              <Kbd>Z</Kbd> to undo
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnails live outside the fading bar so they're visible for the whole flight. */}
        <div className="absolute left-3 top-1/2 h-[28px] w-[48px] -translate-y-1/2">
          <AnimatePresence>
            {binned.slice(-3).map((it, i, all) => (
              <Thumb key={it.id} item={it} slot={i} total={all.length} from={from.current} />
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {binned.length > 0 && (
            <motion.div
              key="content"
              className="absolute inset-y-0 left-[70px] right-2 flex items-center justify-between gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.24, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-callout font-medium">
                  <RollingText text={String(binned.length)} className="tnum" />
                  {binned.length === 1 ? 'file deleted' : 'files deleted'}
                </span>
                <span className="relative block h-4 overflow-hidden text-caption text-ink-3">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={paused ? 'paused' : 'counting'}
                      className="absolute inset-0 flex items-center gap-1 whitespace-nowrap"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.18, ease: ease.out }}
                    >
                      {paused ? 'Paused while you decide' : <Countdown left={left} seconds={seconds} />}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>

              <motion.button
                onClick={restore}
                whileTap={press}
                className="ring-focus flex h-9 shrink-0 items-center gap-2 rounded-full bg-ink pl-1.5 pr-2 text-footnote font-medium text-surface transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink),var(--surface)_14%)]"
              >
                <Ring left={left} />
                Undo
                <Kbd onInk>⌘Z</Kbd>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ───────────────────────────── Parts ───────────────────────────── */

/** A thumbnail that flies from its row into the tray, then rests in a small tilted stack. */
function Thumb({ item, slot, total, from }: { item: Entry; slot: number; total: number; from: Map<string, DOMRect> }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const s = useMotionValue(1)

  useLayoutEffect(() => {
    const start = from.get(item.id)
    const el = ref.current
    from.delete(item.id)
    if (!start || !el || reduce) return
    // Measure by centres, and convert screen pixels to local ones in case an ancestor is scaled.
    const me = el.getBoundingClientRect()
    const k = me.width / THUMB_W || 1
    x.set((start.left + start.width / 2 - (me.left + me.width / 2)) / k)
    y.set((start.top + start.height / 2 - (me.top + me.height / 2)) / k)
    s.set(start.width / me.width)
    animate(x, 0, spring.soft)
    animate(y, 0, spring.soft)
    animate(s, 1, spring.soft)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Newest sits on top at the right; older ones fan out behind it. Position, flight and
  // tilt live on separate layers so the tilt never bends the flight path.
  const offset = (slot - (total - 1)) * 10 + 22
  return (
    <motion.span
      className="absolute left-0 top-0"
      style={{ zIndex: slot }}
      initial={false}
      animate={{ x: offset }}
      exit={{ opacity: 0, y: 6, transition: { duration: 0.18, ease: ease.out } }}
      transition={spring.smooth}
    >
      <motion.span ref={ref} className="block" style={{ x, y, scale: s, width: THUMB_W, height: THUMB }}>
        <motion.span
          className="flex size-full"
          style={{ filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / 0.12))' }}
          initial={{ rotate: reduce ? TILT[slot + (3 - total)] : 0 }}
          animate={{ rotate: TILT[slot + (3 - total)] ?? 0 }}
          transition={spring.soft}
        >
          <FileGlyph name={item.name} preview={item.preview} size={THUMB} />
        </motion.span>
      </motion.span>
    </motion.span>
  )
}

/** The countdown ring around the undo arrow. It drains with the batch clock. */
function Ring({ left }: { left: MotionValue<number> }) {
  return (
    <span className="relative flex size-[26px] items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth="2" />
        <motion.circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ pathLength: left }} />
      </svg>
      <Undo size={13} />
    </span>
  )
}

function Countdown({ left, seconds }: { left: MotionValue<number>; seconds: number }) {
  const [n, setN] = useState(() => Math.max(1, Math.ceil(left.get() * seconds)))
  useMotionValueEvent(left, 'change', (v) => setN(Math.max(1, Math.ceil(v * seconds))))
  return (
    <>
      Gone for good in <RollingText text={`${n}s`} className="tnum" />
    </>
  )
}
