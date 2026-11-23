'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { PRO_BLOCKS } from '@/catalog/effort'
import { ENTRIES } from '@/catalog/meta'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { ArrowRight, ArrowUpRight } from '@/lab/icons'
import { InPlay } from '@/lab/blocks/kit/director'
import { Piece } from '@/site/home/long/Home'
import { Tabs } from '@/site/home/long/parts'
import { BlockPiece, TemplatePiece } from '@/site/library/Library'
import { wellOf } from '@/site/wells'
import { priceWith, usePromo } from '@/site/Promo'
import { useChoice } from '@/site/pro/Buy'

type Item = { id: string; name: string; line: string; href: string; piece: () => ReactNode }

const SHELVES = {
  components: {
    label: 'Components',
    items: (): Item[] =>
      PRO_COMPONENTS.map((id) => ENTRIES.find((e) => e.id === id))
        .filter((e) => !!e)
        .map((e) => ({ id: e.id, name: e.name, line: e.short ?? e.line, href: `/components/${e.id}`, piece: () => <Piece id={e.id} max={1} /> })),
  },
  screens: {
    label: 'Screens',
    items: (): Item[] => PRO_BLOCKS.map((b) => ({ id: b.id, name: b.name, line: b.line, href: `/blocks/${b.id}`, piece: () => <BlockPiece id={b.id} /> })),
  },
  templates: {
    label: 'Templates',
    items: (): Item[] => TEMPLATES.map((t) => ({ id: t.id, name: t.name, line: `${t.kind}. ${t.line}`, href: `/templates/${t.id}`, piece: () => <TemplatePiece id={t.id} /> })),
  },
} as const
type Shelf = keyof typeof SHELVES

/** Every Pro piece, one at a time at full size, with the buy button beside it. */
export function Gallery() {
  const [tab, setTab] = useState<Shelf>('screens')
  const items = SHELVES[tab].items()
  const [pick, setPick] = useState<Record<Shelf, string>>({ components: items[0]?.id ?? '', screens: PRO_BLOCKS[0]?.id ?? '', templates: TEMPLATES[0]?.id ?? '' })
  const it = items.find((x) => x.id === pick[tab]) ?? items[0]
  const choose = (id: string) => setPick((p) => ({ ...p, [tab]: id }))

  return (
    <div>
      <Tabs
        label="Everything in Pro"
        value={tab}
        onChange={(v) => setTab(v as Shelf)}
        items={(Object.keys(SHELVES) as Shelf[]).map((k) => ({ id: k, label: `${SHELVES[k].label} ${SHELVES[k].items().length}` }))}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        {/* The list: every piece in this shelf, by name. A row of chips on a phone. */}
        <ul aria-label={SHELVES[tab].label} className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:max-h-[720px] lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:px-0">
          {items.map((x) => (
            <li key={x.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={x.id === it?.id}
                onClick={() => choose(x.id)}
                className={`ring-focus w-full whitespace-nowrap rounded-full px-3.5 py-2 text-left text-[14px] transition-colors duration-150 lg:rounded-[10px] lg:px-3 ${x.id === it?.id ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--line)]' : 'text-ink-3 hover:bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] hover:text-ink'}`}
              >
                {x.name}
              </button>
            </li>
          ))}
        </ul>

        {/* The piece itself, large and live, with its name and the buy button under it. */}
        {it && (
          <div className="min-w-0">
            <div key={it.id} className="relative isolate aspect-[4/5] overflow-hidden rounded-[22px] sm:aspect-[16/11] lg:aspect-auto lg:h-[720px] lg:rounded-[28px]" style={{ background: wellOf(tab === 'components' ? 'amber' : tab === 'screens' ? 'blue' : 'violet') }}>
              <InPlay.Provider value={true}>
                <div className="absolute inset-0">{it.piece()}</div>
              </InPlay.Provider>
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[17px] tracking-[-0.01em] text-ink">{it.name}</p>
                <p className="mt-1 line-clamp-2 max-w-[560px] text-[14px] leading-[1.5] text-ink-3">{it.line}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={it.href} className="ring-focus inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] text-ink-2 transition-colors hover:text-ink">
                  Open
                  <ArrowUpRight size={12} />
                </Link>
                <BuyHere />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BuyHere() {
  const { plan, buyable } = useChoice()
  const promo = usePromo()
  if (!buyable) return null
  return (
    <a href={plan.href} data-cta="pro-gallery" className="ring-focus group/buy inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] pl-4 pr-3.5 text-[14px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_90%,black)] active:scale-[0.97]">
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
        An agent app and its landing page, {PRO_BLOCKS.length} whole screens and {PRO_COMPONENTS.length} Pro components: agent chat, a support inbox, evals and charts that explain themselves, with every state worked out. Your coding agent installs them with the shadcn CLI, on your theme, as code you own.
      </p>
    </div>
  )
}

/** What one payment buys, said plainly, right under the button. */
export function Terms() {
  const terms = ['One payment, no subscription', 'Every update and new piece, for life', 'Unlimited projects, client work too', 'One licence per person']
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1.5 px-2 text-[13px] text-ink-3">
      {terms.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}
