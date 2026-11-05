'use client'

import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { InPlay } from '@/lab/blocks/kit/director'

const SETTLE = 110
const SETTLE_MAX = 420
const PHONE = 640
const LAPTOP = 1280
const PHONE_PAD = 10
const PHONE_AIR = 6
const CARD_PAD = 8
const CARD_MIN = 0.5

export function Fit({ children, pad = 28, max = 1, min = 0.2, onPhone, stage = false, scale = false }: { children: ReactNode; pad?: number; max?: number; min?: number; stage?: boolean; scale?: boolean; onPhone?: (height: number | null) => void }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [ready, setReady] = useState(false)
  const [crop, setCrop] = useState<{ x: boolean; y: boolean }>({ x: false, y: false })
  const [phone, setPhone] = useState<number | null>(null)
  const zoomRef = useRef(1)
  const tries = useRef(0)
  const firstSeen = useRef(0)
  const reveal = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unzoom = useCallback((p: { x: number; y: number }) => ({ x: p.x / zoom, y: p.y / zoom }), [zoom])

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const read = () => {
      const r = i.getBoundingClientRect()
      const box = o.getBoundingClientRect()
      const ownScale = box.width / (o.offsetWidth || box.width || 1)
      if (!o.offsetWidth || !o.offsetHeight || !r.width || !r.height) return
      const vw = window.innerWidth
      const air = vw < PHONE ? PHONE_AIR : PHONE_PAD
      const room = !scale && onPhone && vw < (stage ? LAPTOP : PHONE) ? o.offsetWidth - air * 2 : null
      const card = !scale && !onPhone && vw < PHONE
      if (card) {
        const wide = o.offsetWidth - CARD_PAD * 2
        const h = r.height / ownScale / zoomRef.current
        const next = Math.max(CARD_MIN, Math.min(1, (o.offsetHeight - CARD_PAD * 2) / h))
        if (Math.abs(next - zoomRef.current) > 0.02 && tries.current < 4) {
          tries.current += 1
          zoomRef.current = next
          setZoom(next)
        }
        setPhone(wide / zoomRef.current)
      } else {
        setPhone(room)
        if (!room) onPhone?.(null)
      }
      if (room || card) {
        if (room && zoomRef.current !== 1) {
          zoomRef.current = 1
          setZoom(1)
        }
        if (room) onPhone?.(i.offsetHeight + air * 2)
        setCrop((c) => (c.x || c.y ? { x: false, y: false } : c))
        if (!firstSeen.current) firstSeen.current = performance.now()
        if (reveal.current) clearTimeout(reveal.current)
        reveal.current = setTimeout(() => setReady(true), SETTLE)
        return
      }
      const w = r.width / ownScale / zoomRef.current
      const h = r.height / ownScale / zoomRef.current
      const edge = scale && vw < PHONE ? air : pad
      const fits = Math.min(max, (o.offsetWidth - edge * 2) / w, (o.offsetHeight - edge * 2) / h)
      const next = Math.max(scale ? 0.2 : min, fits)
      if (Math.abs(next - zoomRef.current) > 0.005) {
        zoomRef.current = next
        setZoom(next)
      }
      const cx = w * next > o.offsetWidth - edge * 2 + 1
      const cy = h * next > o.offsetHeight - edge * 2 + 1
      setCrop((c) => (c.x === cx && c.y === cy ? c : { x: cx, y: cy }))
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
  }, [pad, max, min, onPhone, stage, scale])

  const onPage = useContext(InPlay)
  const [seen, setSeen] = useState(true)
  useEffect(() => {
    if (!outer.current) return
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: '120px' })
    io.observe(outer.current)
    return () => io.disconnect()
  }, [])

  const fade = [crop.x && 'linear-gradient(to right, #000 calc(100% - 56px), transparent)', crop.y && 'linear-gradient(to bottom, #000 calc(100% - 56px), transparent)'].filter(Boolean).join(', ')
  return (
    <div
      ref={outer}
      className={`absolute inset-0 flex overflow-hidden ${crop.x ? 'justify-start' : 'justify-center'} ${crop.y || (stage && phone) ? 'items-start' : 'items-center'}`}
      style={{ padding: crop.x || crop.y ? pad : stage && phone ? `${window.innerWidth < PHONE ? PHONE_AIR : PHONE_PAD}px 0 0` : undefined, maskImage: fade || undefined, maskComposite: crop.x && crop.y ? 'intersect' : undefined }}
    >
      <div ref={inner} data-fit className="w-max shrink-0 transition-opacity duration-200 ease-out" style={{ maxWidth: phone ?? undefined, zoom, opacity: ready ? 1 : 0, visibility: ready ? 'visible' : 'hidden' }}>
        <MotionConfig transformPagePoint={unzoom} reducedMotion="user">
          <InPlay.Provider value={onPage && seen}>{children}</InPlay.Provider>
        </MotionConfig>
      </div>
    </div>
  )
}
