'use client'

import { useEffect, useState } from 'react'
import { LiveList } from '../components/livelist/LiveList'
import type { LiveGroup, LiveItem, LivePerson } from '../components/livelist/LiveList'
import { useBench } from '@/lab/demos/bench'

const PEOPLE: LivePerson[] = [
  { id: 'you', name: 'You', hue: 250 },
  { id: 'maya', name: 'Maya Chen', hue: 150 },
  { id: 'arjun', name: 'Arjun Rao', hue: 60 },
  { id: 'sofia', name: 'Sofia Park', hue: 330 },
  { id: 'leo', name: 'Leo Martin', hue: 200 },
]

const GROUPS: LiveGroup[] = [
  { id: 'design', label: 'Design', hue: 300 },
  { id: 'build', label: 'Build', hue: 240 },
  { id: 'launch', label: 'Launch', hue: 50 },
]

const START: LiveItem[] = [
  { id: '1', title: 'Final pass on pricing page', group: 'design', by: 'sofia' },
  { id: '2', title: 'Export OG images', group: 'design', by: 'you', done: true },
  { id: '3', title: 'Ship the billing webhook', group: 'build', by: 'arjun' },
  { id: '4', title: 'Rate limit the public API', group: 'build', by: 'leo' },
  { id: '5', title: 'Migrate staging database', group: 'build', by: 'arjun', done: true },
  { id: '6', title: 'Write the changelog', group: 'launch', by: 'maya' },
  { id: '7', title: 'Schedule the X thread', group: 'launch', by: 'you' },
]

const SCRIPT: ((items: LiveItem[]) => LiveItem[])[] = [
  (items) => [...items, { id: 'm1', title: 'Record a 20s demo clip', group: 'launch', by: 'maya', at: Date.now() }],
  (items) => items.map((i) => (i.id === '3' ? { ...i, done: true } : i)),
  (items) => [...items, { id: 'm2', title: 'Check empty states on mobile', group: 'design', by: 'sofia', at: Date.now() }],
  (items) => items.map((i) => (i.id === '1' ? { ...i, done: true } : i)),
]

export function LiveListDemo() {
  const b = useBench()
  const [items, setItems] = useState(START)
  useEffect(() => {
    let k = 0
    const t = setInterval(() => {
      if (k >= SCRIPT.length) return clearInterval(t)
      setItems(SCRIPT[k++])
    }, 3200)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="w-full max-w-[400px] min-w-0">
        <LiveList
          title="Friday launch"
          people={PEOPLE}
          groups={GROUPS}
          items={items}
          onItemsChange={(next) => {
            setItems(next)
            b.log('onItemsChange', next)
          }}
          me="you"
        />
      </div>
    </div>
  )
}
