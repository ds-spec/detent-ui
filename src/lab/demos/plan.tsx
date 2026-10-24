'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PlanEditor } from '../components/plan/PlanEditor'
import type { PlanHandle, PlanMode, PlanStep } from '../components/plan/PlanEditor'
import { useBench } from './bench'

const GOAL = 'Ship the Q3 refund rules'

// The agent's first draft runs the suite before writing the tests; the demo fixes that order.
const DRAFT: PlanStep[] = [
  { id: 'read', title: 'Read the Q3 refund policy', status: 'pending' },
  { id: 'limits', title: 'Update the limits in refunds.ts', status: 'pending' },
  { id: 'damaged', title: 'Auto-refund damaged orders under $150', status: 'pending' },
  { id: 'suite', title: 'Run the test suite', status: 'pending' },
  { id: 'tests', title: 'Write tests for the new limits', status: 'pending' },
  { id: 'pr', title: 'Open a pull request', status: 'pending' },
]

const WORK: Record<string, { notes: string[]; secs: number }> = {
  read: { notes: ['Opened refund-policy-q3.pdf', 'Found three changes'], secs: 9 },
  limits: { notes: ['windowDays 30 → 45', 'approvalOver 1000 → 500'], secs: 14 },
  damaged: { notes: ['Added isSmall(order)', 'Routed damaged orders to issue()'], secs: 11 },
  tests: { notes: ['Wrote 12 cases', 'Covered the $500 boundary'], secs: 16 },
  suite: { notes: ['Running 226 tests', '226 passed, 0 failed'], secs: 22 },
  pr: { notes: ['Pushed q3-refund-rules', 'Opened #482 for review'], secs: 6 },
}

/** Runs whatever plan is on screen, in its current order. Works the same whether the demo or a person pressed Run. */
function useRunner() {
  const [mode, setMode] = useState<PlanMode>('draft')
  const [steps, setSteps] = useState(DRAFT)
  const latest = useRef(steps)
  latest.current = steps
  const token = useRef(0)

  const run = useCallback(async () => {
    const mine = ++token.current
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (token.current === mine ? r() : x(new Error('stopped'))), ms))
    const patch = (id: string, p: Partial<PlanStep>) => setSteps((l) => l.map((s) => (s.id === id ? { ...s, ...p } : s)))
    const order = latest.current
    setSteps(order.map((s) => ({ ...s, status: 'pending', notes: [], secs: 0 })))
    setMode('running')
    try {
      await wait(350)
      for (const s of order) {
        const w = WORK[s.id] ?? { notes: ['Working on it', 'Finished'], secs: 6 }
        patch(s.id, { status: 'running', notes: [], secs: 0 })
        const per = 900
        for (let i = 0; i < w.notes.length; i++) {
          patch(s.id, { notes: w.notes.slice(0, i + 1) })
          for (let t = 0; t < per; t += 100) {
            await wait(100)
            patch(s.id, { secs: (w.secs * (i * per + t)) / (w.notes.length * per) })
          }
        }
        patch(s.id, { status: 'done', secs: w.secs })
        await wait(280)
      }
      setMode('done')
    } catch {
      /* Stopped. */
    }
  }, [])

  const stop = useCallback(() => {
    token.current++
    setSteps((l) => l.map((s) => ({ ...s, status: 'pending', notes: [], secs: 0 })))
    setMode('draft')
  }, [])
  const reset = useCallback((to?: PlanStep[]) => {
    token.current++
    setSteps((to ?? latest.current).map((s) => ({ ...s, status: 'pending', notes: [], secs: 0 })))
    setMode('draft')
  }, [])
  return { mode, steps, setSteps, run, stop, reset }
}

/** Reorders a step the agent got wrong, runs the plan, lets it fold, opens it again, starts over. */
export function PlanDemo() {
  const b = useBench()
  const p = useRunner()
  const plan = useRef<PlanHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  const { run, reset, setSteps } = p

  useEffect(() => {
    let live = true
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await wait(100)
      if (touched.current) throw new Error('taken over')
    }
    const play = async () => {
      for (;;) {
        await beat(1800)
        // Tests belong before the suite that runs them.
        setSteps((l) => {
          const i = l.findIndex((s) => s.id === 'tests')
          const j = l.findIndex((s) => s.id === 'suite')
          if (i < j) return l
          const next = [...l]
          ;[next[i], next[j]] = [next[j], next[i]]
          return next
        })
        await beat(1300)
        await run()
        if (!live) return
        await beat(4200)
        plan.current?.fold(false)
        await beat(2600)
        reset(DRAFT)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [run, reset, setSteps])

  return (
    // A fixed frame, so the stage never re-fits while the card folds. The card hangs from its top
    // centre by translate, so folding narrower never moves its start.
    <div
      className="relative h-[520px] w-[420px]"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onPointerDown={() => (touched.current = true)}
      onKeyDown={() => (touched.current = true)}
    >
      <div className="absolute inset-x-0 top-0 mx-auto w-[420px] max-w-full">
        <PlanEditor ref={plan} goal={b.get('goal', GOAL)} mode={p.mode} steps={p.steps} onStepsChange={b.on('onStepsChange', p.setSteps)} onRun={b.on('onRun', p.run)} onStop={b.on('onStop', p.stop)} onRunAgain={b.on('onRunAgain', () => p.reset())} />
      </div>
    </div>
  )
}
