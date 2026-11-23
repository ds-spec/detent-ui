import type { Metadata } from 'next'
import { PRO_BLOCKS } from '@/catalog/effort'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATE_COUNT, TEMPLATES } from '@/catalog/templates'
import { CONTACT } from '@/catalog/trust'
import { Check } from '@/lab/icons'
import { BigBuy, BuyBar, BuyNote, BuyProvider } from '@/site/pro/Buy'
import { Gallery, ProHero, Terms } from '@/site/pro/Gallery'
import { Compare, Inside } from '@/site/pro/Inside'
import { Install } from '@/site/pro/Install'
import { Keys } from '@/site/pro/Keys'
import { Quotes } from '@/site/pro/Quotes'
import { Touch } from '@/site/pro/Touch'
import { Voices } from '@/site/Voices'
import { JsonLd, page, proGraph } from '@/site/seo'
import { SitePage } from '@/site/sheets'

export const metadata: Metadata = page({
  title: 'Detent Pro: make your app feel expensive · Detent UI',
  absolute: true,
  description: `${PRO_COMPONENTS.length} React components, ${PRO_BLOCKS.length} whole screens and ${TEMPLATE_COUNT}, installed as source you own. One payment, for life.`,
  path: '/pro',
})

const FAQ: [string, string][] = [
  ['Is it a subscription?', 'No. You pay once and keep it, along with every update and every new piece that ships after you buy.'],
  ['Will it work in my project?', 'If you’re building in React with Tailwind CSS v4, yes: a SaaS, a dashboard, a marketplace or a website. Pro installs with the shadcn CLI into the project you already have, so there’s no new styling system to learn. Next.js is what we test on.'],
  ['Will it match my design?', 'Installed with shadcn, Detent takes on your theme: your primary becomes its accent, it uses your background, borders and muted text, and .dark turns it dark. Your fonts stay yours.'],
  ['Can I change the code?', 'Yes. Every piece lands in your project as source files, the same way shadcn components do. Restyle it, cut it down, rename it. It’s yours.'],
  ['Can I use it for client work?', 'Yes, in as many projects as you like, commercial ones included. What you can’t do is resell or redistribute the components themselves.'],
  ['How do I install Pro?', 'With the shadcn CLI, from Detent’s private registry. Sign in with your email, generate a key, add it and the registry to the project once, as in Set up once below, then install like anything else: npx shadcn add @detent-pro/glyph. The source lands in your project.'],
  ['Can my coding agent do it for me?', 'Yes, that’s how Detent is made to be used. Copy the prompt under Set up once into Claude Code, Cursor or Codex and it connects Pro. Then say what you’re building. Every piece has a page written for agents, with where it goes, a working example and its props, so your agent places it well instead of guessing.'],
  ['Can my team share one licence?', 'A licence is for one person, so each person building with it needs their own. Your keys work in CI and shared repos.'],
  ['Can I get a refund?', `No, every sale is final: the code is yours the moment it lands. That’s why every Pro piece and both templates run live on this site, and ${ENTRIES.length - PRO_COMPONENTS.length} components are free to install, so you can try Detent in your own project before you pay.`],
  ['What if I get stuck?', `Write to ${CONTACT}. You’ll hear back from the person who built it.`],
]

const INCLUDED = [`All ${ENTRIES.length} components`, `All ${BLOCKS.length} blocks`, ...TEMPLATES.map((t) => `The ${t.name} template`), 'Set up by your coding agent', 'Every update, for life', 'Unlimited projects']

const H2 = 'text-[clamp(32px,3.4vw,48px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink'

export default function ProPage() {
  return (
    <SitePage>
      <JsonLd data={proGraph(FAQ)} />
      <BuyProvider>
        <section id="pricing" className="mx-auto max-w-[1360px] scroll-mt-24 px-5 pt-12 sm:px-6 sm:pt-16">
          <ProHero />
          <div data-dock-dodge="" className="rise mt-9" style={{ animationDelay: '200ms' }}>
            <BuyBar terms={<Terms />} />
          </div>
          <div className="rise mt-14 sm:mt-16" style={{ animationDelay: '320ms' }}>
            <Gallery />
          </div>
        </section>

        <section aria-labelledby="quotes-title" className="mx-auto mt-28 max-w-[1360px] px-5 sm:mt-36 sm:px-6">
          <h2 id="quotes-title" className={H2}>
            People write to me about Detent.
            <span className="block text-quiet">I kept a few.</span>
          </h2>
          <div className="mt-10 md:hidden">
            <Quotes />
          </div>
          <div className="mt-16 hidden md:block">
            <Keys />
          </div>
          <p className="mt-10 text-[15px] leading-[1.6] text-ink-3 md:mt-16">
            <span className="text-ink">Over 1,000 people bookmarked the Onboarding block on X.</span>{' '}
            <a href="https://x.com/next_gendev/status/2119335361554030899" target="_blank" rel="noopener noreferrer" className="ring-focus rounded-[4px] text-ink-2 underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors duration-150 hover:text-ink hover:decoration-ink">
              See the post
            </a>
          </p>
        </section>

        <section id="touch" aria-labelledby="touch-title" className="mx-auto mt-28 max-w-[1360px] scroll-mt-24 px-5 sm:mt-36 sm:px-6">
          <h2 id="touch-title" className={H2}>
            Take a closer look.
            <span className="block text-quiet">These are yours with Pro.</span>
          </h2>
          <div className="mt-10 sm:mt-14">
            <Touch />
          </div>
        </section>

        <section aria-labelledby="compare-title" className="mx-auto mt-28 max-w-[1360px] px-5 sm:mt-36 sm:px-6">
          <h2 id="compare-title" className={H2}>
            Free, or Pro.
            <span className="block text-quiet">What each one gets you.</span>
          </h2>
          <div className="mt-10 sm:mt-14">
            <Compare />
          </div>
          <p className="mt-8 text-[15px] leading-[1.6] text-ink-3">
            <span className="text-ink">This is the start.</span> New components, blocks and templates are on the way, included in your plan when they land.
          </p>
        </section>

        <section id="inside" aria-labelledby="inside-title" className="mx-auto mt-28 max-w-[1360px] scroll-mt-24 px-5 sm:mt-36 sm:px-6">
          <h2 id="inside-title" className={H2}>
            What’s inside.
            <span className="block text-quiet">Every piece, by name.</span>
          </h2>
          <div className="mt-10 rounded-[28px] bg-surface px-5 shadow-[var(--card-edge)] sm:mt-14 sm:px-8">
            <Inside />
          </div>
        </section>

        <section id="questions" aria-labelledby="questions-title" className="mx-auto mt-28 grid max-w-[1360px] scroll-mt-24 gap-x-16 gap-y-10 px-5 sm:mt-36 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <h2 id="questions-title" className={H2}>
            Questions.
            <span className="block text-quiet">Before you buy.</span>
          </h2>
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
                <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[6px] py-5 text-[17px] tracking-[-0.01em] text-ink transition-colors duration-150 hover:text-ink-2 active:text-ink-3 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="relative size-3.5 shrink-0 text-ink-3">
                    <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-200 group-open/q:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-[620px] pb-6 text-[15px] leading-[1.6] text-ink-3">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="install" aria-labelledby="install-title" className="mx-auto mt-28 max-w-[1360px] scroll-mt-24 px-5 sm:mt-36 sm:px-6">
          <h2 id="install-title" className={H2}>
            Set up once.
            <span className="block text-quiet">Then just ask your agent.</span>
          </h2>
          <div className="mt-10 sm:mt-14">
            <Install />
          </div>
        </section>

        <section className="mx-auto mt-28 flex max-w-[1360px] flex-col items-center px-5 pb-8 text-center sm:mt-40 sm:px-6">
          <h2 className={H2}>
            Everything in Pro, today.
            <span className="block text-quiet">One payment, yours for good.</span>
          </h2>
          <ul className="mt-8 flex max-w-[720px] flex-wrap justify-center gap-x-6 gap-y-2.5 text-[14px] text-ink-2">
            {INCLUDED.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="text-accent">
                  <Check size={14} strokeWidth={2.4} />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex w-full justify-center">
            <BigBuy />
          </div>
          <BuyNote />
        </section>
      </BuyProvider>
      <Voices
        hideAt="footer, [aria-labelledby='quotes-title']"
        dodge="[data-dock-dodge]"
        peek={{
          at: '#install',
          who: 'adeline',
          text: 'The shadcn install and the MCP setup are a really smart move too.',
        }}
      />
    </SitePage>
  )
}
