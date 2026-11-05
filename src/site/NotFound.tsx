import Link from 'next/link'
import { ENTRIES } from '@/catalog/meta'
import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'
import { Missing, Nearest, SearchPill } from './NotFoundParts'
import type { Page } from './NotFoundParts'

const plain = (p: string): Page => ({ path: p, href: p })

const PAGES: Page[] = [
  ...['/components', '/blocks', '/templates', '/pro', '/system', '/changelog', '/licence', '/refunds', '/terms', '/privacy'].map(plain),
  { path: '/pricing', href: '/pro' },
  { path: '/docs', href: '/components' },
  ...ENTRIES.map((e) => plain(`/components/${e.id}`)),
  ...BLOCKS.map((b) => plain(`/blocks/${b.id}`)),
  ...TEMPLATES.map((t) => plain(`/templates/${t.id}`)),
]

export function NotFound() {
  return (
    <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
      <section className="flex flex-col items-center pt-20 text-center sm:pt-32">
        <div className="max-[400px]:[zoom:0.8]">
          <Missing />
        </div>
        <div className="mt-6 flex max-w-full justify-center">
          <Nearest pages={PAGES} />
        </div>
        <div className="mt-9 flex max-w-full flex-wrap items-center justify-center gap-3">
          <Link href="/" className="ring-focus flex h-11 items-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-opacity duration-150 hover:opacity-90">
            Back to home
          </Link>
          <SearchPill />
        </div>
      </section>
    </main>
  )
}
