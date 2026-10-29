'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, ChevronDown, Lock, Mail, Plus } from '@/lab/blocks/kit/icons'
import { ease, press, spring } from '@/lab/lib/motion'
import { tap } from '@/lab/lib/feel'
import { CodeInput } from '@/lab/components/code/CodeInput'
import type { CodeHandle } from '@/lab/components/code/CodeInput'
import { Bloom, DrawnCheck } from '@/lab/ui/Outcome'
import { Spinner } from '@/lab/ui/Spinner'
import { useDirector } from '@/lab/blocks/kit/director'
import { BrandMark } from '@/lab/blocks/kit/AppIcon'
import { DetentMark, ProductMark } from '@/lab/ui/DetentMark'
import { Orb } from '@/lab/ui/Orb'
import { Names, accentVars, useNames } from '@/lab/blocks/kit/props'
import type { BlockProps } from '@/lab/blocks/kit/props'

/**
 * Sign in: Google or GitHub in one press, or a code by email. Every state holds the same place and
 * crossfades, so nothing on the page moves between them. The code arrives the way it does on a
 * phone: a notification you can tap, and a suggestion under the field that fills it in. Then
 * you pick a workspace and you're in.
 *
 * Beside the form, what's waiting on the other side: its shape is there from the start, its words
 * redacted, and they come into focus row by row the moment you're in. Below 896px the form has
 * the window to itself.
 */

type Stage = 'start' | 'code' | 'workspace' | 'done'
const CODE = '482913'
const EMAIL = 'maya@harbor.dev'
export type Workspace = { id: string; name: string; note: string; /** The tile's hue, 0–360. */ hue?: number }
export type Provider = 'google' | 'github'
const SPACES: Workspace[] = [
  { id: 'harbor', name: 'Harbor', note: '24 members · Admin', hue: 250 },
  { id: 'fieldwork', name: 'Fieldwork', note: '8 members · Member', hue: 150 },
]
/** Something that happened while you were away. A person's orb, or the agent's mark when `agent` is set. */
export type Waiting = { id: string; who: string; hue?: number; agent?: boolean; title: string; note: string; when: string }
const WAITING: Waiting[] = [
  { id: 'eval', who: 'Detent', agent: true, title: 'Detent finished the refund eval', note: 'v13 passes 70% · 2 regressions to decide', when: '2h' },
  { id: 'review', who: 'Priya Raman', hue: 160, title: 'Priya asked for your review', note: '#1291 · Batch inventory lookups', when: '5h' },
  { id: 'drafts', who: 'Detent', agent: true, title: 'Detent drafted 12 replies', note: 'Support inbox · ready for you to send', when: 'Yesterday' },
  { id: 'mention', who: 'Leo Okafor', hue: 28, title: 'Leo mentioned you', note: 'Launch checklist · “Can you sign off the copy?”', when: 'Mon' },
]
const COUNT = ['none', 'one', 'two', 'three', 'four', 'five']
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export type SignInProps = BlockProps & {
  /** The product being signed in to: the heading, the mark's label, the email and the consent sheet. */
  product?: string
  /** Which one-press providers to offer, in order. Email is always there. */
  providers?: Provider[]
  /** The workspaces to choose from once you're signed in. */
  workspaces?: Workspace[]
  /** What's waiting on the other side, beside the form and redacted until a person is in. An empty list gives the form the whole window. */
  waiting?: Waiting[]
  /** Called with the workspace a person picks. */
  onComplete?: (workspace: Workspace) => void
}

export function SignIn({ autoplay = true, accent, product = 'Detent', providers = ['google', 'github'], workspaces = SPACES, waiting = WAITING, onComplete, className = '' }: SignInProps) {
  const names = useMemo(() => ({ assistant: 'Detent', product }), [product])
  const done = useRef(onComplete)
  useLayoutEffect(() => {
    done.current = onComplete
  })
  // Whether a person has taken over: callbacks fire for people, never for the script.
  const handedRef = useRef(!autoplay)
  const [stage, setStage] = useState<Stage>('start')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'ask' | 'going' | null>(null)
  const [mail, setMail] = useState(false)
  const [picking, setPicking] = useState<string | null>(null)
  const [doneAt, setDoneAt] = useState<number | null>(null)
  const [run, setRun] = useState(0)
  const code = useRef<CodeHandle>(null)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const later = (ms: number, f: () => void) => setTimeout(() => alive.current && f(), ms)

  const reset = () => {
    setStage('start')
    setEmail('')
    setSending(false)
    setError(null)
    setSheet(null)
    setMail(false)
    setPicking(null)
    setDoneAt(null)
    setRun((r) => r + 1)
  }

  const sendCode = (value = email) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return setError('Enter a work email, like you@company.com')
    setError(null)
    setSending(true)
    later(700, () => {
      setSending(false)
      setStage('code')
      // The code arrives a moment later, as mail does.
      later(1100, () => setMail(true))
    })
  }

  // GitHub asks before it shares anything: the consent sheet, then back to Detent.
  const github = () => {
    tap()
    setSheet('ask')
  }
  const authorize = () => {
    tap()
    setSheet('going')
    later(900, () => {
      setSheet(null)
      setStage('workspace')
    })
  }

  const pick = (id: string) => {
    tap()
    setPicking(id)
    const space = workspaces.find((s) => s.id === id)
    if (space && handedRef.current) done.current?.(space)
    later(900, () => {
      setStage('done')
      setDoneAt(Date.now())
    })
  }

  const director = useDirector(
    async (wait, pass) => {
      if (pass > 0) {
        reset()
        await wait(700)
      }
      await wait(1200)
      if (pass % 2 === 0 || !providers.includes('github')) {
        for (let i = 1; i <= EMAIL.length; i++) {
          setEmail(EMAIL.slice(0, i))
          await wait(EMAIL[i - 1] === '@' ? 140 : 42 + Math.random() * 30)
        }
        await wait(380)
        tap()
        sendCode(EMAIL)
        await wait(700 + 1100 + 1300)
        // Take the code from the suggestion, as you would on a phone.
        setMail(false)
        code.current?.type(CODE)
        await wait(2300)
        setStage('workspace')
      } else {
        github()
        await wait(1900)
        authorize()
        await wait(1100)
      }
      await wait(1300)
      if (workspaces[0]) pick(workspaces[0].id)
      await wait(900 + 3200)
    },
    autoplay,
    () => {
      handedRef.current = true
    },
  )

  return (
    <Names.Provider value={names}>
      <div className={`pro-app @container relative flex h-full w-full overflow-hidden bg-surface text-ink ${className}`} style={accentVars(accent)} onPointerDownCapture={director.onPointerDownCapture} onKeyDownCapture={director.onKeyDownCapture}>
        <div className="relative min-w-0 flex-1">
          {/* The mark sits in the corner as far in as the panel on the right: its top on the panel's top edge. */}
          <div className="absolute left-5 top-5 flex items-center gap-2 @4xl:left-3 @4xl:top-3">
            <Mark />
            <span className="text-headline">{product}</span>
          </div>

          {/* Every stage holds the same place and crossfades: nothing moves between them. */}
          <AnimatePresence initial={false}>
            <motion.div
              key={`${stage}-${run}`}
              className="absolute inset-0 flex items-center justify-center px-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.out, delay: 0.08 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.18, ease: ease.exit } }}
            >
              <div className="w-full max-w-[360px]">
                {stage === 'start' && <Start email={email} setEmail={(v) => (setEmail(v), setError(null))} error={error} sending={sending} providers={providers} onGitHub={github} onEmail={() => (tap(), sendCode())} />}
                {stage === 'code' && <Code email={email || EMAIL} codeRef={code} onBack={reset} onVerified={() => later(900, () => setStage('workspace'))} suggest={mail} />}
                {stage === 'workspace' && <Workspaces spaces={workspaces} picking={picking} onPick={pick} />}
                {stage === 'done' && <Done at={doneAt} name={workspaces.find((s) => s.id === picking)?.name} />}
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="absolute inset-x-0 bottom-5 text-center text-caption text-ink-3">
            By continuing you agree to the <span className="text-[var(--accent-ink)] underline decoration-[color-mix(in_oklch,var(--accent)_35%,transparent)] underline-offset-2">Terms</span> and{' '}
            <span className="text-[var(--accent-ink)] underline decoration-[color-mix(in_oklch,var(--accent)_35%,transparent)] underline-offset-2">Privacy Policy</span>.
          </p>
        </div>

        {waiting.length > 0 && <Away items={waiting} stage={stage} email={email || EMAIL} space={workspaces.find((s) => s.id === picking) ?? workspaces[0]} />}

        <AnimatePresence>{mail && stage === 'code' && <MailToast onOpen={() => (setMail(false), code.current?.type(CODE))} />}</AnimatePresence>
        <AnimatePresence>{sheet && <OAuthSheet going={sheet === 'going'} onAuthorize={authorize} onCancel={() => setSheet(null)} />}</AnimatePresence>
      </div>
    </Names.Provider>
  )
}

/* ───────────────────────────── Stages ───────────────────────────── */

function Start({ email, setEmail, error, sending, providers, onGitHub, onEmail }: { email: string; setEmail: (v: string) => void; error: string | null; sending: boolean; providers: Provider[]; onGitHub: () => void; onEmail: () => void }) {
  const { product } = useNames()
  return (
    <div>
      <h2 className="text-large text-ink">Sign in to {product}</h2>
      <p className="mt-2 text-callout text-ink-3">Welcome back. Pick up where you left off.</p>
      {providers.length > 0 && (
        <>
          <div className="mt-8 grid gap-2">
            {providers.map((p) => (
              <motion.button
                key={p}
                type="button"
                whileTap={press}
                onClick={p === 'github' ? onGitHub : undefined}
                className="ring-focus flex h-11 w-full items-center justify-center gap-2.5 rounded-[9px] lit bg-[color-mix(in_oklch,var(--ink)_5.5%,transparent)] hover:bg-[color-mix(in_oklch,var(--ink)_9%,transparent)] text-callout font-medium text-ink transition-colors"
              >
                <BrandMark brand={p} size={17} />
                Continue with {p === 'github' ? 'GitHub' : 'Google'}
              </motion.button>
            ))}
          </div>
          <div className="my-5 flex items-center gap-3 text-caption text-ink-3">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      {providers.length === 0 && <div className="h-8" />}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onEmail()
        }}
        noValidate
      >
        <label className="text-footnote font-medium text-ink-2" htmlFor="signin-email">
          Work email
        </label>
        <input
          id="signin-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-invalid={!!error}
          aria-describedby="signin-hint"
          className={`mt-1.5 block h-11 w-full rounded-[9px] px-3.5 text-body text-ink outline-none transition-[background-color,box-shadow] placeholder:text-ink-3 ${error ? 'bg-plate shadow-field-error' : 'bg-[color-mix(in_oklch,var(--ink)_4.5%,transparent)] focus:bg-plate focus:shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_50%,transparent),0_0_0_4px_color-mix(in_oklch,var(--accent)_13%,transparent)]'}`}
        />
        {/* One line held for the hint or the error, so the button below never moves. */}
        <p id="signin-hint" aria-live="polite" className={`mt-1.5 h-[18px] text-caption ${error ? 'text-danger' : 'text-ink-3'}`}>
          {error ?? 'We’ll email you a 6-digit code.'}
        </p>
        <motion.button type="submit" whileTap={press} className="ring-focus mt-3 grid h-11 w-full items-center rounded-[9px] bg-ink text-callout font-medium text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.18)] transition-opacity hover:opacity-90">
          <span className={`col-start-1 row-start-1 transition-opacity ${sending ? 'opacity-0' : ''}`}>Continue with email</span>
          <span className={`col-start-1 row-start-1 flex justify-center transition-opacity ${sending ? '' : 'opacity-0'}`}>
            <Spinner size={16} />
          </span>
        </motion.button>
      </form>
      <button type="button" className="ring-focus mt-3 h-9 w-full rounded-[7px] text-footnote text-[var(--accent-ink)] hover:underline">
        Use single sign-on
      </button>
      <p className="mt-6 text-center text-footnote text-ink-3">
        New to {product}? <span className="font-medium text-[var(--accent-ink)]">Create a workspace</span>
      </p>
    </div>
  )
}

function Code({ email, codeRef, onBack, onVerified, suggest }: { email: string; codeRef: RefObject<CodeHandle | null>; onBack: () => void; onVerified: () => void; suggest: boolean }) {
  return (
    <div>
      <button type="button" onClick={onBack} className="ring-focus -ml-2 flex h-8 items-center gap-1.5 rounded-full px-2 text-footnote text-ink-2 hover:bg-surface-2 hover:text-ink">
        <ArrowLeft size={14} />
        Back
      </button>
      <span className="mt-5 flex size-11 items-center justify-center rounded-[10px] bg-surface text-ink-2 shadow-raised">
        <Mail size={19} />
      </span>
      <h2 className="mt-5 text-large text-ink">Check your email</h2>
      <p className="mb-6 mt-2 text-callout text-ink-3">
        Enter the code we sent to <span className="text-ink">{email}</span>
      </p>
      <CodeInput
        ref={codeRef}
        onVerify={async (c) => {
          await new Promise((r) => setTimeout(r, 900))
          return c === CODE
        }}
        onVerified={onVerified}
      />
      {/* The code from Mail, offered the way a phone offers it. Its row is always held. */}
      <div className="relative mt-4 h-8">
        <AnimatePresence initial={false}>
          {suggest ? (
            <motion.button
              key="suggest"
              type="button"
              whileTap={press}
              onClick={() => codeRef.current?.type(CODE)}
              className="ring-focus absolute left-0 top-0 flex h-8 items-center gap-2 rounded-full bg-surface-2 pl-2 pr-3 text-footnote text-ink"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <span className="flex size-5 items-center justify-center rounded-[6px] bg-[#3b82f6] text-white">
                <Mail size={11} />
              </span>
              From Mail <span className="tnum font-medium tracking-[0.08em]">{CODE}</span>
            </motion.button>
          ) : (
            <span key="none" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Workspaces({ spaces, picking, onPick }: { spaces: Workspace[]; picking: string | null; onPick: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-large text-ink">Choose a workspace</h2>
      <p className="mt-2 text-callout text-ink-3">{spaces.length === 1 ? 'You’re a member of one.' : `You’re a member of ${COUNT[spaces.length] ?? spaces.length}.`} You can switch any time.</p>
      <ul className="mt-7 flex flex-col gap-2">
        {spaces.map((s, i) => (
          <li key={s.id}>
            <motion.button
              type="button"
              whileTap={press}
              onClick={() => onPick(s.id)}
              disabled={!!picking}
              className={`ring-focus flex h-16 w-full items-center gap-3 rounded-[10px] px-3 text-left transition-colors ${picking === s.id ? 'bg-[color-mix(in_oklch,var(--ink)_9%,transparent)]' : 'lit bg-[color-mix(in_oklch,var(--ink)_5.5%,transparent)] hover:bg-[color-mix(in_oklch,var(--ink)_9%,transparent)]'}`}
            >
              <Orb seed={s.name} hue={s.hue ?? (250 + i * 100) % 360} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block text-callout font-medium text-ink">{s.name}</span>
                <span className="block text-caption text-ink-3">{s.note}</span>
              </span>
              <span className="flex size-6 items-center justify-center text-ink-3">{picking === s.id ? <Spinner size={15} /> : <ChevronDown size={14} className="-rotate-90" />}</span>
            </motion.button>
          </li>
        ))}
        <li>
          <button type="button" className="ring-focus flex h-12 w-full items-center gap-3 rounded-[10px] px-3 text-callout text-ink-2 hover:bg-surface-2 hover:text-ink">
            <span className="flex size-10 items-center justify-center rounded-[8px] shadow-[inset_0_0_0_1.5px_var(--line-strong)]">
              <Plus size={15} />
            </span>
            Create a workspace
          </button>
        </li>
      </ul>
    </div>
  )
}

function Done({ at, name }: { at: number | null; name?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="relative flex size-14 items-center justify-center rounded-full bg-ok text-white">
        <DrawnCheck size={22} delay={0.15} strokeWidth={2.6} />
        <Bloom k={at} radius={999} spread={14} delay={0.1} />
      </span>
      <h2 className="mt-6 text-large text-ink">You’re in</h2>
      <p className="mt-2 text-callout text-ink-3">Taking you to {name ?? 'your workspace'}…</p>
      <span className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-surface-2">
        <motion.span className="block h-full origin-left rounded-full bg-ink" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.4, ease: ease.inOut }} />
      </span>
    </div>
  )
}

/* ───────────────────────────── While you were away ───────────────────────────── */

/**
 * What's waiting on the other side of the form. Signed out, every row keeps its shape with its
 * words redacted; once you're in, they come into focus one after another. Each line's text and
 * its redaction share one cell, so revealing them moves nothing.
 */
function Away({ items, stage, email, space }: { items: Waiting[]; stage: Stage; email: string; space?: Workspace }) {
  const open = stage === 'workspace' || stage === 'done'
  const n = COUNT[items.length] ?? String(items.length)
  const lead = n[0].toUpperCase() + n.slice(1)
  const note = open ? `Signed in as ${email}` : stage === 'code' ? 'Checking it’s you…' : 'Hidden until you sign in'
  return (
    <aside aria-label="While you were away" className="hidden w-[46%] max-w-[600px] shrink-0 p-3 @4xl:flex">
      <div className="flex flex-1 items-center justify-center rounded-[18px] bg-card px-10">
        <div className="w-full max-w-[400px]">
          <p className="flex items-center gap-2 text-footnote text-ink-2">
            {space && <Orb seed={space.name} hue={space.hue ?? 250} size={18} />}
            {space?.name}
          </p>
          <div className="mt-4 grid">
            <Swap on={!open} className="text-title text-ink">
              {lead} {items.length === 1 ? 'thing is' : 'things are'} waiting for you
            </Swap>
            <Swap on={open} className="text-title text-ink">
              Here’s where you left off
            </Swap>
          </div>
          <p className="mt-1.5 text-callout text-ink-3">Your team kept going while you were away.</p>

          <ul className="mt-7 overflow-hidden rounded-[14px] bg-surface shadow-raised">
            {items.map((w, i) => (
              <li key={w.id} className={`flex h-[68px] items-center gap-3 px-4 ${i ? 'shadow-[inset_0_1px_0_var(--line)]' : ''}`}>
                <span className="relative shrink-0">
                  {w.agent ? <ProductMark name={w.who} size={32} round /> : <Orb seed={w.who} hue={w.hue} size={32} />}
                  <span className="absolute inset-0 rounded-full bg-surface-3 transition-opacity duration-500" style={{ opacity: open ? 0 : 1, transitionDelay: open ? `${i * 90}ms` : '0ms' }} />
                </span>
                <span className="min-w-0 flex-1">
                  <Redacted text={w.title} open={open} at={i} className="text-footnote font-medium text-ink" />
                  <Redacted text={w.note} open={open} at={i} className="text-caption text-ink-3" />
                </span>
                <span className="tnum shrink-0 self-start pt-[15px] text-caption text-ink-3">{w.when}</span>
              </li>
            ))}
          </ul>

          {/* One line, held for every state: what's hidden, then whose account it is. */}
          <p className="mt-4 grid h-5 text-caption text-ink-3">
            {(['Hidden until you sign in', 'Checking it’s you…', `Signed in as ${email}`] as const).map((t) => (
              <span key={t} aria-hidden={t !== note} className={`col-start-1 row-start-1 flex items-center gap-1.5 transition-opacity duration-300 ${t === note ? '' : 'opacity-0'}`}>
                {t.startsWith('Signed') ? <Check size={12} strokeWidth={2.6} className="text-ok" /> : <Lock size={12} />}
                <span className="truncate">{t}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </aside>
  )
}

/** Two texts in one cell: whichever is on shows. */
function Swap({ on, className, children }: { on: boolean; className: string; children: ReactNode }) {
  return (
    <span aria-hidden={!on} className={`col-start-1 row-start-1 transition-[opacity,translate] duration-500 ${on ? '' : 'translate-y-1 opacity-0'} ${className}`}>
      {children}
    </span>
  )
}

/** A line of text and its redaction in one cell, so the reveal never moves the row. */
function Redacted({ text, open, at, className }: { text: string; open: boolean; at: number; className: string }) {
  const delay = { transitionDelay: open ? `${120 + at * 90}ms` : '0ms' }
  return (
    <span className={`grid ${className}`}>
      <span aria-hidden={!open} className={`col-start-1 row-start-1 truncate transition-[opacity,filter] duration-500 ${open ? '' : 'opacity-0 blur-[3px]'}`} style={delay}>
        {text}
      </span>
      <span aria-hidden className={`col-start-1 row-start-1 flex items-center transition-opacity duration-500 ${open ? 'opacity-0' : ''}`} style={delay}>
        <span className="h-2 rounded-full bg-[color-mix(in_oklch,var(--ink)_9%,transparent)]" style={{ width: `min(100%, ${text.length * 0.9}ch)` }} />
      </span>
    </span>
  )
}

/* ───────────────────────────── System moments ───────────────────────────── */

/** The code arriving, as a notification at the top of the window. Tap it to fill the code. */
function MailToast({ onOpen }: { onOpen: () => void }) {
  const { product } = useNames()
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="absolute right-3 top-3 z-20 flex w-[min(320px,calc(100%-24px))] items-start gap-3 rounded-[12px] bg-surface p-3 text-left shadow-modal"
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.2, ease: ease.exit } }}
      transition={spring.soft}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] bg-[#3b82f6] text-white">
        <Mail size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between text-caption text-ink-3">
          <span>Mail</span>
          <span>now</span>
        </span>
        <span className="block text-footnote font-medium text-ink">Your {product} sign-in code</span>
        <span className="block text-footnote text-ink-2">
          Use <span className="tnum font-medium tracking-[0.06em] text-ink">{CODE}</span> to sign in. It expires in 10 minutes.
        </span>
      </span>
    </motion.button>
  )
}

/** GitHub's consent step, as GitHub shows it: who's asking, exactly what they'll see, and one green button. */
function OAuthSheet({ going, onAuthorize, onCancel }: { going: boolean; onAuthorize: () => void; onCancel: () => void }) {
  const { product } = useNames()
  const org = `${slug(product)}-labs`
  return (
    <>
      <motion.div className="absolute inset-0 z-30 bg-black/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
      <motion.div
        role="dialog"
        aria-label={`Authorize ${product} on GitHub`}
        className="absolute left-1/2 top-1/2 z-40 w-[340px] max-w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-surface shadow-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
        transition={spring.soft}
      >
        <div className="flex h-9 items-center justify-center gap-2 bg-[light-dark(#f6f8fa,#161b22)] text-footnote text-ink-2 shadow-[inset_0_-1px_0_var(--line)]">
          <BrandMark brand="github" size={14} />
          github.com
        </div>
        <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
          <div className="flex items-center gap-3">
            <Mark size={44} />
            <span className="flex gap-1 text-ink-3" aria-hidden>
              <span className="size-1 rounded-full bg-current" />
              <span className="size-1 rounded-full bg-current opacity-60" />
              <span className="size-1 rounded-full bg-current opacity-30" />
            </span>
            <span className="flex size-11 items-center justify-center rounded-full bg-[#181717] text-white">
              <BrandMark brand="github" size={24} />
            </span>
          </div>
          <p className="mt-4 text-headline text-ink">Authorize {product}</p>
          <p className="mt-1 text-footnote text-ink-3">
            {product} by {org} wants to access your account
          </p>
          <ul className="mt-4 w-full rounded-[9px] p-3 text-left text-footnote shadow-border">
            {[
              ['Personal user data', 'Email addresses (read-only)'],
              ['Organizations', 'Read your membership in harbor-labs'],
            ].map(([t, d], n) => (
              <li key={t} className={`flex gap-2.5 ${n ? 'mt-2.5' : ''}`}>
                <Check size={13} strokeWidth={2.6} className="mt-0.5 shrink-0 text-ink-3" />
                <span>
                  <span className="block font-medium text-ink">{t}</span>
                  <span className="block text-caption text-ink-3">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <motion.button type="button" whileTap={press} onClick={onAuthorize} className="ring-focus relative mt-5 flex h-9 w-full items-center justify-center rounded-[7px] bg-[#1f883d] text-callout font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]">
            <span className={`transition-opacity ${going ? 'opacity-0' : ''}`}>Authorize {org}</span>
            <span className={`absolute inset-0 flex items-center justify-center transition-opacity ${going ? '' : 'opacity-0'}`}>
              <Spinner size={15} />
            </span>
          </motion.button>
          <button type="button" onClick={onCancel} className="ring-focus mt-2 h-8 w-full rounded-[7px] text-footnote text-ink-2 hover:bg-surface-2">
            Cancel
          </button>
          <p className="mt-3 text-caption text-ink-3">Authorizing will redirect to {slug(product)}.app</p>
        </div>
      </motion.div>
    </>
  )
}

/* ───────────────────────────── Marks ───────────────────────────── */

function Mark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return <DetentMark size={size} className={className} />
}
