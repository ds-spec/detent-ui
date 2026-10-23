'use client'

import { createContext, useCallback, useContext, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { ReactNode, Ref, RefObject } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Close } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press, spring } from '../../lib/motion'
import { Layer, fill, useDismiss, useFocusTrap, useHost, useScrollLock } from '../../lib/layer'

/** For demos and tests: open and close it without touching focus. */
export type DialogHandle = { open(): void; close(): void }

// A dialog opened from inside another pushes that one back, the way sheets stack on a phone.
const Stack = createContext<{ cover: (on: boolean) => void } | null>(null)

const WIDTH = { sm: 360, md: 440, lg: 560 }

/**
 * A dialog that appears where it will stay: in the middle, rising out of the page from a hair
 * smaller, quickly, with no travel and no bounce. A dialog opened from inside another pushes that
 * one back and dims it, and brings it forward again when it closes. One that has to be answered
 * gives a small shrug when you click outside instead of closing.
 *
 * Focus moves in and stays in until it closes, then goes back where it was. The page behind
 * stops scrolling without the scrollbar's space jumping.
 */
export function Dialog({
  trigger,
  open: controlled,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissable = true,
  initialFocus,
  ref,
}: {
  /** What opens it. A press on it opens the dialog. */
  trigger?: ReactNode
  /** Open or closed, when you control it. Leave out to let the dialog manage itself. */
  open?: boolean
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** The heading, read out when it opens. */
  title: ReactNode
  /** A line under the heading. */
  description?: ReactNode
  /** The body. */
  children?: ReactNode
  /** Actions along the bottom, right-aligned. */
  footer?: ReactNode
  /** Its width: 360, 440 or 560 pixels, never wider than the screen. */
  size?: keyof typeof WIDTH
  /** Whether a click outside closes it. Escape always does. */
  dismissable?: boolean
  /** What gets focus when it opens; the first focusable thing otherwise. */
  initialFocus?: RefObject<HTMLElement | null>
  ref?: Ref<DialogHandle>
}) {
  const [own, setOwn] = useState(false)
  const shown = controlled ?? own
  const [quiet, setQuiet] = useState(false)
  const [covered, setCovered] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const parent = useContext(Stack)
  const { contained, recede } = useHost()
  const reduce = useReducedMotion()
  const shrug = useAnimationControls()
  const id = useId()

  const set = (next: boolean) => {
    if (controlled === undefined) setOwn(next)
    onOpenChange?.(next)
  }
  const open = (byDemo: boolean) => {
    setQuiet(byDemo)
    set(true)
  }
  const close = () => set(false)

  useImperativeHandle(ref, () => ({ open: () => open(true), close }))

  // While open, cover the dialog under this one, or step the page back if there's none.
  useEffect(() => {
    if (!shown) return
    if (parent) parent.cover(true)
    else recede(true)
    return () => {
      if (parent) parent.cover(false)
      else recede(false)
    }
  }, [shown, parent, recede])

  useDismiss(shown, [panel], (why) => {
    if (why === 'outside' && !dismissable) {
      if (!reduce) shrug.start({ scale: [1, 1.02, 1], transition: { duration: 0.3, ease: ease.out } })
      return
    }
    close()
  })
  useFocusTrap(panel, shown, quiet, initialFocus)
  useScrollLock(shown && !contained)

  const cover = useCallback((on: boolean) => setCovered((n) => Math.max(0, n + (on ? 1 : -1))), [])
  const stack = useMemo(() => ({ cover }), [cover])

  return (
    <>
      {trigger && (
        <span
          className="inline-flex"
          onClick={() => {
            tap()
            open(false)
          }}
        >
          {trigger}
        </span>
      )}
      <Layer>
        <AnimatePresence>
          {shown && (
            <div key="dialog" className={`${fill(contained)} z-50 flex items-center justify-center p-4`} style={{ pointerEvents: 'auto' }}>
              <motion.div aria-hidden className="absolute inset-0 bg-[rgb(0_0_0/0.28)] dark:bg-[rgb(0_0_0/0.6)]" initial={{ opacity: 0 }} animate={{ opacity: parent ? 0.45 : 1 }} exit={{ opacity: 0, transition: { duration: 0.18 } }} transition={{ duration: 0.26, ease: ease.out }} />
              <motion.div animate={shrug} className="relative max-w-full" style={{ width: WIDTH[size] }}>
                <motion.div
                  ref={panel}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${id}-title`}
                  aria-describedby={description ? `${id}-text` : undefined}
                  tabIndex={-1}
                  className="relative rounded-card bg-surface p-6 shadow-modal outline-none"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: covered ? 0.94 : 1, y: covered ? -14 : 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.14, ease: ease.exit } }}
                  transition={{ duration: 0.22, ease: ease.out, y: spring.smooth, scale: covered ? spring.smooth : { duration: 0.22, ease: ease.out } }}
                >
                  <h2 id={`${id}-title`} className="pr-8 text-title text-ink">
                    {title}
                  </h2>
                  {description && (
                    <p id={`${id}-text`} className="mt-1.5 text-callout text-ink-2">
                      {description}
                    </p>
                  )}
                  <motion.button
                    type="button"
                    aria-label="Close"
                    whileTap={press}
                    onClick={() => {
                      tap()
                      close()
                    }}
                    className="ring-focus absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Close size={16} />
                  </motion.button>
                  <Stack.Provider value={stack}>
                    {children && <div className="mt-5">{children}</div>}
                    {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
                  </Stack.Provider>
                  {/* Covered by a dialog opened from this one: a shade, so the one in front reads as in front. */}
                  <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-ink" initial={false} animate={{ opacity: covered ? 0.05 : 0 }} transition={{ duration: 0.2 }} />
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Layer>
    </>
  )
}
