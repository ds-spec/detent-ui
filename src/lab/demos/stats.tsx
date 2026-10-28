'use client'

import { useState } from 'react'
import { StatTile } from '../components/charts/StatTile'
import { DAYS, RANGES, Segmented, dollars, usage, useScript, walk } from './chart-kit'
import type { Range } from './chart-kit'

const SPEND: Record<Range, number> = { '7d': 2238, '30d': 9376, '90d': 26970 }
const LATENCY: Record<Range, number> = { '7d': 1.08, '30d': 1.24, '90d': 1.52 }
/** How each moved on the period before, by range. */
const MOVED: Record<Range, [number, number, number]> = { '7d': [0.021, 0.034, -0.021], '30d': [0.043, 0.081, -0.062], '90d': [0.118, 0.212, 0.094] }

/** Four tiles over a week, a month and ninety days: the numbers roll to each, and the small charts reshape. Hovering pauses; touching hands it over. */
export function StatsDemo() {
  const [range, setRange] = useState<Range>('30d')
  const d = usage(range)
  const n = DAYS[range]
  const [spend, requests, latency] = MOVED[range]

  const script = useScript(async ({ beat }) => {
    await beat(3000)
    setRange('7d')
    await beat(2600)
    setRange('90d')
    await beat(2600)
    setRange('30d')
    await beat(1400)
  })

  return (
    <div className="w-[920px]" {...script}>
      <div className="mb-3">
        <Segmented label="Range" value={range} options={RANGES} onChange={setRange} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <StatTile label="Tokens" value={d.tokens} change={d.change} vs={`previous ${n} days`} trend={d.total.slice(-24)} />
        <StatTile label="Spend" value={SPEND[range]} format={dollars} change={spend} vs={`previous ${n} days`} good="down" trend={walk(24, 41 + n, 300, 0.2)} />
        <StatTile label="Requests" value={Math.round(482_310 * (n / 30))} change={requests} vs={`previous ${n} days`} trend={walk(24, 43 + n, 16000, 0.3)} />
        <StatTile label="p95 latency" value={LATENCY[range]} format={(v) => `${v.toFixed(2)}s`} change={latency} vs={`previous ${n} days`} good="down" trend={walk(24, 47 + n, 130, -0.1)} />
      </div>
    </div>
  )
}
