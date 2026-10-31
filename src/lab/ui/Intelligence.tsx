'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { MotionStyle } from 'motion/react'
import { ease } from '@/lab/lib/motion'

export type Tone = 'loud' | 'quiet'

// When each surface last stopped working. Kept outside the component, so a demo that remounts
// its component every loop still counts as the same surface seen again.
const ended = new Map<string, number>()

/**
 * Intelligence speaks up once, then quietly. The first time a surface comes alive it wears the
 * full spectrum; after that it keeps the same motion in ink, because the first light is a
 * moment and the tenth is noise. Each kind of surface keeps its own memory (`surface`), and
 * it's loud again after `rest` of quiet, when seeing it is news again.
 */
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

/**
 * Intelligence, the material that means the AI is alive. Wear it only while something is
 * thinking, listening, streaming or working; when the work ends it cools away.
 *
 * It comes in two layers so it can sit around a surface that clips its own content: put the
 * halo before the surface (it glows behind it) and the ring after it (it lights the edge). Both
 * fill their positioned parent unless you size them with `style`.
 */
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
  /** Quiet: no halo, and the edge runs in ink. */
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
          // Cooling down is slower than lighting up: the work is done, there's no hurry.
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] } }}
        />
      )}
    </AnimatePresence>
  )
}

const INKS = ['var(--ai-ink-1)', 'var(--ai-ink-2)', 'var(--ai-ink-3)', 'var(--ai-ink-4)']

/** A colour from the spectrum, by position: 0 is the start, 1 the end. For bars, dots and ticks. */
export const aiInk = (t: number) => {
  const x = Math.min(0.9999, Math.max(0, t)) * (INKS.length - 1)
  const k = Math.floor(x)
  const f = Math.round((x - k) * 100)
  return `color-mix(in oklch, ${INKS[k]} ${100 - f}%, ${INKS[k + 1]})`
}

/** The ink for the n-th word of a stream, so consecutive words land in neighbouring colours. */
export const aiWord = (n: number) => INKS[n % INKS.length]

/** Class names for working text and streamed words in a given tone. */
export const aiText = (tone: Tone) => (tone === 'loud' ? 'ai-text' : 'ai-text ai-quiet')
export const aiWords = (tone: Tone) => (tone === 'loud' ? 'word-in ai-warm' : 'word-in')
