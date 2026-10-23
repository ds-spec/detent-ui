'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { spring } from './motion'

/*
 * The ground every overlay stands on: where it renders, where it's placed, how it's dismissed,
 * and where focus goes while it's open.
 *
 * Overlays render over the page by default, fixed to the viewport. Inside a `LayerHost` they
 * render in that box instead, so a window in a demo, a preview or a device frame keeps its
 * dialogs and menus to itself. Every measurement is taken in the frame's own pixels, so a
 * frame that's zoomed or scaled still places things exactly.
 */

type Host = { layers: HTMLElement | null; frame: HTMLElement | null; recede: (on: boolean) => void }
const HostContext = createContext<Host | null>(null)

/**
 * A box that keeps its overlays to itself. While a sheet or a dialog is open over it, what's
 * inside steps back a little, the way an app does under a modal.
 */
export function LayerHost({ children, className = '', layerClassName = '' }: { children: ReactNode; className?: string; /** Classes for the layer overlays render into: an app can give its menus and dialogs their own surface here. */ layerClassName?: string }) {
  const [layers, setLayers] = useState<HTMLElement | null>(null)
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  const [back, setBack] = useState(0)
  const reduce = useReducedMotion()
  const recede = useCallback((on: boolean) => setBack((n) => Math.max(0, n + (on ? 1 : -1))), [])
  const host = useMemo<Host>(() => ({ layers, frame, recede }), [layers, frame, recede])
  return (
    <HostContext.Provider value={host}>
      <div ref={setFrame} className={`relative isolate overflow-hidden ${className}`}>
        <motion.div className="h-full w-full origin-top" initial={false} animate={reduce ? {} : { scale: back ? 0.97 : 1, opacity: back ? 0.92 : 1 }} transition={spring.soft}>
          {children}
        </motion.div>
        <div ref={setLayers} className={`pointer-events-none absolute inset-0 z-50 ${layerClassName}`} />
      </div>
    </HostContext.Provider>
  )
}

const noop = () => () => {}
/** True once the page has hydrated; overlays never render on the server. */
export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )

/** Where this overlay lives: its host's layer, or the page. */
export function useHost() {
  const host = useContext(HostContext)
  return { contained: !!host, layers: host?.layers ?? null, frame: host?.frame ?? null, recede: host?.recede ?? (() => {}) }
}

/** Renders its children into the host's layer, or into the page's body. */
export function Layer({ children }: { children: ReactNode }) {
  const mounted = useMounted()
  const { contained, layers } = useHost()
  if (!mounted) return null
  if (contained && !layers) return null
  return createPortal(children, contained ? layers! : document.body)
}

/** Fills the frame: the host box, or the viewport. */
export const fill = (contained: boolean) => (contained ? 'absolute inset-0' : 'fixed inset-0')

export type Box = { x: number; y: number; w: number; h: number }
export type Frame = { left: number; top: number; width: number; height: number; scale: number }

/** The box overlays are placed in, in its own CSS pixels. */
export function frameOf(frame: HTMLElement | null): Frame {
  if (!frame) return { left: 0, top: 0, width: innerWidth, height: innerHeight, scale: 1 }
  const r = frame.getBoundingClientRect()
  return { left: r.left, top: r.top, width: frame.offsetWidth, height: frame.offsetHeight, scale: r.width / (frame.offsetWidth || r.width || 1) }
}

/** A rect read from the screen, in the frame's own pixels. */
export const inFrame = (r: { left: number; top: number; width: number; height: number }, f: Frame): Box => ({ x: (r.left - f.left) / f.scale, y: (r.top - f.top) / f.scale, w: r.width / f.scale, h: r.height / f.scale })

export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Align = 'start' | 'center' | 'end'
const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const clampTo = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

/**
 * Where a panel of `size` goes beside `anchor`: on the side asked for, or the opposite one when
 * there isn't room and the opposite has more; slid along to stay `pad` inside the frame. `arrow`
 * is where along the panel's near edge the anchor's middle falls, so a pointer can keep pointing
 * at it even after the panel has slid.
 */
export function place(anchor: Box, size: { w: number; h: number }, frame: { width: number; height: number }, want: Side, align: Align = 'center', gap = 8, pad = 8) {
  const room: Record<Side, number> = { top: anchor.y, bottom: frame.height - anchor.y - anchor.h, left: anchor.x, right: frame.width - anchor.x - anchor.w }
  const across = want === 'top' || want === 'bottom'
  const need = (across ? size.h : size.w) + gap + pad
  const side = room[want] < need && room[OPPOSITE[want]] > room[want] ? OPPOSITE[want] : want
  let x: number
  let y: number
  if (side === 'top' || side === 'bottom') {
    y = side === 'bottom' ? anchor.y + anchor.h + gap : anchor.y - gap - size.h
    x = align === 'start' ? anchor.x : align === 'end' ? anchor.x + anchor.w - size.w : anchor.x + anchor.w / 2 - size.w / 2
    x = clampTo(x, pad, frame.width - pad - size.w)
    y = clampTo(y, pad, frame.height - pad - size.h)
  } else {
    x = side === 'right' ? anchor.x + anchor.w + gap : anchor.x - gap - size.w
    y = align === 'start' ? anchor.y : align === 'end' ? anchor.y + anchor.h - size.h : anchor.y + anchor.h / 2 - size.h / 2
    y = clampTo(y, pad, frame.height - pad - size.h)
    x = clampTo(x, pad, frame.width - pad - size.w)
  }
  const arrow = side === 'top' || side === 'bottom' ? clampTo(anchor.x + anchor.w / 2 - x, 14, size.w - 14) : clampTo(anchor.y + anchor.h / 2 - y, 14, size.h - 14)
  return { x, y, side, arrow }
}

/** The transform origin that makes a placed panel grow out of its anchor. */
export function originOf(side: Side, arrow: number) {
  if (side === 'bottom') return `${arrow}px 0px`
  if (side === 'top') return `${arrow}px 100%`
  if (side === 'right') return `0px ${arrow}px`
  return `100% ${arrow}px`
}

// The overlays open right now, innermost last. Only the innermost answers Escape and outside presses.
const open: object[] = []

/**
 * Closes an overlay on Escape or on a press outside every element in `inside`, but only when
 * it's the innermost one open, so Escape in a menu inside a dialog closes the menu alone.
 */
export function useDismiss(active: boolean, inside: RefObject<HTMLElement | null>[], onDismiss: (why: 'escape' | 'outside') => void) {
  const me = useRef({})
  const latest = useRef({ inside, onDismiss })
  useLayoutEffect(() => {
    latest.current = { inside, onDismiss }
  })
  useEffect(() => {
    if (!active) return
    const token = me.current
    open.push(token)
    const top = () => open[open.length - 1] === token
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !top()) return
      e.stopPropagation()
      latest.current.onDismiss('escape')
    }
    const press = (e: PointerEvent) => {
      if (!top()) return
      const t = e.target as Node
      if (latest.current.inside.some((r) => r.current?.contains(t))) return
      latest.current.onDismiss('outside')
    }
    document.addEventListener('keydown', key, true)
    document.addEventListener('pointerdown', press, true)
    return () => {
      open.splice(open.indexOf(token), 1)
      document.removeEventListener('keydown', key, true)
      document.removeEventListener('pointerdown', press, true)
    }
  }, [active])
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab inside `box` while active, starting on `first` (or the first thing that takes
 * focus), and hands focus back to whatever had it when it closes. `quiet` overlays, opened by a
 * demo rather than a person, never touch focus at all.
 */
export function useFocusTrap(box: RefObject<HTMLElement | null>, active: boolean, quiet: boolean, first?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || quiet) return
    const before = document.activeElement as HTMLElement | null
    const raf = requestAnimationFrame(() => {
      const el = first?.current ?? box.current?.querySelector<HTMLElement>(FOCUSABLE) ?? box.current
      el?.focus({ preventScroll: true })
    })
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !box.current) return
      const all = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!all.length) return e.preventDefault()
      const i = all.indexOf(document.activeElement as HTMLElement)
      const next = e.shiftKey ? (i <= 0 ? all.length - 1 : i - 1) : i === all.length - 1 ? 0 : i + 1
      e.preventDefault()
      all[next].focus({ preventScroll: true })
    }
    document.addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', key)
      if (before?.isConnected) before.focus({ preventScroll: true })
    }
  }, [active, quiet, box, first])
}

let locks = 0
/**
 * Stops the page scrolling under a modal, padding the page by the scrollbar's width while it's
 * gone so nothing beside it moves. Contained overlays leave the page alone.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const html = document.documentElement
    if (locks++ === 0) {
      const bar = innerWidth - html.clientWidth
      html.style.overflow = 'hidden'
      if (bar) html.style.paddingRight = `${bar}px`
    }
    return () => {
      if (--locks === 0) {
        html.style.overflow = ''
        html.style.paddingRight = ''
      }
    }
  }, [active])
}

/** Re-runs `fn` whenever the page scrolls or resizes while `active`, to keep a panel on its anchor. */
export function useReposition(active: boolean, fn: () => void) {
  const latest = useRef(fn)
  useLayoutEffect(() => {
    latest.current = fn
  })
  useEffect(() => {
    if (!active) return
    const run = () => latest.current()
    addEventListener('resize', run)
    addEventListener('scroll', run, true)
    return () => {
      removeEventListener('resize', run)
      removeEventListener('scroll', run, true)
    }
  }, [active])
}
