'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Cursor, HereNow, label, tone } from '../components/presence/HereNow'
import type { Person } from '../components/presence/HereNow'
import { ease } from '../lib/motion'
import { Button } from '../ui/Button'
import { useBench } from './bench'
import { hover, pressed } from '@/lab/lib/hand'

const P: Record<string, Person> = {
  maya: { id: 'maya', name: 'Maya Chen', hue: 25, status: 'active' },
  jonas: { id: 'jonas', name: 'Jonas Weber', hue: 250, status: 'active' },
  priya: { id: 'priya', name: 'Priya Raman', hue: 150, status: 'active' },
  sam: { id: 'sam', name: 'Sam Whitfield', hue: 300, status: 'idle', note: 'Away 5m' },
  aiko: { id: 'aiko', name: 'Aiko Tanaka', hue: 80, status: 'active' },
  leo: { id: 'leo', name: 'Leo Park', hue: 200, status: 'idle', note: 'Away 12m' },
  noor: { id: 'noor', name: 'Noor Haddad', hue: 340, status: 'active', note: 'Just joined' },
}
const START = ['maya', 'jonas', 'priya', 'sam', 'aiko', 'leo']
const TYPED = 'Questions go to #support-leads; Hannah owns the macro updates.'

// Where each person's pointer wanders, in the document's own coordinates.
const SPOTS: Record<string, [number, number][]> = {
  maya: [
    [300, 60],
    [210, 150],
    [340, 250],
    [120, 330],
    [260, 430],
    [180, 520],
  ],
  jonas: [
    [250, 280],
    [344, 279],
    [372, 246],
    [120, 150],
  ],
}

/** A shared doc: people come and go, Priya types, Jonas selects, and the demo follows Maya around. Hovering pauses it; touching hands it over. */
export function PresenceDemo() {
  const b = useBench()
  const [here, setHere] = useState(START)
  const [following, setFollowing] = useState<string | null>(null)
  const [fan, setFan] = useState(false)
  const [typed, setTyped] = useState('')
  const [select, setSelect] = useState(false)
  const [at, setAt] = useState<Record<string, [number, number]>>({ maya: SPOTS.maya[0], jonas: SPOTS.jonas[0] })
  const scroller = useRef<HTMLDivElement>(null)
  const held = useRef(false)
  const touched = useRef(false)

  const people = here.map((id) => ({ ...P[id], typing: id === 'priya' && typed.length > 0 && typed.length < TYPED.length }))

  // Following someone means going where they go.
  useEffect(() => {
    if (!following || !at[following]) return
    scroller.current?.scrollTo({ top: Math.max(0, at[following][1] - 110), behavior: 'smooth' })
  }, [following, at])

  // Pointers wander on their own, demo or not.
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i++
      setAt((a) => ({ ...a, maya: SPOTS.maya[i % SPOTS.maya.length], ...(i % 2 ? { jonas: SPOTS.jonas[(i >> 1) % SPOTS.jonas.length] } : {}) }))
    }, 1500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let live = true
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await wait(100)
    }
    const play = async () => {
      for (;;) {
        await beat(1200)
        for (let i = 1; i <= TYPED.length; i++) {
          setTyped(TYPED.slice(0, i))
          await wait(40 + Math.random() * 50)
        }
        await beat(900)
        setHere((h) => ['noor', ...h.filter((x) => x !== 'noor')])
        await beat(1600)
        setSelect(true)
        setFan(true)
        await beat(1800)
        setFan(false)
        await beat(700)
        setFollowing('maya')
        await beat(5200)
        setFollowing(null)
        setSelect(false)
        await beat(900)
        setHere((h) => h.filter((x) => x !== 'jonas'))
        await beat(2200)
        scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
        setTyped('')
        setHere(START)
        await beat(600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  const followed = following ? P[following] : null

  return (
    <div
      {...hover(held)}
      {...pressed(() => (touched.current = true))}
      onKeyDownCapture={() => (touched.current = true)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && following) {
          e.preventDefault()
          setFollowing(null)
        }
      }}
      className="@container flex h-[420px] w-[440px] max-w-full flex-col overflow-hidden rounded-[24px] bg-surface shadow-float"
    >
      <header className="flex h-16 shrink-0 items-center gap-3 pl-5 pr-3 shadow-[inset_0_-1px_0_var(--line)]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-headline text-ink">Q3 refund rules</p>
          <p className="tnum truncate text-caption text-ink-3">Edited just now · {here.length} here</p>
        </div>
        <div className="@max-[400px]:hidden">
          <HereNow people={people} following={following} onFollow={b.on('onFollow', setFollowing)} open={fan} max={b.get('max', 4)} />
        </div>
        <div className="hidden @max-[400px]:block">
          <HereNow people={people} following={following} onFollow={b.on('onFollow', setFollowing)} open={fan} max={Math.min(2, b.get('max', 4))} />
        </div>
        <Button size="sm" variant="primary" className="rounded-full @max-[300px]:hidden">
          Share
        </Button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={scroller} className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="relative px-7 pb-10 pt-6 text-body text-ink-2">
            <p className="text-title text-ink">Q3 refund rules</p>
            <p className="mt-2">From October, refunds work a little differently. These are the three changes support needs to know, and how to handle the edge cases.</p>
            <p className="mt-6 text-headline text-ink">What changed</p>
            <ul className="mt-2 space-y-1.5 pl-4 [list-style:disc] marker:text-ink-3">
              <li>Damaged on arrival: refund up to $150 straight away, no return needed.</li>
              <li>
                Annual plans now have{' '}
                <span className="rounded-[3px] transition-colors duration-300" style={{ background: select ? `color-mix(in oklch, ${tone(P.jonas.hue)} 24%, transparent)` : 'transparent' }}>
                  45 days to request a refund
                </span>
                , up from 30.
              </li>
              <li>Refunds over $500 need a second approval from finance.</li>
            </ul>
            <p className="mt-6 text-headline text-ink">Edge cases</p>
            <p className="mt-2">If a replacement arrives damaged, the damaged-on-arrival rule applies again. Exchanges and store credit are unchanged.</p>
            <p className="mt-3 min-h-6">
              {typed}
              {typed && typed.length < TYPED.length && (
                <span className="relative ml-px inline-block h-[18px] w-[2px] translate-y-[4px]" style={{ background: tone(P.priya.hue) }}>
                  <span className="absolute -top-[18px] left-0 flex h-4 items-center whitespace-nowrap rounded-full px-1.5 text-caption font-medium text-white" style={{ background: label(P.priya.hue) }}>
                    Priya
                  </span>
                </span>
              )}
            </p>
            <p className="mt-6 text-headline text-ink">Owners</p>
            <p className="mt-2">Policy: Maya. Finance approvals: Jonas. Macros and help center: Hannah.</p>

            <AnimatePresence>
              {here
                .filter((id) => at[id])
                .map((id) => (
                  <Cursor key={id} p={P[id]} x={at[id][0]} y={at[id][1]} quiet={following === id} />
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Following: their colour frames the view, and a chip says whose view it is. */}
        <AnimatePresence>
          {followed && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ boxShadow: `inset 0 0 0 1.5px ${tone(followed.hue)}` }}
            >
              <motion.span
                className="absolute left-1/2 top-0 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-b-[12px] px-3 text-footnote font-medium text-white"
                style={{ background: label(followed.hue) }}
                initial={{ y: -28 }}
                animate={{ y: 0 }}
                exit={{ y: -28 }}
                transition={{ duration: 0.25, ease: ease.out }}
              >
                Following {followed.name.split(' ')[0]}
                <span className="opacity-70">· Esc to stop</span>
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
