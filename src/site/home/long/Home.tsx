'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { block } from '@/catalog/blocks'
import { DEMOS } from '@/catalog/demos'
import { ENTRIES } from '@/catalog/meta'
import { installCommand, isProBlock, isProComponent, PLANS } from '@/catalog/pro'
import { SIZE, TILE } from '@/catalog/sizes'
import { TEMPLATES } from '@/catalog/templates'
import { ArrowDown, ArrowRight, ArrowUpRight } from '@/lab/icons'
import { InPlay } from '@/lab/blocks/kit/director'
import { InDirectory } from '@/site/Directory'
import { DitherWord } from '@/site/Dither'
import { HomeScreens } from '@/site/home/HomeScreens'
import type { Tone } from '@/site/home/lights'
import { Keys } from '@/site/pro/Keys'
import { Quotes } from '@/site/pro/Quotes'
import { wellOf } from '@/site/wells'
import type { Latest } from '@/catalog/latest'
import { BlockPiece, TemplatePiece } from '@/site/library/Library'
import { Mini } from '@/site/Mini'
import { CopyCommand } from '@/site/parts'
import { PriceNow } from '@/site/Promo'
import { Compare } from './Compare'
import { PricingCards } from '@/site/pro/Cards'
import { H2, Leaf, PILL_DARK, PILL_PRO, PILL_SOFT, ProBadge, SECTION, Tabs, WRAP } from './parts'

const PRICE = PLANS[0].price

type Counts = { total: number; free: number; blocks: number; templates: number; pro: number; fresh: Latest }

export function Home(n: Counts) {
  return (
    <div className="pb-3" style={{ background: 'var(--ground)' }}>
      <style>{`@keyframes tile-wait { 0%,100% { opacity: .45 } 50% { opacity: .9 } } .tile-wait { animation: tile-wait 1.6s ease-in-out infinite } @media (prefers-reduced-motion: reduce) { .tile-wait { animation: none } }`}</style>
      <ProBar pro={n.pro} />
      <Leaf>
        <Hero {...n} />
      </Leaf>
      <div className="mt-3">
        <Leaf>
          <Templates />
        </Leaf>
      </div>
      <div className="mt-3">
        <HomeScreens />
        <div className="flex justify-center pb-4 pt-8">
          <Link href="/pro" data-cta="home-screens" className={PILL_PRO}>
            Get every screen with Pro, <PriceNow value={PRICE} /> once
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="mt-3">
        <Leaf>
          <Doors />
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <section className={SECTION}>
            <h2 className={H2}>
              Your AI can copy the look.
              <span className="block text-quiet">Not the states.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[560px] px-5 text-center text-[16px] leading-[1.6] text-ink-3">
              A screenshot shows one moment. A real AI product has dozens: streaming, tool calls, failures, retries, approvals, empty data. Same prompt, two builds: your agent alone, and your agent with Detent.
            </p>
            <div className="mt-10">
              <Compare />
            </div>
          </section>
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <Voices />
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <Close />
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <Questions free={n.total - n.pro} total={n.total} />
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <Library {...n} />
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <Charts />
        </Leaf>
      </div>
      <div className="mt-3">
        <Leaf>
          <Own />
        </Leaf>
      </div>
    </div>
  )
}

/* 1. The thin bar on top: what only Pro has. */
function ProBar({ pro }: { pro: number }) {
  return (
    <Link href="/pro" className="ring-focus group flex h-10 items-center justify-center gap-2 px-4 text-[13px] text-ink-2 transition-colors hover:text-ink">
      <ProBadge />
      <span className="truncate">
        <span className="text-ink">The Detent app template</span>, every whole screen and {pro} more components, only in Pro
      </span>
      <ArrowUpRight size={12} className="shrink-0 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px" />
    </Link>
  )
}

/* 2. Hero: what's new, the line Detent already owns, two ways in, the counts and the proof. */
function Hero({ total, free, blocks, templates }: Counts) {
  return (
    <section className="flex flex-col items-center px-5 pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
      <Link
        href="/components"
        className="rise group inline-flex h-8 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] pl-1 pr-3 text-[13px] text-ink-2 transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-ink"
      >
        <span className="whitespace-nowrap rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[12px] text-ink">{free} free</span>
        <span className="whitespace-nowrap">
          {total + blocks + templates}<span className="sm:hidden"> in the library</span>
          <span className="hidden sm:inline"> components, blocks and templates</span>
        </span>
        <ArrowRight size={12} className="text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
      <h1 className="focus-in mt-7 text-[clamp(36px,5vw,74px)] font-normal leading-[1.01] tracking-[-0.055em] text-ink">
        Make your AI product
        <br />
        <span className="text-quiet">
          feel <DitherWord color="var(--accent)">expensive</DitherWord>.
        </span>
      </h1>
      <p className="rise mt-6 max-w-[540px] text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
        Agent chat, voice, evals and a full AI workspace template, with every state worked out. Ship this week. <PriceNow value={PRICE} />{'\u00a0'}once.
      </p>
      <div className="rise mt-8 flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: '180ms' }}>
        <Link href="/pro" data-cta="home-hero" className={PILL_DARK}>
          Get Pro · <PriceNow value={PRICE} /> once
        </Link>
        <a href="#templates" className={PILL_SOFT}>
          Try them live
          <ArrowDown size={13} />
        </a>
      </div>
      <p className="rise mt-3 text-[13px] text-ink-3" style={{ animationDelay: '220ms' }}>
        One payment. Every update for life. The code is yours.
      </p>
      <div className="rise mt-9 flex flex-col items-center gap-1.5 text-[13px] text-ink-3" style={{ animationDelay: '280ms' }}>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <a href="https://x.com/next_gendev/status/2119335361554030899" target="_blank" rel="noopener noreferrer" className="ring-focus rounded-[4px] transition-colors hover:text-ink">
            1,000+ bookmarks on X
          </a>
          <span aria-hidden>·</span>
          <InDirectory />
          <span aria-hidden>·</span>
          <span>Featured in Shadcn Weekly #8</span>
        </div>
      </div>
    </section>
  )
}

/* 3. The library, in tabs: six big live cards each. */
export type Item = { id: string; name: string; line: string; pro: boolean; href: string; tone: Tone; piece: (ready: () => void) => ReactNode }
const FAMILY_TONE: Record<string, Tone> = { agents: 'blue', data: 'amber', inputs: 'rose', feedback: 'violet', essentials: 'violet', overlays: 'rose', marketing: 'amber' }
const KIND_TONE: Record<string, Tone> = { app: 'blue', flow: 'violet', section: 'amber' }

export function Piece({ id, onReady, max = 0.75 }: { id: string; onReady?: () => void; max?: number }) {
  const Demo = DEMOS[id]
  const e = ENTRIES.find((x) => x.id === id)
  if (!Demo || !e) return null
  const size = TILE[id] ?? SIZE[id]
  return (
    <Mini pad={22} max={max} onReady={onReady}>
      {e.bleed && size ? (
        <div className="relative" style={{ width: size[0], height: size[1] }}>
          <Demo />
        </div>
      ) : (
        <Demo />
      )}
    </Mini>
  )
}

const comp = (id: string): Item => {
  const e = ENTRIES.find((x) => x.id === id)!
  return { id, name: e.name, line: e.short ?? e.line, pro: isProComponent(id), href: `/components/${id}`, tone: FAMILY_TONE[e.category] ?? 'blue', piece: (r) => <Piece id={id} onReady={r} /> }
}
const blk = (id: string): Item => {
  const b = block(id)!
  return { id, name: b.name, line: b.line, pro: isProBlock(id), href: `/blocks/${id}`, tone: KIND_TONE[b.kind] ?? 'blue', piece: (r) => <BlockPiece id={id} onReady={r} /> }
}
const SHELVES = {
  components: { label: 'Components', all: '/components', items: () => ['askchart', 'trace', 'agent-wallet', 'extract', 'chart', 'livelist'].map(comp) },
  blocks: { label: 'Blocks', all: '/blocks', items: () => ['agent-chat', 'support-inbox', 'evals', 'task-to-merge', 'onboarding', 'pricing'].map(blk) },
  templates: {
    label: 'Templates',
    all: '/templates',
    items: () => TEMPLATES.map((t) => ({ id: t.id, name: t.name, line: `${t.kind}. ${t.line}`, pro: true, href: `/templates/${t.id}`, tone: 'violet' as Tone, piece: (r: () => void) => <TemplatePiece id={t.id} onReady={r} /> })),
  },
} as const
type Shelf = keyof typeof SHELVES

const PRO_LINE: Record<Shelf, ReactNode> = {
  components: (
    <>
      <span className="text-ink">Half of these are Pro.</span> All of them, and every one we add, for $99 once
    </>
  ),
  blocks: (
    <>
      <span className="text-ink">Every whole screen is in Pro.</span> Install one and change it like your own code
    </>
  ),
  templates: (
    <>
      <span className="text-ink">Both templates come with Pro.</span> Rename it and ship
    </>
  ),
}

/* A library card: a soft placeholder with the piece's name holds the space until the live piece is in. */
export function Tile({ it, wide = false }: { it: Item; wide?: boolean }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 4000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="group relative block rounded-[16px] bg-[var(--mount)] p-2 shadow-[0_0_0_1px_var(--line)] transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--line-strong),0_12px_30px_-16px_rgb(0_0_0/0.18)]">
      <div className={`relative isolate ${wide ? 'aspect-[4/3] sm:aspect-[16/9]' : 'aspect-[4/3]'} overflow-clip rounded-[10px] shadow-[0_0_0_1px_var(--line)]`} style={{ background: wellOf(it.tone) }}>
        <div aria-hidden inert className={`pointer-events-none absolute inset-0 transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(0.2,0.9,0.25,1)] group-hover:scale-[1.02] ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <InPlay.Provider value>{it.piece(() => setReady(true))}</InPlay.Provider>
        </div>
        <div aria-hidden className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${ready ? 'opacity-0' : 'opacity-100'}`}>
          <span className="tile-wait text-[13px] text-ink-3">{it.name}</span>
        </div>
        {it.pro && (
          <span className="absolute right-2.5 top-2.5">
            <ProBadge />
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 px-1.5 pb-0.5 pt-2.5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] text-ink">{it.name}</span>
          <span className="block truncate text-[13px] text-ink-3">{it.line}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[13px] text-ink-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {it.pro ? 'In Pro' : 'Free'}
          <ArrowUpRight size={12} />
        </span>
      </div>
      <Link href={it.href} aria-label={`${it.name}, ${it.pro ? 'in Pro' : 'free'}`} className="ring-focus absolute inset-0 z-10 rounded-[16px]" />
    </div>
  )
}

function Library({ total, blocks, templates }: Counts) {
  const [tab, setTab] = useState<Shelf>('components')
  const shelf = SHELVES[tab]
  const count = { components: total, blocks, templates }
  return (
    <section id="library" className={`${SECTION} scroll-mt-16`}>
      <h2 className={H2}>
        These aren’t screenshots.
        <span className="block text-quiet">Go on, use one.</span>
      </h2>
      <div className="mt-10">
        <Tabs label="Library" value={tab} onChange={(v) => setTab(v as Shelf)} items={(Object.keys(SHELVES) as Shelf[]).map((k) => ({ id: k, label: SHELVES[k].label }))} />
      </div>
      <p className="mt-4 px-5 text-center text-[14px] text-ink-3">
        <Link href="/pro" className="ring-focus group rounded-[6px] transition-colors hover:text-ink">
          {PRO_LINE[tab]}
          <ArrowUpRight size={12} className="ml-1 inline-block align-[-1px] transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px" />
        </Link>
      </p>
      <ul key={tab} className={`${WRAP} mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3`}>
        {shelf.items().map((it) => (
          <li key={it.id} className="min-w-0">
            <Tile it={it} />
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center">
        <Link href={shelf.all} className={PILL_SOFT}>
          All {count[tab]} {shelf.label.toLowerCase()}
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </section>
  )
}

/* 4. Proof, the Detent way: the keyboard of faces. */
function Voices() {
  return (
    <section className={`${SECTION} ${WRAP} !max-w-[1240px]`}>
      <h2 className={H2}>
        People write to me about Detent.
        <span className="block text-quiet">I kept a few.</span>
      </h2>
      <div className="mt-10 md:hidden">
        <Quotes />
      </div>
      <div className="mt-14 hidden md:block">
        <Keys />
      </div>
    </section>
  )
}

/* 6. Charts: the part of Detent others don't have. Two free, two Pro, all live. */
const CHARTS = ['chart', 'trend', 'askchart', 'bridge']
export function Charts() {
  return (
    <section className={SECTION}>
      <h2 className={H2}>
        Charts that say what changed.
        <span className="block text-quiet">Not just bars and lines.</span>
      </h2>
      <p className="mx-auto mt-5 max-w-[520px] px-5 text-center text-[16px] leading-[1.6] text-ink-3">Each of these says what changed in words, right next to the picture. Press, drag and hover, they’re the real components.</p>
      <ul className={`${WRAP} !max-w-[1120px] mt-10 grid gap-3.5 sm:grid-cols-2`}>
        {CHARTS.map((id) => (
          <li key={id} className="min-w-0">
            <Tile it={comp(id)} />
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center">
        <Link href="/components" className={PILL_SOFT}>
          See every chart
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </section>
  )
}

/* 7. Takes your theme: one stage you can restyle, instead of a row of feature cards. */
const THEMES = [
  { name: 'Blue', accent: '#3d6dff' },
  { name: 'Violet', accent: '#7c3aed' },
  { name: 'Rose', accent: '#e11d74' },
  { name: 'Green', accent: '#0f9f6e' },
]
/* The AI calendar reads --accent all through, so the swatches change it for real. */
const THEMED = 'week'
export function Own() {
  const [theme, setTheme] = useState(THEMES[0])
  const [dark, setDark] = useState(false)
  const Piece = DEMOS[THEMED]
  return (
    <section className={`${SECTION} mx-auto grid max-w-[1240px] items-center gap-x-14 gap-y-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]`}>
      <div>
        <h2 className={`${H2} lg:!text-left`}>
          Drop it in.
          <span className="block text-quiet">It looks like yours.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[440px] text-center text-[16px] leading-[1.6] text-ink-3 lg:mx-0 lg:text-left">
          Detent reads your shadcn theme. Your primary becomes its accent, it uses your background, borders and muted text, and .dark turns it dark. The source lands in your project, yours to change.
        </p>
        <div className="mx-auto mt-7 max-w-[400px] lg:mx-0">
          <CopyCommand fill command={installCommand(THEMED, !isProComponent(THEMED))} />
          <p className="mt-2 text-center text-[13px] text-ink-3 lg:text-left">The AI calendar is free, MIT. Try it in your app now.</p>
        </div>
        <div className="mt-5 flex justify-center lg:justify-start">
          <Link href="/system" className="ring-focus group flex items-center gap-1 rounded-[6px] text-[14px] text-ink-2 transition-colors hover:text-ink">
            See the tokens it reads
            <ArrowUpRight size={13} className="transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px" />
          </Link>
        </div>
      </div>

      <div className="rounded-[20px] bg-[var(--mount)] p-2 shadow-[0_0_0_1px_var(--line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2.5 pt-1">
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Primary colour">
            {THEMES.map((t) => (
              <button
                key={t.name}
                type="button"
                role="radio"
                aria-checked={t.name === theme.name}
                aria-label={t.name}
                onClick={() => setTheme(t)}
                className="ring-focus size-[22px] rounded-full transition-transform duration-150 active:scale-90"
                style={{ background: t.accent, boxShadow: t.name === theme.name ? `0 0 0 2px var(--mount), 0 0 0 3.5px ${t.accent}` : 'inset 0 0 0 1px rgb(0 0 0 / 0.08)' }}
              />
            ))}
            <span className="ml-1.5 text-[13px] text-ink-3">--primary</span>
          </div>
          <div className="flex gap-1 rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] p-1" role="radiogroup" aria-label="Mode">
            {(['Light', 'Dark'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={(m === 'Dark') === dark}
                onClick={() => setDark(m === 'Dark')}
                className={`ring-focus h-7 rounded-full px-3 text-[13px] transition-[background-color,color] duration-150 ${(m === 'Dark') === dark ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--line)]' : 'text-ink-3 hover:text-ink'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div
          data-theme={dark ? 'dark' : 'light'}
          className="relative isolate aspect-[16/10] overflow-clip rounded-[12px] shadow-[0_0_0_1px_var(--line)] transition-[background-color] duration-300"
          style={{ background: 'var(--surface)', colorScheme: dark ? 'dark' : 'light', '--accent': theme.accent, '--color-accent': theme.accent } as CSSProperties}
        >
          {Piece ? (
            <Mini pad={24} max={0.95}>
              <Piece />
            </Mini>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* 9. Questions. */
function Questions({ free, total }: { free: number; total: number }) {
  const qa: [string, string][] = [
    ['Is it a subscription?', 'No. Pay once and keep every update and every new piece, for life.'],
    ['I’m not a designer. Will it look good?', 'Yes. Every piece is already designed, and it takes your shadcn theme and dark mode, so it matches your app out of the box.'],
    ['What is Detent?', 'React components, whole screens and templates for AI products and the app around them. They install with the shadcn CLI, land in your project as source, and take on your theme.'],
    ['Do I need shadcn or Tailwind?', 'Detent installs with the shadcn CLI into a React project with Tailwind CSS v4. Next.js is what we test on.'],
    ['How do I install a piece?', `Run the command on its page, like ${installCommand('chart', true)}, or ask your coding agent and it does it for you.`],
    ['Does it work with Claude Code, Cursor or Codex?', 'Yes. Give your agent the setup prompt once. Every piece has a page written for agents, so it places it well instead of guessing.'],
    ['Does it work in light and dark mode?', 'Yes. Every piece reads your theme tokens, and .dark turns it dark.'],
    ['What is free and what is Pro?', `${free} of the ${total} components and five website blocks are free under MIT, for anyone. Pro adds the rest, every whole screen and both templates, for $${PRICE} once.`],
    ['What do I get with Pro?', 'Every Pro component, every whole screen (agent chat, support inbox, evals and more), both app templates, and the plans your agent builds whole pages from. One payment, every update for life.'],
    ['Can I use it in client projects?', 'Yes, in as many projects as you like, commercial ones included. You can’t resell the components themselves.'],
  ]
  return (
    <section className={`${SECTION} mx-auto grid max-w-[1240px] gap-x-16 gap-y-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]`}>
      <h2 className={`${H2} lg:!text-left`}>
        Questions.
        <span className="block text-quiet">Before you start.</span>
      </h2>
      <div>
        {qa.map(([q, a]) => (
          <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
            <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[6px] py-5 text-[17px] tracking-[-0.01em] text-ink transition-colors duration-150 hover:text-ink-2 [&::-webkit-details-marker]:hidden">
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
  )
}

/* 3. The Detent workspace template, running live: what most buyers install first. */
function Templates() {
  const app = TEMPLATES.find((t) => t.form === 'app')
  const site = TEMPLATES.find((t) => t.form !== 'app')
  if (!app) return null
  return (
    <section id="templates" className={`${SECTION} scroll-mt-16`}>
      <h2 className={H2}>
        Start from a finished AI app.
        <span className="block text-quiet">Not a blank page.</span>
      </h2>
      <p className="mx-auto mt-5 max-w-[540px] px-5 text-center text-[16px] leading-[1.6] text-ink-3">{app.pitch} Clone it, rename it, ship it.</p>
      <div className={`${WRAP} !max-w-[1120px] mt-10`}>
        <Tile wide it={{ id: app.id, name: `${app.name} · AI workspace template`, line: app.line, pro: true, href: `/templates/${app.id}`, tone: 'violet', piece: (r) => <TemplatePiece id={app.id} onReady={r} /> }} />
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/pro" data-cta="home-templates" className={PILL_DARK}>
          Get it with Pro · <PriceNow value={PRICE} /> once
        </Link>
        <Link href={`/templates/${app.id}`} className={PILL_SOFT}>
          Try the whole app
          <ArrowUpRight size={13} />
        </Link>
      </div>
      {site && (
        <p className="mt-5 px-5 text-center text-[14px] text-ink-3">
          Also in Pro:{' '}
          <Link href={`/templates/${site.id}`} className="ring-focus rounded-[4px] text-ink-2 underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors hover:text-ink">
            {site.name}, the landing page for an AI agent
          </Link>
        </p>
      )}
    </section>
  )
}

/* 5. Two doors: the two kinds of people who buy Detent. */
const DOORS = [
  {
    who: 'For founders',
    title: 'Your AI product isn’t live yet. It should still look funded.',
    line: 'Agent chat, voice, evals, onboarding and settings, every state worked out, so the first people who see it trust it.',
    href: '/pro',
    cta: 'Get Pro',
  },
  {
    who: 'For agencies',
    title: 'Deliver AI products your clients think cost $20k.',
    line: 'The template, every screen and every component, restyled to each client’s brand. Use them in unlimited projects.',
    href: '/agencies',
    cta: 'Detent for agencies',
  },
]
export function Doors({ buy = '/pro' }: { buy?: string } = {}) {
  return (
    <section className={SECTION}>
      <h2 className={H2}>
        Built for two kinds of team.
        <span className="block text-quiet">Pick your door.</span>
      </h2>
      <ul className={`${WRAP} !max-w-[1120px] mt-10 grid gap-3.5 md:grid-cols-2`}>
        {DOORS.map((d) => (
          <li key={d.who} className="flex flex-col rounded-[20px] bg-[var(--mount)] p-7 shadow-[0_0_0_1px_var(--line)] sm:p-9">
            <span className="text-[13px] text-ink-3">{d.who}</span>
            <h3 className="mt-3 text-balance text-[24px] font-normal leading-[1.15] tracking-[-0.03em] text-ink sm:text-[28px]">{d.title}</h3>
            <p className="mt-4 max-w-[440px] text-[15px] leading-[1.6] text-ink-3">{d.line}</p>
            <div className="mt-8">
              <Link href={d.href === '/pro' ? buy : d.href} data-cta={`door-${d.href.slice(1)}`} className={PILL_DARK}>
                {d.cta}
                <ArrowRight size={13} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* 10. The close: what one payment buys, and the button. */
function Close() {
  return (
    <section className={`${SECTION} flex flex-col items-center px-5 text-center`}>
      <h2 className={H2}>
        Ship the AI app this week.
        <span className="block text-quiet">Skip the weeks of UI.</span>
      </h2>
      <div className="mt-10 w-full">
        <PricingCards cta="home-cards" />
      </div>
    </section>
  )
}
