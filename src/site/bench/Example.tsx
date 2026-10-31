'use client'

import { useState } from 'react'
import { Check, Copy } from '@/lab/icons'

/** A whole page that uses the component, to paste into a project as it is. */
export function Example({ code, html }: { code: string; html: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <section aria-label="Full example" className="mt-6 overflow-hidden rounded-[26px] bg-surface shadow-[var(--card-edge)]">
      <div className="flex h-12 items-center justify-between px-6 shadow-[inset_0_-1px_0_var(--line)]">
        <p className="text-footnote font-medium text-ink">
          Full example <span className="font-normal text-ink-3">· a whole page, ready to paste</span>
        </p>
        <button type="button" onClick={copy} className="ring-focus flex h-8 items-center rounded-full px-3 text-caption font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
          <span className="grid">
            <span className={`col-start-1 row-start-1 flex items-center gap-1.5 transition-opacity ${copied ? 'opacity-0' : ''}`}>
              <Copy size={13} /> Copy
            </span>
            <span className={`col-start-1 row-start-1 flex items-center gap-1.5 text-ok transition-opacity ${copied ? '' : 'opacity-0'}`}>
              <Check size={13} /> Copied
            </span>
          </span>
        </button>
      </div>
      <div className="code max-h-[520px] overflow-auto px-6 py-4 font-mono text-[13px] leading-[22px]" translate="no" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
