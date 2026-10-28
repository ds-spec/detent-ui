'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Alert, Check } from '@/lab/icons'
import { RollingText } from '@/lab/ui/RollingText'

export { ChartCard } from './ChartCard'

const STATES = {
  ok: { tone: 'var(--ok)', label: 'Within limit', Icon: Check },
  warn: { tone: 'var(--warn)', label: 'Close to limit', Icon: Alert },
  over: { tone: 'var(--danger)', label: 'Over limit', Icon: Alert },
} as const

const round = (n: number) => Math.round(n * 100) / 100

/**
 * A reading against a limit, on an arc of ticks that light up to it one after another. The lit
 * ticks take the colour of how close it is: fine, within a fifth of the limit, or past it, and say
 * so in words underneath. The limit itself is a longer tick.
 */
export function Gauge({ value, max, limit, label, format = (v) => v.toFixed(2), unit = '' }: { value: number; max: number; limit: number; label: string; format?: (n: number) => string; unit?: string }) {
  const reduce = useReducedMotion()
  const N = 37
  const lit = Math.round((Math.min(value, max) / max) * (N - 1)) + 1
  const mark = Math.round((limit / max) * (N - 1))
  const state = STATES[value >= limit ? 'over' : value >= limit * 0.8 ? 'warn' : 'ok']
  const S = 216
  const R = 92
  const cy = R + 12
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: S, height: cy + 6 }}>
        <svg width={S} height={cy + 6} className="block overflow-visible" role="img" aria-label={`${label}: ${format(value)}${unit}, limit ${format(limit)}${unit}, ${state.label.toLowerCase()}`}>
          {Array.from({ length: N }, (_, i) => {
            const angle = Math.PI - (i / (N - 1)) * Math.PI
            // Rounded, so the server and the browser draw the same arc.
            const x = round(S / 2 + Math.cos(angle) * R)
            const y = round(cy - Math.sin(angle) * R)
            const on = i < lit
            const long = i === mark
            return (
              <motion.rect
                key={i}
                x={x - 2}
                y={y - (long ? 13 : 9)}
                width={4}
                height={long ? 22 : 18}
                rx={2}
                transform={`rotate(${round(90 - (angle * 180) / Math.PI)} ${x} ${y})`}
                initial={false}
                animate={{ fill: on ? state.tone : long ? 'var(--ink-3)' : 'color-mix(in oklch, var(--ink) 10%, transparent)' }}
                transition={reduce ? { duration: 0 } : { duration: 0.2, delay: on ? i * 0.018 : 0 }}
              />
            )
          })}
        </svg>
        <p className="absolute inset-x-0 bottom-0 flex justify-center text-[32px] font-semibold leading-none tracking-[-0.04em] text-ink">
          <RollingText text={`${format(value)}${unit}`} proportional />
        </p>
      </div>
      <p className="mt-3 text-caption text-ink-3">
        {label} · limit {format(limit)}
        {unit}
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-medium text-ink" style={{ background: `color-mix(in oklch, ${state.tone} 14%, transparent)` }}>
        <state.Icon size={12} strokeWidth={2.6} style={{ color: state.tone }} />
        {state.label}
      </p>
    </div>
  )
}
