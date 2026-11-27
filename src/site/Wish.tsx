'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Close, Plus } from '@/lab/icons'

/**
 * "What should I build next?", a two-step, tap-to-answer card in the corner.
 *
 * Step 1, what would help: components, whole screens, templates, charts (pick any, then Next).
 * Step 2, for what product: optional topics and an optional one-line note (then Send).
 *
 * - Waits for 45 seconds of the page actually being looked at (counted across the visit), never on load.
 *   ?wish in the URL shows it straight away, to look at it.
 * - Once sent or closed it never comes back in this browser.
 * - Posts to /api/request (the piece_request table), picks prefixed "wish" to tell it apart from the hero's
 *   requests. Analytics only learns that a request happened, never the words.
 */
const UI = [0.2, 0, 0, 1] as const
const SEEN = 'detent:wish'
const TIME = 'detent:wish-time'
const WAIT = 45

const KINDS: { id: string; name: string }[] = [
  { id: 'components', name: 'Components' },
  { id: 'screens', name: 'Whole screens' },
  { id: 'templates', name: 'Templates' },
  { id: 'charts', name: 'Charts' },
]

const TOPICS: [string, string][] = [
  ['agents', 'AI agents'],
  ['chat', 'AI chat'],
  ['dashboards', 'Dashboards'],
  ['forms', 'Forms & inputs'],
  ['tables', 'Tables & lists'],
  ['billing', 'Billing'],
  ['onboarding', 'Onboarding'],
  ['landing', 'Landing pages'],
]

const done = () => {
  try {
    return localStorage.getItem(SEEN) !== null
  } catch {
    return true
  }
}
const remember = (how: 'sent' | 'closed') => {
  try {
    localStorage.setItem(SEEN, how)
  } catch {}
}

/* Pages where a corner card would get in the way: buying, account, full-screen template demos and unlisted previews */
const QUIET = ['/checkout', '/account', '/full', '/preview', '/feedback', '/unsubscribe', '/source', '/r/']

export function Wish() {
  const path = usePathname() ?? '/'
  const quiet = QUIET.some((p) => path.startsWith(p))
  return <Ask quiet={quiet} key={quiet ? 'quiet' : 'on'} />
}

function Ask({ quiet }: { quiet: boolean }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(false)
  const [step, setStep] = useState<1 | 2 | 'sent'>(1)
  const [kinds, setKinds] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const gone = useRef(done())

  /* Count only the seconds the tab is visible, and keep counting across pages of the same visit */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('wish')) {
      gone.current = false
      const t = window.setTimeout(() => setShown(true), 600)
      return () => clearTimeout(t)
    }
    if (gone.current || quiet) return
    let t = 0
    try {
      t = Number(sessionStorage.getItem(TIME) ?? 0)
    } catch {}
    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      t += 1
      try {
        sessionStorage.setItem(TIME, String(t))
      } catch {}
      if (t >= WAIT) {
        window.clearInterval(tick)
        setShown(true)
      }
    }, 1000)
    return () => window.clearInterval(tick)
  }, [quiet])

  const flip = (set: (f: (p: string[]) => string[]) => void, id: string) => set((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const close = () => {
    gone.current = true
    remember('closed')
    setShown(false)
  }

  const send = () => {
    const kindNames = KINDS.filter((k) => kinds.includes(k.id)).map((k) => k.name)
    const topicNames = TOPICS.filter(([id]) => topics.includes(id)).map(([, n]) => n)
    const text = [`Wish: ${kindNames.join(', ')}`, topicNames.length ? `for ${topicNames.join(', ')}` : '', note.trim()].filter(Boolean).join(' · ').slice(0, 200)
    const picks = ['wish', ...kinds, ...topics].slice(0, 6).join(',')
    void fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, picks }) }).catch(() => {})
    gone.current = true
    remember('sent')
    setStep('sent')
    window.setTimeout(() => setShown(false), 2200)
  }

  /* The card never changes size: both steps and the thank-you share one fixed body height, and only the content fades */
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduce ? 0 : 0.15, ease: UI } }

  const glyph = (id: string) => {
    const c = 'stroke-current fill-none'
    if (id === 'components')
      return (
        <svg aria-hidden width="44" height="26" viewBox="0 0 44 26" className={c} strokeWidth="1.4">
          <rect x="2" y="4" width="24" height="9" rx="4.5" className="fill-current opacity-[0.14]" stroke="none" />
          <rect x="2" y="4" width="24" height="9" rx="4.5" />
          <rect x="30" y="4.5" width="12" height="8" rx="4" />
          <circle cx="38" cy="8.5" r="2.6" className="fill-current" stroke="none" />
          <rect x="2" y="17" width="40" height="6" rx="3" className="opacity-50" />
        </svg>
      )
    if (id === 'screens')
      return (
        <svg aria-hidden width="44" height="26" viewBox="0 0 44 26" className={c} strokeWidth="1.4">
          <rect x="2" y="2" width="40" height="22" rx="3.5" />
          <path d="M13 2v22" className="opacity-50" />
          <path d="M5 7h5M5 11h5M5 15h4" className="opacity-50" strokeLinecap="round" />
          <rect x="17" y="6" width="21" height="6" rx="1.5" className="fill-current opacity-[0.16]" stroke="none" />
          <path d="M17 16h21M17 20h14" className="opacity-50" strokeLinecap="round" />
        </svg>
      )
    if (id === 'templates')
      return (
        <svg aria-hidden width="44" height="26" viewBox="0 0 44 26" className={c} strokeWidth="1.4">
          <rect x="12" y="1.5" width="24" height="17" rx="3" className="opacity-40" />
          <rect x="8" y="4.5" width="24" height="17" rx="3" className="opacity-70" />
          <rect x="4" y="7.5" width="24" height="17" rx="3" className="fill-[var(--leaf)]" />
          <path d="M8 13h12M8 17h8" strokeLinecap="round" className="opacity-60" />
        </svg>
      )
    return (
      <svg aria-hidden width="44" height="26" viewBox="0 0 44 26" className={c} strokeWidth="1.4">
        <path d="M3 24h38" className="opacity-40" strokeLinecap="round" />
        <rect x="6" y="14" width="5" height="10" rx="1.5" className="fill-current opacity-30" stroke="none" />
        <rect x="14" y="9" width="5" height="15" rx="1.5" className="fill-current opacity-30" stroke="none" />
        <rect x="22" y="12" width="5" height="12" rx="1.5" className="fill-current opacity-30" stroke="none" />
        <rect x="30" y="4" width="5" height="20" rx="1.5" className="fill-current" stroke="none" />
        <path d="M8.5 11 16.5 6l8 3 8-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <AnimatePresence>
      {shown && (
        <motion.aside
          aria-labelledby="wish-title"
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.4 }}
          style={{ background: 'var(--leaf)' }}
          className="fixed bottom-3 left-3 right-3 z-40 origin-bottom-right rounded-[20px] p-3 shadow-[0_0_0_1px_var(--line),0_24px_60px_-24px_rgb(0_0_0/0.4)] sm:bottom-5 sm:left-auto sm:right-5 sm:w-[316px]"
        >
          {step !== 'sent' && (
            <button type="button" aria-label="Close" onClick={close} className="ring-focus absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] hover:text-ink pointer-coarse:size-9">
              <Close size={12} />
            </button>
          )}

          <div className="relative h-[262px]">
            <AnimatePresence initial={false} mode="wait">
              {step === 'sent' ? (
                <motion.div key="sent" {...fade} role="status" className="flex h-full flex-col items-center justify-center text-center">
                  <motion.span initial={reduce ? false : { scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }} className="flex size-10 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_20px_-8px_var(--accent)]">
                    <Check size={16} strokeWidth={2.6} />
                  </motion.span>
                  <p id="wish-title" className="mt-3.5 text-[14px] text-ink">
                    Thanks, that helps.
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-3">It goes into what ships next.</p>
                </motion.div>
              ) : (
                <motion.div key={step} {...fade} className="flex h-full flex-col">
                  <div className="px-1.5 pt-1">
                    <p id="wish-title" className="pr-8 text-[14px] font-medium leading-5 tracking-[-0.01em] text-ink">
                      {step === 1 ? 'What should I build next?' : 'For what kind of product?'}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-ink-3">{step === 1 ? 'Tap everything you’d use.' : 'Optional, but it helps.'}</p>
                  </div>

                  {step === 1 ? (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {KINDS.map((k) => {
                        const on = kinds.includes(k.id)
                        return (
                          <button
                            key={k.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => flip(setKinds, k.id)}
                            className={`ring-focus group/k relative flex h-[78px] flex-col justify-between rounded-[13px] px-3 pb-2.5 pt-3 text-left transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.97] ${on ? 'bg-surface shadow-[inset_0_0_0_1.5px_var(--accent),0_6px_16px_-10px_var(--accent)]' : 'bg-[color-mix(in_oklch,var(--ink)_3.5%,transparent)] shadow-[inset_0_0_0_1px_var(--line)] hover:bg-[color-mix(in_oklch,var(--ink)_6%,transparent)]'}`}
                          >
                            <span className={`transition-colors duration-150 ${on ? 'text-accent' : 'text-ink-3 group-hover/k:text-ink-2'}`}>{glyph(k.id)}</span>
                            <span className={`text-[13px] leading-4 transition-colors duration-150 ${on ? 'text-ink' : 'text-ink-2'}`}>{k.name}</span>
                            <span className={`absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-accent text-white transition-[opacity,transform] duration-200 ${on ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                              <Check size={10} strokeWidth={3} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 px-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {TOPICS.map(([id, name]) => {
                          const on = topics.includes(id)
                          return (
                            <button
                              key={id}
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() => flip(setTopics, id)}
                              className={`ring-focus h-7 rounded-full px-2.5 text-[12.5px] transition-[background-color,color,box-shadow] duration-150 ${on ? 'bg-ink text-surface shadow-[0_0_0_1px_var(--ink)]' : 'text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] hover:text-ink'}`}
                            >
                              {name}
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-2.5 h-8">
                        {noteOpen ? (
                          <input
                            autoFocus
                            value={note}
                            maxLength={140}
                            onChange={(e) => setNote(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && send()}
                            placeholder="Something specific?"
                            aria-label="Something specific"
                            className="ring-focus h-8 w-full rounded-[9px] bg-surface px-2.5 text-[16px] text-ink shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-ink-3 sm:text-[13px]"
                          />
                        ) : (
                          <button type="button" onClick={() => setNoteOpen(true)} className="ring-focus flex h-8 items-center gap-1 rounded-[6px] text-[13px] text-ink-3 transition-colors hover:text-ink">
                            <Plus size={11} />
                            Something specific
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <span aria-label={`Step ${step} of 2`} className="flex items-center gap-1 pl-1.5">
                      <span className={`h-1 rounded-full bg-ink transition-[width,opacity] duration-300 ${step === 1 ? 'w-4' : 'w-1.5 opacity-25'}`} />
                      <span className={`h-1 rounded-full bg-ink transition-[width,opacity] duration-300 ${step === 2 ? 'w-4' : 'w-1.5 opacity-25'}`} />
                    </span>
                    <span className="flex-1" />
                    {step === 2 && (
                      <button type="button" onClick={() => setStep(1)} className="ring-focus h-9 rounded-full px-3 text-[13px] text-ink-2 transition-colors hover:text-ink">
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={step === 1 && !kinds.length}
                      onClick={step === 1 ? () => setStep(2) : send}
                      className="ring-focus h-9 rounded-full bg-ink px-4 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 active:scale-[0.97] disabled:opacity-25"
                    >
                      {step === 1 ? 'Next' : 'Send'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
