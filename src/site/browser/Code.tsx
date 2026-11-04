'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from '@/lab/icons'
import { PLANS } from '@/catalog/pro'
import type { SourceFile } from '@/catalog/source'
import { BTN, useSideNew } from '../shell/side'
import { ProTag } from '../blocks/ProTag'
import { track } from '../track'

// Fetched once per component, then kept for the session.
const cache = new Map<string, Promise<SourceFile[]>>()
const load = (id: string) => {
  if (!cache.has(id)) cache.set(id, fetch(`/source/${id}`).then((r) => r.json()))
  return cache.get(id)!
}

/** Fetches a component's source ahead of the Code tab, so the panel opens full. */
export const warmSource = (id: string) => void load(id).catch(() => cache.delete(id))

/** The component's real source, highlighted, with a tab per file and a copy button. */
export function Code({ id }: { id: string }) {
  const side = useSideNew()
  const [files, setFiles] = useState<SourceFile[] | null>(null)
  const [at, setAt] = useState(0)
  const [copied, setCopied] = useState(false)
  const t = useRef(0)

  // A new component starts from nothing loaded and its first file.
  const [seen, setSeen] = useState(id)
  if (seen !== id) {
    setSeen(id)
    setFiles(null)
    setAt(0)
  }
  useEffect(() => {
    let live = true
    load(id).then((f) => live && setFiles(f))
    return () => {
      live = false
    }
  }, [id])
  useEffect(() => () => clearTimeout(t.current), [])

  const file = files?.[at]
  if (files?.[0]?.teaser) return <Locked id={id} files={files} />
  const copy = async () => {
    if (!file) return
    try {
      await navigator.clipboard.writeText(file.code)
    } catch {
      /* Clipboard blocked: the code is right there to select. */
    }
    track('copy_code', { item: id, file: file.name })
    setCopied(true)
    clearTimeout(t.current)
    t.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="absolute inset-x-3 bottom-3 top-[68px] flex flex-col overflow-hidden rounded-[20px] bg-surface shadow-border">
      <div className="flex h-12 shrink-0 items-center gap-1 px-2.5 shadow-[inset_0_-1px_0_var(--line)]">
        {(files ?? []).map((f, i) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setAt(i)}
            className={`ring-focus h-8 px-3 font-mono text-caption transition-colors duration-150 ${side ? 'rounded-[8px]' : 'rounded-full'} ${i === at ? (side ? BTN.plate : 'bg-card text-ink') : 'text-ink-3 hover:text-ink-2'}`}
          >
            {f.name}
          </button>
        ))}
        <span className="flex-1" />
        {file && <span className="tnum mr-2 font-mono text-caption text-ink-3">{file.lines} lines</span>}
        <button type="button" onClick={copy} disabled={!file} className={`ring-focus flex h-8 w-[84px] items-center justify-center gap-1.5 text-caption font-medium text-ink-2 transition-[background-color,color,transform] duration-150 hover:text-ink active:scale-[0.97] ${side ? 'rounded-[8px] hover:bg-[var(--shell-hover)]' : 'rounded-full hover:bg-card'}`}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={copied ? 'y' : 'n'} className={`flex items-center gap-1.5 ${copied ? 'text-ok' : ''}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.16 }}>
              {copied ? <Check size={12} strokeWidth={2.6} /> : <Copy size={12} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
              {copied ? 'Copied' : 'Copy'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <div className="code min-h-0 flex-1 overflow-auto px-2 py-4 font-mono text-footnote leading-5" style={{ scrollbarWidth: 'thin' }}>
        {file ? (
          <motion.div key={`${id}-${at}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} dangerouslySetInnerHTML={{ __html: file.html }} />
        ) : (
          <div className="flex flex-col gap-2.5 px-4 pt-1">
            {[62, 48, 74, 40, 66, 52, 30, 58].map((w, i) => (
              <span key={i} className="h-3 animate-pulse rounded-full bg-card" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Pro source, on the public site: the file's real opening lines, fading out under a card that
 * says what's behind it and how to get it. Nothing here can be copied.
 */
function Locked({ id, files }: { id: string; files: SourceFile[] }) {
  const side = useSideNew()
  const plan = PLANS.find((p) => p.id === (id.startsWith('template-') ? 'all' : 'pro'))!
  const total = files.reduce((n, f) => n + f.lines, 0)
  return (
    <div className="absolute inset-x-3 bottom-3 top-[68px] flex flex-col overflow-hidden rounded-[20px] bg-surface shadow-border">
      <div className="flex h-12 shrink-0 items-center gap-1 px-2.5 shadow-[inset_0_-1px_0_var(--line)]">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {files.map((f, i) => (
            <span key={f.name} className={`flex h-8 shrink-0 items-center px-3 font-mono text-caption ${side ? 'rounded-[8px]' : 'rounded-full'} ${i === 0 ? (side ? BTN.plate : 'bg-card text-ink') : 'text-ink-3'}`}>
              {f.name}
            </span>
          ))}
        </div>
        <span className="tnum mr-2 shrink-0 font-mono text-caption text-ink-3">{total.toLocaleString('en-US')} lines</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="code px-2 py-4 font-mono text-footnote leading-5 [mask-image:linear-gradient(to_bottom,#000_20%,transparent_78%)]" aria-hidden dangerouslySetInnerHTML={{ __html: files[0].html }} />
        {/* Set high in the panel, where the faded code still shows, and clear of the dock floating at the screen's foot. */}
        <div className="absolute inset-x-0 top-0 flex justify-center px-6 pt-[clamp(32px,9vh,96px)]">
          <motion.div
            className="w-full max-w-[400px] rounded-[24px] bg-surface p-6 text-center shadow-modal"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}
          >
            <ProTag />
            <p className="mt-4 text-title text-ink">The source is in {plan.name}.</p>
            <p className="mx-auto mt-2 max-w-[310px] text-callout text-ink-3">
              {total.toLocaleString('en-US')} lines across {files.length === 1 ? 'one file' : `${files.length} files`}. Install it from the private registry and it&rsquo;s yours to read, change and keep.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/pro#pricing" className={side ? `ring-focus flex h-10 items-center justify-center rounded-[10px] ${BTN.accent} px-5 text-footnote font-medium transition-[opacity,transform] duration-150 active:scale-[0.97]` : "ring-focus flex h-10 items-center justify-center rounded-full bg-ink px-5 text-footnote font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"}>
                {plan.cta} · ${plan.price}
              </Link>
              <Link href="/pro" className={side ? `ring-focus flex h-10 items-center justify-center rounded-[10px] ${BTN.plate} px-5 text-footnote font-medium text-ink transition-[background-color,transform] duration-150 active:scale-[0.97]` : "ring-focus flex h-10 items-center justify-center rounded-full bg-surface-2 px-5 text-footnote font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-card active:scale-[0.97]"}>
                What&rsquo;s in Pro
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
