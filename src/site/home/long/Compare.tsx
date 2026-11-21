'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { Mark } from '@/site/parts'
import { InPlay } from '@/lab/blocks/kit/director'
import { BlockPiece } from '@/site/library/Library'
import { Tabs, WRAP } from './parts'

/**
 * Same prompt, two builds: what a coding agent ships on its own, and the Detent Agent chat block.
 * A two-way switch, flipping by itself until someone picks a side. Three notes say what changed.
 */
const SCREEN: [number, number] = [1280, 860]

/* The same frame BlockPiece uses, so the two layers line up exactly. */
function Frame({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.offsetWidth / SCREEN[0]))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="absolute inset-0 flex items-center justify-center p-[6%]">
      <div ref={box} className="relative w-full overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_.5px_var(--line-strong),0_18px_40px_-16px_rgb(0_0_0/0.28)]" style={{ aspectRatio: `${SCREEN[0]} / ${SCREEN[1]}` }}>
        {scale > 0 && (
          <div className="absolute left-0 top-0 origin-top-left overflow-hidden" style={{ width: SCREEN[0], height: SCREEN[1], transform: `scale(${scale})` }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/* What an agent ships with no design system: default fonts, grey boxes, raw tool output, a blue button for everything. */
function PlainChat() {
  const plain = { fontFamily: 'Arial, Helvetica, sans-serif' }
  return (
    <div className="flex h-full bg-white text-[15px] text-[#222]" style={plain}>
      <aside className="flex w-[250px] flex-col gap-2 border-r border-[#ddd] bg-[#f5f5f5] p-4">
        <button type="button" className="rounded bg-[#2563eb] px-3 py-2 text-left text-white">+ New Chat</button>
        <p className="mt-3 text-[13px] font-bold uppercase text-[#888]">History</p>
        {['Order 4471 issue', 'DHL question', 'Refund policy', 'Untitled chat', 'Untitled chat'].map((t, i) => (
          <div key={i} className={`rounded px-2 py-1.5 ${i === 0 ? 'bg-[#e5e5e5]' : ''}`}>
            {t}
          </div>
        ))}
        <div className="mt-auto border-t border-[#ddd] pt-3 text-[13px] text-[#666]">Settings</div>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="border-b border-[#ddd] px-6 py-4 text-[18px] font-bold">Support Agent</header>
        <div className="flex-1 space-y-4 overflow-hidden p-6">
          <div className="ml-auto w-fit max-w-[60%] rounded-lg bg-[#2563eb] px-4 py-2.5 text-white">Lucía says order #4471 never arrived. Can you sort it out?</div>
          <div className="w-fit max-w-[70%] rounded-lg bg-[#f0f0f0] px-4 py-2.5">
            <p className="mb-2 text-[13px] text-[#888]">Calling tool: lookup_order...</p>
            <pre className="mb-2 whitespace-pre-wrap rounded bg-white p-2 text-[12px] text-[#555]">{'{"order_id":"4471","status":"lost_in_transit","carrier":"DHL","amount":89.00}'}</pre>
            <p>The order was marked lost by DHL. I can refund $89.00 to the customer. Do you want me to proceed?</p>
          </div>
          <div className="w-fit rounded-lg border border-[#ddd] p-4">
            <p className="mb-3 font-bold">Approve refund?</p>
            <div className="flex gap-2">
              <button type="button" className="rounded bg-[#2563eb] px-4 py-1.5 text-white">Yes</button>
              <button type="button" className="rounded bg-[#e5e5e5] px-4 py-1.5">No</button>
            </div>
          </div>
          <p className="text-[13px] text-[#999]">Thinking...</p>
        </div>
        <div className="flex gap-2 border-t border-[#ddd] p-4">
          <input readOnly placeholder="Type a message..." className="flex-1 rounded border border-[#ccc] px-3 py-2" />
          <button type="button" className="rounded bg-[#2563eb] px-5 text-white">Send</button>
        </div>
      </main>
    </div>
  )
}

const UI = [0.2, 0, 0, 1] as const


const plain = { fontFamily: 'Arial, Helvetica, sans-serif' }

function PlainInbox() {
  const rows: [string, string, string][] = [
    ['Ana Souza', 'Charged twice for October', 'billing'],
    ['Marcus Lee', 'SSO before our rollout?', 'sales'],
    ['Hana Ito', 'CSV export drops the last column', 'bug'],
    ['Tom Becker', 'Love the new agent runs', 'feedback'],
    ['Priya Nair', 'Seats after removing two people', 'billing'],
    ['Jonas Weber', 'Do webhooks retry?', 'question'],
  ]
  return (
    <div className="flex h-full bg-white text-[15px] text-[#222]" style={plain}>
      <aside className="w-[200px] space-y-1 border-r border-[#ddd] bg-[#f5f5f5] p-4">
        <p className="mb-3 text-[18px] font-bold">Support</p>
        {['Inbox (6)', 'Drafts', 'Assigned', 'Snoozed', 'Done'].map((t, i) => (
          <div key={t} className={`rounded px-2 py-1.5 ${i === 0 ? 'bg-[#e5e5e5] font-bold' : ''}`}>
            {t}
          </div>
        ))}
      </aside>
      <div className="w-[360px] border-r border-[#ddd]">
        <div className="border-b border-[#ddd] p-3">
          <input readOnly placeholder="Search tickets..." className="w-full rounded border border-[#ccc] px-2 py-1.5" />
        </div>
        {rows.map(([who, what, tag], i) => (
          <div key={who} className={`border-b border-[#eee] px-3 py-2.5 ${i === 0 ? 'bg-[#eef4ff]' : ''}`}>
            <p className="font-bold">{who}</p>
            <p className="text-[14px] text-[#555]">{what}</p>
            <p className="mt-1 text-[12px] text-[#888]">tag: {tag}</p>
          </div>
        ))}
      </div>
      <main className="flex flex-1 flex-col p-6">
        <p className="text-[20px] font-bold">Charged twice for October</p>
        <p className="mt-1 text-[13px] text-[#888]">From: ana@lumen.studio</p>
        <p className="mt-5 leading-6">Hi, our card was charged $320 twice on October 1. Could you refund the duplicate? Our finance team is asking about it. Thanks, Ana</p>
        <p className="mt-8 font-bold">Reply</p>
        <textarea readOnly className="mt-2 h-[150px] w-full rounded border border-[#ccc] p-3 text-[14px]" value="" placeholder="Write a reply..." />
        <div className="mt-3 flex gap-2">
          <button type="button" className="rounded bg-[#e5e5e5] px-4 py-2">Generate AI reply</button>
          <button type="button" className="rounded bg-[#2563eb] px-4 py-2 text-white">Send</button>
        </div>
      </main>
    </div>
  )
}

function PlainEvals() {
  /* Same ten cases as the Evals block: production (v12) against the candidate (v13) */
  const rows: [string, number, number][] = [
    ['Damaged on arrival, under $150', 0.94, 0.96],
    ['Annual plan, day 40', 0.31, 0.92],
    ['Refund over $500', 0.9, 0.18],
    ['Wrong item, wants an exchange', 0.88, 0.9],
    ['Late delivery, partial refund', 0.4, 0.86],
    ['Angry tone', 0.82, 0.87],
    ['Gift card purchase', 0.85, 0.52],
    ['Charged twice', 0.35, 0.93],
    ['Refund to a closed card', 0.44, 0.48],
    ['Request in Spanish', 0.89, 0.9],
  ]
  const pass = (n: number) => (n >= 0.7 ? 'PASS' : 'FAIL')
  return (
    <div className="h-full overflow-hidden bg-[#f7f7f7] p-6 text-[15px] text-[#222]" style={plain}>
      <div className="flex items-center justify-between">
        <p className="text-[24px] font-bold">Eval Results</p>
        <button type="button" tabIndex={-1} className="rounded bg-[#2563eb] px-4 py-2 text-[14px] text-white">
          Deploy v13
        </button>
      </div>
      <p className="mt-2 text-[14px] text-[#555]">Pass rate: v12 60% / v13 70%</p>
      <table className="mt-5 w-full border border-[#ddd] bg-white text-left text-[14px]">
        <thead>
          <tr className="bg-[#eee] text-[#555]">
            <th className="px-3 py-2">case</th>
            <th className="px-3">v12 score</th>
            <th className="px-3">v12</th>
            <th className="px-3">v13 score</th>
            <th className="px-3">v13</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, a, b]) => (
            <tr key={name} className="border-t border-[#eee]">
              <td className="px-3 py-2">{name}</td>
              <td className="px-3">{a}</td>
              <td className="px-3">{pass(a)}</td>
              <td className="px-3">{b}</td>
              <td className="px-3">{pass(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const BUILDS = [
  { id: 'agent-chat', name: 'Agent chat', plain: <PlainChat />, notes: ['The refund waits for a yes, with the policy checks beside it.', 'Tool calls read as steps, not raw JSON.', 'The run shows where the time went.'] },
  { id: 'support-inbox', name: 'Support inbox', plain: <PlainInbox />, notes: ['The inbox is sorted and the replies drafted before you open it.', 'Each row says what it is about and whether a draft is waiting.', 'Sending takes you to the next conversation.'] },
  { id: 'evals', name: 'Evals', plain: <PlainEvals />, notes: ['Each case is marked Fixed or Regressed, not just pass or fail.', 'A regression opens side by side, with why the grader marked it down.', 'Ship waits until a person decides every regression.'] },
]

export function Compare() {
  const [at, setAt] = useState(0)
  const [detent, setDetent] = useState(true)
  const [held, setHeld] = useState(false)
  const build = BUILDS[at]
  const show = (k: number) => {
    setAt(k)
    setDetent(false)
    setHeld(false)
  }
  const reduce = useReducedMotion()
  useEffect(() => {
    if (held || reduce) return
    const t = window.setTimeout(() => setDetent((d) => !d), detent ? 5200 : 2600)
    return () => clearTimeout(t)
  }, [detent, held, reduce])
  const pick = (d: boolean) => {
    setHeld(true)
    setDetent(d)
  }
  const fade = (on: boolean) => ({ opacity: on ? 1 : 0, scale: on ? 1 : 0.985, filter: on ? 'blur(0px)' : 'blur(6px)' })
  return (
    <div className={WRAP}>
      <Tabs label="Screen" value={build.id} onChange={(id) => show(BUILDS.findIndex((b) => b.id === id))} items={BUILDS.map((b) => ({ id: b.id, label: b.name }))} />
      <div className="mt-3 flex justify-center">
        <div role="radiogroup" aria-label="Which build" className="relative flex gap-1 rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] p-1">
          {[false, true].map((d) => (
            <button
              key={String(d)}
              type="button"
              role="radio"
              aria-checked={d === detent}
              onClick={() => pick(d)}
              className={`ring-focus relative z-10 flex h-9 items-center gap-2 rounded-full px-4 text-[14px] transition-colors duration-200 ${d === detent ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              {d === detent && <motion.span layoutId="build-pick" className="absolute inset-0 -z-10 rounded-full bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--line)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              {d ? (
                <>
                  <Mark size={14} still />
                  With Detent
                </>
              ) : (
                'Agent alone'
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[20px] bg-[var(--mount)] p-2 shadow-[0_0_0_1px_var(--line)]" onPointerDown={() => setHeld(true)}>
        <div className="relative isolate aspect-[16/10] overflow-clip rounded-[12px] bg-surface-2 shadow-[0_0_0_1px_var(--line)]">
          <motion.div className="absolute inset-0" initial={false} animate={fade(detent)} transition={{ duration: reduce ? 0 : 0.45, ease: UI }} style={{ pointerEvents: detent ? 'auto' : 'none' }}>
            <div className="pointer-events-none absolute inset-0">
              <InPlay.Provider value>
                <BlockPiece key={build.id} id={build.id} />
              </InPlay.Provider>
            </div>
          </motion.div>
          <motion.div className="pointer-events-none absolute inset-0" initial={false} animate={fade(!detent)} transition={{ duration: reduce ? 0 : 0.45, ease: UI }}>
            <Frame key={build.id}>{build.plain}</Frame>
          </motion.div>
        </div>
      </div>

      <ul className="mt-6 grid gap-x-8 gap-y-2 text-center text-[14px] leading-[1.5] sm:grid-cols-3">
        {build.notes.map((n) => (
          <li key={n} className={`transition-colors duration-300 ${detent ? 'text-ink-2' : 'text-quiet'}`}>
            {n}
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-[15px] text-ink-2">
          <span className="text-ink">{build.name}</span> is a Pro screen. So is every other whole screen.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/pro" className="ring-focus inline-flex h-[42px] items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-[14px] text-white transition-transform duration-150 active:scale-[0.97]">
            Get Pro, $99 once
          </Link>
          <Link href={`/blocks/${build.id}`} className="ring-focus inline-flex h-[42px] items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] px-5 text-[14px] text-ink transition-transform duration-150 active:scale-[0.97]">
            Open {build.name.toLowerCase()}
          </Link>
        </div>
      </div>
    </div>
  )
}
