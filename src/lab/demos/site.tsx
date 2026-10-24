'use client'

import { useEffect, useRef } from 'react'
import { Waitlist } from '../components/site/Waitlist'
import type { WaitlistHandle } from '../components/site/Waitlist'
import { useBench } from './bench'

/* ───────────────────────────── Waitlist ───────────────────────────── */

/** Signs up on its own: an unfinished address shakes, the fixed one folds into a spinner and a place in line. Hovering pauses; touching hands it over. */
export function WaitlistDemo() {
  const b = useBench()
  const list = useRef<WaitlistHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const write = async (text: string, from = 0) => {
      for (let i = from + 1; i <= text.length; i++) {
        list.current?.type(text.slice(0, i))
        await beat(60 + Math.random() * 60)
      }
    }
    const play = async () => {
      for (;;) {
        await beat(1500)
        await write('maya@northwind')
        await beat(450)
        list.current?.submit()
        await beat(1400)
        await write('maya@northwind.co', 14)
        await beat(500)
        list.current?.submit()
        await beat(5200)
        list.current?.reset()
        await beat(500)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <div className="flex flex-col items-center text-center" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <span className="text-footnote text-ink-3">Early access</span>
      <h2 className="mt-2 text-large text-ink">Be first in line.</h2>
      <p className="mb-7 mt-2 text-body text-ink-3">We’re letting new teams in every week.</p>
      <Waitlist ref={list} onJoin={b.on('onJoin')} action={b.get('action', 'Join waitlist')} placeholder={b.get('placeholder', 'you@company.com')} joined={b.get('joined', 1283)} />
    </div>
  )
}
