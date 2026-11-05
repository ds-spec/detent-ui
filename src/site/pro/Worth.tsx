'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TOTAL_DAYS } from '@/catalog/effort'
import { PLANS } from '@/catalog/pro'
import { RollingText } from '@/lab/ui/RollingText'
import { useSite } from '../Providers'

const MIN = 200
const MAX = 1500
const STEP = 50
const START = 600
const N = (MAX - MIN) / STEP + 1
const LABELS = [200, 500, 1000, 1500]
const money = (n: number) => `$${n.toLocaleString('en-US')}`
const pro = PLANS[0]

function payback(day: number) {
  const minutes = Math.ceil(pro.price / (day / 480))
  if (minutes < 60) return `${minutes} minutes`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} hours`
}

export function Worth() {
  const reduce = useReducedMotion()
  const { tick } = useSite()
  const [rate, setRate] = useState(START)
  const track = useRef<HTMLDivElement>(null)
  const pos = (rate - MIN) / STEP

  const set = (v: number) => {
    const next = Math.max(MIN, Math.min(MAX, Math.round(v / STEP) * STEP))
    if (next !== rate) {
      setRate(next)
      tick()
    }
  }
  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = track.current?.getBoundingClientRect()
    if (!r) return
    set(MIN + ((e.clientX - r.left) / r.width) * (MAX - MIN))
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const by = { ArrowRight: STEP, ArrowUp: STEP, ArrowLeft: -STEP, ArrowDown: -STEP, PageUp: STEP * 5, PageDown: -STEP * 5 }[e.key]
    if (by) set(rate + by)
    else if (e.key === 'Home') set(MIN)
    else if (e.key === 'End') set(MAX)
    else return
    e.preventDefault()
  }

  return (
    <div className="grid gap-10 rounded-[28px] bg-surface p-6 shadow-[var(--card-edge)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div className="flex flex-col">
        <p className="text-[13.5px] text-ink-3">A day of your time is worth</p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="tnum text-[clamp(44px,5vw,64px)] leading-none tracking-[-0.05em] text-ink">
            <RollingText text={money(rate)} />
          </span>
          <span className="text-[17px] text-ink-3">a day</span>
        </p>

        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="What a day of your time is worth"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={rate}
          aria-valuetext={`${money(rate)} a day`}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            fromPointer(e)
          }}
          onPointerMove={(e) => e.buttons && fromPointer(e)}
          className="ring-focus relative mt-auto cursor-ew-resize touch-none select-none rounded-[8px] pb-7 pt-10"
        >
          <div className="flex h-8 items-end justify-between">
            {Array.from({ length: N }, (_, i) => {
              const near = Math.max(0, 1 - Math.abs(i - pos) / 3.5)
              const major = LABELS.includes(MIN + i * STEP)
              return <span key={i} className="w-[2px] rounded-full transition-[height,background-color] duration-200" style={{ height: 10 + (major ? 6 : 0) + near * 16, background: i <= pos ? 'var(--ink)' : 'color-mix(in oklch, var(--ink) 22%, transparent)' }} />
            })}
          </div>
          <motion.span aria-hidden className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center" initial={false} animate={{ left: `${(pos / (N - 1)) * 100}%` }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 600, damping: 40 }}>
            <span className="tnum rounded-full bg-ink px-2 text-[11.5px] leading-5 text-surface">{money(rate)}</span>
            <span className="mt-1 h-9 w-[2px] rounded-full bg-ink" />
          </motion.span>
          <div className="absolute inset-x-0 bottom-0 h-5">
            {LABELS.map((v) => (
              <span key={v} className="tnum absolute -translate-x-1/2 text-[12px] text-ink-3 first:translate-x-0 last:-translate-x-full" style={{ left: `${((v - MIN) / (MAX - MIN)) * 100}%` }}>
                {money(v)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-8 lg:pl-16 lg:shadow-[inset_1px_0_0_var(--line)]">
        <div>
          <p className="text-[13.5px] text-ink-3">Building all {TOTAL_DAYS} days yourself</p>
          <p className="tnum mt-2 text-[clamp(44px,5vw,64px)] leading-none tracking-[-0.05em] text-quiet">
            <RollingText text={money(rate * TOTAL_DAYS)} />
          </p>
        </div>
        <div>
          <p className="text-[13.5px] text-ink-3">With Detent Pro</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-[clamp(44px,5vw,64px)] leading-none tracking-[-0.05em] text-ink">${pro.price}</span>
            <span className="text-[17px] text-ink-3">once</span>
          </p>
          <p className="mt-3 text-[15px] text-ink-2">
            It pays for itself in the first <span className="tnum text-ink">{payback(rate)}</span> of your first day.
          </p>
        </div>
      </div>
    </div>
  )
}
