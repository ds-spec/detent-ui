import Link from 'next/link'
import { ShiftReadout, ThemeSwitch, Wordmark } from './FooterParts'

const LINKS = [
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/templates', label: 'Templates' },
  { href: '/system', label: 'System' },
  { href: '/#install', label: 'Install' },
  { href: '/account', label: 'Account' },
]

/** The pages that say what you're agreeing to, and what's changed. */
const TRUST = [
  { href: '/changelog', label: 'Changelog' },
  { href: '/licence', label: 'Licence' },
  { href: '/refunds', label: 'Refunds' },
  { href: '/terms', label: 'Terms' },
]

/**
 * The page ends on one quiet row of small type, then the name, monumental, sinking off the
 * bottom of the page. Its D is the mark; its letters rise into place and click the first time
 * they're seen.
 */
export function Footer() {
  return (
    <footer className="mt-40 overflow-hidden">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-footnote">
          <span className="text-ink-3">
            © 2026 <span className="font-medium text-ink">Detent</span>
          </span>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="ring-focus rounded-[4px] text-ink-3 transition-colors duration-150 hover:text-[var(--accent-ink)]">
                {l.label}
              </Link>
            ))}
          </nav>
          <span className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ShiftReadout />
            <ThemeSwitch />
          </span>
        </div>
        <nav aria-label="Licence and policies" className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption">
          {TRUST.map((l) => (
            <Link key={l.href} href={l.href} className="ring-focus rounded-[4px] text-ink-3 transition-colors duration-150 hover:text-[var(--accent-ink)]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-12 sm:mt-16">
          <Wordmark />
        </div>
      </div>
    </footer>
  )
}
