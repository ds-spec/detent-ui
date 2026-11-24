'use client'

import { useState } from 'react'
import { LiveList } from '../components/livelist/LiveList'
import type { LiveGroup, LiveItem, LivePerson } from '../components/livelist/LiveList'

const TEAM: LivePerson[] = [
  { id: 'you', name: 'You', hue: 250 },
  { id: 'nadia', name: 'Nadia Okoro', hue: 150 },
  { id: 'tom', name: 'Tom Becker', hue: 60 },
]

/** A launch checklist three people share: add an item and it lands in its group under your name. */
export function LiveListLaunch() {
  const groups: LiveGroup[] = [
    { id: 'site', label: 'Site', hue: 300 },
    { id: 'app', label: 'App', hue: 240 },
    { id: 'post', label: 'Announce', hue: 50 },
  ]
  const items: LiveItem[] = [
    { id: '1', title: 'Swap the hero screenshot', group: 'site', by: 'nadia' },
    { id: '2', title: 'Pricing page copy review', group: 'site', by: 'you', done: true },
    { id: '3', title: 'Turn on the new onboarding flag', group: 'app', by: 'tom' },
    { id: '4', title: 'Seed demo workspace', group: 'app', by: 'tom', done: true },
    { id: '5', title: 'Draft the launch email', group: 'post', by: 'nadia' },
  ]
  return (
    <div className="w-[420px] max-w-full">
      <LiveList title="Launch day" people={TEAM} groups={groups} defaultItems={items} me="you" height={340} />
    </div>
  )
}

const PACK: LiveGroup[] = [
  { id: 'gear', label: 'Gear', hue: 200 },
  { id: 'food', label: 'Food', hue: 30 },
]

const TRIP: LiveItem[] = [
  { id: '1', title: 'Two-person tent', group: 'gear', by: 'tom', done: true },
  { id: '2', title: 'Headlamps and spare batteries', group: 'gear', by: 'you' },
  { id: '3', title: 'Water filter', group: 'gear', by: 'nadia' },
  { id: '4', title: 'Oats and coffee for three mornings', group: 'food', by: 'nadia', done: true },
  { id: '5', title: 'Stove fuel', group: 'food', by: 'tom' },
]

/** The list kept in your own state: `items` and `onItemsChange`, with a count read from the same array. */
export function LiveListControlled() {
  const [items, setItems] = useState(TRIP)
  const done = items.filter((i) => i.done).length
  return (
    <div className="flex w-[420px] max-w-full flex-col gap-3">
      <LiveList title="Weekend trip" people={TEAM} groups={PACK} items={items} onItemsChange={setItems} me="you" height={300} />
      <p className="tnum text-center text-[13px] text-ink-3">
        {done} of {items.length} packed
      </p>
    </div>
  )
}
