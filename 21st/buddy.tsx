'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

export type BuddyMood = 'idle' | 'listening' | 'thinking' | 'happy' | 'sleepy'

const TONES = {
  ink: { face: 'var(--color-foreground)', eye: 'var(--color-background)' },
  paper: { face: 'var(--color-card)', eye: 'var(--color-foreground)' },
  blue: { face: 'linear-gradient(160deg, #6f9bff, #3d63f0)', eye: '#ffffff' },
} as const

export type BuddyTone = keyof typeof TONES

export type BuddyProps = {
  size?: number
  mood?: BuddyMood
  tone?: BuddyTone
  label?: string
  className?: string
}

export function Buddy({ size = 40, mood = 'idle', tone = 'ink', label, className = '' }: BuddyProps) {
  const box = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const x = useSpring(rx, { stiffness: 220, damping: 22 })
  const y = useSpring(ry, { stiffness: 220, damping: 22 })
  const lid = useMotionValue(1)
  const reach = size * 0.085
  const eye = Math.max(2, size * 0.13)
  const height = useTransform(lid, (v) => eye * 1.75 * v)

  useEffect(() => {
    if (reduce || mood !== 'idle') return
    const move = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect()
      if (!r) return
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / 240)
      rx.set((dx / d) * reach * k)
      ry.set((dy / d) * reach * k)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [mood, reach, reduce, rx, ry])

  useEffect(() => {
    if (mood === 'sleepy') animate(lid, 0.32, { duration: 0.4 })
    else animate(lid, 1, { duration: 0.2 })
    if (reduce) return
    if (mood === 'listening') {
      rx.set(reach * 0.6)
      ry.set(reach * 0.7)
      return
    }
    if (mood === 'happy' || mood === 'sleepy') {
      rx.set(0)
      ry.set(mood === 'sleepy' ? reach * 0.6 : -reach * 0.3)
      return
    }
    if (mood === 'thinking') {
      ry.set(-reach * 0.4)
      const c = animate(rx, [-reach, reach], { duration: 0.7, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' })
      return () => {
        c.stop()
        rx.set(0)
        ry.set(0)
      }
    }
  }, [mood, reach, reduce, rx, ry, lid])

  useEffect(() => {
    if (reduce || mood === 'sleepy' || mood === 'happy') return
    let t = 0
    const blink = () => {
      t = window.setTimeout(() => {
        animate(lid, [1, 0.1, 1], { duration: 0.18, ease: 'easeInOut' })
        blink()
      }, 3200 + Math.random() * 3800)
    }
    blink()
    return () => window.clearTimeout(t)
  }, [lid, reduce, mood])

  const t = TONES[tone]
  return (
    <span
      ref={box}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-slot="buddy"
      className={`relative grid shrink-0 place-items-center shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_0_0_0.5px_rgb(0_0_0/.12),0_1px_2px_rgb(0_0_0/.08)] ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.32, background: t.face } as CSSProperties}
    >
      <span className="flex items-center" style={{ gap: size * 0.14 }}>
        {[0, 1].map((i) =>
          mood === 'happy' ? (
            <motion.svg key={`h${i}`} viewBox="0 0 10 8" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }} style={{ width: eye * 1.7, height: eye * 1.4, x, y }}>
              <path d="M1.5 6.5 Q5 0.5 8.5 6.5" fill="none" style={{ stroke: t.eye }} strokeWidth="2.2" strokeLinecap="round" />
            </motion.svg>
          ) : (
            <motion.span key={`o${i}`} className="block rounded-full" style={{ width: eye, height, x, y, background: t.eye }} />
          ),
        )}
      </span>
    </span>
  )
}

export default Buddy
