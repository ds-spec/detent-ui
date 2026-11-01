'use client'

import { useRef, useState } from 'react'
import { ModelPicker } from '../components/models/ModelPicker'
import type { Model, ModelValue, PickerHandle } from '../components/models/ModelPicker'
import { ArrowUp } from '@/lab/icons'
import { useLoop } from '@/lab/demos/loop'
import { useBench } from '@/lab/demos/bench'

const MODELS: Model[] = [
  { id: 'flash', name: 'Flash', blurb: 'For simple asks', time: 1.4, cost: 0.002, reasons: false },
  { id: 'pro', name: 'Pro', blurb: 'The everyday default', time: 4, cost: 0.012 },
  { id: 'code', name: 'Code', blurb: 'Long edits and agents', time: 7, cost: 0.03 },
  { id: 'max', name: 'Max', blurb: 'For hard problems', time: 11, cost: 0.06 },
]

/** Pushes effort up to watch every model's figures roll, then settles on one. Touch it and it's yours. */
export function ModelsDemo() {
  const b = useBench()
  const [value, setValue] = useState<ModelValue>({ model: 'pro', effort: 1 })
  const picker = useRef<PickerHandle>(null)
  const change = b.on('onChange', setValue)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      setValue({ model: 'pro', effort: 1 })
      await beat(1600)
      setValue({ model: 'pro', effort: 2 })
      await beat(1500)
      setValue({ model: 'pro', effort: 3 })
      await beat(1700)
      setValue({ model: 'code', effort: 3 })
      await beat(1100)
      setValue({ model: 'code', effort: 0 })
      await beat(1800)
    }
  })
  return (
    // A fixed frame: the picker sits in a composer, and its menu opens upward into space that's reserved.
    <div className="flex h-[430px] w-[460px] max-w-full max-sm:w-[400px] items-end" {...handlers}>
      <div className="w-full rounded-[22px] bg-surface p-2 shadow-float">
        <p className="px-2.5 pb-4 pt-2 text-body text-ink-3">Ask anything</p>
        <div className="flex items-center justify-between">
          <ModelPicker ref={picker} models={MODELS} value={value} onChange={change} defaultOpen lift={60} />
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-ink-3">
            <ArrowUp size={16} />
          </span>
        </div>
      </div>
    </div>
  )
}
