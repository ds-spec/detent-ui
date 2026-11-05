'use client'

import { useSideNew } from '../shell/side'

export function ProTag({ className = '' }: { className?: string }) {
  const side = useSideNew()
  return <span className={`inline-flex h-5 items-center px-2 text-caption font-semibold tracking-[0.02em] ${side ? 'rounded-[6px] bg-[var(--accent)] text-white' : 'rounded-full bg-ink text-surface'} ${className}`}>Pro</span>
}

export function FreeTag({ className = '' }: { className?: string }) {
  const side = useSideNew()
  return <span className={`inline-flex h-5 items-center ${side ? 'rounded-[6px]' : 'rounded-full'} bg-surface-2 px-2 text-caption font-semibold tracking-[0.02em] text-ink-2 ${className}`}>Free</span>
}
