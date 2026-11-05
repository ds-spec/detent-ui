export const EXAMPLES: Record<string, string> = {
  rings: `"use client"

import { ChartCard, GoalNumerals, compact } from "@/components/detent/components/charts/GoalNumerals"
import type { Goal } from "@/components/detent/components/charts/GoalNumerals"
import { useState } from "react"

const goals: Goal[] = [
  { id: "signups", label: "Signups", goal: 1000, series: [120, 260, 410, 530, 680] },
  { id: "trials", label: "Trials", goal: 300, series: [40, 95, 150, 210, 335] },
]

export default function Page() {
  const [day, setDay] = useState<number | null>(null)
  const at = (g: Goal) => g.series[Math.min(day ?? 4, g.series.length - 1)]

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <ChartCard
          title="Goals this week"
          table={{
            head: ["Goal", "Now", "Target"],
            rows: goals.map((g) => [g.label, compact(at(g)), compact(g.goal)]),
          }}
        >
          <GoalNumerals
            goals={goals}
            days={7}
            today={4}
            dayLabel={(d) => \`Oct \${d + 1}\`}
            onDayChange={setDay}
          />
        </ChartCard>
      </div>
    </main>
  )
}
`,
  meter: `"use client"

import { Gauge } from "@/components/detent/components/charts/Gauge"

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Gauge value={72} max={100} limit={90} label="CPU" unit="%" format={(n) => n.toFixed(0)} />
    </main>
  )
}
`,
  metric: `"use client"

import { MetricExplainer } from "@/components/detent/components/metric/MetricExplainer"
import type { Metric } from "@/components/detent/components/metric/MetricExplainer"

const dollars = (n: number) => \`$\${Math.round(n).toLocaleString("en-US")}\`

const metrics: Metric[] = [
  {
    id: "burn",
    name: "Burn",
    value: 84_200,
    previous: 71_790,
    format: dollars,
    vs: "September",
    reason: "Burn rose mostly because of the new AWS region, with contractor spend close behind.",
    basis: "From 1,284 transactions in the ledger",
    drivers: [
      { name: "AWS", note: "the new eu-west region, live since Oct 9", amount: 8_920, phrase: "the new AWS region" },
      { name: "Contractors", note: "two designers for the launch", amount: 5_400, phrase: "contractor spend" },
      { name: "Software", note: "annual renewals moved to monthly", amount: -1_910 },
    ],
  },
  {
    id: "revenue",
    name: "Revenue",
    value: 212_500,
    previous: 196_300,
    format: dollars,
    vs: "September",
    reason: "Revenue grew on enterprise upgrades, slightly offset by churn in the starter plan.",
    drivers: [
      { name: "Enterprise", note: "three accounts moved up a plan", amount: 19_400, phrase: "enterprise upgrades" },
      { name: "Starter churn", note: "41 accounts left", amount: -3_200, phrase: "churn" },
    ],
  },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <MetricExplainer
        metrics={metrics}
        defaultMetric="burn"
        period="October · as of Oct 28"
        onMetricChange={(id) => console.log(id)}
      />
    </main>
  )
}
`,
  radar: `"use client"

import { RadarCompare } from "@/components/detent/components/viz/RadarCompare"
import type { RadarSeries } from "@/components/detent/components/viz/RadarCompare"

const axes = ["Speed", "Accuracy", "Cost", "Context", "Tools"]

const series: RadarSeries[] = [
  { id: "fast", label: "Fast model", hue: 250, values: [0.95, 0.7, 0.9, 0.55, 0.65] },
  { id: "deep", label: "Deep model", hue: 25, values: [0.55, 0.96, 0.4, 0.92, 0.88] },
  { id: "small", label: "Small model", hue: 150, values: [0.98, 0.55, 0.97, 0.35, 0.4] },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[520px]">
        <RadarCompare
          title="Compare models"
          axes={axes}
          series={series}
          initialPair={["fast", "deep"]}
          onPair={(pair) => console.log(pair)}
        />
      </div>
    </main>
  )
}
`,
  donut: `"use client"

import { SpendDonut } from "@/components/detent/components/viz/SpendDonut"
import type { DonutPeriod } from "@/components/detent/components/viz/SpendDonut"

const periods: DonutPeriod[] = [
  {
    id: "sep",
    label: "Sep",
    slices: [
      { id: "cloud", label: "Cloud", hue: 250, value: 42_000 },
      { id: "people", label: "Contractors", hue: 25, value: 18_500 },
      { id: "tools", label: "Software", hue: 150, value: 9_300 },
    ],
  },
  {
    id: "oct",
    label: "Oct",
    slices: [
      { id: "cloud", label: "Cloud", hue: 250, value: 51_000 },
      { id: "people", label: "Contractors", hue: 25, value: 23_900 },
      { id: "tools", label: "Software", hue: 150, value: 7_400 },
    ],
  },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[460px]">
        <SpendDonut title="Spend" periods={periods} onPoint={(id) => console.log(id)} />
      </div>
    </main>
  )
}
`,
  scatter: `"use client"

import { LassoScatter } from "@/components/detent/components/viz/LassoScatter"
import type { ScatterGroup, ScatterPoint } from "@/components/detent/components/viz/LassoScatter"

const groups: ScatterGroup[] = [
  { id: "api", label: "API", hue: 250 },
  { id: "web", label: "Web", hue: 25 },
]

const points: ScatterPoint[] = Array.from({ length: 120 }, (_, i) => ({
  id: \`request-\${i}\`,
  x: 20 + ((i * 37) % 400),
  y: 40 + ((i * 53) % 900),
  group: i % 3 === 0 ? "web" : "api",
}))

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[640px]">
        <LassoScatter
          title="Slow requests"
          points={points}
          groups={groups}
          xLabel="Payload (KB)"
          yLabel="Latency (ms)"
          noun="requests"
          formatY={(v) => \`\${Math.round(v)} ms\`}
          onSelect={(ids) => console.log(ids)}
        />
      </div>
    </main>
  )
}
`,
  histogram: `"use client"

import { DotHistogram } from "@/components/detent/components/viz/DotHistogram"

const values = Array.from({ length: 800 }, (_, i) => 90 + ((i * 7919) % 260) + (i % 40 === 0 ? 300 : 0))

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[640px]">
        <DotHistogram
          title="Response time"
          values={values}
          bins={40}
          unit="ms"
          noun="requests"
          initialTarget={300}
          onTarget={(v) => console.log(v)}
        />
      </div>
    </main>
  )
}
`,
  funnel: `"use client"

import { FlowFunnel } from "@/components/detent/components/funnel/FlowFunnel"
import type { FunnelStage } from "@/components/detent/components/funnel/FlowFunnel"

const stages: FunnelStage[] = [
  { label: "Visitors", value: 48_000 },
  { label: "Signed up", value: 6_200, why: "the form asks for too much" },
  { label: "Activated", value: 2_900, why: "setup takes over ten minutes" },
  { label: "Paying", value: 610, why: "the trial ends before they see value" },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[720px]">
        <FlowFunnel
          stages={stages}
          goal="paying customers"
          per="a month"
          onChange={(rates) => console.log(rates)}
        />
      </div>
    </main>
  )
}
`,
  bridge: `"use client"

import { RevenueBridge } from "@/components/detent/components/bridge/RevenueBridge"
import type { BridgePeriod } from "@/components/detent/components/bridge/RevenueBridge"

const periods: BridgePeriod[] = [
  {
    id: "q3",
    label: "Q3",
    steps: [
      { label: "Start", value: 1_200_000, total: true },
      { label: "New", value: 240_000 },
      { label: "Expansion", value: 95_000 },
      { label: "Churn", value: -130_000 },
      { label: "End", value: 1_405_000, total: true },
    ],
  },
  {
    id: "q4",
    label: "Q4",
    steps: [
      { label: "Start", value: 1_405_000, total: true },
      { label: "New", value: 310_000 },
      { label: "Expansion", value: 120_000 },
      { label: "Churn", value: -90_000 },
      { label: "End", value: 1_745_000, total: true },
    ],
  },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[720px]">
        <RevenueBridge title="Recurring revenue" periods={periods} onPoint={(i) => console.log(i)} />
      </div>
    </main>
  )
}
`,
  askchart: `"use client"

import { AskChart } from "@/components/detent/components/askchart/AskChart"
import type { ChartAnswer } from "@/components/detent/components/askchart/AskChart"

// Swap this for a call to your own model or route.
async function ask(question: string): Promise<ChartAnswer> {
  return {
    headline: "Europe is catching up with the US",
    detail: \`Your question: \${question}\`,
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { id: "us", label: "United States", values: [1_120_000, 1_160_000, 1_140_000, 1_180_000] },
      { id: "eu", label: "Europe", values: [760_000, 880_000, 960_000, 1_050_000] },
    ],
    lead: "eu",
    format: "currency",
    kind: "bars",
    source: "Sales ledger",
  }
}

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[640px]">
        <AskChart ask={ask} placeholder="Ask about revenue" onAnswer={(q, a) => console.log(q, a)} />
      </div>
    </main>
  )
}
`,
  chart: `"use client"

import { BaselineChart } from "@/components/detent/components/baseline/BaselineChart"
import type { Reading } from "@/components/detent/components/baseline/BaselineChart"

const data: Reading[] = [
  { label: "May", value: 12_400 },
  { label: "Jun", value: 13_900 },
  { label: "Jul", value: 13_200 },
  { label: "Aug", value: 15_800 },
  { label: "Sep", value: 17_100 },
  { label: "Oct", value: 19_600 },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[640px]">
        <BaselineChart
          data={data}
          label="Monthly revenue"
          format={(n) => \`$\${n.toLocaleString("en-US")}\`}
          onStart={(i) => console.log(i)}
        />
      </div>
    </main>
  )
}
`,
  lens: `"use client"

import { LensChart } from "@/components/detent/components/lens/LensChart"
import type { LensPoint } from "@/components/detent/components/lens/LensChart"

const data: LensPoint[] = [
  { label: "Mon", value: 320, group: "Monday" },
  { label: "Tue", value: 410, group: "Tuesday" },
  { label: "Wed", value: 390, group: "Wednesday" },
  { label: "Thu", value: 470, group: "Thursday" },
  { label: "Next Mon", value: 360, group: "Monday" },
  { label: "Next Tue", value: 455, group: "Tuesday" },
  { label: "Next Wed", value: 430, group: "Wednesday" },
  { label: "Next Thu", value: 610, group: "Thursday" },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[640px]">
        <LensChart data={data} unit="sign-ups" label="Daily sign-ups" onRead={(i) => console.log(i)} />
      </div>
    </main>
  )
}
`,
  trend: `"use client"

import { OutlookChart } from "@/components/detent/components/outlook/OutlookChart"
import type { Ahead, Past } from "@/components/detent/components/outlook/OutlookChart"

const history: Past[] = [
  { label: "Oct 22", value: 410 },
  { label: "Oct 23", value: 435 },
  { label: "Oct 24", value: 428 },
  { label: "Oct 25", value: 460 },
  { label: "Oct 26", value: 482 },
]

const forecast: Ahead[] = [
  { label: "Oct 27", low: 470, high: 505 },
  { label: "Oct 28", low: 465, high: 530 },
  { label: "Oct 29", low: 470, high: 560 },
  { label: "Oct 30", low: 475, high: 595 },
]

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[640px]">
        <OutlookChart history={history} forecast={forecast} unit="orders a day" onRead={(i) => console.log(i)} />
      </div>
    </main>
  )
}
`,
  forecast: `"use client"

import { useState } from "react"
import { CashForecast } from "@/components/detent/components/forecast/CashForecast"
import type { Scenario } from "@/components/detent/components/forecast/CashForecast"

const past = [1_400_000, 1_330_000, 1_265_000, 1_190_000, 1_120_000, 1_050_000]
const plan = Array.from({ length: 18 }, () => -60_000)

export default function Page() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <CashForecast
        start={{ y: 2026, m: 4 }}
        past={past}
        plan={plan}
        scenarios={scenarios}
        planLabel="FY27 plan"
        suggestions={["Hire 2 engineers from January"]}
        // Swap this for a call to your own model or route.
        onAsk={async (text) => {
          const scenario: Scenario = {
            id: String(Date.now()),
            kind: "hire",
            read: text,
            from: 7,
            monthly: -24_000,
            on: true,
          }
          setScenarios((all) => [scenario, ...all])
          return scenario
        }}
        onToggle={(id) => setScenarios((all) => all.map((s) => (s.id === id ? { ...s, on: !s.on } : s)))}
        onRemove={(id) => setScenarios((all) => all.filter((s) => s.id !== id))}
      />
    </main>
  )
}
`,
}
