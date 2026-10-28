import type { Metadata } from 'next'
import { PRO_BLOCKS, TOTAL_DAYS } from '@/catalog/effort'
import { PRO_COMPONENTS, SITE, TERMS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { BigBuy, BuyHead, BuyProvider, Choose, Stage } from '@/site/pro/Buy'
import { Compare, Inside } from '@/site/pro/Inside'
import { CopyCommand } from '@/site/parts'
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
  ['What’s the difference between the plans?', 'Pro is what you build the product with: the Pro components and every block. Pro + Templates adds the templates: whole apps to start from, including every template still to come. Team is everything, for up to five people.'],
  ['Does it work with the AI SDK?', 'Yes. useDetentChat takes what useChat gives you and returns the props for the streaming answer, the run waterfall and the approval card, so reasoning, tools, approvals and sources each land where they belong. The Agent chat block and Tandem run on it.'],
  ['Will it match my design?', 'Installed with shadcn, Detent takes on your theme: your primary becomes its accent, it uses your background, borders and muted text, and .dark turns it dark. Your fonts stay yours.'],
  ['How do I install Pro?', 'With the shadcn CLI, from Detent’s private registry. Add the registry and your licence key to the project once, as below, then install like anything else: npx shadcn add @detent-pro/diff. The source lands in your project.'],
  ['Can my team share one licence?', 'A licence is for one person. Team covers up to five people, with a key for each of them and one more for CI and shared repos.'],
  ['Can I use it for client work?', 'Yes, in as many projects as you like, commercial ones included. What you can’t do is resell or redistribute the components themselves.'],
  ['Do the free components stay free?', 'Yes. Everything free stays free, and keeps getting better alongside Pro.'],
  ['What if it’s not right for me?', `Email within ${REFUND_DAYS} days of buying and you get every cent back. No form, no questions.`],
]

/** Setting up the Pro registry in a project: the key, where it goes, and the first install. */
const STEPS: [string, string, string?][] = [
  ['Keep your licence key at hand', 'It’s in the email from your purchase. Put it in your project’s .env.local, which stays out of git.', 'DETENT_LICENSE_KEY=your-licence-key\n'],
  [
    'Add Detent Pro to components.json',
    'The registry sends your key with every install, so Pro installs like anything else.',
    `"registries": {\n  "@detent-pro": {\n    "url": "${SITE}/r/pro/{name}.json",\n    "headers": { "Authorization": "Bearer \${DETENT_LICENSE_KEY}" }\n  }\n}`,
  ],
  ['Install what you need', 'Each piece arrives as source in components/detent, with its theme and the packages it needs.', 'npx shadcn add @detent-pro/diff'],
]

const H2 = 'text-[clamp(32px,3.4vw,48px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink'

/**
 * Pro, sold the way a good shop sells one thing: the price first, with the thing itself running
 * beside two plain questions. Then everything in it by name, the plans side by side, the
 * questions people ask, and one button that is the price.
 */
export default function ProPage() {
  return (
    <SitePage>
      <JsonLd data={proGraph(FAQ)} />
      <BuyProvider>
        <section className="mx-auto max-w-[1360px] px-5 pt-8 sm:px-6 sm:pt-10">
          <BuyHead />
          <div className="rise mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-16" style={{ animationDelay: '220ms' }}>
            <Stage />
            <Choose />
          </div>
        </section>

        <section id="inside" aria-labelledby="inside-title" className="mx-auto mt-28 max-w-[1360px] scroll-mt-24 px-5 sm:mt-36 sm:px-6">
          <h2 id="inside-title" className={H2}>
            Everything in Pro.
            <span className="block text-quiet">Every piece, by name.</span>
          </h2>
          <div className="mt-10 sm:mt-14">
            <Inside />
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

        <section id="install" aria-labelledby="install-title" className="mx-auto mt-28 grid max-w-[1360px] scroll-mt-24 gap-x-16 gap-y-10 px-5 sm:mt-36 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <h2 id="install-title" className={H2}>
            Install Pro.
            <span className="block text-quiet">Once per project.</span>
          </h2>
          <ol>
            {STEPS.map(([title, line, code], i) => (
              <li key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 py-6 shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
                <span className="tnum pt-0.5 font-mono text-[13px] text-ink-3">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-[17px] tracking-[-0.01em] text-ink">{title}</p>
                  <p className="mt-1 max-w-[620px] text-[15px] leading-[1.6] text-ink-3">{line}</p>
                  {code &&
                    (code.includes('\n') ? (
                      <pre className="mt-4 overflow-x-auto rounded-[12px] bg-surface-2 px-4 py-3.5 font-mono text-[13px] leading-[1.65] text-ink-2 [scrollbar-width:thin]">{code}</pre>
                    ) : (
                      <div className="mt-4 max-w-[520px]">
                        <CopyCommand command={code} fill />
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ol>
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
