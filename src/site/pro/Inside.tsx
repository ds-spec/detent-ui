import type { ReactNode } from 'react'
import Link from 'next/link'
import { BLOCK_DAYS, COMPONENT_DAYS, PRO_BLOCKS, TEMPLATE_DAYS } from '@/catalog/effort'
import { ENTRIES, entry } from '@/catalog/meta'
import { PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { Check } from '@/lab/icons'

/*
 * What Pro holds, said plainly: every piece by name, grouped, each group with roughly how long it
 * takes to build. Then the plans side by side, row by row, so the difference is a glance.
 */

const GROUPS: { name: string; days: number; note?: string; items: { name: string; href: string }[] }[] = [
  { name: 'Components', days: COMPONENT_DAYS, items: PRO_COMPONENTS.map((id) => ({ name: entry(id)?.name ?? id, href: `/components/${id}` })) },
  { name: 'Blocks', days: BLOCK_DAYS, items: PRO_BLOCKS.map((b) => ({ name: b.name, href: `/blocks/${b.id}` })) },
  { name: 'Templates', days: TEMPLATE_DAYS, note: 'With Pro + Templates', items: TEMPLATES.map((t) => ({ name: `${t.name} · ${t.kind}`, href: `/templates/${t.id}` })) },
]

export function Inside() {
  return (
    <div>
      {GROUPS.map((g) => (
        <div key={g.name} className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-4 py-8 shadow-[inset_0_1px_0_var(--line)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <p className="text-[19px] tracking-[-0.015em] text-ink">
              {g.name} <span className="tnum text-quiet">{g.items.length}</span>
            </p>
            <p className="mt-1 text-[13.5px] text-ink-3">
              About <span className="tnum">{g.days}</span> days to build{g.note ? ` · ${g.note}` : ''}
            </p>
          </div>
          <ul className="columns-2 gap-x-8 sm:columns-3">
            {g.items.map((x) => (
              <li key={x.href} className="break-inside-avoid">
                <Link href={x.href} className="ring-focus -mx-1 block truncate rounded-[6px] px-1 py-1 text-[14.5px] text-ink-2 transition-colors duration-150 hover:text-ink">
                  {x.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

const [pro, all, team] = PLANS
const FREE = ENTRIES.length - PRO_COMPONENTS.length
const YES = (
  <span role="img" aria-label="Included" className="inline-flex">
    <Check size={15} strokeWidth={2.4} />
  </span>
)
const NO = (
  <span role="img" aria-label="Not included" className="text-ink-3/60">
    —
  </span>
)

/** Free and each plan, a column each, a row for every difference that matters. */
const ROWS: [string, ReactNode, ReactNode, ReactNode, ReactNode][] = [
  ['Price', '$0', `$${pro.price} once`, `$${all.price} once`, `$${team.price} once`],
  ['Components', FREE, `All ${ENTRIES.length}`, `All ${ENTRIES.length}`, `All ${ENTRIES.length}`],
  ['Blocks, whole screens', NO, PRO_BLOCKS.length, PRO_BLOCKS.length, PRO_BLOCKS.length],
  ['App templates', NO, NO, `${TEMPLATES.length}, and every new one`, `${TEMPLATES.length}, and every new one`],
  ['AI SDK adapter', NO, YES, YES, YES],
  ['Takes your shadcn theme', YES, YES, YES, YES],
  ['Installs from', 'Public registry', 'Private registry', 'Private registry', 'Private registry'],
  ['People', 'Anyone', 'One', 'One', 'Up to ten, plus CI'],
  ['Licence', 'MIT', 'Unlimited projects', 'Unlimited projects', 'Unlimited projects'],
]

export function Compare() {
  const heads = ['Free', pro.name, all.name, team.name]
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
        <thead>
          <tr>
            <th className="w-[26%] pb-4" />
            {heads.map((h, i) => (
              <th key={h} scope="col" className={`pb-4 text-[16px] font-normal tracking-[-0.01em] ${i === 2 ? 'text-ink' : 'text-ink-2'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, ...cells]) => (
            <tr key={label} className="shadow-[inset_0_1px_0_var(--line)]">
              <th scope="row" className="py-3.5 pr-6 text-[14px] font-normal text-ink-3">
                {label}
              </th>
              {cells.map((c, i) => (
                <td key={i} className="tnum py-3.5 pr-4 text-[14px] text-ink">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
