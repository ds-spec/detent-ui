'use client'

import { useEffect, useRef } from 'react'
import { BaselineChart } from './baseline-chart'
import type { BaselineHandle, Reading } from './baseline-chart'

const REVENUE = [41.2, 41.9, 41.4, 42.6, 43.1, 42.2, 40.8, 40.1, 39.2, 38.4, 38.9, 37.6, 36.8, 37.4, 38.6, 39.4, 41.2, 42.8, 42.1, 43.6, 45.2, 44.6, 46.1, 47.8, 47.2, 48.9, 50.4, 49.6, 51.2, 53.4, 52.6, 54.1, 55.8, 55.2, 57.3, 59.1, 58.4, 60.2]
const DATA: Reading[] = REVENUE.map((v, i) => ({ label: new Date(2026, 8, 1 + i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: v * 1000 }))
const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const TOUR = [
  [5, 37],
  [12, 30],
  [26, 37],
  [4, 12],
]

export default function BaselineChartDemo() {
  const chart = useRef<BaselineHandle>(null)
  const box = useRef<HTMLDivElement>(null)
  const held = useRef(false)
  const away = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const seen = new IntersectionObserver(([e]) => (away.current = !e.isIntersecting))
    seen.observe(el)
    let live = true
    const tick = (ms: number) => new Promise<void>((ok, stop) => setTimeout(() => (live && !touched.current ? ok() : stop(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current || away.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (;;) {
        for (const [from, to] of TOUR) {
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
    }
    play().catch(() => {})
    return () => {
      live = false
      seen.disconnect()
    }
  }, [])

  return (
    <div className="flex min-h-[560px] w-full items-center justify-center bg-background p-6">
      <div
        ref={box}
        className="w-full max-w-[760px]"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') held.current = true
        }}
        onPointerLeave={() => (held.current = false)}
        onPointerDownCapture={() => (touched.current = true)}
        onKeyDownCapture={() => (touched.current = true)}
      >
        <BaselineChart ref={chart} data={DATA} start={5} format={money} label="Revenue" />
      </div>
    </div>
  )
}
