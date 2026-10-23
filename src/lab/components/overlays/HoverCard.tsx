'use client'

import { cloneElement, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ease, spring } from '../../lib/motion'
import { Layer, fill, frameOf, inFrame, originOf, place, useHost, useReposition } from '../../lib/layer'
import type { Align, Side } from '../../lib/layer'

/** For demos and tests: open and close it as a hover would. */
export type HoverCardHandle = { open(): void; close(): void }

/**
 * A preview that opens when the pointer rests on a link: a person, a repo, a pull request. It
 * waits until you mean it, so passing over a link shows nothing. Moving from the link onto the
 * card keeps it open, and it lingers a beat after you leave so a shaky hand doesn't lose it.
 * When its content has to load, it opens at once with a placeholder in the same shape and grows
 * to fit what arrives, smoothly, without the card jumping. Keyboard focus opens it too.
 */
export function HoverCard({
  trigger,
  children,
  load,
  side = 'bottom',
  align = 'start',
  width = 300,
  openDelay = 450,
  closeDelay = 200,
  label,
  ref,
}: {
  /** The link or name it previews. */
  trigger: ReactElement<Record<string, unknown>>
  /** What's in the card, when it's already known. */
  children?: ReactNode
  /** Fetches what's in the card the first time it opens. A placeholder shows until it settles. */
  load?: () => Promise<ReactNode>
  /** Which side of the link it prefers. */
  side?: Side
  /** How it lines up with the link. */
  align?: Align
  /** Its width in pixels. */
  width?: number
  /** How long the pointer has to rest before it opens, in ms. */
  openDelay?: number
  /** How long it lingers after the pointer leaves, in ms. */
  closeDelay?: number
  /** Accessible name for the card. */
  label: string
  ref?: Ref<HoverCardHandle>
}) {
  const [shown, setShown] = useState(false)
  const [loaded, setLoaded] = useState<ReactNode>(null)
  const [height, setHeight] = useState<number | null>(null)
  const [at, setAt] = useState<ReturnType<typeof place> | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const timers = useRef({ open: 0, close: 0 })
  const fetched = useRef(false)
  const { contained, frame } = useHost()
  const reduce = useReducedMotion()
  const content = load ? loaded : children

  useEffect(() => {
    const t = timers.current
    return () => {
      clearTimeout(t.open)
      clearTimeout(t.close)
    }
  }, [])

  const open = () => {
    clearTimeout(timers.current.close)
    setAt(null)
    setShown(true)
    if (load && !fetched.current) {
      fetched.current = true
      load().then(setLoaded)
    }
  }
  const close = () => {
    clearTimeout(timers.current.open)
    setShown(false)
  }
  const soon = () => {
    clearTimeout(timers.current.close)
    clearTimeout(timers.current.open)
    timers.current.open = window.setTimeout(open, openDelay)
  }
  const later = () => {
    clearTimeout(timers.current.open)
    timers.current.close = window.setTimeout(close, closeDelay)
  }

  // Follow the content's height, so the card grows when the real thing replaces the placeholder.
  useLayoutEffect(() => {
    if (!shown || !inner.current) return
    const el = inner.current
    const read = () => setHeight(el.offsetHeight)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shown])

  const measure = () => {
    if (!anchor.current || height === null) return
    const f = frameOf(frame)
    setAt(place(inFrame(anchor.current.getBoundingClientRect(), f), { w: width, h: height }, f, side, align, 8))
  }
  useLayoutEffect(measure, [height, shown]) // eslint-disable-line react-hooks/exhaustive-deps
  useReposition(shown, measure)

  useEffect(() => {
    if (!shown) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [shown])

  useImperativeHandle(ref, () => ({ open, close }))

  return (
    <>
      <span ref={anchor} className="inline-flex" onPointerEnter={(e) => e.pointerType !== 'touch' && soon()} onPointerLeave={later} onFocus={(e) => e.target.matches(':focus-visible') && open()} onBlur={close}>
        {cloneElement(trigger, { 'aria-expanded': shown })}
      </span>
      <Layer>
        <div className={`${fill(contained)} pointer-events-none z-50`}>
          <AnimatePresence>
            {shown && (
              <motion.div
                key="card"
                role="dialog"
                aria-label={label}
                onPointerEnter={() => clearTimeout(timers.current.close)}
                onPointerLeave={later}
                className="absolute left-0 top-0 overflow-hidden rounded-card bg-surface shadow-modal"
                style={{ width, x: at?.x ?? 0, y: at?.y ?? 0, visibility: at ? 'visible' : 'hidden', transformOrigin: at ? originOf(at.side, at.arrow) : undefined, pointerEvents: 'auto' }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: at ? 1 : 0, scale: 1, height: height ?? 'auto' }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14, ease: ease.exit } }}
                transition={{ ...spring.smooth, opacity: { duration: 0.18 } }}
              >
                <div ref={inner}>
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div key={content ? 'real' : 'placeholder'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: ease.out }}>
                      {content ?? <Placeholder />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layer>
    </>
  )
}

/** The shape of a profile while it loads: an avatar, a name and two lines. */
function Placeholder() {
  return (
    <div aria-label="Loading" className="p-4">
      <div className="flex items-center gap-3">
        <span className="size-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
        <span className="flex-1">
          <span className="block h-3 w-28 animate-pulse rounded-full bg-surface-2" />
          <span className="mt-2 block h-2.5 w-20 animate-pulse rounded-full bg-surface-2" />
        </span>
      </div>
      <span className="mt-4 block h-2.5 w-full animate-pulse rounded-full bg-surface-2" />
      <span className="mt-2 block h-2.5 w-3/4 animate-pulse rounded-full bg-surface-2" />
    </div>
  )
}
