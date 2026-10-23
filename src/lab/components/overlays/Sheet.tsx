'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { PointerEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Close } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press, spring } from '../../lib/motion'
import { Layer, fill, useDismiss, useFocusTrap, useHost, useScrollLock } from '../../lib/layer'

/** For demos and tests: open it, close it, or pull it partway and let go, without touching focus. */
export type SheetHandle = { open(): void; close(): void; tug(px: number): void }

/**
 * A panel that slides in from the edge and floats a little off it. You can drag it away by its
 * top: past a third of the way, or with a quick flick, it goes; short of that it springs back.
 * Pulled the wrong way it gives a little, like a rubber band, and no further. The backdrop
 * thins as you drag, and inside a window the app behind steps back while it's open.
 *
 * From the right it's a side panel for details; from the bottom it's a drawer with a handle,
 * the way a phone does it.
 */
export function Sheet({
  trigger,
  side = 'right',
  title,
  description,
  children,
  footer,
  open: controlled,
  onOpenChange,
  ref,
}: {
  /** What opens it. */
  trigger?: ReactNode
  /** Where it comes from. */
  side?: 'right' | 'bottom'
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
  ref?: Ref<SheetHandle>
}) {
  const [own, setOwn] = useState(false)
  const shown = controlled ?? own
  const [quiet, setQuiet] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const drag = useRef<{ start: number; at: number; t: number; v: number } | null>(null)
  const across = side === 'right'
  const offset = useMotionValue(0)
  const size = useRef(400)
  // The backdrop thins as the sheet is pulled away.
  const shade = useTransform(offset, (v) => 1 - Math.min(1, Math.max(0, v) / size.current))
  const { contained, recede } = useHost()
  const reduce = useReducedMotion()
  const id = useId()

  const set = (next: boolean) => {
    if (controlled === undefined) setOwn(next)
    onOpenChange?.(next)
  }
  const close = () => set(false)

  useEffect(() => {
    if (!shown) return
    offset.set(0)
    recede(true)
    return () => recede(false)
  }, [shown, recede, offset])
  useDismiss(shown, [panel], close)
  useFocusTrap(panel, shown, quiet)
  useScrollLock(shown && !contained)

  /** Let go at `at` px out, moving at `v` px/s: go, or spring back. */
  const release = (at: number, v: number) => {
    if (at > size.current / 3 || v > 600) return close()
    animate(offset, 0, spring.release)
  }

  useImperativeHandle(ref, () => ({
    open: () => {
      setQuiet(true)
      set(true)
    },
    close,
    tug: (px) => {
      animate(offset, px, { duration: 0.5, ease: ease.inOut }).then(() => release(px, 0))
    },
  }))

  // Pulling by the top: toward the edge follows the finger, the wrong way only gives a little.
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button,a,input,textarea,select')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    size.current = (across ? panel.current?.offsetWidth : panel.current?.offsetHeight) ?? 400
    drag.current = { start: across ? e.clientX : e.clientY, at: 0, t: performance.now(), v: 0 }
  }
  const move = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const raw = (across ? e.clientX : e.clientY) - d.start
    const now = performance.now()
    d.v = ((raw - d.at) / Math.max(1, now - d.t)) * 1000
    d.at = raw
    d.t = now
    offset.set(raw >= 0 ? raw : -Math.sqrt(-raw) * 2.2)
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (d) release(d.at, d.v)
  }

  const out = across ? { x: '100%' } : { y: '100%' }
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
            <div key="sheet" className={`${fill(contained)} z-50`} style={{ pointerEvents: 'auto' }}>
              <motion.div aria-hidden className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                <motion.div className="absolute inset-0 bg-[rgb(0_0_0/0.24)] dark:bg-[rgb(0_0_0/0.55)]" style={{ opacity: shade }} />
              </motion.div>
              <motion.div
                className={across ? 'absolute bottom-2 right-2 top-2 flex w-[min(400px,calc(100%-16px))]' : 'absolute inset-x-2 bottom-2 flex max-h-[85%]'}
                initial={reduce ? { opacity: 0 } : out}
                animate={reduce ? { opacity: 1 } : { x: 0, y: 0 }}
                exit={reduce ? { opacity: 0 } : { ...out, transition: { duration: 0.24, ease: ease.exit } }}
                transition={spring.soft}
              >
                <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} className="flex min-h-0 w-full flex-col rounded-card bg-surface shadow-modal outline-none" style={across ? { x: offset } : { y: offset }}>
                  <div className={`shrink-0 touch-none select-none px-6 ${across ? 'cursor-grab pt-6 active:cursor-grabbing' : 'cursor-grab pt-2.5 active:cursor-grabbing'}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
                    {!across && <span aria-hidden className="mx-auto mb-3.5 block h-[5px] w-9 rounded-full bg-line-strong" />}
                    <div className="flex items-start gap-3 pb-4">
                      <div className="min-w-0 flex-1">
                        <h2 id={`${id}-title`} className="text-title text-ink">
                          {title}
                        </h2>
                        {description && <p className="mt-1 text-callout text-ink-2">{description}</p>}
                      </div>
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
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
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
