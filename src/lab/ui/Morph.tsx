'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import type { MotionValue, Transition } from 'motion/react'
import { ease, spring } from '../lib/motion'

type Anchor = 'top' | 'bottom' | 'center'
type Justify = 'start' | 'center' | 'end'

export function Morph({
  view,
  views,
  radius = 20,
  anchor = 'top',
  justify = 'center',
  transition = spring.smooth,
  className = '',
  style,
  onPointerEnter,
  onPointerLeave,
}: {
  view: string
  views: Record<string, ReactNode>
  radius?: number | Record<string, number>
  anchor?: Anchor
  justify?: Justify
  transition?: Transition
  className?: string
  style?: CSSProperties
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) {
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({})
  const probes = useRef<Record<string, HTMLDivElement | null>>({})
  const w = useMotionValue(0)
  const h = useMotionValue(0)
  const r = useMotionValue(typeof radius === 'number' ? radius : (radius[view] ?? 20))
  const placed = useRef(false)
  const surface = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const read = () => {
      const next: Record<string, { w: number; h: number }> = {}
      for (const [k, el] of Object.entries(probes.current)) if (el) next[k] = { w: el.offsetWidth, h: el.offsetHeight }
      setSizes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    read()
    const ro = new ResizeObserver(read)
    Object.values(probes.current).forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  })

  const size = sizes[view]
  const targetR = typeof radius === 'number' ? radius : (radius[view] ?? 20)

  useLayoutEffect(() => {
    if (!size) return
    if (!placed.current) {
      placed.current = true
      w.set(size.w)
      h.set(size.h)
      r.set(targetR)
      const el = surface.current
      if (el) {
        el.style.width = `${size.w}px`
        el.style.height = `${size.h}px`
      }
      return
    }
    const a = animate(w, size.w, transition)
    const b = animate(h, size.h, transition)
    const c = animate(r, targetR, transition)
    return () => {
      a.stop()
      b.stop()
      c.stop()
    }
  }, [size?.w, size?.h, targetR, transition, w, h, r, size])

  const align = anchor === 'top' ? 'items-start' : anchor === 'bottom' ? 'items-end' : 'items-center'
  const along = justify === 'start' ? 'justify-start' : justify === 'end' ? 'justify-end' : 'justify-center'
  const fx = justify === 'start' ? 0 : justify === 'end' ? 1 : 0.5
  const fy = anchor === 'top' ? 0 : anchor === 'bottom' ? 1 : 0.5

  return (
    <>
      <motion.div
        ref={surface}
        className={`relative overflow-hidden ${className}`}
        style={{ ...style, ...(size ? { width: w, height: h } : { width: 'max-content' }), borderRadius: r }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div className={`${size ? 'absolute inset-0' : ''} flex ${along} ${align}`}>
          <AnimatePresence initial={false} mode="popLayout">
            <Pane key={view} w={w} h={h} size={size} fx={fx} fy={fy}>
              {views[view]}
            </Pane>
          </AnimatePresence>
        </div>
      </motion.div>

      <div aria-hidden className="pointer-events-none invisible absolute left-0 top-0 -z-50 size-0 overflow-clip" {...{ inert: true }}>
        {Object.entries(views).map(([k, v]) => (
          <div
            key={k}
            ref={(el) => {
              probes.current[k] = el
            }}
            className="absolute left-0 top-0 w-max"
          >
            {v}
          </div>
        ))}
      </div>
    </>
  )
}

function Pane({ w, h, size, fx, fy, ref, children }: { w: MotionValue<number>; h: MotionValue<number>; size?: { w: number; h: number }; fx: number; fy: number; ref?: Ref<HTMLDivElement>; children: ReactNode }) {
  const x = useTransform(w, (v) => (size ? (v - size.w) * fx : 0))
  const y = useTransform(h, (v) => (size ? (v - size.h) * fy : 0))
  return (
    <motion.div
      ref={ref}
      className={`w-max shrink-0 ${size ? 'absolute left-0 top-0' : ''}`}
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.22, delay: 0.1, ease: ease.out } }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1, ease: ease.out } }}
    >
      {children}
    </motion.div>
  )
}
