'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Check } from '../../icons'
import { tap } from '../../lib/feel'
import { ease } from '../../lib/motion'

/** For demos and tests: hold it for `ms` (to the end by default), as a hand would. */
export type HoldHandle = { hold(ms?: number): Promise<void> }

/**
 * For the actions you shouldn't take by accident. Press and hold: a fill sweeps across from the
 * left, and as it passes each letter the letter turns white, so you watch the button change its
 * mind with you. Let go early and the fill drains away; hold to the end and it lands, with a
 * click, and says what it did. Space and Enter hold it from the keyboard too.
 */
export function HoldButton({
  children,
  icon,
  done = 'Deleted',
  duration = 1200,
  reset = 1800,
  onConfirm,
  ref,
}: {
  /** The label, e.g. "Hold to delete". */
  children: ReactNode
  /** An icon before the label. */
  icon?: ReactNode
  /** What it says once confirmed. */
  done?: ReactNode
  /** How long to hold, in ms. */
  duration?: number
  /** How long it shows that it's done before it can be held again, in ms. */
  reset?: number
  /** Called when the hold completes. */
  onConfirm?: () => void
  ref?: Ref<HoldHandle>
}) {
  const p = useMotionValue(0)
  const clip = useTransform(p, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`)
  const [confirmed, setConfirmed] = useState(false)
  const run = useRef<ReturnType<typeof animate> | null>(null)
  const timer = useRef(0)
  const reduce = useReducedMotion()
  useEffect(() => () => clearTimeout(timer.current), [])

  const start = () => {
    if (confirmed) return
    run.current?.stop()
    run.current = animate(p, 1, {
      duration: (duration / 1000) * (1 - p.get()),
      ease: 'linear',
      onComplete: () => {
        tap()
        setConfirmed(true)
        onConfirm?.()
        timer.current = window.setTimeout(() => {
          setConfirmed(false)
          animate(p, 0, { duration: reduce ? 0 : 0.4, ease: ease.out })
        }, reset)
      },
    })
  }
  const stop = () => {
    if (confirmed || p.get() >= 1) return
    run.current?.stop()
    run.current = animate(p, 0, { duration: reduce ? 0 : 0.28, ease: ease.out })
  }

  useImperativeHandle(ref, () => ({
    hold: (ms = duration + 40) =>
      new Promise<void>((resolve) => {
        start()
        window.setTimeout(() => {
          stop()
          resolve()
        }, ms)
      }),
  }))

  // Both labels share one slot, the wider setting the width, so landing never resizes it.
  const label = (
    <span className="grid">
      <span className={`flex items-center justify-center gap-2 whitespace-nowrap px-4 transition-opacity duration-200 [grid-area:1/1] ${confirmed ? 'opacity-0' : ''}`}>
        {icon}
        {children}
      </span>
      <span className={`flex items-center justify-center gap-2 whitespace-nowrap px-4 transition-opacity duration-200 [grid-area:1/1] ${confirmed ? '' : 'opacity-0'}`}>
        <Check size={15} strokeWidth={2.6} />
        {done}
      </span>
    </span>
  )
  return (
    <button
      type="button"
      aria-label={typeof children === 'string' ? children : undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        start()
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          start()
        }
      }}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
      className="ring-focus relative inline-flex h-9 select-none items-center overflow-hidden rounded-control bg-[color-mix(in_oklch,var(--danger)_11%,transparent)] text-callout font-medium text-danger transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--danger)_15%,transparent)]"
    >
      {label}
      {/* The fill, carrying the same label in white: where it has reached, the letters have turned. */}
      <motion.span aria-hidden className="absolute inset-0 flex items-center bg-danger text-white" style={{ clipPath: clip }}>
        {label}
      </motion.span>
    </button>
  )
}
