'use client'

import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'

type State = 'idle' | 'sending' | 'done' | 'error'
type Size = 'lg' | 'sm'

const UI = [0.2, 0, 0, 1] as const
const OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SAY = { invalid: 'That email looks incomplete.', limited: 'Too many tries. Give it an hour.', failed: 'That didn’t go through. Try again in a moment.' }

const SIZES = {
  lg: { box: 'h-11 rounded-[13px] p-1', btn: 'h-9 rounded-[9px] px-4 text-[13px]', text: 'pl-3 text-[13px]' },
  sm: { box: 'h-9 rounded-[11px] p-[3px]', btn: 'h-[30px] rounded-[8px] px-3 text-[12.5px]', text: 'pl-2.5 text-[13px]' },
}

export function Subscribe({ source, size = 'lg', label = 'Subscribe', note, center = false, className = '' }: { source: string; size?: Size; label?: string; note?: string; center?: boolean; className?: string }) {
  const id = useId()
  const reduce = useReducedMotion()
  const input = useRef<HTMLInputElement>(null)
  const trap = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [why, setWhy] = useState<keyof typeof SAY>('invalid')
  const [focused, setFocused] = useState(false)
  const [box, animate] = useAnimate()
  const s = SIZES[size]

  const fail = (reason: keyof typeof SAY) => {
    setWhy(reason)
    setState('error')
    if (!reduce) animate(box.current, { x: [0, -5, 4, -2, 0] }, { duration: 0.32, ease: UI })
    input.current?.focus()
  }

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (state === 'sending' || state === 'done') return
    if (!OK.test(email.trim())) return fail('invalid')
    setState('sending')
    const started = Date.now()
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), source, company: trap.current?.value ?? '' }),
    }).catch(() => null)
    const body = (await res?.json().catch(() => null)) as { ok?: boolean; error?: keyof typeof SAY } | null
    const wait = 600 - (Date.now() - started)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    if (body?.ok) setState('done')
    else fail(body?.error && body.error in SAY ? body.error : 'failed')
  }

  const bad = state === 'error'
  const done = state === 'done'
  const busy = state === 'sending'
  const ring = bad
    ? 'shadow-[0_0_0_1px_var(--sub-bad),0_0_0_4px_color-mix(in_oklch,var(--sub-bad)_14%,transparent)]'
    : focused && !done
      ? 'shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_70%,transparent),0_0_0_4px_color-mix(in_oklch,var(--accent)_14%,transparent)]'
      : 'shadow-[0_0_0_1px_var(--line-strong),0_1px_2px_rgb(0_0_0/0.04)]'

  return (
    <form noValidate onSubmit={send} className={`w-full [--sub-bad:#e5484d] dark:[--sub-bad:#ff6369] ${className}`}>
      <input ref={trap} type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
      <div ref={box} className={`relative flex items-center bg-surface transition-shadow duration-150 ${s.box} ${ring}`}>
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <AnimatePresence initial={false} mode="popLayout">
          {done ? (
            <motion.p
              key="done"
              role="status"
              className={`flex min-w-0 flex-1 items-center gap-2 text-ink ${s.text}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.32, ease: UI, delay: 0.06 } }}
            >
              <Tick reduce={!!reduce} />
              <span className="truncate">
                You’re in. <span className="text-ink-3">Check your inbox.</span>
              </span>
            </motion.p>
          ) : (
            <motion.input
              key="field"
              ref={input}
              id={id}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="Email address"
              value={email}
              readOnly={busy}
              aria-invalid={bad || undefined}
              aria-describedby={bad ? `${id}-bad` : undefined}
              onChange={(e) => {
                setEmail(e.target.value)
                if (state === 'error') setState('idle')
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.16, ease: UI } }}
              className={`h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-3 max-sm:text-[16px] ${busy ? 'text-ink-3' : 'text-ink'} ${s.text}`}
            />
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {!done && (
            <motion.button
              key="go"
              type="submit"
              aria-label={busy ? 'Subscribing' : undefined}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(2px)', transition: { duration: 0.14, ease: UI } }}
              className={`ring-focus relative ml-2 grid shrink-0 place-items-center bg-ink font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97] ${s.btn}`}
            >
              <span className={`col-start-1 row-start-1 transition-opacity duration-150 ${busy ? 'opacity-0' : ''}`}>{label}</span>
              <span aria-hidden className={`col-start-1 row-start-1 transition-opacity duration-150 ${busy ? '' : 'opacity-0'}`}>
                <Spinner />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {bad && (
          <motion.p
            id={`${id}-bad`}
            role="alert"
            className={`overflow-hidden px-1 text-[12px] text-[var(--sub-bad)] ${center ? 'text-center' : ''}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transition: { duration: 0.2, ease: UI } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.14, ease: UI } }}
          >
            <span className="block pt-2">{SAY[why]}</span>
          </motion.p>
        )}
      </AnimatePresence>
      {note && !bad && <p className={`pt-2.5 text-[12px] text-ink-3 ${center ? 'text-center' : ''}`}>{note}</p>}
    </form>
  )
}

function Tick({ reduce }: { reduce: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white"
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: UI, delay: 0.14 }} />
      </svg>
    </motion.span>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin [animation-duration:700ms]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.6" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
