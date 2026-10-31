'use client'

import { useState } from 'react'
import { ChartCard, Gauge } from '../components/charts/Gauge'
import { RANGES, Segmented, useScript } from './chart-kit'
import type { Range } from './chart-kit'
import { RollingText } from '@/lab/ui/RollingText'

/** Response time percentiles for each range: p50, p90, p95, p99. */
const LATENCY: Record<Range, number[]> = { '7d': [0.58, 0.94, 1.08, 1.86], '30d': [0.61, 1.02, 1.24, 2.14], '90d': [0.66, 1.21, 1.52, 2.61] }
const seconds = (v: number) => v.toFixed(2)

/** p95 latency against its limit: a week comfortably under, the month getting close, ninety days over. Hovering pauses; touching hands it over. */
export function GaugeDemo() {
  const [range, setRange] = useState<Range>('30d')
  const [p50, p90, p95, p99] = LATENCY[range]

  const script = useScript(async ({ beat }) => {
    await beat(2600)
    setRange('7d')
    await beat(2400)
    setRange('90d')
    await beat(2800)
    setRange('30d')
    await beat(2000)
  })

  return (
    <div className="w-[360px] max-w-full" {...script}>
      <ChartCard
        title="Latency"
        actions={<Segmented small label="Range" value={range} options={RANGES.map(([r]) => [r, r])} onChange={setRange} />}
        table={{
          head: ['Percentile', 'Seconds'],
          rows: [
            ['p50', p50],
            ['p90', p90],
            ['p95', p95],
            ['p99', p99],
          ],
        }}
      >
        <div className="pt-3">
          <Gauge value={p95} max={2} limit={1.5} label="p95" format={seconds} unit="s" />
          <div className="mt-5 grid grid-cols-3 pt-3 shadow-[inset_0_1px_0_var(--line)]">
            {(
              [
                ['p50', p50],
                ['p90', p90],
                ['p99', p99],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-caption text-ink-3">{k}</p>
                <p className="mt-0.5 flex justify-center font-mono text-[12.5px] font-medium tabular-nums text-ink">
                  <RollingText text={`${seconds(v)}s`} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  )
}
