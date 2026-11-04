import type { Metadata } from 'next'
import { PRO_BLOCKS } from '@/catalog/effort'
import { PRO_COMPONENTS, TERMS } from '@/catalog/pro'
import { TEMPLATE_COUNT } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { BigBuy, BuyBar, BuyProvider, HeroHead, WideStage } from '@/site/pro/Buy'
import { Compare, Inside } from '@/site/pro/Inside'
import { Install } from '@/site/pro/Install'
import { Touch } from '@/site/pro/Touch'
import { JsonLd, page, proGraph } from '@/site/seo'
import { SitePage } from '@/site/sheets'

export const metadata: Metadata = page({
  title: 'Detent Pro — make your app feel expensive',
  absolute: true,
  description: `${PRO_COMPONENTS.length} React components, ${PRO_BLOCKS.length} whole screens and ${TEMPLATE_COUNT}, installed as source you own. One payment, for life.`,
  path: '/pro',
})

const FAQ: [string, string][] = [
  ['Who is it for?', 'Developers building a product in React who want it to look finished: a SaaS, a dashboard, a marketplace, or a website. If you already use shadcn, it drops straight in.'],
  ['Is it a subscription?', 'No. You pay once and keep it, along with every update that ships after you buy.'],
  ['What’s the difference between the plans?', 'Pro is what you build the product with: the Pro components and the Pro blocks. Pro + Templates adds the Detent app template, a whole app to start from, and every template still to come.'],
  ['Will it match my design?', 'Installed with shadcn, Detent takes on your theme: your primary becomes its accent, it uses your background, borders and muted text, and .dark turns it dark. Your fonts stay yours.'],
  ['How do I install Pro?', 'With the shadcn CLI, from Detent’s private registry. Sign in with your email, generate a key, add it and the registry to the project once, as in Set up once below, then install like anything else: npx shadcn add @detent-pro/lens. The source lands in your project.'],
  ['Can my team share one licence?', 'A licence is for one person, so each person building with it needs their own. Your keys work in CI and shared repos.'],
  ['Can I use it for client work?', 'Yes, in as many projects as you like, commercial ones included. What you can’t do is resell or redistribute the components themselves.'],
  ['Do the free components stay free?', 'Yes. Everything free stays free, and keeps getting better alongside Pro.'],
  ['What if it’s not right for me?', `Email within ${REFUND_DAYS} days of buying and you get every cent back. No form, no questions.`],
]

const H2 = 'text-[clamp(32px,3.4vw,48px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink'

/**
 * Pro, sold by showing what it saves: what it would take to build and what it costs, one bar that
 * is the whole checkout, and the product running under it. Then the best of it in your hand, the
 * plans side by side, every piece by name, the questions people ask, how setup works, and one button that is the price.
 */
export default function ProPage() {
  return (
    <SitePage>
      <JsonLd data={proGraph(FAQ)} />
      <BuyProvider>
        <section id="pricing" className="mx-auto max-w-[1360px] scroll-mt-24 px-5 pt-12 sm:px-6 sm:pt-16">
          <HeroHead />
          <div className="rise mt-9" style={{ animationDelay: '200ms' }}>
            <BuyBar />
          </div>
          <div className="rise mt-12 sm:mt-14" style={{ animationDelay: '320ms' }}>
            <WideStage />
          </div>
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
            <span className="block text-quiet">Then it’s just shadcn.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[16px] leading-[1.6] text-ink-3">Pro installs from a private registry with the shadcn CLI. Two files in your project, then add anything by name.</p>
          <div className="mt-10 sm:mt-14">
            <Install />
          </div>
        </section>

        <section className="mx-auto mt-28 flex max-w-[1360px] flex-col items-center px-5 pb-8 text-center sm:mt-40 sm:px-6">
          <h2 className={H2}>
            Everything in Pro, today.
            <span className="block text-quiet">One payment, yours for good.</span>
          </h2>
          <div className="mt-10 flex w-full justify-center sm:mt-12">
            <BigBuy />
          </div>
          <p className="mt-5 text-[13px] text-ink-3">{TERMS}</p>
        </section>
      </BuyProvider>
    </SitePage>
  )
}
