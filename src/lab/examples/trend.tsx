'use client'

import { OutlookChart } from '../components/outlook/OutlookChart'
import type { Ahead, Past } from '../components/outlook/OutlookChart'

const month = (i: number) => new Date(2025, 4 + i, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
const MRR = [182, 188, 191, 199, 204, 212, 219, 223, 231, 240, 246, 255, 262, 270, 281, 289, 296, 308]
const REVENUE: Past[] = MRR.map((v, i) => ({ label: month(i), value: v * 1000 }))
const REVENUE_AHEAD: Ahead[] = Array.from({ length: 6 }, (_, k) => {
  const d = k + 1
  const mid = 308 + d * 10
  return { label: month(MRR.length + k), low: (mid - d * 9) * 1000, high: (mid + d * 12) * 1000 }
})
const dollars = (n: number) => `$${Math.round(n / 1000)}K`

/** Monthly recurring revenue, six months ahead, in dollars. */
export function TrendRevenue() {
  return <OutlookChart history={REVENUE} forecast={REVENUE_AHEAD} format={dollars} unit="MRR" />
}

const day = (i: number) => new Date(2026, 9, 1 + i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const USED = [61.2, 61.9, 62.4, 63.4, 63.9, 64.8, 65.1, 66.3, 67.0, 67.4, 68.6, 69.2, 70.1, 70.6, 71.8, 72.3, 73.4, 74.0, 74.9, 75.6]
const DISK: Past[] = USED.map((v, i) => ({ label: day(i), value: v }))
const DISK_AHEAD: Ahead[] = Array.from({ length: 12 }, (_, k) => {
  const d = k + 1
  const mid = 75.6 + d * 0.75
  return { label: day(USED.length + k), low: mid - d * 0.45, high: mid + d * 0.7 }
})
const SURE = (t: number) => (t < 0.5 ? 'Plan on it' : t < 0.85 ? 'Rough' : 'A guess')

/** Storage used on a cluster, twelve days ahead, with its own words for how sure it is. */
export function TrendCapacity() {
  return (
    <div className="flex flex-col gap-3">
      <OutlookChart
        history={DISK}
        forecast={DISK_AHEAD}
        format={(n) => `${n.toFixed(1)} TB`}
        unit="used"
        today="Last scan"
        odds={SURE}
        look="plain"
      />
    </div>
  )
}
