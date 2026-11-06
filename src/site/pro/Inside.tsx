import type { ReactNode } from 'react'
import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { PRO_BLOCKS } from '@/catalog/effort'
import { ENTRIES, entry } from '@/catalog/meta'
import { FREE_BLOCKS, PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { Check } from '@/lab/icons'

const GROUPS: { name: string; note?: string; items: { name: string; href: string }[] }[] = [
  { name: 'Components', items: PRO_COMPONENTS.map((id) => ({ name: entry(id)?.name ?? id, href: `/components/${id}` })) },
  { name: 'Blocks', items: PRO_BLOCKS.map((b) => ({ name: b.name, href: `/blocks/${b.id}` })) },
  { name: 'Templates', note: 'Included in Pro', items: TEMPLATES.map((t) => ({ name: `${t.name} · ${t.kind}`, href: `/templates/${t.id}` })) },
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
            {g.note && <p className="mt-1 text-[13.5px] text-ink-3">{g.note}</p>}
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

const [pro] = PLANS
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

const ROWS: [string, ReactNode, ReactNode][] = [
  ['Price', '$0', `$${pro.price} once`],
  ['Components', FREE, `All ${ENTRIES.length}`],
  ['Blocks, whole screens', FREE_BLOCKS.length, `All ${BLOCKS.length}`],
  ['App templates', NO, `${TEMPLATES.length}, and every new one`],
  ['Takes your shadcn theme', YES, YES],
  ['Installs from', 'Public registry', 'Private registry'],
  ['People', 'Anyone', 'One'],
  ['Licence', 'MIT', 'Unlimited projects'],
]

export function Compare() {
  const heads = ['Free', pro.name]
  return (
    <div className="md:overflow-x-auto">
      <table className="block w-full table-fixed border-collapse text-left md:table md:min-w-[560px]">
        <thead className="hidden md:table-header-group">
          <tr>
            <th className="w-[34%] pb-4" />
            {heads.map((h, i) => (
              <th key={h} scope="col" className={`pb-4 text-[16px] font-normal tracking-[-0.01em] ${i === 1 ? 'text-ink' : 'text-ink-2'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {ROWS.map(([label, ...cells]) => (
            <tr key={label} className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 shadow-[inset_0_1px_0_var(--line)] md:table-row md:py-0">
              <th scope="row" className="col-span-2 block text-[14px] font-normal text-ink-3 md:table-cell md:py-3.5 md:pr-6">
                {label}
              </th>
              {cells.map((c, i) => (
                <td key={i} className="tnum block text-[14px] text-ink md:table-cell md:py-3.5 md:pr-4">
                  <span className="mb-0.5 block text-[12px] text-ink-3 md:hidden">{heads[i]}</span>
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
