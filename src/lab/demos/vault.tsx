'use client'

import { useState } from 'react'
import { Vault } from '../components/vault/Vault'
import type { Result } from '../components/vault/Vault'
import { IRIS } from '@/lab/lib/iris'
import { useBench } from '@/lab/demos/bench'

export function VaultDemo() {
  const b = useBench()
  const [next, setNext] = useState<Result>('ok')
  const [k, setK] = useState(0)
  return (
    <div style={IRIS} className="flex size-full flex-col items-center justify-center gap-4 p-4">
      <Vault
        key={k}
        onSubmit={(p) => {
          b.log('onSubmit', p)
          return next
        }}
      />
      <div className="flex items-center gap-2 text-[12px] text-[var(--i-t3)]">
        Next result
        <span role="radiogroup" aria-label="Next result" className="flex rounded-full bg-[var(--i-tray)] p-0.5">
          {(['ok', 'declined', 'failed'] as const).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={next === r} onClick={() => setNext(r)} className={`h-7 rounded-full px-2.5 capitalize transition-colors ${next === r ? 'bg-[var(--i-sheet)] text-[var(--i-t1)] shadow-[0_0_0_0.5px_var(--i-edge)]' : 'hover:text-[var(--i-t1)]'}`}>
              {r === 'ok' ? 'Success' : r}
            </button>
          ))}
        </span>
        <button type="button" onClick={() => setK((v) => v + 1)} className="rounded-full px-2 py-1 font-medium text-[var(--i-t2)] hover:text-[var(--i-t1)]">
          Reset
        </button>
      </div>
    </div>
  )
}
