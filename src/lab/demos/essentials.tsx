'use client'

import { useEffect, useRef, useState } from 'react'
import { DirectionTabs } from '../components/DirectionTabs'
import type { TabsHandle } from '../components/DirectionTabs'
import { Switch } from '../ui/Switch'
import { useBench } from './bench'
import { hover, pressed } from '@/lab/lib/hand'

/** A number with a quiet line of its last two weeks under it. */
function Stat({ label, value, delta, points }: { label: string; value: string; delta: string; points: number[] }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(i / (points.length - 1)) * 100} ${26 - ((p - min) / (max - min || 1)) * 22}`).join(' ')
  return (
    <div className="rounded-[14px] bg-surface-2 p-3.5">
      <div className="text-footnote text-ink-3">{label}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="tnum text-title text-ink">{value}</span>
        <span className="tnum text-caption font-medium text-ok">{delta}</span>
      </div>
      <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-2 h-7 w-full overflow-visible" aria-hidden>
        <path d={d} fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

function Toggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return <Switch label={label} checked={on} onChange={setOn} />
}

const ACTIVITY = [
  { who: 'Maya Chen', what: 'merged', target: 'Pricing page v2', when: '2m' },
  { who: 'Jonas Weber', what: 'commented on', target: 'Onboarding flow', when: '18m' },
  { who: 'Aiko Tanaka', what: 'shipped', target: 'Dark mode', when: '1h' },
  { who: 'Sam Rivera', what: 'invited', target: '3 teammates', when: '3h' },
]

/** Walks the tabs forward and back, so you see content arrive from the side you moved toward. Hovering pauses; touching hands it over. */
export function TabsDemo() {
  const b = useBench()
  const tabs = useRef<TabsHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (;;)
        for (const i of [1, 2, 0]) {
          await beat(2400)
          tabs.current?.go(i)
        }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  // Fixed-height frame with the card pinned to the top, so the tab bar never moves under the cursor.
  return (
    <div className="flex h-[300px] w-[380px] max-w-full items-start" {...hover(held)} {...pressed(() => (touched.current = true))} onKeyDownCapture={() => (touched.current = true)}>
      <DirectionTabs
        ref={tabs}
        id="demo-tabs"
        onChange={b.on('onChange')}
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <div className="grid grid-cols-2 gap-2 px-3 pb-3 pt-1.5">
                <Stat label="Visitors" value="12.4k" delta="+8%" points={[6, 7, 6.5, 8, 7.6, 8.8, 8.2, 9.4, 9, 10.2, 9.8, 11, 11.6, 12.4]} />
                <Stat label="Signups" value="318" delta="+14%" points={[180, 196, 190, 214, 230, 222, 248, 260, 252, 276, 290, 284, 302, 318]} />
              </div>
            ),
          },
          {
            id: 'activity',
            label: 'Activity',
            content: (
              <ul className="px-1.5 pb-2">
                {ACTIVITY.map((a) => (
                  <li key={a.who} className="flex items-center gap-3 rounded-row px-3 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10.5px] font-semibold text-ink-2">
                      {a.who
                        .split(' ')
                        .map((p) => p[0])
                        .join('')}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-footnote text-ink-2">
                      <span className="font-medium text-ink">{a.who}</span> {a.what} <span className="text-ink">{a.target}</span>
                    </span>
                    <span className="tnum text-caption text-ink-3">{a.when}</span>
                  </li>
                ))}
              </ul>
            ),
          },
          {
            id: 'settings',
            label: 'Settings',
            content: (
              <div className="px-1.5 pb-2">
                {[
                  { label: 'Email digest', hint: 'A summary every Monday', on: true },
                  { label: 'Mentions', hint: 'When someone tags you', on: true },
                  { label: 'Product updates', hint: 'New features, once a month', on: false },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between gap-4 rounded-row px-3 py-2.5">
                    <div>
                      <div className="text-callout font-medium">{s.label}</div>
                      <div className="text-caption text-ink-3">{s.hint}</div>
                    </div>
                    <Toggle label={s.label} defaultOn={s.on} />
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
