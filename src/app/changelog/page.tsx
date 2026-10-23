import type { Metadata } from 'next'
import Link from 'next/link'
import { RELEASES } from '@/catalog/trust'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Changelog',
  description: 'Everything that’s shipped in Detent, newest first: new React components, blocks and templates for AI products.',
  path: '/changelog',
  image: '/opengraph-image',
})

const long = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** What shipped, by day: each day's date stays beside its releases while you read them. */
export default function Changelog() {
  const days = [...new Set(RELEASES.map((r) => r.date))]
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <section className="pt-20 sm:pt-28">
          <p className="text-footnote text-ink-3">Changelog</p>
          <h1 className="mt-3 max-w-[760px] text-[clamp(36px,4.6vw,52px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
            What’s new.
            <span className="block text-quiet">Every update reaches every licence.</span>
          </h1>
        </section>
        <div className="mt-16">
          {days.map((d) => (
            <section key={d} aria-label={long(d)} className="grid gap-4 py-12 shadow-[inset_0_1px_0_var(--line)] lg:grid-cols-[220px_minmax(0,760px)] lg:gap-20">
              <div>
                <time dateTime={d} className="sticky top-24 block text-footnote font-medium text-ink-3">
                  {long(d)}
                </time>
              </div>
              <div className="flex flex-col gap-12">
                {RELEASES.filter((r) => r.date === d).map((r) => (
                  <article key={r.title}>
                    <h2 className="text-title text-ink">{r.title}</h2>
                    <p className="mt-2 max-w-[620px] text-body text-ink-3">{r.line}</p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {r.items.map((it) => (
                        <li key={it.label}>
                          {it.href ? (
                            <Link href={it.href} className="ring-focus flex h-8 items-center gap-2 rounded-full bg-surface-2 px-3 text-footnote text-ink transition-colors hover:bg-[color-mix(in_oklch,var(--ink)_8%,var(--surface-2))]">
                              {it.label}
                              {it.pro && <span className="rounded-full bg-ink px-1.5 text-[10.5px] font-semibold leading-[17px] text-surface">Pro</span>}
                            </Link>
                          ) : (
                            <span className="flex h-8 items-center rounded-full bg-surface-2 px-3 text-footnote text-ink">{it.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
