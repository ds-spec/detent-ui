import type { Metadata } from 'next'
import { PRO_BLOCKS, TOTAL_DAYS } from '@/catalog/effort'
import { PRO_COMPONENTS, TERMS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { BigBuy, BuyBar, BuyProvider, HeroHead, WideStage } from '@/site/pro/Buy'
import { Compare } from '@/site/pro/Inside'
import { Days, DaysHead } from '@/site/pro/Days'
import { Gap } from '@/site/pro/Gap'
import { Install } from '@/site/pro/Install'
import { JsonLd, page, proGraph } from '@/site/seo'
import { SitePage } from '@/site/sheets'

export const metadata: Metadata = page({
  title: 'Detent Pro — components, screens and templates for AI apps',
  absolute: true,
  description: `${PRO_COMPONENTS.length} React components, ${PRO_BLOCKS.length} whole screens and ${TEMPLATES.length} templates for AI products: about ${TOTAL_DAYS} days of work, installed as source you own. One payment, for life.`,
  path: '/pro',
})

const FAQ: [string, string][] = [
  ['Who is it for?', 'Developers and small teams building an AI product in React: a chat, an agent, a copilot, or a SaaS with AI inside. If you already use shadcn and the AI SDK, it drops straight in.'],
  ['Is it a subscription?', 'No. You pay once and keep it, along with every update that ships after you buy.'],
  ['What’s the difference between the plans?', 'Pro is what you build the product with: the Pro components and the Pro blocks. Pro + Templates adds the templates: whole apps to start from, including every template still to come. Team is everything, for up to five people.'],
  ['Does it work with the AI SDK?', 'Yes. useDetentChat takes what useChat gives you and returns the props for the streaming answer, the run waterfall and the approval card, so reasoning, tools, approvals and sources each land where they belong. The Agent chat block and Tandem run on it.'],
  ['Will it match my design?', 'Installed with shadcn, Detent takes on your theme: your primary becomes its accent, it uses your background, borders and muted text, and .dark turns it dark. Your fonts stay yours.'],
  ['How do I install Pro?', 'With the shadcn CLI, from Detent’s private registry. Add the registry and your licence key to the project once, as in Set up once above, then install like anything else: npx shadcn add @detent-pro/diff. The source lands in your project.'],
  ['Can my team share one licence?', 'A licence is for one person. Team covers up to five people, with a key for each of them and one more for CI and shared repos.'],
  ['Can I use it for client work?', 'Yes, in as many projects as you like, commercial ones included. What you can’t do is resell or redistribute the components themselves.'],
  ['Do the free components stay free?', 'Yes. Everything free stays free, and keeps getting better alongside Pro.'],
  ['What if it’s not right for me?', `Email within ${REFUND_DAYS} days of buying and you get every cent back. No form, no questions.`],
]

const H2 = 'text-[clamp(32px,3.4vw,48px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink'

/**
 * Pro, sold by showing what it saves: what it would take to build and what it costs, one bar that
 * is the whole checkout, and the product running under it. Then the gap between most AI apps and
 * one built with Pro, where the days went, the plans side by side, the questions people ask, and
 * one button that is the price.
 */
export default function ProPage() {
  return (
    <SitePage>
      <JsonLd data={proGraph(FAQ)} />
      <BuyProvider>
        <section className="mx-auto max-w-[1360px] px-5 pt-12 sm:px-6 sm:pt-16">
          <HeroHead />
          <div className="rise mt-9" style={{ animationDelay: '200ms' }}>
            <BuyBar />
          </div>
          <div className="rise mt-12 sm:mt-14" style={{ animationDelay: '320ms' }}>
            <WideStage />
          </div>
        </section>

        <section id="gap" aria-labelledby="gap-title" className="mx-auto mt-28 max-w-[1360px] scroll-mt-24 px-5 sm:mt-36 sm:px-6">
          <h2 id="gap-title" className={H2}>
            The model already works.
            <span className="block text-quiet">The app still feels like a demo.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[16px] leading-[1.6] text-ink-3">Four places almost every AI app looks unfinished. Flip each one to see the difference Pro makes.</p>
          <div className="mt-10 sm:mt-14">
            <Gap />
          </div>
        </section>

        <section id="inside" aria-labelledby="inside-title" className="mx-auto mt-28 max-w-[1360px] scroll-mt-24 px-5 sm:mt-36 sm:px-6">
          <DaysHead className={H2} />
          <div className="mt-10 sm:mt-14">
            <Days />
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

        <section id="questions" aria-labelledby="questions-title" className="mx-auto mt-28 grid max-w-[1360px] scroll-mt-24 gap-x-16 gap-y-10 px-5 sm:mt-36 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <h2 id="questions-title" className={H2}>
            Questions.
            <span className="block text-quiet">Before you buy.</span>
          </h2>
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
                <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[6px] py-5 text-[17px] tracking-[-0.01em] text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="relative size-3.5 shrink-0 text-ink-3">
                    <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300 group-open/q:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-[620px] pb-6 text-[15px] leading-[1.6] text-ink-3">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-28 flex max-w-[1360px] flex-col items-center px-5 pb-8 text-center sm:mt-40 sm:px-6">
          <h2 className={H2}>
            Ship the hard parts this week.
            <span className="block text-quiet">Not this quarter.</span>
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
