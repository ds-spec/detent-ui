'use client'

import { useState } from 'react'
import { MetricExplainer } from '../components/metric/MetricExplainer'
import type { Metric } from '../components/metric/MetricExplainer'
import { useScript } from './chart-kit'

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/** A startup's October books, read four ways. Lumpy numbers, real merchants, a reason for each. */
const METRICS: Metric[] = [
  {
    id: 'burn',
    name: 'Burn',
    value: 184_320,
    previous: 171_910,
    format: usd,
    vs: 'September',
    reason: 'Most of it is infrastructure: the new AWS region costs more than planned, and payroll grew with two hires. Contractors and Figma brought it down a little.',
    drivers: [
      { name: 'AWS', note: 'the new eu-west region, live since Oct 9', amount: 8_920 },
      { name: 'Payroll', note: 'two engineers joined on Oct 1', amount: 6_200 },
      { name: 'Contractors', note: 'the brand project wrapped up', amount: -1_880 },
      { name: 'Figma', note: 'seats moved to annual billing', amount: -830 },
    ],
    basis: 'From 1,284 transactions · 4 drivers explain 96% of the change',
  },
  {
    id: 'revenue',
    name: 'Revenue',
    value: 212_904,
    previous: 194_654,
    format: usd,
    vs: 'September',
    reason: 'Expansion did the work: Okapi and Kestrel moved to the Team plan, and annual renewals landed early. One churned account took a little back.',
    drivers: [
      { name: 'Expansion', note: 'Okapi and Kestrel moved up to Team', amount: 11_640 },
      { name: 'New logos', note: '9 customers, 6 from the October webinar', amount: 7_380 },
      { name: 'Renewals', note: 'three annual plans renewed a month early', amount: 2_410 },
      { name: 'Churn', note: 'Marlow Health left for an in-house tool', amount: -3_180 },
    ],
    basis: 'From Stripe · 412 invoices · 4 drivers explain 99% of the change',
  },
  {
    id: 'runway',
    name: 'Runway',
    value: 19.4,
    previous: 20.5,
    format: (n) => `${n.toFixed(1)} months`,
    vs: 'last month',
    reason: 'Runway is shorter because burn grew faster than revenue. At this pace the bank balance lasts until May 2028, a month earlier than in September.',
    drivers: [
      { name: 'Higher burn', note: 'AWS and the two hires, every month from here', amount: -1.4 },
      { name: 'More revenue', note: 'expansion revenue, if it holds', amount: 0.5 },
      { name: 'FX', note: 'the euro balance lost 1.2% against the dollar', amount: -0.2 },
    ],
    basis: 'Cash $3.57M at Mercury and Brex · net burn averaged over 3 months',
  },
  {
    id: 'margin',
    name: 'Gross margin',
    value: 71.8,
    previous: 71.2,
    format: (n) => `${n.toFixed(1)}%`,
    vs: 'September',
    reason: 'Margin edged up: revenue grew faster than hosting, and the support team handled more tickets without new hires. The new region pulled the other way.',
    drivers: [
      { name: 'Revenue mix', note: 'more Team plans, which cost less to serve', amount: 0.9 },
      { name: 'Support', note: 'tickets per agent up 14%', amount: 0.4 },
      { name: 'Hosting', note: 'eu-west runs at half load for now', amount: -0.7 },
    ],
    basis: 'Cost of revenue from the ledger · hosting, support, payment fees',
  },
]

/** The month's books, read four ways: it moves through each metric on its own; hovering pauses, touching hands it over. */
export function MetricDemo() {
  const [at, setAt] = useState('burn')
  const script = useScript(async ({ beat }) => {
    await beat(4200)
    setAt('revenue')
    await beat(4200)
    setAt('runway')
    await beat(4200)
    setAt('margin')
    await beat(4200)
    setAt('burn')
  })
  return (
    <div {...script}>
      <MetricExplainer metrics={METRICS} metric={at} onMetricChange={setAt} period="October · as of Oct 28" />
    </div>
  )
}
