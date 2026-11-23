'use client'

import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { PLANS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { Charts, Own, Tile } from '@/site/home/long/Home'
import { H2, Leaf, PILL_DARK, PILL_SOFT, SECTION, WRAP } from '@/site/home/long/parts'
import { TemplatePiece } from '@/site/library/Library'
import { PriceNow } from '@/site/Promo'
import { PricingCards } from '@/site/pro/Cards'

const PRICE = PLANS[0].price

const QA: [string, string][] = [
  ['Can I use Detent in every client project?', 'Yes. One licence covers unlimited projects, commercial and client work included. What you can’t do is resell or redistribute the components themselves.'],
  ['Will it match each client’s brand?', 'Yes. Detent reads the shadcn theme in each project: the client’s primary colour becomes its accent, it uses their background, borders and muted text, and .dark turns it dark. Their fonts stay theirs.'],
  ['Who owns the code?', 'The code lands in the client’s project as source files, the same way shadcn components do. Change it, cut it down, rename it.'],
  ['Can my coding agent set it up?', 'Yes. Paste one setup prompt into Claude Code, Cursor or Codex and it connects Pro. Then ask for what the client needs and it installs the pieces and puts them in place.'],
  ['Does each person on my team need a licence?', 'A licence is for one person, so each person building with it needs their own. Keys work in CI and shared repos.'],
]

export function Agencies() {
  const app = TEMPLATES.find((t) => t.form === 'app')
  return (
    <div className="pb-3" style={{ background: 'var(--ground)' }}>
      <Leaf>
        <section className="flex flex-col items-center px-5 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <span className="rise text-[13px] text-ink-3">Detent for agencies</span>
          <h1 className="focus-in mt-5 max-w-[900px] text-balance text-[clamp(36px,5vw,70px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
            Deliver AI products your clients think cost $20k.
          </h1>
          <p className="rise mt-6 max-w-[560px] text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
            The Detent template, {BLOCKS.length} screens and {ENTRIES.length} components. Use them in unlimited projects. <PriceNow value={PRICE} />{' '}once.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: '180ms' }}>
            <Link href="/pro" data-cta="agencies-hero" className={PILL_DARK}>
              Get Pro · <PriceNow value={PRICE} /> once
            </Link>
            <a href="#rebrand" className={PILL_SOFT}>
              See it re-brand
            </a>
          </div>
          <p className="rise mt-3 text-[13px] text-ink-3" style={{ animationDelay: '220ms' }}>
            <PriceNow value={PRICE} /> + local tax · lifetime updates · all sales final. Try every Pro screen live first.
          </p>
        </section>
      </Leaf>

      {app && (
        <div className="mt-3">
          <Leaf>
            <section className={SECTION}>
              <h2 className={H2}>
                Start every client build
                <span className="block text-quiet">from a finished AI app.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[540px] px-5 text-center text-[16px] leading-[1.6] text-ink-3">{app.pitch} Swap in the client’s name, data and colours.</p>
              <div className={`${WRAP} !max-w-[1120px] mt-10`}>
                <Tile wide it={{ id: app.id, name: `${app.name} · AI workspace template`, line: app.line, pro: true, href: `/templates/${app.id}`, tone: 'violet', piece: (r) => <TemplatePiece id={app.id} onReady={r} /> }} />
              </div>
            </section>
          </Leaf>
        </div>
      )}

      <div id="rebrand" className="mt-3 scroll-mt-16">
        <Leaf>
          <Own />
        </Leaf>
      </div>

      <div className="mt-3">
        <Leaf>
          <Charts />
        </Leaf>
      </div>

      <div className="mt-3">
        <Leaf>
          <section className={`${SECTION} mx-auto grid max-w-[1240px] gap-x-16 gap-y-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]`}>
            <h2 className={`${H2} lg:!text-left`}>
              Questions.
              <span className="block text-quiet">From agencies.</span>
            </h2>
            <div>
              {QA.map(([q, a]) => (
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
        </Leaf>
      </div>

      <div className="mt-3">
        <Leaf>
          <section className={`${SECTION} flex flex-col items-center px-5 text-center`}>
            <h2 className={H2}>
              One licence.
              <span className="block text-quiet">Every client project.</span>
            </h2>
            <div className="mt-10 w-full">
              <PricingCards cta="agencies-cards" />
            </div>
            <Link href="/templates" className="ring-focus mt-5 rounded-[4px] text-[13px] text-ink-2 underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors hover:text-ink">
              Try every Pro screen live first
            </Link>
          </section>
        </Leaf>
      </div>
    </div>
  )
}
