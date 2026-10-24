import type { Metadata } from 'next'
import { BLOCKS, KINDS, SOON } from '@/catalog/blocks'
import { BlockIndex } from '@/site/blocks/BlockIndex'
import { ProTag } from '@/site/blocks/ProTag'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { JsonLd, list, page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Blocks — whole screens for AI products in React',
  description: `${BLOCKS.length} complete screens for AI products: agent runs, prompt playgrounds, inboxes, evals, billing and settings, built from Detent components and installed as source.`,
  path: '/blocks',
})

export default function BlocksPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <section className="flex flex-col items-center pt-20 text-center sm:pt-32">
          <ProTag className="rise" />
          <h1 className="mt-7 text-[clamp(40px,5.2vw,60px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
            <span className="focus-in inline-block">Whole screens,</span>{' '}
            <span className="focus-in inline-block" style={{ animationDelay: '80ms' }}>
              already working.
            </span>
            <span className="focus-in block text-quiet" style={{ animationDelay: '160ms' }}>
              Drop in a product, not a part.
            </span>
          </h1>
          <p className="rise mt-7 max-w-[600px] text-lead text-ink-3" style={{ animationDelay: '260ms' }}>
            {BLOCKS.length} complete screens built from Detent components, each playing live with real states and real keys. Scroll the names and each one opens beside them. Every one comes with Pro.
          </p>
        </section>

        {/* Every block by name; the one on the reading line runs beside the list. */}
        <JsonLd
          data={list(
            'Detent blocks',
            BLOCKS.map((b) => ({ name: b.name, path: `/blocks/${b.id}` })),
          )}
        />
        <section aria-label="Blocks" className="mt-20 sm:mt-28">
          <BlockIndex />
        </section>

        {SOON.length > 0 && (
          <section aria-label="In the works" className="mt-32 sm:mt-40">
            <h2 className="text-[clamp(32px,4.2vw,52px)] font-normal leading-[1.06] tracking-[-0.045em] text-ink">
              In the works.
              <span className="block text-quiet">A new screen every few days until launch.</span>
            </h2>
            <ul className="mt-12 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
              {SOON.map((s) => (
                <li key={s.name} className="flex flex-col gap-1 py-6 shadow-[inset_0_1px_0_var(--line)]">
                  <span className="flex items-center justify-between gap-4">
                    <span className="text-headline text-ink">{s.name}</span>
                    <span className="text-footnote text-ink-3">{KINDS[s.kind]}</span>
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
