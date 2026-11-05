'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RichComposer, Runs } from '../components/composer/RichComposer'
import type { ComposerHandle, Mark, Person, Run } from '../components/composer/RichComposer'
import { spring } from '@/lab/lib/motion'
import { hover, pressed } from '@/lab/lib/hand'

const PEOPLE: Person[] = [
  { id: 'maya', name: 'Maya Chen', role: 'Payments', hue: 150 },
  { id: 'marco', name: 'Marco Rossi', role: 'Design', hue: 40 },
  { id: 'jonas', name: 'Jonas Weber', role: 'Platform', hue: 250 },
  { id: 'lena', name: 'Lena Ortiz', role: 'Support', hue: 20 },
  { id: 'aiko', name: 'Aiko Tanaka', role: 'Growth', hue: 320 },
]

type Note = { id: number; who: Person; when: string; runs: Run[] }
const t = (text: string, marks: Mark[] = []): Run => ({ kind: 'text', text, marks })
const THREAD: Note[] = [
  { id: 1, who: PEOPLE[2], when: '2h', runs: [t('Discount codes now apply '), t('before', ['b']), t(' tax. Totals match the receipts in every test I ran.')] },
  { id: 2, who: PEOPLE[3], when: '40m', runs: [t('Two customers on the old plan still see '), t('$0.01', ['c']), t(' differences. Sending you the tickets.')] },
]
const ME: Person = { id: 'you', name: 'You', hue: 270 }

export function ComposerDemo() {
  const box = useRef<ComposerHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  const [notes, setNotes] = useState(THREAD)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const write = async (text: string) => {
      for (const ch of text) {
        box.current?.type(ch)
        await tick(ch === ' ' ? 70 : 38 + ((ch.charCodeAt(0) * 7) % 30))
      }
    }
    const play = async () => {
      for (;;) {
        await beat(1200)
        await write('Thanks @Ma')
        await beat(700)
        box.current?.choose(0)
        await beat(300)
        await write('the rounding is **off by one cent** on refunds. Fix is in `roundHalfEven`, should land today.')
        await beat(900)
        box.current?.select('should land today')
        await beat(900)
        box.current?.format('i')
        await beat(1100)
        box.current?.select(null)
        await beat(700)
        box.current?.send()
        await beat(3400)
        setNotes(THREAD)
        await beat(600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <div className="w-[560px] max-w-full" {...hover(held)} {...pressed(() => (touched.current = true))} onKeyDownCapture={() => (touched.current = true)}>
      <ul className="flex flex-col gap-4 pb-5">
        <AnimatePresence initial={false}>
          {notes.map((n) => (
            <motion.li key={n.id} layout="position" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring.smooth} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: `oklch(0.62 0.12 ${n.who.hue})` }}>
                {n.who.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </span>
              <div className="min-w-0">
                <p className="text-caption text-ink-3">
                  <span className="font-medium text-ink">{n.who.name}</span> · {n.when}
                </p>
                <p className="mt-0.5 text-body text-ink-2">
                  <Runs runs={n.runs} />
                </p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <RichComposer ref={box} people={PEOPLE} placeholder="Reply to the thread…" onSend={(s) => setNotes((all) => [...all, { id: Date.now(), who: ME, when: 'now', runs: s.runs }])} />
    </div>
  )
}
