'use client'

import { useEffect, useRef, useState } from 'react'
import { DiffReview } from '../components/diff/DiffReview'
import type { DiffHandle, Hunk } from '../components/diff/DiffReview'
import { useBench } from './bench'

const HUNKS: Hunk[] = [
  {
    id: 'limits',
    scope: 'LIMITS',
    o: 12,
    n: 12,
    lines: [
      ['ctx', 'export const LIMITS = {'],
      ['del', '  windowDays: 30,'],
      ['add', '  windowDays: 45,'],
      ['ctx', '  autoRefundMax: 150,'],
      ['del', '  approvalOver: 1000,'],
      ['add', '  approvalOver: 500,'],
      ['ctx', '}'],
    ],
  },
  {
    id: 'refund',
    scope: 'refund(order)',
    o: 28,
    n: 28,
    lines: [
      ['ctx', 'export function refund(order: Order) {'],
      ['del', '  if (order.damaged) return hold(order)'],
      ['add', '  if (order.damaged && isSmall(order)) {'],
      ['add', "    return issue(order, 'damaged')"],
      ['add', '  }'],
      ['ctx', '  return review(order)'],
    ],
  },
  {
    id: 'approval',
    scope: 'needsApproval(order)',
    o: 41,
    n: 43,
    lines: [
      ['ctx', 'function needsApproval(order: Order) {'],
      ['del', '  return order.total > 1000'],
      ['add', '  return order.total > LIMITS.approvalOver'],
      ['ctx', '}'],
    ],
  },
]

const TOTAL = HUNKS.reduce((n, h) => n + h.lines.length, 0)
const BREAKS = HUNKS.slice(0, -1).reduce<number[]>((a, h) => [...a, (a.at(-1) ?? 0) + h.lines.length], [])

/**
 * The agent writes the change, then a reviewer works through it: a look at the split view,
 * two accepts, one reject, apply. Hovering pauses it; touching it hands over the controls.
 */
export function DiffDemo() {
  const [run, setRun] = useState(0)
  return <Session key={run} onDone={() => setRun((r) => r + 1)} />
}

function Session({ onDone }: { onDone: () => void }) {
  const b = useBench()
  const [shown, setShown] = useState(0)
  const diff = useRef<DiffHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live ? r() : x(new Error('stopped'))), ms))
    // Waits out the time, and longer while someone is looking. Once they've taken over, it stops.
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await wait(100)
      if (touched.current) throw new Error('taken over')
    }
    const play = async () => {
      await wait(600)
      for (let i = 1; i <= TOTAL; i++) {
        setShown(i)
        await wait(BREAKS.includes(i) ? 420 : 120 + Math.random() * 90)
      }
      await beat(1400)
      diff.current?.toggleView()
      await beat(2600)
      diff.current?.toggleView()
      await beat(1100)
      diff.current?.accept()
      await beat(1100)
      diff.current?.accept()
      await beat(1100)
      diff.current?.reject()
      await beat(1600)
      diff.current?.apply()
      await beat(4200)
      onDone()
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [onDone])

  return (
    <div onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDown={() => (touched.current = true)} onKeyDown={() => (touched.current = true)}>
      <DiffReview ref={diff} title={b.get('title', 'Apply the Q3 refund rules')} file={b.get('file', 'src/billing/refunds.ts')} hunks={HUNKS} shown={shown} onApply={b.on('onApply')} />
    </div>
  )
}
