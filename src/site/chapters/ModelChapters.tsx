'use client'

import { useMemo, useRef, useState } from 'react'
import { ModelPicker } from '@/lab/components/models/ModelPicker'
import type { ModelValue, PickerHandle } from '@/lab/components/models/ModelPicker'
import { MODELS } from '@/lab/demos/models'
import { ArrowUp } from '@/lab/icons'
import { Chapters } from './Chapters'
import type { Chapter } from './Chapters'

/** The Model picker, told in five chapters. Each one drives the real component into its state. */
export function ModelChapters() {
  const [value, setValue] = useState<ModelValue>({ model: 'pro', effort: 1 })
  const picker = useRef<PickerHandle>(null)

  const chapters: Chapter[] = useMemo(() => {
    const p = () => picker.current
    return [
      {
        title: 'One list, one highlight.',
        aside: 'It glides for the pointer.',
        body: 'Just names and one line each. A single highlight glides as you point, and jumps when you use the keyboard.',
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
        title: 'Effort you can see.',
        aside: 'Four bars spring up.',
        body: 'Empty bars wait a little shorter. Push the effort and each one springs up into place.',
        part: 'effort',
        play: async (beat) => {
          p()?.open()
          p()?.point(1)
          for (;;) {
            for (const e of [0, 1, 2, 3]) {
              p()?.effort(e)
              await beat(700)
            }
            await beat(500)
          }
        },
      },
      {
        title: 'The cost rolls with you.',
        aside: 'Time and price, live.',
        body: 'One quiet line says what a reply will take. Its time and cost roll as you browse and push the effort.',
        part: 'facts',
        play: async (beat) => {
          p()?.open()
          for (;;) {
            for (const [i, e] of [
              [1, 1],
              [0, 3],
              [3, 2],
              [1, 0],
            ]) {
              p()?.point(i)
              await beat(500)
              p()?.effort(e)
              await beat(1000)
            }
          }
        },
      },
      {
        title: 'Fixed when it can’t think.',
        aside: 'The panel never moves.',
        body: 'Models that can’t reason dim the bars and say Fixed, so the panel keeps its shape as you browse.',
        part: 'effort',
        play: async (beat) => {
          p()?.open()
          p()?.effort(2)
          for (;;) {
            p()?.point(2)
            await beat(1500)
            p()?.point(1)
            await beat(1200)
          }
        },
      },
      {
        title: 'The trigger keeps up.',
        aside: 'No need to open it.',
        body: 'The trigger carries the same bars in miniature, and resizes on a spring when the name changes.',
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
              await beat(350)
              p()?.point(i)
              p()?.effort(e)
              await beat(450)
              p()?.choose(i)
              await beat(1700)
            }
          }
        },
      },
    ]
  }, [])

  return (
    <Chapters chapters={chapters}>
      {/* The picker in its natural host, a composer; the panel opens upward into reserved space. */}
      <div className="flex h-[420px] w-[340px] items-end">
        <div className="w-full rounded-[28px] bg-surface p-2 shadow-float">
          <p className="px-3 pb-4 pt-2.5 text-body text-ink-3">Ask Detent anything</p>
          <div className="flex items-center justify-between">
            <ModelPicker ref={picker} models={MODELS} value={value} onChange={setValue} />
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-ink-3">
              <ArrowUp size={17} />
            </span>
          </div>
        </div>
      </div>
    </Chapters>
  )
}
