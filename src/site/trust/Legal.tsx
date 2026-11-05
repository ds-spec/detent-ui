import type { ReactNode } from 'react'
import { Footer } from '../Footer'
import { Header } from '../Header'

export type Section = { id: string; title: string; body: ReactNode }

export const P = ({ children }: { children: ReactNode }) => <p className="mt-3 text-body leading-[1.65] text-ink-2 first:mt-0">{children}</p>
export const Strong = ({ children }: { children: ReactNode }) => <strong className="font-medium text-ink">{children}</strong>
export function List({ items, tone = 'plain' }: { items: ReactNode[]; tone?: 'plain' | 'yes' | 'no' }) {
  return (
    <ul className="mt-4 flex flex-col gap-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-body leading-[1.6] text-ink-2">
          <span aria-hidden className={`mt-[9px] size-1.5 shrink-0 rounded-full ${tone === 'yes' ? 'bg-[var(--ok)]' : tone === 'no' ? 'bg-[var(--danger)]' : 'bg-[var(--ink-3)]'}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

export function LegalPage({ label, title, intro, updated, sections }: { label: string; title: string; intro: ReactNode; updated: string; sections: Section[] }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <section className="pt-20 sm:pt-28">
          <p className="text-footnote text-ink-3">{label}</p>
          <h1 className="mt-3 max-w-[820px] text-[clamp(36px,4.6vw,52px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">{title}</h1>
          <div className="mt-5 max-w-[600px] text-body text-ink-3">{intro}</div>
          <p className="mt-6 text-footnote text-ink-3">Last updated {updated}</p>
        </section>
        <div className="mt-16 grid gap-12 lg:grid-cols-[220px_minmax(0,680px)] lg:gap-20">
          <nav aria-label="On this page" className="hidden lg:block">
            <ol className="sticky top-24 flex flex-col gap-0.5 text-footnote">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="ring-focus block rounded-[8px] px-2.5 py-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div>
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 pb-12 shadow-[inset_0_-1px_0_var(--line)] [&+section]:pt-12 last:shadow-none">
                <h2 className="text-title text-ink">{s.title}</h2>
                <div className="mt-4">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
