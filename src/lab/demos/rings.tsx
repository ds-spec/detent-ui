'use client'

import { useRef, useState } from 'react'
import { ChartCard, GoalNumerals, compact } from '../components/charts/GoalNumerals'
import type { Goal, GoalsHandle } from '../components/charts/GoalNumerals'
import { Segmented, useScript } from './chart-kit'

type Month = 'oct' | 'sep'

function month(end: number, today: number, seed: number) {
  let r = seed
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280
  const daily = Array.from({ length: today + 1 }, (_, i) => 0.7 + rnd() * 0.7 - (i % 7 >= 5 ? 0.4 : 0))
  const total = daily.reduce((a, b) => a + b, 0)
  let run = 0
  return daily.map((v) => (run += (v / total) * end))
}

const MONTHS: Record<Month, { name: string; days: number; today: number; goals: Goal[] }> = {
  oct: {
    name: 'Oct',
    days: 31,
    today: 27,
    goals: [
      { id: 'sonnet', label: 'Sonnet', goal: 9_000_000, series: month(7_420_000, 27, 11) },
      { id: 'haiku', label: 'Haiku', goal: 4_000_000, series: month(4_610_000, 27, 23) },
      { id: 'opus', label: 'Opus', goal: 2_000_000, series: month(1_290_000, 27, 37) },
    ],
  },
  sep: {
    name: 'Sep',
    days: 30,
    today: 29,
    goals: [
      { id: 'sonnet', label: 'Sonnet', goal: 9_000_000, series: month(8_640_000, 29, 5) },
      { id: 'haiku', label: 'Haiku', goal: 4_000_000, series: month(3_120_000, 29, 17) },
      { id: 'opus', label: 'Opus', goal: 2_000_000, series: month(2_260_000, 29, 29) },
    ],
  },
}

const CROSS = MONTHS.oct.goals[1].series.findIndex((v) => v >= MONTHS.oct.goals[1].goal) - 1

export function RingsDemo() {
  const [key, setKey] = useState<Month>('oct')
  const [day, setDay] = useState<number | null>(null)
  const goals = useRef<GoalsHandle>(null)
  const m = MONTHS[key]
  const d = day ?? m.today
  const at = (g: Goal) => g.series[Math.min(d, g.series.length - 1)]
  const [broke, setBroke] = useState<string[] | null>(null)
  const over = (broke ? m.goals.filter((g) => broke.includes(g.id)) : m.goals.filter((g) => at(g) > g.goal)).map((g) => g.label)
  const said = over.length ? `${over.join(' and ')} ${over.length > 1 ? 'are' : 'is'} over.` : 'Everything’s within its allowance.'

  const script = useScript(async ({ beat }) => {
    await beat(2600)
    for (const id of ['sonnet', 'haiku', 'opus']) {
      goals.current?.point(id)
      await beat(900)
    }
    goals.current?.point(null)
    await beat(600)
    goals.current?.sweep(0, 900)
    await beat(1300)
    goals.current?.sweep(CROSS, 2200)
    await beat(2200)
    goals.current?.sweep(CROSS + 2, 1300)
    await beat(1500)
    goals.current?.sweep(MONTHS.oct.today, 1000)
    await beat(1100)
    await beat(1800)
    setBroke(null)
    setKey('sep')
    await beat(2800)
    goals.current?.point('opus')
    await beat(1200)
    goals.current?.point(null)
    await beat(500)
    setBroke(null)
    setKey('oct')
    await beat(2000)
  })

  return (
    <div className="w-[420px] max-w-full" {...script}>
      <ChartCard
        title="Allowance this month"
        headline={<p className="text-[20px] leading-[26px] tracking-[-0.02em] text-ink">{said}</p>}
        actions={
          <Segmented
            small
            label="Month"
            value={key}
            options={[
              ['oct', 'Oct'],
              ['sep', 'Sep'],
            ]}
            onChange={(k) => {
              setDay(null)
              setBroke(null)
              setKey(k)
            }}
          />
        }
        table={{ head: ['Model', 'Used', 'Allowance', 'Share'], rows: m.goals.map((g) => [g.label, compact(at(g)), compact(g.goal), `${Math.round((at(g) / g.goal) * 100)}%`]) }}
      >
        <div className="pt-1">
          <GoalNumerals key={key} ref={goals} goals={m.goals} days={m.days} today={m.today} dayLabel={(i) => `${m.name} ${i + 1}`} onDayChange={setDay} onOver={setBroke} />
        </div>
      </ChartCard>
    </div>
  )
}
