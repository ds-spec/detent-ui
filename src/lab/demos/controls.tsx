'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Inbox } from '../components/inbox/Inbox'
import type { InboxItem } from '../components/inbox/Inbox'
import { Stepper, Ticker } from '../components/stepper/Stepper'
import type { StepperHandle } from '../components/stepper/Stepper'
import { Ship } from '../icons'
import { press } from '../lib/motion'
import { useBench } from './bench'

/* ───────────────────────────── Inbox ───────────────────────────── */

const PEOPLE = {
  maya: { name: 'Maya Chen', hue: 25 },
  jonas: { name: 'Jonas Weber', hue: 250 },
  aiko: { name: 'Aiko Tanaka', hue: 150 },
  sam: { name: 'Sam Ortiz', hue: 70 },
}
const SHIPYARD = { name: 'Shipyard', tint: 'linear-gradient(180deg, #4a4a52, #1c1c1f)', icon: <Ship size={18} /> }
const min = (m: number) => Date.now() - m * 60_000

const SEED: InboxItem[] = [
  {
    id: 's1',
    from: PEOPLE.maya,
    text: (
      <>
        <b>Maya Chen</b> commented on <b>Q3 board update</b>: “The churn slide needs one more line.”
      </>
    ),
    meta: 'Design',
    at: min(2),
    unread: true,
  },
  {
    id: 's2',
    from: PEOPLE.jonas,
    text: (
      <>
        <b>Jonas Weber</b> invited you to the <b>Northwind</b> workspace
      </>
    ),
    meta: 'Workspace',
    at: min(18),
    unread: true,
    invite: { joined: 'You joined Northwind' },
  },
  {
    id: 's3',
    from: PEOPLE.aiko,
    text: (
      <>
        <b>Aiko Tanaka</b> shared <b>Onboarding v3</b> with you
      </>
    ),
    meta: 'Files',
    at: min(64),
    unread: false,
  },
  {
    id: 's4',
    from: SHIPYARD,
    text: (
      <>
        <b>northwind-web</b> is live on production
      </>
    ),
    meta: 'Deploys',
    at: min(190),
    unread: false,
  },
  {
    id: 's5',
    from: PEOPLE.sam,
    text: (
      <>
        <b>Sam Ortiz</b> mentioned you in <b>#launch</b>
      </>
    ),
    meta: 'Chat',
    at: min(1500),
    unread: false,
  },
]

const NEXT: ((id: string) => InboxItem)[] = [
  (id) => ({
    id,
    from: SHIPYARD,
    text: (
      <>
        Deploying <b>northwind-web</b> to production
      </>
    ),
    meta: 'Deploys',
    at: Date.now(),
    unread: true,
    live: {
      progress: 0.04,
      status: 'Building',
      doneText: (
        <>
          <b>northwind-web</b> is live on production
        </>
      ),
    },
  }),
  (id) => ({
    id,
    from: PEOPLE.aiko,
    text: (
      <>
        <b>Aiko Tanaka</b> replied: “Love it. Shipping Thursday?”
      </>
    ),
    meta: 'Design',
    at: Date.now(),
    unread: true,
  }),
  (id) => ({
    id,
    from: PEOPLE.sam,
    text: (
      <>
        <b>Sam Ortiz</b> invited you to <b>Launch review</b>
      </>
    ),
    meta: 'Calendar',
    at: Date.now(),
    unread: true,
    invite: { joined: 'Added to your calendar' },
  }),
]

export function InboxDemo() {
  const b = useBench()
  const [items, setItems] = useState(SEED)
  const n = useRef(0)

  const patch = (id: string, f: (x: InboxItem) => InboxItem) => setItems((l) => l.map((x) => (x.id === id ? f(x) : x)))

  const simulate = () => {
    const id = `n${++n.current}`
    const item = NEXT[(n.current - 1) % NEXT.length](id)
    setItems((l) => [item, ...l])
    if (!item.live) return
    const t = window.setInterval(() => {
      setItems((l) =>
        l.map((x) => {
          if (x.id !== id || !x.live || x.live.done) return x
          const p = Math.min(1, x.live.progress + 0.04 + Math.random() * 0.06)
          if (p >= 1) clearInterval(t)
          return { ...x, live: { ...x.live, progress: p, status: p < 0.5 ? 'Building' : p < 0.85 ? 'Optimizing images' : 'Going live', done: p >= 1 } }
        }),
      )
    }, 280)
  }

  return (
    <div className="flex h-[560px] w-[380px] flex-col items-center">
      <Inbox
        items={items}
        align={b.get('align', 'center')}
        defaultOpen
        onRead={b.on('onRead', (id: string) => patch(id, (x) => ({ ...x, unread: false })))}
        onReadAll={b.on('onReadAll', () => setItems((l) => l.map((x) => ({ ...x, unread: false }))))}
        onDismiss={b.on('onDismiss', (id: string) => setItems((l) => l.filter((x) => x.id !== id)))}
        onInvite={b.on('onInvite', (id: string, accept: boolean) => patch(id, (x) => ({ ...x, unread: false, invite: { ...x.invite, state: accept ? 'accepted' : 'declined' } })))}
      />
      <motion.button
        data-inbox-keep
        whileTap={press}
        onClick={simulate}
        className="ring-focus mt-auto h-8 rounded-full bg-surface px-3.5 text-footnote font-medium text-ink-2 transition-colors hover:text-ink"
        style={{ boxShadow: 'var(--elev-raised)' }}
      >
        Send a test notification
      </motion.button>
    </div>
  )
}

/* ───────────────────────────── Stepper ───────────────────────────── */

/** Holds + to show the acceleration, adds storage, then runs back down and bumps the floor. Hovering pauses; touching hands it over. */
export function StepperDemo() {
  const b = useBench()
  const [seats, setSeats] = useState(5)
  const [storage, setStorage] = useState(1)
  const total = seats * 12 + storage * 4
  const a = useRef<StepperHandle>(null)
  const bb = useRef<StepperHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (;;) {
        await beat(1500)
        a.current?.hold(1)
        await tick(1900)
        a.current?.release()
        await beat(1100)
        for (let i = 0; i < 2; i++) {
          bb.current?.bump(1)
          await beat(520)
        }
        await beat(1200)
        a.current?.hold(-1)
        await tick(1900)
        a.current?.release()
        await beat(900)
        for (let i = 0; i < 4; i++) {
          bb.current?.bump(-1)
          await beat(520)
        }
        await beat(1300)
        setSeats(5)
        setStorage(1)
      }
    }
    play().catch(() => {
      a.current?.release()
      bb.current?.release()
    })
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="w-[360px] rounded-[22px] bg-surface p-2 shadow-float" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <Row name="Seats" note="$12 per seat a month">
        <Stepper ref={a} label={b.get('label', 'Seats')} value={seats} onChange={b.on('onChange', setSeats)} min={b.get('min', 1)} max={b.get('max', 50)} step={b.get('step', 1)} />
      </Row>
      <Row name="Extra storage" note="100 GB blocks, $4 each">
        <Stepper ref={bb} label="Extra storage" value={storage} onChange={b.on('onChange', setStorage)} min={0} max={20} />
      </Row>
      <div className="mx-3 my-1 h-px bg-line" />
      <div className="flex h-12 items-center justify-between px-3">
        <span className="text-callout text-ink-2">Total</span>
        <span className="flex items-baseline gap-1">
          <span className="flex text-title text-ink">
            $<Ticker value={total} />
          </span>
          <span className="text-footnote text-ink-3">a month</span>
        </span>
      </div>
    </div>
  )
}

function Row({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-callout font-medium text-ink">{name}</p>
        <p className="text-footnote text-ink-3">{note}</p>
      </div>
      {children}
    </div>
  )
}
