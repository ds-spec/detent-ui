'use client'

import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { spring } from '@/lab/lib/motion'
import { tap } from '@/lab/lib/feel'
import type { pressed } from '@/lab/lib/hand'

export function Segmented({ label, options, at, onPick, handlers }: {
  label: string
  options: { id: string; label: ReactNode; name?: string }[]
  at: number
  onPick: (i: number) => void
  handlers?: Pick<ReturnType<typeof pressed>, 'onPointerDownCapture' | 'onPointerUpCapture'> & { onKeyDownCapture: () => void }
}) {
  const plate = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex w-fit rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] p-0.5"
      {...handlers}
      onKeyDown={(e) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
        if (!d) return
        e.preventDefault()
        const i = (at + d + options.length) % options.length
        onPick(i)
        refs.current[i]?.focus()
      }}
    >
      {options.map((o, i) => (
        <button
          key={o.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === at}
          aria-label={o.name}
          tabIndex={i === at ? 0 : -1}
          onClick={() => (tap(), onPick(i))}
          className="ring-focus relative h-7 min-w-9 pointer-coarse:h-9 shrink-0 whitespace-nowrap rounded-full px-2.5 text-caption font-medium"
        >
          {i === at && <motion.span layoutId={plate} transition={spring.move} className="absolute inset-0 rounded-full bg-surface shadow-raised" />}
          <span className={`relative z-[1] transition-colors ${i === at ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}
