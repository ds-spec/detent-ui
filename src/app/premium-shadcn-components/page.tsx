import type { Metadata } from 'next'
import Link from 'next/link'
import { ENTRIES, entry } from '@/catalog/meta'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { ArrowRight } from '@/lab/icons'
import { asset } from '@/lib/asset'
import { Example } from '@/site/bench/Example'
import { BigBuy, BuyBar, BuyNote, BuyProvider } from '@/site/pro/Buy'
import { Compare } from '@/site/pro/Inside'
import { JsonLd, crumbs, list, page } from '@/site/seo'
import { SitePage } from '@/site/sheets'
import { Pieces } from './Pieces'

const PATH = '/premium-shadcn-components'

export const metadata: Metadata = page({
  title: `Premium shadcn Components: ${PRO_COMPONENTS.length} React pieces, live`,
  description: `${PRO_COMPONENTS.length} premium React components for shadcn/ui, running live on the page. They install with the shadcn CLI, take your theme and land as source you own. $99 once.`,
  path: PATH,
})

const H2 = 'text-[clamp(32px,3.4vw,48px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink'

const FITS: { title: string; line: string; code: string; file: string }[] = [
  {
    title: 'Installs with the shadcn CLI',
    line: 'Add Detent’s registry once, then install a piece the way you install a button. Your coding agent can do it for you.',
    file: 'terminal',
    code: 'npx shadcn add @detent-pro/region',
  },
  {
    title: 'Reads the theme you already have',
    line: 'Your primary becomes its accent. Backgrounds, borders and muted text come from your tokens, and .dark turns it dark.',
    file: 'globals.css',
    code: ':root {\n  --primary: oklch(0.55 0.2 260);\n  --background: oklch(1 0 0);\n  --border: oklch(0.92 0 0);\n}',
  },
  {
    title: 'Lands as source you own',
    line: 'Every file sits in your project next to your shadcn components. Rename it, restyle it, cut what you don’t need.',
    file: 'components/',
    code: 'components/\n  ui/button.tsx\n  detent/components/viz/RadarCompare.tsx',
  },
]

const PRO = PRO_COMPONENTS.map((id) => entry(id)).filter((e) => e !== null)

export default async function PremiumShadcnComponents() {
  const example = await asset<{ code: string; html: string }>('examples/radar.json')
  return (
    <SitePage>
      <JsonLd data={crumbs([['Premium shadcn components', PATH]])} />
      <JsonLd data={list('Premium shadcn components', PRO.map((e) => ({ name: e.name, path: `/components/${e.id}` })))} />
      <BuyProvider>
        <section className="mx-auto max-w-[1360px] px-5 pt-12 sm:px-6 sm:pt-16">
          <div className="flex flex-col items-center text-center">
            <h1 className="focus-in text-[clamp(40px,5vw,72px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
              Premium shadcn components.
              <span className="block text-quiet">Running live, right here.</span>
            </h1>
            <p className="rise mt-6 max-w-[580px] text-balance text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
              {PRO_COMPONENTS.length} React components you won’t find in shadcn/ui: a chart you can ask questions, a run you can watch step by step, a wheel that turns the Earth. They install with the shadcn CLI, take your theme and become code you own.
            </p>
          </div>
          <div data-dock-dodge="" className="rise mt-9" style={{ animationDelay: '200ms' }}>
            <BuyBar />
          </div>
          <div className="rise mt-12 sm:mt-14" style={{ animationDelay: '320ms' }}>
            <Pieces />
          </div>
        </section>

        <section aria-labelledby="fit-title" className="mx-auto mt-28 max-w-[1360px] px-5 sm:mt-36 sm:px-6">
          <h2 id="fit-title" className={H2}>
            Made for shadcn.
            <span className="block text-quiet">Nothing new to learn.</span>
          </h2>
          <ol className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-3">
            {FITS.map((f) => (
              <li key={f.title} className="flex flex-col rounded-[24px] bg-surface p-2 shadow-[var(--card-edge)]">
                <div className="px-4 pb-5 pt-4 sm:px-5">
                  <p className="text-[17px] tracking-[-0.015em] text-ink">{f.title}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-3">{f.line}</p>
                </div>
                <div className="mt-auto overflow-hidden rounded-[16px] bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]">
                  <p className="px-4 pt-3 font-mono text-[11.5px] text-ink-3">{f.file}</p>
                  <pre className="overflow-x-auto px-4 pb-4 pt-2 font-mono text-[12.5px] leading-[20px] text-ink-2" translate="no">
                    {f.code}
                  </pre>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {example ? (
          <section aria-labelledby="code-title" className="mx-auto mt-28 max-w-[1360px] px-5 sm:mt-36 sm:px-6">
            <h2 id="code-title" className={H2}>
              The code is plain React.
              <span className="block text-quiet">Props in, a component out.</span>
            </h2>
            <p className="mt-6 max-w-[620px] text-[15px] leading-[1.6] text-ink-3">
              This is the whole page for{' '}
              <Link href="/components/radar" className="ring-focus rounded-[4px] text-ink-2 underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors duration-150 hover:text-ink hover:decoration-ink">
                {entry('radar')?.name ?? 'Matchup'}
              </Link>
              , the radar chart above that compares two things at a time. Your data goes in as an array, and you hear back when someone picks a new pair.
            </p>
            <div className="mt-4">
              <Example {...example} />
            </div>
          </section>
        ) : null}

        <section aria-labelledby="compare-title" className="mx-auto mt-28 max-w-[1360px] px-5 sm:mt-36 sm:px-6">
          <h2 id="compare-title" className={H2}>
            Start free.
            <span className="block text-quiet">{ENTRIES.length - PRO_COMPONENTS.length} components are MIT, no account needed.</span>
          </h2>
          <div className="mt-10 sm:mt-14">
            <Compare />
          </div>
        </section>

        <section aria-labelledby="all-title" className="mx-auto mt-28 max-w-[1360px] px-5 sm:mt-36 sm:px-6">
          <h2 id="all-title" className={H2}>
            Every Pro component.
            <span className="block text-quiet">Each one has its own page, live.</span>
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-x-12 sm:mt-14 md:grid-cols-2">
            {PRO.map((e) => (
              <li key={e.id} className="shadow-[inset_0_1px_0_var(--line)]">
                <Link href={`/components/${e.id}`} className="ring-focus group/row flex items-start gap-6 rounded-[6px] py-5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] tracking-[-0.01em] text-ink">{e.name}</span>
                    <span className="mt-1 block text-[14px] leading-[1.55] text-ink-3">{e.short ?? e.line}</span>
                  </span>
                  <ArrowRight size={14} className="mt-1.5 shrink-0 text-ink-3 transition-[color,transform] duration-150 group-hover/row:translate-x-0.5 group-hover/row:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-28 flex max-w-[1360px] flex-col items-center px-5 pb-8 text-center sm:mt-40 sm:px-6">
          <h2 className={H2}>
            Every piece, yours for good.
            <span className="block text-quiet">One payment, every update after it.</span>
          </h2>
          <div className="mt-10 flex w-full justify-center">
            <BigBuy />
          </div>
          <BuyNote />
        </section>
      </BuyProvider>
    </SitePage>
  )
}
