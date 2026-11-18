'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import LINES from '@/catalog/lines.json'
import { installCommand } from '@/catalog/site'
import { piecePrompt } from '@/catalog/prompts'
import { Check, Copy } from '@/lab/icons'
import { CopyCommand } from './parts'
import { useOwned } from './Owned'
import { BTN, useSideNew } from './shell/side'
import { track } from './track'

const link = 'ring-focus rounded-[4px] underline-offset-2 hover:text-ink hover:underline'
const strong = `${link} font-medium text-ink-2`

export function Install({ id, free, bare = false }: { id: string; free: boolean; bare?: boolean }) {
  const template = id.startsWith('template-')
  const [noted, setNoted] = useState(false)
  const timer = useRef(0)
  const note = () => {
    setNoted(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNoted(false), 1600)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const owned = useOwned()
  const has = owned === 'all' || owned === 'pro'
  const lines = (LINES as Record<string, number>)[id]
  const plan = 'Pro'
  const prompt = piecePrompt(id)
  /* Agent first: the prompt is the way in, the command stays beside it for people who run it themselves */
  const row = (
    <div className="flex w-full min-w-0 items-center gap-2">
      {prompt && <CopyPrompt id={id} prompt={prompt} locked={!free && !has} />}
      <div className="min-w-0 flex-1">
        <CopyCommand fill command={installCommand(id, free)} onCopy={free ? undefined : note} />
      </div>
    </div>
  )
  if (bare) return row
  return (
    <div className="w-full">
      {row}
      <p className="mt-2 flex h-4 items-center gap-1 whitespace-nowrap px-1 text-caption text-ink-3 sm:justify-end">
        {free ? (
          <>
            <span className="font-medium text-ink-2">Free</span> ·
            <Link href="/licence#free" className={link}>
              MIT
            </Link>
            · brings its files and the theme
          </>
        ) : (
          <motion.span key={String(noted)} className="flex items-center gap-1" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
            {noted ? (
              <>
                Runs with {template ? 'a' : 'your'} {plan} key ·
                {has ? (
                  <Link href="/account#keys" className={strong}>
                    Your keys
                  </Link>
                ) : (
                  <Link href="/pro" className={strong}>
                    {template ? 'Get it' : 'Get Pro'}
                  </Link>
                )}
              </>
            ) : (
              <>
                {lines ? <span className={template ? 'max-sm:hidden' : ''}>{lines.toLocaleString('en-US')} lines ·</span> : null}
                {has ? (
                  <span className="font-medium text-ink-2">In your plan</span>
                ) : (
                  <Link href="/pro" className={strong}>
                    {template ? `Comes with ${plan}` : 'Get Pro'}
                  </Link>
                )}
              </>
            )}
          </motion.span>
        )}
      </p>
    </div>
  )
}

const primary = (side: boolean) =>
  side
    ? `ring-focus flex h-10 shrink-0 items-center gap-2 rounded-[11px] ${BTN.accent} pl-3.5 pr-4 text-[13px] font-medium transition-transform duration-150 active:scale-[0.97]`
    : 'ring-focus flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]'

/* Copies the prompt a coding agent follows to add this piece: it fetches the piece's markdown and its steps.
   On a Pro piece for someone without Pro the agent could only stop and ask for a key, so it opens Pro's plans instead. */
export function CopyPrompt({ id, prompt, locked = false }: { id: string; prompt: string; locked?: boolean }) {
  const side = useSideNew()
  const router = useRouter()
  const [copied, setCopied] = useState(0)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    if (locked) {
      track('pro_click', { cta: 'copy-prompt-locked', item: id, page: location.pathname })
      router.push('/pro#pricing')
      return
    }
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {}
    setCopied((n) => n + 1)
    track('copy_prompt', { item: id, page: location.pathname })
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(0), 1600)
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={locked ? 'The prompt for a Pro piece comes with Detent Pro' : prompt}
      aria-label={locked ? 'Copy prompt, needs Detent Pro: see the plans' : copied ? 'Prompt copied' : 'Copy a prompt for your coding agent'}
      className={primary(side)}
    >
      <span className="relative flex size-3.5 items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={copied ? 'ok' : 'copy'} className="flex" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.16 }}>
            {copied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} style={{ ['--icon-cutout' as string]: side ? 'var(--accent)' : 'var(--ink)' }} />}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="tnum">{copied ? 'Copied' : 'Copy prompt'}</span>
    </button>
  )
}
