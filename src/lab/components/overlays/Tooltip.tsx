'use client'

import { cloneElement, createContext, useContext, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ease, spring, dur } from '../../lib/motion'
import { Layer, fill, frameOf, inFrame, originOf, place, useHost } from '../../lib/layer'
import type { Side } from '../../lib/layer'
import { keyLabel } from '../../ui/Kbd'

type Tip = { id: string; label: string; shortcut?: string[]; side: Side; el: HTMLElement }
type Group = { enter(t: Tip): void; focus(t: Tip): void; leave(): void; hide(): void; register(id: string, get: () => Tip | null): () => void; shown: string | null; bubble: string }
const GroupContext = createContext<Group | null>(null)

export type TooltipGroupHandle = { show(n: number): void; hide(): void }

const WARM = 450
const PAD_X = 8

export function TooltipGroup({
  children,
  delay = 500,
  ref,
}: {
  children: ReactNode
  delay?: number
  ref?: Ref<TooltipGroupHandle>
}) {
  const [tip, setTip] = useState<Tip | null>(null)
  const [shown, setShown] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number; w: number; side: Side; arrow: number } | null>(null)
  const [glide, setGlide] = useState(false)
  const [dir, setDir] = useState(0)
  const live = useRef({ shown: false, tip: null as Tip | null })
  const warm = useRef(0)
  const timers = useRef({ open: 0, hide: 0 })
  const tips = useRef(new Map<string, () => Tip | null>())
  const measure = useRef<HTMLSpanElement>(null)
  const { contained, frame } = useHost()
  const reduce = useReducedMotion()
  const bubble = useId()
  useLayoutEffect(() => {
    live.current = { shown, tip }
  })
  useEffect(() => {
    const t = timers.current
    return () => {
      clearTimeout(t.open)
      clearTimeout(t.hide)
    }
  }, [])

  const reveal = (t: Tip) => {
    clearTimeout(timers.current.open)
    clearTimeout(timers.current.hide)
    const was = live.current.tip
    setGlide(live.current.shown)
    setDir(was && live.current.shown ? Math.sign(t.el.getBoundingClientRect().left - was.el.getBoundingClientRect().left) : 0)
    setTip(t)
    setShown(true)
  }
  const hide = () => {
    clearTimeout(timers.current.open)
    clearTimeout(timers.current.hide)
    if (live.current.shown) warm.current = performance.now() + WARM
    setShown(false)
  }
  const group: Group = {
    enter: (t) => {
      clearTimeout(timers.current.hide)
      if (live.current.shown || performance.now() < warm.current) return reveal(t)
      clearTimeout(timers.current.open)
      timers.current.open = window.setTimeout(() => reveal(t), delay)
    },
    focus: reveal,
    leave: () => {
      clearTimeout(timers.current.open)
      timers.current.hide = window.setTimeout(hide, 80)
    },
    hide,
    register: (id, get) => {
      tips.current.set(id, get)
      return () => void tips.current.delete(id)
    },
    shown: shown ? (tip?.id ?? null) : null,
    bubble,
  }

  useLayoutEffect(() => {
    if (!shown || !tip || !measure.current || !tip.el.isConnected) return
    const f = frameOf(frame)
    const w = Math.ceil(measure.current.offsetWidth) + PAD_X * 2
    const p = place(inFrame(tip.el.getBoundingClientRect(), f), { w, h: 28 }, f, tip.side, 'center', 7, 6)
    setPos({ x: p.x, y: p.y, w, side: p.side, arrow: p.arrow })
  }, [shown, tip, frame])

  useEffect(() => {
    if (!shown) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    const away = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && !live.current.tip?.el.contains(e.target as Node)) hide()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', away)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', away)
    }
  }, [shown])

  useImperativeHandle(ref, () => ({
    show: (n) => {
      const all = [...tips.current.values()].map((g) => g()).filter((t): t is Tip => !!t)
      all.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      if (all[n]) group.enter(all[n])
    },
    hide,
  }))

  const value = useMemo(() => group, [shown, tip, bubble]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GroupContext.Provider value={value}>
      {children}
      <Layer>
        <div className={`${fill(contained)} pointer-events-none z-[60]`}>
          {tip && (
            <span ref={measure} aria-hidden className="invisible absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap text-caption font-medium">
              <Label tip={tip} />
            </span>
          )}
          <AnimatePresence>
            {shown && tip && pos && (
              <motion.div
                key="tip"
                id={bubble}
                role="tooltip"
                className="absolute left-0 top-0 h-7 rounded-[9px] bg-ink text-caption font-medium text-surface shadow-float"
                initial={{ x: pos.x, y: pos.y + (pos.side === 'top' ? 3 : pos.side === 'bottom' ? -3 : 0), width: pos.w, opacity: 0, scale: reduce ? 1 : 0.96 }}
                animate={{ x: pos.x, y: pos.y, width: pos.w, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.out } }}
                transition={glide && !reduce ? { ...spring.move, opacity: { duration: 0.12, ease: ease.out } } : { duration: 0.14, ease: ease.out }}
                style={{ transformOrigin: originOf(pos.side, pos.arrow) }}
              >
                <span className="relative block h-full overflow-hidden rounded-[inherit]">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={tip.id}
                      className="absolute inset-y-0 left-0 flex items-center gap-1.5 whitespace-nowrap px-2"
                      initial={{ opacity: 0, x: dir * 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: dir * -10, transition: { duration: dur.exit, ease: ease.out } }}
                      transition={{ duration: 0.18, ease: ease.out }}
                    >
                      <Label tip={tip} />
                    </motion.span>
                  </AnimatePresence>
                </span>
                {(pos.side === 'top' || pos.side === 'bottom') && (
                  <motion.svg
                    aria-hidden
                    width="10"
                    height="5"
                    viewBox="0 0 10 5"
                    className="absolute"
                    style={{ [pos.side === 'top' ? 'top' : 'bottom']: '100%', rotate: pos.side === 'top' ? 0 : 180 }}
                    initial={false}
                    animate={{ left: pos.arrow - 5 }}
                    transition={glide && !reduce ? spring.move : { duration: 0 }}
                  >
                    <path d="M0 0 L4 4 Q5 5 6 4 L10 0 Z" fill="var(--ink)" />
                  </motion.svg>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layer>
    </GroupContext.Provider>
  )
}

function Label({ tip }: { tip: Tip }) {
  return (
    <>
      {tip.label}
      {tip.shortcut && (
        <span className="ml-0.5 flex gap-0.5 pointer-coarse:hidden">
          {tip.shortcut.map((k) => (
            <kbd key={k} className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-[color-mix(in_oklch,var(--surface)_16%,transparent)] px-1 font-sans text-[11px] font-medium leading-none text-[color-mix(in_oklch,var(--surface)_78%,transparent)]">
              {keyLabel(k)}
            </kbd>
          ))}
        </span>
      )}
    </>
  )
}

export function Tooltip({
  label,
  shortcut,
  side = 'top',
  children,
}: {
  label: string
  shortcut?: string[]
  side?: Side
  children: ReactElement<Record<string, unknown>>
}) {
  const group = useContext(GroupContext)
  const el = useRef<HTMLSpanElement>(null)
  const pressed = useRef(false)
  const tap = useRef<'off' | 'open' | 'shown'>('off')
  const id = useId()
  const get = useRef<() => Tip | null>(() => null)
  useLayoutEffect(() => {
    get.current = () => (el.current ? { id, label, shortcut, side, el: el.current } : null)
  })
  useEffect(() => group?.register(id, () => get.current()), [group, id])

  if (!group)
    return (
      <TooltipGroup>
        <Tooltip label={label} shortcut={shortcut} side={side}>
          {children}
        </Tooltip>
      </TooltipGroup>
    )

  return (
    <span
      ref={el}
      className="inline-flex"
      onPointerEnter={(e) => {
        const t = get.current()
        if (e.pointerType !== 'touch' && t && !pressed.current) group.enter(t)
      }}
      onPointerLeave={(e) => {
        pressed.current = false
        if (e.pointerType !== 'touch') group.leave()
      }}
      onPointerDown={(e) => {
        pressed.current = true
        tap.current = e.pointerType !== 'touch' ? 'off' : group.shown === id ? 'shown' : 'open'
        group.hide()
      }}
      onClick={() => {
        const t = get.current()
        if (t && tap.current === 'open') group.focus(t)
        tap.current = 'off'
      }}
      onFocus={(e) => {
        const t = get.current()
        if (t && e.target.matches(':focus-visible')) group.focus(t)
      }}
      onBlur={() => group.hide()}
    >
      {cloneElement(children, { 'aria-describedby': group.shown === id ? group.bubble : undefined })}
    </span>
  )
}
