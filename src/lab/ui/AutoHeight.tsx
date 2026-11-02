'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const SMOOTH = { type: 'spring', bounce: 0, duration: 0.5 } as const

/** A box that glides to the real height of what's inside it, so changing content never jumps or stretches. */
export function AutoHeight({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  useLayoutEffect(() => {
    const box = inner.current
    if (!box) return
    const read = () => setHeight(box.offsetHeight)
    const o = new ResizeObserver(read)
    o.observe(box)
    read()
    return () => o.disconnect()
  }, [])
  return (
    <motion.div initial={false} animate={{ height }} transition={reduce ? { duration: 0 } : SMOOTH} className={`overflow-hidden ${className}`}>
      <div ref={inner}>{children}</div>
    </motion.div>
  )
}
