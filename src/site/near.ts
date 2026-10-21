'use client'

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * True once the element comes within `enter` of the viewport, false again once it is beyond
 * `leave`, so offscreen demos stop running. The gap between the two stops flicker at the edge.
 * Turning on is queued: demos start one at a time in idle moments, never several in the same
 * frame of a scroll.
 */
export function useNear(ref: RefObject<Element | null>, enter = '160px 0px', leave = '360px 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancel: (() => void) | null = null
    const on = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || cancel) return
        cancel = queue(() => {
          cancel = null
          setNear(true)
        })
      },
      { rootMargin: enter },
    )
    const off = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) return
        cancel?.()
        cancel = null
        setNear(false)
      },
      { rootMargin: leave },
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

/* One shared queue: each job runs in its own idle moment, so mounting never stacks up in a frame. */
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
