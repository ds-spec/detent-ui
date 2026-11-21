import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { FREE_BLOCKS, PLANS, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { Alert, ArrowUpRight, Check } from '@/lab/icons'
import { JsonLd, NAME, crumbs, page, url } from '@/site/seo'
import { SitePage } from '@/site/sheets'
import { CHECKED, CHECKED_ISO, LIBRARIES } from './libraries'
import type { Library } from './libraries'
import { ProCta, Showcase } from './Showcase'
import { FitTable, PriceTable } from './Tables'
import { Toc } from './Toc'

const PATH = '/premium-shadcn-components'
const TITLE = 'Best Premium shadcn/ui Component Libraries (2026), Compared'
const LEDE = `Seven libraries of premium shadcn components, side by side: price, licence, updates, size and where each falls short. Prices checked ${CHECKED}.`

export const metadata: Metadata = page({ title: TITLE, absolute: true, description: LEDE, path: PATH })

const FREE = ENTRIES.length - PRO_COMPONENTS.length

const ROWS: Library[] = LIBRARIES.map((l) =>
  l.ours ? { ...l, free: `${FREE} components and ${FREE_BLOCKS.length} blocks, MIT`, components: `${ENTRIES.length}, ${PRO_COMPONENTS.length} Pro`, blocks: `${BLOCKS.length}`, templates: `${TEMPLATES.length}, a full app` } : l,
)

const FAQ: [string, string][] = [
  ['Is shadcn/ui itself free?', 'Yes. shadcn/ui is free and open source under MIT. The libraries here sell extra components, blocks and templates built for it, installed the same way, as code in your project.'],
  ['One-time or subscription: which is better?', 'For most solo developers and small teams, one-time. You pay once and keep the code and the updates. A subscription makes sense when you need a very large catalog for a short project, or team seats billed monthly.'],
  ['Can I use premium components in client work?', 'Usually yes. Every one-time library here allows commercial use in unlimited end products and forbids reselling the components themselves. Check each licence before you ship, since team use and seats differ.'],
  ['Do these work with Tailwind CSS v4?', 'The libraries here target current shadcn/ui, which runs on Tailwind CSS v4 with CSS variables for theming. If your project is still on v3, check the library’s docs before buying.'],
  ['Which one should I start with?', 'Start with the free tier of the one that matches your job. Building a marketing site, try the block libraries. Building the product itself, try components that people interact with, like Detent’s free set.'],
]

const TOC = [
  { id: 'picks', name: 'The short answer' },
  { id: 'table', name: 'Side by side' },
  { id: 'built', name: 'What each is built for' },
  { id: 'ai', name: 'Worth it now AI writes UI?' },
  { id: 'how', name: 'How we compared' },
  ...LIBRARIES.map((l) => ({ id: l.id, name: l.name, sub: true })),
  { id: 'choose', name: 'How to choose' },
  { id: 'free', name: 'Free options' },
  { id: 'faq', name: 'Questions' },
]

const H2 = 'scroll-mt-28 text-[clamp(24px,2.4vw,30px)] font-normal leading-[1.12] tracking-[-0.04em] text-ink'
const P = 'mt-4 text-[15px] leading-[1.75] text-ink-2'
const A = 'ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors duration-150 hover:decoration-ink'
const TEXT = 'max-w-[680px]'

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-surface-2 px-4 py-3">
      <p className="text-[11.5px] text-ink-3">{label}</p>
      <p className={`tnum mt-1 text-[14px] leading-[1.35] tracking-[-0.01em] ${value === 'Not stated' ? 'text-ink-3' : 'text-ink'}`}>{value === 'Not stated' ? '—' : value}</p>
    </div>
  )
}

function Card({ l, i }: { l: Library; i: number }) {
  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-surface p-5 sm:p-7 ${l.ours ? 'shadow-[var(--elev-raised)]' : 'shadow-[var(--card-edge)]'}`}>
      {l.ours ? <span aria-hidden className="pointer-events-none absolute inset-x-16 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70" /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="tnum text-[12px] text-ink-3">
            {i + 1} of {ROWS.length}
            {l.ours ? ' · Ours' : ''}
          </p>
          <h2 id={`${l.id}-title`} className="mt-1 text-[24px] leading-[1.15] tracking-[-0.035em] text-ink">
            {l.name}
          </h2>
          <p className="mt-1 text-[14px] text-ink-3">{l.bestFor}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <p className="tnum text-[20px] leading-none tracking-[-0.03em] text-ink">{l.price}</p>
          <p className="text-[12px] text-ink-3">{l.model === 'Subscription' ? 'Subscription' : 'Paid once'}{l.sale ? ` · on sale ${l.sale}` : ''}</p>
        </div>
      </div>

      <p className="mt-5 max-w-[640px] text-[14.5px] leading-[1.7] text-ink-2">{l.line}</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Components" value={l.components} />
        <Stat label="Blocks" value={l.blocks} />
        <Stat label="Templates" value={l.templates} />
      </div>

      <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <ul className="space-y-2">
          {l.good.map((g) => (
            <li key={g} className="flex gap-2.5 text-[13.5px] leading-[1.55] text-ink-2">
              <span className="mt-[3px] grid size-[16px] shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--ok)_14%,transparent)] text-ok">
                <Check size={10} strokeWidth={2.6} />
              </span>
              {g}
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {l.watch.map((w) => (
            <li key={w} className="flex gap-2.5 text-[13.5px] leading-[1.55] text-ink-2">
              <span className="mt-[3px] grid size-[16px] shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--warn,#d97706)_14%,transparent)] text-[var(--warn,#d97706)]">
                <Alert size={10} strokeWidth={2.4} />
              </span>
              {w}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3 pt-5 shadow-[inset_0_1px_0_var(--line)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] leading-[1.5] text-ink-3">
          {l.licence} · Updates: {l.updates.toLowerCase()}
        </p>
        {l.ours ? null : (
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="ring-focus group/v inline-flex h-8 shrink-0 items-center gap-1 self-start rounded-full px-3 text-[12.5px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97] sm:self-auto">
            Visit {l.name}
            <ArrowUpRight size={11} className="transition-transform duration-150 group-hover/v:-translate-y-px group-hover/v:translate-x-px" />
          </a>
        )}
      </div>
    </div>
  )
}

export default function PremiumShadcnComponents() {
  return (
    <SitePage>
      <JsonLd data={crumbs([['Premium shadcn components', PATH]])} />
      <JsonLd data={articleGraph()} />
      <div className="mx-auto max-w-[1300px] px-5 pt-12 sm:px-6 sm:pt-16 xl:grid xl:grid-cols-[minmax(0,1fr)_168px] xl:gap-12">
        <article className="min-w-0">
          <header className={TEXT}>
            <p className="flex items-center gap-2.5 text-[12.5px] text-ink-3">
              <img src="/icon.svg" alt="" width={22} height={22} className="rounded-[6px]" />
              <span>
                By the maker of Detent UI, <Out href="https://x.com/next_gendev">@next_gendev</Out> · Updated <time dateTime={CHECKED_ISO}>{CHECKED}</time>
              </span>
            </p>
            <h1 className="mt-5 text-[clamp(32px,4vw,50px)] font-normal leading-[1.05] tracking-[-0.05em] text-ink">{TITLE}</h1>
            <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-2">{LEDE}</p>
            <div className="mt-6 flex gap-3 rounded-[16px] bg-surface-2 px-4 py-3.5 text-[13.5px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">
              <span className="mt-[3px] grid size-[16px] shrink-0 place-items-center rounded-full bg-surface text-ink-3 shadow-[inset_0_0_0_1px_var(--line)]">
                <Alert size={10} strokeWidth={2.4} />
              </span>
              <p>
                <span className="text-ink">We make Detent UI, one of the seven.</span> It sits in the list with the same template as the others, weak spots included, and isn’t ranked first. Every other library’s details come from its own pages on {CHECKED}. No affiliate links: we earn nothing if you buy another library.
              </p>
            </div>
          </header>

          <section aria-labelledby="picks-title" id="picks" className="mt-14 scroll-mt-28">
            <h2 id="picks-title" className={H2}>
              The short answer
            </h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {ROWS.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className={`ring-focus group/p flex h-full items-start justify-between gap-4 rounded-[16px] px-4 py-3.5 transition-colors duration-150 ${l.ours ? 'bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_25%,transparent)]' : 'bg-surface shadow-[var(--card-edge)] hover:bg-surface-2'}`}>
                    <span className="min-w-0">
                      <span className="block text-[14px] text-ink">{l.name}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-ink-3">{l.bestFor}</span>
                    </span>
                    <span className="tnum shrink-0 text-[12.5px] text-ink-2">{l.price}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="table-title" id="table" className="mt-16 scroll-mt-28">
            <div className={TEXT}>
              <h2 id="table-title" className={H2}>
                Premium shadcn libraries, side by side
              </h2>
              <p className="mt-3 text-[13.5px] leading-[1.6] text-ink-3">Last verified {CHECKED}, from each library’s own pricing and licence pages. Prices in USD for one person; sales were running that week. — means it isn’t stated on their pages.</p>
            </div>
            <div className="mt-6">
              <PriceTable rows={ROWS} />
            </div>
            <p className="mt-5 text-[13.5px] leading-[1.6] text-ink-3">
              Building the inside of a product rather than a landing page? <Link href="#detent" className={A}>See Detent’s section</Link>, or <Link href="/pro" data-cta="seo-premium-table" className={A}>Detent Pro</Link> at ${PLANS[0].price}, once.
            </p>
          </section>

          <section aria-labelledby="built-title" id="built" className="mt-16 scroll-mt-28">
            <div className={TEXT}>
              <h2 id="built-title" className={H2}>
                What each one is built for
              </h2>
              <p className="mt-3 text-[13.5px] leading-[1.6] text-ink-3">Counts don’t tell you whether a library fits your product. This is what each one says it supports on its own pages. Most now work with coding agents through MCP; Detent doesn’t have its own MCP server yet.</p>
            </div>
            <div className="mt-6">
              <FitTable rows={ROWS} />
            </div>
          </section>

          <div className={TEXT}>
            <section aria-labelledby="premium-title" className="mt-16">
              <h2 id="premium-title" className={H2}>
                What “premium” should mean
              </h2>
              <p className={P}>
                <Out href="https://ui.shadcn.com">shadcn/ui</Out> gives you well-built basics for free: buttons, dialogs, menus, forms. A paid library is worth it when it saves you weeks on what shadcn/ui leaves out, which is usually one of three things: whole sections you would otherwise design from scratch, motion that makes a page feel alive, or components that do real work, like charts and agent views.
              </p>
              <p className={P}>Whichever you pick, it should install the shadcn way, as source files in your project, and take the theme you already have. You should never be locked into a package you can’t edit.</p>
            </section>

            <section aria-labelledby="ai-title" id="ai" className="mt-16 scroll-mt-28">
              <h2 id="ai-title" className={H2}>
                Are they still worth buying now that AI writes UI?
              </h2>
              <p className={P}>
                Ask Claude, Cursor or v0 for a pricing page and you get one in a minute. It usually works, and it usually looks like every other page the same model made that day: the default spacing, the default card, no states for loading or errors, nothing that responds when you press it.
              </p>
              <blockquote className="my-8 text-[clamp(20px,2vw,24px)] leading-[1.35] tracking-[-0.025em] text-ink">The first screen is easy. The tenth screen matching the first one is the hard part.</blockquote>
              <p className={P}>
                That is what a good library still sells: a set of pieces that already agree with each other, interactions someone has tested on a phone and with a keyboard, and patterns your agent can reuse instead of reinventing. So the question to ask is what your agent builds with. Give it well-made parts and the screens it writes come out better.
              </p>
              <p className={P}>
                Detent is built for this. Every piece has a page written for coding agents, with where it goes, a working example and its props, and one prompt connects Claude Code, Cursor or Codex to it. You can try it with a free piece like the <Out href="/components/prompt">Prompt box</Out> before paying for anything.
              </p>
            </section>

            <section aria-labelledby="how-title" id="how" className="mt-16 scroll-mt-28">
              <h2 id="how-title" className={H2}>
                How we compared them
              </h2>
              <dl className="mt-5 divide-y divide-[var(--line)] rounded-[18px] bg-surface shadow-[var(--card-edge)]">
                {(
                  [
                    ['Which libraries', 'Paid libraries built for shadcn/ui that show up when you search for premium shadcn components, still selling and updated in 2026, and that install as code in your own project. General React kits that don’t use shadcn/ui were left out.'],
                    ['What we compared', 'Price for one person, how you pay, what is free, how many components, blocks and templates you get, the licence, how long updates last, and what each says it supports.'],
                    ['How', `Each library’s own pricing page, licence, docs and public demos, read on ${CHECKED}. We didn’t buy every library, so notes on the others come from what they publish. Detent is the only one we build with every day.`],
                  ] as [string, string][]
                ).map(([t, d]) => (
                  <div key={t} className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                    <dt className="text-[13px] text-ink">{t}</dt>
                    <dd className="text-[13.5px] leading-[1.6] text-ink-3">{d}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <div className="mt-16 space-y-4">
            {ROWS.map((l, i) => (
              <section key={l.id} id={l.id} aria-labelledby={`${l.id}-title`} className="scroll-mt-28">
                <Card l={l} i={i} />
                {l.ours ? (
                  <>
                    <Showcase />
                    <ProCta />
                  </>
                ) : null}
              </section>
            ))}
          </div>

          <div className={TEXT}>
            <section aria-labelledby="choose-title" id="choose" className="mt-20 scroll-mt-28">
              <h2 id="choose-title" className={H2}>
                How to choose
              </h2>
              <ol className="mt-5 space-y-3">
                {(
                  [
                    ['Start from the job', 'A marketing site needs sections: shadcnblocks and shadcn.io have the most, Tailark the calmest, Aceternity and Magic UI the most motion. The inside of a product needs screens people use every day; shadcnblocks, shadcn studio and shadcn.io all sell dashboards, settings and tables. Detent has far fewer, and puts its effort into pieces that respond: charts you ask, runs you watch, comparisons you pick.'],
                    ['Then the way you pay', 'One payment suits a solo developer or a small team that builds for years. A subscription suits a big catalog for a short project. Read the licence for seats and client work before you buy.'],
                    ['Then try the free tier', 'Every library here has one. Install a free piece into your real project, switch to dark mode, and open it on your phone. That tells you more about the paid set than any list.'],
                  ] as [string, string][]
                ).map(([t, d], k) => (
                  <li key={t} className="flex gap-4 rounded-[18px] bg-surface p-5 shadow-[var(--card-edge)]">
                    <span className="tnum grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[12.5px] text-ink-2">{k + 1}</span>
                    <div>
                      <p className="text-[14.5px] text-ink">{t}</p>
                      <p className="mt-1 text-[13.5px] leading-[1.65] text-ink-3">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="free-title" id="free" className="mt-16 scroll-mt-28">
              <h2 id="free-title" className={H2}>
                If you don’t want to pay yet
              </h2>
              <p className={P}>
                <Out href="https://ui.shadcn.com">shadcn/ui</Out> covers the basics. <Out href="https://magicui.design">Magic UI</Out> and Aceternity’s free set add motion. Detent has {FREE} free components under MIT that you can <Out href="/components">try live here</Out>, like the <Out href="/components/diff">Diff review</Out> for showing what an agent changed, the <Out href="/components/metric">Metric explainer</Out> for a number that says why it moved, and the <Out href="/components/livelist">Live list</Out> for a shared checklist that updates as people tick it.
              </p>
            </section>

            <section aria-labelledby="faq-title" id="faq" className="mt-16 scroll-mt-28">
              <h2 id="faq-title" className={H2}>
                Questions
              </h2>
              <div className="mt-4">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
                    <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[6px] py-4 text-[15px] tracking-[-0.01em] text-ink transition-colors duration-150 hover:text-ink-2 [&::-webkit-details-marker]:hidden">
                      {q}
                      <span aria-hidden className="relative size-3 shrink-0 text-ink-3">
                        <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                        <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-200 group-open/q:scale-y-0" />
                      </span>
                    </summary>
                    <p className="pb-5 text-[14px] leading-[1.65] text-ink-3">{a}</p>
                  </details>
                ))}
              </div>
            </section>

            <section aria-label="Try Detent" className="mt-16">
              <div className="flex flex-col gap-5 rounded-[22px] bg-surface p-6 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[15.5px] leading-[1.4] tracking-[-0.015em] text-ink">
                  Start with the free set, upgrade when it earns it.
                  <span className="block text-[13px] tracking-normal text-ink-3">Detent Pro is ${PLANS[0].price} once, for life.</span>
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href="/components" className="ring-focus flex h-9 items-center rounded-full px-4 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
                    Free components
                  </Link>
                  <Link href="/pro" data-cta="seo-premium-end" className="ring-focus flex h-9 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
                    Get Detent Pro
                  </Link>
                </div>
              </div>
            </section>

            <aside aria-labelledby="author" className="mt-6 pb-8">
              <div className="flex gap-4 rounded-[20px] bg-surface-2 p-5 shadow-[inset_0_0_0_1px_var(--line)]">
                <img src="/icon.svg" alt="" width={36} height={36} className="size-9 shrink-0 rounded-[10px]" />
                <div>
                  <p id="author" className="text-[13px] text-ink">
                    About the author
                  </p>
                  <p className="mt-1 text-[13.5px] leading-[1.65] text-ink-3">
                    I’m a design engineer and I build Detent UI on my own: every component, block and template, and the site you are reading. I work in React, Tailwind CSS v4 and shadcn/ui every day and post what I make on <Out href="https://x.com/next_gendev">X</Out>. If a price or detail here is out of date, tell me there and I’ll fix it.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </article>

        <aside className="hidden xl:block">
          <Toc items={TOC} />
        </aside>
      </div>
    </SitePage>
  )
}
