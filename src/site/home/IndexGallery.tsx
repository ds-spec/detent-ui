'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import type { Entry } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'
import { SIZE } from '@/catalog/sizes'
import { ArrowRight } from '@/lab/icons'
import { ProTag } from '../blocks/ProTag'
import { Fit } from '../Fit'
import { useNear } from '../near'
import { FAMILY_EVENT } from './FamilyTag'
import { useSite } from '../Providers'
import { watchLine } from '../line'

/**
 * The library as an index. Every component's name, set large, in one list; beside it a stage
 * that shows one of them at full size. Scroll the names past the reading line and the one on
 * it comes into ink and takes the stage. The scroll has detents: each name settles onto the
 * line with a small stop, and the stage takes the new component in one calm crossfade. Press a
 * name to bring it to the line; press it again, or its Open, to go to its page. What's on the
 * stage is named above it, so the way in never falls below the fold.
 *
 * Below 1024px there's no stage: each name carries its component underneath it.
 */

/** How long the line has to rest on a name before the stage changes, so a fast scroll doesn't load everything it passes. */
const SETTLE = 140

export function IndexGallery() {
  const { tick } = useSite()
  const [family, setFamily] = useState<string | null>(null)
  const [access, setAccess] = useState<'free' | 'pro' | null>(null)
  const fits = (e: Entry, a = access) => !a || (a === 'pro') === isProComponent(e.id)
  const list = ENTRIES.filter((e) => (!family || e.category === family) && fits(e))
  const groups = CATEGORIES.map((c) => ({ c, items: list.filter((e) => e.category === c.id) })).filter((g) => g.items.length)
  const [active, setActive] = useState(ENTRIES[0].id)
  const [stage, setStage] = useState(ENTRIES[0].id)
  const box = useRef<HTMLDivElement>(null)
  const now = useRef(active)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A family tag elsewhere on the page opens the index on that family.
  useEffect(() => {
    const go = (ev: Event) => {
      setFamily((ev as CustomEvent<string>).detail)
      // A family asked for by name shows whole: the price filter would only hide some of it.
      setAccess(null)
      document.getElementById('library')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
    window.addEventListener(FAMILY_EVENT, go)
    return () => window.removeEventListener(FAMILY_EVENT, go)
  }, [])

  // A name crossing the reading line becomes the current one; the stage follows once it rests there.
  useEffect(() => {
    const el = box.current
    if (!el) return
    return watchLine(el, [...el.querySelectorAll<HTMLElement>('[data-name]')], (row) => {
      const id = row.dataset.name!
      if (id === now.current) return
      now.current = id
      setActive(id)
      tick()
      if (settle.current) clearTimeout(settle.current)
      settle.current = setTimeout(() => setStage(id), SETTLE)
    })
  }, [family, access, tick])

  // A filter can take the current name away; the first of what's left stands in for it.
  const on = list.some((e) => e.id === active) ? active : list[0]?.id
  const shown = list.some((e) => e.id === stage) ? stage : list[0]?.id
  const current = ENTRIES.find((e) => e.id === shown)!

  // The row carries the offset that seats it on the reading line, so it's the row that scrolls.
  const toLine = (el: HTMLElement) => (el.closest('li') ?? el).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  const keys = (ev: KeyboardEvent<HTMLUListElement>) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
    const rows = [...(box.current?.querySelectorAll<HTMLElement>('[data-name]') ?? [])]
    const i = rows.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    ev.preventDefault()
    const next = rows[Math.min(rows.length - 1, Math.max(0, i + (ev.key === 'ArrowDown' ? 1 : -1)))]
    next.focus({ preventScroll: true })
    toLine(next)
  }

  return (
    <div ref={box} className="index-detents grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="min-w-0">
        {/* Free and Pro narrow the list by what it costs; families narrow it to one kind. Counts follow both, and a pairing that would leave nothing can't be picked. */}
        <div role="group" aria-label="Price" className="flex gap-1.5">
          {(['free', 'pro'] as const).map((a) => (
            <Chip key={a} on={access === a} n={ENTRIES.filter((e) => (!family || e.category === family) && fits(e, a)).length} onClick={() => setAccess((x) => (x === a ? null : a))}>
              {a === 'free' ? 'Free' : 'Pro'}
            </Chip>
          ))}
        </div>
        <div role="group" aria-label="Families" className="mt-1.5 flex flex-wrap gap-1.5">
          {[{ id: null, name: 'All', n: ENTRIES.filter((e) => fits(e)).length }, ...CATEGORIES.map((c) => ({ id: c.id, name: c.name, n: ENTRIES.filter((e) => e.category === c.id && fits(e)).length }))].map((f) => (
            <Chip key={f.name} on={family === f.id} n={f.n} onClick={() => setFamily(f.id)} dot={f.id ? `var(--${f.id})` : undefined}>
              {f.name}
            </Chip>
          ))}
        </div>

        <ul aria-label="Components" onKeyDown={keys} className="lg:pb-[calc(100dvh-180px)]">
          {groups.map(({ c, items }) => (
            <li key={c.id}>
              <p className="flex items-center gap-2 pb-2 pl-7 pt-12 text-footnote text-ink-3">
                <span className="size-1.5 rounded-full" style={{ background: `var(--${c.id})` }} />
                {c.name}
                <span className="tnum">{items.length}</span>
              </p>
              <ul>
                {items.map((e) => (
                  <Row key={e.id} e={e} on={e.id === on} onPick={toLine} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* The stage: one component, as large as it can be shown, seated as it arrives. */}
      <div className="sticky top-24 hidden h-[calc(100dvh-128px)] min-h-[560px] lg:block">
        <div className="relative h-full overflow-hidden rounded-[32px] bg-card shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line))]">
          <Caption e={current} />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={current.id} className="absolute inset-x-0 bottom-0 top-[76px]" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.2, 0.9, 0.25, 1] } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <Stage e={current} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/** A filter. Its count keeps two digits' room, so changing filters never reflows the row; one that would show nothing rests disabled. */
function Chip({ on, n, dot, onClick, children }: { on: boolean; n: number; dot?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} disabled={!n && !on} onClick={onClick} className={`ring-focus flex h-8 items-center gap-1.5 rounded-full px-3 text-footnote transition-colors disabled:opacity-35 ${on ? 'bg-surface-2 font-medium text-ink' : 'text-ink-3 enabled:hover:text-ink-2'}`}>
      {dot && <span className="size-1.5 rounded-full" style={{ background: dot }} />}
      {children}
      <span className="tnum min-w-[2ch] text-caption text-ink-3">{n}</span>
    </button>
  )
}

/** One name in the index. On the line it's ink with a tick beside it; off it, it waits in grey. */
function Row({ e, on, onPick }: { e: Entry; on: boolean; onPick: (el: HTMLElement) => void }) {
  const pro = isProComponent(e.id)
  const router = useRouter()
  return (
    <li className="relative lg:snap-start lg:scroll-mt-[calc(var(--read-line,150px)-30px)]">
      <button
        type="button"
        data-name={e.id}
        aria-current={on ? 'true' : undefined}
        aria-label={on ? `Open ${e.name}` : undefined}
        onClick={(ev) => (on ? router.push(`/components/${e.id}`) : onPick(ev.currentTarget))}
        className="ring-focus group relative hidden h-[60px] w-full items-center gap-3 rounded-[12px] pl-7 pr-24 text-left lg:flex"
      >
        {on && <motion.span layoutId="index-tick" aria-hidden className="absolute left-1 top-[calc(50%-1px)] h-[2px] w-3 rounded-full bg-[var(--accent)]" transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
        <span className={`truncate text-[clamp(28px,2.7vw,40px)] font-normal leading-[1.1] tracking-[-0.045em] transition-colors duration-200 ${on ? 'text-ink' : 'text-ink/25 group-hover:text-ink/50'}`}>{e.name}</span>
        {pro && <ProTag className={`shrink-0 transition-opacity duration-200 ${on ? '' : 'opacity-40'}`} />}
      </button>
      {/* The way in, right on the reading line. */}
      <Link
        href={`/components/${e.id}`}
        tabIndex={on ? 0 : -1}
        aria-hidden={!on}
        className={`ring-focus absolute right-0 top-[30px] hidden h-8 -translate-y-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 text-footnote font-medium text-surface transition-[opacity,transform] duration-200 lg:flex ${on ? 'opacity-100' : 'pointer-events-none translate-x-[-4px] opacity-0'}`}
      >
        Open
        <ArrowRight size={13} />
      </Link>
      <Mobile e={e} pro={pro} />
    </li>
  )
}

/** The component on the stage, at full size when it fits. */
function Stage({ e }: { e: Entry }) {
  const Demo = DEMOS[e.id]
  return Demo ? (
    <Fit pad={44} max={e.zoom ?? 1} min={0.55}>
      <Demo />
    </Fit>
  ) : null
}

/** What's on the stage, in one fixed line across its top: its name, its plan, what it does, and the way in. */
function Caption({ e }: { e: Entry }) {
  const pro = isProComponent(e.id)
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-[76px] items-center gap-4 px-7">
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <p className="flex items-center gap-2 text-callout font-medium text-ink">
              {e.name}
              <span className={`rounded-full px-1.5 text-[10.5px] font-semibold leading-[17px] ${pro ? 'bg-ink text-surface' : 'bg-surface-2 text-ink-2'}`}>{pro ? 'Pro' : 'Free'}</span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <Link href={`/components/${e.id}`} className="ring-focus flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-4 text-footnote font-medium text-ink shadow-border transition-shadow hover:shadow-[var(--elev-raised-hover)]">
        Open
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/** On a phone: the name, then its component right under it, running once it's near. */
function Mobile({ e, pro }: { e: Entry; pro: boolean }) {
  const card = useRef<HTMLDivElement>(null)
  const near = useNear(card)
  const Demo = DEMOS[e.id]
  const [w, h] = SIZE[e.id] ?? [420, 360]
  return (
    <div className="pb-8 lg:hidden">
      <Link href={`/components/${e.id}`} className="ring-focus flex items-center gap-2 rounded-[10px] pb-3 pt-2">
        <span className="text-[28px] font-normal leading-[1.1] tracking-[-0.045em] text-ink">{e.name}</span>
        {pro && <ProTag />}
        <ArrowRight size={16} className="ml-auto text-ink-3" />
      </Link>
      {/* Not a link itself: the component inside has its own buttons and links. */}
      <div ref={card} className="relative overflow-hidden rounded-[24px] bg-card" style={{ height: `clamp(${Math.round(h * 0.62 + 40)}px, calc(${(h / w).toFixed(4)} * (100vw - 80px) + 40px), ${h + 40}px)` }}>
        {near && Demo && (
          <Fit pad={20} max={1} min={0.62}>
            <Demo />
          </Fit>
        )}
      </div>
    </div>
  )
}
