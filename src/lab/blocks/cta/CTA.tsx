'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, useAnimationFrame, useInView, useMotionValue, useReducedMotion } from 'motion/react'
import { press, dur, ease } from '@/lab/lib/motion'
import { tap } from '@/lab/lib/feel'
import { Count } from '@/lab/ui/Count'
import { DrawnCheck } from '@/lab/ui/Outcome'
import { Orb } from '@/lab/ui/Orb'
import { ProductMark } from '@/lab/ui/DetentMark'
import { Spinner } from '@/lab/ui/Spinner'
import { ArrowRight, Check, Lock, Shield } from '@/lab/blocks/kit/icons'
import { btn } from '@/lab/blocks/kit/primitives'
import { useDirector } from '@/lab/blocks/kit/director'
import { accentVars } from '@/lab/blocks/kit/props'
import type { BlockProps } from '@/lab/blocks/kit/props'

export type Ticket = { from: string; hue: number; text: string; outcome: string; handed?: boolean }

const TICKETS: Ticket[] = [
  { from: 'Dana Ruiz', hue: 20, text: 'Where’s my order #4471?', outcome: 'Answered · 8s' },
  { from: 'Leo Martin', hue: 330, text: 'I was charged twice this month', outcome: 'Refunded' },
  { from: 'Aiko Tanaka', hue: 150, text: 'How do I reset my password?', outcome: 'Answered · 6s' },
  { from: 'Omar Haddad', hue: 45, text: 'Can I add a gift note?', outcome: 'Answered · 11s' },
  { from: 'Grace Liu', hue: 160, text: 'It says delivered, but it isn’t here', outcome: 'With Maya', handed: true },
  { from: 'Noah Kim', hue: 210, text: 'Do you ship to Canada?', outcome: 'Answered · 7s' },
  { from: 'Sam Ito', hue: 90, text: 'The jacket runs small. Can I swap it?', outcome: 'Swap sent' },
  { from: 'Priya Nair', hue: 260, text: 'Is the 20% code still valid?', outcome: 'Answered · 9s' },
  { from: 'Mia Novak', hue: 180, text: 'Cancel my subscription, please', outcome: 'Answered · 12s' },
  { from: 'Ethan Brooks', hue: 240, text: 'Can I change my delivery address?', outcome: 'Updated · 10s' },
]

export type CTAProps = BlockProps & {
  product?: string
  title?: [string, string]
  subline?: string
  placeholder?: string
  action?: string
  note?: string
  tickets?: Ticket[]
  onSubmit?: (email: string) => Promise<void> | void
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function CTA({
  autoplay = true,
  accent,
  product = 'Detent',
  title = ['Give it your queue.', 'Keep your weekends.'],
  subline,
  placeholder = 'you@company.com',
  action = 'Start free',
  note = 'Free for 500 conversations a month. No card needed.',
  tickets = TICKETS,
  onSubmit,
  className = '',
}: CTAProps) {
  const calls = useRef({ onSubmit })
  useLayoutEffect(() => {
    calls.current = { onSubmit }
  })
  const handed = useRef(!autoplay)
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [bad, setBad] = useState(false)
  const [pressed, setPressed] = useState(false)
  const shake = useAnimationControls()

  const submit = async () => {
    if (phase !== 'idle') return
    if (!EMAIL.test(email)) {
      setBad(true)
      shake.start({ x: [0, -6, 5, -3, 2, 0], transition: { duration: 0.38, ease: ease.out } })
      return
    }
    setPhase('sending')
    await Promise.all([handed.current ? calls.current.onSubmit?.(email) : undefined, new Promise((r) => setTimeout(r, 900))])
    setPhase('sent')
  }
  const latest = useRef(submit)
  useLayoutEffect(() => {
    latest.current = submit
  })
  const reset = () => {
    setPhase('idle')
    setEmail('')
    setBad(false)
  }

  const director = useDirector(
    async (wait) => {
      await wait(1800)
      for (const ch of 'dana@fieldwork.co') {
        setEmail((e) => e + ch)
        await wait(55)
      }
      await wait(500)
      setPressed(true)
      await wait(140)
      setPressed(false)
      await latest.current()
      await wait(4200)
      reset()
      await wait(1200)
    },
    autoplay,
    () => (handed.current = true),
  )

  const cell = (on: boolean) => `col-start-1 row-start-1 transition-[opacity,visibility] duration-300 ${on ? '' : 'invisible opacity-0'}`

  return (
    <div className={`pro-app @container h-full w-full overflow-y-auto overflow-x-hidden bg-surface text-ink [scrollbar-width:thin] ${className}`} style={accentVars(accent)} onPointerDownCapture={director.onPointerDownCapture} onPointerUpCapture={director.onPointerUpCapture} onKeyDownCapture={director.onKeyDownCapture}>
      <div className="flex min-h-full items-center">
        <section className="mx-auto w-full max-w-[1180px] px-5 py-12 @3xl:px-8 @3xl:py-16">
          <div className="relative grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[28px] bg-[var(--card)] shadow-[0_0_0_1px_var(--line)] @4xl:grid-cols-[minmax(0,1fr)_400px]">
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 90% at 0% 100%, color-mix(in oklch, var(--accent) 12%, transparent), transparent 70%)' }} />

            <div className="relative flex flex-col justify-center p-7 @3xl:p-12">
              <h2 className="text-[clamp(30px,4.6cqi,52px)] font-normal leading-[1.04] tracking-[-0.045em] text-ink">
                {title[0]}
                <span className="block text-[color-mix(in_oklch,var(--ink)_42%,transparent)]">{title[1]}</span>
              </h2>
              <p className="mt-5 max-w-[460px] text-[15px] leading-[23px] text-ink-2">{subline ?? `${product} answers what it can, asks before it acts, and hands your team the rest. Set it up this afternoon.`}</p>

              <div className="mt-8 grid max-w-[460px] grid-cols-[minmax(0,1fr)]">
                <motion.form
                  noValidate
                  animate={shake}
                  aria-hidden={phase === 'sent'}
                  onSubmit={(e) => {
                    e.preventDefault()
                    tap()
                    submit()
                  }}
                  className={`${cell(phase !== 'sent')} flex h-12 items-center rounded-full bg-surface p-1 pl-5 transition-shadow ${bad ? 'shadow-[var(--elev-raised),0_0_0_3px_color-mix(in_oklch,var(--warn)_30%,transparent)]' : 'shadow-raised focus-within:shadow-[var(--elev-raised),0_0_0_3px_color-mix(in_oklch,var(--accent)_22%,transparent)]'}`}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setBad(false)
                    }}
                    placeholder={placeholder}
                    aria-label="Work email"
                    aria-invalid={bad}
                    autoComplete="email"
                    readOnly={phase !== 'idle'}
                    className="h-full min-w-0 flex-1 bg-transparent text-callout text-ink outline-none placeholder:text-ink-3"
                  />
                  <motion.button type="submit" whileTap={press} animate={{ scale: pressed ? press.scale : 1 }} className="ring-focus h-10 shrink-0 rounded-full bg-ink px-5 text-callout font-medium text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]" transition={{ duration: dur.enter, ease: ease.out }}>
                    <span className="grid place-items-center">
                      <span className={`col-start-1 row-start-1 flex items-center gap-1.5 transition-opacity ${phase === 'sending' ? 'opacity-0' : ''}`}>
                        {action} <ArrowRight size={15} />
                      </span>
                      <span className={`col-start-1 row-start-1 transition-opacity ${phase === 'sending' ? '' : 'opacity-0'}`}>
                        <Spinner size={16} />
                      </span>
                    </span>
                  </motion.button>
                </motion.form>
                <div aria-live="polite" className={`${cell(phase === 'sent')} flex min-h-12 items-center gap-3`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ok)] text-white">{phase === 'sent' && <DrawnCheck size={15} strokeWidth={3} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-callout font-medium text-ink">Check your inbox</span>
                    <span className="block text-footnote text-ink-2 @3xl:truncate">
                      Your sign-in link is on its way to <span className="text-ink">{email}</span>
                    </span>
                  </span>
                  <button type="button" tabIndex={phase === 'sent' ? 0 : -1} onClick={() => (tap(), reset())} className={`${btn.ghost} shrink-0`}>
                    Change
                  </button>
                </div>
              </div>
              <p className="mt-3 min-h-5 text-caption @4xl:h-5 @4xl:px-5">{bad ? <span className="text-[color-mix(in_oklch,var(--warn)_70%,var(--ink))]">That doesn’t look like an email yet.</span> : <span className="text-ink-3">{note}</span>}</p>

              <ul className="mt-8 flex flex-col gap-x-5 gap-y-2.5 text-footnote leading-5 text-ink-3 @md:flex-row @md:flex-wrap [&_svg]:shrink-0">
                <li className="flex items-center gap-1.5">
                  <Shield size={15} /> SOC 2 Type II
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock size={15} /> Never trains on your data
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={15} /> Cancel any time
                </li>
              </ul>
            </div>

            <Queue tickets={tickets} product={product} />
          </div>
        </section>
      </div>
    </div>
  )
}

const ROW = 48
const AREA = 336
const LINE = 176
const SPEED = 26

function Queue({ tickets, product }: { tickets: Ticket[]; product: string }) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const seen = useInView(box)
  const y = useMotionValue(0)
  const dist = useRef(0)
  const loop = tickets.length * ROW
  const over = (d: number) => Math.floor((LINE + d - 20) / ROW)
  const last = useRef(over(0))
  const [count, setCount] = useState(1284)
  useAnimationFrame((_, delta) => {
    if (reduce || !seen) return
    dist.current += (Math.min(delta, 64) * SPEED) / 1000
    y.set(-(dist.current % loop))
    const c = over(dist.current)
    if (c !== last.current) {
      setCount((n) => n + c - last.current)
      last.current = c
    }
  })
  const list = [...tickets, ...tickets]
  const fade = 'color-mix(in oklch, var(--ink) 2.5%, var(--card))'
  return (
    <div className="relative flex flex-col shadow-[inset_0_1px_0_var(--line)] @4xl:shadow-[inset_1px_0_0_var(--line)]" style={{ background: fade }}>
      <div className="flex h-12 items-center justify-between px-5 text-footnote">
        <span className="text-ink-3">
          Resolved today
          <span className="tnum ml-1.5 font-medium text-ink">
            <Count value={count} format={(n) => Math.round(n).toLocaleString('en-US')} duration={0.4} />
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-caption text-ink-3">
          <span className="size-1.5 rounded-full bg-[var(--ok)] motion-safe:animate-pulse" /> Live
        </span>
      </div>
      <div ref={box} aria-hidden className="relative my-auto overflow-hidden" style={{ height: AREA }}>
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: LINE }}>
          <motion.ul className="absolute inset-x-0 top-0 pl-12 pr-5" style={{ y }}>
            {list.map((t, i) => (
              <Chip key={i} t={t} done />
            ))}
          </motion.ul>
        </div>
        <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ top: LINE }}>
          <motion.ul className="absolute inset-x-0 pl-12 pr-5" style={{ top: -LINE, y }}>
            {list.map((t, i) => (
              <Chip key={i} t={t} />
            ))}
          </motion.ul>
        </div>
        <div className="pointer-events-none absolute inset-x-0" style={{ top: LINE }}>
          <span className="absolute left-5 right-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, var(--accent), color-mix(in oklch, var(--accent) 15%, transparent))' }} />
          <span className="absolute left-[14px] top-0 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_var(--card),0_0_14px_color-mix(in_oklch,var(--accent)_45%,transparent)]">
            <ProductMark name={product} size={18} round />
          </span>
        </div>
        <span className="pointer-events-none absolute inset-x-0 top-0 h-16" style={{ background: `linear-gradient(${fade}, transparent)` }} />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(transparent, ${fade})` }} />
      </div>
    </div>
  )
}

function Chip({ t, done = false }: { t: Ticket; done?: boolean }) {
  return (
    <li className="mb-2 flex h-10 items-center gap-2.5 rounded-[12px] bg-surface pl-2.5 pr-3 shadow-raised">
      <Orb seed={t.from} hue={t.hue} size={20} className={done ? 'opacity-55' : ''} />
      <span className={`min-w-0 flex-1 truncate text-footnote ${done ? 'text-ink-3' : 'text-ink'}`}>{t.text}</span>
      {done ? (
        <span className={`flex shrink-0 items-center gap-1 text-caption font-medium ${t.handed ? 'text-ink-2' : 'text-[color-mix(in_oklch,var(--ok)_76%,var(--ink))]'}`}>
          {t.handed ? <Orb seed="Maya Chen" hue={150} size={12} /> : <Check size={13} strokeWidth={2.4} />}
          {t.outcome}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 text-caption text-ink-3">
          <span className="size-1.5 rounded-full bg-[var(--warn)]" /> Waiting
        </span>
      )}
    </li>
  )
}
