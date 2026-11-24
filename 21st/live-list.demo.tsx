'use client'

import { useEffect, useRef, useState } from 'react'
import { LiveList } from './live-list'
import type { LiveGroup, LiveItem, LivePerson } from './live-list'

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
  { id: 's1', title: 'Final pass on pricing page', group: 'design', by: 'sofia' },
  { id: 's2', title: 'Export OG images', group: 'design', by: 'you', done: true },
  { id: 's8', title: 'Redraw the settings icons', group: 'design', by: 'maya' },
  { id: 's3', title: 'Ship the billing webhook', group: 'build', by: 'arjun' },
  { id: 's4', title: 'Rate limit the public API', group: 'build', by: 'leo' },
  { id: 's5', title: 'Migrate staging database', group: 'build', by: 'arjun', done: true },
  { id: 's6', title: 'Write the changelog', group: 'launch', by: 'maya' },
  { id: 's7', title: 'Schedule the launch post', group: 'launch', by: 'you' },
]

const ARRIVALS: Omit<LiveItem, 'id'>[] = [
  { title: 'Check empty states on mobile', group: 'design', by: 'sofia' },
  { title: 'Record a 20s demo clip', group: 'launch', by: 'maya' },
  { title: 'Add retries to the email queue', group: 'build', by: 'leo' },
  { title: 'Draft the FAQ answers', group: 'launch', by: 'arjun' },
  { title: 'Tighten the onboarding copy', group: 'design', by: 'maya' },
  { title: 'Cache the dashboard queries', group: 'build', by: 'arjun' },
]

const FIRST = 800
const BEAT = 2600

export default function LiveListDemo() {
  const [items, setItems] = useState(START)
  const step = useRef(0)

  useEffect(() => {
    const beat = () => {
      const k = step.current++
      setItems((list) => {
        if (k % 2 === 0) {
          const next = ARRIVALS[(k / 2) % ARRIVALS.length]
          return [...list, { ...next, id: `a${k}`, at: Date.now() }]
        }
        const left = (g: string) => list.filter((i) => i.group === g && !i.done).length
        const open = list.filter((i) => !i.done && i.by !== 'you' && left(i.group) > 1).sort((a, b) => left(b.group) - left(a.group))[0]
        if (!open) return list
        return list.map((i) => (i.id === open.id ? { ...i, done: true } : i))
      })
    }
    let loop: ReturnType<typeof setInterval> | undefined
    const first = setTimeout(() => {
      beat()
      loop = setInterval(beat, BEAT)
    }, FIRST)
    return () => {
      clearTimeout(first)
      clearInterval(loop)
    }
  }, [])

  return (
    <div className="flex min-h-[560px] w-full items-center justify-center bg-background p-6">
      <LiveList title="Friday launch" people={PEOPLE} groups={GROUPS} items={items} onItemsChange={setItems} me="you" />
    </div>
  )
}
