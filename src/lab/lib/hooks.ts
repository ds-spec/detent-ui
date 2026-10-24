'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'

/** requestAnimationFrame loop; `cb` always sees the latest closure. dt is in ms, capped. */
export function useFrame(cb: (dt: number, t: number) => void, active = true) {
  const ref = useRef(cb)
  useLayoutEffect(() => {
    ref.current = cb
  })
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(48, t - last)
      last = t
      ref.current(dt, t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])
}

export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** Where each stacked child sits inside its box, as `useStack` last placed it. */
const stacked = new WeakMap<Element, number>()
export const stackTop = (el: Element) => stacked.get(el) ?? 0
const stacks = new WeakMap<Element, () => void>()

/**
 * Stacks a box's children by transform instead of by flow. Once mounted, every child is taken
 * out of flow to the top of the box and translated down under the ones before it, by their live
 * heights, in the same frame those heights change. Rows can grow, fold, arrive and leave on
 * their own animations while nothing in the layout moves, so the page never registers a shift.
 * Before hydration the children simply flow, in the same places. The box takes the stack's
 * height; children span its content width, and their margins count as they would in flow.
 * `onPlace` runs whenever that height changes, in the same frame, for anything that follows it.
 */
export function useStack(ref: RefObject<HTMLElement | null>, gap = 0, onPlace?: () => void) {
  const follow = useRef(onPlace)
  useLayoutEffect(() => {
    follow.current = onPlace
  })
  const place = useCallback(() => {
    const box = ref.current
    if (!box) return
    // Children sit inside the box's padding, as they would in flow; the box holds them.
    const cs = getComputedStyle(box)
    if (cs.position === 'static') box.style.position = 'relative'
    const [top, right, bottom, left] = ['top', 'right', 'bottom', 'left'].map((k) => parseFloat(cs.getPropertyValue(`padding-${k}`)))
    const edges = top + bottom + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    let y = 0
    for (const el of Array.from(box.children) as HTMLElement[]) {
      Object.assign(el.style, { position: 'absolute', top: `${top}px`, left: `${left}px`, right: `${right}px`, translate: `0 ${y}px` })
      // An absolute box still honours its margins, so a top margin moves it down on its own;
      // both margins take room before the next row, the way they would in flow.
      const s = getComputedStyle(el)
      const mt = parseFloat(s.marginTop) || 0
      stacked.set(el, top + y + mt)
      y += mt + parseFloat(s.height) + (parseFloat(s.marginBottom) || 0) + gap
    }
    const was = box.style.height
    box.style.height = `${Math.max(0, y - gap) + (cs.boxSizing === 'border-box' ? edges : 0)}px`
    if (box.style.height === was) return
    // Whatever follows this height hears now, not a frame late: a resize observer on the box would
    // only fire next frame, since the change came from inside one. That includes an outer stack.
    follow.current?.()
    for (let el = box.parentElement; el; el = el.parentElement) {
      const outer = stacks.get(el)
      if (outer) return outer()
    }
  }, [ref, gap])
  // After every commit, so a layout animation measuring it sees each row in its new place.
  useLayoutEffect(place)
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    stacks.set(box, place)
    const ro = new ResizeObserver(place)
    const watch = () => {
      ro.disconnect()
      for (const el of Array.from(box.children)) ro.observe(el)
    }
    const mo = new MutationObserver(() => {
      watch()
      place()
    })
    watch()
    mo.observe(box, { childList: true })
    return () => {
      stacks.delete(box)
      ro.disconnect()
      mo.disconnect()
    }
  }, [ref, place])
}

/**
 * A computed length in px, on layout's own grid of 64ths of a pixel. Computed styles round to a few
 * decimals; summing those drifts off the grid, and text placed a hair off lands on another subpixel.
 */
export const layoutPx = (v: string) => Math.round(parseFloat(v) * 64) / 64

/**
 * `useStack` on its side: lays a box's children out in a row by transform instead of by flow.
 * Once mounted, every child is taken out of flow to the box's left edge and translated past the
 * ones before it, by their live widths and margins, in the same frame any of them changes. Text
 * can change length and pieces can arrive mid-row while nothing moves in the layout. Vertically
 * each keeps its static position, so the box's own alignment (`items-center`) still centres them,
 * on whole pixels as in flow. Before hydration the children simply flow, in the same places, so
 * use margins for the spaces between them. The box takes the row's size; `onPlace` runs whenever
 * its width changes, in the same frame, for anything that follows it.
 */
export function useRow(ref: RefObject<HTMLElement | null>, onPlace?: () => void) {
  const follow = useRef(onPlace)
  useLayoutEffect(() => {
    follow.current = onPlace
  })
  const place = useCallback(() => {
    const box = ref.current
    if (!box) return
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative'
    const kids = Array.from(box.children) as HTMLElement[]
    // Out of flow first, so each is measured at its own size rather than as the flow stretched it.
    for (const el of kids) Object.assign(el.style, { position: 'absolute', left: '0px', whiteSpace: 'nowrap' })
    const sizes = kids.map((el) => {
      const cs = getComputedStyle(el)
      return { w: layoutPx(cs.width), h: layoutPx(cs.height), before: layoutPx(cs.marginLeft), after: layoutPx(cs.marginRight) }
    })
    const tall = Math.max(0, ...sizes.map((s) => s.h))
    let x = 0
    kids.forEach((el, i) => {
      // An absolute box already sits its left margin in from the edge; the translate carries the rest.
      el.style.translate = `${x}px`
      x += sizes[i].before + sizes[i].w + sizes[i].after
    })
    box.style.height = `${tall}px`
    const was = box.style.width
    box.style.width = `${x}px`
    if (box.style.width !== was) follow.current?.()
  }, [ref])
  // After every commit, so a piece that arrived is placed before it paints.
  useLayoutEffect(place)
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const ro = new ResizeObserver(place)
    const watch = () => {
      ro.disconnect()
      for (const el of Array.from(box.children)) ro.observe(el)
    }
    const mo = new MutationObserver(() => {
      watch()
      place()
    })
    watch()
    mo.observe(box, { childList: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [ref, place])
}

/** Current page theme, kept in sync with <html data-theme>. Safe to render on the server (it reads as light there). */
const readTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
const watchTheme = (on: () => void) => {
  const mo = new MutationObserver(on)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
export function useTheme() {
  return useSyncExternalStore<'light' | 'dark'>(watchTheme, readTheme, () => 'light')
}

/** Size a canvas to its CSS box at device pixel ratio; returns the 2D context already scaled. */
export function fitCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

export const mod = (n: number, m: number) => ((n % m) + m) % m
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
