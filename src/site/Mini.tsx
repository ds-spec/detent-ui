'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

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
      const w = i.offsetWidth
      const h = i.offsetHeight
      if (!w || !h || !o.offsetWidth) return
      setScale(Math.min(max, (o.offsetWidth - pad * 2) / w, (o.offsetHeight - pad * 2) / h))
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
