'use client'

import { useId, useRef } from 'react'
import { motion, useTransform } from 'motion/react'
import { useSize } from '@/lab/lib/hooks'
import { RollingText } from '@/lab/ui/RollingText'
import { Change, Drawn, Pulse, SERIES, compact, smooth, useMorph } from './parts'

export { Change } from './parts'

/** A number first, rolling into place, with how it moved and a small chart of how it got there. */
export function StatTile({ label, value, format = compact, change, vs = 'last period', good = 'up', trend, color = SERIES[0] }: { label: string; value: number; format?: (n: number) => string; /** As a fraction: 0.124 is up 12.4%. */ change?: number; vs?: string; good?: 'up' | 'down'; trend?: number[]; color?: string }) {
  const id = useId()
  const box = useRef<HTMLDivElement>(null)
  const { w } = useSize(box)
  const pts = trend ?? []
  const h = 48
  const max = Math.max(...pts, 1)
  const min = Math.min(...pts)
  const xs = pts.map((_, i) => (i / Math.max(1, pts.length - 1)) * (w - 18))
  const ys = pts.map((v) => h - 8 - ((v - min) / (max - min || 1)) * (h - 20))
  const line = smooth(xs, ys)
  const morphY = useMorph(ys)
  const d = useTransform(morphY, (y) => smooth(xs, y))
  const area = useTransform(morphY, (y) => `${smooth(xs, y)}L${xs[xs.length - 1]},${h}L${xs[0]},${h}Z`)
  const endY = useTransform(morphY, (y) => y[y.length - 1] ?? 0)
  return (
    <div className="lit min-w-0 overflow-hidden rounded-[20px] bg-surface ring-1 ring-[color-mix(in_oklch,var(--ink)_7%,transparent)]">
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-footnote font-medium text-ink-2">{label}</p>
          {change !== undefined && <Change value={change} good={good} />}
        </div>
        <p className="mt-2.5 flex text-[30px] font-semibold leading-none tracking-[-0.035em] text-ink">
          <RollingText text={format(value)} proportional />
        </p>
        {change !== undefined && <p className="mt-1.5 truncate text-caption text-ink-3">vs {vs}</p>}
      </div>
      <div ref={box} className="mt-1 h-12">
        {pts.length > 1 && w > 0 && (
          <svg width={w} height={h} className="block overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.26} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <motion.path d={area} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
            <Drawn d={d} still={line} color={color} />
            <Pulse cx={xs[xs.length - 1]} cy={endY} color={color} />
          </svg>
        )}
      </div>
    </div>
  )
}
