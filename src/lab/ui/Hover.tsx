'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ease } from '@/lab/lib/motion'

/**
 * A soft plate that follows the pointer through a list, sliding from row to row rather than each
 * row lighting up on its own. Mark rows with `data-row`. It appears where you first point, glides
 * while you move, and fades when you leave. It moves by transform only, so nothing shifts.
 */
export function Hover({ children, className = '', radius = 7, as: Tag = 'div', label }: { children: ReactNode; className?: string; radius?: number; as?: 'div' | 'nav' | 'ul'; label?: string }) {
  const box = useRef<HTMLElement>(null)
  // Where the light sits, and whether it got there by jumping (just arrived) or gliding.
  const [at, setAt] = useState<{ x: number; y: number; w: number; h: number; jump: boolean } | null>(null)
  const move = (e: React.PointerEvent) => {
    const el = box.current
    const row = (e.target as HTMLElement).closest('[data-row]') as HTMLElement | null
    if (!el || !row || !el.contains(row)) return
    const b = el.getBoundingClientRect()
    const r = row.getBoundingClientRect()
    const s = b.width / (el.offsetWidth || b.width || 1)
    const next = { x: (r.left - b.left) / s + el.scrollLeft, y: (r.top - b.top) / s + el.scrollTop, w: r.width / s, h: r.height / s }
    setAt((a) => (a && a.x === next.x && a.y === next.y && a.w === next.w && a.h === next.h ? a : { ...next, jump: !a }))
  }
  const leave = () => setAt(null)
  const instant = !at || at.jump
  return (
    <Tag ref={box as never} aria-label={label} className={`relative ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 bg-[color-mix(in_oklch,var(--ink)_5%,transparent)]"
        style={{ borderRadius: radius }}
        initial={false}
        animate={at ? { x: at.x, y: at.y, width: at.w, height: at.h, opacity: 1 } : { opacity: 0 }}
        transition={instant ? { duration: 0, opacity: { duration: 0.12, ease: ease.out } } : { type: 'spring', stiffness: 620, damping: 46, opacity: { duration: 0.12, ease: ease.out } }}
      />
      {children}
    </Tag>
  )
}
