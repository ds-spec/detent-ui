'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { daysFor } from '@/catalog/effort'
import { Check } from '@/lab/icons'
import { PRO_DEMOS } from '@pro'
import { CopyCommand } from '../parts'
import { Fit } from '../Fit'
import { wellOf } from '../wells'
import type { Tone } from '../home/lights'

const UI = [0.2, 0, 0, 1] as const

type Case = { id: string; tab: string; pain: string; tone: Tone; handled: string[]; today: () => ReactNode }

const CASES: Case[] = [
  {
    id: 'answer',
    tab: 'Answers',
    pain: 'The reply streams in as raw markdown, the page jumps with every token, and sources are a footnote nobody reads.',
    tone: 'blue',
    handled: ['Thinking, tools and reply in their own places', 'Markdown that never half-renders', 'Citations that open their source'],
    today: Answer,
  },
  {
    id: 'trace',
    tab: 'Agent runs',
    pain: 'Tool calls show up as JSON in a log, so nobody can tell what the agent did, or why it took forty seconds.',
    tone: 'violet',
    handled: ['Every step as a plain sentence', 'Where the time went, at a glance', 'A step waiting on you lifts out'],
    today: Run,
  },
  {
    id: 'approval',
    tab: 'Approvals',
    pain: 'An agent about to spend money or delete data asks with window.confirm(). One misclick and it’s done.',
    tone: 'rose',
    handled: ['Queued asks wait their turn', 'Money needs a second press', 'Undo, the keyboard, both themes'],
    today: Confirm,
  },
  {
    id: 'ask',
    tab: 'Docs search',
    pain: 'Search misses the question, and an Ask AI button opens a chatbot that answers with no sources. Readers never learn which page it came from.',
    tone: 'amber',
    handled: ['Keywords search, questions answer', 'Every claim names its page', 'Streams in without moving the list'],
    today: Lookup,
  },
]

export function Gap() {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  const [on, setOn] = useState(false)
  const box = useRef<HTMLDivElement | null>(null)
  const seen = useInView(box, { once: true, margin: '-30% 0px' })
  const timer = useRef(0)

  const later = (ms: number) => {
    clearTimeout(timer.current)
    if (reduce) return setOn(true)
    timer.current = window.setTimeout(() => setOn(true), ms)
  }
  useEffect(() => {
    if (seen) later(1800)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen])

  const pick = (k: number) => {
    setN(k)
    setOn(false)
    later(1400)
  }
  const flip = (v: boolean) => {
    clearTimeout(timer.current)
    setOn(v)
  }

  const c = CASES[n]
  const Demo = PRO_DEMOS[c.id]
  const Today = c.today

  return (
    <div ref={box} className="grid gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div role="tablist" aria-label="Hard parts" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {CASES.map((x, k) => {
          const at = k === n
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={at}
              onClick={() => pick(k)}
              className={`ring-focus relative shrink-0 rounded-[18px] px-4 py-3 text-left transition-colors duration-150 lg:px-5 lg:py-4 ${at ? 'bg-surface shadow-[var(--card-edge)]' : 'hover:bg-surface-2 active:bg-surface-2'}`}
            >
              <span className={`block text-[15px] tracking-[-0.01em] lg:text-[17px] ${at ? 'text-ink' : 'text-ink-3'}`}>{x.tab}</span>
              <span className={`hidden overflow-hidden text-[14px] leading-[1.55] text-ink-3 transition-[max-height,opacity,margin] duration-300 lg:block ${at ? 'mt-1.5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>{x.pain}</span>
            </button>
          )
        })}
      </div>

      <div className="flex min-w-0 flex-col rounded-[28px] bg-surface p-2 shadow-[var(--card-edge)]">
        <div className="relative isolate h-[516px] overflow-hidden rounded-[22px] sm:h-[540px]" style={{ background: on ? wellOf(c.tone) : 'var(--surface-2)' }}>
          <div aria-hidden className="absolute inset-0 rounded-[22px] shadow-[inset_0_0_0_1px_var(--line)]" />
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={`${c.id}-${on}`}
              inert={!on}
              className="absolute inset-x-0 bottom-0 top-14 sm:top-0"
              initial={reduce ? false : { opacity: 0, scale: on ? 0.985 : 1 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.28, ease: UI } }}
              exit={{ opacity: 0, transition: { duration: 0.14, ease: UI } }}
            >
              {on ? (
                Demo && (
                  <Fit pad={32} max={1} min={0.34}>
                    <Demo />
                  </Fit>
                )
              ) : (
                <>
                  <Fit pad={24} max={1} min={0.4}>
                    <Today />
                  </Fit>
                  {Demo && (
                    <div aria-hidden className="hidden">
                      <Demo />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
            <div role="radiogroup" aria-label="Show" className="relative flex rounded-full bg-surface p-1 shadow-[var(--card-edge)]">
              {(
                [
                  ['Today', 'Most apps today', false],
                  ['With Detent', 'With Detent', true],
                ] as const
              ).map(([short, label, v]) => (
                <button
                  key={String(v)}
                  type="button"
                  role="radio"
                  aria-checked={on === v}
                  onClick={() => flip(v)}
                  className={`ring-focus relative h-8 whitespace-nowrap rounded-full px-3.5 text-[13px] transition-[color,transform] duration-150 active:scale-[0.97] ${on === v ? 'text-surface' : 'text-ink-3 hover:text-ink'}`}
                >
                  {on === v && <motion.span layoutId="gap-switch" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                  <span className="relative sm:hidden">{short}</span>
                  <span className="relative hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-5 px-4 pb-3 pt-5 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <p className="text-[14px] leading-[1.6] text-ink-3 lg:hidden">{c.pain}</p>
          <ul className="flex flex-col gap-1.5 md:row-span-2">
            {c.handled.map((h) => (
              <li key={h} className="flex items-center gap-2 text-[14.5px] text-ink-2">
                <Check size={13} className="shrink-0 text-ink-3" />
                {h}
              </li>
            ))}
          </ul>
          <div className="flex min-w-0 flex-col gap-2.5 md:w-[340px]">
            <p className="text-[14px] text-ink-3">
              Took us <span className="tnum text-ink">{daysFor(c.id)} days</span>. Takes you one line.
            </p>
            <CopyCommand command={`npx shadcn add @detent-pro/${c.id}`} fill />
          </div>
        </div>
      </div>
    </div>
  )
}

const SYS = 'font-[system-ui,-apple-system,sans-serif]'
const MONO = 'font-mono text-[12.5px] leading-[1.6]'

function Answer() {
  return (
    <div className={`w-[560px] max-w-full ${SYS} text-[14px] leading-[1.6] text-ink-2`}>
      <div className="ml-auto w-fit max-w-[380px] rounded-[10px] bg-[var(--line)] px-3 py-2 text-ink">What’s our refund policy for annual plans?</div>
      <div className="mt-5 text-ink-3">Thinking...</div>
      <div className="mt-3 whitespace-pre-wrap">
        {'**Annual plans** can be refunded within 30 days of purchase [1]. After that, refunds are prorated:\n\n- Unused months are refunded at the monthly rate\n- Add-ons are **not** refundable [2\n\n```ts\nconst refund = (months'}
        <span className="ml-0.5 inline-block h-[15px] w-[7px] translate-y-[2px] bg-current align-baseline" />
      </div>
      <div className="mt-4 text-[12px] text-ink-3">[1] refund-policy.md [2] billing-faq.md</div>
    </div>
  )
}

function Run() {
  const lines = [
    '{"type":"tool-call","toolCallId":"call_8f2","toolName":"searchDocs","args":{"query":"refund annual"}}',
    '{"type":"tool-result","toolCallId":"call_8f2","result":{"hits":4,"ms":2310}}',
    '{"type":"tool-call","toolCallId":"call_9a1","toolName":"getInvoice","args":{"id":"INV-2041"}}',
    '{"type":"tool-result","toolCallId":"call_9a1","result":{"amount":320,"currency":"usd","status":"paid"}}',
    '{"type":"tool-call","toolCallId":"call_a07","toolName":"issueRefund","args":{"invoice":"INV-2041","amount":320}}',
    '{"type":"tool-result","toolCallId":"call_a07","result":{"error":"requires_approval"}}',
    '{"type":"finish","finishReason":"tool-calls","usage":{"promptTokens":4127,"completionTokens":388}}',
  ]
  return (
    <div className={`w-[620px] max-w-full ${MONO} text-ink-2`}>
      {lines.map((l, i) => (
        <div key={i} className="break-all border-b border-dashed border-[var(--line)] py-1.5 last:border-0">
          {l}
        </div>
      ))}
    </div>
  )
}

function Confirm() {
  return (
    <div className="flex h-[360px] w-[560px] max-w-full items-start justify-center pt-6">
      <div className={`w-[420px] max-w-full rounded-[12px] bg-surface p-5 ${SYS} shadow-[0_12px_40px_rgb(0_0_0/0.18),0_0_0_1px_var(--line)]`}>
        <p className="text-[13px] font-semibold text-ink">localhost:3000 says</p>
        <p className="mt-3 text-[14px] leading-[1.5] text-ink-2">The agent wants to run issueRefund({'{'} invoice: &quot;INV-2041&quot;, amount: 320 {'}'}). Allow?</p>
        <div className="mt-5 flex justify-end gap-2">
          <span className="rounded-[6px] px-3.5 py-1.5 text-[13px] text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]">Cancel</span>
          <span className="rounded-[6px] bg-[#0a66ff] px-5 py-1.5 text-[13px] text-white">OK</span>
        </div>
      </div>
    </div>
  )
}

function Lookup() {
  return (
    <div className={`w-[520px] max-w-full ${SYS}`}>
      <div className="flex h-10 items-center gap-2 rounded-[8px] bg-surface px-3 text-[14px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
        how do I rotate an API key?
        <span className="ml-auto rounded-[6px] bg-[#0a66ff] px-2.5 py-1 text-[12px] text-white">Ask AI</span>
      </div>
      <p className="mt-3 px-1 text-[13px] text-ink-3">No results for “how do I rotate an API key?”</p>
      <div className="mt-6 rounded-[12px] bg-surface p-4 shadow-[0_12px_40px_rgb(0_0_0/0.14),0_0_0_1px_var(--line)]">
        <p className="text-[12px] font-semibold text-ink">AI Assistant</p>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-2">
          To rotate an API key, go to your settings and generate a new key. Make sure to update your applications with the new key. Let me know if you have any other questions!
        </p>
      </div>
    </div>
  )
}
