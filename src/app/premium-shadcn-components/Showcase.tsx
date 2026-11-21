import Link from 'next/link'
import { ENTRIES } from '@/catalog/meta'
import { PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS, TERMS } from '@/catalog/pro'
import { TEMPLATE_COUNT } from '@/catalog/templates'
import { ArrowRight } from '@/lab/icons'
import { WideStage } from '@/site/pro/Buy'
import { Pieces } from './Pieces'

const LABEL = 'text-[13px] text-ink-3'
const HEAD = 'mt-1 text-[20px] tracking-[-0.025em] text-ink'
const LINE = 'mt-1.5 max-w-[560px] text-[15px] leading-[1.6] text-ink-3'

const TREE = ['components/', '  ui/', '    button.tsx', '  detent/components/', '    askchart/AskChart.tsx', '    viz/RadarCompare.tsx']

const WHY: [string, string][] = [
  ['Interactive', 'Pieces that answer, compare and stream, not static layouts'],
  ['Product screens', 'Blocks that already work, like an inbox or an eval run'],
  ['Tailwind v4', 'Built on current shadcn/ui and its CSS variables'],
  ['Yours', 'Source files in your project, change anything'],
  ['One payment', 'Every update after it, no subscription'],
]

export function Showcase() {
  return (
    <div className="mx-auto mt-10 max-w-[1100px] px-5 sm:px-6">
      <ul className="mb-14 grid grid-cols-1 gap-px overflow-hidden rounded-[20px] bg-[var(--line)] shadow-[var(--card-edge)] sm:grid-cols-2 lg:grid-cols-5">
        {WHY.map(([t, d]) => (
          <li key={t} className="bg-surface px-5 py-4">
            <p className="text-[14.5px] text-ink">{t}</p>
            <p className="mt-1 text-[13px] leading-[1.5] text-ink-3">{d}</p>
          </li>
        ))}
      </ul>
      <div>
        <p className={LABEL}>Components</p>
        <p className={HEAD}>Pieces that do something when you touch them</p>
        <p className={LINE}>Ask the chart a question and it redraws. Pick two models on the radar and it says who wins where. Both are running live below.</p>
        <div className="mt-6">
          <Pieces />
        </div>
      </div>

      <div className="mt-16">
        <p className={LABEL}>Blocks and an app template</p>
        <p className={HEAD}>Whole screens, already working</p>
        <p className={LINE}>Blocks are full product screens built from the components, like a support inbox or a task that becomes a merged PR. The template is a complete agent workspace app. Use the dots to flip through them.</p>
        <div className="mt-6">
          <WideStage />
        </div>
      </div>

      <div className="mt-16 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col rounded-[24px] bg-surface p-2 shadow-[var(--card-edge)]">
          <div className="px-4 pb-5 pt-4">
            <p className={LABEL}>Install</p>
            <p className="mt-1 text-[17px] tracking-[-0.015em] text-ink">With the shadcn CLI, or your coding agent</p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-3">Connect your key once. After that, every piece installs like a shadcn button, and takes your theme: your primary becomes its accent.</p>
          </div>
          <pre className="mt-auto overflow-x-auto rounded-[16px] bg-surface-2 px-4 py-4 font-mono text-[12.5px] leading-[20px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]" translate="no">
            npx shadcn add @detent-pro/askchart
          </pre>
        </div>
        <div className="flex flex-col rounded-[24px] bg-surface p-2 shadow-[var(--card-edge)]">
          <div className="px-4 pb-5 pt-4">
            <p className={LABEL}>Own it</p>
            <p className="mt-1 text-[17px] tracking-[-0.015em] text-ink">Source files in your project, not a package</p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-3">Everything lands next to your own components. Rename it, restyle it, delete the parts you don’t need.</p>
          </div>
          <pre className="mt-auto overflow-x-auto rounded-[16px] bg-surface-2 px-4 py-4 font-mono text-[12.5px] leading-[20px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]" translate="no">
            {TREE.join('\n')}
          </pre>
        </div>
      </div>

    </div>
  )
}

export function ProCta() {
  const [pro] = PLANS
  return (
      <div className="relative mt-10 overflow-hidden rounded-[28px] bg-surface px-6 py-8 shadow-[var(--elev-raised)] sm:px-10 sm:py-10">
        <span aria-hidden className="pointer-events-none absolute inset-x-16 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70" />
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[clamp(26px,2.8vw,36px)] leading-[1.08] tracking-[-0.045em] text-ink">
              Detent Pro
              <span className="block text-quiet">Own the code. Pay once.</span>
            </p>
            <p className="mt-4 max-w-[520px] text-[15px] leading-[1.6] text-ink-3">
              {PRO_COMPONENTS.length} Pro components on top of the free ones ({ENTRIES.length} in all), {PRO_BLOCK_COUNT} blocks and {TEMPLATE_COUNT}. One licence per person.
            </p>
            <p className="mt-2 text-[13px] text-ink-3">{TERMS}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <p className="tnum flex items-baseline gap-1.5">
              <span className="text-[34px] leading-none tracking-[-0.045em] text-ink">${pro.price}</span>
              <span className="text-[14px] text-ink-3">once</span>
            </p>
            <Link href="/pro" data-cta="seo-premium" className="ring-focus group/go flex h-11 items-center gap-2 rounded-full bg-ink pl-5 pr-4 text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
              Explore Detent Pro
              <ArrowRight size={15} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
  )
}
