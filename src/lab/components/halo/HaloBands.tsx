'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { tap } from '../../lib/feel'
import { GRAIN } from '../../lib/grain'

export type HaloPalette = { name: string; core: string; mid: string; edge: string }

export const HALOS: HaloPalette[] = [
  { name: 'Glacier', core: '#8ff5c8', mid: '#6d7cff', edge: '#c6d0ff' },
  { name: 'Apricot', core: '#e68cf0', mid: '#ff9450', edge: '#ffdcb8' },
  { name: 'Orchid', core: '#6f95ff', mid: '#cf6dff', edge: '#efc6ff' },
  { name: 'Tide', core: '#fff0a0', mid: '#36c8d8', edge: '#b4ecf2' },
]

const BANDS = [
  { w: 132, h: 180, speed: 3.4 },
  { w: 108, h: 164, speed: 2.7 },
  { w: 88, h: 150, speed: 2.1 },
]
const GLOW = 0.92

type Rgb = [number, number, number]
const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb
const css = (c: Rgb, a = 1) => `rgb(${c.map(Math.round).join(' ')} / ${a})`

export function HaloBands({
  children,
  palettes = HALOS,
  defaultPalette = 0,
  pressToChange = true,
  onPaletteChange,
  className = '',
}: {
  children?: ReactNode
  palettes?: HaloPalette[]
  defaultPalette?: number
  pressToChange?: boolean
  onPaletteChange?: (palette: HaloPalette) => void
  className?: string
}) {
  const [palette, setPalette] = useState(defaultPalette)
  const box = useRef<HTMLDivElement>(null)
  const glows = useRef<(HTMLDivElement | null)[]>([])
  const target = useRef(palettes[defaultPalette])
  const pointer = useRef<number | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    target.current = palettes[palette]
  }, [palette, palettes])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const first = target.current
    const colours = { core: rgb(first.core), mid: rgb(first.mid), edge: rgb(first.edge) }
    const light = BANDS.map(() => 50)
    let painted = ''
    let raf = 0
    let seen = true
    let last = 0

    const isDark = () => {
      const [r = 255, g = 255, b = 255] = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? []
      return 0.2126 * r + 0.7152 * g + 0.0722 * b < 90
    }
    let dark = isDark()
    let checked = 0
    const fill = () => {
      const glow = dark
        ? `radial-gradient(closest-side, ${css(colours.core, 0.9)} 0%, ${css(colours.mid, 0.82)} 24%, ${css(colours.mid, 0.3)} 50%, ${css(colours.mid, 0)} 76%)`
        : `radial-gradient(closest-side, ${css(colours.core)} 0%, ${css(colours.mid)} 40%, ${css(colours.edge, 0.75)} 68%, ${css(colours.edge, 0)} 100%)`
      if (glow === painted) return
      painted = glow
      glows.current.forEach((node) => {
        if (node) node.style.backgroundImage = glow
      })
    }
    const frame = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000 || 0.016)
      last = time
      const t = time / 1000
      if (t - checked > 0.4) {
        checked = t
        dark = isDark()
      }
      const want = target.current
      const melt = 1 - Math.exp(-dt * 2.2)
      ;(['core', 'mid', 'edge'] as const).forEach((k) => {
        const to = rgb(want[k])
        colours[k] = colours[k].map((v, i) => v + (to[i] - v) * melt) as Rgb
      })
      fill()
      BANDS.forEach((b, i) => {
        const aim = pointer.current ?? 50 + Math.sin(t * 0.42 + i * 0.7) * 15
        light[i] += (aim - light[i]) * (1 - Math.exp(-dt * b.speed))
        const move = `translate3d(0, ${(light[i] / GLOW).toFixed(3)}%, 0)`
        const left = glows.current[i * 2]
        const right = glows.current[i * 2 + 1]
        if (left) left.style.transform = move
        if (right) right.style.transform = move
      })
    }
    const loop = (time: number) => {
      if (seen) frame(time)
      raf = requestAnimationFrame(loop)
    }
    if (reduce) {
      fill()
      BANDS.forEach((_, i) => {
        ;[glows.current[i * 2], glows.current[i * 2 + 1]].forEach((node) => {
          if (node) node.style.transform = `translate3d(0, ${50 / GLOW}%, 0)`
        })
      })
    } else raf = requestAnimationFrame(loop)
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
    })
    io.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [reduce])

  return (
    <div
      ref={box}
      onPointerMove={(e) => {
        const r = box.current!.getBoundingClientRect()
        pointer.current = ((e.clientY - r.top) / r.height) * 100
      }}
      onPointerLeave={() => {
        pointer.current = null
      }}
      onPointerDown={(e) => {
        if (!pressToChange || (e.target as HTMLElement).closest('button, a, input, textarea, select')) return
        tap()
        const next = (palette + 1) % palettes.length
        setPalette(next)
        onPaletteChange?.(palettes[next])
      }}
      className={`relative isolate overflow-hidden rounded-[28px] bg-surface ${className}`}
    >
      {BANDS.map((b, i) => (
        <div key={i} aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[50%] bg-surface shadow-[0_0_34px_14px_var(--surface),inset_0_0_0_1px_var(--line)]" style={{ width: `${b.w}%`, height: `${b.h}%` }}>
          {[0, 1].map((side) => (
            <div
              key={side}
              ref={(n) => {
                glows.current[i * 2 + side] = n
              }}
              className="absolute w-[76%] will-change-transform"
              style={{ height: `${GLOW * 100}%`, top: `${(-GLOW / 2) * 100}%`, left: side ? '62%' : '-38%' }}
            />
          ))}
        </div>
      ))}
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[138%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-surface shadow-[0_0_34px_14px_var(--surface),inset_0_0_0_1px_var(--line)]" />
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: GRAIN }} />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
