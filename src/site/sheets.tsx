import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

/*
 * The site's inner pages: plain pages, the header, sections one after another, and the footer.
 * (Sheets on a ground are the home page's alone.) A section is a band of the page with room above
 * it; a quieter one starts on a hairline.
 */

/** A page: the header, the sections, the footer. */
export function SitePage({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}

/** One band of a page. `tone="quiet"` starts it on a hairline; `inner` adds to its padding. */
export function Band({ children, tone = 'plain', id, label, inner = '' }: { children: ReactNode; tone?: 'plain' | 'quiet'; id?: string; label?: string; inner?: string }) {
  return (
    <section id={id} aria-label={label} className="scroll-mt-20">
      <div className={`mx-auto max-w-[1360px] px-5 sm:px-6 ${inner}`}>
        <div className={`pb-8 pt-20 sm:pt-28 ${tone === 'quiet' ? 'shadow-[inset_0_1px_0_var(--line)]' : ''}`}>{children}</div>
      </div>
    </section>
  )
}

/**
 * A band's heading: centred, in two tones, the first line in ink and the second quieter, with an
 * optional tag above it and a line of copy under it. A page's own heading is set larger.
 */
export function BandHead({ as = 'h2', title, quiet, line, tag, children }: { as?: 'h1' | 'h2'; title: ReactNode; quiet: ReactNode; line?: ReactNode; tag?: ReactNode; children?: ReactNode }) {
  const H = as
  const size = as === 'h1' ? 'text-[clamp(42px,5vw,72px)] leading-[1.01]' : 'text-[clamp(38px,4.2vw,62px)] leading-[1.02]'
  return (
    <div className="flex flex-col items-center px-2 text-center">
      {tag && <div className="rise mb-6">{tag}</div>}
      <H className={`focus-in font-normal tracking-[-0.055em] text-ink ${size}`}>
        {title}
        <br />
        <span className="text-quiet">{quiet}</span>
      </H>
      {line && (
        <p className="rise mt-6 max-w-[540px] text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
          {line}
        </p>
      )}
      {children}
    </div>
  )
}

/** A small card on a page: a raised surface with soft corners, for a fact, a question or what's coming. */
export const card = 'rounded-[22px] bg-surface p-6 shadow-[var(--card-edge)]'
