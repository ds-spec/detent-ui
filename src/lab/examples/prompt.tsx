'use client'

import { useEffect, useRef, useState } from 'react'
import { PromptBox } from '../components/prompt/PromptBox'
import type { Attachment, Message, Mode, Model, PromptHandle } from '../components/prompt/PromptBox'

type Turn = { q: string; a: string | null }

/** Timers that all clear when the example unmounts or a send is stopped. */
function useTimers() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach(clearTimeout), [])
  return {
    after: (ms: number, run: () => void) => void ids.current.push(window.setTimeout(run, ms)),
    clear: () => {
      ids.current.forEach(clearTimeout)
      ids.current = []
    },
  }
}

/**
 * Writes an answer into the thread a few words at a time, the way a model streams,
 * then settles the send. `wait` is how long it "thinks" before the first word.
 */
function answer(t: ReturnType<typeof useTimers>, q: string, full: string, set: (turn: Turn) => void, done: () => void, wait = 900) {
  const words = full.split(' ')
  words.forEach((_, i) => t.after(wait + i * 55, () => set({ q, a: words.slice(0, i + 1).join(' ') })))
  t.after(wait + words.length * 55 + 120, done)
}

/** The last question and answer above the box. While the answer hasn't started, a quiet ellipsis holds its place. */
function Thread({ turn, room = 24 }: { turn: Turn; room?: number }) {
  return (
    <div className="flex min-h-[132px] w-full flex-1 flex-col justify-end gap-3 px-2 text-[14px] leading-[1.5]" style={{ paddingBottom: room }}>
      <p className="max-w-[85%] self-end rounded-[16px] bg-surface-2 px-3.5 py-2 text-ink">{turn.q}</p>
      <p className="min-h-[3lh] max-w-[85%] text-ink-2" aria-live="polite">
        {turn.a ?? <span className="text-ink-3">…</span>}
      </p>
    </div>
  )
}

/** Short quote of what was asked, for answers that read as replies to it. */
const quote = (q: string) => (q.length > 48 ? `${q.slice(0, 46).trimEnd()}…` : q)

const SUPPORT_MODES: Mode[] = [
  { id: 'answer', name: 'Answer', note: 'Reply here in the chat' },
  { id: 'ticket', name: 'Open a ticket', note: 'Send it to a person on the team' },
]

/** A help desk: its own placeholder, two plain modes, suggestions on Tab, and a status that changes as it works. */
export function PromptSupport() {
  const [turn, setTurn] = useState<Turn>({ q: 'Why was I charged twice this month?', a: 'Your plan renewed on the 3rd and the old card was retried on the 5th. The second charge is already refunded, it shows within 5 days.' })
  const [status, setStatus] = useState('Reading your message')
  const t = useTimers()
  const onSend = (m: Message) =>
    new Promise<void>((done) => {
      t.clear()
      setTurn({ q: m.text, a: null })
      setStatus('Reading your message')
      t.after(500, () => setStatus(m.mode === 'ticket' ? 'Opening a ticket' : 'Checking your account'))
      const reply =
        m.mode === 'ticket'
          ? `Ticket #4821 is open for “${quote(m.text)}”. Someone on the billing team will reply by email within a day.`
          : `I checked your account for “${quote(m.text)}”. Your last invoice was paid on the 3rd and nothing is overdue. Want me to email you a copy?`
      answer(t, m.text, reply, setTurn, done, 1100)
    })
  return (
    <div className="flex w-full flex-col items-center">
      <Thread turn={turn} />
      <PromptBox
        width={560}
        label="Billing help"
        placeholder="Describe the problem"
        modes={SUPPORT_MODES}
        initialMode="answer"
        suggestions={['How do I change my card?', 'Can I get a copy of my invoice?']}
        status={status}
        onSend={onSend}
        onStop={() => {
          t.clear()
          setTurn((x) => ({ ...x, a: x.a ?? 'Stopped.' }))
        }}
      />
    </div>
  )
}

const AGENT_MODES: Mode[] = [
  { id: 'ask', name: 'Ask', note: 'Answers questions about the code' },
  { id: 'plan', name: 'Plan', note: 'Writes a plan, changes nothing' },
  { id: 'edit', name: 'Edit', note: 'Changes files in the project' },
]
const AGENT_MODELS: Model[] = [{ name: 'Fast' }, { name: 'Standard' }, { name: 'Deep' }]
const FILE: Attachment = { id: 'auth', name: 'auth.ts', size: 4_812, type: 'text/plain' }
const STEPS = ['Reading auth.ts', 'Planning the change', 'Editing 2 files']

/** A code agent: modes, a model menu and projects, a file already attached, and a status that walks through its steps. Esc stops it. */
export function PromptAgent() {
  const [turn, setTurn] = useState<Turn>({ q: 'Where do we check the session on each request?', a: 'In middleware.ts: it reads the cookie, verifies it with auth.ts and sends anyone signed out to /login.' })
  const [status, setStatus] = useState(STEPS[0])
  const box = useRef<PromptHandle>(null)
  const t = useTimers()
  useEffect(() => {
    box.current?.type('Add rate limiting to the login route')
  }, [])
  const onSend = (m: Message) =>
    new Promise<void>((done) => {
      t.clear()
      setTurn({ q: m.text, a: null })
      setStatus(STEPS[0])
      t.after(700, () => setStatus(STEPS[1]))
      t.after(1400, () => setStatus(STEPS[2]))
      const where = m.project ? ` in ${m.project}` : ''
      const reply =
        m.mode === 'plan'
          ? `Plan for “${quote(m.text)}”${where}: add a limiter in middleware.ts, cover it with a test, then note it in the changelog. Nothing changed yet.`
          : m.mode === 'ask'
            ? `For “${quote(m.text)}”${where}: the place to look is auth.ts, where every sign-in passes through verifySession().`
            : `Done${where}, with ${m.model}: added a limit of 5 tries a minute to /login in middleware.ts, and a test for it in auth.test.ts.`
      answer(t, m.text, reply, setTurn, done, 2000)
    })
  return (
    <div className="flex w-full flex-col items-center">
      {/* The box draws its file row upward over what sits above it, so leave room for that row. */}
      <Thread turn={turn} room={76} />
      <PromptBox
        ref={box}
        width={560}
        placeholder="Tell the agent what to change"
        modes={AGENT_MODES}
        initialMode="edit"
        model="Standard"
        models={AGENT_MODELS}
        projects={['api', 'web', 'docs']}
        initialFiles={[FILE]}
        status={status}
        onSend={onSend}
        onStop={() => {
          t.clear()
          setTurn((x) => ({ ...x, a: x.a ?? 'Stopped before changing anything.' }))
        }}
      />
    </div>
  )
}

/** A writing assistant: the send is a promise, so the box shows it working until the draft has finished streaming in. */
export function PromptWriter() {
  const [turn, setTurn] = useState<Turn>({ q: 'Summarise yesterday’s failed payments', a: '14 failed, 11 of them expired cards. 3 were declined by the bank and are worth a retry.' })
  const box = useRef<PromptHandle>(null)
  const t = useTimers()
  useEffect(() => {
    box.current?.type('Draft a reply to the vendor about the late delivery')
  }, [])
  const onSend = (m: Message) =>
    new Promise<void>((done) => {
      t.clear()
      setTurn({ q: m.text, a: null })
      const reply = /vendor|deliver|order/i.test(m.text)
        ? 'Hi Sam, thanks for the heads up on the delay. We need the order by Friday to make our launch. If that slips, could you let us know by Wednesday so we can plan around it?'
        : `Here’s a first draft for “${quote(m.text)}”: short, friendly, and with one clear ask at the end. Tell me the tone you want and I’ll rework it.`
      answer(t, m.text, reply, setTurn, done, 900)
    })
  return (
    <div className="flex w-full flex-col items-center">
      <Thread turn={turn} />
      <PromptBox ref={box} width={560} placeholder="Ask for a draft" status="Writing a draft" onSend={onSend} onStop={t.clear} />
    </div>
  )
}
