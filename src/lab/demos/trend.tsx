'use client'

import { useRef } from 'react'
import { OutlookChart } from '../components/outlook/OutlookChart'
import type { Ahead, OutlookHandle, Past } from '../components/outlook/OutlookChart'
import { useLoop } from '@/lab/demos/loop'
import { useBench } from '@/lab/demos/bench'

const day = (i: number) => new Date(2026, 9, 1 + i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const TOKENS = [8.2, 8.6, 8.1, 9.2, 9.8, 9.3, 10.4, 10.1, 11.2, 11.9, 11.3, 12.4, 13.1, 12.6, 13.8, 14.6, 14.1, 15.2, 16.1, 15.6, 16.9, 17.4]
const HISTORY: Past[] = TOKENS.map((v, i) => ({ label: day(i), value: v }))
const FORECAST: Ahead[] = Array.from({ length: 14 }, (_, k) => {
  const d = k + 1
  const mid = 17.4 + d * 0.42
  return { label: day(TOKENS.length + k), low: mid - d * 0.5, high: mid + d * 0.62 }
})

export function TrendDemo() {
  const b = useBench()
  const chart = useRef<OutlookHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      for (let i = 0; i < FORECAST.length; i++) {
        chart.current?.read(i)
        await beat(i === 2 || i === 7 || i === 13 ? 1800 : 130)
      }
      await beat(900)
    }
  })
  return (
    <div className="w-[760px] max-w-full max-sm:w-[400px]" {...handlers}>
      <OutlookChart ref={chart} history={HISTORY} forecast={FORECAST} format={(n) => `${n.toFixed(0)}M`} unit={b.get('unit', 'tokens a day')} look={b.get('look', 'ink')} onRead={b.on('onRead')} />
    </div>
  )
}
