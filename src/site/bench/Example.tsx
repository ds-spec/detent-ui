'use client'

import { useState } from 'react'
import { Check, Copy } from '@/lab/icons'
import { useSideNew } from '../shell/side'

/** A whole page that uses the component, to paste into a project as it is. */
export function Example({ code, html }: { code: string; html: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  const side = useSideNew()
  return (
    <>
    {side && (
      <div className="mt-12 mb-4">
        <h2 className="text-[18px] font-medium tracking-[-0.015em] text-ink">Full example</h2>
        <p className="mt-1 text-[14px] text-ink-3">A whole page, ready to paste.</p>
      </div>
    )}
    <section aria-label="Full example" className={side ? 'overflow-hidden rounded-[14px] shadow-[0_0_0_1px_var(--line)]' : 'mt-6 overflow-hidden rounded-[26px] bg-surface shadow-[var(--card-edge)]'}>
      <div className={`flex items-center justify-between shadow-[inset_0_-1px_0_var(--line)] ${side ? 'h-11 pl-4 pr-1.5' : 'h-12 px-6'}`}>
        {side ? (
          <p className="font-mono text-[12.5px] text-ink-3">page.tsx</p>
        ) : (
          <p className="text-footnote font-medium text-ink">
            Full example <span className="font-normal text-ink-3">· a whole page, ready to paste</span>
          </p>
        )}
        <button type="button" onClick={copy} className={`ring-focus flex h-8 items-center px-3 text-caption font-medium text-ink-2 hover:text-ink ${side ? 'rounded-[8px] hover:bg-[var(--shell-hover)]' : 'rounded-full hover:bg-surface-2'}`}>
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
      <div className={`code max-h-[520px] overflow-auto py-4 ${side ? 'px-4' : 'px-6'} font-mono text-[13px] leading-[22px]`} translate="no" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
    </>
  )
}
