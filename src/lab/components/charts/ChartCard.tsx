'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { spring, ease } from '@/lab/lib/motion'

export type Table = { head: string[]; rows: (string | number)[][] }

/** A chart's frame: what it is, its headline, and a switch to read it as a table at the chart's own height. */
export function ChartCard({ title, headline, actions, table, className = '', children }: { title: string; headline?: ReactNode; actions?: ReactNode; table?: Table; className?: string; children: ReactNode }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const body = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(0)
  const plate = useId()
  useEffect(() => {
    const el = body.current
    if (!el) return
    const ro = new ResizeObserver(() => view === 'chart' && setH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [view])
  return (
    <section className={`lit @container flex min-w-0 flex-col rounded-[20px] bg-surface p-5 ring-1 ring-[color-mix(in_oklch,var(--ink)_7%,transparent)] ${className}`}>
      {/* Narrow, the switches drop under the title instead of squeezing it onto three lines. */}
      <header className="flex flex-col gap-3 @min-[440px]:flex-row @min-[440px]:items-start @min-[440px]:justify-between @min-[440px]:gap-4">
        <div className="min-w-0">
          <h3 className="text-footnote font-medium text-ink-2">{title}</h3>
          {headline && <div className="mt-1.5">{headline}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {table && (
            <div role="radiogroup" aria-label="Show as" className="flex rounded-full bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] p-0.5">
              {(['chart', 'table'] as const).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className="ring-focus relative h-6 rounded-full px-2.5 text-[11px] font-medium capitalize">
                  {view === v && <motion.span layoutId={plate} transition={spring.move} className="absolute inset-0 rounded-full bg-surface shadow-raised" />}
                  <span className={`relative z-[1] ${view === v ? 'text-ink' : 'text-ink-3'}`}>{v}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="relative mt-4 flex flex-1 flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {view === 'chart' ? (
            <motion.div key="chart" ref={body} className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: ease.out }}>
              {children}
            </motion.div>
          ) : (
            <motion.div key="table" className="overflow-auto overscroll-contain" style={{ height: h || undefined }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: ease.out }}>
              {table && (
                <table className="w-full border-collapse text-left text-footnote">
                  <thead className="sticky top-0 bg-surface">
                    <tr>
                      {table.head.map((c, i) => (
                        <th key={c} className={`pb-2 font-medium text-ink-3 ${i ? 'text-right' : ''}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((r, i) => (
                      <tr key={i} className="shadow-[inset_0_1px_0_var(--line)]">
                        {r.map((c, k) => (
                          <td key={k} className={`py-1.5 ${k ? 'text-right font-mono text-[12px] tabular-nums text-ink' : 'text-ink-2'}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
