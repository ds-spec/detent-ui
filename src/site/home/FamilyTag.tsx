'use client'

import type { ReactNode } from 'react'
import { Chart, Pencil, Orbit } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'

const LOOK: Record<string, { icon: ReactNode; color: string }> = {
  agents: { icon: <Orbit size={14} />, color: 'var(--agents)' },
  data: { icon: <Chart size={14} />, color: 'var(--data)' },
  inputs: { icon: <Pencil size={14} />, color: 'var(--inputs)' },
}

export const FAMILY_EVENT = 'detent:family'

export function FamilyTag({ id, children }: { id: string; children: ReactNode }) {
  const { icon, color } = LOOK[id]
  return (
    <button
      type="button"
      data-family={id}
      onPointerDown={tap}
      onClick={() => window.dispatchEvent(new CustomEvent(FAMILY_EVENT, { detail: id }))}
      className="ring-focus inline-flex h-7 -translate-y-px items-center gap-1 rounded-full px-2.5 align-middle text-body font-medium transition-[background-color] duration-150 [background:color-mix(in_oklch,var(--tag)_12%,transparent)] hover:[background:color-mix(in_oklch,var(--tag)_18%,transparent)]"
      style={{ color, ['--tag' as string]: color }}
    >
      {icon}
      {children}
    </button>
  )
}
