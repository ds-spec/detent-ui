'use client'

import Link from 'next/link'
import { FIRST_COMPONENT } from '@/catalog/site'
import { ArrowRight, ArrowUpRight } from '@/lab/icons'
import { LivePlate } from '@/site/LivePlate'
import { useIntent } from '@/site/intent'
import { GRAIN } from './lights'
import type { LibItem } from './library'

/*
 * The library on the home page: eight parts, shown big. Two to a row, a wide one beside a narrow
 * one, the sides swapping each row, so it reads as a wall of prints rather than a grid of tiles.
 *
 * Each part is a card. Most of it is a well tinted with one of the four lights' colours, softened,
 * with the part running in the middle at its real size, there to be used. Along the foot: its family
 * and whether it's free, its name, one line, and the way to its page. Under the wall, the way to all
 * of them.
 */

/** The eight, row by row: each pair is wide then narrow, or narrow then wide.  */
const ROWS: [string, string][] = [
  ['region', 'popup'],
  ['upload', 'voicenote'],
  ['halo', 'rewind'],
  ['lens', 'threads'],
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

export function HomeLibrary({ lib }: { lib: LibItem[] }) {
  return (
    <section id="library" className="scroll-mt-20 px-2.5 sm:px-5">
      <style>{CSS}</style>
      <div className="relative overflow-hidden rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--paper)', boxShadow: 'var(--leaf-edge)' }}>
        <div className="relative mx-auto max-w-[1440px] px-1 pb-6 pt-20 sm:px-8 sm:pb-8 sm:pt-28">
          <div className="flex flex-col items-center px-2 text-center">
            <h2 className="text-[clamp(38px,4.2vw,62px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
              These aren’t screenshots.
              <br />
              <span className="text-quiet">Go on, use one.</span>
            </h2>
            <p className="mt-5 max-w-[480px] text-balance text-[16px] leading-[1.6] text-ink-3">
              Eight from the library, live on this page. <span className="text-ink">All {lib.length}</span> are a click away.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:mt-16">
            {ROWS.map(([a, b], r) => (
              <div key={a} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                {[a, b].map((id, k) => {
                  const e = lib.find((x) => x.id === id)
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

function Plate({ e, n, wide }: { e: LibItem; n: number; wide: boolean }) {
  const { pro, family } = e
  const intent = useIntent()
  return (
    <LivePlate
      id={e.id}
      bleed={e.bleed}
      well={well(n)}
      className={`h-[520px] transition-shadow duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--card-lift)] sm:h-[600px] ${wide ? 'lg:col-span-7' : 'lg:col-span-5'}`}
      caption={
        // The demo is the thing to touch; the caption and its arrow are the way to the part's page.
        <Link href={`/components/${e.id}`} prefetch={false} {...intent(`/components/${e.id}`)} aria-label={e.name} className="ring-focus group/cap flex shrink-0 items-end gap-4 rounded-[20px] px-3 pb-2 pt-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
              {family}
              <span className="size-[3px] rounded-full bg-current opacity-50" />
              <span className={pro ? 'text-ink' : ''}>{pro ? 'Pro' : 'Free'}</span>
            </p>
            {/* The name. */}
            <p className="mt-2 text-[19px] leading-6 tracking-[-0.015em] text-ink sm:truncate">
              {e.name}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[background-color,color,box-shadow,transform] duration-200 group-hover/cap:bg-ink group-hover/cap:text-surface group-hover/cap:shadow-none group-active/cap:scale-[0.97]">
            <ArrowUpRight size={15} className="transition-transform duration-200 group-hover/cap:-translate-y-px group-hover/cap:translate-x-px" />
          </span>
        </Link>
      }
    />
  )
}

/** Under the wall, the way through to everything: one button. */
function SeeAll() {
  return (
    <div className="mt-10 flex justify-center">
      <Link href={FIRST_COMPONENT} className="ring-focus group/all flex h-12 shrink-0 items-center gap-2 rounded-full bg-ink pl-6 pr-5 text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97]">
        Browse components
        <ArrowRight size={15} className="transition-transform duration-150 group-hover/all:translate-x-0.5" />
      </Link>
    </div>
  )
}

const CSS = `
.library-grain { background-image: ${GRAIN}; opacity: 0.35; mix-blend-mode: soft-light; }
`
