'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BLOCKS } from '@/catalog/blocks'
import { PRO_DAYS, TOTAL_DAYS } from '@/catalog/effort'
import { PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS } from '@/catalog/pro'
import type { Plan } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { ArrowRight, ArrowUpRight, Check, Code, Refresh, Undo } from '@/lab/icons'
import { RollingText } from '@/lab/ui/RollingText'
import { BLOCK_VIEWS, TEMPLATE_VIEWS } from '@pro'
import { Backdrop, Window } from '../blocks/Studio'
import { Fit } from '../Fit'

/*
 * Buying Pro the way a good shop sells one thing in a few configurations: the thing itself
 * running big on the left, two plain questions on the right, and the price that answers them.
 * Everything on the page that names a price reads the same choice, so the headline, the summary
 * and the button at the foot always agree.
 */

const UI = [0.2, 0, 0, 1] as const

type Edition = 'pro' | 'all'
type Seats = 'one' | 'team'
type Choice = { edition: Edition; seats: Seats; setEdition: (e: Edition) => void; setSeats: (s: Seats) => void }

const Ctx = createContext<Choice | null>(null)

export function BuyProvider({ children }: { children: ReactNode }) {
  const [edition, setEdition] = useState<Edition>('pro')
  const [seats, setSeats] = useState<Seats>('one')
  return <Ctx.Provider value={{ edition, seats, setEdition, setSeats }}>{children}</Ctx.Provider>
}

const plan = (id: Plan['id']) => PLANS.find((p) => p.id === id)!

export function useChoice() {
  const c = useContext(Ctx)
  if (!c) throw new Error('The parts of the buy panel sit inside BuyProvider')
  // A team licence always comes with the templates; the solo choice is kept for if they switch back.
  const edition: Edition = c.seats === 'team' ? 'all' : c.edition
  const chosen = c.seats === 'team' ? plan('team') : plan(edition)
  return { ...c, edition, plan: chosen, days: edition === 'all' ? TOTAL_DAYS : PRO_DAYS }
}

/** The headline: what the chosen plan would take to build, and what it costs. Both roll as the choice changes. */
export function BuyHead() {
  const { plan, days } = useChoice()
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <h1 className="focus-in text-[clamp(40px,4.4vw,62px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
        <span className="sr-only">
          {days} days of work. Yours for ${plan.price}.
        </span>
        {/* The count is digits only, so it's centred on the line; the price starts with $, which gives it a true baseline. */}
        <span aria-hidden className="flex flex-wrap items-center">
          <RollingText text={String(days)} proportional />
          <span>&nbsp;days of work.</span>
        </span>
        <span aria-hidden className="block text-quiet">
          Yours for <RollingText text={`$${plan.price}`} proportional />.
        </span>
      </h1>
      <div className="rise flex flex-wrap gap-2 lg:pb-2" style={{ animationDelay: '160ms' }}>
        <Link href="/refunds" className={PILL}>
          <Undo size={13} />
          {REFUND_DAYS}-day refund, no questions
        </Link>
        <Link href="#questions" className={PILL}>
          Questions
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

const PILL = 'ring-focus inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-colors duration-150 hover:bg-surface-2 hover:text-ink'

/*
 * The stage: what you'd be buying, running. Pro shows three of its whole screens in turn; with
 * the templates it shows three of the apps instead. Each is laid out at a desktop size and scaled
 * to the stage, so it reads like the real thing rather than a phone-width squeeze.
 */

type Shot = { id: string; name: string; line: string; count: string; href: string; title: string; chrome: 'browser' | 'titled'; view: ComponentType }

const BLOCK_SHOTS: Shot[] = ['support-inbox', 'task-to-merge', 'evals'].flatMap((id) => {
  const b = BLOCKS.find((x) => x.id === id)
  const View = BLOCK_VIEWS[id]
  if (!b || !View) return []
  return [{ id, name: b.name, line: b.short, count: `One of ${PRO_BLOCK_COUNT} blocks`, href: `/blocks/${id}`, title: b.window, chrome: b.chrome === 'browser' ? 'browser' : 'titled', view: () => <View autoplay /> }]
})
const TEMPLATE_SHOTS: Shot[] = ['rapport', 'tandem', 'detent'].flatMap((id) => {
  const t = TEMPLATES.find((x) => x.id === id)
  const View = TEMPLATE_VIEWS[id]
  if (!t || !View) return []
  return [{ id, name: t.name, line: t.kind, count: `One of ${TEMPLATES.length} apps`, href: `/templates/${id}`, title: t.window, chrome: 'browser', view: View }]
})

/** How long each screen stays on the stage before the next. */
const DWELL = 9000

export function Stage() {
  const { edition } = useChoice()
  const all = edition === 'all'
  return (
    <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <Shots key={edition} shots={all ? TEMPLATE_SHOTS : BLOCK_SHOTS} tone={all ? 'amber' : 'violet'} />
    </div>
  )
}

/** The stage drawn wide under the hero: the screen runs bigger and the box's foot crops it, like a window seen through it. */
export function WideStage() {
  const { edition } = useChoice()
  const all = edition === 'all'
  return <Shots key={edition} shots={all ? TEMPLATE_SHOTS : BLOCK_SHOTS} tone={all ? 'amber' : 'violet'} wide />
}

function Shots({ shots, tone, wide = false }: { shots: Shot[]; tone: 'amber' | 'violet'; wide?: boolean }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (held || reduce || shots.length < 2) return
    const t = window.setTimeout(() => setN((k) => (k + 1) % shots.length), DWELL)
    return () => clearTimeout(t)
  }, [n, held, reduce, shots.length])
  const s = shots[n]
  if (!s) return null
  const View = s.view

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.35, ease: UI } }} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}>
      {/* Shaped like the screen it holds on a phone, so the screen fills it; as tall as the panel beside it on a laptop. */}
      <div className={`relative isolate overflow-hidden ${wide ? 'aspect-[4/3] rounded-[24px] sm:aspect-auto sm:h-[clamp(380px,62vh,660px)] sm:rounded-[36px]' : 'aspect-[4/3] rounded-[22px] sm:aspect-[16/10] sm:rounded-[28px] lg:aspect-auto lg:h-[clamp(300px,58vh,620px)]'}`}>
        <Backdrop tone={tone} />
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={s.id}
            inert
            className={wide ? 'absolute inset-x-0 top-0 h-full sm:h-[calc(100%+120px)]' : 'absolute inset-0'}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: UI } }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: UI } }}
          >
            <Fit pad={wide ? 44 : 20} max={wide ? 1.12 : 1} min={0.2}>
              <div style={{ width: 1000, height: 660 }}>
                <Window title={s.title} chrome={s.chrome}>
                  <div className="h-full overflow-hidden">
                    <View />
                  </div>
                </Window>
              </div>
            </Fit>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* What's on the stage, how many more like it, and the way to it. */}
      <div className="mt-3 flex h-9 items-center gap-3 px-1">
        <p className="min-w-0 flex-1 truncate text-[14px] text-ink">
          {s.name}
          <span className="text-quiet"> — {s.line}</span>
        </p>
        <span className="hidden shrink-0 text-[13px] text-ink-3 sm:inline">{s.count}</span>
        <span className="flex shrink-0">
          {shots.map((x, k) => (
            <button key={x.id} type="button" aria-label={`Show ${x.name}`} aria-pressed={k === n} onClick={() => setN(k)} className="ring-focus grid h-7 w-6 place-items-center rounded-full">
              <span className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${k === n ? 'w-4 bg-ink' : 'w-1.5 bg-[var(--line-strong)]'}`} />
            </button>
          ))}
        </span>
        <Link href={s.href} className="ring-focus group/open flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:text-ink">
          Open
          <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
        </Link>
      </div>
    </motion.div>
  )
}

/** The two questions, each answered with a tile, and the summary that adds them up. */
export function Choose() {
  const { edition, seats, setEdition, setSeats } = useChoice()
  const team = seats === 'team'
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Question title="Edition." quiet="What you’re building.">
        <Tile name="edition" on={edition === 'pro'} disabled={team} onPick={() => setEdition('pro')} title="Pro" price={`$${plan('pro').price}`} line={`${PRO_COMPONENTS.length} Pro components and ${PRO_BLOCK_COUNT} whole screens, already working.`} note={team ? 'A team licence comes with the templates.' : undefined} />
        <Tile name="edition" on={edition === 'all'} onPick={() => setEdition('all')} title="Pro + Templates" price={`$${plan('all').price}`} line={`Everything in Pro, plus ${TEMPLATES.length} apps with the AI built in.`} />
      </Question>
      {/* Two short answers side by side; the line under them says what the chosen one means. */}
      <Question title="Licence." quiet="Who’s building it." row note={team ? 'Up to five people, a key each, and one more for CI.' : 'One person, in as many projects as you like.'}>
        <Tile name="seats" short on={!team} onPick={() => setSeats('one')} title="Just me" price="Included" />
        <Tile name="seats" short on={team} onPick={() => setSeats('team')} title="My team" price={`$${plan('team').price}`} />
      </Question>
      <Summary />
    </div>
  )
}

function Question({ title, quiet, row = false, note, children }: { title: string; quiet: string; row?: boolean; note?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-[20px] leading-7 tracking-[-0.025em] text-ink">
        {title} <span className="text-quiet">{quiet}</span>
      </legend>
      <div className={`mt-3 gap-2 ${row ? 'grid grid-cols-2' : 'flex flex-col'}`}>{children}</div>
      {note && <p className="mt-2.5 px-1 text-[13px] text-ink-3">{note}</p>}
    </fieldset>
  )
}

/** One answer: a real radio under the tile, so arrows move between answers and the tile shows the focus. */
/** A `short` tile sits half-width beside another, so on a phone its price goes under the name. */
function Tile({ name, on, disabled = false, short = false, onPick, title, price, line, note }: { name: string; on: boolean; disabled?: boolean; short?: boolean; onPick: () => void; title: string; price: string; line?: string; note?: string }) {
  return (
    <label
      className={`relative flex rounded-[18px] px-5 py-3.5 ${short ? 'flex-col gap-0.5 max-sm:px-4 sm:flex-row sm:items-start sm:gap-4' : 'items-start gap-4'} transition-[box-shadow,opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
        disabled ? 'cursor-not-allowed opacity-50 shadow-[inset_0_0_0_1px_var(--line)]' : on ? 'cursor-pointer shadow-[inset_0_0_0_2px_var(--ink)]' : 'cursor-pointer shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink-3)] active:scale-[0.99]'
      }`}
    >
      <input type="radio" name={name} checked={on} disabled={disabled} onChange={onPick} className="sr-only" />
      <span className="min-w-0 flex-1">
        <span className="block whitespace-nowrap text-[16px] leading-6 tracking-[-0.01em] text-ink">{title}</span>
        {line && <span className="mt-0.5 block text-[13.5px] leading-[1.5] text-ink-3">{line}</span>}
        {note && <span className="mt-2 block text-[12.5px] text-ink-2">{note}</span>}
      </span>
      <span className="tnum shrink-0 text-[15px] leading-6 text-ink">{price}</span>
    </label>
  )
}

const PROMISES = [
  [<Check key="c" size={14} />, 'One payment, no subscription'],
  [<Refresh key="r" size={14} />, 'Every update, for life'],
  [<Undo key="u" size={14} />, `${REFUND_DAYS}-day refund, no questions`],
  [<Code key="o" size={14} />, 'The source is yours to change'],
] as const

function Summary() {
  const { plan, days } = useChoice()
  return (
    <div className="rounded-[22px] bg-surface-2 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-3">Your licence</p>
          <p className="mt-1 truncate text-[16px] tracking-[-0.01em] text-ink">
            {plan.name}
            <span className="text-quiet">, for {plan.seats}</span>
          </p>
        </div>
        <p className="flex shrink-0 items-baseline gap-1.5">
          <span className="tnum text-[40px] leading-none tracking-[-0.045em] text-ink">
            <RollingText text={`$${plan.price}`} proportional />
          </span>
          <span className="text-[14px] text-ink-3">once</span>
        </p>
      </div>
      <a href={plan.href} className="ring-focus group/buy mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.98]">
        {plan.cta}
        <ArrowRight size={15} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
      </a>
      <ul className="mt-5 grid gap-2.5 text-[13px] text-ink-2">
        {PROMISES.map(([icon, text]) => (
          <li key={text} className="flex items-center gap-2">
            <span className="text-ink-3">{icon}</span>
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-5 pt-4 text-[12.5px] leading-[1.5] text-ink-3 shadow-[inset_0_1px_0_var(--line)]">
        Built yourself, about <span className="tnum text-ink-2">{days}</span> working days. Our estimate, piece by piece, is below.
      </p>
    </div>
  )
}

/** The way in at the foot of the page: the button is the price, for whatever was chosen above. */
export function BigBuy() {
  const { plan } = useChoice()
  return (
    <a
      href={plan.href}
      className="ring-focus group/big flex h-20 w-full max-w-[720px] items-center gap-4 rounded-full bg-ink pl-7 pr-2.5 text-surface transition-transform duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.985] sm:h-24 sm:pl-10 sm:pr-3"
    >
      <span className="min-w-0 flex-1 truncate text-left text-[clamp(20px,2.6vw,30px)] tracking-[-0.03em]">{plan.cta}</span>
      <span className="tnum shrink-0 text-[clamp(20px,2.6vw,30px)] tracking-[-0.03em]">
        <RollingText text={`$${plan.price}`} proportional />
      </span>
      <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-surface text-ink transition-transform duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover/big:translate-x-1 sm:size-[72px]">
        <ArrowRight size={24} />
      </span>
    </a>
  )
}

/*
 * The hero, centred: what Pro saves you and what it costs, both rolling with the choice; under it
 * one bar that is the whole checkout (edition, licence, price, button), so the page asks two small
 * questions in one line instead of a column of form.
 */
export function HeroHead() {
  const { plan, days } = useChoice()
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="focus-in text-[clamp(40px,5vw,72px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
        <span className="sr-only">
          Skip {days} days of work. Pay ${plan.price}, once.
        </span>
        <span aria-hidden className="flex flex-wrap items-center justify-center">
          Skip&nbsp;
          <RollingText text={String(days)} proportional />
          &nbsp;days of work.
        </span>
        <span aria-hidden className="block text-quiet">
          Pay <RollingText text={`$${plan.price}`} proportional />, once.
        </span>
      </h1>
      <p className="rise mt-6 max-w-[520px] text-balance text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
        The hard parts of an app, finished: every state, both themes, every width. Installed as source you own.
      </p>
    </div>
  )
}

export function BuyBar() {
  const { edition, seats, setEdition, setSeats, plan } = useChoice()
  const team = seats === 'team'
  const what = edition === 'all' ? `${PRO_COMPONENTS.length} Pro components, ${PRO_BLOCK_COUNT} screens and ${TEMPLATES.length} apps` : `${PRO_COMPONENTS.length} Pro components and ${PRO_BLOCK_COUNT} whole screens`
  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-[820px] flex-col gap-3 rounded-[26px] bg-surface p-2 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:rounded-full sm:gap-2">
        <Seg
          label="Edition"
          value={edition}
          onPick={(v) => setEdition(v as Edition)}
          options={[
            ['pro', 'Pro', team],
            ['all', 'Pro + Templates', false],
          ]}
        />
        <Seg
          label="Licence"
          value={seats}
          onPick={(v) => setSeats(v as Seats)}
          options={[
            ['one', 'Just me', false],
            ['team', 'Team', false],
          ]}
        />
        <div className="flex items-center gap-3 px-2 pb-1 sm:ml-auto sm:p-0">
          <p className="flex flex-1 items-baseline gap-1 sm:flex-none">
            <span className="tnum text-[24px] leading-none tracking-[-0.04em] text-ink">
              <RollingText text={`$${plan.price}`} proportional />
            </span>
            <span className="text-[13px] text-ink-3">once</span>
          </p>
          <a href={plan.href} className="ring-focus group/buy flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink pl-5 pr-4 text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97]">
            {plan.cta}
            <ArrowRight size={15} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
          </a>
        </div>
      </div>
      {/* What the choice gets you, then the promises, in one quiet line. */}
      <p className="mt-4 max-w-[920px] text-balance px-4 text-center text-[13px] leading-[1.7] text-ink-3">
        <span className="text-ink-2">
          {what}, for {plan.seats}.
        </span>{' '}
        One payment · Every update for life · {REFUND_DAYS}-day refund · The source is yours
      </p>
    </div>
  )
}

/** Two answers in a track; the chosen one sits on a plate that slides between them. */
function Seg({ label, value, onPick, options }: { label: string; value: string; onPick: (v: string) => void; options: [string, string, boolean][] }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 rounded-full bg-surface-2 p-1 sm:flex">
      {options.map(([v, name, disabled]) => {
        const on = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onPick(v)}
            className={`ring-focus relative h-9 whitespace-nowrap rounded-full px-4 text-[14px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'text-ink' : 'text-ink-3 enabled:hover:text-ink'}`}
          >
            {on && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-full bg-surface shadow-[var(--card-edge)]" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
            <span className="relative">{name}</span>
          </button>
        )
      })}
    </div>
  )
}
