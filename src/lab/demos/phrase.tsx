'use client'

import { Phrase } from '../components/phrase/Phrase'
import { useBench } from '@/lab/demos/bench'

const n = (v: string | number) => Number(v)
const fmt = (v: number) => v.toLocaleString('en-US')
const WHO: Record<string, number> = { 'at Acme': 48, 'I invite': 3 }

export function PhraseDemo() {
  const b = useBench()
  return (
    <div className="grid size-full place-items-center p-4">
      <div className="w-[480px] max-w-full space-y-3">
        <Phrase
          title="Sharing"
          aside="Q4 plan"
          parts={['Anyone ', { id: 'who', label: 'Who', options: ['at Acme', 'on the web', 'I invite'] }, ' with the link can ', { id: 'can', label: 'Access', options: ['view', 'comment', 'edit'] }, '.']}
          defaultValue={{ who: 'at Acme', can: 'edit' }}
          onChange={b.on('onChange')}
          says={({ who, can }) => (who === 'on the web' ? `Public. Anyone who finds the link can ${can} it.` : `${WHO[who]} people can ${can} this right now.`)}
        />
        <Phrase
          title="Billing"
          aside="Team plan"
          parts={['Bill me ', { id: 'plan', label: 'Billing period', options: ['monthly', 'yearly'] }, ' for ', { id: 'seats', label: 'Seats', min: 1, max: 200 }, ' seats.']}
          defaultValue={{ plan: 'monthly', seats: 5 }}
          onChange={b.on('onChange')}
          says={({ plan, seats }) => (plan === 'yearly' ? `$${fmt(n(seats) * 120)} a year, two months free.` : `$${fmt(n(seats) * 12)} a month, $12 a seat.`)}
        />
      </div>
    </div>
  )
}
