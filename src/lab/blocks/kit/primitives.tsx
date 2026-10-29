'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Tone } from '@/lab/ui/Intelligence'
import { ease, press } from '@/lab/lib/motion'

export { Hover } from '@/lab/ui/Hover'

/** A soft wash of a hue with a deep tone on it: an identity colour for a source, a person, a status. */
export const wash = (hue: number) => ({
  background: `light-dark(oklch(0.94 0.04 ${hue}), oklch(0.26 0.065 ${hue}))`,
  color: `light-dark(oklch(0.47 0.13 ${hue}), oklch(0.86 0.08 ${hue}))`,
  // In dark the wash deepens and a ring of the hue draws its edge, so it stays crisp on black.
  boxShadow: `inset 0 0 0 1px light-dark(transparent, oklch(0.75 0.12 ${hue} / 0.38))`,
})

/**
 * A chat's name. Untitled, it's a quiet "New chat". When it gets a title while you watch, the
 * letters arrive in the Intelligence colours and cool to ink; a title that was already there
 * is just shown.
 */
export function Name({ title, tone = 'loud' }: { title: string | null; tone?: Tone }) {
  // The title it had when it first showed: a chat that already had one doesn't play its arrival.
  const [born] = useState(title)
  const reduce = useReducedMotion()
  if (!title) return <span className="text-ink-3">New chat</span>
  if (born !== null || reduce) return <>{title}</>
  const letters = [...title]
  const settle = 0.25 + letters.length * 0.022
  return (
    <span className="relative inline-block max-w-full truncate align-bottom">
      <span className="sr-only">{title}</span>
      <motion.span aria-hidden className="block truncate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: settle, duration: 0.7, ease: ease.out }}>
        {title}
      </motion.span>
      <motion.span aria-hidden className={`absolute inset-0 block truncate ${tone === 'loud' ? 'ai-text' : 'text-ink-3'}`} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: settle, duration: 0.7, ease: ease.out }}>
        {letters.map((c, i) => (
          <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.022, duration: 0.18 }}>
            {c}
          </motion.span>
        ))}
      </motion.span>
    </span>
  )
}

/** The streaming caret: in the spectrum the first time, in ink after that. */
export function Caret({ tone, small = false }: { tone: Tone; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`ml-[3px] inline-block w-[2px] translate-y-[3px] rounded-full motion-safe:animate-[caret_1.05s_infinite] ${small ? 'h-[15px]' : 'h-[17px]'} ${tone === 'loud' ? 'bg-[linear-gradient(to_bottom,var(--ai-ink-1),var(--ai-ink-3))] shadow-[0_0_10px_var(--ai-2)]' : 'bg-ink-2'}`}
    />
  )
}

/** A dot that says something's working: the spectrum the first time, ink after that. */
export function LiveDot({ tone, label }: { tone: Tone; label?: string }) {
  return <span aria-label={label} className={`size-1.5 shrink-0 rounded-full motion-safe:animate-pulse ${tone === 'loud' ? 'bg-[linear-gradient(135deg,var(--ai-1),var(--ai-3))] shadow-[0_0_8px_var(--ai-2)]' : 'bg-ink-3'}`} />
}

/** Mini effort bars in a model's colour. */
export function Bars({ hue, level = 2, small = true }: { hue: number; level?: number; small?: boolean }) {
  const h = small ? [4, 6, 8, 10] : [7, 11, 15, 19]
  return (
    <span aria-hidden className={`flex items-end ${small ? 'h-2.5 gap-[1.5px]' : 'h-[19px] gap-[3px]'}`}>
      {h.map((px, i) => (
        <span key={i} className={`rounded-full ${small ? 'w-[2.5px]' : 'w-[5px]'}`} style={{ height: px, background: i <= level ? `light-dark(oklch(0.56 0.16 ${hue}), oklch(0.76 0.12 ${hue}))` : 'var(--surface-3)' }} />
      ))}
    </span>
  )
}

export type MenuItem = { id: string; label: string; note?: string; icon?: ReactNode; trail?: ReactNode }

/**
 * A floating list: a solid sheet, a plate that glides to the active row, one line of note under each
 * label. Keyboard and pointer share one highlight. The owner positions it.
 */
export function Menu({ items, active, onActive, onPick, title, className = '', plate }: { items: MenuItem[]; active: number; onActive: (i: number) => void; onPick: (i: number) => void; title?: string; className?: string; plate: string }) {
  return (
    <motion.div
      role="listbox"
      className={`absolute z-30 rounded-[11px] bg-surface p-1.5 shadow-modal ${className}`}
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12, ease: ease.exit } }}
      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
      onPointerDown={(e) => e.preventDefault()}
    >
      {title && <p className="px-2.5 pb-1 pt-1.5 text-caption text-ink-3">{title}</p>}
      {items.length === 0 && <p className="px-2.5 py-2 text-footnote text-ink-3">Nothing matches</p>}
      {items.map((it, i) => (
        <button key={it.id} type="button" role="option" aria-selected={i === active} onPointerEnter={() => onActive(i)} onClick={() => onPick(i)} className="relative flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left">
          {i === active && <motion.span layoutId={plate} className="absolute inset-0 rounded-[7px] bg-surface-2" transition={{ type: 'spring', stiffness: 700, damping: 48 }} />}
          {it.icon && <span className="relative flex shrink-0">{it.icon}</span>}
          <span className="relative min-w-0 flex-1">
            <span className="block truncate text-callout text-ink">{it.label}</span>
            {it.note && <span className="block truncate text-caption text-ink-3">{it.note}</span>}
          </span>
          {it.trail && <span className="relative shrink-0">{it.trail}</span>}
        </button>
      ))}
    </motion.div>
  )
}

/** Closes its menu on a press anywhere outside its parent, or on Escape. */
export function Popover({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const down = (e: PointerEvent) => !box.current?.parentElement?.contains(e.target as Node) && onClose()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [onClose])
  return <div ref={box}>{children}</div>
}

/** A round icon button for quiet actions: copy, rate, refresh. */
export function Act({ label, on, onClick, children, className = '' }: { label: string; on?: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button type="button" whileTap={press} aria-label={label} aria-pressed={on} title={label} onClick={onClick} className={`ring-focus flex size-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-2 hover:text-ink ${on ? 'text-ink' : ''} ${className}`}>
      {children}
    </motion.button>
  )
}

/** A small status label: a dot and a word, in the colour of what it means. */
export function Status({ tone, children, live }: { tone: 'ok' | 'warn' | 'danger' | 'ink' | 'ai'; children: ReactNode; live?: Tone }) {
  const c = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn-ink)' : tone === 'danger' ? 'var(--danger)' : 'var(--ink-2)'
  const bg = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--ink)'
  return (
    <span className={`chip inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-caption font-medium ${tone === 'ai' ? 'chip-plain' : ''}`} style={{ color: tone === 'ai' ? 'var(--ink-2)' : c, ['--chip' as string]: bg }}>
      {tone === 'ai' ? <LiveDot tone={live ?? 'quiet'} /> : <span className="size-1.5 rounded-full" style={{ background: bg }} />}
      {children}
    </span>
  )
}

/** Keeps a ref pointed at the latest value, for callbacks that outlive a render. */
export function useLatest<T>(v: T) {
  const r = useRef(v)
  useLayoutEffect(() => {
    r.current = v
  })
  return r
}

/**
 * Buttons in the Pro apps: small, quiet, one weight each. Primary is ink with a thread of light
 * on its top edge and is used once per view; secondary is a soft fill, never an outline; ghost is
 * text that fills on hover. Controls are told apart by fill, not by borders.
 */
export const btn = {
  primary: 'ring-focus inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] bg-ink px-3 text-footnote font-medium text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.18)] transition-opacity hover:opacity-90 disabled:opacity-40',
  secondary: 'lit ring-focus inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] bg-[color-mix(in_oklch,var(--ink)_5.5%,transparent)] px-3 text-footnote font-medium text-ink transition-colors hover:bg-[color-mix(in_oklch,var(--ink)_9%,transparent)] disabled:text-ink-3',
  ghost: 'ring-focus inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-footnote font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink',
}

/** Where you are in a list: a soft wash of the app's accent with its text in the accent's ink, and light on its top edge. */
export const selectedRow = 'lit bg-[color-mix(in_oklch,var(--accent)_11%,transparent)]'
export const selectedText = 'text-[var(--accent-ink)]'
