import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { FREE_BLOCKS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATE_COUNT } from '@/catalog/templates'
import { ArrowUpRight } from '@/lab/icons'
import { BuyBar, BuyProvider } from '@/site/pro/Buy'
import { JsonLd, NAME, crumbs, page, url } from '@/site/seo'
import { SitePage } from '@/site/sheets'
import { CHECKED, CHECKED_ISO, LIBRARIES } from './libraries'
import type { Library } from './libraries'
import { Pieces } from './Pieces'

const PATH = '/premium-shadcn-components'
const TITLE = 'Best Premium shadcn/ui Component Libraries (2026), Compared'
const LEDE = `Seven paid shadcn/ui libraries side by side: price, licence, size, what each is best for and where each falls short. Prices checked ${CHECKED}.`

export const metadata: Metadata = page({ title: TITLE, absolute: true, description: LEDE, path: PATH })

const FREE = ENTRIES.length - PRO_COMPONENTS.length

const ROWS: Library[] = LIBRARIES.map((l) =>
  l.ours ? { ...l, free: `${FREE} components and ${FREE_BLOCKS.length} blocks, MIT`, size: `${ENTRIES.length} components, ${BLOCKS.length} blocks, ${TEMPLATE_COUNT}` } : l,
)

const FAQ: [string, string][] = [
  ['Is shadcn/ui itself free?', 'Yes. shadcn/ui is free and open source under MIT. The libraries here sell extra components, blocks and templates built for it, installed the same way, as code in your project.'],
  ['One-time or subscription: which is better?', 'For most solo developers and small teams, one-time. You pay once and keep the code and the updates. A subscription makes sense when you need a very large catalog for a short project, or team seats billed monthly.'],
  ['Can I use premium components in client work?', 'Usually yes. Every one-time library here allows commercial use in unlimited end products and forbids reselling the components themselves. Check each licence before you ship, since team use and seats differ.'],
  ['Do these work with Tailwind CSS v4?', 'The libraries here target current shadcn/ui, which runs on Tailwind CSS v4 with CSS variables for theming. If your project is still on v3, check the library’s docs before buying.'],
  ['Which one should I start with?', 'Start with the free tier of the one that matches your job. Building a marketing site, try the block libraries. Building the product itself, try components that people interact with, like Detent’s free set.'],
]

const H2 = 'scroll-mt-24 text-[clamp(26px,2.6vw,34px)] font-normal leading-[1.1] tracking-[-0.04em] text-ink'
const P = 'mt-4 text-[16px] leading-[1.7] text-ink-2'
const A = 'ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors duration-150 hover:decoration-ink'

function Out({ href, children }: { href: string; children: ReactNode }) {
  return href.startsWith('/') ? (
    <Link href={href} className={A}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={A}>
      {children}
    </a>
  )
}

const articleGraph = () => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: LEDE,
  url: url(PATH),
  datePublished: CHECKED_ISO,
  dateModified: CHECKED_ISO,
  author: { '@type': 'Person', name: 'The maker of Detent UI', url: 'https://x.com/next_gendev' },
  publisher: { '@type': 'Organization', name: NAME, url: url('/') },
  about: { '@type': 'ItemList', itemListElement: ROWS.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.name, url: l.url.startsWith('/') ? url(l.url) : l.url })) },
})

export default function PremiumShadcnComponents() {
  return (
    <SitePage>
      <JsonLd data={crumbs([['Premium shadcn components', PATH]])} />
      <JsonLd data={articleGraph()} />
      <article className="mx-auto max-w-[760px] px-5 pt-12 sm:px-6 sm:pt-16">
        <header>
          <p className="text-[13px] text-ink-3">
            Updated <time dateTime={CHECKED_ISO}>{CHECKED}</time> · By the maker of Detent UI,{' '}
            <Out href="https://x.com/next_gendev">@next_gendev</Out>
          </p>
          <h1 className="mt-4 text-[clamp(34px,4.4vw,56px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">{TITLE}</h1>
          <p className="mt-6 text-[18px] leading-[1.6] text-ink-2">{LEDE}</p>
          <p className="mt-6 rounded-[16px] bg-surface-2 px-5 py-4 text-[14.5px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">
            <span className="text-ink">We make Detent UI, one of the seven.</span> It is in the list with the same template as the others, its weak spots included, and it is not ranked first. Every other library’s price and size comes from its own pricing page on {CHECKED}.
          </p>
        </header>

        <section aria-labelledby="picks" className="mt-14">
          <h2 id="picks" className={H2}>
            The short answer
          </h2>
          <ul className="mt-5">
            {ROWS.map((l) => (
              <li key={l.id} className="flex flex-col gap-0.5 py-3 shadow-[inset_0_1px_0_var(--line)] sm:flex-row sm:gap-6">
                <a href={`#${l.id}`} className="ring-focus w-[180px] shrink-0 rounded-[4px] text-[15px] text-ink hover:underline">
                  {l.name}
                </a>
                <span className="text-[15px] leading-[1.55] text-ink-3">{l.bestFor}</span>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <section aria-labelledby="table" className="mx-auto mt-14 max-w-[1100px] px-5 sm:px-6">
        <h2 id="table" className={`${H2} mx-auto max-w-[712px]`}>
          Side by side
        </h2>
        <div className="mt-6 overflow-x-auto rounded-[20px] bg-surface shadow-[var(--card-edge)]">
          <table className="w-full min-w-[860px] text-left text-[14px]">
            <thead>
              <tr className="text-[12.5px] text-ink-3">
                {['Library', 'Price', 'Pay', 'Free tier', 'Size', 'Best for'].map((h) => (
                  <th key={h} scope="col" className="px-5 py-3.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((l) => (
                <tr key={l.id} className={`align-top shadow-[inset_0_1px_0_var(--line)] ${l.ours ? 'bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]' : ''}`}>
                  <th scope="row" className="px-5 py-4 font-normal text-ink">
                    {l.name}
                  </th>
                  <td className="px-5 py-4 text-ink-2">
                    <span className="tnum">{l.price}</span>
                    {l.sale ? <span className="mt-0.5 block text-[12.5px] text-ink-3">On sale: {l.sale}</span> : null}
                  </td>
                  <td className="px-5 py-4 text-ink-2">{l.model}</td>
                  <td className="px-5 py-4 text-ink-3">{l.free}</td>
                  <td className="px-5 py-4 text-ink-3">{l.size}</td>
                  <td className="px-5 py-4 text-ink-3">{l.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-3 max-w-[712px] text-[12.5px] text-ink-3">Prices in USD for one person, from each library’s pricing page on {CHECKED}. Sale prices were running that week and will change.</p>
      </section>

      <article className="mx-auto max-w-[760px] px-5 sm:px-6">
        <section aria-labelledby="premium" className="mt-16">
          <h2 id="premium" className={H2}>
            What “premium” should mean
          </h2>
          <p className={P}>
            <Out href="https://ui.shadcn.com">shadcn/ui</Out> gives you well-built basics for free: buttons, dialogs, menus, forms. A paid library is worth it when it saves you weeks on what shadcn/ui leaves out, which is usually one of three things: whole sections you would otherwise design from scratch, motion that makes a page feel alive, or components that do real work, like charts and agent views.
          </p>
          <p className={P}>
            Whichever you pick, it should install the shadcn way, as source files in your project, and take the theme you already have. You should never be locked into a package you can’t edit.
          </p>
        </section>

        <section aria-labelledby="how" className="mt-16">
          <h2 id="how" className={H2}>
            How we compared them
          </h2>
          <p className={P}>
            We read each library’s pricing page, licence and public demos on {CHECKED}, and noted the price for one person, whether you pay once or every month, what is free, and how much you get. The “good” and “watch out” notes come from those pages and demos. Detent is the only one we have built with day to day, so read its section knowing that.
          </p>
        </section>

        {ROWS.map((l, i) => (
          <section key={l.id} id={l.id} aria-labelledby={`${l.id}-title`} className="mt-16 scroll-mt-24">
            <p className="tnum text-[13px] text-ink-3">{i + 1} of {ROWS.length}</p>
            <h2 id={`${l.id}-title`} className={`${H2} mt-1`}>
              {l.name}
              <span className="block text-quiet">{l.bestFor}</span>
            </h2>
            <p className={P}>{l.line}</p>
            {l.ours ? (
              <div className="-mx-5 mt-8 sm:-mx-[120px]">
                <Pieces />
              </div>
            ) : null}
            <dl className="mt-6 grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2 text-[14.5px]">
              <dt className="text-ink-3">Price</dt>
              <dd className="text-ink-2">
                {l.price}, {l.model.toLowerCase()}
                {l.sale ? ` (on sale for ${l.sale} on ${CHECKED})` : ''}
              </dd>
              <dt className="text-ink-3">Free</dt>
              <dd className="text-ink-2">{l.free}</dd>
              <dt className="text-ink-3">Size</dt>
              <dd className="text-ink-2">{l.size}</dd>
            </dl>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-surface p-5 shadow-[var(--card-edge)]">
                <p className="text-[13px] text-ink-3">Good</p>
                <ul className="mt-2 space-y-1.5 text-[14.5px] leading-[1.55] text-ink-2">
                  {l.good.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[16px] bg-surface p-5 shadow-[var(--card-edge)]">
                <p className="text-[13px] text-ink-3">Watch out</p>
                <ul className="mt-2 space-y-1.5 text-[14.5px] leading-[1.55] text-ink-2">
                  {l.watch.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
            {l.ours ? (
              <div className="mt-6 overflow-hidden rounded-[16px] bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]">
                <p className="px-4 pt-3 font-mono text-[11.5px] text-ink-3">terminal</p>
                <pre className="overflow-x-auto px-4 pb-4 pt-2 font-mono text-[12.5px] leading-[20px] text-ink-2" translate="no">
                  npx shadcn add @detent-pro/region
                </pre>
              </div>
            ) : null}
            <p className="mt-5 text-[14.5px]">
              <Out href={l.url}>
                {l.ours ? 'See everything in Detent Pro' : `Visit ${l.name}`}
              </Out>
              {l.ours ? null : <ArrowUpRight size={12} className="ml-1 inline text-ink-3" />}
            </p>
          </section>
        ))}

        <section aria-labelledby="choose" className="mt-20">
          <h2 id="choose" className={H2}>
            How to choose
          </h2>
          <p className={P}>
            <span className="text-ink">Start from the job.</span> A marketing site needs sections: shadcnblocks and shadcn.io have the most, Tailark the calmest, Aceternity and Magic UI the most motion. The inside of a product needs components people use every day: charts, inputs, agent views. That is where Detent sits.
          </p>
          <p className={P}>
            <span className="text-ink">Then the way you pay.</span> One payment suits a solo developer or a small team that builds for years. A subscription suits a big catalog for a short project. Read the licence for seats and client work before you buy.
          </p>
          <p className={P}>
            <span className="text-ink">Then try the free tier.</span> Every library here has one. Install a free piece into your real project, switch to dark mode, and open it on your phone. That tells you more about the paid set than any list.
          </p>
        </section>

        <section aria-labelledby="free" className="mt-16">
          <h2 id="free" className={H2}>
            If you don’t want to pay yet
          </h2>
          <p className={P}>
            <Out href="https://ui.shadcn.com">shadcn/ui</Out> covers the basics. <Out href="https://magicui.design">Magic UI</Out> and Aceternity’s free set add motion. Detent has {FREE} free components under MIT that you can{' '}
            <Out href="/components">try live here</Out>.
          </p>
        </section>

        <section aria-labelledby="faq" className="mt-16">
          <h2 id="faq" className={H2}>
            Questions
          </h2>
          <div className="mt-4">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
                <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[6px] py-4 text-[16px] tracking-[-0.01em] text-ink transition-colors duration-150 hover:text-ink-2 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="relative size-3 shrink-0 text-ink-3">
                    <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-200 group-open/q:scale-y-0" />
                  </span>
                </summary>
                <p className="pb-5 text-[15px] leading-[1.65] text-ink-3">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <BuyProvider>
        <section className="mx-auto mt-24 max-w-[1360px] px-5 pb-8 sm:px-6">
          <p className="mb-6 text-center text-[15px] text-ink-3">If Detent fits what you’re building:</p>
          <BuyBar />
        </section>
      </BuyProvider>
    </SitePage>
  )
}
