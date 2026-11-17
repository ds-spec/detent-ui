import Link from 'next/link'
import type { ReactNode } from 'react'
import { CONTACT } from '@/catalog/trust'
import { ArrowRight } from '@/lab/icons'
import { Footer } from '../Footer'
import { Header } from '../Header'
import { LegalRail } from './LegalRail'

export type Section = { id: string; title: string; body: ReactNode }
export type Short = { title: string; line: ReactNode }

const DOCS = [
  { href: '/licence', name: 'Licence' },
  { href: '/terms', name: 'Terms' },
  { href: '/privacy', name: 'Privacy' },
  { href: '/refunds', name: 'Refunds' },
]

export const P = ({ children }: { children: ReactNode }) => <p className="mt-3 text-[14px] leading-[1.72] text-ink-2 first:mt-0">{children}</p>
export const Strong = ({ children }: { children: ReactNode }) => <strong className="font-medium text-ink">{children}</strong>
export function List({ items, tone = 'plain' }: { items: ReactNode[]; tone?: 'plain' | 'yes' | 'no' }) {
  return (
    <ul className="mt-4 flex flex-col gap-2.5 first:mt-0">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[14px] leading-[1.65] text-ink-2">
          <span aria-hidden className={`mt-[8.5px] size-1.5 shrink-0 rounded-full ${tone === 'yes' ? 'bg-[var(--ok)]' : tone === 'no' ? 'bg-[var(--danger)]' : 'bg-[var(--ink-3)]'}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

export function LegalPage({ label, title, intro, updated, sections, summary }: { label: string; title: string; intro: ReactNode; updated: string; sections: Section[]; summary?: Short[] }) {
  const at = DOCS.findIndex((d) => d.name === label)
  const next = DOCS[(at + 1) % DOCS.length]
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-[1180px] gap-8 px-5 pb-24 pt-20 sm:px-6 sm:pt-24 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <LegalRail docs={DOCS} current={label} sections={sections.map(({ id, title }) => ({ id, title }))} />
        </aside>

        <nav aria-label="Legal" className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden">
          <ul className="flex w-max gap-1 rounded-full bg-surface-2 p-1">
            {DOCS.map((d) => {
              const on = d.name === label
              return (
                <li key={d.href}>
                  <Link href={d.href} aria-current={on ? 'page' : undefined} className={`ring-focus flex h-8 items-center rounded-full px-3.5 text-[13px] transition-colors ${on ? 'bg-surface font-medium text-ink shadow-[var(--card-edge)]' : 'text-ink-3 hover:text-ink'}`}>
                    {d.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0 max-w-[700px]">
          <header className="pb-10 shadow-[inset_0_-1px_0_var(--line)]">
            <p className="text-[12.5px] text-ink-3">Last updated {updated}</p>
            <h1 className="mt-3 text-[clamp(30px,4vw,38px)] font-normal leading-[1.08] tracking-[-0.04em] text-ink">{title}</h1>
            <div className="mt-4 max-w-[600px] text-[14.5px] leading-[1.65] text-ink-2">{intro}</div>
          </header>

          {summary && (
            <section aria-label="The short version" className="mt-10 rounded-[18px] p-5 shadow-[inset_0_0_0_1px_var(--line-strong)] sm:p-6">
              <p className="text-[13px] font-medium text-ink">The short version</p>
              <ol className="mt-4 flex flex-col gap-3">
                {summary.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[22px_minmax(0,1fr)] text-[13.5px] leading-[1.55]">
                    <span className="tnum text-ink-3">{i + 1}.</span>
                    <span className="text-ink-2">
                      <span className="font-medium text-ink">{s.title}.</span> {s.line}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className={summary ? 'mt-4' : 'mt-1'}>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 py-9 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none">
                <h2 className="text-[16px] font-medium tracking-[-0.012em] text-ink">
                  <span className="tnum mr-2 text-ink-3">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="mt-3">{s.body}</div>
              </section>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href={next.href} className="ring-focus group rounded-[16px] p-4 shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:bg-surface-2">
              <p className="text-[12px] text-ink-3">Next</p>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] font-medium text-ink">
                {next.name}
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </p>
            </Link>
            <a href={`mailto:${CONTACT}`} className="ring-focus rounded-[16px] p-4 shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:bg-surface-2">
              <p className="text-[12px] text-ink-3">Questions</p>
              <p className="mt-1 text-[14px] font-medium text-ink">{CONTACT}</p>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
