'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ease, press, spring } from '@/lab/lib/motion'
import { tap } from '@/lab/lib/feel'
import { useStack } from '@/lab/lib/hooks'
import { Orb } from '@/lab/ui/Orb'
import { Close, Plus, Search } from '@/lab/blocks/kit/icons'
import { btn } from '@/lab/blocks/kit/primitives'
import { useDirector } from '@/lab/blocks/kit/director'
import { Segmented } from '@/lab/blocks/kit/Segmented'
import { accentVars } from '@/lab/blocks/kit/props'
import type { BlockProps } from '@/lab/blocks/kit/props'
import { QUESTIONS } from './content'
import type { Question } from './content'

/**
 * The questions people ask before they start. Type and the list narrows as you go, with what
 * matched marked in place; when the match is only in an answer, a line of that answer comes up
 * under its question so you can see why it's there. Topics filter the same list, and every
 * answer asks whether it helped.
 *
 * The list stacks its rows by transform: answers open and rows come and go by their own height
 * while nothing else on the page moves. Beside it on wide screens, the heading, the search and a
 * way to reach a person stay put.
 */

export type FAQProps = BlockProps & {
  /** The product's name, wherever the default questions name it. */
  product?: string
  eyebrow?: string
  /** The heading, set in two tones. */
  title?: [string, string]
  subline?: string
  /** The questions. Topics come from them, in the order they first appear. */
  questions?: Question[]
  /** Let more than one answer be open at once. */
  multiple?: boolean
  /** Called with what a person searched for when nothing answers it. */
  onAsk?: (query: string) => void
  /** Called when a person asks to talk to someone. */
  onContact?: () => void
  /** Called when a person says whether an answer helped. */
  onFeedback?: (id: string, helpful: boolean) => void
}

export function FAQ({
  autoplay = true,
  accent,
  product = 'Detent',
  eyebrow = 'Questions',
  title = ['Everything you’d ask', 'before you start.'],
  subline = 'Search, or browse by topic. If it isn’t here, a person on the team will answer, usually within the hour.',
  questions: given,
  multiple = false,
  onAsk,
  onContact,
  onFeedback,
  className = '',
}: FAQProps) {
  const questions = useMemo(() => given ?? QUESTIONS.map((x) => ({ ...x, q: x.q.replaceAll('Detent', product), a: x.a.replaceAll('Detent', product) })), [given, product])
  const calls = useRef({ onAsk, onContact, onFeedback })
  useLayoutEffect(() => {
    calls.current = { onAsk, onContact, onFeedback }
  })
  const handed = useRef(!autoplay)
  const topics = ['All', ...questions.map((x) => x.topic).filter((t, i, all) => all.indexOf(t) === i)]
  const [topic, setTopic] = useState(0)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string[]>([])
  const [helped, setHelped] = useState<Record<string, boolean>>({})

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const shown = questions.filter((x) => (topic === 0 || x.topic === topics[topic]) && words.every((w) => `${x.q} ${x.a}`.toLowerCase().includes(w)))
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : multiple ? [...o, id] : [id]))

  const director = useDirector(
    async (wait) => {
      const type = async (text: string) => {
        for (const ch of text) {
          setQuery((q) => q + ch)
          await wait(80)
        }
      }
      const erase = async (n: number) => {
        for (let i = 0; i < n; i++) {
          setQuery((q) => q.slice(0, -1))
          await wait(35)
        }
      }
      await wait(1300)
      setOpen([questions[0].id])
      await wait(2800)
      setOpen([])
      await wait(600)
      await type('approve')
      await wait(1600)
      const hit = questions.find((x) => x.q.toLowerCase().includes('approve'))
      if (hit) {
        setOpen([hit.id])
        await wait(3000)
        setOpen([])
      }
      await wait(500)
      await erase(7)
      await wait(900)
      setTopic(topics.length - 1)
      await wait(1300)
      const first = questions.find((x) => x.topic === topics[topics.length - 1])
      if (first) {
        setOpen([first.id])
        await wait(3000)
        setOpen([])
      }
      await wait(600)
      setTopic(0)
      await wait(1800)
    },
    autoplay,
    () => (handed.current = true),
  )

  return (
    <div className={`pro-app @container h-full w-full overflow-y-auto overflow-x-hidden bg-surface text-ink [scrollbar-width:thin] ${className}`} style={accentVars(accent)} onPointerDownCapture={director.onPointerDownCapture} onPointerUpCapture={director.onPointerUpCapture} onKeyDownCapture={director.onKeyDownCapture}>
      <section className="mx-auto grid max-w-[1120px] gap-10 px-5 py-14 @3xl:px-8 @3xl:py-20 @4xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] @4xl:gap-16">
        <div className="@4xl:sticky @4xl:top-12 @4xl:self-start">
          <p className="text-footnote font-medium text-[var(--accent-ink)]">{eyebrow}</p>
          <h2 className="mt-3 text-[clamp(28px,4cqi,40px)] font-normal leading-[1.08] tracking-[-0.04em] text-ink">
            {title[0]}
            <span className="block text-[color-mix(in_oklch,var(--ink)_42%,transparent)]">{title[1]}</span>
          </h2>
          <p className="mt-4 text-[15px] leading-[23px] text-ink-2">{subline}</p>

          <label className="mt-7 flex h-11 items-center gap-2.5 rounded-full bg-surface pl-4 pr-1.5 shadow-raised transition-shadow focus-within:shadow-[var(--elev-raised),0_0_0_3px_color-mix(in_oklch,var(--accent)_22%,transparent)]">
            <Search size={16} className="shrink-0 text-ink-3" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQuery('')} placeholder="Search questions" aria-label="Search questions" className="h-full min-w-0 flex-1 bg-transparent text-callout text-ink outline-none placeholder:text-ink-3" />
            <button
              type="button"
              aria-label="Clear search"
              tabIndex={query ? 0 : -1}
              onClick={() => setQuery('')}
              className={`ring-focus grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-opacity hover:bg-surface-2 hover:text-ink ${query ? '' : 'pointer-events-none opacity-0'}`}
            >
              <Close size={14} />
            </button>
          </label>
          {/* What the search found, in one line that holds its place. */}
          <p aria-live="polite" className="mt-2.5 h-5 px-4 text-caption text-ink-3">
            {words.length ? (shown.length ? `${shown.length} ${shown.length === 1 ? 'answer' : 'answers'} for “${query.trim()}”` : `Nothing for “${query.trim()}” yet`) : `${questions.length} questions`}
          </p>

          <div className="mt-8 flex items-start gap-3 rounded-[16px] bg-[var(--card)] p-4 shadow-[0_0_0_1px_var(--line)]">
            <Orb seed="Maya Chen" hue={150} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-callout font-medium text-ink">Still stuck?</p>
              <p className="mt-0.5 text-footnote text-ink-2">Maya and the team answer in under an hour on weekdays.</p>
              <motion.button type="button" whileTap={press} onClick={() => (tap(), calls.current.onContact?.())} className={`${btn.secondary} mt-3`}>
                Talk to a person
              </motion.button>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <Segmented label="Topic" options={topics.map((t) => ({ id: t, label: t }))} at={topic} onPick={setTopic} />
          <List
            all={questions}
            multiple={multiple}
            items={shown}
            words={words}
            open={open}
            onToggle={toggle}
            helped={helped}
            onHelped={(id, v) => {
              setHelped((h) => ({ ...h, [id]: v }))
              if (handed.current) calls.current.onFeedback?.(id, v)
            }}
            query={query.trim()}
            onAsk={() => calls.current.onAsk?.(query.trim())}
          />
        </div>
      </section>
    </div>
  )
}

/**
 * Each search word, marked wherever it appears. The mark pads itself and gives the space back, so
 * text never reflows. Each search gets fresh text nodes: reusing the old ones would move their
 * starts as the split points change, and the page would count that as a shift.
 */
function marked(text: string, words: string[]): ReactNode {
  if (!words.length) return text
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return (
    <span key={words.join(' ')}>
      {text.split(re).map((part, i) =>
        i % 2 ? (
          <mark key={i} className="-mx-[2px] rounded-[3px] bg-[color-mix(in_oklch,var(--accent)_20%,transparent)] px-[2px] text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  )
}

/** A line of the answer around the first match, for a question that only matched in its answer. */
function snippet(answer: string, words: string[]) {
  const low = answer.toLowerCase()
  const at = Math.min(...words.map((w) => low.indexOf(w)).filter((i) => i >= 0))
  if (!Number.isFinite(at)) return null
  // From the start of its sentence when that's close, otherwise from a word boundary just before it.
  const sentence = Math.max(answer.lastIndexOf('. ', at), answer.lastIndexOf('? ', at))
  let start = sentence >= 0 && at - sentence < 64 ? sentence + 2 : Math.max(0, at - 34)
  if (start > 0 && start !== sentence + 2) start = answer.indexOf(' ', start) + 1
  let end = Math.min(answer.length, at + 70)
  if (end < answer.length) end = answer.lastIndexOf(' ', end)
  return `${start > 0 ? '…' : ''}${answer.slice(start, end)}${end < answer.length ? '…' : ''}`
}

function List({
  all,
  multiple,
  items,
  words,
  open,
  onToggle,
  helped,
  onHelped,
  query,
  onAsk,
}: {
  all: Question[]
  multiple: boolean
  items: Question[]
  words: string[]
  open: string[]
  onToggle: (id: string) => void
  helped: Record<string, boolean>
  onHelped: (id: string, v: boolean) => void
  query: string
  onAsk: () => void
}) {
  const id = useId()
  const stack = useRef<HTMLDivElement>(null)
  const holder = useRef<HTMLDivElement>(null)
  // If a search ever makes the list taller than the reserve, the box grows to fit rather than overlap what follows.
  useStack(stack, 0, () => {
    if (holder.current && stack.current) holder.current.style.minHeight = `${stack.current.offsetHeight}px`
  })
  const longest = all.reduce((a, b) => (b.a.length > a.a.length ? b : a), all[0])
  // Up and down move between questions, the way an accordion should.
  const nav = (e: KeyboardEvent) => {
    const all = Array.from(stack.current?.querySelectorAll<HTMLButtonElement>('[data-q]') ?? [])
    const i = all.indexOf(e.target as HTMLButtonElement)
    if (i < 0) return
    const to = {
      ArrowDown: i + 1,
      ArrowUp: i - 1,
      Home: 0,
      End: all.length - 1,
    }[e.key]
    if (to === undefined) return
    e.preventDefault()
    all[(to + all.length) % all.length]?.focus()
  }
  return (
    <div ref={holder} className="relative mt-6">
      {/* The tallest the list gets: every question, the longest answer open. It holds the height, so
          filtering and opening never move what comes after; the real list rides on top. */}
      {!multiple && (
        <div aria-hidden inert className="invisible">
          {all.map((x) => (
            <Sizer key={x.id} q={x.q} a={x.id === longest?.id ? x.a : null} />
          ))}
        </div>
      )}
      <div ref={stack} className={`shadow-[inset_0_1px_0_var(--line)] ${multiple ? '' : 'absolute inset-x-0 top-0'}`} onKeyDown={nav}>
        <AnimatePresence initial={false}>
          {items.map((x) => {
            const on = open.includes(x.id)
            const inQuestion = words.every((w) => x.q.toLowerCase().includes(w))
            const line = words.length && !inQuestion ? snippet(x.a, words) : null
            return (
              <motion.div key={x.id} className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: ease.out }}>
                <div className="shadow-[inset_0_-1px_0_var(--line)]">
                  <h3>
                    <button type="button" data-q id={`${id}-q-${x.id}`} aria-expanded={on} aria-controls={`${id}-a-${x.id}`} onClick={() => (tap(), onToggle(x.id))} className="ring-focus group flex w-full items-start gap-4 rounded-[6px] py-5 text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-medium leading-[22px] tracking-[-0.01em] text-ink">{marked(x.q, words)}</span>
                        <AnimatePresence initial={false}>
                          {line && !on && (
                            <motion.span key="line" className="block overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: ease.out }}>
                              <span className="block pt-1 text-footnote leading-[19px] text-ink-3">{marked(line, words)}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                      <motion.span
                        className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] text-ink-2 transition-colors group-hover:bg-[color-mix(in_oklch,var(--ink)_9%,transparent)] group-hover:text-ink"
                        initial={false}
                        animate={{ rotate: on ? 45 : 0 }}
                        transition={spring.snappy}
                      >
                        <Plus size={14} />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        key="a"
                        id={`${id}-a-${x.id}`}
                        role="region"
                        aria-labelledby={`${id}-q-${x.id}`}
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.34, ease: ease.out }}
                      >
                        <div className="pb-5 pr-10">
                          <p className="max-w-[62ch] text-callout leading-[23px] text-ink-2">{marked(x.a, words)}</p>
                          <Helpful value={helped[x.id]} onPick={(v) => onHelped(x.id, v)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
          {!items.length && (
            <motion.div key="none" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: ease.out }}>
              <div className="flex flex-col items-start gap-3 py-8">
                <p className="text-callout text-ink-2">{query ? `Nothing about “${query}” yet. The team can answer it directly.` : 'Nothing in this topic yet.'}</p>
                {query && (
                  <motion.button type="button" whileTap={press} onClick={() => (tap(), onAsk())} className={btn.primary}>
                    Ask the team
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** A row's size, without its behaviour: the same type and spacing as the real one. */
function Sizer({ q, a }: { q: string; a: string | null }) {
  return (
    <div className="shadow-[inset_0_-1px_0_var(--line)]">
      <div className="flex items-start gap-4 py-5">
        <span className="min-w-0 flex-1 text-[15px] font-medium leading-[22px] tracking-[-0.01em]">{q}</span>
        <span className="mt-px size-6 shrink-0" />
      </div>
      {a && (
        <div className="pb-5 pr-10">
          <p className="max-w-[62ch] text-callout leading-[23px]">{a}</p>
          <div className="mt-4 h-7" />
        </div>
      )}
    </div>
  )
}

/** Whether it helped, in one line that becomes a thank-you in the same place. */
function Helpful({ value, onPick }: { value: boolean | undefined; onPick: (v: boolean) => void }) {
  const done = value !== undefined
  return (
    <div className="mt-4 grid h-7 text-footnote">
      <span className={`col-start-1 row-start-1 flex items-center gap-1 transition-opacity duration-200 ${done ? 'pointer-events-none opacity-0' : ''}`}>
        <span className="mr-1.5 text-ink-3">Did this help?</span>
        {[true, false].map((v) => (
          <button key={String(v)} type="button" tabIndex={done ? -1 : 0} onClick={() => (tap(), onPick(v))} className={`${btn.ghost} h-7 px-2`}>
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </span>
      <span className={`pointer-events-none col-start-1 row-start-1 flex items-center text-ink-3 transition-opacity duration-200 ${done ? '' : 'opacity-0'}`}>{value ? 'Glad it did. Thanks for saying.' : 'Thanks. We’ll make this one clearer.'}</span>
    </div>
  )
}
