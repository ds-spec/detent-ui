'use client'

import { useState } from 'react'
import Link from 'next/link'
import { daysFor, PRO_BLOCKS } from '@/catalog/effort'
import { entry } from '@/catalog/meta'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { RollingText } from '@/lab/ui/RollingText'
import { useChoice } from './Buy'

/*
 * Where the days went: every piece of Pro as one segment of a single bar, as wide as the days it
 * took. One look says how much is in there; a hover says what each piece is. The templates go
 * quiet when the chosen plan doesn't include them, so the bar always adds up to the headline.
 */

type Group = 'components' | 'blocks' | 'templates'
type Piece = { id: string; name: string; line: string; days: number; group: Group; href: string }

const HUE: Record<Group, string> = { components: '#4a72ff', blocks: '#8a63ff', templates: '#ff9a3c' }
const LABEL: Record<Group, string> = { components: 'Components', blocks: 'Blocks', templates: 'Templates' }

const byDays = (a: Piece, b: Piece) => b.days - a.days
const PIECES: Piece[] = [
  ...PRO_COMPONENTS.map((id): Piece => ({ id, name: entry(id)?.name ?? id, line: entry(id)?.short ?? '', days: daysFor(id), group: 'components', href: `/components/${id}` })).sort(byDays),
  ...PRO_BLOCKS.map((b): Piece => ({ id: b.id, name: b.name, line: b.short, days: daysFor(b.id), group: 'blocks', href: `/blocks/${b.id}` })).sort(byDays),
  ...TEMPLATES.map((t): Piece => ({ id: t.id, name: t.name, line: t.kind, days: daysFor(t.id), group: 'templates', href: `/templates/${t.id}` })).sort(byDays),
]
const GROUPS = (['components', 'blocks', 'templates'] as const).map((g) => {
  const items = PIECES.filter((p) => p.group === g)
  return { g, count: items.length, days: items.reduce((n, p) => n + p.days, 0) }
})

export function Days() {
  const { edition, setEdition } = useChoice()
  const [at, setAt] = useState<Piece | null>(null)
  const withTemplates = edition === 'all'
  const counted = (p: Piece) => withTemplates || p.group !== 'templates'

  return (
    <div className="rounded-[28px] bg-surface p-5 shadow-[var(--card-edge)] sm:p-8">
      {/* One segment per piece, each as wide as its days. */}
      <div className="flex h-20 gap-px sm:h-28 sm:gap-[2px]" onPointerLeave={() => setAt(null)}>
        {PIECES.map((p) => {
          const on = counted(p)
          const lit = at?.id === p.id
          return (
            <Link
              key={p.id}
              href={p.href}
              aria-label={`${p.name}, ${LABEL[p.group].toLowerCase()}, about ${p.days} days`}
              onPointerEnter={() => setAt(p)}
              onFocus={() => setAt(p)}
              onClick={(e) => {
                // Too thin to aim for by touch: a tap reads the piece out, and the line below goes to it.
                if (matchMedia('(pointer: coarse)').matches) e.preventDefault()
              }}
              onBlur={() => setAt(null)}
              className="ring-focus group/seg relative min-w-[2px] rounded-[2px] transition-[transform,opacity] sm:min-w-[3px] sm:rounded-[5px] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:-translate-y-1"
              style={{ flexGrow: p.days, flexBasis: 0, opacity: at && !lit ? 0.55 : 1 }}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-[inherit] transition-[background-color] duration-200"
                style={{
                  background: on ? `color-mix(in oklch, ${HUE[p.group]} ${lit ? 100 : 46}%, var(--surface))` : 'repeating-linear-gradient(135deg, var(--line-strong) 0 1px, transparent 1px 5px)',
                  boxShadow: on ? 'inset 0 1px 0 rgb(255 255 255 / 0.25)' : 'inset 0 0 0 1px var(--line)',
                }}
              />
            </Link>
          )
        })}
      </div>

      {/* What the hand is on, in a line of fixed height so nothing below it moves. */}
      <div aria-live="polite" className="mt-4 flex h-12 items-center gap-2 overflow-hidden text-[14.5px] sm:h-6">
        {at ? (
          <>
            <span className="size-2 shrink-0 rounded-full" style={{ background: HUE[at.group] }} />
            <Link href={at.href} className="truncate text-ink">
              {at.name}
            </Link>
            <span className="hidden min-w-0 truncate text-quiet sm:inline">— {at.line}</span>
            <span className="tnum ml-auto shrink-0 text-ink-2">{at.days} days</span>
          </>
        ) : (
          <span className="text-ink-3">One segment per piece, as wide as its days.</span>
        )}
      </div>

      {/* The three groups, and what they add up to. */}
      <div className="mt-6 grid gap-4 pt-6 shadow-[inset_0_1px_0_var(--line)] sm:grid-cols-3">
        {GROUPS.map(({ g, count, days }) => {
          const off = g === 'templates' && !withTemplates
          return (
            <div key={g} className="flex items-start gap-3">
              <span className="mt-[7px] size-2 shrink-0 rounded-full" style={{ background: off ? 'var(--line-strong)' : HUE[g] }} />
              <div className="min-w-0">
                <p className={`text-[17px] tracking-[-0.01em] ${off ? 'text-ink-3' : 'text-ink'}`}>
                  {LABEL[g]} <span className="tnum text-quiet">{count}</span>
                </p>
                <p className="tnum mt-0.5 text-[13.5px] text-ink-3">
                  About {days} days
                  {off && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        onClick={() => setEdition('all')}
                        className="ring-focus rounded-[4px] text-ink-2 underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors hover:text-ink hover:decoration-current"
                      >
                        add them
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The heading over the bar: the days roll with the plan, like the headline at the top. */
export function DaysHead({ className }: { className: string }) {
  const { days } = useChoice()
  return (
    <h2 id="inside-title" className={className}>
      <span className="sr-only">Where {days} days went. Point at any piece.</span>
      <span aria-hidden className="flex flex-wrap items-center gap-x-[0.22em]">
        Where
        <RollingText text={String(days)} proportional />
        <span>days went.</span>
      </span>
      <span aria-hidden className="block text-quiet">Point at any piece.</span>
    </h2>
  )
}
