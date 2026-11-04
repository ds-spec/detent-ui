'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'

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

const stacked = new WeakMap<Element, number>()
export const stackTop = (el: Element) => stacked.get(el) ?? 0
const stacks = new WeakMap<Element, () => void>()

export function useStack(ref: RefObject<HTMLElement | null>, gap = 0, onPlace?: () => void) {
  const follow = useRef(onPlace)
  useLayoutEffect(() => {
    follow.current = onPlace
  })
  const place = useCallback(() => {
    const box = ref.current
    if (!box) return
    const cs = getComputedStyle(box)
    if (cs.position === 'static') box.style.position = 'relative'
    const [top, right, bottom, left] = ['top', 'right', 'bottom', 'left'].map((k) => parseFloat(cs.getPropertyValue(`padding-${k}`)))
    const edges = top + bottom + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    let y = 0
    for (const el of Array.from(box.children) as HTMLElement[]) {
      Object.assign(el.style, { position: 'absolute', top: `${top}px`, left: `${left}px`, right: `${right}px`, translate: `0 ${y}px` })
      const s = getComputedStyle(el)
      const mt = parseFloat(s.marginTop) || 0
      stacked.set(el, top + y + mt)
      y += mt + parseFloat(s.height) + (parseFloat(s.marginBottom) || 0) + gap
    }
    const was = box.style.height
    box.style.height = `${Math.max(0, y - gap) + (cs.boxSizing === 'border-box' ? edges : 0)}px`
    if (box.style.height === was) return
    follow.current?.()
    for (let el = box.parentElement; el; el = el.parentElement) {
      const outer = stacks.get(el)
      if (outer) return outer()
    }
  }, [ref, gap])
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

export const layoutPx = (v: string) => Math.round(parseFloat(v) * 64) / 64

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
    for (const el of kids) Object.assign(el.style, { position: 'absolute', left: '0px', whiteSpace: 'nowrap' })
    const sizes = kids.map((el) => {
      const cs = getComputedStyle(el)
      return { w: layoutPx(cs.width), h: layoutPx(cs.height), before: layoutPx(cs.marginLeft), after: layoutPx(cs.marginRight) }
    })
    const tall = Math.max(0, ...sizes.map((s) => s.h))
    let x = 0
    kids.forEach((el, i) => {
      el.style.translate = `${x}px`
      x += sizes[i].before + sizes[i].w + sizes[i].after
    })
    box.style.height = `${tall}px`
    const was = box.style.width
    box.style.width = `${x}px`
    if (box.style.width !== was) follow.current?.()
  }, [ref])
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

const readTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
const watchTheme = (on: () => void) => {
  const mo = new MutationObserver(on)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
export function useTheme() {
  return useSyncExternalStore<'light' | 'dark'>(watchTheme, readTheme, () => 'light')
}

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
