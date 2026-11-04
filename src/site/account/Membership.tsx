import type { ReactNode } from 'react'
import Link from 'next/link'
import { PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS } from '@/catalog/pro'
import type { Plan } from '@/catalog/licence'
import { TEMPLATES } from '@/catalog/templates'
import { DetentMark } from '@/lab/ui/DetentMark'
import { Arriving } from './Forms'
import { planLabel } from './ProBadge'
import { SettingsCard, SMALL, SMALL_QUIET } from './Settings'

/*
 * The plan, as the account's first setting: what you own and since when, what's in it, and what to
 * do next. Owned, on its way, or not bought yet.
 */

const day = (at: number) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(at)

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[10px] px-3.5 py-3 shadow-[0_0_0_1px_var(--line)]">
      <dt className="truncate text-[12px] text-ink-3">{label}</dt>
      <dd className="tnum mt-0.5 text-[20px] font-semibold tracking-[-0.02em] text-ink">{value}</dd>
    </div>
  )
}

export function Membership({ purchase, arriving, thanks }: { purchase: { plan: Plan; since: number } | null; arriving: boolean; thanks: boolean }) {
  if (purchase)
    return (
      <SettingsCard
        id="plan"
        title="Plan"
        line={thanks ? 'Welcome. Everything in it is yours.' : 'Everything in it is yours, with every update for life.'}
        foot={`Yours since ${day(purchase.since)}`}
        action={
          <Link href="/pro#install" className={SMALL_QUIET}>
            How to install
          </Link>
        }
      >
        <div className="flex items-center gap-3">
          <DetentMark size={36} />
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">Detent {planLabel(purchase.plan)}</p>
            <p className="text-[13px] text-ink-3">One payment · Lifetime updates</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Components" value={PRO_COMPONENTS.length} />
          <Stat label="Blocks" value={PRO_BLOCK_COUNT} />
          {purchase.plan === 'all' ? <Stat label="Templates" value={TEMPLATES.length} /> : <Stat label="Updates" value="For life" />}
        </dl>
      </SettingsCard>
    )
  if (arriving)
    return (
      <SettingsCard id="plan" title="Plan" line="Thank you. Your purchase is on its way." foot="This page checks again by itself">
        <div className="flex items-center gap-3 text-[14px] text-ink-2">
          <span className="grid size-9 place-items-center rounded-[10px] bg-[color-mix(in_oklch,var(--ink)_5%,transparent)]">
            <Arriving />
          </span>
          Payments take a few seconds to confirm. Your badge shows the moment it lands.
        </div>
      </SettingsCard>
    )
  return (
    <SettingsCard
      id="plan"
      title="Plan"
      line={`${PRO_COMPONENTS.length} Pro components and ${PRO_BLOCK_COUNT} blocks, installed with the shadcn CLI.`}
      foot="One payment, every update for life"
      action={
        <div className="flex flex-wrap gap-2">
          {[...PLANS].reverse().map((plan) => (
            <a key={plan.id} href={plan.href} className={plan.best ? SMALL : SMALL_QUIET}>
              Get {plan.name}
              <span className="tnum opacity-60">${plan.price}</span>
            </a>
          ))}
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <DetentMark size={36} />
        <div>
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">No plan yet</p>
          <p className="text-[13px] text-ink-3">Your keys start working the moment you buy.</p>
        </div>
      </div>
    </SettingsCard>
  )
}
