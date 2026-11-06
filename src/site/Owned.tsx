'use client'

import type { ReactNode } from 'react'
import type { Plan } from '@/catalog/pro'
import { useMe } from './UserMenu'

export type Owned = 'pro' | 'all' | null | undefined

export function useOwned(): Owned {
  const me = useMe()
  return me === undefined ? undefined : (me?.plan ?? null)
}

export function ForPlan({ none, pro = null, all = null }: { none: ReactNode; pro?: ReactNode; all?: ReactNode }) {
  const owned = useOwned()
  if (owned === 'all') return all
  if (owned === 'pro') return pro
  if (owned === undefined) return <span className="when-out contents">{none}</span>
  return none
}

export function PlanButton({ plan, className }: { plan: Plan; className: string }) {
  const owned = useOwned()
  if (owned === 'all' || owned === 'pro') return null
  return (
    <a href={plan.href} className={`${className} ${owned === undefined ? 'when-out' : ''}`}>
      {plan.cta}
    </a>
  )
}
