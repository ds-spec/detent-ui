'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

/**
 * Shows a demo at its natural size, scaled down only if it would not fit the stage.
 * Uses CSS zoom (not a transform) so the demo's own measurements stay true. Below `min` it
 * stops shrinking: the demo stays legible, anchored top-left, and fades out at the edges
 * it can't fit, instead of turning into a miniature.
 *
 * Zoom does scale what getBoundingClientRect reports, and a transform inside a zoomed box is
 * scaled again, so Motion is told the zoom: its layout animations then start exactly where
 * the element was, and drags follow the pointer.
 */
/** How long a demo's size must hold still before it's shown, and the most it waits. */
const SETTLE = 110
const SETTLE_MAX = 420

export function Fit({ children, pad = 28, max = 1, min = 0.2 }: { children: ReactNode; pad?: number; max?: number; min?: number }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  // Hidden until measured, so a demo never paints one frame at full size and then jumps to fit.
  const [ready, setReady] = useState(false)
  const [crop, setCrop] = useState<{ x: boolean; y: boolean }>({ x: false, y: false })
  const zoomRef = useRef(1)
  const firstSeen = useRef(0)
  const reveal = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unzoom = useCallback((p: { x: number; y: number }) => ({ x: p.x / zoom, y: p.y / zoom }), [zoom])

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const read = () => {
      // Natural size = what we see divided by the zoom we applied.
      const r = i.getBoundingClientRect()
      const box = o.getBoundingClientRect()
      const ownScale = box.width / (o.offsetWidth || box.width || 1)
      // Nothing to measure yet (not laid out, or the demo is still loading): try again on the next resize.
      if (!o.offsetWidth || !o.offsetHeight || !r.width || !r.height) return
      const w = r.width / ownScale / zoomRef.current
      const h = r.height / ownScale / zoomRef.current
      const fits = Math.min(max, (o.offsetWidth - pad * 2) / w, (o.offsetHeight - pad * 2) / h)
      const next = Math.max(min, fits)
      if (Math.abs(next - zoomRef.current) > 0.005) {
        zoomRef.current = next
        setZoom(next)
      }
      const cx = w * next > o.offsetWidth - pad * 2 + 1
      const cy = h * next > o.offsetHeight - pad * 2 + 1
      setCrop((c) => (c.x === cx && c.y === cy ? c : { x: cx, y: cy }))
      // Shown once its size has held still for a moment (a demo often settles a frame or two after
      // it mounts), and never later than SETTLE_MAX after it was first seen.
      if (!firstSeen.current) firstSeen.current = performance.now()
      if (reveal.current) clearTimeout(reveal.current)
      reveal.current = setTimeout(() => setReady(true), Math.max(0, Math.min(SETTLE, SETTLE_MAX - (performance.now() - firstSeen.current))))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(o)
    ro.observe(i)
    return () => {
      ro.disconnect()
      if (reveal.current) clearTimeout(reveal.current)
    }
  }, [pad, max, min])

  // When it can't all fit, show the start of it and let the overflowing edges fade away.
  const fade = [crop.x && 'linear-gradient(to right, #000 calc(100% - 56px), transparent)', crop.y && 'linear-gradient(to bottom, #000 calc(100% - 56px), transparent)'].filter(Boolean).join(', ')
  return (
    <div
      ref={outer}
      className={`absolute inset-0 flex overflow-hidden ${crop.x ? 'justify-start' : 'justify-center'} ${crop.y ? 'items-start' : 'items-center'}`}
      style={{ padding: crop.x || crop.y ? pad : undefined, maskImage: fade || undefined, maskComposite: crop.x && crop.y ? 'intersect' : undefined }}
    >
      <div ref={inner} data-fit className="w-max shrink-0 transition-opacity duration-200 ease-out" style={{ zoom, opacity: ready ? 1 : 0, visibility: ready ? 'visible' : 'hidden' }}>
        <MotionConfig transformPagePoint={unzoom}>{children}</MotionConfig>
      </div>
    </div>
  )
}
