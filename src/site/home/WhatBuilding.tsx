'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { match, moreInPro, recipeFor, recipePicks } from '@/catalog/match'
import type { Pick } from '@/catalog/match'
import { buildPrompt, openPrompt, partsPrompt, planPrompt } from '@/catalog/prompts'
import type { Recipe } from '@/catalog/recipes'
import { ArrowUpRight, Check, Copy, Prompt } from '@/lab/icons'
import { PLANS } from '@/catalog/pro'
import { useOwned } from '../Owned'
import { Price } from '../Promo'
import { track } from '../track'

/* The Iris board: a quiet tray holding white sheets */
const IRIS = {
  '--i-tray': 'light-dark(#f2f2f0, #111113)',
  '--i-sheet': 'light-dark(#ffffff, #1c1c1f)',
  '--i-edge': 'light-dark(rgb(0 0 0 / .08), rgb(255 255 255 / .09))',
  '--i-hover': 'light-dark(rgb(0 0 0 / .045), rgb(255 255 255 / .06))',
  '--i-bone': 'light-dark(rgb(0 0 0 / .06), rgb(255 255 255 / .07))',
  '--i-t1': 'light-dark(#18181b, #e9e8e5)',
  '--i-t2': 'light-dark(#55555c, #a6a49f)',
  '--i-t3': 'light-dark(#8b8b91, #77756f)',
  '--i-ink': 'light-dark(#18181b, #ecebe8)',
  '--i-ink-on': 'light-dark(#ffffff, #141414)',
  '--i-drop': 'light-dark(rgb(0 0 0 / .1), rgb(0 0 0 / .55))',
} as CSSProperties

const IDEAS = ['a pricing page', 'an agent dashboard', 'a support inbox', 'a landing page']
const ease = [0.2, 0, 0, 1] as const
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1'
const SHEET = 'rounded-[20px] bg-[var(--i-sheet)] shadow-[inset_0_1px_0_rgb(255_255_255/.04),0_0_0_0.5px_var(--i-edge),0_1px_2px_var(--i-drop)]'
const PAUSE = 550
const READ = 450

type Found = { goal: string; picks: Pick[]; plan: Recipe | null }
type AskState = 'idle' | 'writing' | 'sending' | 'sent' | 'noted' | 'failed'

const list = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`)

function Tag({ pro }: { pro: boolean }) {
  return (
    <span className={`inline-flex h-[18px] items-center rounded-[5px] px-1.5 text-[11px] font-medium ${pro ? 'bg-[var(--i-ink)] text-[var(--i-ink-on)]' : 'bg-[var(--i-tray)] text-[var(--i-t2)]'}`}>
      {pro ? 'Pro' : 'Free'}
    </span>
  )
}

function Spinner() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-[13px] animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 8a6 6 0 1 1-6-6" />
    </svg>
  )
}

/* "What are you building?": the words are matched against what each piece is for, on the page, with no model.
   Find shows the pieces, then the same button copies one prompt that has a coding agent set Detent up and add
   them. When nothing matches by name, the prompt has the agent read the index and choose. Without Pro, the
   agent asks, builds with free pieces and fallbacks, and says what Pro would have added. */
export function WhatBuilding() {
  const reduce = useReducedMotion()
  const owned = useOwned()
  const hasPro = owned === 'pro' || owned === 'all'
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'reading' | 'done'>('idle')
  const [found, setFound] = useState<Found | null>(null)
  const [copied, setCopied] = useState(0)
  const [ask, setAsk] = useState<{ state: AskState; id?: string }>({ state: 'idle' })
  const [draft, setDraft] = useState('')
  const [end, setEnd] = useState(false)
  const [email, setEmail] = useState('')
  const timers = useRef<number[]>([])
  const run = useRef(0)
  const pause = useRef(0)
  const tracked = useRef('')
  const box = useRef<HTMLTextAreaElement>(null)
  const asked = text.trim()

  const picks = found?.picks ?? []
  const plan = found?.plan ?? null
  const pros = picks.filter((p) => p.pro).length
  const alts = picks.filter((p) => p.pro && p.alt).map((p) => p.alt!.name)
  const more = found && picks.length && !pros && !hasPro ? moreInPro(picks) : null
  const gated = !!plan && !hasPro
  const freePicks = picks.filter((p) => !p.pro)
  const shown = gated ? freePicks : picks
  const prompt = found ? (plan ? (gated ? partsPrompt(found.goal, plan, freePicks, picks.filter((p) => p.pro)) : planPrompt(found.goal, plan)) : picks.length ? buildPrompt(found.goal, picks, hasPro) : openPrompt(found.goal, hasPro)) : ''

  useEffect(() => () => (timers.current.forEach(clearTimeout), clearTimeout(pause.current)), [])
  /* the box grows with what is written, up to four lines */
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 104)}px`
  }, [text])

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  /* find runs on its own once typing pauses; a newer find cancels an older one still reading */
  const find = (goal: string) => {
    if (goal.length < 3) return
    const me = ++run.current
    setPhase('reading')
    setAsk({ state: 'idle' })
    setEmail('')
    setDraft('')
    setEnd(false)
    const found = recipeFor(goal)
    const recipe = found && (hasPro || recipePicks(found).some((p) => !p.pro)) ? found : null
    const result = recipe ? recipePicks(recipe) : match(goal, 6)
    if (tracked.current !== goal) {
      tracked.current = goal
      track('build_match', { found: result.length, plan: recipe?.id ?? 'none', picks: result.map((p) => p.id).join(',') || 'none' })
    }
    later(() => {
      if (me !== run.current) return
      setFound({ goal, picks: result, plan: recipe })
      setPhase('done')
    }, reduce ? 0 : READ)
  }

  const copy = async () => {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {}
    setCopied((n) => n + 1)
    track('copy_prompt', { item: plan ? `plan-${plan.id}` : picks.length ? 'build' : 'build-open', picks: picks.map((p) => p.id).join(','), pro: hasPro ? 'owner' : pros ? 'needs' : 'free', page: location.pathname })
    later(() => setCopied(0), 1600)
  }

  /* asking for what Detent doesn't have yet: the words first, an email only if they want to hear back */
  /* what they write is the request: nothing is sent until they have said what is missing */
  const open = () => {
    setDraft(picks.length ? '' : (found?.goal ?? ''))
    setAsk({ state: 'writing' })
  }
  const request = async () => {
    const what = draft.trim()
    if (what.length < 3 || ask.state === 'sending') return
    setAsk({ state: 'sending' })
    try {
      const res = await fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: what, picks: picks.map((p) => p.id).join(',') }) })
      const body = (await res.json()) as { ok?: boolean; id?: string }
      setAsk(body.ok ? { state: 'sent', id: body.id } : { state: 'failed' })
    } catch {
      setAsk({ state: 'failed' })
    }
  }
  const notify = async () => {
    if (!ask.id || !email.includes('@')) return
    try {
      const res = await fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ask.id, email }) })
      if (res.ok) setAsk({ state: 'noted', id: ask.id })
    } catch {}
  }

  const edit = (value: string) => {
    setText(value)
    clearTimeout(pause.current)
    run.current++
    const goal = value.trim()
    if (goal.length < 3) {
      setPhase('idle')
      setFound(null)
      return
    }
    /* the last answer stays up while they type; the new one comes when they pause */
    setPhase('idle')
    pause.current = window.setTimeout(() => find(goal), PAUSE)
  }

  const pickIdea = (idea: string) => {
    clearTimeout(pause.current)
    setText(idea)
    find(idea)
  }

  const ready = phase === 'done' && !!prompt
  const label = phase === 'reading' ? 'Finding' : copied ? 'Copied' : 'Copy prompt'

  return (
    <div className="w-full max-w-[560px] text-left">
      <div style={IRIS} className="rounded-[26px] bg-[var(--i-tray)] p-1.5 shadow-[0_0_0_0.5px_var(--i-edge),0_28px_64px_-28px_var(--i-drop)]">
        <div className="flex h-9 items-center justify-between gap-3 px-3 text-[13px]">
          <span className="flex shrink-0 items-center gap-2 whitespace-nowrap font-medium text-[var(--i-t1)]">
            <Prompt size={14} aria-hidden />
            Build it with your agent
          </span>
          <span className={`tnum truncate text-[var(--i-t3)] ${phase === 'done' ? '' : 'max-sm:hidden'}`}>
            {phase === 'done' ? (gated ? `${freePicks.length} free piece${freePicks.length === 1 ? '' : 's'}` : plan ? `Whole ${plan.noun} · ${picks.length} piece${picks.length === 1 ? '' : 's'}${pros ? ` · ${pros} Pro` : ''}` : picks.length ? `${picks.length} piece${picks.length === 1 ? '' : 's'}${pros ? ` · ${pros} Pro` : ''}` : 'Agent picks') : 'For Cursor, Claude Code, Codex'}
          </span>
        </div>

        <form onSubmit={(e) => (e.preventDefault(), copy())} className={SHEET}>
          <label htmlFor="what-building" className="sr-only">
            What are you building?
          </label>
          <textarea
            ref={box}
            id="what-building"
            rows={2}
            value={text}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (ready) copy()
              }
              if (e.key === 'Escape') edit('')
            }}
            placeholder="What are you building? A pricing page for my AI app…"
            autoComplete="off"
            spellCheck={false}
            maxLength={200}
            className="block min-h-[52px] w-full resize-none bg-transparent px-4 pt-3.5 text-[14px] leading-[1.5] text-[var(--i-t1)] outline-none placeholder:text-[var(--i-t3)] pointer-coarse:text-[16px]"
          />
          <div className="flex items-center justify-between gap-3 py-2 pl-4 pr-2">
            <span className="text-[12px] text-[var(--i-t3)] max-sm:hidden">{phase === 'done' ? 'Paste it into your coding agent' : 'Pieces show up as you type'}</span>
            <motion.button
              type="submit"
              disabled={!ready}
              aria-label={label}
              initial={false}
              animate={{ opacity: ready || phase === 'reading' ? 1 : 0.28 }}
              transition={{ duration: 0.16, ease }}
              className={`ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[var(--i-ink)] px-3.5 text-[12.5px] font-medium text-[var(--i-ink-on)] ${FOCUS}`}
            >
              {phase === 'reading' ? <Spinner /> : copied ? <Check size={13} strokeWidth={2.6} /> : <Copy size={13} style={{ ['--icon-cutout' as string]: 'var(--i-ink)' }} />}
              <span className="tnum">{label}</span>
            </motion.button>
          </div>
        </form>

        <AnimatePresence initial={false} mode="wait">
          {phase === 'reading' ? (
            <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className={`mt-1.5 p-1.5 ${SHEET}`} aria-live="polite">
              <p className="px-3 pb-1 pt-2 text-[12.5px] text-[var(--i-t3)]">Reading what you’re building…</p>
              {[0.62, 0.48, 0.55].map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <motion.span className="block h-3 rounded-full bg-[var(--i-bone)]" style={{ width: `${w * 60}%` }} animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }} />
                    <motion.span className="block h-2.5 rounded-full bg-[var(--i-bone)]" style={{ width: `${w * 100}%` }} animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 + 0.06 }} />
                  </span>
                </div>
              ))}
            </motion.div>
          ) : found ? (
            <motion.div key={`done-${found.goal}`} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease }} className={`mt-1.5 overflow-hidden transition-opacity duration-200 ${phase === 'done' ? '' : 'opacity-55'} ${SHEET}`}>
              {plan && !gated && (
                <div className="px-4 pb-1 pt-3.5">
                  <p className="text-[13.5px] font-medium text-[var(--i-t1)]">Your agent builds the whole {plan.name.toLowerCase()}</p>
                  <p className="mt-1 text-[12.5px] leading-[1.5] text-[var(--i-t3)]">
                    Laid out from Detent’s plan and shaped to what you wrote. These pieces go in it:
                  </p>
                </div>
              )}
              {shown.length ? (
                <ul
                  className={`p-1.5 ${shown.length > 4 ? 'max-h-[268px] overflow-y-auto overscroll-contain [scrollbar-width:thin]' : ''}`}
                  /* a fade says there is more below, and lifts once the last piece is in view */
                  onScroll={(e) => setEnd(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
                  style={shown.length > 4 && !end ? { maskImage: 'linear-gradient(to bottom, #000 calc(100% - 28px), transparent)', WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 28px), transparent)' } : undefined}
                  tabIndex={shown.length > 4 ? 0 : undefined}
                  aria-label={shown.length > 4 ? `${shown.length} pieces, scroll for more` : undefined}
                >
                  {shown.map((p) => (
                    <li key={p.id}>
                      <Link href={`/${p.kind}/${p.id}`} className={`group/pick flex items-center gap-3 rounded-[14px] px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--i-hover)] ${FOCUS}`}>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-[13.5px] font-medium text-[var(--i-t1)]">
                            {p.name}
                            <Tag pro={p.pro} />
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-[var(--i-t3)]">{p.pro && !hasPro && p.alt ? `Without Pro: ${p.alt.name} instead` : p.why}</span>
                        </span>
                        <ArrowUpRight size={12} className="shrink-0 text-[var(--i-t3)] transition-transform duration-150 group-hover/pick:-translate-y-px group-hover/pick:translate-x-px" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3.5">
                  <p className="text-[13.5px] font-medium text-[var(--i-t1)]">Your agent will choose the pieces</p>
                  <p className="mt-1 text-[12.5px] leading-[1.5] text-[var(--i-t3)]">The prompt has it read Detent’s index, pick what fits what you’re building, and check with you before adding anything.</p>
                </div>
              )}
              {gated && (
                <p className="mx-3 mb-3 rounded-[12px] bg-[var(--i-tray)] px-3 py-2 text-[12.5px] leading-[1.5] text-[var(--i-t2)]">All free and MIT, nothing to buy.</p>
              )}
              {!gated && picks.length > 0 && !pros && (
                <p className="mx-3 mb-3 rounded-[12px] bg-[var(--i-tray)] px-3 py-2 text-[12.5px] leading-[1.5] text-[var(--i-t2)]">
                  {hasPro ? (
                    'All in your plan.'
                  ) : (
                    <>
                      All free and MIT, nothing to buy.
                      {more && (
                        <>
                          {' '}
                          <Link href="/pro" data-cta="build-more" className={`rounded-[4px] font-medium text-[var(--i-t1)] underline-offset-2 hover:underline ${FOCUS}`}>
                            Pro has {more.count} more {more.label}
                          </Link>
                          .
                        </>
                      )}
                    </>
                  )}
                </p>
              )}
              {pros > 0 && !hasPro && !plan && pros < picks.length && (
                <p className="mx-3 mb-3 rounded-[12px] bg-[var(--i-tray)] px-3 py-2 text-[12.5px] leading-[1.5] text-[var(--i-t2)]">
                  No Pro? Your agent builds the free part and tells you what{' '}
                  <Link href="/pro" data-cta="build" className={`rounded-[4px] font-medium text-[var(--i-t1)] underline-offset-2 hover:underline ${FOCUS}`}>
                    Pro
                  </Link>{' '}
                  would add.
                </p>
              )}
              {pros > 0 && !hasPro && !plan && pros === picks.length && (
                <div className="mx-3 mb-3 flex items-center gap-3 rounded-[12px] bg-[var(--i-tray)] py-2 pl-3 pr-2 max-sm:flex-col max-sm:items-start">
                  <p className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-[var(--i-t2)]">
                    {picks.length === 1 ? 'This is in Pro.' : 'All of these are in Pro.'}{' '}
                    {alts.length ? `Without it, your agent can start with ${list(alts)}, the closest free ${alts.length === 1 ? 'piece' : 'pieces'}.` : 'There’s no free piece for it yet.'}
                  </p>
                  <Link href="/pro" data-cta="build-allpro" className={`flex h-7 shrink-0 items-center rounded-full bg-[var(--i-ink)] px-3 text-[12px] font-medium text-[var(--i-ink-on)] ${FOCUS}`}>
                    Get Pro ·&nbsp;<Price value={PLANS[0].price} />
                  </Link>
                </div>
              )}
              {phase === 'done' && <Ask state={ask.state} quiet={picks.length > 0} draft={draft} setDraft={setDraft} email={email} setEmail={setEmail} onOpen={open} onRequest={request} onNotify={notify} />}
            </motion.div>
          ) : !asked ? (
            <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="flex flex-wrap gap-1.5 px-1.5 pb-1 pt-2">
              {IDEAS.map((idea) => (
                <button key={idea} type="button" onClick={() => pickIdea(idea)} className={`h-7 rounded-full bg-[var(--i-sheet)] px-3 text-[12.5px] text-[var(--i-t2)] shadow-[0_0_0_0.5px_var(--i-edge)] transition-colors duration-150 hover:text-[var(--i-t1)] ${FOCUS}`}>
                  {idea}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* "Request it": quiet under a good answer, plain when nothing fit. It opens a field for what is missing, and only
   that is sent. After it's sent, an email field to hear back. */
function Ask({ state, quiet, draft, setDraft, email, setEmail, onOpen, onRequest, onNotify }: { state: AskState; quiet: boolean; draft: string; setDraft: (v: string) => void; email: string; setEmail: (v: string) => void; onOpen: () => void; onRequest: () => void; onNotify: () => void }) {
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state === 'writing') field.current?.focus()
  }, [state])
  const row = 'mx-3 mb-3 flex items-center gap-2 rounded-[12px] bg-[var(--i-tray)] py-1.5 pl-3 pr-1.5'
  const send = `flex h-7 shrink-0 items-center rounded-full bg-[var(--i-ink)] px-3 text-[12px] font-medium text-[var(--i-ink-on)] disabled:opacity-30 ${FOCUS}`
  const input = 'min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--i-t1)] outline-none placeholder:text-[var(--i-t3)] pointer-coarse:text-[16px]'

  if (state === 'noted') return <p className="px-4 pb-3 text-[12.5px] text-[var(--i-t3)]">Thanks. We’ll write when it’s built.</p>
  if (state === 'sent')
    return (
      <form onSubmit={(e) => (e.preventDefault(), onNotify())} className={row}>
        <span className="shrink-0 text-[12.5px] text-[var(--i-t2)] max-sm:hidden">Requested. Hear when it’s built?</span>
        <label htmlFor="request-email" className="sr-only">
          Email, to hear when it’s built
        </label>
        <input id="request-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" className={input} />
        <button type="submit" disabled={!/^\S+@\S+\.\S+$/.test(email)} className={send}>
          Notify me
        </button>
      </form>
    )
  if (state === 'writing' || state === 'sending' || state === 'failed')
    return (
      <form onSubmit={(e) => (e.preventDefault(), onRequest())} className={row}>
        <label htmlFor="request-what" className="sr-only">
          What should Detent have?
        </label>
        <input ref={field} id="request-what" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200} placeholder={quiet ? 'What’s missing? e.g. a kanban board' : 'What should Detent have?'} autoComplete="off" className={input} />
        {state === 'failed' && <span className="shrink-0 text-[12px] text-[var(--i-t3)]">Didn’t send</span>}
        <button type="submit" disabled={draft.trim().length < 3 || state === 'sending'} className={send}>
          {state === 'sending' ? <Spinner /> : state === 'failed' ? 'Try again' : 'Send'}
        </button>
      </form>
    )
  return quiet ? (
    <p className="px-4 pb-3 text-[12.5px] text-[var(--i-t3)]">
      Missing something?{' '}
      <button type="button" onClick={onOpen} className={`rounded-[4px] font-medium text-[var(--i-t2)] underline-offset-2 hover:text-[var(--i-t1)] hover:underline ${FOCUS}`}>
        Request it
      </button>
    </p>
  ) : (
    <div className="mx-3 mb-3 flex items-center gap-3 rounded-[12px] bg-[var(--i-tray)] py-2 pl-3 pr-2">
      <p className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-[var(--i-t2)]">Want Detent to have a piece for this? Tell us, it decides what gets built next.</p>
      <button type="button" onClick={onOpen} className={send}>
        Request it
      </button>
    </div>
  )
}
