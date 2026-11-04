'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { BLOCK_VIEWS, TemplateBody } from '@pro'
import { BLOCK_ORDER, KINDS } from '@/catalog/blocks'
import { DEMOS } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { PLANS, isProBlock, isProComponent } from '@/catalog/pro'
import { SIZE, TILE } from '@/catalog/sizes'
import { TEMPLATES } from '@/catalog/templates'
import { ArrowUpRight } from '@/lab/icons'
import { Mini } from '../Mini'
import { ForPlan } from '../Owned'
import { useNear } from '../near'
import { TemplateCard } from '../templates/TemplateCard'
import { wellOf } from '../wells'
import type { Tone } from '../home/lights'

/*
 * The library, laid out the way Skiper lays out its own: each family a section with its name and
 * one quiet line, then its pieces three to a row. Each card is a dark-edged
 * tray with the piece running inside it, and its name in a caption inside the tray. Pro pieces
 * carry a small Pro mark in the corner of the preview. Narrowing it down is one switch at the top,
 * All, Free or Pro, beside what Pro costs.
 * What's ours: every preview is the real piece, live, not a video, and each family keeps its own
 * light in its wells.
 */

export type Shelf = 'components' | 'blocks' | 'templates'

const SHELVES: { id: Shelf; name: string; href: string }[] = [
  { id: 'components', name: 'Components', href: '/components' },
  { id: 'blocks', name: 'Blocks', href: '/blocks' },
  { id: 'templates', name: 'Templates', href: '/templates' },
]

const LINES: Record<Shelf, string> = {
  components: 'Every piece runs live on this page. Press, drag and type on any of them, then open one for its code.',
  blocks: 'Sections and app screens built from the components, playing live. Drop one in and it fits.',
  templates: 'Whole apps to start from. Every screen live, in light and dark, at any width.',
}

const FAMILY_TONE: Record<string, Tone> = { agents: 'blue', data: 'amber', inputs: 'rose', feedback: 'violet', essentials: 'violet', overlays: 'rose', marketing: 'amber' }
const KIND_TONE: Record<string, Tone> = { app: 'blue', flow: 'violet', section: 'amber' }

type Card = { id: string; n: number; name: string; group: string; groupName: string; pro: boolean; tone: Tone; href: string }
type Group = { id: string; name: string; blurb: string }

const KIND_BLURB: Record<string, string> = {
  app: 'Whole app screens: a calendar, a table, an inbox, each working end to end.',
  flow: 'The steps between screens: signing in, onboarding, paying, getting set up.',
  section: 'The sections a landing page is made of, each with a moment people stop for.',
}
const COMPONENT_GROUPS: Group[] = CATEGORIES.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))
const BLOCK_GROUPS: Group[] = [...new Set(BLOCK_ORDER.map((b) => b.kind))].map((k) => ({ id: k, name: `${KINDS[k]}s`, blurb: KIND_BLURB[k] ?? '' }))

const COMPONENT_CARDS: Card[] = ENTRIES.map((e, i) => ({ id: e.id, n: i + 1, name: e.name, group: e.category, groupName: CATEGORIES.find((c) => c.id === e.category)?.name ?? '', pro: isProComponent(e.id), tone: FAMILY_TONE[e.category] ?? 'blue', href: `/components/${e.id}` }))
const BLOCK_CARDS: Card[] = BLOCK_ORDER.map((b, i) => ({ id: b.id, n: i + 1, name: b.name, group: b.kind, groupName: `${KINDS[b.kind]}s`, pro: isProBlock(b.id), tone: KIND_TONE[b.kind] ?? 'blue', href: `/blocks/${b.id}` }))

export function Library({ shelf }: { shelf: Shelf }) {
  const [plan, setPlan] = useState<'all' | 'free' | 'pro'>('all')
  const cards = shelf === 'components' ? COMPONENT_CARDS : shelf === 'blocks' ? BLOCK_CARDS : []
  const shown = cards.filter((c) => plan === 'all' || (plan === 'pro') === c.pro)
  const sections = (shelf === 'components' ? COMPONENT_GROUPS : BLOCK_GROUPS).map((g) => ({ ...g, cards: shown.filter((c) => c.group === g.id) }))
  const pro = cards.filter((c) => c.pro).length

  return (
    <main className="mx-auto max-w-[1360px] px-4 pb-40 pt-28 sm:px-8 sm:pt-32">
      {/* The shelves, as words: the one you're on in ink, the others quiet. */}
      <nav aria-label="Library" className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {SHELVES.map((s) => {
          const on = s.id === shelf
          return (
            <Link key={s.id} href={s.href} aria-current={on ? 'page' : undefined} className={`ring-focus rounded-[10px] text-[clamp(30px,3.4vw,46px)] font-normal leading-[1.1] tracking-[-0.045em] transition-colors duration-200 ${on ? 'text-ink' : 'text-ink-3/45 hover:text-ink-3'}`}>
              {s.name}
            </Link>
          )
        })}
      </nav>
      <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-ink-3">{LINES[shelf]}</p>

      {shelf === 'templates' ? (
        <div aria-label="Templates" className="mt-12 flex flex-col gap-3 sm:mt-16">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
      ) : (
        <>
          {/*
           * Free or Pro, at the top, beside what Pro costs. Arc and Aceternity both keep the price in
           * sight while you browse; here it's one plain line: how many are Pro, that it's one payment,
           * and the way to it. Free pieces stay first-class, since they're what earns the trust.
           */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 sm:mt-10">
            <div role="radiogroup" aria-label="Show" className="flex items-center gap-1">
              {(['all', 'free', 'pro'] as const).map((p) => (
                <button key={p} type="button" role="radio" aria-checked={plan === p} onClick={() => setPlan(p)} className={`ring-focus h-9 rounded-[10px] px-3.5 text-[14px] transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${plan === p ? 'bg-ink text-surface' : 'text-ink-3 hover:bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] hover:text-ink'}`}>
                  {p === 'all' ? 'All' : p === 'free' ? 'Free' : 'Pro'}
                  <span className="tnum ml-1.5 opacity-55">{p === 'all' ? cards.length : p === 'pro' ? pro : cards.length - pro}</span>
                </button>
              ))}
            </div>
            {pro > 0 && (
              <ForPlan
                none={
                <Link href="/pro" className="ring-focus group/pro flex items-center gap-2 rounded-[10px] text-[14px] text-ink-3 transition-colors hover:text-ink">
                  <span>
                    <span className="text-ink">{pro} of these are Pro.</span> All of them, and every one we add, for ${PLANS[0].price} once.
                  </span>
                  <ArrowUpRight size={13} className="shrink-0 transition-transform duration-150 group-hover/pro:-translate-y-px group-hover/pro:translate-x-px" />
                </Link>
                }
              />
            )}
          </div>

          {sections.map((g) =>
            g.cards.length ? (
              <section key={g.id} aria-labelledby={`g-${g.id}`} className="mt-14 sm:mt-20">
                <h2 id={`g-${g.id}`} className="text-[19px] font-medium tracking-[-0.02em] text-ink">
                  {g.name}
                </h2>
                <p className="mt-1 max-w-[620px] text-[14px] leading-[1.5] text-ink-3">{g.blurb}</p>
                <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.cards.map((c) => (
                    <li key={c.id}>
                      <Tile card={c} shelf={shelf} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </>
      )}
    </main>
  )
}

/**
 * One piece, as Skiper shows one: a tray, the piece running in a well set into it, and a caption
 * inside the tray with the name. Pro carries a small mark in the corner.
 */
function Tile({ card, shelf }: { card: Card; shelf: Shelf }) {
  const box = useRef<HTMLAnchorElement>(null)
  const near = useNear(box, '300px 0px', '600px 0px')
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ type: 'spring', stiffness: 260, damping: 32 }}>
      <Link ref={box} href={card.href} className="ring-focus group/tile block rounded-[16px] bg-[var(--mount)] p-2 shadow-[0_0_0_1px_var(--line)] transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--line-strong)]">
        <div className="relative isolate aspect-[4/3] overflow-clip rounded-[10px] shadow-[0_0_0_1px_var(--line)]" style={{ background: wellOf(card.tone) }}>
          <div aria-hidden inert className="pointer-events-none absolute inset-0 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.2,0.9,0.25,1)] group-hover/tile:scale-[1.025]">
            {near && (shelf === 'components' ? <ComponentPiece id={card.id} /> : <BlockPiece id={card.id} />)}
          </div>
          {card.pro && <span className="absolute right-2.5 top-2.5 rounded-[6px] bg-ink px-1.5 text-[11px] font-medium leading-[20px] text-surface">Pro</span>}
        </div>
        <div className="flex items-center gap-3 px-1.5 pb-0.5 pt-2.5">
          <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{card.name}</span>
          <ArrowUpRight size={13} className="shrink-0 text-ink-3 opacity-0 transition-[opacity,transform] duration-200 group-hover/tile:-translate-y-px group-hover/tile:translate-x-px group-hover/tile:opacity-100" />
        </div>
      </Link>
    </motion.div>
  )
}

/**
 * Under a piece's own page, the way on, as Dribbble does under a shot: three more from the same
 * family on the same live cards as the library, and the way to all of them. The family's next ones
 * come first, wrapping round, so moving through a family is a walk rather than a shuffle.
 */
export function MoreLike({ shelf, id }: { shelf: 'components' | 'blocks'; id: string }) {
  const cards = shelf === 'components' ? COMPONENT_CARDS : BLOCK_CARDS
  const me = cards.find((c) => c.id === id)
  if (!me) return null
  const family = cards.filter((c) => c.group === me.group)
  const at = family.indexOf(me)
  const after = [...family.slice(at + 1), ...family.slice(0, at)]
  // A small family is topped up from the ones after it in the library.
  const rest = [...cards.slice(cards.indexOf(me) + 1), ...cards.slice(0, cards.indexOf(me))].filter((c) => c.group !== me.group)
  const shown = [...after, ...rest].slice(0, 3)
  return (
    <section aria-labelledby="more" className="mt-20 sm:mt-28">
      <div className="flex items-end justify-between gap-6">
        <h2 id="more" className="text-[19px] font-medium tracking-[-0.02em] text-ink">
          More in {me.groupName}
        </h2>
        <Link href={`/${shelf}`} className="ring-focus group/all flex shrink-0 items-center gap-1 rounded-[8px] text-[14px] text-ink-3 transition-colors hover:text-ink">
          All {shelf}
          <ArrowUpRight size={13} className="transition-transform duration-150 group-hover/all:-translate-y-px group-hover/all:translate-x-px" />
        </Link>
      </div>
      <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.id}>
            <Tile card={c} shelf={shelf} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ComponentPiece({ id }: { id: string }) {
  const Demo = DEMOS[id]
  const e = ENTRIES.find((x) => x.id === id)
  if (!Demo || !e) return null
  return (
    <Mini pad={28} max={0.9}>
      {/* A demo that fills its parent has no size of its own here, so it gets its stage size to fill. */}
      {e.bleed && (TILE[id] ?? SIZE[id]) ? (
        <div className="relative" style={{ width: (TILE[id] ?? SIZE[id])[0], height: (TILE[id] ?? SIZE[id])[1] }}>
          <Demo />
        </div>
      ) : (
        <Demo />
      )}
    </Mini>
  )
}

/**
 * A whole screen, small: it runs at a laptop's width in a little window, scaled to fit where it's
 * shown. Blocks and templates are drawn this way on their cards and beside the strip.
 */
const SCREEN: [number, number] = [1280, 860]
function ScreenPiece({ onReady, children }: { onReady?: () => void; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const ready = useRef(onReady)
  useLayoutEffect(() => {
    ready.current = onReady
  })
  useLayoutEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setScale(el.offsetWidth / SCREEN[0])
      ready.current?.()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="absolute inset-0 flex items-center justify-center p-[6%]">
      <div ref={frame} className="relative w-full overflow-hidden rounded-[10px] bg-bg shadow-[0_0_0_.5px_var(--line-strong),0_18px_40px_-16px_rgb(0_0_0/0.28)]" style={{ aspectRatio: `${SCREEN[0]} / ${SCREEN[1]}` }}>
        {scale > 0 && (
          <div className="absolute left-0 top-0 origin-top-left overflow-hidden text-ink" style={{ width: SCREEN[0], height: SCREEN[1], transform: `scale(${scale})` }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export function BlockPiece({ id, onReady }: { id: string; onReady?: () => void }) {
  const View = BLOCK_VIEWS[id as keyof typeof BLOCK_VIEWS] as ComponentType | undefined
  if (!View) return null
  return (
    <ScreenPiece onReady={onReady}>
      <View />
    </ScreenPiece>
  )
}

export function TemplatePiece({ id, onReady }: { id: string; onReady?: () => void }) {
  return (
    <ScreenPiece onReady={onReady}>
      <TemplateBody id={id} />
    </ScreenPiece>
  )
}
