import type { Metadata } from 'next'
import Link from 'next/link'
import { PRO_BLOCKS, TOTAL_DAYS, TOTAL_MONTHS } from '@/catalog/effort'
import { PLANS, PRO_COMPONENTS, TERMS } from '@/catalog/pro'
import { TEMPLATES } from '@/templates/meta'
import { ProTag } from '@/site/blocks/ProTag'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { Ledger } from '@/site/pro/Ledger'
import { Plans } from '@/site/pro/Plans'
import { JsonLd, page, proGraph } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Detent Pro — components, screens and templates for AI apps',
  absolute: true,
  description: `${PRO_COMPONENTS.length} React components, ${PRO_BLOCKS.length} whole screens and ${TEMPLATES.length} templates for AI products: about ${TOTAL_DAYS} days of work, installed as source you own. One payment, for life.`,
  path: '/pro',
})

const [pro, all] = PLANS

const FAQ: [string, string][] = [
  ['Is it a subscription?', 'No. You pay once and keep everything, including every update that ships after you buy.'],
  ['What’s the difference between the plans?', 'Pro is what you build the product with: the Pro components and every block. Pro + Templates adds the templates: landing pages that sell the product and apps to start it from, including every template still to come.'],
  ['How do I install Pro?', 'With the shadcn CLI, from Detent’s private registry. Add your licence key once, then install like anything else: npx shadcn add @detent-pro/diff. The source lands in your project.'],
  ['Can my team share one licence?', 'A licence is for one person. Team covers up to ten people for $799, with a key for each of them and one more for CI and shared repos.'],
  ['Can I use it for client work?', 'Yes, in as many projects as you like, commercial ones included. What you can’t do is resell or redistribute the components themselves.'],
  ['Do the free components stay free?', 'Yes. Everything free stays free, and keeps getting better alongside Pro.'],
]

const h2 = 'text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink'

/**
 * Pro, told as time. The hero says what it's worth in days of work; the ledger lists everything
 * in it with roughly how long each takes to build, running each one as you pass and adding the
 * days up until it reaches the whole. Then the price, the questions, and the way in.
 */
export default function ProPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <JsonLd data={proGraph(FAQ)} />
        <section className="flex flex-col items-center pt-20 text-center sm:pt-32">
          <ProTag className="rise" />
          <h1 className="mt-7 text-[clamp(40px,5.6vw,68px)] font-normal leading-[1.03] tracking-[-0.05em] text-ink">
            <span className="focus-in inline-block">{TOTAL_DAYS} days of work.</span>
            <span className="focus-in block text-quiet" style={{ animationDelay: '120ms' }}>
              Yours for ${pro.price}.
            </span>
          </h1>
          <p className="rise mt-7 max-w-[640px] text-lead text-ink-3" style={{ animationDelay: '240ms' }}>
            {PRO_COMPONENTS.length} components, {PRO_BLOCKS.length} whole screens and {TEMPLATES.length} templates, each built to the same bar: every state, every key, both themes, every width, and nothing ever jumps. By our estimate, that’s about {TOTAL_MONTHS} months of one good engineer’s time,
            already done.
          </p>
          <div className="rise mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '320ms' }}>
            <Link href="#pricing" className="ring-focus flex h-11 items-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-opacity duration-150 hover:opacity-90">
              {pro.cta} · ${pro.price}
            </Link>
            <Link href="#inside" className="ring-focus flex h-11 items-center rounded-full bg-surface-2 px-6 text-callout font-medium text-ink transition-colors duration-150 hover:bg-card">
              See what’s inside
            </Link>
          </div>
          <p className="rise mt-5 text-footnote text-ink-3" style={{ animationDelay: '380ms' }}>
            {TERMS}
          </p>
        </section>

        {/* Everything in it, running, with what each would take to build. */}
        <section id="inside" className="mt-28 scroll-mt-20 sm:mt-36">
          <h2 className={h2}>
            Everything in Pro.
            <span className="block text-quiet">And what it would take to build it yourself.</span>
          </h2>
          <div className="mt-12 sm:mt-16">
            <Ledger />
          </div>
        </section>

        <section id="pricing" className="mt-32 scroll-mt-20 sm:mt-44">
          <h2 className={`${h2} text-center`}>
            One payment.
            <span className="block text-quiet">The {TOTAL_DAYS} days are on us.</span>
          </h2>
          <div className="mt-12 sm:mt-16">
            <Plans />
          </div>
          <p className="mt-8 text-center text-footnote text-ink-3">Pro + Templates is ${all.price}: everything above, and every template still to come.</p>
        </section>

        <section className="mx-auto mt-32 max-w-[900px] sm:mt-44">
          <h2 className={h2}>Questions.</h2>
          <div className="mt-10">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)]">
                <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[8px] py-5 text-headline text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="relative size-3.5 shrink-0 text-ink-3">
                    <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300 group-open/q:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-[680px] pb-6 text-callout text-ink-3">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-32 flex flex-col items-center text-center sm:mt-44">
          <h2 className={h2}>
            Ship the hard parts this week.
            <span className="block text-quiet">Not this quarter.</span>
          </h2>
          <Link href="#pricing" className="ring-focus mt-10 flex h-11 items-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-opacity duration-150 hover:opacity-90">
            {pro.cta} · ${pro.price}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
