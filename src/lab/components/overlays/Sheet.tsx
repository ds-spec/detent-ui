'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { PointerEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Close, Expand, Shrink } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press, spring } from '../../lib/motion'
import { Layer, fill, useDismiss, useFocusTrap, useHost, useScrollLock } from '../../lib/layer'

/** For demos and tests: open it, close it, move it to a detent, or pull it partway and let go, without touching focus. */
export type SheetHandle = { open(): void; close(): void; snap(detent: number): void; tug(px: number): void }

/** Landing on a detent: quick, with the smallest overshoot, like a catch clicking into place. */
const CLICK = { type: 'spring', stiffness: 520, damping: 30, mass: 0.8 } as const

/**
 * A panel that slides in from the edge and rests at detents: set sizes it clicks into, like a
 * dial finding its notches. Drag its edge or its top and it follows; let go and it settles on the
 * nearest detent, carried by how fast you were moving. Past the smallest it lifts away instead,
 * and goes if you've pulled it a third of the way or flicked it, springing back if not. Past the
 * largest it gives a little and no further. A button beside Close steps between detents for
 * anyone not dragging. The backdrop thins as it's pulled away, and inside a window the app
 * behind steps back while it's open.
 *
 * From the right it's a side panel for details; from the bottom it's a drawer with a handle,
 * the way a phone does it. The body is a container, so what's in it can lay out for each detent.
 */
export function Sheet({
  trigger,
  side = 'right',
  detents,
  title,
  description,
  children,
  footer,
  open: controlled,
  onOpenChange,
  onDetentChange,
  ref,
}: {
  /** What opens it. */
  trigger?: ReactNode
  /** Where it comes from. */
  side?: 'right' | 'bottom'
  /** The sizes it rests at, smallest first: px, or a share of the space when 1 or less. It opens at the first. */
  detents?: number[]
  /** The heading. */
  title: ReactNode
  /** A line under the heading. */
  description?: ReactNode
  /** The body. It scrolls when it's long. */
  children?: ReactNode
  /** Actions pinned along the bottom. */
  footer?: ReactNode
  /** Open or closed, when you control it. */
  open?: boolean
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Called with the detent it settles on. */
  onDetentChange?: (detent: number) => void
  ref?: Ref<SheetHandle>
}) {
  const [own, setOwn] = useState(false)
  const shown = controlled ?? own
  const [quiet, setQuiet] = useState(false)
  const [at, setAt] = useState(0)
  const [grabbed, setGrabbed] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const room = useRef<HTMLDivElement>(null)
  const drag = useRef<{ start: number; from: number; pos: number; t: number; v: number; near: number } | null>(null)
  const across = side === 'right'
  const wanted = detents ?? (across ? [400, 640] : [0.5, 0.9])
  // Sizes in px, worked out against the space the sheet has when it opens.
  const sizes = useRef<number[]>([400])
  const extent = useMotionValue(across ? 400 : 320)
  const offset = useMotionValue(0)
  // The backdrop thins as the sheet is pulled away.
  const shade = useTransform(offset, (v) => 1 - Math.min(1, Math.max(0, v) / (sizes.current[0] || 400)))
  const { contained, recede } = useHost()
  const reduce = useReducedMotion()
  const id = useId()

  const set = (next: boolean) => {
    if (controlled === undefined) setOwn(next)
    onOpenChange?.(next)
  }
  const close = () => set(false)

  const measure = () => {
    const box = room.current
    const space = (across ? box?.clientWidth : box?.clientHeight) ?? 800
    // Keep 16px clear of the far edge, and every detent at least a little apart.
    sizes.current = wanted.map((d) => Math.min(space - 16, d <= 1 ? d * space : d))
    return sizes.current
  }

  useEffect(() => {
    if (!shown) return
    offset.set(0)
    extent.set(measure()[0])
    const first = setTimeout(() => setAt(0))
    recede(true)
    return () => {
      clearTimeout(first)
      recede(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, recede, offset, extent])
  useDismiss(shown, [panel], close)
  useFocusTrap(panel, shown, quiet)
  useScrollLock(shown && !contained)

  const nearest = (px: number) => sizes.current.reduce((best, s, i) => (Math.abs(s - px) < Math.abs(sizes.current[best] - px) ? i : best), 0)

  const snap = (i: number) => {
    const to = Math.max(0, Math.min(sizes.current.length - 1, i))
    animate(extent, sizes.current[to], reduce ? { duration: 0 } : CLICK)
    animate(offset, 0, spring.release)
    if (to !== at) {
      setAt(to)
      onDetentChange?.(to)
    }
  }

  /** Let go: lifted away past the smallest detent, it goes or springs back; otherwise it finds a detent. */
  const release = (v: number) => {
    const out = offset.get()
    if (out > 0) {
      if (out > sizes.current[0] / 3 || v < -600) return close()
      return snap(0)
    }
    snap(nearest(extent.get() + v * 0.12))
  }

  useImperativeHandle(ref, () => ({
    open: () => {
      setQuiet(true)
      set(true)
    },
    close,
    snap,
    tug: (px) => {
      animate(offset, px, { duration: 0.5, ease: ease.inOut }).then(() => release(0))
    },
  }))

  // Dragging grows it toward the middle and shrinks it toward its edge; below the smallest detent it lifts away.
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button,a,input,textarea,select')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const pos = across ? e.clientX : e.clientY
    drag.current = { start: pos, from: extent.get() - Math.max(0, offset.get()), pos, t: performance.now(), v: 0, near: at }
    setGrabbed(true)
  }
  const move = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const pos = across ? e.clientX : e.clientY
    const now = performance.now()
    d.v = ((d.pos - pos) / Math.max(1, now - d.t)) * 1000
    d.pos = pos
    d.t = now
    const raw = d.from + (d.start - pos)
    const [min, max] = [sizes.current[0], sizes.current[sizes.current.length - 1]]
    extent.set(raw > max ? max + Math.sqrt(raw - max) * 2.4 : Math.max(min, raw))
    offset.set(raw < min ? min - raw : 0)
    // Passing a detent clicks, the way a dial does.
    const near = nearest(Math.min(max, Math.max(min, raw)))
    if (near !== d.near && Math.abs(raw - sizes.current[near]) < 12) {
      d.near = near
      tap()
    }
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    setGrabbed(false)
    if (d) release(d.v)
  }
  const grip = { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up }

  const out = across ? { x: '100%' } : { y: '100%' }
  const wide = wanted.length > 1 && at === wanted.length - 1
  return (
    <>
      {trigger && (
        <span
          className="inline-flex"
          onClick={() => {
            tap()
            setQuiet(false)
            set(true)
          }}
        >
          {trigger}
        </span>
      )}
      <Layer>
        <AnimatePresence>
          {shown && (
            <div key="sheet" ref={room} className={`${fill(contained)} z-50`} style={{ pointerEvents: 'auto' }}>
              <motion.div aria-hidden className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                <motion.div className="absolute inset-0 bg-[rgb(0_0_0/0.24)] dark:bg-[rgb(0_0_0/0.55)]" style={{ opacity: shade }} />
              </motion.div>
              <motion.div
                className={across ? 'absolute bottom-2 right-2 top-2 flex' : 'absolute inset-x-2 bottom-2 flex'}
                style={across ? { width: extent } : { height: extent }}
                initial={reduce ? { opacity: 0 } : out}
                animate={reduce ? { opacity: 1 } : { x: 0, y: 0 }}
                exit={reduce ? { opacity: 0 } : { ...out, transition: { duration: 0.24, ease: ease.exit } }}
                transition={spring.soft}
              >
                <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} className="relative flex min-h-0 w-full flex-col rounded-card bg-surface shadow-modal outline-none" style={across ? { x: offset } : { y: offset }}>
                  {/* The grip: a column of dots on the edge you pull, darker while it's held. */}
                  {across && (
                    <div aria-hidden className="group absolute inset-y-0 -left-2 z-10 flex w-5 cursor-col-resize touch-none items-center justify-center" {...grip}>
                      <span className="flex flex-col gap-[3px] rounded-full bg-surface px-[3px] py-1.5 shadow-raised transition-opacity duration-150">
                        {[0, 1, 2, 3].map((i) => (
                          <span key={i} className={`size-[3px] rounded-full transition-colors duration-150 ${grabbed ? 'bg-ink' : 'bg-ink-3 group-hover:bg-ink-2'}`} />
                        ))}
                      </span>
                    </div>
                  )}
                  <div className={`shrink-0 touch-none select-none px-6 ${across ? 'pt-6' : 'pt-2.5'} cursor-grab active:cursor-grabbing`} {...grip}>
                    {!across && <span aria-hidden className={`mx-auto mb-3.5 block h-[5px] w-9 rounded-full transition-colors duration-150 ${grabbed ? 'bg-ink-3' : 'bg-line-strong'}`} />}
                    <div className="flex items-start gap-1 pb-4">
                      <div className="min-w-0 flex-1 pr-2">
                        <h2 id={`${id}-title`} className="text-title text-ink">
                          {title}
                        </h2>
                        {description && <p className="mt-1 text-callout text-ink-2">{description}</p>}
                      </div>
                      {wanted.length > 1 && (
                        <motion.button
                          type="button"
                          aria-label={wide ? 'Make smaller' : 'Make larger'}
                          whileTap={press}
                          onClick={() => {
                            tap()
                            snap(wide ? 0 : at + 1)
                          }}
                          className="ring-focus -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          {wide ? <Shrink size={15} /> : <Expand size={15} />}
                        </motion.button>
                      )}
                      <motion.button
                        type="button"
                        aria-label="Close"
                        whileTap={press}
                        onClick={() => {
                          tap()
                          close()
                        }}
                        className="ring-focus -mr-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        <Close size={16} />
                      </motion.button>
                    </div>
                  </div>
                  <div className="@container min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
                  {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Layer>
    </>
  )
}
