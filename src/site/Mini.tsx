'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * A demo shown small, for previews nobody touches. It lays the demo out at its real size and
 * scales the result down with a transform, so the text inside is set at full size and shrunk as
 * a picture. (CSS zoom, which Fit uses, lays text out small, where the browser's minimum font
 * size makes it overflow its boxes.) Hidden until it has a size, then `onReady` says so, so a
 * preview can keep the last one up until this one is there.
 */
export function Mini({ children, pad = 14, max = 0.6, onReady }: { children: ReactNode; pad?: number; max?: number; onReady?: () => void }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const ready = useRef(onReady)
  useLayoutEffect(() => {
    ready.current = onReady
  })

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    let told = false
    let settle = 0
    let first = 0
    const read = () => {
      // offsetWidth/Height ignore the transform, so this is always the demo's real size.
      const w = i.offsetWidth
      const h = i.offsetHeight
      if (!w || !h || !o.offsetWidth) return
      setScale(Math.min(max, (o.offsetWidth - pad * 2) / w, (o.offsetHeight - pad * 2) / h))
      // Ready once the size has held for a moment (a demo often settles a frame or two after it mounts),
      // and never later than 400ms after it first had one, since a demo that animates never holds still.
      if (told) return
      first ||= performance.now()
      clearTimeout(settle)
      settle = window.setTimeout(() => {
        told = true
        ready.current?.()
      }, Math.max(0, Math.min(90, 400 - (performance.now() - first))))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(o)
    ro.observe(i)
    // The demo's code may still be on its way; look again every so often until it has a size, in
    // case no resize is reported (a hidden tab skips the rendering that reports them).
    const poll = window.setInterval(() => (first ? clearInterval(poll) : read()), 120)
    return () => {
      ro.disconnect()
      clearTimeout(settle)
      clearInterval(poll)
    }
  }, [pad, max])

  return (
    <div ref={outer} className="absolute inset-0 overflow-clip">
      <div ref={inner} className="absolute left-1/2 top-1/2 w-max" style={{ transform: `translate(-50%, -50%) scale(${scale})`, opacity: scale ? 1 : 0 }}>
        {children}
      </div>
    </div>
  )
}
