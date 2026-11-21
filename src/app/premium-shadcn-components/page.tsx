import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { FREE_BLOCKS, PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATE_COUNT } from '@/catalog/templates'
import { ArrowUpRight } from '@/lab/icons'
import { JsonLd, NAME, crumbs, page, url } from '@/site/seo'
import { SitePage } from '@/site/sheets'
import { CHECKED, CHECKED_ISO, LIBRARIES } from './libraries'
import type { Library } from './libraries'
import { ProCta, Showcase } from './Showcase'

const PATH = '/premium-shadcn-components'
const TITLE = 'Best Premium shadcn/ui Component Libraries (2026), Compared'
const LEDE = `Seven paid shadcn/ui libraries side by side: price, licence, updates, size, what each is best for and where each falls short. Prices checked ${CHECKED}.`

export const metadata: Metadata = page({ title: TITLE, absolute: true, description: LEDE, path: PATH })

const FREE = ENTRIES.length - PRO_COMPONENTS.length

const ROWS: Library[] = LIBRARIES.map((l) =>
  l.ours
    ? { ...l, free: `${FREE} components and ${FREE_BLOCKS.length} blocks, MIT`, components: `${ENTRIES.length}, ${PRO_COMPONENTS.length} of them Pro`, blocks: `${BLOCKS.length}`, templates: TEMPLATE_COUNT.replace(/ templates?$/, '') + ', a full app' }
    : l,
)

const COLS: { label: string; width: string; strong?: boolean; cell: (l: Library) => ReactNode }[] = [
  { label: 'Library', width: '', cell: (l) => l.name },
  {
    label: 'Price',
    width: 'w-[170px]',
    strong: true,
    cell: (l) => (
      <>
        <span className="tnum">{l.price}</span>
        {l.sale ? <span className="mt-0.5 block text-[12.5px] text-ink-3">On sale: {l.sale}</span> : null}
      </>
    ),
  },
  { label: 'Pay', width: 'w-[110px]', strong: true, cell: (l) => l.model },
  { label: 'Components', width: 'w-[130px]', cell: (l) => l.components },
  { label: 'Blocks', width: 'w-[120px]', cell: (l) => l.blocks },
  { label: 'Templates', width: 'w-[140px]', cell: (l) => l.templates },
  { label: 'Code', width: 'w-[160px]', cell: (l) => l.code },
  { label: 'Licence', width: 'w-[200px]', cell: (l) => l.licence },
  { label: 'Updates', width: 'w-[150px]', cell: (l) => l.updates },
  { label: 'Free tier', width: 'w-[170px]', cell: (l) => l.free },
  { label: 'Best for', width: 'w-[190px]', cell: (l) => l.bestFor },
]

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
            <span className="text-ink">We make Detent UI, one of the seven.</span> It is in the list with the same template as the others, its weak spots included, and it is not ranked first. Every other library’s price and size comes from its own pricing page on {CHECKED}. None of the links here are affiliate links: we earn nothing if you buy another library.
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

      <section aria-labelledby="table" className="mx-auto mt-14 max-w-[1360px] px-5 sm:px-6">
        <h2 id="table" className={`${H2} mx-auto max-w-[712px]`}>
          Side by side
        </h2>
        <p className="mx-auto mt-3 max-w-[712px] text-[14px] text-ink-3">Last verified {CHECKED}, from each library’s own pricing and licence pages. Scroll sideways for every column.</p>
        <div className="mt-6 overflow-x-auto rounded-[20px] bg-surface shadow-[var(--card-edge)]">
          <table className="w-full min-w-[1480px] text-left text-[13.5px] leading-[1.5]">
            <thead>
              <tr className="text-[12.5px] text-ink-3">
                {COLS.map((c, k) => (
                  <th key={c.label} scope="col" className={`px-4 py-3.5 font-normal ${k === 0 ? 'sticky left-0 z-10 bg-surface' : ''}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((l) => (
                <tr key={l.id} className="align-top [&>*]:shadow-[inset_0_1px_0_var(--line)]">
                  <th scope="row" className={`sticky left-0 z-10 w-[150px] px-4 py-4 font-normal text-ink ${l.ours ? 'bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))]' : 'bg-surface'}`}>
                    {l.name}
                    {l.ours ? <span className="mt-0.5 block text-[12px] text-ink-3">Ours</span> : null}
                  </th>
                  {COLS.slice(1).map((c) => (
                    <td key={c.label} className={`px-4 py-4 ${c.width} ${l.ours ? 'bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))]' : ''} ${c.strong ? 'text-ink-2' : 'text-ink-3'}`}>
                      {c.cell(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-3 max-w-[712px] text-[12.5px] text-ink-3">Prices in USD for one person. Sale prices were running that week and will change. “Not stated” means we couldn’t find it on the library’s own pages.</p>
        <p className="mx-auto mt-6 max-w-[712px] text-[14.5px] leading-[1.6] text-ink-3">
          Building the inside of a product rather than a landing page? <Link href="#detent" className={A}>See Detent’s section</Link>, or <Link href="/pro" data-cta="seo-premium-table" className={A}>Detent Pro</Link> at ${PLANS[0].price}, once.
        </p>
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

        <section aria-labelledby="ai" className="mt-16">
          <h2 id="ai" className={H2}>
            Are they still worth buying now that AI writes UI?
          </h2>
          <p className={P}>
            Ask Claude, Cursor or v0 for a pricing page and you get one in a minute. It usually works, and it usually looks like every other page the same model made that day: the default spacing, the default card, no states for loading or errors, nothing that responds when you press it. The first screen is easy. The tenth screen matching the first one is the hard part.
          </p>
          <p className={P}>
            That is what a good library still sells: a set of pieces that already agree with each other, interactions someone has tested on a phone and with a keyboard, and patterns your agent can reuse instead of reinventing. The useful question isn’t “AI or a library” but “what does my agent build with?” Give it well-made parts and the screens it writes come out better.
          </p>
          <p className={P}>
            Detent leans into that. Every piece has a page written for coding agents, with where it goes, a working example and its props, and one prompt connects Claude Code, Cursor or Codex to it. You can try it with a free piece like the{' '}
            <Link href="/components/prompt" className={A}>
              Prompt box
            </Link>{' '}
            before paying for anything.
          </p>
        </section>

        <section aria-labelledby="how" className="mt-16">
          <h2 id="how" className={H2}>
            How we compared them
          </h2>
          <p className={P}>
            <span className="text-ink">Which libraries.</span> Paid libraries built for shadcn/ui that show up when you search for premium shadcn components, still selling and updated in 2026, and that install as code in your own project. We left out general React kits that don’t use shadcn/ui.
          </p>
          <p className={P}>
            <span className="text-ink">What we compared.</span> Price for one person, whether you pay once or every month, what is free, how many components, blocks and templates you get, the licence and how long updates last.
          </p>
          <p className={P}>
            <span className="text-ink">How.</span> We read each library’s own pricing page, licence and public demos on {CHECKED}. We did not buy every library, so the notes on the others come from what they publish and show. Detent is the only one we build with every day, so read its section knowing that.
          </p>
        </section>
      </article>

      {ROWS.map((l, i) => (
        <section key={l.id} id={l.id} aria-labelledby={`${l.id}-title`} className="mt-16 scroll-mt-24">
          <div className="mx-auto max-w-[760px] px-5 sm:px-6">
            <p className="tnum text-[13px] text-ink-3">{i + 1} of {ROWS.length}</p>
            <h2 id={`${l.id}-title`} className={`${H2} mt-1`}>
              {l.name}
              <span className="block text-quiet">{l.bestFor}</span>
            </h2>
            <p className={P}>{l.line}</p>
          </div>
          {l.ours ? <Showcase /> : null}
          <div className="mx-auto max-w-[760px] px-5 sm:px-6">
            <dl className="mt-6 grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2 text-[14.5px]">
              {COLS.slice(1, -1).map((c) => (
                <div key={c.label} className="contents">
                  <dt className="text-ink-3">{c.label}</dt>
                  <dd className="text-ink-2">{c.cell(l)}</dd>
                </div>
              ))}
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
            {l.ours ? <ProCta /> : (
              <p className="mt-5 text-[14.5px]">
                <Out href={l.url}>Visit {l.name}</Out>
                <ArrowUpRight size={12} className="ml-1 inline text-ink-3" />
              </p>
            )}
          </div>
        </section>
      ))}

      <article className="mx-auto max-w-[760px] px-5 sm:px-6">
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
            <Out href="https://ui.shadcn.com">shadcn/ui</Out> covers the basics. <Out href="https://magicui.design">Magic UI</Out> and Aceternity’s free set add motion. Detent has {FREE} free components under MIT that you can <Out href="/components">try live here</Out>, like the <Out href="/components/diff">Diff review</Out> for showing what an agent changed, the <Out href="/components/metric">Metric explainer</Out> for a number that says why it moved, and the <Out href="/components/livelist">Live list</Out> for a shared checklist that updates as people tick it.
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

      <section aria-label="Try Detent" className="mx-auto mt-20 max-w-[760px] px-5 sm:px-6">
        <div className="flex flex-col gap-5 rounded-[24px] bg-surface p-6 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <p className="text-[17px] leading-[1.4] tracking-[-0.015em] text-ink">
            Start with the free set, upgrade when it earns it.
            <span className="block text-[14px] tracking-normal text-ink-3">Detent Pro is ${PLANS[0].price} once, for life.</span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/components" className="ring-focus flex h-10 items-center rounded-full px-4 text-[14px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
              Free components
            </Link>
            <Link href="/pro" data-cta="seo-premium-end" className="ring-focus flex h-10 items-center rounded-full bg-ink px-4 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
              Get Detent Pro
            </Link>
          </div>
        </div>
      </section>

      <aside aria-labelledby="author" className="mx-auto mt-10 max-w-[760px] px-5 pb-8 sm:px-6">
        <div className="rounded-[20px] bg-surface-2 p-6 shadow-[inset_0_0_0_1px_var(--line)]">
          <p id="author" className="text-[13px] text-ink-3">
            About the author
          </p>
          <p className="mt-2 text-[15px] leading-[1.65] text-ink-2">
            I’m a design engineer and I build Detent UI on my own: every component, block and template, and the site you are reading. I work in React, Tailwind CSS v4 and shadcn/ui every day and post what I make on <Out href="https://x.com/next_gendev">X</Out>. If a price or detail here is out of date, tell me there and I’ll fix it.
          </p>
        </div>
      </aside>
    </SitePage>
  )
}
