import type { CSSProperties, ReactNode } from 'react'

/*
 * Apple's grouped lists, in the site's materials: a quiet heading, rows on one soft plate with a rule
 * between each that starts where the words do, and a footnote under the plate.
 */

export function Section({ id, title, aside, footer, inset = 60, children }: { id?: string; title?: string; aside?: ReactNode; footer?: ReactNode; inset?: number; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id && title ? `${id}-title` : undefined} className="mt-10 scroll-mt-24">
      {title && (
        <div className="mb-2 flex items-baseline justify-between gap-4 px-4">
          <h2 id={id ? `${id}-title` : undefined} className="text-footnote font-medium text-ink-3">
            {title}
          </h2>
          {aside && <span className="tnum text-footnote text-ink-3">{aside}</span>}
        </div>
      )}
      <div className="rows overflow-hidden rounded-[14px] bg-[color-mix(in_oklch,var(--ink)_3.5%,transparent)]" style={{ '--rule-inset': `${inset}px` } as CSSProperties}>
        {children}
      </div>
      {footer && <p className="mt-2 px-4 text-caption leading-[1.5] text-ink-3">{footer}</p>}
    </section>
  )
}

/** A row: its tile, a title with a line under it, and whatever sits at its end. */
export function Row({ tile, title, detail, end }: { tile?: ReactNode; title: ReactNode; detail?: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex min-h-[60px] items-center gap-3.5 px-4 py-2.5">
      {tile}
      <div className="min-w-0 flex-1">
        <p className="truncate text-callout text-ink">{title}</p>
        {detail && <p className="mt-0.5 truncate text-caption text-ink-3">{detail}</p>}
      </div>
      {end}
    </div>
  )
}

const TONES = {
  accent: 'bg-[linear-gradient(180deg,color-mix(in_oklch,var(--accent),white_14%),var(--accent))]',
  graphite: 'bg-[linear-gradient(180deg,#9a9aa0,#6e6e75)]',
  ink: 'bg-[linear-gradient(180deg,#3a3a3e,#1c1c1f)]',
}

/** A settings tile: one white glyph on a colour lit from above, like the icons down the side of Settings. */
export function Tile({ tone = 'accent', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`grid size-[30px] shrink-0 place-items-center rounded-[8px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] ${TONES[tone]}`}>{children}</span>
}
