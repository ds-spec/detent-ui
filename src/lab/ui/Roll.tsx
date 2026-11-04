'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const SMOOTH = { type: 'spring', bounce: 0, duration: 0.42 } as const

export function Roll({ word, className = '' }: { word: string; className?: string }) {
  const reduce = useReducedMotion()
  const probe = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    const read = () => probe.current && setWidth(probe.current.offsetWidth)
    read()
    void document.fonts?.ready.then(read)
  }, [word])
  return (
    <motion.span initial={false} animate={{ width }} transition={reduce ? { duration: 0 } : SMOOTH} className={`relative inline-flex overflow-hidden align-bottom ${className}`}>
      <span ref={probe} aria-hidden className="invisible absolute left-0 top-0 whitespace-pre">
        {word}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={word} initial={reduce ? false : { y: '70%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? undefined : { y: '-70%', opacity: 0 }} transition={SMOOTH} className="inline-block whitespace-pre">
          {word}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}
