'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'

export function useNear(ref: RefObject<Element | null>, enter = '160px 0px', leave = '360px 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancel: (() => void) | null = null
    const panel = el.closest('[data-scroller]')
    const root = panel && getComputedStyle(panel).overflowY !== 'visible' ? panel : null
    const on = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || cancel) return
        cancel = queue(() => {
          cancel = null
          setNear(true)
        })
      },
      { root, rootMargin: enter },
    )
    const off = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) return
        cancel?.()
        cancel = null
        setNear(false)
      },
      { root, rootMargin: leave },
    )
    on.observe(el)
    off.observe(el)
    return () => {
      cancel?.()
      on.disconnect()
      off.disconnect()
    }
  }, [ref, enter, leave])
  return near
}

const jobs: (() => void)[] = []
let running = false
const idle = (fn: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 250 }) : setTimeout(fn, 16))
const drain = () => {
  const job = jobs.shift()
  if (!job) {
    running = false
    return
  }
  job()
  idle(drain)
}
function queue(job: () => void) {
  jobs.push(job)
  if (!running) {
    running = true
    idle(drain)
  }
  return () => {
    const i = jobs.indexOf(job)
    if (i >= 0) jobs.splice(i, 1)
  }
}

export function useSeen(ref: RefObject<Element | null>) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const panel = el.closest('[data-scroller]')
    const root = panel && getComputedStyle(panel).overflowY !== 'visible' ? panel : null
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { root })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

let scrolling = false
let rest = 0
const watchers = new Set<() => void>()
const tell = () => watchers.forEach((w) => w())
const onScroll = () => {
  clearTimeout(rest)
  rest = window.setTimeout(() => {
    scrolling = false
    tell()
  }, 160)
  if (scrolling) return
  scrolling = true
  tell()
}
function watch(w: () => void) {
  if (!watchers.size) window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  watchers.add(w)
  return () => {
    watchers.delete(w)
    if (watchers.size) return
    window.removeEventListener('scroll', onScroll, { capture: true })
    clearTimeout(rest)
    scrolling = false
  }
}

export function useScrolling() {
  return useSyncExternalStore(
    watch,
    () => scrolling,
    () => false,
  )
}
