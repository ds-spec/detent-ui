'use client'

import Link from 'next/link'
import { ENTRIES } from '@/catalog/meta'
import { FREE_BLOCKS, PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { ArrowRight, Check } from '@/lab/icons'
import { RollingText } from '@/lab/ui/RollingText'
import { useOwned } from '../Owned'
import { priceWith, useLeft, usePromo, useRegion } from '../Promo'

const FREE = ENTRIES.length - PRO_COMPONENTS.length

const FREE_ROWS = [
  `${FREE} components, MIT licence`,
  `${FREE_BLOCKS.length} website blocks: FAQ, testimonials, sign in and more`,
  'Install with the shadcn CLI or your coding agent',
  'Takes your theme, light and dark',
  'Live previews for everything',
]

function proRows() {
  const app = TEMPLATES.find((t) => t.form === 'app')
  return [
    'Everything in Free',
    `${TEMPLATES.length} templates: the ${app?.name ?? 'Detent'} AI workspace app and a landing page`,
    `${PRO_BLOCK_COUNT} whole screens: agent chat, evals, task to merge, data table, onboarding, settings`,
    `All ${ENTRIES.length} components, charts that explain themselves included`,
    'Page plans and setup for Claude Code, Cursor and Codex',
    'Unlimited projects',
    'Lifetime updates',
    'Support from the person who built it',
  ]
}

function Rows({ rows, lit = false }: { rows: string[]; lit?: boolean }) {
  return (
    <ul className="grid gap-3.5">
      {rows.map((r) => (
        <li key={r} className="flex gap-3 text-[15px] leading-[1.45] text-ink-2">
          <span className={`mt-[1px] flex size-[19px] shrink-0 items-center justify-center rounded-full ${lit ? 'bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent' : 'bg-surface-2 text-ink-3'}`}>
            <Check size={11} strokeWidth={2.8} />
          </span>
          {r}
        </li>
      ))}
    </ul>
  )
}

const BTN = 'ring-focus mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-[opacity,transform,background-color] duration-150 active:scale-[0.98]'

export function PricingCards({ cta = 'cards' }: { cta?: string }) {
  const plan = PLANS[0]
  const promo = usePromo()
  const region = useRegion()
  const left = useLeft(promo?.ends)
  const owned = useOwned()
  const price = priceWith(promo, plan.price)
  const sale = promo?.name ?? null
  return (
    <div className="mx-auto grid w-full max-w-[920px] gap-3 md:grid-cols-2">
      <div className="flex flex-col rounded-[28px] bg-surface p-7 shadow-[var(--card-edge)] max-md:order-last sm:p-8">
        <p className="text-[20px] tracking-[-0.025em] text-ink">Free</p>
        <p className="mt-6 flex items-baseline gap-2">
          <span className="tnum text-[52px] leading-none tracking-[-0.05em] text-ink">$0</span>
          <span className="text-[16px] text-ink-3">forever</span>
        </p>
        <p className="mt-4">
          <span className="inline-flex h-7 items-center rounded-full bg-surface-2 px-3 text-[13px] text-ink-2">
            {FREE} components and {FREE_BLOCKS.length} blocks, free
          </span>
        </p>
        <div className="my-7 h-px bg-[var(--line)]" />
        <div className="mb-9">
          <Rows rows={FREE_ROWS} />
        </div>
        <Link href="/components" className={`${BTN} bg-surface-2 text-ink hover:bg-[color-mix(in_oklch,var(--ink)_8%,transparent)]`}>
          Browse free components
        </Link>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-surface p-7 shadow-[0_0_0_1.5px_var(--accent),0_24px_60px_-28px_color-mix(in_oklch,var(--accent)_55%,transparent)] sm:p-8">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--accent)_12%,transparent),transparent)]" />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-[20px] tracking-[-0.025em] text-ink">Pro</p>
          {sale && (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink px-3 text-[12.5px] font-medium text-surface">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {sale}
            </span>
          )}
        </div>
        <p className="relative mt-6 flex flex-wrap items-baseline gap-x-2.5">
          {promo && <s className="tnum text-[24px] leading-none tracking-[-0.03em] text-ink-3 decoration-[0.06em]">${plan.price}</s>}
          <span className="tnum text-[52px] leading-none tracking-[-0.05em] text-accent">
            <RollingText text={`$${price}`} proportional />
          </span>
          <span className="text-[16px] text-ink-3">once</span>
        </p>
        <div className="relative mt-4 grid gap-1.5 text-[14px]">
          {region && (
            <p className="text-ink-2">
              <span aria-hidden className="mr-1.5">🇮🇳</span>Price adjusted for India · <span className="font-medium text-ink">{region.off} off</span>
            </p>
          )}
          {promo && !region && <p className="text-ink-2">{promo.off} off for {sale ?? 'a short time'}</p>}
          {left && (
            <p className="inline-flex items-center gap-[0.3em] text-accent">
              {promo?.until ? <>Ends {promo.until} ·</> : 'Ends in'} <RollingText text={left} className="font-medium" />
            </p>
          )}
        </div>
        <div className="relative my-7 h-px bg-[var(--line)]" />
        <div className="relative mb-9">
          <Rows rows={proRows()} lit />
        </div>
        {owned ? (
          <Link href="/account" className={`${BTN} bg-surface-2 text-ink`}>
            You have Pro · open your account
          </Link>
        ) : (
          <a href={plan.href} data-cta={cta} className={`${BTN} group/buy relative bg-ink text-surface hover:opacity-90`}>
            Get Pro · ${price} once
            <ArrowRight size={15} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
          </a>
        )}
        <p className="relative mt-3 text-center text-[12.5px] text-ink-3">+ local tax · lifetime updates · all sales final</p>
      </div>
    </div>
  )
}
