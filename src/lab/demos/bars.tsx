'use client'

import { useRef, useState } from 'react'
import { BarChart, Change, ChartCard } from '../components/charts/BarChart'
import type { BarHandle } from '../components/charts/BarChart'
import { Big, Segmented, sum, useScript } from './chart-kit'

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKS = [
  [38, 46, 41, 52, 44, 12, 9],
  [31, 39, 44, 40, 36, 10, 6],
  [27, 33, 30, 36, 41, 4, 7],
]
type Week = 'this' | 'last'

export function BarsDemo() {
  const [week, setWeek] = useState<Week>('this')
  const bars = useRef<BarHandle>(null)
  const k = week === 'this' ? 0 : 1
  const [now, before] = [WEEKS[k], WEEKS[k + 1]]

  const script = useScript(async ({ beat }) => {
    await beat(1600)
    for (const i of [0, 1, 2, 3, 4, 5, 6]) {
      bars.current?.point(i)
      await beat(i === 3 ? 1200 : 520)
    }
    bars.current?.point(null)
    await beat(800)
    setWeek('last')
    await beat(1600)
    bars.current?.point(4)
    await beat(1300)
    bars.current?.point(null)
    await beat(500)
    setWeek('this')
    await beat(1800)
  })

  return (
    <div className="w-[480px] max-w-full" {...script}>
      <ChartCard
        title="Deploys by weekday"
        headline={
          <div className="flex items-center gap-2">
            <Big>{String(sum(now))}</Big>
            <Change value={sum(now) / sum(before) - 1} />
          </div>
        }
        actions={
          <Segmented
            small
            label="Week"
            value={week}
            options={[
              ['this', 'This week'],
              ['last', 'Last week'],
            ]}
            onChange={setWeek}
          />
        }
        table={{ head: ['Day', week === 'this' ? 'This week' : 'Last week', week === 'this' ? 'Last week' : 'Week before'], rows: WEEK.map((w, i) => [w, now[i], before[i]]) }}
      >
        <BarChart
          ref={bars}
          categories={WEEK}
          series={[
            { id: 'now', label: week === 'this' ? 'This week' : 'Last week', values: now },
            { id: 'before', label: week === 'this' ? 'Last week' : 'Week before', values: before },
          ]}
          target={{ value: 40, label: 'Goal' }}
          height={216}
        />
      </ChartCard>
    </div>
  )
}
