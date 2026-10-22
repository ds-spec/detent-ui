import type { Metadata } from 'next'
import { SOON, TEMPLATES } from '@/templates/meta'
import { ProTag } from '@/site/blocks/ProTag'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { TemplateCard } from '@/site/templates/TemplateCard'
import { JsonLd, list, page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Templates — landing pages and apps for AI products',
  description: `${TEMPLATES.length} templates for AI products, from landing pages to an agent workspace app, built in React from Detent blocks: light and dark, any width, no layout shift.`,
  path: '/templates',
})

export default function TemplatesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <section className="flex flex-col items-center pt-20 text-center sm:pt-32">
          <ProTag className="rise" />
          <h1 className="mt-7 text-[clamp(40px,5.2vw,60px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
            <span className="focus-in inline-block">Whole sites and apps,</span>{' '}
            <span className="focus-in inline-block" style={{ animationDelay: '80ms' }}>
              ready to ship.
            </span>
            <span className="focus-in block text-quiet" style={{ animationDelay: '160ms' }}>
              Start from one that already works.
            </span>
          </h1>
          <p className="rise mt-7 max-w-[620px] text-lead text-ink-3" style={{ animationDelay: '260ms' }}>
            Each template is a complete landing page or app for a kind of AI product: the product working the moment it loads, every claim shown live, light and dark, and not one layout shift. Change the words and ship it.
          </p>
        </section>

        <JsonLd
          data={list(
            'Detent templates',
            TEMPLATES.map((t) => ({ name: t.name, path: `/templates/${t.id}` })),
          )}
        />
        <section aria-label="Templates" className="mt-16 flex flex-col gap-10 sm:mt-24">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </section>

        {SOON.length > 0 && (
          <section aria-label="In the works" className="mt-32 sm:mt-40">
            <h2 className="text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink">
              In the works.
              <span className="block text-quiet">One for every kind of AI product.</span>
            </h2>
            <ul className="mt-12 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
              {SOON.map((s) => (
                <li key={s.name} className="flex flex-col gap-1 py-6 shadow-[inset_0_1px_0_var(--line)]">
                  <span className="flex items-center justify-between gap-4">
                    <span className="text-headline text-ink">{s.name}</span>
                    <span className="text-footnote text-ink-3">{s.kind}</span>
                  </span>
                  <span className="text-callout text-ink-3">{s.line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
