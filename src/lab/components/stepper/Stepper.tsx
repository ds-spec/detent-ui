'use client'

import { tap } from '../../lib/feel'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Minus, Plus } from '../../icons'
import { ease, press } from '../../lib/motion'

const DIGIT = '0.62em'
export type StepperHandle = { hold(dir: 1 | -1): void; release(): void; bump(n: number): void }
const SCRUB_PX = 9

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  ref,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  ref?: Ref<StepperHandle>
}) {
  const current = useRef(value)
  current.current = value
  const timer = useRef(0)
  const nudge = useAnimationControls()
  const reduce = useReducedMotion()
  const [scrub, setScrub] = useState<{ x: number; acc: number } | null>(null)
  const [pressing, setPressing] = useState<1 | -1 | 0>(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const bump = (n: number) => {
    const v = current.current
    const next = Math.min(max, Math.max(min, v + n * step))
    if (next === v) {
      if (!reduce) nudge.start({ x: [0, Math.sign(n) * 4, 0], transition: { duration: 0.24, ease: ease.out } })
      return false
    }
    current.current = next
    onChange(next)
    return true
  }

  const hold = (dir: 1 | -1) => {
    clearTimeout(timer.current)
    if (!bump(dir)) return
    let delay = 380
    const tick = () => {
      if (!bump(dir)) return
      delay = Math.max(36, delay * 0.78)
      timer.current = window.setTimeout(tick, delay)
    }
    timer.current = window.setTimeout(tick, delay)
  }
  const release = () => clearTimeout(timer.current)

  useImperativeHandle(ref, () => ({
    hold: (dir) => {
      setPressing(dir)
      hold(dir)
    },
    release: () => {
      setPressing(0)
      release()
    },
    bump: (n) => {
      setPressing(n > 0 ? 1 : -1)
      bump(n)
      window.setTimeout(() => setPressing(0), 140)
    },
  }))

  const digits = Math.max(String(max).length, String(min).length)

  const button = (dir: 1 | -1) => {
    const atLimit = dir > 0 ? value >= max : value <= min
    return (
      <motion.button
        type="button"
        tabIndex={-1}
        aria-label={dir > 0 ? `Increase ${label}` : `Decrease ${label}`}
        data-invite={dir > 0 || undefined}
        aria-disabled={atLimit}
        whileTap={press}
        animate={{ scale: pressing === dir ? 0.94 : 1 }}
        transition={{ duration: 0.12 }}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          tap()
          hold(dir)
        }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        className={`sink flex size-8 pointer-coarse:size-9 shrink-0 touch-none select-none items-center justify-center rounded-full outline-none transition-[color,background-color,box-shadow] duration-150 hover:bg-plate hover:shadow-raised ${pressing === dir ? 'bg-plate shadow-raised' : ''} ${atLimit ? 'text-ink-3/60' : 'text-ink-2 hover:text-ink'}`}
      >
        {dir > 0 ? <Plus size={15} strokeWidth={2.4} /> : <Minus size={15} strokeWidth={2.4} />}
      </motion.button>
    )
  }

  return (
    <div className="flex h-10 w-fit items-center gap-0.5 rounded-full bg-surface-2 p-1">
      {button(-1)}
      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={(e) => {
          const big = e.shiftKey ? 10 : 1
          const keys: Record<string, () => void> = {
            ArrowUp: () => bump(big),
            ArrowRight: () => bump(big),
            ArrowDown: () => bump(-big),
            ArrowLeft: () => bump(-big),
            PageUp: () => bump(10),
            PageDown: () => bump(-10),
            Home: () => onChange(min),
            End: () => onChange(max),
          }
          if (!keys[e.key]) return
          e.preventDefault()
          keys[e.key]()
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setScrub({ x: e.clientX, acc: 0 })
        }}
        onPointerMove={(e) => {
          if (!scrub) return
          let acc = scrub.acc + e.clientX - scrub.x
          while (Math.abs(acc) >= SCRUB_PX) {
            bump(Math.sign(acc))
            acc -= Math.sign(acc) * SCRUB_PX
          }
          setScrub({ x: e.clientX, acc })
        }}
        onPointerUp={() => setScrub(null)}
        onPointerCancel={() => setScrub(null)}
        title="Drag sideways to change"
        className={`ring-focus relative flex h-8 pointer-coarse:h-9 cursor-ew-resize touch-pan-y select-none items-center justify-center rounded-full text-callout font-semibold text-ink transition-colors duration-150 ${scrub ? 'bg-plate' : ''}`}
        style={{ width: `calc(${digits} * ${DIGIT} + 20px)` }}
      >
        <motion.span animate={nudge} className="flex">
          <Ticker value={value} />
        </motion.span>
      </div>
      {button(1)}
    </div>
  )
}

export function Ticker({ value }: {
  value: number
}) {
  const last = useRef(value)
  const dir = value >= last.current ? 1 : -1
  useEffect(() => {
    last.current = value
  }, [value])
  const chars = String(value).split('')
  return (
    <span className="tnum relative flex overflow-hidden" style={{ height: '1.3em', lineHeight: '1.3em' }}>
      <AnimatePresence initial={false}>
        {chars.map((c, i) => (
          <motion.span
            key={chars.length - i}
            className="relative block overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: DIGIT }}
            exit={{ width: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.span
                key={c}
                custom={dir}
                className="absolute inset-0 flex justify-center"
                variants={{
                  enter: (d: number) => ({ y: d > 0 ? '70%' : '-70%', opacity: 0 }),
                  center: { y: '0%', opacity: 1 },
                  exit: (d: number) => ({ y: d > 0 ? '-70%' : '70%', opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
              >
                {c}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  )
}
