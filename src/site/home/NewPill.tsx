'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from '@/lab/icons'

const NEW = [
  { href: '/ai-sdk', name: 'Works with AI SDK' },
  { href: '/templates/tandem', name: 'Tandem, with AI' },
  { href: '/blocks/agent-chat', name: 'Agent chat' },
  { href: '/blocks/integrations', name: 'Integrations' },
]

/** The announcement pill: the newest things take turns, rolling through a masked slot that never changes size, always at full ink. */
export function NewPill() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % NEW.length), 2600)
    return () => clearInterval(t)
  }, [])
  const n = NEW[i]
  return (
    <Link href={n.href} className="ring-focus group/pill inline-flex h-8 items-center gap-2 rounded-full bg-surface pl-1 pr-3 text-footnote text-ink-2 shadow-border transition-shadow duration-150 hover:shadow-[var(--elev-raised-hover)]">
      <span className="chip rounded-full px-2 text-caption font-medium leading-6 text-accent [--chip-wash:11%] [--chip:var(--accent)]">New</span>
      <span className="relative h-5 w-[120px] overflow-hidden text-left">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={n.href} className="absolute inset-0 flex items-center whitespace-nowrap text-ink" initial={{ y: '110%' }} animate={{ y: '0%' }} exit={{ y: '-110%' }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
            {n.name}
          </motion.span>
        </AnimatePresence>
      </span>
      <ArrowRight size={12} className="text-ink-3 transition-transform duration-150 group-hover/pill:translate-x-0.5" />
    </Link>
  )
}
