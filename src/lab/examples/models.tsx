'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ModelPicker } from '../components/models/ModelPicker'
import type { Effort, Model, ModelValue, PickerHandle } from '../components/models/ModelPicker'

/** The composer the picker lives in: a card with the picker in its bottom row, so the menu has room to open upward. */
function Composer({ text, h, children }: { text: string; h: number; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-[460px] max-w-full items-end" style={{ height: h }}>
        <div className="w-full rounded-[22px] bg-surface p-2 shadow-float">
          <p className="truncate px-2.5 pb-4 pt-2 text-body text-ink-3">{text}</p>
          <div className="flex items-center justify-between">
            {children}
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-ink-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 13V3M3.9 7.1 8 3l4.1 4.1" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const TWO: Model[] = [
  { id: 'quick', name: 'Quick', blurb: 'Answers straight away', time: 1.2, cost: 0.001, reasons: false },
  { id: 'careful', name: 'Careful', blurb: 'Thinks before it answers', time: 6, cost: 0.02 },
]

/** Two models, one that doesn't reason: its figures stay put while the effort moves. */
export function ModelsTwo() {
  const [value, setValue] = useState<ModelValue>({ model: 'careful', effort: 1 })
  return (
    <Composer text="Reply to this customer" h={300}>
      <ModelPicker models={TWO} value={value} onChange={setValue} defaultOpen lift={60} />
    </Composer>
  )
}

const LINEUP: Model[] = [
  { id: 'mini', name: 'Mini', blurb: 'Renames, imports, one-line fixes', time: 1.5, cost: 0.003, reasons: false },
  { id: 'base', name: 'Base', blurb: 'Most edits in one file', time: 5, cost: 0.015 },
  { id: 'agent', name: 'Agent', blurb: 'Runs tests and edits across files', time: 14, cost: 0.06 },
  { id: 'long', name: 'Long', blurb: 'Reads the whole repository', time: 30, cost: 0.18 },
  { id: 'deep', name: 'Deep', blurb: 'Migrations and hard bugs', time: 45, cost: 0.4 },
]

const STEPS: Effort[] = [
  { label: 'Brief', time: 0.6, cost: 0.5 },
  { label: 'Standard', time: 1, cost: 1 },
  { label: 'Thorough', time: 2.4, cost: 2.6 },
]

/** A code agent's five models on three effort steps of its own. */
export function ModelsLineup() {
  const [value, setValue] = useState<ModelValue>({ model: 'agent', effort: 1 })
  return (
    <Composer text="Move the auth checks into middleware" h={470}>
      <ModelPicker models={LINEUP} efforts={STEPS} value={value} onChange={setValue} defaultOpen lift={60} />
    </Composer>
  )
}

const TASKS: { label: string; text: string; value: ModelValue }[] = [
  { label: 'Fix a typo', text: 'Fix the typo in the header', value: { model: 'mini', effort: 0 } },
  { label: 'Add a feature', text: 'Add CSV export to the reports page', value: { model: 'base', effort: 1 } },
  { label: 'Hunt a bug', text: 'Find why sessions expire early', value: { model: 'deep', effort: 2 } },
]

/** Your app sets the value from the task; the plate glides to the new effort and every figure follows. */
export function ModelsByTask() {
  const [task, setTask] = useState(1)
  const [value, setValue] = useState<ModelValue>(TASKS[1].value)
  const picker = useRef<PickerHandle>(null)
  return (
    <div className="flex flex-col items-center gap-1">
      <div role="group" aria-label="Task" className="flex flex-wrap justify-center gap-1.5">
        {TASKS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            aria-pressed={i === task}
            onClick={() => {
              setTask(i)
              setValue(t.value)
              picker.current?.open()
            }}
            className={`ring-focus h-8 rounded-full px-3 text-[13px] transition-colors ${i === task ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--line)]' : 'text-ink-3 hover:text-ink-2'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Composer text={TASKS[task].text} h={470}>
        <ModelPicker ref={picker} models={LINEUP} efforts={STEPS} value={value} onChange={setValue} defaultOpen lift={60} />
      </Composer>
    </div>
  )
}
