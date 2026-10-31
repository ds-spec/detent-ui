'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { tap } from '../../lib/feel'
import { ease } from '../../lib/motion'

export type PhotoLook = { name: string; /** Any CSS filter. */ filter: string }

export const LOOKS: PhotoLook[] = [
  { name: 'Natural', filter: 'none' },
  { name: 'Golden', filter: 'sepia(.38) saturate(1.45) contrast(1.06) brightness(1.06) hue-rotate(-10deg)' },
  { name: 'Film', filter: 'contrast(.9) saturate(.82) brightness(1.1) sepia(.16)' },
  { name: 'Dusk', filter: 'hue-rotate(24deg) saturate(1.4) brightness(.9) contrast(1.08)' },
  { name: 'Sea', filter: 'hue-rotate(-22deg) saturate(1.35) contrast(1.04)' },
  { name: 'Mono', filter: 'grayscale(1) contrast(1.16) brightness(1.03)' },
]

/**
 * A finishing bar for any image. Each look shows on the picture itself, in a thumbnail you can
 * judge at a glance. Pick one, drag how strong it is, and hold the photo to see what you started
 * with. Filters are plain CSS, so it costs nothing to run.
 */
export function PhotoBar({
  src,
  alt,
  looks = LOOKS,
  defaultLook = 1,
  defaultStrength = 80,
  onChange,
  className = '',
}: {
  /** The image to finish. */
  src: string
  /** What the image shows. */
  alt: string
  /** The looks on offer. */
  looks?: PhotoLook[]
  /** Which look starts selected. */
  defaultLook?: number
  /** How strong it starts, 0 to 100. */
  defaultStrength?: number
  /** Called when the look or its strength changes. */
  onChange?: (look: PhotoLook, strength: number) => void
  /** Classes for the frame. Give it a height. */
  className?: string
}) {
  const [look, setLook] = useState(defaultLook)
  const [strength, setStrength] = useState(defaultStrength)
  const [held, setHeld] = useState(false)
  const line = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const pick = (i: number) => {
    tap()
    setLook(i)
    onChange?.(looks[i], strength)
  }
  const set = (next: number) => {
    setStrength(next)
    onChange?.(looks[look], next)
  }
  const read = (e: PointerEvent<HTMLDivElement>) => {
    const r = line.current!.getBoundingClientRect()
    set(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 100))
  }
  const keys = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    set(Math.min(100, Math.max(0, strength + (e.key === 'ArrowRight' ? 5 : -5))))
  }
  const release = () => setHeld(false)

  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-black ${className}`}>
      <img loading="lazy" decoding="async" src={src} alt={alt} draggable={false} className="absolute inset-0 size-full select-none object-cover" />
      <img aria-hidden alt="" loading="lazy" decoding="async" src={src} draggable={false} className="absolute inset-0 size-full select-none object-cover" style={{ filter: looks[look].filter, opacity: held ? 0 : strength / 100, transition: reduce ? undefined : 'opacity 160ms' }} />
      <button
        type="button"
        aria-label="Hold to see the original"
        onPointerDown={() => {
          tap()
          setHeld(true)
        }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setHeld(true)}
        onKeyUp={release}
        onBlur={release}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 cursor-pointer touch-none outline-none"
      />
      <motion.p aria-live="polite" className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-black/45 px-3.5 py-1.5 text-[13px] text-white backdrop-blur-md" initial={false} animate={{ opacity: held ? 1 : 0, y: held ? 0 : -6 }} transition={{ duration: 0.14, ease: ease.out }}>
        Original
      </motion.p>

      <div className="absolute inset-x-3 bottom-3 mx-auto max-w-[500px] rounded-[22px] bg-surface/75 p-2 text-ink shadow-[0_0_0_1px_var(--line),0_26px_54px_-22px_rgb(0_0_0/0.6)] backdrop-blur-2xl">
        <div role="radiogroup" aria-label="Look" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${looks.length}, minmax(0, 1fr))` }}>
          {looks.map((l, i) => (
            <button key={l.name} type="button" role="radio" aria-checked={i === look} onClick={() => pick(i)} className="ring-focus group/look rounded-[13px] text-center">
              <span className="relative block aspect-square overflow-hidden rounded-[13px]">
                <img loading="lazy" decoding="async" src={src} alt="" draggable={false} className="size-full scale-125 object-cover transition-transform duration-200 group-hover/look:scale-[1.34]" style={{ filter: l.filter }} />
                {i === look ? <span aria-hidden className="absolute inset-0 rounded-[13px] shadow-[inset_0_0_0_2.5px_#fff,inset_0_0_0_3.5px_rgb(0_0_0/0.3)]" /> : null}
              </span>
              <span className={`mt-1 block truncate text-[12px] transition-colors duration-150 ${i === look ? 'text-ink' : 'text-ink-3'}`}>{l.name}</span>
            </button>
          ))}
        </div>
        <div
          ref={line}
          role="slider"
          tabIndex={0}
          aria-label="Strength"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={strength}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            read(e)
          }}
          onPointerMove={(e) => e.buttons && read(e)}
          onKeyDown={keys}
          className="ring-focus relative mt-1.5 flex h-9 cursor-ew-resize touch-pan-y select-none items-center justify-between overflow-hidden rounded-[11px] bg-[var(--line)] px-3 text-[13px]"
        >
          <span aria-hidden className="absolute inset-y-0 left-0 bg-surface/80" style={{ width: `${strength}%` }} />
          <span className="relative text-ink-2">Strength</span>
          <span className="tnum relative">{strength}%</span>
        </div>
      </div>
    </div>
  )
}
