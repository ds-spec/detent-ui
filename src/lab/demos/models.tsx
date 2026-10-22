'use client'

import { useEffect, useRef, useState } from 'react'
import { ModelPicker } from '../components/models/ModelPicker'
import { ArrowUp } from '../icons'
import type { Model, ModelValue, PickerHandle } from '../components/models/ModelPicker'
import { useBench } from './bench'

export const MODELS: Model[] = [
  { id: 'max', name: 'Detent Max', blurb: 'Deepest reasoning, for hard problems', time: 9, cost: 0.084, reasons: true, tint: 'light-dark(oklch(0.54 0.21 290), oklch(0.74 0.15 290))' },
  { id: 'pro', name: 'Detent Pro', blurb: 'Smart and quick. The everyday default', time: 4, cost: 0.021, reasons: true, tint: 'light-dark(oklch(0.56 0.16 245), oklch(0.76 0.12 245))' },
  { id: 'flash', name: 'Detent Flash', blurb: 'Near-instant, for simple asks', time: 1, cost: 0.004, reasons: false, tint: 'light-dark(oklch(0.66 0.15 70), oklch(0.8 0.13 75))' },
  { id: 'code', name: 'Detent Code', blurb: 'Tuned for agents and long edits', time: 6, cost: 0.032, reasons: true, badge: 'New', tint: 'light-dark(oklch(0.56 0.13 165), oklch(0.76 0.12 165))' },
]

/** Browses the models, pushes effort up to watch the cost climb, settles, and picks. Hovering pauses; touching hands it over. */
export function ModelsDemo() {
  const b = useBench()
  const [value, setValue] = useState<ModelValue>({ model: 'pro', effort: 1 })
  const picker = useRef<PickerHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await wait(100)
    }
    const p = () => picker.current
    const play = async () => {
      for (let n = 0; ; n++) {
        await beat(1400)
        p()?.open()
        await beat(900)
        for (const i of [0, 2, 3, 1]) {
          p()?.point(i)
          await beat(950)
        }
        const to = n % 2 ? 1 : 3
        p()?.point(to)
        await beat(500)
        for (const e of [2, 3]) {
          p()?.effort(e)
          await beat(800)
        }
        p()?.effort(n % 2 ? 1 : 2)
        await beat(900)
        p()?.choose(to)
        await beat(2600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    // A fixed frame: the picker sits in a composer, and its panel opens upward into space that's already reserved.
    <div
      className="flex h-[420px] w-[340px] items-end"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onPointerDownCapture={() => (touched.current = true)}
      onKeyDownCapture={() => (touched.current = true)}
    >
      <div className="w-full rounded-[22px] bg-surface p-2 shadow-float">
        <p className="px-2.5 pb-4 pt-2 text-body text-ink-3">Ask Detent anything</p>
        <div className="flex items-center justify-between">
          <ModelPicker ref={picker} models={MODELS} value={value} onChange={b.on('onChange', setValue)} />
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-ink-3">
            <ArrowUp size={16} />
          </span>
        </div>
      </div>
    </div>
  )
}
