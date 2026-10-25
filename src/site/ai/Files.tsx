'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from '@/lab/icons'

export type File = { name: string; note: string; code: string; html: string }

/** A few files, highlighted, a tab each, with what each one is for and a copy button. */
export function Files({ files }: { files: File[] }) {
  const [at, setAt] = useState(0)
  const [copied, setCopied] = useState(false)
  const t = useRef(0)
  useEffect(() => () => clearTimeout(t.current), [])
  const file = files[at]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.code)
    } catch {
      /* Clipboard blocked: the code is right there to select. */
    }
    setCopied(true)
    clearTimeout(t.current)
    t.current = window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="overflow-hidden rounded-[24px] bg-surface shadow-border">
      <div className="flex h-12 items-center gap-1 overflow-x-auto px-2.5 shadow-[inset_0_-1px_0_var(--line)] [scrollbar-width:none]" role="tablist" aria-label="Files">
        {files.map((f, i) => (
          <button
            key={f.name}
            type="button"
            role="tab"
            aria-selected={i === at}
            onClick={() => setAt(i)}
            className={`ring-focus h-8 shrink-0 rounded-full px-3 font-mono text-caption transition-colors duration-150 ${i === at ? 'bg-card text-ink' : 'text-ink-3 hover:text-ink-2'}`}
          >
            {f.name}
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" onClick={copy} className="ring-focus flex h-8 w-[84px] shrink-0 items-center justify-center rounded-full text-caption font-medium text-ink-2 transition-colors duration-150 hover:bg-card hover:text-ink">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={copied ? 'y' : 'n'} className={`flex items-center gap-1.5 ${copied ? 'text-ok' : ''}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.16 }}>
              {copied ? <Check size={12} strokeWidth={2.6} /> : <Copy size={12} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
              {copied ? 'Copied' : 'Copy'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <p className="px-5 pt-4 text-footnote text-ink-3">{file.note}</p>
      <div className="code overflow-x-auto px-2 pb-5 pt-3 font-mono text-footnote leading-5" style={{ scrollbarWidth: 'thin' }}>
        <motion.div key={at} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} dangerouslySetInnerHTML={{ __html: file.html }} />
      </div>
    </div>
  )
}
