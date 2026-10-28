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

/*
 * Why Pro is worth it, shown rather than said. Four hard parts of an AI app, each on one stage
 * that flips between what most apps ship (the stream as it comes out of useChat, tool calls as
 * JSON, a browser confirm) and the Detent part running. The first time the stage comes into
 * view it starts on "today" and flips on its own, so the difference lands before anyone clicks.
 */

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
    id: 'diff',
    tab: 'Code changes',
    pain: 'An agent’s edit arrives as a wall of unified diff. Accept all, or read three hundred lines of plus and minus.',
    tone: 'amber',
    handled: ['Hunk-by-hunk verdicts', 'Lines stream in as they’re written', 'Unified slides into split'],
    today: Patch,
  },
]

export function Gap() {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  const [on, setOn] = useState(false)
  const box = useRef<HTMLDivElement | null>(null)
  const seen = useInView(box, { once: true, margin: '-30% 0px' })
  const timer = useRef(0)

  // Each part starts on "today" and turns to Detent by itself after a beat; choosing a side stops that.
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
      {/* The four parts, each with the problem it solves. */}
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
              className={`ring-focus relative shrink-0 rounded-[18px] px-4 py-3 text-left transition-colors duration-150 lg:px-5 lg:py-4 ${at ? 'bg-surface shadow-[var(--card-edge)]' : 'hover:bg-surface-2'}`}
            >
              <span className={`block text-[15px] tracking-[-0.01em] lg:text-[17px] ${at ? 'text-ink' : 'text-ink-3'}`}>{x.tab}</span>
              <span className={`hidden overflow-hidden text-[14px] leading-[1.55] text-ink-3 transition-[max-height,opacity,margin] duration-300 lg:block ${at ? 'mt-1.5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>{x.pain}</span>
            </button>
          )
        })}
      </div>

      <div className="flex min-w-0 flex-col rounded-[28px] bg-surface p-2 shadow-[var(--card-edge)]">
        {/* The stage: today, or with Detent. */}
        <div className="relative isolate h-[460px] overflow-hidden rounded-[22px] sm:h-[540px]" style={{ background: on ? wellOf(c.tone) : 'var(--surface-2)' }}>
          <div aria-hidden className="absolute inset-0 rounded-[22px] shadow-[inset_0_0_0_1px_var(--line)]" />
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={`${c.id}-${on}`}
              inert={!on}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: on ? 0.985 : 1 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.45, ease: UI } }}
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
                  {/* The Detent part loads behind "today", so the flip never lands on an empty stage. */}
                  {Demo && (
                    <div aria-hidden className="hidden">
                      <Demo />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* The switch, sat on the stage where the eye already is. */}
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
                  className={`ring-focus relative h-8 whitespace-nowrap rounded-full px-3.5 text-[13px] transition-colors duration-150 ${on === v ? 'text-surface' : 'text-ink-3 hover:text-ink'}`}
                >
                  {on === v && <motion.span layoutId="gap-switch" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                  <span className="relative sm:hidden">{short}</span>
                  <span className="relative hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* What it took, and what it takes you. */}
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

/*
 * "Today": what each part looks like when it's left as it comes. Plain system type, mono for
 * anything machine-shaped, no colour. Honest rather than ugly on purpose: this is what ships.
 */

const SYS = 'font-[system-ui,-apple-system,sans-serif]'
const MONO = 'font-mono text-[12.5px] leading-[1.6]'

function Answer() {
  return (
    <div className={`w-[560px] ${SYS} text-[14px] leading-[1.6] text-ink-2`}>
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
    <div className={`w-[620px] ${MONO} text-ink-2`}>
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
    <div className="flex h-[360px] w-[560px] items-start justify-center pt-6">
      <div className={`w-[420px] rounded-[12px] bg-surface p-5 ${SYS} shadow-[0_12px_40px_rgb(0_0_0/0.18),0_0_0_1px_var(--line)]`}>
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

function Patch() {
  const lines = [
    'diff --git a/src/billing/refund.ts b/src/billing/refund.ts',
    '@@ -12,9 +12,14 @@ export async function refund(invoice: Invoice) {',
    '   const paid = await getPayments(invoice.id)',
    '-  if (paid.length === 0) return',
    '-  const amount = paid[0].amount',
    '+  if (paid.length === 0) {',
    '+    throw new RefundError("nothing to refund")',
    '+  }',
    '+  const amount = paid.reduce((n, p) => n + p.amount, 0)',
    '+  const prorated = prorate(amount, invoice.period)',
    '   await stripe.refunds.create({',
    '-    amount,',
    '+    amount: prorated,',
    '     payment_intent: paid[0].intent,',
    '   })',
    '@@ -40,6 +45,8 @@ export function prorate(amount: number, p: Period) {',
    '+  if (p.kind === "annual") return amount * left(p)',
  ]
  return (
    <div className={`w-[620px] ${MONO} whitespace-pre text-ink-2`}>
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith('@@') || l.startsWith('diff') ? 'text-ink-3' : ''}>
          {l}
        </div>
      ))}
    </div>
  )
}
