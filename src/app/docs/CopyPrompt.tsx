'use client'

import { useRef, useState } from 'react'
import { Check, Copy } from '@/lab/icons'
import { track } from '@/site/track'

/** The prompt for a coding agent, with one button that copies it and says so. */
export function CopyPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const copy = () =>
    navigator.clipboard.writeText(prompt).then(() => {
      track('copy_prompt')
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    })
  return (
    <button type="button" onClick={copy} className="ring-focus flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-ink px-3.5 text-[13.5px] font-medium text-surface transition-transform duration-150 active:scale-[0.97]">
      <span className="grid">
        <span className="col-start-1 row-start-1 flex items-center gap-2 transition-opacity duration-150" style={{ opacity: copied ? 0 : 1 }}>
          <Copy size={14} style={{ ['--icon-cutout' as string]: 'var(--ink)' }} />
          Copy prompt
        </span>
        <span className="col-start-1 row-start-1 flex items-center gap-2 transition-opacity duration-150" style={{ opacity: copied ? 1 : 0 }}>
          <Check size={14} />
          Copied
        </span>
      </span>
    </button>
  )
}
