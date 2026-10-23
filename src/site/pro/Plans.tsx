import { Check } from '@/lab/icons'
import { PLANS, TERMS } from '@/catalog/pro'
import type { Plan } from '@/catalog/pro'

/**
 * The plans. The two for one person sit side by side: Pro is a plain card; Pro + Templates is
 * the same card inverted, with a slow glint of light crossing it now and then, because it's the
 * one with everything. Team runs the full width beneath them, so the first choice stays a simple
 * one and a team still finds theirs right there. Prices are one payment, said the same way everywhere.
 */
export function Plans({ compact = false }: { compact?: boolean }) {
  const team = PLANS.find((p) => p.id === 'team')
  return (
    <div>
      <div className="mx-auto grid max-w-[900px] gap-4 md:grid-cols-2">
        {PLANS.filter((p) => p.id !== 'team').map((p) => (
          <PlanCard key={p.id} plan={p} compact={compact} />
        ))}
      </div>
      {team && <TeamRow plan={team} />}
      <p className="mt-6 text-center text-footnote text-ink-3">{TERMS}</p>
    </div>
  )
}

/** Team: the same promise for up to ten people, read across in one row. The last two lines of every plan are said once, below, so the row shows what's different. */
function TeamRow({ plan }: { plan: Plan }) {
  return (
    <div className="mx-auto mt-4 grid max-w-[900px] gap-7 rounded-[28px] bg-surface p-7 text-ink shadow-border sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
      <div className="min-w-0">
        <div className="flex h-6 items-center gap-2.5">
          <p className="text-headline">{plan.name}</p>
          <span className="rounded-full bg-surface-2 px-2.5 text-caption font-medium leading-6 text-ink-2">{plan.seats[0].toUpperCase() + plan.seats.slice(1)}</span>
        </div>
        <p className="mt-1 text-callout text-ink-3">{plan.line}</p>
        <ul className="mt-6 grid gap-x-8 gap-y-3 text-callout text-ink-2 sm:grid-cols-2">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f} className="flex gap-3">
              <span className="mt-[3px] grid size-4 shrink-0 place-items-center rounded-full bg-surface-2">
                <Check size={10} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between gap-6 md:flex-col md:items-end">
        <p className="flex items-baseline gap-2">
          <span className="tnum text-[44px] font-normal leading-none tracking-[-0.05em]">${plan.price}</span>
          <span className="text-footnote text-ink-3">once</span>
        </p>
        <a href={plan.href} className="ring-focus flex h-11 items-center justify-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-opacity duration-150 hover:opacity-90">
          {plan.cta}
        </a>
      </div>
    </div>
  )
}

function PlanCard({ plan, compact }: { plan: Plan; compact: boolean }) {
  const inverted = plan.best
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-[28px] p-7 sm:p-8 ${inverted ? 'pro-sheen bg-ink text-surface shadow-modal' : 'bg-surface text-ink shadow-border'}`}>
      <div className="flex h-6 items-center justify-between gap-4">
        <p className="text-headline">{plan.name}</p>
        {inverted && <span className="rounded-full bg-surface/15 px-2.5 text-caption font-medium leading-6">Everything</span>}
      </div>
      <p className={`mt-1 text-callout ${inverted ? 'text-surface/60' : 'text-ink-3'}`}>{plan.line}</p>
      <p className="mt-7 flex items-baseline gap-2">
        <span className="tnum text-[52px] font-normal leading-none tracking-[-0.05em]">${plan.price}</span>
        <span className={`text-footnote ${inverted ? 'text-surface/60' : 'text-ink-3'}`}>once, for {plan.seats}</span>
      </p>
      <a
        href={plan.href}
        className={`ring-focus relative mt-7 flex h-11 items-center justify-center rounded-full text-callout font-medium transition-opacity duration-150 hover:opacity-90 ${inverted ? 'bg-surface text-ink' : 'bg-ink text-surface'}`}
      >
        {plan.cta}
      </a>
      {!compact && <span className={`mt-7 h-px ${inverted ? 'bg-surface/15' : 'bg-[var(--line)]'}`} />}
      <ul className={`flex flex-col gap-3 text-callout ${compact ? 'mt-6' : 'mt-6'} ${inverted ? 'text-surface/85' : 'text-ink-2'}`}>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3">
            <span className={`mt-[3px] grid size-4 shrink-0 place-items-center rounded-full ${inverted ? 'bg-surface/15' : 'bg-surface-2'}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
