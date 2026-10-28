'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import type { Entry } from '@/catalog/meta'
import { PRO_COMPONENTS, isProComponent } from '@/catalog/pro'
import { ArrowRight, ArrowUpRight } from '@/lab/icons'
import { Fit } from '@/site/Fit'
import { GRAIN } from './lights'

/*
 * The library on the home page: eight parts, shown big. Two to a row, a wide one beside a narrow
 * one, the sides swapping each row, so it reads as a wall of prints rather than a grid of tiles.
 *
 * Each part is a card. Most of it is a well tinted with one of the four lights' colours, softened,
 * with the part running in the middle at its real size. Along the foot: its family and whether it's
 * free, its name, one line, and the way to its page. Under the wall, the way to all of them.
 */

const FREE = ENTRIES.length - PRO_COMPONENTS.length

/** The eight, row by row: each pair is wide then narrow, or narrow then wide. Four free, four Pro. */
const ROWS: [string, string][] = [
  ['answer', 'approval'],
  ['signature', 'table'],
  ['toasts', 'presence'],
  ['trace', 'scaffold'],
]

/**
 * The wells take the four lights' colours, set so no two neighbours share one: the colour gathered
 * in one corner and the next one's wash opposite, on the well's own paper. In dark the same
 * colours sit deeper, as light in a dark room.
 */
const HUES: [string, string][] = [
  ['#4a72ff', '#8a63ff'],
  ['#8a63ff', '#f2558a'],
  ['#f2558a', '#ff9a3c'],
  ['#ff9a3c', '#4a72ff'],
]
const ORDER = [0, 1, 2, 3, 1, 0, 3, 2]
const well = (n: number) => {
  const [a, b] = HUES[ORDER[(n - 1) % ORDER.length]]
  return `var(--well-glow), radial-gradient(70% 80% at 100% 0%, color-mix(in oklch, ${a} var(--well-tint), transparent) 0%, transparent 64%), radial-gradient(70% 70% at 0% 100%, color-mix(in oklch, ${b} calc(var(--well-tint) * 0.55), transparent) 0%, transparent 68%), var(--well)`
}

export function HomeLibrary() {
  return (
    <section id="library" className="scroll-mt-20 px-2.5 sm:px-5">
      <style>{CSS}</style>
      <div className="relative overflow-hidden rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--paper)', boxShadow: 'var(--leaf-edge)' }}>
        <div className="relative mx-auto max-w-[1440px] px-3 pb-6 pt-20 sm:px-8 sm:pb-8 sm:pt-28">
          <div className="flex flex-col items-center px-2 text-center">
            <h2 className="text-[clamp(38px,4.2vw,62px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
              These aren’t screenshots.
              <br />
              <span className="text-quiet">Go on, use one.</span>
            </h2>
            <p className="mt-5 max-w-[480px] text-balance text-[16px] leading-[1.6] text-ink-3">
              Eight from the library, live on this page: half free under MIT, half from Pro. <span className="text-ink">All {ENTRIES.length}</span> are a click away.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:mt-16">
            {ROWS.map(([a, b], r) => (
              <div key={a} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                {[a, b].map((id, k) => {
                  const e = ENTRIES.find((x) => x.id === id)
                  return e ? <Plate key={id} e={e} n={r * 2 + k + 1} wide={(k === 0) === (r % 2 === 0)} /> : null
                })}
              </div>
            ))}
          </div>

          <SeeAll />
        </div>
      </div>
    </section>
  )
}

function Plate({ e, n, wide }: { e: Entry; n: number; wide: boolean }) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement | null>(null)
  const near = useInView(box, { margin: '400px' })
  const Demo = DEMOS[e.id]
  const pro = isProComponent(e.id)
  const family = CATEGORIES.find((c) => c.id === e.category)?.name ?? ''
  return (
    <motion.div
      ref={box}
      className={`group/plate relative flex h-[520px] flex-col rounded-[28px] bg-surface p-2 shadow-[var(--card-edge)] transition-[box-shadow,transform] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--card-lift)] active:scale-[0.995] sm:h-[600px] ${wide ? 'lg:col-span-7' : 'lg:col-span-5'}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
    >
      <Link href={`/components/${e.id}`} aria-label={`${e.name}: ${e.short ?? e.line}`} className="ring-focus absolute inset-0 z-[1] rounded-[inherit]" />

      {/* The well, with the part running at its real size. */}
      <div aria-hidden inert className="pointer-events-none relative isolate min-h-0 flex-1 overflow-hidden rounded-[22px]" style={{ background: well(n) }}>
        <div className="library-grain absolute inset-0 -z-10" />
        <div aria-hidden className="absolute inset-0 rounded-[22px] shadow-[inset_0_0_0_1px_var(--line)]" />
        <div className="absolute inset-0 transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover/plate:scale-[1.015]">
          {near && Demo ? (
            <Fit pad={44} max={1} min={0.5}>
              <Demo />
            </Fit>
          ) : null}
        </div>
      </div>

      {/* The caption: its family and whether it's free, the name and its line, and the way in. */}
      <div aria-hidden className="pointer-events-none flex items-end gap-4 px-3 pb-2 pt-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
            {family}
            <span className="size-[3px] rounded-full bg-current opacity-50" />
            <span className={pro ? 'text-ink' : ''}>{pro ? 'Pro' : 'Free'}</span>
          </p>
          {/* The name and its line: one line on wide screens, stacked on a phone so neither is cut. */}
          <p className="mt-2 text-[19px] leading-6 tracking-[-0.015em] text-ink sm:truncate">
            {e.name}
            <span className="hidden text-quiet sm:inline"> — {e.short ?? e.line}</span>
            <span className="block text-[15px] leading-5 text-quiet sm:hidden">{e.short ?? e.line}</span>
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[background-color,color,box-shadow] duration-200 group-hover/plate:bg-ink group-hover/plate:text-surface group-hover/plate:shadow-none">
          <ArrowUpRight size={15} className="transition-transform duration-200 group-hover/plate:-translate-y-px group-hover/plate:translate-x-px" />
        </span>
      </div>
    </motion.div>
  )
}

/**
 * Under the wall, the way through to everything: how much more there is, set as a ruler of ticks,
 * one per part, Pro in ink, and the button that opens the full library.
 */
function SeeAll() {
  return (
    <div className="mt-3 flex flex-col items-start gap-6 rounded-[28px] bg-surface px-6 py-6 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:px-8 sm:py-7">
      <div className="min-w-0 flex-1">
        <p className="text-[22px] leading-7 tracking-[-0.02em] text-ink">
          {ENTRIES.length} components, every one live.
          <span className="text-quiet">
            {' '}
            {FREE} free for good, {PRO_COMPONENTS.length} in Pro.
          </span>
        </p>
        <span aria-hidden className="mt-4 flex h-3.5 max-w-[560px] items-end justify-between">
          {CATEGORIES.flatMap((c) => ENTRIES.filter((x) => x.category === c.id)).map((x, i) => (
            <span key={x.id} className={`w-px shrink-0 rounded-full ${isProComponent(x.id) ? 'bg-ink' : 'bg-[var(--line-strong)]'}`} style={{ height: i % 5 === 0 ? 14 : 8 }} />
          ))}
        </span>
      </div>
      <Link href="/components" className="ring-focus group/all flex h-12 shrink-0 items-center gap-2 rounded-full bg-ink pl-6 pr-5 text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97]">
        Browse all {ENTRIES.length}
        <ArrowRight size={15} className="transition-transform duration-150 group-hover/all:translate-x-0.5" />
      </Link>
    </div>
  )
}

const CSS = `
.library-grain { background-image: ${GRAIN}; opacity: 0.35; mix-blend-mode: soft-light; }
`
