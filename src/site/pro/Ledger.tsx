'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { PRO_BLOCKS, TOTAL_DAYS, daysFor } from '@/catalog/effort'
import { entry } from '@/catalog/meta'
import { PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { ArrowRight } from '@/lab/icons'
import { RollingText } from '@/lab/ui/RollingText'
import { BLOCK_VIEWS } from '@/pro/blocks/registry'
import { TEMPLATES } from '@/templates/meta'
import { TEMPLATE_VIEWS } from '@/templates/registry'
import { Backdrop, Window } from '../blocks/Studio'
import { Fit } from '../Fit'
import { useSite } from '../Providers'
import { watchLine } from '../line'

/**
 * Everything in Pro, as a ledger: every component, block and template by name, each with roughly
 * how long it takes a good engineer to build to this standard. Scroll the names past the reading
 * line and the one on it runs, large, on the stage beside them, while the total underneath adds
 * up what you'd have spent so far. It settles on the whole of it, and the price.
 *
 * Below 1024px there's no room for a stage, so it reads as a ledger: each group's first few by
 * name and days, a link to each, and the rest a press away, so the prices are never far below.
 */

type Item = { id: string; name: string; kind: 'Component' | 'Block' | 'Template'; line: string; days: number; stage: ReactNode; href: string }

const first = (s: string) => s.split(/(?<=\.)\s/)[0]

const ITEMS: Item[] = [
  ...PRO_COMPONENTS.map((id) => {
    const e = entry(id)!
    const Demo = DEMOS[id]
    return {
      id,
      name: e.name,
      kind: 'Component' as const,
      href: `/components/${id}`,
      line: first(e.line),
      days: daysFor(id),
      stage: (
        <Fit pad={44} max={e.zoom ?? 1.1} min={0.5}>
          <Demo />
        </Fit>
      ),
    }
  }),
  ...PRO_BLOCKS.map((b) => {
    const View = BLOCK_VIEWS[b.id]
    return {
      id: b.id,
      name: b.name,
      kind: 'Block' as const,
      href: `/blocks/${b.id}`,
      line: first(b.line),
      days: daysFor(b.id),
      stage: (
        <div className="absolute inset-0 p-6">
          <Backdrop />
          <div className="relative h-full">
            <Window title={b.window} chrome={b.chrome}>
              <View />
            </Window>
          </div>
        </div>
      ),
    }
  }),
  ...TEMPLATES.map((t) => {
    const View = TEMPLATE_VIEWS[t.id]
    return {
      id: `template-${t.id}`,
      name: t.name,
      kind: 'Template' as const,
      href: `/templates/${t.id}`,
      line: first(t.line),
      days: daysFor(t.id),
      stage: (
        <div className="absolute inset-0 p-6">
          <Backdrop />
          <div className="relative h-full" inert>
            <Window title={t.window} chrome="browser">
              <div className="h-full overflow-y-auto [scrollbar-width:none]">
                <View />
              </div>
            </Window>
          </div>
        </div>
      ),
    }
  }),
]
const TOTAL = TOTAL_DAYS
const GROUPS = (['Component', 'Block', 'Template'] as const).map((k) => ({ k, items: ITEMS.filter((i) => i.kind === k) }))

/** How many of a group show below 1024px before the rest are asked for. */
const FOLD = 6

export function Ledger() {
  const { tick } = useSite()
  const [more, setMore] = useState<string[]>([])
  const [at, setAt] = useState(0)
  const [stage, setStage] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const now = useRef(0)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The name on the reading line runs on the stage; the total follows it.
  useEffect(() => {
    const el = box.current
    if (!el) return
    return watchLine(el, [...el.querySelectorAll<HTMLElement>('[data-at]')], (row) => {
      const i = Number(row.dataset.at)
      if (i === now.current) return
      now.current = i
      setAt(i)
      tick()
      if (settle.current) clearTimeout(settle.current)
      settle.current = setTimeout(() => setStage(i), 160)
    })
  }, [tick])

  // What you'd have spent, building everything up to the one on the line.
  const spent = ITEMS.slice(0, at + 1).reduce((n, i) => n + i.days, 0)
  const item = ITEMS[stage]
  const end = at === ITEMS.length - 1
  let n = -1

  return (
    <div ref={box} className="index-detents grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <ol aria-label="Everything in Pro" className="lg:pb-[calc(100dvh-180px)]">
        {GROUPS.map(({ k, items }) => (
          <li key={k}>
            <p className="flex items-center justify-between pb-2 pl-7 pr-1 pt-12 text-footnote text-ink-3 first:pt-0">
              <span>
                {k === 'Component' ? 'Components' : k === 'Block' ? 'Blocks, whole screens' : 'Templates, pages and apps'} <span className="tnum">{items.length}</span>
              </span>
              <span>Days to build, roughly</span>
            </p>
            <ol>
              {items.map((it, j) => {
                const i = ++n
                const on = i === at
                const folded = j >= FOLD && !more.includes(k)
                return (
                  <li key={it.id} className={`lg:snap-start lg:scroll-mt-[calc(var(--read-line,150px)-28px)] ${folded ? 'max-lg:hidden' : ''}`}>
                    <button type="button" data-at={i} onClick={(e) => e.currentTarget.closest('li')!.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="ring-focus group relative hidden h-[56px] w-full items-center gap-4 rounded-[12px] pl-7 pr-1 text-left lg:flex">
                      {on && <motion.span layoutId="ledger-tick" aria-hidden className="absolute left-1 top-[calc(50%-1px)] h-[2px] w-3 rounded-full bg-[var(--accent)]" transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
                      <span className={`min-w-0 flex-1 truncate text-[clamp(24px,2.4vw,34px)] font-normal leading-[1.1] tracking-[-0.045em] transition-colors duration-200 ${on ? 'text-ink' : 'text-ink/25 group-hover:text-ink/50'}`}>{it.name}</span>
                      <span className={`tnum shrink-0 font-mono text-[13px] transition-colors duration-200 ${on ? 'text-ink' : 'text-ink-3/60'}`}>{it.days}d</span>
                    </button>
                    <Row it={it} />
                  </li>
                )
              })}
            </ol>
            {items.length > FOLD && !more.includes(k) && (
              <button type="button" onClick={() => setMore((m) => [...m, k])} className="ring-focus mt-3 flex h-10 items-center gap-2 rounded-full bg-surface-2 px-4 text-footnote font-medium text-ink-2 transition-colors hover:text-ink lg:hidden">
                Show all {items.length}
                <span className="tnum text-ink-3">+{items.length - FOLD}</span>
              </button>
            )}
          </li>
        ))}
        {/* On a phone there's no stage beside the list, so the sum is told at the end of it. */}
        <li className="mt-6 rounded-[24px] bg-card p-6 lg:hidden">
          <p className="text-footnote text-ink-3">To build all of it yourself, about</p>
          <p className="tnum mt-1 text-[32px] leading-none tracking-[-0.03em] text-ink">
            {TOTAL} <span className="text-callout text-ink-3">working days</span>
          </p>
          <Link href="#pricing" className="ring-focus mt-5 flex h-11 items-center justify-center rounded-full bg-ink px-5 text-callout font-medium text-surface">
            All of it · ${PLANS[1].price}
          </Link>
        </li>
      </ol>

      {/* The stage, and the ledger under it. */}
      <div className="sticky top-24 hidden h-[calc(100dvh-128px)] min-h-[600px] flex-col gap-3 lg:flex">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] bg-card shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line))]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={item.id} className="absolute inset-0" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.2, 0.9, 0.25, 1] } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              {item.stage}
            </motion.div>
          </AnimatePresence>
        </div>
        <Tally item={ITEMS[at]} spent={spent} end={end} />
      </div>
    </div>
  )
}

/** Below 1024px: one line of the ledger, its name and days, and the way to its page. */
function Row({ it }: { it: Item }) {
  return (
    <Link href={it.href} className="ring-focus group flex h-14 items-center gap-3 rounded-[10px] shadow-[inset_0_-1px_0_var(--line)] lg:hidden">
      <span className="min-w-0 flex-1 truncate text-[22px] font-normal leading-[1.1] tracking-[-0.04em] text-ink">{it.name}</span>
      <span className="tnum shrink-0 font-mono text-[13px] text-ink-3">{it.days}d</span>
      <ArrowRight size={15} className="shrink-0 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  )
}

/** The running total: what's on the line and what it took, and everything so far against the whole. */
function Tally({ item, spent, end }: { item: Item; spent: number; end: boolean }) {
  const [pro, all] = PLANS
  return (
    <div className="flex h-[92px] shrink-0 items-center gap-6 rounded-[24px] bg-surface px-6 shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <p className="flex items-center gap-2 text-callout font-medium text-ink">
              {item.name}
              <span className="rounded-full bg-surface-2 px-1.5 text-[10.5px] font-medium leading-[17px] text-ink-2">{item.kind}</span>
            </p>
            <p className="mt-0.5 truncate text-footnote text-ink-3">{item.line}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="w-[230px] shrink-0">
        <p className="flex items-baseline justify-between text-caption text-ink-3">
          <span>To build yourself, about</span>
          <span className="tnum">of {TOTAL}</span>
        </p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="tnum text-[26px] leading-none tracking-[-0.03em] text-ink">
            <RollingText text={String(spent)} />
          </span>
          <span className="text-footnote text-ink-3">working days</span>
        </p>
        <span className="mt-2 block h-[3px] overflow-hidden rounded-full bg-surface-2">
          <motion.span className="block h-full origin-left rounded-full bg-[var(--accent)]" initial={false} animate={{ scaleX: spent / TOTAL }} transition={{ type: 'spring', stiffness: 260, damping: 34 }} />
        </span>
      </div>
      <div className="grid w-[150px] shrink-0">
        <Link href="#pricing" className={`ring-focus col-start-1 row-start-1 flex h-10 items-center justify-center rounded-full bg-ink px-4 text-footnote font-medium text-surface transition-opacity duration-300 hover:opacity-90 ${end ? '' : 'pointer-events-none opacity-0'}`} tabIndex={end ? 0 : -1}>
          All of it · ${all.price}
        </Link>
        <span aria-hidden={end} className={`col-start-1 row-start-1 text-right text-caption text-ink-3 transition-opacity duration-300 ${end ? 'opacity-0' : ''}`}>
          Pro is ${pro.price}, once.
          <br />
          With templates, ${all.price}.
        </span>
      </div>
    </div>
  )
}
