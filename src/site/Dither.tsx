'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map((v) => (v + 0.5) / 64)

export function useReprint(color: string) {
  const [shown, setShown] = useState(color)
  const [level, setLevel] = useState(1)
  const was = useRef(color)
  useEffect(() => {
    if (color === was.current) return
    was.current = color
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(color)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const e = t - start
      if (e < 160) setLevel(1 - e / 160)
      else {
        setShown(color)
        const k = Math.min(1, (e - 160) / 320)
        setLevel(1 - (1 - k) ** 2)
        if (k === 1) return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setShown(color)
      setLevel(1)
    }
  }, [color])
  return [shown, level] as const
}

export function Dither({ color, size, cells = 8, fade = false, className = '', style }: { color: string; size: string; cells?: number; fade?: boolean; className?: string; style?: React.CSSProperties }) {
  const [shown, level] = useReprint(color)
  const rows = fade ? Math.round(cells / 2) : cells
  const rects = []
  const c = (cells - 1) / 2
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cells; x++) {
      const d = Math.hypot(x - c, y - c) / (c + 0.5)
      const light = fade ? 1.15 - x / (cells - 1) : Math.max(0, Math.min(1, (1 - d) / 0.6))
      if (light * level > BAYER[(y % 8) * 8 + (x % 8)]) rects.push(<rect key={y * cells + x} x={x} y={y} width="1" height="1" />)
    }
  return (
    <svg aria-hidden viewBox={`0 0 ${cells} ${rows}`} shapeRendering="crispEdges" className={className} style={{ width: size, height: `calc(${size} * ${rows / cells})`, fill: shown, ...style }}>
      {rects}
    </svg>
  )
}

export function DitherWord({ color, children, cell = 2 }: { color: string; children: ReactNode; cell?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState<[number, number]>([0, 0])
  const [url, setUrl] = useState('')
  const [shown, level] = useReprint(color)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox([el.offsetWidth, el.offsetHeight]))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    const [w, h] = box
    if (!w || !h) return
    const dpr = Math.min(2, devicePixelRatio || 1)
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(w * dpr)
    canvas.height = Math.ceil(h * dpr)
    const g = canvas.getContext('2d')
    if (!g) return
    g.fillStyle = getComputedStyle(ref.current!).getPropertyValue('--print').trim() || shown
    const cols = Math.ceil(w / cell)
    const rows = Math.ceil(h / cell)
    for (let y = 0; y < rows; y++) {
      const t = (y / rows - 0.2) / 0.55
      const light = Math.max(0.28, Math.min(1, 0.28 + t * 0.95))
      for (let x = 0; x < cols; x++) if (light * level > BAYER[(y % 8) * 8 + (x % 8)]) g.fillRect(x * cell * dpr, y * cell * dpr, cell * dpr, cell * dpr)
    }
    setUrl(canvas.toDataURL())
  }, [box, shown, level, cell])
  return (
    <span
      ref={ref}
      className="inline-block"
      style={{ ['--print' as string]: shown, color: url ? 'transparent' : shown, backgroundImage: url ? `url(${url})` : undefined, backgroundSize: '100% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
    >
      {children}
    </span>
  )
}

export function DitherIcon({ color, size, children, cell = 2 }: { color: string; size: number; children: ReactNode; cell?: number }) {
  const [shown, level] = useReprint(color)
  const [mask, setMask] = useState('')
  useEffect(() => {
    if (level >= 1) return setMask('')
    const dpr = Math.min(2, devicePixelRatio || 1)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.ceil(size * dpr)
    const g = canvas.getContext('2d')
    if (!g) return
    g.fillStyle = '#000'
    const n = Math.ceil(size / cell)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (level > BAYER[(y % 8) * 8 + (x % 8)]) g.fillRect(x * cell * dpr, y * cell * dpr, cell * dpr, cell * dpr)
    setMask(`url(${canvas.toDataURL()})`)
  }, [level, size, cell])
  return (
    <span className="grid place-items-center" style={{ width: size, height: size, color: shown, maskImage: mask || undefined, WebkitMaskImage: mask || undefined, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}>
      {children}
    </span>
  )
}
