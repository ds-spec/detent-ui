'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/*
 * The account, set the way Vercel sets its settings: the sections down the side, and each setting a
 * card of its own, a title and one line saying what it's for, what it holds, and a band across its
 * foot with where it stands on the left and the one thing to do on the right.
 */

/** One setting: a title, what it's for, what it holds, and a foot with its status and action. */
export function SettingsCard({ id, title, line, children, foot, action, tone = 'plain' }: { id?: string; title: string; line?: ReactNode; children?: ReactNode; foot?: ReactNode; action?: ReactNode; tone?: 'plain' | 'danger' }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`scroll-mt-24 overflow-hidden rounded-[12px] bg-surface shadow-[0_0_0_1px_var(--line)] ${tone === 'danger' ? 'shadow-[0_0_0_1px_color-mix(in_oklch,var(--danger)_28%,transparent)]' : ''}`}>
      <div className="p-5 sm:p-6">
        <h2 id={id ? `${id}-title` : undefined} className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {line && <p className="mt-1 text-[14px] leading-[1.5] text-ink-3">{line}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
      {(foot || action) && (
        <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-[color-mix(in_oklch,var(--ink)_3%,transparent)] px-5 py-3 shadow-[inset_0_1px_0_var(--line)] sm:px-6">
          <div className="min-w-0 text-[13px] text-ink-3">{foot}</div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </section>
  )
}

/** The small buttons that sit in a card's foot: the main one in ink, the rest outlined. */
export const SMALL = 'ring-focus inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-ink px-3 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50'
export const SMALL_QUIET = 'ring-focus inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-surface px-3 text-[13px] font-medium text-ink shadow-[0_0_0_1px_var(--line-strong)] transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.97] disabled:opacity-50'

/**
 * The sections down the side, the one in view marked as you scroll. On a phone they become a row
 * of pills across the top.
 */
export function SettingsNav({ items }: { items: [id: string, label: string][] }) {
  const [on, setOn] = useState(items[0]?.[0])
  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setOn(top.target.id)
      },
      { rootMargin: '-80px 0px -55% 0px' },
    )
    items.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) seen.observe(el)
    })
    return () => seen.disconnect()
  }, [items])
  return (
    <nav aria-label="Account sections" className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0">
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={on === id ? 'true' : undefined}
          className={`ring-focus shrink-0 rounded-[8px] px-3 py-2 text-[14px] transition-colors duration-150 ${on === id ? 'bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] font-medium text-ink' : 'text-ink-3 hover:bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] hover:text-ink'}`}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
