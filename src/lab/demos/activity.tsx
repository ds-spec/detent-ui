'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AgentActivity } from '../components/activity/AgentActivity'
import type { ActivityHandle, AgentRun, RunStep } from '../components/activity/AgentActivity'
import { useBench } from './bench'

const DUNNING: RunStep[] = [
  { id: 'find', title: 'Finding failed invoices', detail: '3 invoices, $1,240 between them', sources: ['Stripe'], status: 'pending' },
  { id: 'history', title: 'Reading each customer’s history', detail: 'Lumen pays late, but always pays', sources: ['Stripe', 'Notes'], status: 'pending' },
  { id: 'retry', title: 'Retrying the charges', detail: '2 of 3 went through, $860', status: 'pending' },
  { id: 'email', title: 'Writing to who still owes', detail: 'Drafted a kind reminder to Oakline', status: 'pending' },
]
const THOUGHTS: Record<string, string> = {
  find: 'Three invoices failed overnight. Two were cards that expired this month, one was a bank decline.',
  history: 'Lumen has paid late twice this year but always within a week, so a quiet retry tomorrow is kinder than a reminder today.',
  retry: 'Retrying the two expired cards against the new ones on file, and leaving the bank decline for a person to look at.',
  email: 'Oakline’s charge failed again. A short note that names the amount and links the invoice will do; no late fee yet.',
}

const START: AgentRun[] = [
  { id: 'dunning', agent: 'Dunning', status: 'running', line: 'Retrying failed payments', when: '2m', day: 'Today', steps: DUNNING },
  { id: 'support', agent: 'Support', status: 'waiting', line: 'Refund $86.40 to Dana Ruiz', when: '14m', day: 'Today' },
  { id: 'review', agent: 'Review bot', status: 'failed', line: 'Build broken on main, PR #482', when: '1h', day: 'Today' },
  { id: 'churn', agent: 'Churn watch', status: 'done', line: 'Flagged Lumen and Oakline', when: '3h', day: 'Today' },
  { id: 'weekly', agent: 'Monday report', status: 'done', line: 'Sent to #revenue, MRR up 4.2%', when: '9:00', day: 'Yesterday' },
  { id: 'docs', agent: 'Docs writer', status: 'done', line: 'Updated 4 pages for the Q3 rules', when: '16:20', day: 'Yesterday' },
  { id: 'scout', agent: 'Price scout', status: 'failed', line: 'Rate limited on 2 competitor sites', when: 'Oct 26', day: 'Oct 26' },
]

/** Plays the board: Dunning works through its steps with its reasoning arriving word by word; approving and retrying settle the rows that need you. */
function useBoard() {
  const [runs, setRuns] = useState(START)
  const token = useRef(0)
  const patch = useCallback((id: string, p: Partial<AgentRun> | ((r: AgentRun) => Partial<AgentRun>)) => setRuns((l) => l.map((r) => (r.id === id ? { ...r, ...(typeof p === 'function' ? p(r) : p) } : r))), [])

  const work = useCallback(async () => {
    const mine = ++token.current
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (token.current === mine ? r() : x(new Error('stopped'))), ms))
    try {
      for (const s of DUNNING) {
        patch('dunning', (r) => ({ steps: r.steps!.map((x) => (x.id === s.id ? { ...x, status: 'running' } : x)), thought: '' }))
        const words = THOUGHTS[s.id].split(' ')
        for (let i = 1; i <= words.length; i++) {
          await tick(90)
          patch('dunning', { thought: words.slice(0, i).join(' ') })
        }
        await tick(700)
        patch('dunning', (r) => ({ steps: r.steps!.map((x) => (x.id === s.id ? { ...x, status: 'done' } : x)) }))
      }
      patch('dunning', { status: 'done', line: 'Recovered $860 of $1,240, one reminder sent', when: 'now', thought: undefined })
    } catch {
      /* Stopped. */
    }
  }, [patch])
  const approve = useCallback((id: string) => patch(id, (r) => ({ status: 'done', line: r.line.replace(/^Refund/, 'Refunded'), when: 'now' })), [patch])
  const retry = useCallback(
    (id: string) => {
      patch(id, { status: 'running', line: 'Running the build again', when: 'now' })
      setTimeout(() => patch(id, { status: 'done', line: 'Build passing on main again' }), 2400)
    },
    [patch],
  )
  const reset = useCallback(() => {
    token.current++
    setRuns(START)
  }, [])
  return { runs, work, approve, retry, reset }
}

/** Opens Dunning to watch it think, approves the refund, shows only what needs you, retries the build, starts over. Hovering holds it; touching hands it over. */
export function ActivityDemo() {
  const b = useBench()
  const board = useBoard()
  const list = useRef<ActivityHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  const { work, approve, retry, reset } = board

  useEffect(() => {
    let live = true
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await wait(100)
      if (touched.current) throw new Error('taken over')
    }
    const play = async () => {
      for (;;) {
        const going = work()
        await beat(1400)
        list.current?.open('dunning')
        await going
        await beat(1600)
        list.current?.open(null)
        await beat(900)
        approve('support')
        await beat(1400)
        list.current?.filter('you')
        await beat(1800)
        retry('review')
        await beat(3000)
        list.current?.filter('all')
        await beat(2600)
        reset()
        await beat(600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [work, approve, retry, reset])

  return (
    <div onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDown={() => (touched.current = true)} onKeyDown={() => (touched.current = true)}>
      <AgentActivity ref={list} runs={board.runs} onApprove={b.on('onApprove', approve)} onRetry={b.on('onRetry', retry)} />
    </div>
  )
}
