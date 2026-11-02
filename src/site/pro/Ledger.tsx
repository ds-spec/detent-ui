'use client'

import { useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { PRO_BLOCKS, TOTAL_DAYS, TOTAL_MONTHS, daysFor } from '@/catalog/effort'
import { entry } from '@/catalog/meta'
import { PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { ArrowRight } from '@/lab/icons'
import { BLOCK_VIEWS, TEMPLATE_VIEWS } from '@pro'
import { Backdrop, Window } from '../blocks/Studio'
import { Fit } from '../Fit'

/*
 * Everything in Pro, as the bill you'd run up building it yourself: every component, block and
 * template by name, each with roughly how many working days it takes a good engineer to build to
 * this standard, drawn as a row of ticks, a tick a day. Each group adds up underneath, and the
 * whole of it at the foot, beside the price. Point at a row and the piece itself runs beside the
 * pointer; press it to go to its page.
 */

type Item = { id: string; name: string; line: string; days: number; href: string; stage: () => ReactNode }

const first = (s: string) => s.split(/(?<=\.)\s/)[0]

const GROUPS: { name: string; items: Item[] }[] = [
  {
    name: 'Components',
    items: PRO_COMPONENTS.map((id) => {
      const e = entry(id)!
      const Demo = DEMOS[id]
      return {
        id,
        name: e.name,
        line: e.short ?? first(e.line),
        days: daysFor(id),
        href: `/components/${id}`,
        stage: () => (
          <div className="absolute inset-0" style={{ background: 'var(--well-glow), var(--well)' }}>
            <Fit pad={20} max={0.7} min={0.3}>
              <Demo />
            </Fit>
          </div>
        ),
      }
    }),
  },
  {
    name: 'Blocks',
    items: PRO_BLOCKS.map((b) => {
      const View = BLOCK_VIEWS[b.id]
      return {
        id: b.id,
        name: b.name,
        line: b.short,
        days: daysFor(b.id),
        href: `/blocks/${b.id}`,
        stage: () => (
          <div className="absolute inset-0 p-4">
            <Backdrop tone="violet" />
            <div className="relative h-full" inert>
              <Window title={b.window} chrome={b.chrome === 'browser' ? 'browser' : 'titled'}>
                <View />
              </Window>
            </div>
          </div>
        ),
      }
    }),
  },
  {
    name: 'Templates',
    items: TEMPLATES.map((t) => {
      const View = TEMPLATE_VIEWS[t.id]
      return {
        id: `template-${t.id}`,
        name: t.name,
        line: t.kind,
        days: daysFor(t.id),
        href: `/templates/${t.id}`,
        stage: () => (
          <div className="absolute inset-0 p-4">
            <Backdrop tone="amber" />
            <div className="relative h-full" inert>
              <Window title={t.window} chrome="browser">
                <div className="h-full overflow-hidden">
                  <View />
                </div>
              </Window>
            </div>
          </div>
        ),
      }
    }),
  },
]
const ALL = GROUPS.flatMap((g) => g.items)
const MOST = Math.max(...ALL.map((i) => i.days))
/** How many of a group show on a phone before the rest are asked for. */
const FOLD = 6
const pro = PLANS[0]

export function Ledger() {
  const reduce = useReducedMotion()
  const [more, setMore] = useState<string[]>([])
  const [hot, setHot] = useState<string | null>(null)
  const timer = useRef(0)
  // The preview follows the pointer, a little behind it.
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 380, damping: 36 })
  const sy = useSpring(y, { stiffness: 380, damping: 36 })
  const follow = (e: PointerEvent) => {
    const w = 360
    const h = 250
    x.set(Math.min(innerWidth - w - 16, e.clientX + 28))
    y.set(Math.max(16, Math.min(innerHeight - h - 16, e.clientY - h / 2)))
  }
  const aim = (id: string, e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    if (!hot) {
      x.jump(Math.min(innerWidth - 376, e.clientX + 28))
      y.jump(Math.max(16, Math.min(innerHeight - 266, e.clientY - 125)))
    }
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setHot(id), hot ? 0 : 220)
  }
  const leave = () => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setHot(null), 100)
  }
  const item = hot ? ALL.find((i) => i.id === hot) : null

  return (
    <div className="overflow-hidden rounded-[28px] bg-surface shadow-[var(--card-edge)]" onPointerLeave={leave}>
      {GROUPS.map((g) => {
        const sum = g.items.reduce((n, i) => n + i.days, 0)
        const open = more.includes(g.name)
        return (
          <section key={g.name} aria-label={g.name} className="px-5 pb-4 pt-6 shadow-[inset_0_-1px_0_var(--line)] sm:px-8 sm:pt-8">
            <header className="flex items-baseline justify-between gap-4 pb-3">
              <h3 className="text-[19px] tracking-[-0.02em] text-ink">
                {g.name} <span className="tnum text-quiet">{g.items.length}</span>
              </h3>
              <p className="tnum text-[13.5px] text-ink-3">
                <span className="text-ink">{sum}</span> days
              </p>
            </header>
            <ul className="grid lg:grid-cols-2 lg:gap-x-12">
              {g.items.map((i, k) => (
                <li key={i.id} className={k >= FOLD && !open ? 'hidden lg:block' : ''}>
                  <Link
                    href={i.href}
                    onPointerEnter={(e) => aim(i.id, e)}
                    onPointerMove={follow}
                    className="ring-focus group/r flex h-14 items-center gap-4 rounded-[8px] shadow-[inset_0_1px_0_var(--line)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] text-ink">{i.name}</span>
                    </span>
                    {/* A tick a day: what it would take to build. */}
                    <span aria-hidden className="hidden h-4 items-end gap-[2px] sm:flex" style={{ width: MOST * 4 }}>
                      {Array.from({ length: i.days }, (_, d) => (
                        <span key={d} className={`w-[2px] rounded-full transition-colors duration-200 ${hot === i.id ? 'bg-ink' : 'bg-ink-3/40 group-hover/r:bg-ink'}`} style={{ height: (d + 1) % 5 === 0 ? 14 : 8 }} />
                      ))}
                    </span>
                    <span className="tnum w-[64px] shrink-0 text-right text-[13.5px] text-ink-2">{i.days} days</span>
                  </Link>
                </li>
              ))}
            </ul>
            {g.items.length > FOLD && !open && (
              <button type="button" onClick={() => setMore((m) => [...m, g.name])} className="ring-focus mt-2 flex h-9 items-center gap-1.5 rounded-full px-1 text-[13.5px] text-ink-2 hover:text-ink lg:hidden">
                All {g.items.length} {g.name.toLowerCase()}
                <ArrowRight size={13} />
              </button>
            )}
          </section>
        )
      })}

      {/* The whole of it, beside the price. */}
      <footer className="flex flex-col gap-6 bg-[var(--well)] px-5 py-7 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13.5px] text-ink-3">Built yourself, all of it</p>
          <p className="mt-1 flex items-baseline gap-3">
            <span className="tnum text-[clamp(44px,5vw,64px)] leading-none tracking-[-0.05em] text-ink">{TOTAL_DAYS}</span>
            <span className="text-[17px] text-ink-2">working days</span>
          </p>
          <p className="mt-2 text-[13.5px] text-ink-3">About {TOTAL_MONTHS} months of one good engineer’s time. Our estimate, and a careful one.</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-right">
            <span className="block text-[13.5px] text-ink-3">With Pro</span>
            <span className="tnum block text-[32px] leading-none tracking-[-0.04em] text-ink">${pro.price}</span>
          </p>
          <a href="#pricing" className="ring-focus flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
            {pro.cta}
          </a>
        </div>
      </footer>

      {/* The piece under the pointer, running, beside it. */}
      <AnimatePresence>
        {item && (
          <motion.div
            key="peek"
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-50 w-[360px] overflow-hidden rounded-[18px] bg-surface shadow-modal"
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 }}
          >
            <div className="relative h-[210px] overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div key={item.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {item.stage()}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between gap-3 px-3.5 pb-3 pt-2.5 shadow-[inset_0_1px_0_var(--line)]">
              <p className="truncate text-[13px] text-ink">{item.name}</p>
              <p className="tnum shrink-0 text-[12px] text-ink-3">{item.days} days</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
