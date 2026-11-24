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

  const box = (on: boolean) => (
    <span className={`flex size-4 shrink-0 items-center justify-center rounded-[5px] transition-colors duration-150 ${on ? 'bg-ink text-surface' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
      <Check size={10} strokeWidth={3} className={on ? 'opacity-100' : 'opacity-0'} />
    </span>
  )

  return (
    <AnimatePresence>
      {shown && (
        <motion.aside
          aria-labelledby="wish-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: UI }}
          style={{ background: 'var(--leaf)' }}
          className="fixed bottom-3 left-3 right-3 z-40 rounded-[18px] p-4 shadow-[0_0_0_1px_var(--line),0_20px_50px_-20px_rgb(0_0_0/0.3)] sm:bottom-5 sm:left-auto sm:right-5 sm:w-[300px]"
        >
          {step !== 'sent' && (
            <button type="button" aria-label="Close" onClick={close} className="ring-focus absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:text-ink">
              <Close size={12} />
            </button>
          )}

          <div className="relative h-[236px]">
            <AnimatePresence initial={false} mode="wait">
              {step === 'sent' ? (
                <motion.div key="sent" {...fade} role="status" className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-8 items-center justify-center rounded-full bg-ink text-surface">
                    <Check size={14} strokeWidth={2.6} />
                  </span>
                  <p id="wish-title" className="mt-3 text-[14px] text-ink">
                    Thanks, that helps.
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-3">It goes into what ships next.</p>
                </motion.div>
              ) : (
                <motion.div key={step} {...fade} className="flex h-full flex-col">
                  <p id="wish-title" className="pr-8 text-[14px] leading-5 text-ink">
                    {step === 1 ? 'What should I build next?' : 'For what kind of product?'}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-3">{step === 1 ? 'Pick as many as you like.' : 'Optional.'}</p>

                  {step === 1 ? (
                    <div className="-mx-1.5 mt-3">
                      {KINDS.map((k) => {
                        const on = kinds.includes(k.id)
                        return (
                          <button
                            key={k.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => flip(setKinds, k.id)}
                            className={`ring-focus flex h-9 w-full items-center gap-2.5 rounded-[9px] px-1.5 text-left text-[14px] transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] ${on ? 'text-ink' : 'text-ink-2'}`}
                          >
                            {box(on)}
                            {k.name}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-3">
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

                  <div className="mt-auto flex items-center gap-2">
                    <span className="text-[12px] tabular-nums text-ink-3">{step}/2</span>
                    <span className="flex-1" />
                    {step === 2 && (
                      <button type="button" onClick={() => setStep(1)} className="ring-focus h-8 rounded-full px-3 text-[13px] text-ink-2 transition-colors hover:text-ink">
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={step === 1 && !kinds.length}
                      onClick={step === 1 ? () => setStep(2) : send}
                      className="ring-focus h-8 rounded-full bg-ink px-4 text-[13px] text-surface transition-[opacity,transform] duration-150 active:scale-[0.97] disabled:opacity-25"
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
