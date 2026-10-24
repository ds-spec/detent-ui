'use client'

/**
 * Demos for the small pieces. Each plays its one moment on a loop; hovering pauses it, and
 * pressing or typing inside hands it over for good.
 */

import { useEffect, useRef, useState } from 'react'
import { AgentToasts } from '../components/small/AgentToasts'
import type { AgentEvent } from '../components/small/AgentToasts'
import { ContextRing } from '../components/small/ContextRing'
import type { ContextHandle, ContextPart } from '../components/small/ContextRing'
import { FileChips } from '../components/small/FileChip'
import type { Upload } from '../components/small/FileChip'
import { HoldToTalk } from '../components/small/HoldToTalk'
import type { HoldHandle } from '../components/small/HoldToTalk'
import { PromptChips } from '../components/small/PromptChips'
import type { ChipsHandle } from '../components/small/PromptChips'
import { RetryButton } from '../components/small/RetryButton'
import type { RetryHandle } from '../components/small/RetryButton'
import { RunButton } from '../components/small/RunButton'
import type { RunState } from '../components/small/RunButton'
import { Thinking } from '../components/small/Thinking'
import { TypingBubble } from '../components/small/TypingBubble'
import type { Line } from '../components/small/TypingBubble'
import { Versions } from '../components/small/Versions'
import type { VersionsHandle } from '../components/small/Versions'
import { ArrowUp, Plus } from '../icons'
import { Orb } from '../ui/Orb'
import { DetentMark } from '@/lab/ui/DetentMark'
import { useStack } from '../lib/hooks'
import { useLoop } from './loop'
import { AnimatePresence, motion } from 'motion/react'
import { useBench } from './bench'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ───────────────────────────── Regenerate ───────────────────────────── */

const DRAFTS = [
  'Refunds for damaged items no longer need a return. Annual plans now get 45 days, and anything over $500 needs a second approval.',
  'Three changes: damaged items are refunded without a return, the annual window is 45 days, and refunds over $500 need finance to sign off.',
]
const NEXT = [
  'Short version: no return for damaged items, 45 days on annual plans, and a second approval above $500.',
  'From today, damaged items skip the return, annual plans get 45 days instead of 30, and big refunds wait for finance.',
]

export function VersionsDemo() {
  const [run, setRun] = useState(0)
  return <VersionsRun key={run} n={run} onDone={() => setRun((r) => r + 1)} />
}

function VersionsRun({ n, onDone }: { n: number; onDone: () => void }) {
  const v = useRef<VersionsHandle>(null)
  const handlers = useLoop(async (beat) => {
    await beat(1600)
    v.current?.prev()
    await beat(1500)
    v.current?.next()
    await beat(1100)
    v.current?.regenerate()
    await beat(4200)
    onDone()
  })
  return (
    <div className="flex h-[230px] items-start" {...handlers}>
      <Versions
        ref={v}
        initial={DRAFTS}
        generate={async () => {
          await sleep(1300)
          return NEXT[n % NEXT.length]
        }}
      />
    </div>
  )
}

/* ───────────────────────────── Context ring ───────────────────────────── */

const LIMIT = 200_000
const SAID = [
  { me: true, text: 'Pull every refund from Q3' },
  { me: false, text: 'Pulled 1,284 refunds from Stripe, $96.2k in total.' },
  { me: true, text: 'Group them by reason' },
  { me: false, text: 'Damaged 41%, late 22%, wrong item 19%, other 18%.' },
  { me: true, text: 'How does that compare with Q2?' },
  { me: false, text: 'Damaged refunds are up 18% on Q2, nearly all from one carrier.' },
]
const GROWTH = [24_000, 61_000, 104_000, 132_000, 158_000, 171_000]

export function ContextDemo() {
  const b = useBench()
  const [chat, setChat] = useState(GROWTH[0])
  const [shown, setShown] = useState(1)
  const [folded, setFolded] = useState(0)
  const ring = useRef<ContextHandle>(null)
  const thread = useRef<HTMLDivElement>(null)
  useStack(thread, 6)
  const parts: ContextPart[] = [
    { id: 'system', label: 'Instructions', tokens: 4_000 },
    { id: 'files', label: 'Files', tokens: 18_000 },
    { id: 'chat', label: 'Conversation', tokens: chat },
  ]
  // Compacting folds everything but the latest exchange into one summary.
  const compact = () => {
    setFolded(Math.max(0, shown - 2))
    setChat(9_000)
  }
  const handlers = useLoop(async (beat) => {
    for (;;) {
      setFolded(0)
      setShown(1)
      setChat(GROWTH[0])
      for (let n = 2; n <= SAID.length; n++) {
        await beat(820)
        setShown(n)
        setChat(GROWTH[n - 1])
      }
      await beat(1200)
      ring.current?.open(true)
      await beat(1700)
      ring.current?.compact()
      await beat(2600)
      ring.current?.open(false)
      await beat(2600)
    }
  })
  const lines = SAID.slice(folded, shown)
  return (
    <div className="flex w-[360px] flex-col" {...handlers}>
      {/* The chat: it hangs from the composer, and compacting folds its start into one summary. */}
      <div className="relative h-[260px] overflow-hidden">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-10 bg-gradient-to-b from-bg to-transparent" />
        {/* Hung from the bottom by transform and stacked by transform: lines arriving or folding away move nothing in the layout. */}
        <div ref={thread} className="absolute inset-x-0 top-full flex -translate-y-full flex-col pb-4">
          <AnimatePresence initial={false}>
            {folded > 0 && (
              <motion.div
                key={`sum-${folded}`}
                className="flex justify-center pb-1"
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32, delay: 0.15 }}
              >
                <span className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-caption text-ink-2 shadow-raised">
                  <span className="size-1.5 rounded-full bg-[var(--accent)]" />
                  Summary of {folded} earlier messages
                </span>
              </motion.div>
            )}
            {lines.map((l) => (
              <motion.div
                key={l.text}
                className={`flex ${l.me ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, y: -40, transition: { duration: 0.32, ease: [0.4, 0, 0.6, 1] } }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, delay: 0.12 }}
                style={{ transformOrigin: '50% 0%' }}
              >
                <p className={`max-w-[260px] rounded-[18px] px-3.5 py-2 text-footnote leading-[18px] ${l.me ? 'rounded-br-[6px] bg-[light-dark(var(--ink),var(--surface-2))] text-[light-dark(var(--surface),var(--ink))]' : 'rounded-bl-[6px] bg-surface text-ink shadow-raised'}`}>{l.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="w-full rounded-[26px] bg-surface p-2 shadow-float">
        <p className="px-3 pb-3 pt-2.5 text-body text-ink-3">Ask anything</p>
        <div className="flex items-center justify-between">
          <ContextRing ref={ring} parts={parts} limit={LIMIT} onCompact={b.on('onCompact', compact)} />
          <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-ink-3">
            <ArrowUp size={17} />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── Run button ───────────────────────────── */

const STEPS = ['Planning the change', 'Editing 3 files', 'Running the tests', 'Opening a pull request']

export function RunDemo() {
  const b = useBench()
  const [state, setState] = useState<RunState>('idle')
  const [progress, setProgress] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // The run itself: while running, progress and the clock move on.
  useEffect(() => {
    if (state !== 'running') return
    const t = window.setInterval(() => {
      setSeconds((s) => s + 0.25)
      setProgress((p) => {
        const next = Math.min(1, p + 0.018)
        if (next >= 1) setState('done')
        return next
      })
    }, 250)
    return () => clearInterval(t)
  }, [state])

  const run = () => {
    setProgress(0)
    setSeconds(0)
    setState('running')
  }
  const handlers = useLoop(async (beat) => {
    for (;;) {
      await beat(1500)
      run()
      await beat(4200)
      setState('stopped')
      await beat(1900)
      setState('running')
      // Check only after the resume has landed; checking straight away still sees "stopped".
      do await beat(300)
      while (stateRef.current === 'running')
      await beat(2600)
      setState('idle')
    }
  })
  const at = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))
  const live = state === 'running' || state === 'stopped'
  return (
    // The button where it lives: on an agent's task, whose steps light up in step with it.
    <div className="w-[440px] rounded-[24px] bg-surface p-6 shadow-float" {...handlers}>
      <p className="text-caption text-ink-3">Agent task · acme/storefront</p>
      <p className="mt-1 text-title text-ink">Move checkout to the new pricing API</p>
      <ol className="mt-5 flex flex-col gap-2.5">
        {STEPS.map((s, i) => {
          const done = state === 'done' || (live && i < at)
          const now = live && i === at
          return (
            <li key={s} className="flex h-5 items-center gap-3 text-footnote">
              <span className="grid size-4 place-items-center">
                <span className={`col-start-1 row-start-1 size-1.5 rounded-full bg-ink-3/40 transition-opacity duration-200 ${done || now ? 'opacity-0' : ''}`} />
                <span className={`col-start-1 row-start-1 size-2 rounded-full transition-opacity duration-200 ${now ? '' : 'opacity-0'} ${state === 'stopped' ? 'bg-[var(--warn)]' : 'bg-[var(--accent)] motion-safe:animate-pulse'}`} />
                <span className={`col-start-1 row-start-1 grid size-4 place-items-center rounded-full bg-[color-mix(in_oklch,var(--ok)_16%,transparent)] text-[var(--ok)] transition-opacity duration-200 ${done ? '' : 'opacity-0'}`}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
              </span>
              <span className={`transition-colors duration-200 ${now ? 'text-ink' : done ? 'text-ink-2' : 'text-ink-3'}`}>{s}</span>
            </li>
          )
        })}
      </ol>
      {/* Anchored at the left of its slot: the button extends rightward as the run proceeds, and its left edge never moves. */}
      <div className="mt-6 flex h-[60px] items-center">
        <RunButton state={state} progress={progress} step={STEPS[at]} index={at + 1} total={STEPS.length} seconds={seconds} onRun={b.on('onRun', run)} onStop={b.on('onStop', () => setState('stopped'))} onResume={b.on('onResume', () => setState('running'))} label={b.get('label', 'Run agent')} />
      </div>
    </div>
  )
}

/* ───────────────────────────── Hold to talk ───────────────────────────── */

export function HoldDemo() {
  const b = useBench()
  const h = useRef<HoldHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      await beat(1500)
      h.current?.hold()
      await beat(2600)
      h.current?.release()
      await beat(1700)
      h.current?.hold()
      await beat(1100)
      // A slide that changes its mind, then one that goes through with it.
      for (const x of [-24, -52, -78]) {
        h.current?.slide(x)
        await beat(140)
      }
      await beat(500)
      for (const x of [-50, -20, 0]) {
        h.current?.slide(x)
        await beat(120)
      }
      await beat(700)
      for (const x of [-30, -64, -96, -126, -138]) {
        h.current?.slide(x)
        await beat(130)
      }
      await beat(800)
      h.current?.release()
      await beat(1600)
    }
  })
  return (
    <div {...handlers}>
      <HoldToTalk ref={h} onNote={b.on('onNote')} onCancel={b.on('onCancel')} placeholder={b.get('placeholder', 'Message')} />
    </div>
  )
}

/* ───────────────────────────── Agent toasts ───────────────────────────── */

const FLOW: [AgentEvent, Partial<AgentEvent>][] = [
  [
    { id: 'search', title: 'Searching the help center', detail: 'support-bot', status: 'running' },
    { title: 'Found 4 sources', detail: 'help.northwind.co and 3 more', status: 'done' },
  ],
  [
    { id: 'read', title: 'Reading refund-policy.pdf', detail: '12 pages', status: 'running' },
    { title: 'Read refund-policy.pdf', detail: 'The Q3 changes are on page 4', status: 'done' },
  ],
  [
    { id: 'draft', title: 'Drafting a reply to Dana', detail: 'Ticket #2291', status: 'running' },
    { title: 'Draft ready', detail: 'Reply to Dana Ruiz, 92 words', status: 'done', action: 'Review' },
  ],
]

const TICKETS = [
  { id: '2291', who: 'Dana Ruiz', hue: 20, subject: 'Lamp arrived with a cracked shade' },
  { id: '2290', who: 'Leo Park', hue: 250, subject: 'Can I change the delivery address?' },
  { id: '2288', who: 'Amara Okafor', hue: 150, subject: 'Refund window on annual plans' },
  { id: '2287', who: 'Sam Whitfield', hue: 300, subject: 'Copy of the October invoice' },
]

/**
 * The toasts where they live: the corner of a support inbox. The agent reports what it's doing
 * in the stack, and the ticket it's working on says the same thing in its row, so the two read
 * as one system. Once there's a pile, it fans open for a look, then settles back.
 */
export function ToastsDemo() {
  const b = useBench()
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [open, setOpen] = useState(false)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      await beat(900)
      for (const [i, [start, end]] of FLOW.entries()) {
        setEvents((e) => [...e, start])
        await beat(1400)
        setEvents((e) => e.map((x) => (x.id === start.id ? { ...x, ...end } : x)))
        await beat(700)
        if (i > 0) {
          setOpen(true)
          await beat(1700)
          setOpen(false)
          await beat(500)
        }
      }
      await beat(1800)
      setEvents([])
      await beat(600)
    }
  })
  const draft = events.find((e) => e.id === 'draft')?.status
  return (
    <div className="relative h-[420px] w-[640px] overflow-hidden rounded-[24px] bg-surface shadow-float" {...handlers}>
      <div className="flex h-12 items-center justify-between px-5 shadow-[inset_0_-1px_0_var(--line)]">
        <span className="text-footnote font-medium text-ink">Open tickets</span>
        <span className="tnum text-caption text-ink-3">{draft === 'done' ? 3 : 4} waiting</span>
      </div>
      <ul className="px-2 py-1.5">
        {TICKETS.map((t) => {
          const mine = t.id === '2291' && draft
          return (
            <li
              key={t.id}
              className="flex h-14 items-center gap-3 rounded-[14px] px-3 transition-colors duration-300"
              style={{ background: mine === 'running' ? 'color-mix(in oklch, var(--accent) 7%, transparent)' : undefined }}
            >
              <Orb seed={t.who} hue={t.hue} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-footnote font-medium text-ink">{t.who}</span>
                <span className="block truncate text-caption text-ink-3">{t.subject}</span>
              </span>
              <span className="tnum w-12 text-right font-mono text-caption text-ink-3">#{t.id}</span>
              {/* The row says what the toast says, in the same place every time. */}
              <span className="grid w-[104px] justify-items-end text-caption font-medium">
                {(['open', 'running', 'done'] as const).map((s) => (
                  <span
                    key={s}
                    className={`col-start-1 row-start-1 flex h-6 items-center gap-1.5 rounded-full px-2 transition-opacity duration-300 ${s === 'running' ? '' : s === 'done' ? 'chip' : 'chip chip-plain'} ${(mine || 'open') === s ? '' : 'opacity-0'}`}
                    style={s === 'running' ? { color: 'var(--accent)' } : s === 'done' ? { color: 'color-mix(in oklch, var(--ok) 75%, var(--ink))', ['--chip' as string]: 'var(--ok)', ['--chip-wash' as string]: '14%' } : { color: 'var(--ink-3)' }}
                  >
                    {s === 'running' && <span className="size-1.5 rounded-full bg-[var(--accent)] motion-safe:animate-pulse" />}
                    {s === 'open' ? 'Open' : s === 'running' ? <span className="sheen">Drafting</span> : 'Draft ready'}
                  </span>
                ))}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="absolute bottom-4 right-4">
        <AgentToasts events={events} agent={{ name: 'Detent', avatar: <DetentMark size={30} round /> }} expanded={b.get('expanded', false) || open} max={b.get('max', 3)} onAction={b.on('onAction')} onDismiss={b.on('onDismiss')} />
      </div>
    </div>
  )
}

/* ───────────────────────────── Thinking ───────────────────────────── */

/** Each step and how long it runs: thinking doesn't keep an even beat. */
const THOUGHTS: [string, number][] = [
  ['Reading the question', 900],
  ['Searching 3 sources', 2300],
  ['Comparing the two policies', 1700],
  ['Writing the answer', 1100],
]

export function ThinkingDemo() {
  const [run, setRun] = useState(0)
  return <ThinkingRun key={run} onDone={() => setRun((r) => r + 1)} />
}

function ThinkingRun({ onDone }: { onDone: () => void }) {
  const b = useBench()
  const [steps, setSteps] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)
  const handlers = useLoop(async (beat) => {
    for (const [t, ms] of THOUGHTS) {
      setSteps((s) => [...s, t])
      await beat(ms)
    }
    setDone(true)
    await beat(1000)
    setOpen(true)
    await beat(3200)
    setOpen(false)
    await beat(1000)
    onDone()
  })
  return (
    <div className="flex h-[300px] w-[320px] flex-col" {...handlers}>
      <p className="mb-4 ml-auto w-fit max-w-[260px] rounded-[20px] rounded-br-[8px] bg-[light-dark(var(--ink),var(--surface-2))] px-4 py-3 text-body leading-5 text-[light-dark(var(--surface),var(--ink))] shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line))]">Did the refund policy change?</p>
      <Thinking steps={steps} done={done} expanded={b.get('expanded', false) || open} />
    </div>
  )
}

/* ───────────────────────────── Typing bubble ───────────────────────────── */

const TALK: Line[] = [
  { id: 'a', from: 'me', text: 'Can you check order #4821?' },
  { id: 'b', from: 'agent', text: 'It arrived damaged on Oct 18.' },
  { id: 'b2', from: 'agent', text: 'Want me to refund the $86.40, or send a new one?' },
  { id: 'c', from: 'me', text: 'Refund it please' },
  { id: 'd', from: 'agent', text: 'Done. It’s on its way to Visa •• 4021, usually in 3 to 5 days.' },
]

export function TypingDemo() {
  const [lines, setLines] = useState<Line[]>([])
  const handlers = useLoop(async (beat) => {
    for (;;) {
      setLines([])
      await beat(700)
      for (const l of TALK) {
        if (l.from === 'agent') {
          setLines((x) => [...x, { ...l, typing: true }])
          await beat(1500)
          setLines((x) => x.map((y) => (y.id === l.id ? { ...y, typing: false } : y)))
          await beat(1600)
        } else {
          setLines((x) => [...x, l])
          await beat(900)
        }
      }
      await beat(2200)
    }
  })
  const typing = lines.some((l) => l.typing)
  return (
    <div className="w-[404px] rounded-[28px] bg-surface p-4 pt-3 shadow-float" {...handlers}>
      <div className="flex h-11 items-center gap-2.5 px-1">
        <DetentMark size={30} round />
        <div className="min-w-0">
          <p className="text-headline text-ink">Detent</p>
          <p className="relative h-4 text-caption">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={typing ? 't' : 'o'} className="absolute left-0 top-0 whitespace-nowrap text-ink-3" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                {typing ? 'typing…' : 'Usually replies in a minute'}
              </motion.span>
            </AnimatePresence>
          </p>
        </div>
      </div>
      <div className="mt-2 h-px bg-line" />
      <TypingBubble lines={lines} agent={{ name: 'Detent', avatar: <DetentMark size={28} round /> }} readAt="9:41" />
    </div>
  )
}

/* ───────────────────────────── Prompt chips ───────────────────────────── */

const IDEAS = ['Summarize this thread', 'Draft a reply', 'Find action items']

/**
 * The chips where they're useful: an assistant that has just read a busy thread. A suggestion
 * flies into the box, sends, and lands in the conversation as what you asked; then the next.
 */
export function ChipsDemo() {
  const b = useBench()
  const c = useRef<ChipsHandle>(null)
  const [asked, setAsked] = useState<{ id: number; text: string } | null>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      for (const i of [1, 2, 0]) {
        await beat(1500)
        c.current?.pick(i)
        await beat(1500)
        c.current?.send()
        await beat(1600)
        setAsked(null)
      }
    }
  })
  return (
    <div className="w-[460px] rounded-[26px] bg-card p-5 shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line-strong))]" {...handlers}>
      <div className="flex items-center justify-between px-1">
        <span className="text-footnote font-medium text-ink"># launch-planning</span>
        <span className="text-caption text-ink-3">48 new messages</span>
      </div>
      {/* What you asked lands here; until then, the assistant says what it has read. */}
      <div className="relative mt-3 h-[60px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {asked ? (
            <motion.p
              key={asked.id}
              className="absolute right-1 top-2 rounded-[16px] rounded-br-[6px] bg-[light-dark(var(--ink),var(--surface-2))] px-3.5 py-2 text-footnote text-[light-dark(var(--surface),var(--ink))] shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line))]"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            >
              {asked.text}
            </motion.p>
          ) : (
            <motion.p key="read" className="absolute left-1 top-3 flex items-center gap-2 text-footnote text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              Detent has read the thread.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <PromptChips ref={c} width={420} suggestions={IDEAS} onSend={b.on('onSend', (text: string) => setAsked({ id: Date.now(), text }))} />
    </div>
  )
}

/* ───────────────────────────── Retry ───────────────────────────── */

/** The retry where it happens: an assistant's reply that hit a rate limit, counting down in its place, and the answer once it gets through. */
export function RetryDemo() {
  const b = useBench()
  const r = useRef<RetryHandle>(null)
  const [answered, setAnswered] = useState(false)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      // The first automatic try fails; partway through the longer wait, the demo presses Retry now.
      await beat(5000 + 1600 + 3200)
      r.current?.now()
      await beat(4200)
      setAnswered(false)
      r.current?.reset()
    }
  })
  return (
    <div className="w-[460px] rounded-[24px] bg-card p-5 shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line-strong))]" {...handlers}>
      <p className="ml-auto w-fit rounded-[16px] rounded-br-[6px] bg-surface px-3.5 py-2 text-footnote text-ink" style={{ boxShadow: 'var(--elev-raised)' }}>
        What changed in the refund policy?
      </p>
      <div className="mt-4">
        <RetryButton
          ref={r}
          title={b.get('title', 'Rate limited')}
          base={b.get('base', 5)}
          attempt={async (n) => {
            await sleep(1300)
            if (n > 1) setTimeout(() => setAnswered(true), 900)
            return n > 1
          }}
        />
      </div>
      {/* Held in place from the start, so the card never grows when the answer lands. */}
      <p className={`mt-4 h-[44px] px-1 text-footnote leading-[22px] text-ink-2 transition-opacity duration-500 ${answered ? '' : 'opacity-0'}`} aria-hidden={!answered}>
        Three things: damaged items refund without a return, annual plans get 45 days, and refunds over $500 need a second approval.
      </p>
    </div>
  )
}

/* ───────────────────────────── File chips ───────────────────────────── */

const FILES: Omit<Upload, 'progress' | 'status'>[] = [
  { id: 'shot', name: 'hero-shot.png', size: 2_412_000, preview: 'linear-gradient(180deg, #c7d3e6 0%, #e9ddcc 52%, #8e9c7c 53%, #6a7a5c 100%)' },
  { id: 'deck', name: 'Q3 board update.pdf', size: 1_153_434 },
  { id: 'mood', name: 'moodboard.jpg', size: 3_980_000, preview: 'radial-gradient(circle at 70% 30%, #ffd9a8 0%, transparent 40%), linear-gradient(160deg, #f4b28c 0%, #e2879e 48%, #6b5aa6 100%)' },
  { id: 'notes', name: 'release-notes.md', size: 4_096 },
]

type Attached = Upload & { retried?: boolean }

export function FilesDemo() {
  const b = useBench()
  const [files, setFiles] = useState<Attached[]>([])

  // The uploads themselves: each moves at its own pace; the moodboard fails once on the way.
  useEffect(() => {
    const t = window.setInterval(() => {
      setFiles((all) =>
        all.map((f) => {
          if (f.status !== 'uploading') return f
          const next = Math.min(1, f.progress + (0.025 + 0.4 / Math.max(6, f.size / 1e5)) * (0.6 + Math.random() * 0.8))
          // Pure, so it behaves the same however often React runs it.
          if (f.id === 'mood' && next > 0.5 && !f.retried) return { ...f, progress: next, status: 'error' }
          return { ...f, progress: next, status: next >= 1 ? 'done' : 'uploading' }
        }),
      )
    }, 140)
    return () => clearInterval(t)
  }, [])

  const add = (id: string) => setFiles((f) => (f.some((x) => x.id === id) ? f : [...f, { ...FILES.find((x) => x.id === id)!, progress: 0, status: 'uploading' }]))
  const retry = (id: string) => setFiles((f) => f.map((x) => (x.id === id ? { ...x, progress: 0.04, status: 'uploading', retried: true } : x)))
  const handlers = useLoop(async (beat) => {
    for (;;) {
      setFiles([])
      await beat(1200)
      for (const id of ['shot', 'deck', 'mood']) {
        add(id)
        await beat(420)
      }
      await beat(3400)
      retry('mood')
      await beat(3600)
      setFiles((f) => f.filter((x) => x.id !== 'deck'))
      await beat(800)
      add('notes')
      await beat(3200)
    }
  })
  const busy = files.some((f) => f.status !== 'done')
  return (
    <div className="w-[440px] rounded-[24px] bg-surface p-3 shadow-float" {...handlers}>
      <FileChips files={files} onRemove={b.on('onRemove', (id: string) => setFiles((f) => f.filter((x) => x.id !== id)))} onRetry={b.on('onRetry', retry)} empty={b.get('empty', 'Attach files, or drop them here')} />
      <p className="px-1.5 pb-1 pt-3.5 text-body text-ink-3">Compare these with last quarter’s launch…</p>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" data-invite aria-label="Attach a file" onClick={() => add('notes')} className="sink ring-focus flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
          <Plus size={17} />
        </button>
        <button type="button" aria-label="Send" disabled={busy || !files.length} className={`ring-focus flex size-9 items-center justify-center rounded-full transition-colors ${busy || !files.length ? 'bg-surface-2 text-ink-3' : 'bg-ink text-surface'}`}>
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  )
}
