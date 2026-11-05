'use client'

import { useEffect, useState } from 'react'
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
