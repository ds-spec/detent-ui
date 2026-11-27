'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { PRO_BLOCKS } from '@/catalog/effort'
import { ENTRIES } from '@/catalog/meta'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@/lab/icons'
import { InPlay } from '@/lab/blocks/kit/director'
import { Piece } from '@/site/home/long/Home'
import { Tabs } from '@/site/home/long/parts'
import { BlockPiece, TemplatePiece } from '@/site/library/Library'
import { BuyTerms, priceWith, usePromo } from '@/site/Promo'
import { useChoice } from '@/site/pro/Buy'

type Item = { id: string; name: string; line: string; href: string; piece: () => ReactNode }

const SCREEN_FIRST = ['task-to-merge', 'evals', 'data-table', 'onboarding', 'settings', 'agent-chat', 'voice-mode', 'support-inbox', 'code-review', 'calendar']
const rank = (id: string) => (SCREEN_FIRST.includes(id) ? SCREEN_FIRST.indexOf(id) : SCREEN_FIRST.length)
const SCREENS = [...PRO_BLOCKS].sort((a, b) => rank(a.id) - rank(b.id))
const APP_FIRST = [...TEMPLATES].sort((a, b) => Number(b.form === 'app') - Number(a.form === 'app'))

const SHELVES = {
  templates: {
    label: 'Templates',
    items: (): Item[] => APP_FIRST.map((t) => ({ id: t.id, name: t.name, line: t.pitch, href: `/templates/${t.id}`, piece: () => <TemplatePiece id={t.id} /> })),
  },
  screens: {
    label: 'Screens',
    items: (): Item[] => SCREENS.map((b) => ({ id: b.id, name: b.name, line: b.line, href: `/blocks/${b.id}`, piece: () => <BlockPiece id={b.id} /> })),
  },
  components: {
    label: 'Components',
    items: (): Item[] =>
      PRO_COMPONENTS.map((id) => ENTRIES.find((e) => e.id === id))
        .filter((e) => !!e)
        .map((e) => ({ id: e.id, name: e.name, line: e.short ?? e.line, href: `/components/${e.id}`, piece: () => <Piece id={e.id} max={1} /> })),
  },
} as const
type Shelf = keyof typeof SHELVES

const DWELL = 9000

/** Every Pro piece on one lit stage, playing through on its own like a keynote, with a chapter rail to jump. */
export function Gallery() {
  const reduce = useReducedMotion()
  const [tab, setTab] = useState<Shelf>('templates')
  const items = SHELVES[tab].items()
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [seen, setSeen] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLOListElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const it = items[Math.min(index, items.length - 1)]
  const playing = !reduce && seen && !held && items.length > 1

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const bar = fill.current
    if (!playing) {
      if (bar) bar.style.transform = held ? bar.style.transform : 'scaleX(0)'
      return
    }
    let start = performance.now()
    let raf = 0
    const go = (now: number) => {
      if (document.hidden) start += 16
      const t = Math.min(1, (now - start) / DWELL)
      if (fill.current) fill.current.style.transform = `scaleX(${t})`
      if (t >= 1) setIndex((i) => (i + 1) % items.length)
      else raf = requestAnimationFrame(go)
    }
    raf = requestAnimationFrame(go)
    return () => cancelAnimationFrame(raf)
  }, [playing, index, tab, items.length, held])

  useEffect(() => {
    const r = rail.current
    const on = r?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!r || !on) return
    const left = on.offsetLeft - r.clientWidth / 2 + on.clientWidth / 2
    r.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' })
  }, [index, tab, reduce])

  const pickTab = (v: Shelf) => {
    setTab(v)
    setIndex(0)
  }
  const step = (d: number) => setIndex((i) => (i + d + items.length) % items.length)

  return (
    <div>
      <Tabs
        label="Everything in Pro"
        value={tab}
        onChange={(v) => pickTab(v as Shelf)}
        items={(Object.keys(SHELVES) as Shelf[]).map((k) => ({ id: k, label: `${SHELVES[k].label} ${SHELVES[k].items().length}` }))}
      />

      <div
        ref={stage}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocusCapture={() => setHeld(true)}
        onBlurCapture={() => setHeld(false)}
        className="relative mt-8 overflow-hidden rounded-[26px] bg-[#f1f1f2] shadow-[var(--card-edge),0_40px_80px_-48px_rgb(0_0_0/0.5)] sm:rounded-[34px] dark:bg-[#0a0a0b]"
      >

        <div className="relative flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
          <p className="flex min-w-0 items-center gap-2 rounded-full bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] py-1 pl-1 pr-3 text-[12.5px] text-ink-2 shadow-[0_0_0_1px_var(--line)] backdrop-blur-md">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-medium tabular-nums text-surface">{String(index + 1).padStart(2, '0')}</span>
            <span className="tabular-nums text-ink-3">of {items.length}</span>
            <span aria-hidden className="text-[var(--quiet)]">·</span>
            <span className="truncate">{SHELVES[tab].label}</span>
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                aria-label={d < 0 ? 'Previous' : 'Next'}
                onClick={() => step(d)}
                className="ring-focus grid size-9 place-items-center rounded-full bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] text-ink-2 shadow-[0_0_0_1px_var(--line)] backdrop-blur-md transition-[color,transform] duration-150 hover:text-ink active:scale-95"
              >
                {d < 0 ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-2 mt-3 aspect-[5/4] overflow-hidden rounded-[18px] sm:mx-4 sm:aspect-[16/10] lg:mx-auto lg:aspect-auto lg:h-[700px] lg:w-[min(1100px,calc(100%-32px))] lg:rounded-[24px]">
          <AnimatePresence initial={false} mode="popLayout">
            {it && (
              <motion.div
                key={`${tab}-${it.id}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.01, filter: 'blur(6px)' }}
                transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute inset-0"
              >
                <InPlay.Provider value={true}>{it.piece()}</InPlay.Provider>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {it && (
          <div className="relative mx-2 mb-2 mt-2 flex flex-col gap-3 rounded-[20px] bg-[color-mix(in_oklch,var(--surface)_82%,transparent)] p-4 shadow-[0_0_0_1px_var(--line),0_10px_30px_-18px_rgb(0_0_0/0.35)] backdrop-blur-xl sm:mx-4 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-[24px] sm:py-3.5 sm:pl-5 sm:pr-3.5">
            <AnimatePresence initial={false} mode="wait">
              <motion.div key={`${tab}-${it.id}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduce ? 0 : 0.22 }} className="min-w-0">
                <p className="text-[17px] tracking-[-0.02em] text-ink">{it.name}</p>
                <p className="mt-0.5 line-clamp-2 max-w-[640px] text-[13.5px] leading-5 text-ink-3 sm:line-clamp-1">{it.line}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link href={it.href} className="ring-focus inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] transition-colors hover:text-ink">
                Try it
                <ArrowUpRight size={12} />
              </Link>
              <BuyHere />
            </div>
          </div>
        )}
      </div>

      <ol ref={rail} aria-label={SHELVES[tab].label} className="relative mt-4 flex gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] sm:justify-center sm:flex-wrap">
        {items.map((x, i) => {
          const on = i === index
          return (
            <li key={x.id} aria-current={on} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`ring-focus relative flex h-9 items-center gap-2 overflow-hidden rounded-full pl-2.5 pr-3.5 text-[13px] transition-[background-color,color,box-shadow] duration-200 ${on ? 'bg-surface text-ink shadow-[var(--card-edge)]' : 'text-ink-3 hover:bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] hover:text-ink'}`}
              >
                <span className={`text-[11px] tabular-nums ${on ? 'text-accent' : 'text-[var(--quiet)]'}`}>{String(i + 1).padStart(2, '0')}</span>
                {x.name}
                {on && <span ref={fill} aria-hidden className="absolute inset-x-3 bottom-[3px] h-[2px] origin-left scale-x-0 rounded-full bg-accent" />}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function BuyHere() {
  const { plan, buyable } = useChoice()
  const promo = usePromo()
  if (!buyable) return null
  return (
    <a href={plan.href} data-cta="pro-gallery" className="ring-focus group/buy inline-flex h-9 items-center gap-2 rounded-full bg-[var(--accent)] pl-4 pr-3.5 text-[13.5px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_90%,black)] active:scale-[0.97]">
      Get all of Pro, ${priceWith(promo, plan.price)} once
      <ArrowRight size={13} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
    </a>
  )
}

/** The hero says what you get, by count, and what it costs. */
export function ProHero() {
  const { plan } = useChoice()
  const promo = usePromo()
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="focus-in text-[clamp(36px,4.6vw,68px)] font-normal leading-[1.03] tracking-[-0.055em] text-ink">
        Make your AI product feel expensive.
        <span className="block text-quiet">
          {promo && <s className="decoration-[0.06em]">${plan.price}</s>} ${priceWith(promo, plan.price)} once. Yours for good.
        </span>
      </h1>
      <p className="rise mt-6 max-w-[600px] text-balance text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
        A full AI workspace template, {PRO_BLOCKS.length} whole screens and charts that explain themselves, with every state worked out. For founders shipping an AI product, and agencies building them for clients. Your coding agent installs it all today.
      </p>
    </div>
  )
}

/** What one payment buys, said plainly, right under the button. */
export function Terms() {
  const terms = ['One payment, no subscription', 'Unlimited projects', 'One licence per person']
  return (
    <div className="mt-5 flex flex-col items-center gap-1.5 px-2 text-center">
      <BuyTerms />
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[13px] text-ink-3">
        {terms.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}
