'use client'

import type { ReactNode } from 'react'
import { PassingOver } from '@/lab/demos/loop'

/**
 * A live demo sitting in a page you're scrolling. It tells whatever's inside, so a drum that wants
 * every vertical swipe on its own page takes its `passOver` prop here.
 */
export function PassOver({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <PassingOver.Provider value={true}>
      <div className={className}>{children}</div>
    </PassingOver.Provider>
  )
}
