import type { ReactNode } from 'react'

export type Row = { name: string; type: string; default?: string; note?: string; required?: boolean }

/**
 * A component's props as a quiet list: the name and its type on the left, what it does on the
 * right, with the default under it. Hairlines between, nothing boxed. Long types wrap in place.
 */
export function PropRows({ list }: { list: Row[] }) {
  return (
    <dl className="mt-2">
      {list.map((p) => (
        <div key={p.name} className="grid gap-x-8 gap-y-1.5 py-4 shadow-[inset_0_-1px_0_var(--line)] sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <dt className="min-w-0">
            <span className="flex items-center gap-2">
              <code className="font-mono text-callout text-ink">{p.name}</code>
              {p.required && <span className="text-caption text-ink-3">Required</span>}
            </span>
            <code className="mt-0.5 block break-words font-mono text-caption text-ink-3">{p.type}</code>
          </dt>
          <dd className="text-callout text-ink-2">
            {p.note}
            {p.default && (
              <span className="mt-1 block text-caption text-ink-3">
                Default <code className="break-words font-mono text-ink-2">{p.default}</code>
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** The section around the list: a title and a line on the left, the list on the right. */
export function PropsSection({ blurb, children, className = '' }: { blurb: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby="props" className={`grid gap-x-16 gap-y-8 lg:grid-cols-[320px_minmax(0,1fr)] ${className}`}>
      <div>
        <h2 id="props" className="text-title text-ink">
          Props
        </h2>
        <p className="mt-1.5 max-w-[300px] text-callout text-ink-3">{blurb}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
