'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

export const WRAP = 'mx-auto w-full max-w-[1040px] px-5'
export const H2 = 'text-center text-[clamp(30px,3.4vw,46px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink'
export const SECTION = 'py-20 sm:py-28'
export const PILL = 'ring-focus inline-flex h-[42px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-5 text-[14px] transition-[background-color,transform] duration-150 active:scale-[0.97]'
export const PILL_DARK = `${PILL} bg-ink text-surface`
export const PILL_SOFT = `${PILL} bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] text-ink hover:bg-[color-mix(in_oklch,var(--ink)_8%,transparent)]`
export const PILL_PRO = `${PILL} bg-[var(--accent)] text-white hover:bg-[color-mix(in_oklch,var(--accent)_90%,black)]`

export function ProBadge() {
  return <span className="rounded-[6px] bg-ink px-1.5 text-[11px] font-medium leading-[20px] text-surface">Pro</span>
}

/** A Detent leaf: the rounded sheet every home section sits on. */
export function Leaf({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="px-2.5 sm:px-5">
      <div className={`mx-auto max-w-[1440px] rounded-[26px] sm:rounded-[36px] ${className}`} style={{ background: 'var(--leaf)', boxShadow: 'var(--leaf-edge)' }}>
        {children}
      </div>
    </div>
  )
}

/** Segmented tabs, the way Detent's demos pick between options. */
export function Tabs({ items, value, onChange, label }: { items: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string }) {
  return (
    <div className="flex justify-center px-4">
      <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] p-1 [scrollbar-width:none]">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === value}
            onClick={() => onChange(t.id)}
            className={`ring-focus h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[14px] transition-[background-color,color,box-shadow] duration-150 ${t.id === value ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--line)]' : 'text-ink-3 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function useTab<T extends string>(first: T) {
  return useState<T>(first)
}

/** The grey card every preview sits in. */
export function Well({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[8px] bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)] ${className}`}>
      {children}
    </div>
  )
}
