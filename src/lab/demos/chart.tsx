'use client'

import { useRef } from 'react'
import { BaselineChart } from '../components/baseline/BaselineChart'
import type { BaselineHandle, Reading } from '../components/baseline/BaselineChart'
import { useLoop } from '@/lab/demos/loop'
import { useBench } from '@/lab/demos/bench'

const REVENUE = [41.2, 41.9, 41.4, 42.6, 43.1, 42.2, 40.8, 40.1, 39.2, 38.4, 38.9, 37.6, 36.8, 37.4, 38.6, 39.4, 41.2, 42.8, 42.1, 43.6, 45.2, 44.6, 46.1, 47.8, 47.2, 48.9, 50.4, 49.6, 51.2, 53.4, 52.6, 54.1, 55.8, 55.2, 57.3, 59.1, 58.4, 60.2]
const DATA: Reading[] = REVENUE.map((v, i) => ({ label: new Date(2026, 8, 1 + i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: v * 1000 }))
const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export function ChartDemo() {
  const b = useBench()
  const chart = useRef<BaselineHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      for (const [from, to] of [[5, 37], [12, 30], [26, 37], [4, 12]]) {
        chart.current?.read(null)
        chart.current?.start(from)
        await beat(1700)
        for (let i = from + 1; i <= to; i += 2) {
          chart.current?.read(i)
          await beat(60)
        }
        await beat(1600)
      }
    }
  })
  return (
    <div className="w-[760px] max-w-full max-sm:w-[400px]" {...handlers}>
      <BaselineChart ref={chart} data={DATA} start={5} format={money} label={b.get('label', 'Revenue')} look={b.get('look', 'ink')} onStart={b.on('onStart')} />
    </div>
  )
}
