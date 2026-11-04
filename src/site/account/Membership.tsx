import type { ReactNode } from 'react'
import { PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS } from '@/catalog/pro'
import type { Plan } from '@/catalog/licence'
import { TEMPLATES } from '@/catalog/templates'
import { DetentMark } from '@/lab/ui/DetentMark'
import { Wallpaper } from '@/site/blocks/Wallpaper'
import { Arriving } from './Forms'
import { planLabel } from './ProBadge'

/*
 * The plan as a card you'd keep in a wallet: on the blue light the sign-in panel stands on, its
 * words in white, the numbers in glass. Owned, on its way, or not bought yet.
 */

const day = (at: number) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(at)
const GLASS = 'bg-white/[0.13] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] backdrop-blur-md'

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={`rounded-[12px] px-3 py-3 sm:px-3.5 ${GLASS}`}>
      {/* A touch smaller on a phone, so "Components" fits a third of the card. */}
      <dt className="truncate text-[11px] text-white/75 sm:text-caption">{label}</dt>
      <dd className="tnum mt-1 text-title text-white">{value}</dd>
    </div>
  )
}

export function Membership({ purchase, arriving, thanks }: { purchase: { plan: Plan; since: number } | null; arriving: boolean; thanks: boolean }) {
  return (
    <section aria-label="Plan" className="relative mt-10 overflow-hidden rounded-[22px] p-6 text-white shadow-[0_24px_60px_-28px_color-mix(in_oklch,var(--accent)_70%,transparent)] sm:p-8">
      <Wallpaper tone="blue" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4 text-footnote">
          <span className="flex items-center gap-2 font-medium text-white/95">
            <DetentMark size={20} />
            {purchase ? `Detent ${planLabel(purchase.plan)}` : 'Detent Pro'}
          </span>
        </div>

        {purchase ? (
          <>
            <h2 className="mt-12 text-[30px] font-normal leading-[1.1] tracking-[-0.03em] sm:text-[34px]">{thanks ? 'Welcome. It’s all yours.' : 'Everything is yours.'}</h2>
            {/* Under the headline, where the card is deep enough for white to read; the top corner is the light's brightest. */}
            <p className="mt-2 text-callout text-white/85">Yours since {day(purchase.since)}, with every update for life.</p>
            <dl className="mt-7 grid grid-cols-3 gap-2">
              <Stat label="Components" value={PRO_COMPONENTS.length} />
              <Stat label="Blocks" value={PRO_BLOCK_COUNT} />
              {purchase.plan === 'all' ? <Stat label="Templates" value={TEMPLATES.length} /> : <Stat label="Updates" value="For life" />}
            </dl>
          </>
        ) : arriving ? (
          <div className="mt-12 flex items-start gap-4">
            <span className={`grid size-11 shrink-0 place-items-center rounded-[12px] ${GLASS}`}>
              <Arriving />
            </span>
            <div>
              <h2 className="text-title">Thank you. It’s on its way.</h2>
              <p className="mt-1 text-callout leading-[1.55] text-white/80">Payments take a few seconds to confirm. This page checks again by itself, and your badge shows the moment it lands.</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mt-12 text-[30px] font-normal leading-[1.1] tracking-[-0.03em] sm:text-[34px]">Everything you build the product with.</h2>
            <p className="mt-2 text-callout leading-[1.55] text-white/80">
              {PRO_COMPONENTS.length} Pro components and {PRO_BLOCK_COUNT} blocks, installed with the shadcn CLI. One payment, every update for life.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {[...PLANS].reverse().map((plan) => (
                <a
                  key={plan.id}
                  href={plan.href}
                  className={`ring-focus flex h-11 items-center gap-2 rounded-[12px] px-5 text-callout font-medium transition-[opacity,transform,background-color] duration-150 active:scale-[0.98] ${plan.best ? 'bg-white text-[#1631cc] shadow-[0_6px_16px_-8px_rgb(0_0_0/0.4)] hover:opacity-95' : `${GLASS} text-white hover:bg-white/[0.2]`}`}
                >
                  Get {plan.name}
                  <span className="tnum opacity-60">${plan.price}</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
