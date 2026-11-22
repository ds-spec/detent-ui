import type { ReactNode } from 'react'
import { Check, Close } from '@/lab/icons'
import { FIT, FIT_ROWS } from './libraries'
import type { Library, Mark } from './libraries'

const OURS = 'bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))]'
const STICKY = 'sticky left-0 z-10 bg-surface'

const dash = (v: string) => (v === 'Not stated' ? <span className="text-ink-3/70" title="Not stated on the library’s own pages">—</span> : v)

function Head({ rows }: { rows: Library[] }) {
  return (
    <thead>
      <tr>
        <th scope="col" className={`${STICKY} w-[118px] px-4 pb-4 pt-5 sm:w-[150px] text-left align-bottom text-[12px] font-normal text-ink-3`}>
          <span className="sr-only">Criteria</span>
        </th>
        {rows.map((l) => (
          <th key={l.id} scope="col" className={`min-w-[108px] px-3 pb-4 pt-5 text-left align-bottom font-normal ${l.ours ? `${OURS} rounded-t-[14px]` : ''}`}>
            <a href={`#${l.id}`} className="ring-focus block rounded-[4px] text-[13px] leading-[1.3] tracking-[-0.01em] text-ink hover:underline">
              {l.name}
            </a>
            <span className="tnum mt-1 block text-[12px] text-ink-3">{l.price}</span>
            {l.ours ? <span className="mt-1.5 inline-flex h-5 items-center rounded-full bg-surface px-2 text-[11px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">Ours</span> : null}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function Group({ name, rows }: { name: string; rows: Library[] }) {
  return (
    <tr>
      <th scope="colgroup" className={`${STICKY} px-4 pb-2 pt-7 text-left text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-3`}>
        {name}
      </th>
      {rows.map((l) => (
        <td key={l.id} className={l.ours ? OURS : ''} />
      ))}
    </tr>
  )
}

function Row({ name, line, rows, cell }: { name: string; line?: string; rows: Library[]; cell: (l: Library) => ReactNode }) {
  return (
    <tr className="align-top [&>*]:shadow-[inset_0_1px_0_var(--line)]">
      <th scope="row" className={`${STICKY} px-4 py-3.5 text-left font-normal`}>
        <span className="block text-[13px] text-ink">{name}</span>
        {line ? <span className="mt-0.5 block text-[12px] leading-[1.45] text-ink-3">{line}</span> : null}
      </th>
      {rows.map((l) => (
        <td key={l.id} className={`px-3 py-3.5 text-[12.5px] leading-[1.45] text-ink-2 ${l.ours ? OURS : ''}`}>
          {cell(l)}
        </td>
      ))}
    </tr>
  )
}

function Frame({ children, width }: { children: ReactNode; width: string }) {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-surface shadow-[var(--card-edge)] [scrollbar-width:thin]">
      <table className={`w-full ${width} border-separate border-spacing-0`}>{children}</table>
    </div>
  )
}

export function PriceTable({ rows }: { rows: Library[] }) {
  return (
    <Frame width="min-w-[940px]">
      <Head rows={rows} />
      <tbody>
        <Group name="Price" rows={rows} />
        <Row
          name="Price for one"
          rows={rows}
          cell={(l) => (
            <>
              <span className="tnum text-ink">{l.price}</span>
              {l.sale ? <span className="mt-1 block text-[12px] text-ink-3">On sale: {l.sale}</span> : null}
            </>
          )}
        />
        <Row name="You pay" rows={rows} cell={(l) => (l.model === 'Subscription' ? <span className="inline-flex h-5 items-center whitespace-nowrap rounded-full bg-surface-2 px-2 text-[11.5px]">Subscription</span> : <span className="inline-flex h-5 items-center whitespace-nowrap rounded-full bg-surface-2 px-2 text-[11.5px]">Once</span>)} />
        <Row name="Free tier" rows={rows} cell={(l) => <span className="text-ink-3">{l.free}</span>} />
        <Group name="What you get" rows={rows} />
        <Row name="Components" rows={rows} cell={(l) => <span className="tnum">{dash(l.components)}</span>} />
        <Row name="Blocks" rows={rows} cell={(l) => <span className="tnum">{dash(l.blocks)}</span>} />
        <Row name="Templates" rows={rows} cell={(l) => <span className="tnum">{dash(l.templates)}</span>} />
        <Group name="Rights" rows={rows} />
        <Row name="Licence" rows={rows} cell={(l) => <span className="text-ink-3">{l.licence}</span>} />
        <Row name="Updates" rows={rows} cell={(l) => dash(l.updates)} />
      </tbody>
    </Frame>
  )
}

function MarkIcon({ mark }: { mark: Mark }) {
  if (mark === 'yes')
    return (
      <span className="grid size-[18px] place-items-center rounded-full bg-[color-mix(in_oklab,var(--ok)_14%,transparent)] text-ok">
        <Check size={11} strokeWidth={2.6} />
      </span>
    )
  if (mark === 'some')
    return (
      <span className="grid size-[18px] place-items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--line-strong)] text-ink-3">
        <Check size={10} strokeWidth={2.4} />
      </span>
    )
  if (mark === 'no')
    return (
      <span className="grid size-[18px] place-items-center rounded-full bg-surface-2 text-ink-3">
        <Close size={10} strokeWidth={2.4} />
      </span>
    )
  return <span className="grid size-[18px] place-items-center text-ink-3/70">—</span>
}

export function FitTable({ rows }: { rows: Library[] }) {
  return (
    <>
      <Frame width="min-w-[940px]">
        <Head rows={rows} />
        <tbody>
          <Group name="What it’s built for" rows={rows} />
          {FIT_ROWS.map((r) => (
            <Row
              key={r.key}
              name={r.name}
              line={r.line}
              rows={rows}
              cell={(l) => {
                const [mark, label] = FIT[l.id][r.key]
                return (
                  <span className="flex flex-col items-start gap-1.5">
                    <MarkIcon mark={mark} />
                    <span className={mark === 'yes' ? 'text-ink-2' : 'text-ink-3'}>{label}</span>
                  </span>
                )
              }}
            />
          ))}
          <Row name="Stack" line="Frameworks each one names" rows={rows} cell={(l) => <span className="text-ink-3">{l.stack}</span>} />
        </tbody>
      </Frame>
      <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-3">
        {(
          [
            ['yes', 'Yes, stated on their pages'],
            ['some', 'Partly'],
            ['no', 'No'],
            ['unknown', 'Not stated'],
          ] as [Mark, string][]
        ).map(([m, t]) => (
          <li key={m} className="flex items-center gap-2">
            <MarkIcon mark={m} />
            {t}
          </li>
        ))}
      </ul>
    </>
  )
}
