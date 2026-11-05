import type { ReactNode } from 'react'

export type Row = { name: string; type: string; default?: string; note?: string; required?: boolean }

const COLS = 'md:grid-cols-[minmax(150px,220px)_minmax(0,1fr)_minmax(110px,180px)]'

export function PropRows({ list, title }: { list: Row[]; title?: string }) {
  return (
    <div role="table" aria-label={title ?? 'Props'}>
      {title && <p className="px-6 pb-1 pt-6 text-footnote font-medium text-ink">{title}</p>}
      <div role="row" className={`hidden gap-6 px-6 pb-2 pt-2 text-caption text-ink-3 shadow-[inset_0_-1px_0_var(--line)] md:grid ${COLS}`}>
        <span role="columnheader">Prop</span>
        <span role="columnheader">Description</span>
        <span role="columnheader">Default</span>
      </div>
      {list.map((p) => (
        <div key={p.name} role="row" className={`grid grid-cols-1 gap-x-6 gap-y-2 px-6 py-4 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none md:items-start ${COLS}`}>
          <div role="cell" className="flex flex-wrap items-center gap-2 md:pt-px">
            <code className="font-mono text-[13.5px] text-ink">{p.name}</code>
            {p.required && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">Required</span>}
          </div>
          <div role="cell" className="min-w-0">
            {p.note && <p className="text-callout leading-[1.55] text-ink-2">{p.note}</p>}
            <code className={`inline-block max-w-full break-words rounded-[6px] bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] leading-[1.5] text-ink-3 ${p.note ? 'mt-1.5' : ''}`}>{p.type}</code>
          </div>
          <div role="cell" className="flex items-center gap-2 md:block md:pt-0.5">
            <span className="text-caption text-ink-3 md:hidden">Default</span>
            {p.default ? <code className="break-words font-mono text-[12.5px] text-ink-2">{p.default}</code> : <span className="text-callout text-ink-3">—</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PropsSection({ blurb, count, title = 'Props', children, className = '' }: { blurb: string; count?: number; title?: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby="props" className={`overflow-hidden rounded-[26px] bg-surface shadow-[var(--card-edge)] ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 pb-4 pt-5">
        <h2 id="props" className="text-headline text-ink">
          {title} {count !== undefined && <span className="tnum font-normal text-ink-3">{count}</span>}
        </h2>
        <p className="text-footnote text-ink-3">{blurb}</p>
      </div>
      {children}
    </section>
  )
}
