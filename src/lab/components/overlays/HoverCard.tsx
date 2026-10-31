'use client'

import { cloneElement, createContext, useContext, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode, Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { ease, spring } from '../../lib/motion'
import { Layer, fill, frameOf, inFrame, originOf, place, useHost, useReposition } from '../../lib/layer'
import type { Align, Side } from '../../lib/layer'

/** For demos and tests: open and close it as a hover would. */
export type HoverCardHandle = { open(): void; close(): void }

/** Everything the card needs to show one trigger's preview. */
type Spec = {
  id: string
  anchor: HTMLElement
  content?: ReactNode
  load?: () => Promise<ReactNode>
  side: Side
  align: Align
  width: number
  closeDelay: number
  label: string
}

type Group = {
  /** The pointer rests on a trigger: open after `delay`, or at once if a card is already up. */
  enter(spec: Spec, delay: number): void
  /** The pointer left a trigger or the card: close after its delay, unless it comes back. */
  leave(): void
  /** Open now, for focus or from a handle. */
  show(spec: Spec): void
  hide(): void
  active: string | null
}

const GroupContext = createContext<Group | null>(null)

/**
 * Hover cards that share one card. While a card is open, resting on another trigger in the group
 * doesn't close it and open another: the same card glides over to the new trigger and reshapes
 * to its preview, with no wait. For a moment after it closes, the next trigger opens at once too,
 * so reading along a line of mentions feels continuous. A lone HoverCard is a group of one.
 */
export function HoverCardGroup({ children, skipDelay = 400 }: {
  children: ReactNode
  /** How long after a card closes the next one still opens without waiting, in ms. */
  skipDelay?: number
}) {
  const [spec, setSpec] = useState<Spec | null>(null)
  const [shown, setShown] = useState(false)
  const [loaded, setLoaded] = useState<Record<string, ReactNode>>({})
  const state = useRef({ shown: false, closedAt: -Infinity, open: 0, close: 0, closeDelay: 200, asked: new Set<string>() })

  useEffect(() => {
    const s = state.current
    return () => {
      clearTimeout(s.open)
      clearTimeout(s.close)
    }
  }, [])

  const show = (next: Spec) => {
    const s = state.current
    clearTimeout(s.open)
    clearTimeout(s.close)
    s.shown = true
    s.closeDelay = next.closeDelay
    setSpec(next)
    setShown(true)
    if (next.load && !s.asked.has(next.id)) {
      s.asked.add(next.id)
      next.load().then((n) => setLoaded((l) => ({ ...l, [next.id]: n })))
    }
  }
  const hide = () => {
    const s = state.current
    clearTimeout(s.open)
    clearTimeout(s.close)
    if (s.shown) s.closedAt = performance.now()
    s.shown = false
    setShown(false)
  }
  const group: Group = {
    enter(next, delay) {
      const s = state.current
      clearTimeout(s.close)
      clearTimeout(s.open)
      // Warm: a card is up, or only just closed. Go straight to this one.
      if (s.shown || performance.now() - s.closedAt < skipDelay) return show(next)
      s.open = window.setTimeout(() => show(next), delay)
    },
    leave() {
      const s = state.current
      clearTimeout(s.open)
      clearTimeout(s.close)
      s.close = window.setTimeout(hide, s.closeDelay)
    },
    show,
    hide,
    active: shown ? (spec?.id ?? null) : null,
  }

  const content = spec ? (spec.load ? loaded[spec.id] : spec.content) : null
  return (
    <GroupContext.Provider value={group}>
      {children}
      <Card spec={spec} shown={shown} content={content} onEnter={() => clearTimeout(state.current.close)} onLeave={group.leave} onEscape={hide} />
    </GroupContext.Provider>
  )
}

/** The one card a group shows, placed beside whichever trigger owns it. */
function Card({ spec, shown, content, onEnter, onLeave, onEscape }: { spec: Spec | null; shown: boolean; content: ReactNode; onEnter: () => void; onLeave: () => void; onEscape: () => void }) {
  const [height, setHeight] = useState<number | null>(null)
  const inner = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  // Where the card sits, written straight from measuring: moving it never re-renders it.
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const origin = useMotionValue('0px 0px')
  const visibility = useMotionValue('hidden')
  // Whether the card is already on screen somewhere: then a new trigger is a glide, not a jump.
  const placed = useRef(false)
  const { contained, frame } = useHost()
  const reduce = useReducedMotion()
  const width = spec?.width ?? 300

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
    if (!spec || !shown || height === null) return
    const f = frameOf(frame)
    const next = place(inFrame(spec.anchor.getBoundingClientRect(), f), { w: width, h: height }, f, spec.side, spec.align, 8)
    origin.set(originOf(next.side, next.arrow))
    if (placed.current && !reduce) {
      animate(x, next.x, spring.smooth)
      animate(y, next.y, spring.smooth)
    } else {
      x.set(next.x)
      y.set(next.y)
    }
    placed.current = true
    visibility.set('visible')
  }
  useLayoutEffect(() => measure(), [height, shown, spec?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useReposition(shown, measure)

  useEffect(() => {
    if (!shown) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onEscape()
    const away = (e: PointerEvent) => {
      const t = e.target as Node
      if (e.pointerType === 'touch' && !card.current?.contains(t) && !spec?.anchor.contains(t)) onEscape()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', away)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', away)
    }
  }, [shown, onEscape, spec])

  return (
    <Layer>
      <div className={`${fill(contained)} pointer-events-none z-50`}>
        <AnimatePresence
          onExitComplete={() => {
            placed.current = false
            visibility.set('hidden')
          }}
        >
          {shown && spec && (
            <motion.div
              key="card"
              ref={card}
              role="dialog"
              aria-label={spec.label}
              onPointerEnter={onEnter}
              onPointerLeave={(e) => e.pointerType !== 'touch' && onLeave()}
              className="absolute left-0 top-0 overflow-hidden rounded-card bg-surface shadow-modal"
              style={{ x, y, visibility, transformOrigin: origin, pointerEvents: 'auto' }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, height: height ?? 'auto', width }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14, ease: ease.exit } }}
              transition={{ ...spring.smooth, opacity: { duration: 0.18 } }}
            >
              <div ref={inner} style={{ width }}>
                {/* A new person, or their profile arriving: the card's contents cross over, softly. */}
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={`${spec.id}-${content ? 'real' : 'wait'}`}
                    initial={{ opacity: 0, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(3px)', transition: { duration: 0.12 } }}
                    transition={{ duration: 0.24, ease: ease.out }}
                  >
                    {content ?? <Placeholder />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layer>
  )
}

type Props = {
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
  /** How long the pointer has to rest before it opens, in ms. Inside a group, only the first card waits. */
  openDelay?: number
  /** How long it lingers after the pointer leaves, in ms. */
  closeDelay?: number
  /** Accessible name for the card. */
  label: string
  ref?: Ref<HoverCardHandle>
}

/**
 * A preview that opens when the pointer rests on a link: a person, a repo, a pull request. It
 * waits until you mean it, so passing over a link shows nothing. Moving from the link onto the
 * card keeps it open, and it lingers a beat after you leave so a shaky hand doesn't lose it.
 * When its content has to load, it opens at once with a placeholder in the same shape and grows
 * to fit what arrives. Keyboard focus opens it too. Put several in a HoverCardGroup and they
 * share one card that glides from trigger to trigger.
 */
export function HoverCard(props: Props) {
  const group = useContext(GroupContext)
  return group ? (
    <Trigger {...props} />
  ) : (
    <HoverCardGroup>
      <Trigger {...props} />
    </HoverCardGroup>
  )
}

function Trigger({ trigger, children, load, side = 'bottom', align = 'start', width = 300, openDelay = 450, closeDelay = 200, label, ref }: Props) {
  const group = useContext(GroupContext)!
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const touched = useRef(false)
  const spec = (): Spec => ({ id, anchor: anchor.current!, content: children, load, side, align, width, closeDelay, label })
  useImperativeHandle(ref, () => ({ open: () => group.show(spec()), close: () => group.hide() }))
  return (
    <span
      ref={anchor}
      className="inline-flex"
      onPointerEnter={(e) => e.pointerType !== 'touch' && group.enter(spec(), openDelay)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && group.leave()}
      onClick={(e) => {
        if (!touched.current) return
        touched.current = false
        if (group.active === id) return
        e.preventDefault()
        group.show(spec())
      }}
      onPointerDown={(e) => void (touched.current = e.pointerType === 'touch')}
      onFocus={(e) => e.target.matches(':focus-visible') && group.show(spec())}
      onBlur={group.hide}
    >
      {cloneElement(trigger, { 'aria-expanded': group.active === id })}
    </span>
  )
}

/** The shape of a profile while it loads: an avatar, a name, a line, and the row of numbers. */
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
