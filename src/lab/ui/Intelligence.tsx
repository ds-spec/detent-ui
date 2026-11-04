'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { MotionStyle } from 'motion/react'
import { ease } from '@/lab/lib/motion'

export type Tone = 'loud' | 'quiet'

const ended = new Map<string, number>()

export function useTone(on: boolean, surface: string, rest = 120_000): Tone {
  const [tone, setTone] = useState<Tone>('loud')
  const was = useRef(false)
  useLayoutEffect(() => {
    if (on && !was.current) {
      const last = ended.get(surface)
      setTone(last === undefined || performance.now() - last > rest ? 'loud' : 'quiet')
    }
    if (!on && was.current) ended.set(surface, performance.now())
    was.current = on
    return () => {
      if (was.current) ended.set(surface, performance.now())
    }
  }, [on, surface, rest])
  return tone
}

export function Glow({
  on,
  layer,
  radius,
  style,
  className = '',
  tone = 'loud',
}: {
  on: boolean
  layer: 'halo' | 'ring'
  radius: number | string
  style?: MotionStyle
  className?: string
  tone?: Tone
}) {
  return (
    <AnimatePresence>
      {on && !(layer === 'halo' && tone === 'quiet') && (
        <motion.span
          aria-hidden
          className={`${layer === 'halo' ? 'ai-halo' : 'ai-ring'} ${tone === 'quiet' ? 'ai-quiet' : ''} ${className}`}
          style={{ borderRadius: radius, ...style }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, ease: ease.out } }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] } }}
        />
      )}
    </AnimatePresence>
  )
}

const INKS = ['var(--ai-ink-1)', 'var(--ai-ink-2)', 'var(--ai-ink-3)', 'var(--ai-ink-4)']

export const aiInk = (t: number) => {
  const x = Math.min(0.9999, Math.max(0, t)) * (INKS.length - 1)
  const k = Math.floor(x)
  const f = Math.round((x - k) * 100)
  return `color-mix(in oklch, ${INKS[k]} ${100 - f}%, ${INKS[k + 1]})`
}

export const aiWord = (n: number) => INKS[n % INKS.length]

export const aiText = (tone: Tone) => (tone === 'loud' ? 'ai-text' : 'ai-text ai-quiet')
export const aiWords = (tone: Tone) => (tone === 'loud' ? 'word-in ai-warm' : 'word-in')
