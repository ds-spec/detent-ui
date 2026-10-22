'use client'

import { useMemo, useRef, useState } from 'react'
import { ModelPicker } from '@/lab/components/models/ModelPicker'
import type { ModelValue, PickerHandle } from '@/lab/components/models/ModelPicker'
import { MODELS } from '@/lab/demos/models'
import { useBench } from '@/lab/demos/bench'
import { ArrowUp } from '@/lab/icons'
import { Annotated } from './Annotated'
import type { Note } from './Annotated'

/** The Model picker, explaining itself: five notes, each tied to the part it's about. */
export function ModelAnnotated({ className }: { className?: string } = {}) {
  const b = useBench()
  const [value, setValue] = useState<ModelValue>({ model: 'pro', effort: 1 })
  const picker = useRef<PickerHandle>(null)

  const notes: Note[] = useMemo(() => {
    const p = () => picker.current
    return [
      {
        title: 'One highlight',
        aside: 'Glides as you point',
        line: 'Names and one line each. A single highlight glides from model to model.',
        part: 'list',
        play: async (beat) => {
          p()?.open()
          for (;;) {
            for (const i of [0, 1, 2, 3]) {
              p()?.point(i)
              await beat(850)
            }
          }
        },
      },
      {
        title: 'Effort you can see',
        aside: 'Four bars spring up',
        line: 'Push the effort and each bar springs up into place.',
        part: 'bars',
        play: async (beat) => {
          p()?.open()
          p()?.point(1)
          for (;;) {
            for (const e of [0, 1, 2, 3]) {
              p()?.effort(e)
              await beat(650)
            }
            await beat(450)
          }
        },
      },
      {
        title: 'Cost that rolls',
        aside: 'Time and price follow you',
        line: 'What a reply will take rolls as you browse models and push the effort.',
        part: 'facts',
        play: async (beat) => {
          p()?.open()
          for (;;) {
            for (const [i, e] of [
              [0, 3],
              [3, 2],
              [1, 0],
              [1, 2],
            ]) {
              p()?.point(i)
              await beat(400)
              p()?.effort(e)
              await beat(900)
            }
          }
        },
      },
      {
        title: 'Fixed, not hidden',
        aside: 'The panel keeps its shape',
        line: 'Models that can’t reason dim the bars and say Fixed. Nothing moves.',
        part: 'bars',
        play: async (beat) => {
          p()?.open()
          p()?.effort(2)
          for (;;) {
            p()?.point(2)
            await beat(1400)
            p()?.point(1)
            await beat(1100)
          }
        },
      },
      {
        title: 'A trigger that keeps up',
        aside: 'The same bars, in miniature',
        line: 'Read the setting without opening anything; the trigger reshapes on a spring.',
        part: 'trigger',
        play: async (beat) => {
          for (;;) {
            for (const [i, e] of [
              [0, 3],
              [2, 0],
              [3, 2],
              [1, 1],
            ]) {
              p()?.open()
              await beat(300)
              p()?.point(i)
              p()?.effort(e)
              await beat(450)
              p()?.choose(i)
              await beat(1500)
            }
          }
        },
      },
    ]
  }, [])

  return (
    <Annotated notes={notes} className={className}>
      <div className="flex h-[420px] w-[340px] items-end">
        <div className="w-full rounded-[28px] bg-surface p-2 shadow-float">
          <p className="px-3 pb-4 pt-2.5 text-body text-ink-3">Ask Detent anything</p>
          <div className="flex items-center justify-between">
            <ModelPicker ref={picker} models={MODELS} value={value} onChange={b.on('onChange', setValue)} />
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-ink-3">
              <ArrowUp size={17} />
            </span>
          </div>
        </div>
      </div>
    </Annotated>
  )
}

