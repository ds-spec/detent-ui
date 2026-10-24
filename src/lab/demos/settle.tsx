'use client'

import { useRef } from 'react'
import { Settle } from '../components/settle/Settle'
import type { SettleHandle, SettleReading } from '../components/settle/Settle'
import { useBench } from './bench'
import { useLoop } from './loop'

const MINIMUM = 35
const STATEMENT = 1248.6
const BALANCE = 1612.4
const APR = 0.249

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** A card's month: anything under the statement balance carries into next month at the card's rate. */
/** Next month's interest on whatever's left of the statement. */
const cost = (v: number) => (Math.max(0, STATEMENT - v) * APR) / 12

const describe = (v: number): SettleReading => {
  if (v >= BALANCE) return { tone: 'ok', label: 'Balance cleared' }
  if (v >= STATEMENT) return { tone: 'ok', label: 'No interest' }
  return { tone: 'warn', value: usd.format(cost(v)), label: 'interest' }
}

/** Someone works out what to pay this month: a bit more than the minimum, then the statement, past it, back, and pays. */
export function SettleDemo() {
  const b = useBench()
  const wheel = useRef<SettleHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      await beat(1000)
      await wheel.current?.glide(412, 1300)
      await beat(1100)
      await wheel.current?.glide(STATEMENT, 1100)
      await beat(1300)
      await wheel.current?.glide(BALANCE, 800)
      await beat(900)
      await wheel.current?.glide(STATEMENT, 700)
      await beat(900)
      await wheel.current?.pay()
      await beat(2400)
      wheel.current?.reset()
    }
  })
  return (
    <div {...handlers}>
      <Settle
        ref={wheel}
        min={MINIMUM}
        max={BALANCE}
        stops={[
          { amount: MINIMUM, label: 'Minimum' },
          { amount: STATEMENT, label: 'Statement balance' },
          { amount: BALANCE, label: 'Full balance' },
        ]}
        describe={describe}
        cost={cost}
        onChange={b.on('onChange')}
        onPay={b.on('onPay', () => new Promise<void>((r) => setTimeout(r, 1000)))}
        title="Juniper Card"
        subtitle="Statement due Nov 12 · 24.9% APR"
        source="Checking ••4021"
      />
    </div>
  )
}
