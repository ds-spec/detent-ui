import Link from 'next/link'
import { ENTRIES } from '@/catalog/meta'
import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'
import { FIRST_BLOCK, FIRST_COMPONENT } from '@/catalog/site'
import { ArrowUpRight } from '@/lab/icons'
import { ThemeSwitch, Wordmark } from './FooterParts'
import { Mark } from './parts'

type Item = { href: string; label: string; count?: number; out?: boolean }

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: 'Library',
    items: [
      { href: FIRST_COMPONENT, label: 'Components', count: ENTRIES.length },
      { href: FIRST_BLOCK, label: 'Blocks', count: BLOCKS.length },
      { href: '/templates', label: 'Templates', count: TEMPLATES.length },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Pro',
    items: [
      { href: '/pro', label: 'Pricing' },
      { href: '/docs#pro', label: 'Install' },
      { href: '/account', label: 'Account' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { href: '/licence', label: 'Licence' },
      { href: '/refunds', label: 'Refunds' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    title: 'Follow',
    items: [
      { href: 'https://github.com/ds-spec/detent-ui', label: 'GitHub', out: true },
      { href: 'https://x.com/next_gendev', label: 'X', out: true },
    ],
  },
]

const link = 'ring-focus group/f -mx-1 flex h-8 w-fit items-center gap-1.5 rounded-[6px] px-1 text-[14px] text-ink-2 transition-colors duration-150 hover:text-ink'

export function Footer() {
  return (
    <footer className="mt-40 overflow-hidden">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <div className="grid gap-x-10 gap-y-12 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Link href="/" aria-label="Detent, home" className="ring-focus -ml-1 inline-flex rounded-[8px] p-1">
              <Mark />
            </Link>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="pb-2 text-[12.5px] text-ink-3">{c.title}</p>
                <ul>
                  {c.items.map((l) => (
                    <li key={l.href}>
                      {l.out ? (
                        <a href={l.href} target="_blank" rel="noreferrer" className={link}>
                          {l.label}
                          <ArrowUpRight size={11} className="text-ink-3 transition-transform duration-150 group-hover/f:-translate-y-px group-hover/f:translate-x-px" />
                        </a>
                      ) : (
                        <Link href={l.href} prefetch={false} className={link}>
                          {l.label}
                          {l.count !== undefined && <span className="tnum text-[12px] text-ink-3">{l.count}</span>}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5 text-[12.5px] text-ink-3 shadow-[inset_0_1px_0_var(--line)]">
          <span>© 2026 Detent</span>
          <ThemeSwitch />
        </div>
        <div className="mt-6 sm:mt-10">
          <Wordmark />
        </div>
      </div>
    </footer>
  )
}
