'use client'

import { BaselineChart } from '../components/baseline/BaselineChart'
import type { Reading } from '../components/baseline/BaselineChart'

const day = (m: number, i: number) => new Date(2026, m, 1 + i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const DAU = [8.4, 8.6, 8.1, 8.3, 7.6, 7.2, 8.2, 8.5, 8.3, 8.0, 7.4, 7.1, 7.9, 8.1, 11.6, 13.2, 12.4, 11.8, 10.6, 10.1, 11.2, 11.0, 10.7, 10.9, 9.8, 9.6, 10.8, 11.1, 11.4, 11.7]
const LAUNCH_DAY = 14
const USERS: Reading[] = DAU.map((v, i) => ({ label: day(8, i), value: Math.round(v * 1000) }))

/** Daily active users read from launch day, so the sentence says what the launch kept. */
export function ChartLaunch() {
  return (
    <div className="flex flex-col gap-3">
      <BaselineChart
        data={USERS}
        start={LAUNCH_DAY}
        label="Daily active users"
        format={(n) => `${n.toLocaleString('en-US')} users`}
      />
    </div>
  )
}

const AOV = [48.2, 47.6, 49.1, 50.4, 49.8, 51.2, 50.6, 49.4, 48.8, 47.9, 46.7, 47.3, 48.6, 49.9, 51.4, 52.2, 51.6, 53.1, 54.0, 53.4, 52.8, 54.6, 55.3, 54.7, 56.1, 55.4, 54.2, 55.8, 56.9, 57.4]
const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const ORDERS: Reading[] = AOV.map((v, i) => ({ label: day(9, i), value: v }))

/** Average order value in euros, flat fills, read from the first day of the month. */
export function ChartOrderValue() {
  return <BaselineChart data={ORDERS} label="Average order value" format={(n) => EUR.format(n)} look="plain" />
}
