import { Check, Code, Refresh, Undo } from '@/lab/icons'
import { PLANS } from '@/catalog/pro'
import type { Plan } from '@/catalog/pro'
import { REFUND_DAYS } from '@/catalog/trust'
import { PlanButton } from '../Owned'

export function Plans({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <div className="mx-auto grid max-w-[860px] gap-3 md:grid-cols-2">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} compact={compact} />
        ))}
      </div>
      <ul className="mx-auto mt-3 grid max-w-[860px] gap-x-6 gap-y-3 rounded-[22px] px-6 py-5 text-[13.5px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            [<Check key="c" size={14} />, 'One payment, never a subscription'],
            [<Refresh key="r" size={14} />, 'Every update, for life'],
            [<Undo key="u" size={14} />, `${REFUND_DAYS}-day refund, no questions`],
            [<Code key="o" size={14} />, 'Source in your project, yours to change'],
          ] as const
        ).map(([icon, text]) => (
          <li key={text} className="flex items-center gap-2.5">
            <span className="text-ink-3">{icon}</span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlanCard({ plan, compact }: { plan: Plan; compact: boolean }) {
  const ink = plan.best
  const features = plan.features.filter((f) => f !== 'Every update, for life' && f !== 'Unlimited projects')
  return (
    <div className={`relative flex flex-col rounded-[28px] p-7 sm:p-8 ${ink ? 'bg-ink text-surface shadow-modal' : 'bg-surface text-ink shadow-[var(--card-edge)]'}`}>
      <div className="flex h-6 items-center justify-between gap-4">
        <p className="text-[17px] tracking-[-0.01em]">{plan.name}</p>
        {ink && <span className="rounded-full bg-surface/15 px-2.5 text-[12px] font-medium leading-6">Everything</span>}
      </div>
      <p className={`mt-1 text-[14.5px] ${ink ? 'text-surface/60' : 'text-ink-3'}`}>{plan.line}</p>
      <p className="mt-8 flex items-baseline gap-2">
        <span className="tnum text-[56px] font-normal leading-none tracking-[-0.055em]">${plan.price}</span>
        <span className={`text-[13.5px] ${ink ? 'text-surface/60' : 'text-ink-3'}`}>once, for {plan.seats}</span>
      </p>
      <PlanButton plan={plan} className={`ring-focus mt-8 flex h-11 items-center justify-center rounded-full text-[14px] font-medium transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] ${ink ? 'bg-surface text-ink' : 'bg-ink text-surface'}`} />
      {!compact && (
        <ul className={`mt-8 flex flex-col gap-3 pt-7 text-[14px] ${ink ? 'text-surface/85 shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]' : 'text-ink-2 shadow-[inset_0_1px_0_var(--line)]'}`}>
          {features.map((f) => (
            <li key={f} className="flex gap-3">
              <span className={`mt-[3px] grid size-4 shrink-0 place-items-center rounded-full ${ink ? 'bg-surface/15' : 'bg-surface-2'}`}>
                <Check size={10} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
