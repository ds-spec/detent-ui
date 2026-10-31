'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar } from '@/lab/icons'
import { TimePicker } from '../components/time/TimePicker'
import type { TimeHandle } from '../components/time/TimePicker'
import { LayerHost } from '@/lab/lib/layer'

/** A meeting being set: types "3p" for the start, picks an end by its length, moves the start and the end follows, then types the end outright. Hovering pauses; touching hands it over. */
export function TimeDemo() {
  const time = useRef<TimeHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  const [round, setRound] = useState(0)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const write = async (which: 'start' | 'end', text: string) => {
      for (let i = 1; i <= text.length; i++) {
        time.current?.type(which, text.slice(0, i))
        await tick(140)
      }
    }
    const play = async () => {
      for (;;) {
        await beat(1400)
        await write('start', '3p')
        await beat(1100)
        time.current?.commit('start')
        await beat(900)
        time.current?.open('end')
        await beat(600)
        for (let i = 0; i < 3; i++) {
          time.current?.point(1)
          await tick(260)
        }
        await beat(500)
        time.current?.commit('end')
        await beat(1200)
        time.current?.nudge('start', 2)
        await beat(1600)
        await write('end', '5:15')
        await beat(1000)
        time.current?.commit('end')
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
    <div className="w-[560px] max-w-full" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <LayerHost className="h-[420px] rounded-card bg-surface shadow-raised">
        <div className="p-7">
          <p className="text-caption text-ink-3">New event</p>
          <p className="mt-1 text-title text-ink">Design review</p>
          <p className="mt-4 flex items-center gap-2 text-footnote text-ink-2">
            <Calendar size={15} className="text-ink-3" /> Thursday, October 24
          </p>
          <div className="mt-4">
            <TimePicker key={round} ref={time} label="Meeting time" defaultValue={600} defaultLength={30} zones={['Asia/Kolkata|Bengaluru', 'Europe/Berlin']} />
          </div>
        </div>
      </LayerHost>
    </div>
  )
}
