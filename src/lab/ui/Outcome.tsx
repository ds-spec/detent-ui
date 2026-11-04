'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ease } from '@/lab/lib/motion'

export function Bloom({ k, color = 'var(--ok)', radius, spread = 12, delay = 0 }: { k: string | number | null; color?: string; radius: number | string; spread?: number; delay?: number }) {
  if (k === null) return null
  return <span key={k} aria-hidden className="bloom pointer-events-none absolute inset-0" style={{ borderRadius: radius, animationDelay: `${delay}s`, ['--bloom' as string]: color, ['--bloom-spread' as string]: `${spread}px` }} />
}

export function DrawnCheck({ size = 13, delay = 0.12, strokeWidth = 3 }: { size?: number; delay?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.32, ease: ease.out, delay }} />
    </svg>
  )
}

export function Sweep({ k, color = 'var(--ok)', delay = 0, axis = 'x' }: { k: string | number | null; color?: string; delay?: number; axis?: 'x' | 'y' }) {
  const across = axis === 'x'
  const band = (deg: number) => `linear-gradient(${deg}deg, transparent 15%, color-mix(in oklch, ${color} 26%, transparent) 42%, color-mix(in oklch, ${color} 40%, rgb(255 255 255 / 0.5)) 50%, color-mix(in oklch, ${color} 26%, transparent) 58%, transparent 85%)`
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden" style={{ borderRadius: 'inherit' }}>
      <AnimatePresence>
        {k !== null && (
          <motion.span
            key={k}
            className={across ? 'absolute inset-y-0 left-0 w-1/2' : 'absolute inset-x-0 top-0 h-1/2'}
            style={{ background: band(across ? 100 : 180) }}
            initial={across ? { x: '-110%' } : { y: '-110%' }}
            animate={across ? { x: '230%' } : { y: '230%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: across ? 0.85 : 0.9, ease: ease.inOut, delay }}
          />
        )}
      </AnimatePresence>
    </span>
  )
}
