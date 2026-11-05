'use client'

import type { ReactNode } from 'react'
import { PassingOver } from '@/lab/demos/loop'

export function PassOver({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <PassingOver.Provider value={true}>
      <div className={className}>{children}</div>
    </PassingOver.Provider>
  )
}
