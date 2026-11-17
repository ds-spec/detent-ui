import Link from 'next/link'
import { ArrowRight, Check, Code, Refresh } from '@/lab/icons'
import { ON_SALE } from '@/catalog/pro'
import type { Plan } from '@/catalog/pro'
import { PlanButton } from '../Owned'
import { Price } from '../Promo'

const PROMISES = [
  [<Check key="c" size={13} />, 'No subscription, ever'],
  [<Refresh key="r" size={13} />, 'Every update, for life'],
  [<Code key="o" size={13} />, 'Full source, yours to edit'],
] as const

const COVERED = ['Every update, for life', 'Unlimited projects', 'Source in your project, yours to change']

export function Plans({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-3">
      {ON_SALE.map((p) => (
        <PlanCard key={p.id} plan={p} compact={compact} />
      ))}
    </div>
  )
}

function PlanCard({ plan, compact }: { plan: Plan; compact: boolean }) {
  const features = plan.features.filter((f) => !COVERED.includes(f))
  return (
    <div className="grid gap-2 rounded-[28px] bg-surface p-2 text-ink shadow-[var(--card-edge)] md:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col p-6">
        <p className="text-[17px] tracking-[-0.01em]">Detent {plan.name}</p>
        <p className="mt-1 text-[13.5px] text-ink-3">{plan.line}</p>
        <ul className="mt-7 flex flex-col gap-3 text-[13.5px] text-ink-2">
          {features.map((f) => (
            <li key={f} className="flex gap-3 leading-[20px]">
              <span className="mt-[2px] grid size-4 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2">
                <Check size={10} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        {!compact && (
          <Link href="/pro" className="ring-focus group mt-auto inline-flex w-fit items-center gap-1.5 rounded-[6px] pt-8 text-[13px] text-ink-3 transition-colors hover:text-ink">
            Every piece runs live on the site. See all of Pro
            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div className="flex flex-col rounded-[20px] bg-surface-2 p-6">
        <p className="flex items-baseline gap-2">
          <span className="tnum text-[52px] leading-none tracking-[-0.055em]">
            <Price value={plan.price} />
          </span>
          <span className="text-[13px] text-ink-3">once</span>
        </p>
        <p className="mt-2 text-[12.5px] text-ink-3">For {plan.seats}. Tax added at checkout.</p>
        <PlanButton plan={plan} className="ring-focus mt-6 flex h-11 items-center justify-center rounded-full bg-ink text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]" />
        <ul className="mt-6 flex flex-col gap-2.5 pt-5 text-[12.5px] text-ink-2 shadow-[inset_0_1px_0_var(--line)]">
          {PROMISES.map(([icon, text]) => (
            <li key={text} className="flex items-center gap-2.5">
              <span className="text-ink-3">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
