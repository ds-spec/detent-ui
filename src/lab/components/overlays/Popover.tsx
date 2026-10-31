'use client'

import { cloneElement, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { tap } from '../../lib/feel'
import { ease, spring } from '../../lib/motion'
import { Layer, fill, frameOf, inFrame, originOf, place, useDismiss, useHost, useReposition } from '../../lib/layer'
import type { Align, Side } from '../../lib/layer'

/** For demos and tests: open and close it without touching focus. */
export type PopoverHandle = { open(): void; close(): void }

const ROTATE: Record<Side, number> = { bottom: 0, top: 180, right: -90, left: 90 }

/**
 * A panel that opens beside its button and points at it. It grows out of the point it's
 * pointing from, flips to the other side when there's no room, and slides along to stay on
 * screen; when it slides, the arrow slides the other way and keeps pointing at the button. It
 * follows the button as the page scrolls, and resizes with whatever is inside.
 *
 * Opening moves focus into it, Escape or a press outside closes it, and focus goes back to
 * the button.
 */
export function Popover({
  trigger,
  children,
  side = 'bottom',
  align = 'center',
  arrow = true,
  label,
  className = '',
  ref,
}: {
  /** The button that opens it. It gets the popover's ARIA wiring. */
  trigger: ReactElement<Record<string, unknown>>
  /** What's inside. */
  children: ReactNode
  /** Which side of the button it prefers. */
  side?: Side
  /** How it lines up with the button along that side. */
  align?: Align
  /** Draw the arrow that points at the button. */
  arrow?: boolean
  /** Accessible name for the panel. */
  label: string
  /** Classes for the panel: its width and padding, say. */
  className?: string
  ref?: Ref<PopoverHandle>
}) {
  const [state, setState] = useState<{ quiet: boolean } | null>(null)
  const [at, setAt] = useState<ReturnType<typeof place> | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const { contained, frame } = useHost()
  const reduce = useReducedMotion()

  const measure = () => {
    if (!panel.current || !anchor.current) return
    const f = frameOf(frame)
    const next = place(inFrame(anchor.current.getBoundingClientRect(), f), { w: panel.current.offsetWidth, h: panel.current.offsetHeight }, f, side, align, arrow ? 12 : 8)
    setAt((a) => (a && a.x === next.x && a.y === next.y && a.side === next.side && a.arrow === next.arrow ? a : next))
  }
  useLayoutEffect(() => {
    if (state && !at) measure()
  })
  useReposition(!!state, measure)
  // Whatever's inside can change size; stay on the button when it does.
  useEffect(() => {
    if (!state || !panel.current) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(panel.current)
    return () => ro.disconnect()
  })

  const close = () => {
    const quiet = state?.quiet
    const inside = panel.current?.contains(document.activeElement)
    setState(null)
    if (!quiet && inside) anchor.current?.querySelector<HTMLElement>('button,[tabindex]')?.focus({ preventScroll: true })
  }
  useDismiss(!!state, [panel, anchor], close)

  // Move focus in once it's placed, unless a demo opened it.
  useEffect(() => {
    if (!state || state.quiet || !at) return
    const first = panel.current?.querySelector<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])')
    ;(first ?? panel.current)?.focus({ preventScroll: true })
    // Only when it first lands, not on every reposition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, at === null])

  useImperativeHandle(ref, () => ({
    open: () => {
      setAt(null)
      setState({ quiet: true })
    },
    close: () => setState(null),
  }))

  return (
    <>
      <span
        ref={anchor}
        className="inline-flex"
        onClick={() => {
          if (state) return close()
          tap()
          setAt(null)
          setState({ quiet: false })
        }}
      >
        {cloneElement(trigger, { 'aria-haspopup': 'dialog', 'aria-expanded': !!state })}
      </span>
      <Layer>
        <div className={`${fill(contained)} pointer-events-none z-50`}>
          <AnimatePresence>
            {state && (
              <motion.div
                key="popover"
                ref={panel}
                role="dialog"
                aria-label={label}
                tabIndex={-1}
                className={`absolute left-0 top-0 rounded-menu bg-surface shadow-modal outline-none ${className}`}
                style={{ x: at?.x ?? 0, y: at?.y ?? 0, visibility: at ? 'visible' : 'hidden', transformOrigin: at ? originOf(at.side, at.arrow) : undefined, pointerEvents: 'auto' }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                animate={at ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.13, ease: ease.out } }}
                transition={spring.snappy}
              >
                {arrow && at && <Arrow side={at.side} at={at.arrow} />}
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layer>
    </>
  )
}

/** The point on the panel's near edge: the panel's own surface, with its hairline drawn up the two slopes. */
function Arrow({ side, at }: { side: Side; at: number }) {
  const across = side === 'top' || side === 'bottom'
  const pos = across ? { left: at - 9, [side === 'bottom' ? 'top' : 'bottom']: -8 } : { top: at - 4, [side === 'right' ? 'left' : 'right']: -13 }
  return (
    <svg aria-hidden width="18" height="9" viewBox="0 0 18 9" className="absolute" style={{ ...pos, transform: `rotate(${ROTATE[side]}deg)` }}>
      <path d="M0 9 L7.3 1.6 Q9 0 10.7 1.6 L18 9 Z" fill="var(--surface)" />
      <path d="M0.5 8.6 L7.3 1.6 Q9 0 10.7 1.6 L17.5 8.6" fill="none" stroke="var(--line)" strokeWidth="1" />
    </svg>
  )
}
