'use client'

import { useEffect, useRef, useState } from 'react'
import { DetentMark } from '@/lab/ui/DetentMark'
import { Timeline } from '../components/timeline/Timeline'
import type { Event, Person, TimelineHandle } from '../components/timeline/Timeline'
import { hover, pressed } from '@/lab/lib/hand'

const MAYA: Person = { name: 'Maya Chen', hue: 150 }
const JONAS: Person = { name: 'Jonas Weber', hue: 250 }
const LENA: Person = { name: 'Lena Ortiz', hue: 20 }
const MARCO: Person = { name: 'Marco Rossi', hue: 40 }
const DETENT: Person = { name: 'Detent', hue: 280, avatar: <DetentMark size={26} round /> }

const NOW = new Date(2026, 9, 23, 15, 0).getTime()
const at = (h: number, m: number, daysAgo = 0) => new Date(2026, 9, 23 - daysAgo, h, m).getTime()

const EVENTS: Event[] = [
  { id: 'e1', at: at(14, 52), who: MAYA, kind: 'comment', text: 'Refunds were a cent off when the discount split oddly. Rounding half to even fixes it.' },
  { id: 'e2', at: at(14, 40), who: JONAS, kind: 'commit', hash: 'c02b7d1', message: 'Add a regression test for split discounts' },
  { id: 'e3', at: at(14, 31), who: JONAS, kind: 'commit', hash: '3e9f1aa', message: 'Show the discount line on receipts' },
  { id: 'e4', at: at(14, 18), who: JONAS, kind: 'commit', hash: '7bd20c4', message: 'Round half to even' },
  { id: 'e5', at: at(14, 2), who: JONAS, kind: 'commit', hash: 'a1f3e9c', message: 'Apply discounts before tax' },
  { id: 'e6', at: at(13, 10), who: LENA, kind: 'status', from: 'Todo', to: 'In progress' },
  { id: 'e7', at: at(11, 2), who: LENA, kind: 'comment', text: 'Two customers on the old plan still see $0.01 differences. Tickets attached.' },
  { id: 'e8', at: at(17, 40, 1), who: MARCO, kind: 'review', verdict: 'changes' },
  { id: 'e9', at: at(16, 5, 1), who: JONAS, kind: 'deploy', env: 'staging' },
  { id: 'e10', at: at(15, 20, 1), who: MARCO, kind: 'comment', text: 'Can we show the discount as its own line? Finance asked twice.' },
]

/** An approval lands live, Jonas's four commits open from their folded line, the filters narrow it, and a comment waits behind “1 new” while the reader is further down. Hovering pauses; touching hands it over. */
export function TimelineDemo() {
  const line = useRef<TimelineHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  const [round, setRound] = useState(0)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (let n = 0; ; n++) {
        await beat(1500)
        line.current?.push({ id: `live-a-${n}`, at: NOW, who: DETENT, kind: 'review', verdict: 'approved' })
        await beat(2000)
        line.current?.open('run-e2')
        await beat(2000)
        line.current?.open(null)
        await beat(900)
        line.current?.filter('talk')
        await beat(1500)
        line.current?.filter('changes')
        await beat(1500)
        line.current?.filter('all')
        await beat(1000)
        line.current?.scroll(260)
        await beat(900)
        line.current?.push({ id: `live-b-${n}`, at: NOW, who: MARCO, kind: 'comment', text: 'Looks right now. Shipping it after lunch.' })
        await beat(1600)
        line.current?.catchUp()
        await beat(2600)
        setRound((r) => r + 1)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <div className="w-[560px] max-w-full rounded-card bg-surface p-6 shadow-raised" {...hover(held)} {...pressed(() => (touched.current = true))} onKeyDownCapture={() => (touched.current = true)}>
      <p className="text-caption text-ink-3">ACM-142</p>
      <p className="mt-0.5 text-title text-ink">Apply discount codes before tax</p>
      <div className="mt-4">
        <Timeline key={round} ref={line} events={EVENTS} now={NOW} height={380} />
      </div>
    </div>
  )
}
