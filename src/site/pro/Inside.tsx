import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { PRO_BLOCKS } from '@/catalog/effort'
import { ENTRIES, entry } from '@/catalog/meta'
import { FREE_BLOCKS, PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { ArrowRight, Check } from '@/lab/icons'
import { ForPlan } from '../Owned'
import { Price } from '../Promo'
import { BTN } from '../shell/side'

const GROUPS: { name: string; note?: string; items: { name: string; href: string }[] }[] = [
  { name: 'Pro components', note: `Plus all ${ENTRIES.length - PRO_COMPONENTS.length} free ones`, items: PRO_COMPONENTS.map((id) => ({ name: entry(id)?.name ?? id, href: `/components/${id}` })) },
  { name: 'Pro blocks', note: `Whole screens, plus the ${FREE_BLOCKS.length} free blocks`, items: PRO_BLOCKS.map((b) => ({ name: b.name, href: `/blocks/${b.id}` })) },
  { name: TEMPLATES.length === 1 ? 'App template' : 'App templates', note: 'Included in Pro', items: TEMPLATES.map((t) => ({ name: `${t.name} · ${t.kind}`, href: `/templates/${t.id}` })) },
]

export function Inside() {
  return (
    <div>
      {GROUPS.map((g) => (
        <div key={g.name} className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-4 py-8 shadow-[inset_0_1px_0_var(--line)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <p className="tnum text-[clamp(44px,4vw,56px)] leading-none tracking-[-0.05em] text-ink">{g.items.length}</p>
            <p className="mt-3 text-[17px] tracking-[-0.015em] text-ink">{g.name}</p>
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
const [template] = TEMPLATES
const blockName = (id: string) => BLOCKS.find((b) => b.id === id)?.name ?? id
const listed = (ids: string[]) => {
  const names = ids.map(blockName)
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

type Row = { title: string; line?: string }

const FREE_ROWS: Row[] = [
  { title: `${FREE} components` },
  { title: `${FREE_BLOCKS.length} website blocks`, line: listed(FREE_BLOCKS) },
  { title: 'Takes your shadcn theme' },
  { title: 'MIT licence, for anyone' },
]

const PRO_ROWS: Row[] = [
  { title: `All ${ENTRIES.length} components`, line: `${PRO_COMPONENTS.length} of them only in Pro, like ${entry('region')?.name ?? 'Region wheel'} and ${entry('glyph')?.name ?? 'Glyph art'}` },
  { title: `All ${BLOCKS.length} blocks`, line: `Whole product screens, like ${listed(['support-inbox', 'evals', 'task-to-merge'])}` },
  ...(template ? [{ title: `The ${template.name} template`, line: `A full ${template.kind.toLowerCase()} to start from` }] : []),
  { title: 'Every new piece, as it ships' },
  { title: 'Unlimited projects, client work too' },
  { title: `${REFUND_DAYS}-day refund` },
]

function Rows({ rows, lit = false }: { rows: Row[]; lit?: boolean }) {
  return (
    <ul className="mt-7 grid gap-4">
      {rows.map((r) => (
        <li key={r.title} className="flex gap-3">
          <span className={`mt-[3px] shrink-0 ${lit ? 'text-accent' : 'text-ink-3'}`}>
            <Check size={15} strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] leading-[1.4] tracking-[-0.01em] text-ink">{r.title}</span>
            {r.line && <span className="mt-0.5 block text-[13px] leading-[1.5] text-ink-3">{r.line}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

const BUTTON = 'ring-focus group/go mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-[12px] text-[15px] font-medium transition-[box-shadow,filter,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.98]'

export function Compare() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="flex flex-col rounded-[28px] bg-surface-2 p-6 max-md:order-last sm:p-8 dark:bg-transparent dark:shadow-[inset_0_0_0_1px_var(--line)]">
        <p className="text-[20px] tracking-[-0.025em] text-ink-2">Free</p>
        <p className="tnum mt-3 text-[44px] leading-none tracking-[-0.045em] text-ink">$0</p>
        <p className="mt-3 text-[14px] text-ink-3">A good place to start.</p>
        <Rows rows={FREE_ROWS} />
        <div className="h-8 shrink-0" />
        <Link href="/components" className={`${BUTTON} ${BTN.plate}`}>
          Browse free components
        </Link>
      </div>
      <div className="relative flex flex-col rounded-[28px] bg-surface p-6 shadow-[var(--elev-raised)] sm:p-8">
        <span aria-hidden className="pointer-events-none absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70" />
        <p className="text-[20px] tracking-[-0.025em] text-ink">Pro</p>
        <p className="tnum mt-3 flex items-baseline gap-2 text-[44px] leading-none tracking-[-0.045em] text-ink">
          <Price value={pro.price} />
          <span className="text-[15px] tracking-normal text-ink-3">once</span>
        </p>
        <p className="mt-3 text-[14px] text-ink-3">Everything in Detent, and everything after.</p>
        <Rows rows={PRO_ROWS} lit />
        <div className="h-8 shrink-0" />
        <ForPlan
          none={
            <a href={pro.href} data-cta="pro-compare" className={`${BUTTON} ${BTN.accent}`}>
              {pro.cta}
              <ArrowRight size={15} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
            </a>
          }
          pro={
            <Link href="/docs#pro" className={`${BUTTON} ${BTN.plate}`}>
              Pro is yours. Set it up
            </Link>
          }
          all={
            <Link href="/docs#pro" className={`${BUTTON} ${BTN.plate}`}>
              Pro is yours. Set it up
            </Link>
          }
        />
      </div>
    </div>
  )
}
