'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BLOCKS } from '@/catalog/blocks'
import { PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS } from '@/catalog/pro'
import type { Plan } from '@/catalog/pro'
import { TEMPLATES, TEMPLATE_COUNT } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { priceWith, usePromo } from '../Promo'
import { ArrowRight, ArrowUpRight, Check, Code, Refresh, Undo } from '@/lab/icons'
import { RollingText } from '@/lab/ui/RollingText'
import { BLOCK_VIEWS, TEMPLATE_VIEWS } from '@pro'
import { Backdrop, Window } from '../blocks/Studio'
import { useOwned } from '../Owned'
import { BTN, useSideNew } from '../shell/side'
import { DitherIcon } from '../Dither'
import { Fit } from '../Fit'

const UI = [0.2, 0, 0, 1] as const

type Edition = 'pro' | 'all'
type Choice = { edition: Edition; setEdition: (e: Edition) => void }

const Ctx = createContext<Choice | null>(null)

export function BuyProvider({ children }: { children: ReactNode }) {
  const [edition, setEdition] = useState<Edition>('pro')
  return <Ctx.Provider value={{ edition, setEdition }}>{children}</Ctx.Provider>
}

const plan = (id: Plan['id']) => PLANS.find((p) => p.id === id)!

export function useChoice() {
  const c = useContext(Ctx)
  if (!c) throw new Error('The parts of the buy panel sit inside BuyProvider')
  const owned = useOwned()
  const buyable = owned !== 'all' && owned !== 'pro'
  return { ...c, edition: 'pro' as Edition, plan: plan('pro'), buyable, upgrade: false }
}

type Shot = { id: string; name: string; line: string; count: string; href: string; title: string; chrome: 'browser' | 'titled'; view: ComponentType }

const BLOCK_SHOTS: Shot[] = ['support-inbox', 'task-to-merge', 'evals'].flatMap((id) => {
  const b = BLOCKS.find((x) => x.id === id)
  const View = BLOCK_VIEWS[id]
  if (!b || !View) return []
  return [{ id, name: b.name, line: b.short, count: `One of ${PRO_BLOCK_COUNT} blocks`, href: `/blocks/${id}`, title: b.window, chrome: b.chrome === 'browser' ? 'browser' : 'titled', view: () => <View autoplay /> }]
})
const TEMPLATE_SHOTS: Shot[] = ['detent'].flatMap((id) => {
  const t = TEMPLATES.find((x) => x.id === id)
  const View = TEMPLATE_VIEWS[id]
  if (!t || !View) return []
  return [{ id, name: t.name, line: t.kind, count: 'The whole app', href: `/templates/${id}`, title: t.window, chrome: 'browser', view: View }]
})

const SHOTS = [...BLOCK_SHOTS, ...TEMPLATE_SHOTS]

const DWELL = 9000

export function Stage() {
  return (
    <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <Shots shots={SHOTS} tone="violet" />
    </div>
  )
}

export function WideStage() {
  return <Shots shots={SHOTS} tone="violet" wide />
}

function Shots({ shots, tone, wide = false }: { shots: Shot[]; tone: 'amber' | 'violet'; wide?: boolean }) {
  const side = useSideNew()
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
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.28, ease: UI } }} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}>
      <div className={`relative isolate overflow-hidden ${wide ? 'aspect-[4/5] rounded-[24px] sm:aspect-auto sm:h-[clamp(380px,62vh,660px)] sm:rounded-[36px]' : 'aspect-[4/5] rounded-[22px] sm:aspect-[16/10] sm:rounded-[28px] lg:aspect-auto lg:h-[clamp(300px,58vh,620px)]'}`}>
        <Backdrop tone={tone} />
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={s.id}
            inert
            className={wide ? 'absolute inset-x-0 top-0 h-full sm:h-[calc(100%+120px)]' : 'absolute inset-0'}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: UI } }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: UI } }}
          >
            <Fit pad={wide ? 44 : 20} max={wide ? 1.12 : 1} min={0.2}>
              <div className="h-[calc(125vw-66px)] w-[calc(100vw-56px)] sm:h-[660px] sm:w-[1000px]">
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

      <div className="mt-3 flex h-9 items-center gap-3 px-1">
        <p className="min-w-0 flex-1 truncate text-[14px] text-ink">
          {s.name}
        </p>
        <span className="hidden shrink-0 text-[13px] text-ink-3 sm:inline">{s.count}</span>
        <span className="flex shrink-0">
          {shots.map((x, k) => (
            <button key={x.id} type="button" aria-label={`Show ${x.name}`} aria-pressed={k === n} onClick={() => setN(k)} className="ring-focus grid h-7 w-6 place-items-center rounded-full transition-transform duration-150 active:scale-[0.9]">
              <span className={`h-1.5 w-4 origin-center rounded-full transition-[transform,background-color] duration-200 ${k === n ? 'bg-ink' : 'scale-x-[0.375] bg-[var(--line-strong)]'}`} />
            </button>
          ))}
        </span>
        <Link href={s.href} className={side ? `ring-focus group/open flex h-8 shrink-0 items-center gap-1 rounded-[9px] px-3 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]` : "ring-focus group/open flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]"}>
          Open
          <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
        </Link>
      </div>
    </motion.div>
  )
}

export function Choose() {
  const { edition, setEdition } = useChoice()
  const owned = useOwned()
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Question title="Pro." quiet="Everything in Detent.">
        <Tile name="edition" on={edition === 'pro'} onPick={() => setEdition('pro')} title="Pro" price={owned ? 'Yours' : `$${plan('pro').price}`} line={`${PRO_COMPONENTS.length} Pro components, ${PRO_BLOCK_COUNT} whole screens and ${TEMPLATE_COUNT}, already working.`} />
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
  const side = useSideNew()
  const { plan, buyable } = useChoice()
  const promo = usePromo()
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
          {promo && <s className="tnum text-[18px] leading-none text-ink-3">${plan.price}</s>}
          <span className="tnum text-[40px] leading-none tracking-[-0.045em] text-ink">
            <RollingText text={`$${priceWith(promo, plan.price)}`} proportional />
          </span>
          <span className="text-[14px] text-ink-3">once</span>
        </p>
      </div>
      {buyable && <a href={plan.href} className={side ? `ring-focus group/buy mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] ${BTN.accent} text-[15px] font-medium transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.98]` : "ring-focus group/buy mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.98]"}>
        {plan.cta}
        <ArrowRight size={15} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
      </a>}
      <ul className="mt-5 grid gap-2.5 text-[13px] text-ink-2">
        {PROMISES.map(([icon, text]) => (
          <li key={text} className="flex items-center gap-2">
            <span className="text-ink-3">{icon}</span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BigBuy() {
  const side = useSideNew()
  const { plan, buyable } = useChoice()
  const [hot, setHot] = useState(false)
  if (!buyable) return null
  return (
    <a
      href={plan.href}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      className={side ? `ring-focus group/big flex h-20 w-full max-w-[720px] items-center gap-4 rounded-[18px] ${BTN.accent} pl-7 pr-2.5 transition-transform duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.985] sm:h-24 sm:pl-10 sm:pr-3` : "ring-focus group/big flex h-20 w-full max-w-[720px] items-center gap-4 rounded-full bg-ink pl-7 pr-2.5 text-surface transition-transform duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.985] sm:h-24 sm:pl-10 sm:pr-3"}
    >
      <span className="min-w-0 flex-1 truncate text-left text-[clamp(20px,2.6vw,30px)] tracking-[-0.03em]">{plan.cta}</span>
      <span className="tnum shrink-0 text-[clamp(20px,2.6vw,30px)] tracking-[-0.03em]">
        <RollingText text={`$${plan.price}`} proportional />
      </span>
      <span className={side ? `grid size-[60px] shrink-0 place-items-center rounded-[12px] bg-surface text-ink transition-transform duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] sm:size-[72px]` : "grid size-[60px] shrink-0 place-items-center rounded-full bg-surface text-ink transition-transform duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] sm:size-[72px]"}>
        <DitherIcon color={hot ? 'var(--accent)' : 'var(--ink)'} size={24}>
          <ArrowRight size={24} />
        </DitherIcon>
      </span>
    </a>
  )
}

export function HeroHead() {
  const { plan } = useChoice()
  const promo = usePromo()
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="focus-in text-[clamp(40px,5vw,72px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
        <span className="sr-only">Make your app feel expensive. Pay ${priceWith(promo, plan.price)}, once.</span>
        <span aria-hidden className="block">
          Make your app feel expensive.
        </span>
        <span aria-hidden className="block text-quiet">
          Pay {promo && <s className="decoration-[0.06em]">${plan.price}</s>} <RollingText text={`$${priceWith(promo, plan.price)}`} proportional />, once.
        </span>
      </h1>
      <p className="rise mt-6 max-w-[520px] text-balance text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
        Every Pro component and screen, as code in your own project. Pay once, change anything, keep it.
      </p>
    </div>
  )
}

export function BuyBar() {
  const side = useSideNew()
  const { plan, buyable } = useChoice()
  const promo = usePromo()
  const what = `${PRO_COMPONENTS.length} Pro components, ${PRO_BLOCK_COUNT} screens and ${TEMPLATE_COUNT}`
  return (
    <div className="flex w-full flex-col items-center">
      <div className={side ? `flex w-full max-w-[600px] flex-col gap-3 rounded-[26px] bg-surface p-2 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:rounded-[18px] sm:gap-2` : "flex w-full max-w-[600px] flex-col gap-3 rounded-[26px] bg-surface p-2 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:rounded-full sm:gap-2"}>
        <p className="px-4 pt-1 text-[15px] tracking-[-0.01em] text-ink sm:pt-0">Detent Pro</p>
        <div className="flex items-center gap-3 px-2 pb-1 sm:ml-auto sm:p-0">
          <p className="flex flex-1 items-baseline gap-1 sm:flex-none">
            {promo && <s className="tnum text-[14px] leading-none text-ink-3">${plan.price}</s>}
            <span className="tnum text-[24px] leading-none tracking-[-0.04em] text-ink">
              <RollingText text={`$${priceWith(promo, plan.price)}`} proportional />
            </span>
            <span className="text-[13px] text-ink-3">once</span>
          </p>
          {buyable && <a href={plan.href} className={side ? `ring-focus group/buy flex h-11 shrink-0 items-center gap-2 rounded-[11px] ${BTN.accent} pl-5 pr-4 text-[15px] font-medium transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.97]` : "ring-focus group/buy flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink pl-5 pr-4 text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97]"}>
            {plan.cta}
            <ArrowRight size={15} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
          </a>}
        </div>
      </div>
      <p className="mt-4 max-w-[920px] text-balance px-4 text-center text-[13px] leading-[1.7] text-ink-3">
        <span className="text-ink-2">
          {what}, for {plan.seats}. {promo ? `$${promo.price} until ${promo.until}, no code needed. ` : ''}Launch price: it goes up as the library grows.
        </span>{' '}
        One payment · Every update for life · {REFUND_DAYS}-day refund · The source is yours
      </p>
    </div>
  )
}

