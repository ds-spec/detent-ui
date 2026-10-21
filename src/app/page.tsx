import Link from 'next/link'
import { ENTRIES } from '@/catalog/meta'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { FamilyTag } from '@/site/home/FamilyTag'
import { IndexGallery } from '@/site/home/IndexGallery'
import { NewPill } from '@/site/home/NewPill'
import { PRO_BLOCK_COUNT, PRO_COMPONENTS, installCommand } from '@/catalog/pro'
import { ProTag } from '@/site/blocks/ProTag'
import { CopyCommand } from '@/site/parts'
import { Plans } from '@/site/pro/Plans'
import type { Metadata } from 'next'
import { DESCRIPTION, JsonLd, NAME, page, siteGraph } from '@/site/seo'

export const metadata: Metadata = page({ title: `${NAME} — React components for AI products`, absolute: true, description: DESCRIPTION, path: '/' })

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <JsonLd data={siteGraph()} />
        <section className="flex flex-col items-center pt-20 text-center sm:pt-36">
          <div className="rise">
            <NewPill />
          </div>
          <h1 className="mt-8 text-[clamp(40px,5.2vw,60px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
            <span className="focus-in inline-block">Interfaces</span>{' '}
            <span className="focus-in inline-block" style={{ animationDelay: '60ms' }}>
              that
            </span>{' '}
            <span className="focus-in inline-block" style={{ animationDelay: '120ms' }}>
              click
            </span>{' '}
            <span className="focus-in inline-block" style={{ animationDelay: '180ms' }}>
              into
            </span>{' '}
            {/* The last word drops into its slot and settles, the way a detent clicks. */}
            <span className="slot">
              <span className="click-in">place.</span>
            </span>
            {/* The second line is an aside: the same size, a quieter grey. */}
            <span className="focus-in block text-quiet" style={{ animationDelay: '240ms' }}>
              {ENTRIES.length} React components for AI products.
            </span>
          </h1>
          <p className="rise mt-7 max-w-[660px] text-lead text-ink-3" style={{ animationDelay: '320ms' }}>
            {/* Punctuation after a tag is kerned into the tag's padding, so it reads as part of the sentence. */}
            Live components for <FamilyTag id="agents">agents</FamilyTag>
            <span className="-ml-[3px]">,</span> <FamilyTag id="data">data</FamilyTag> and <FamilyTag id="inputs">inputs</FamilyTag>
            <span className="-ml-[3px]">,</span> built on React and Tailwind. Every state designed, every key handled, and nothing on the page ever jumps.
          </p>
          <div className="rise mt-10 flex max-w-full flex-wrap items-center justify-center gap-3" style={{ animationDelay: '400ms' }}>
            <Link href="/components" className="ring-focus flex h-11 items-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-opacity duration-150 hover:opacity-90">
              Browse components
            </Link>
            <CopyCommand command={installCommand('agent-kit', true)} />
          </div>
        </section>

        <section id="library" className="mt-32 scroll-mt-16 pt-4 sm:mt-44">
          <h2 className="text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink">
            Every piece, running live.
            <span className="block text-quiet">Scroll the names. Each one takes the stage.</span>
          </h2>
          <div className="mt-10 sm:mt-14">
            <IndexGallery />
          </div>
        </section>

        <section id="install" className="mx-auto mt-40 max-w-[960px] scroll-mt-24 pb-12 text-center sm:mt-44">
          <h2 className="text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink">
            Free to start. Yours in one command.
            <span className="block text-quiet">Source in your project, not a package.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[600px] text-body text-ink-3">{ENTRIES.length - PRO_COMPONENTS.length} components are free, under MIT. The shadcn CLI brings each one with every file it uses and the Detent theme.</p>
          <div className="mt-8 flex justify-center">
            <CopyCommand command={installCommand('agent-kit', true)} />
          </div>
          {/* What free means, in four plain facts. */}
          <ul className="mt-14 grid gap-x-10 text-left sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Free for anything', 'Personal, client and commercial work, under the MIT licence.'],
              ['Nothing to set up', 'No account and no key. The command fetches it from the public registry.'],
              ['Fits your app', 'Detent’s tokens are its own, so your theme, fonts and shadcn colours stay as they are.'],
              ['Agents welcome', 'Coding agents can read /llms.txt for every piece and its exact command.'],
            ].map(([t, d]) => (
              <li key={t} className="py-5 shadow-[inset_0_1px_0_var(--line)]">
                <p className="text-callout font-medium text-ink">{t}</p>
                <p className="mt-1 text-footnote text-ink-3">{d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-footnote text-ink-3">React 19 · Tailwind v4 · Motion · Light and dark</p>
        </section>

        {/* Pro, at the end of the free tour: what it adds and what it costs, in one place. */}
        <section id="pro" className="mt-36 scroll-mt-20 sm:mt-44">
          <div className="flex flex-col items-center text-center">
            <ProTag />
            <h2 className="mt-6 text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink">
              Go further with Pro.
              <span className="block text-quiet">The heavy parts, already done.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-[560px] text-body text-ink-3">
              {PRO_COMPONENTS.length} advanced components and {PRO_BLOCK_COUNT} whole screens, with templates for the page and the app on top. Live, finished, and installed as source you own.
            </p>
          </div>
          <div className="mt-12 sm:mt-14">
            <Plans compact />
          </div>
          <div className="mt-6 flex justify-center">
            <Link href="/pro" className="ring-focus group/go inline-flex h-10 items-center gap-2 rounded-full px-4 text-footnote font-medium text-ink-2 transition-colors duration-150 hover:text-ink">
              See everything in Pro
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-200 group-hover/go:translate-x-0.5">
                <path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
