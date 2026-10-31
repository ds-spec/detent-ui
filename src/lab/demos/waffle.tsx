'use client'

import { useRef, useState } from 'react'
import { ChartCard, Waffle } from '../components/charts/Waffle'
import type { WaffleHandle } from '../components/charts/Waffle'
import { Big, COLOUR, RANGES, Segmented, dollars, sum, useScript } from './chart-kit'
import type { Range } from './chart-kit'

const MODELS = ['Sonnet', 'Opus', 'Haiku', 'Embeddings', 'Moderation', 'Rerank']
const SPEND: Record<Range, number[]> = {
  '7d': [1180, 940, 410, 120, 40, 28],
  '30d': [4820, 2910, 960, 410, 180, 96],
  '90d': [13900, 6100, 4900, 1240, 520, 310],
}

/** Spend by model: lights each model's cells, then the shares ripple to a week and to ninety days. Hovering pauses; touching hands it over. */
export function WaffleDemo() {
  const [range, setRange] = useState<Range>('30d')
  const waffle = useRef<WaffleHandle>(null)
  const parts = SPEND[range].map((v, i) => ({ id: MODELS[i].toLowerCase(), label: MODELS[i], value: v, color: COLOUR[MODELS[i].toLowerCase()] }))

  const script = useScript(async ({ beat }) => {
    await beat(2200)
    for (const id of ['sonnet', 'opus', 'haiku']) {
      waffle.current?.point(id)
      await beat(1000)
    }
    waffle.current?.point(null)
    await beat(600)
    setRange('7d')
    await beat(2000)
    setRange('90d')
    await beat(2000)
    waffle.current?.point('haiku')
    await beat(1200)
    waffle.current?.point(null)
    await beat(400)
    setRange('30d')
    await beat(1600)
  })

  return (
    <div className="w-[520px] max-w-full" {...script}>
      <ChartCard
        title="Spend by model"
        headline={<Big>{dollars(sum(SPEND[range]))}</Big>}
        actions={<Segmented small label="Range" value={range} options={RANGES.map(([r]) => [r, r])} onChange={setRange} />}
        table={{ head: ['Model', 'Spend'], rows: parts.map((p) => [p.label, dollars(p.value)]) }}
      >
        <div className="pt-1">
          <Waffle ref={waffle} parts={parts} format={dollars} />
        </div>
      </ChartCard>
    </div>
  )
}
