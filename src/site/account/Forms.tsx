'use client'

import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { createPortal, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { askForLink, deleteKey, makeKey, signInWith, type KeyState, type LinkState } from '@/app/account/actions'
import type { Provider } from '@/lib/account/auth'
import { safeNext, type Next } from '@/lib/account/next'
import { BrandMark } from '@/lab/blocks/kit/AppIcon'
import { ArrowLeft, ArrowRight, ArrowUpRight, Key, Mail, Plus, Terminal } from '@/lab/blocks/kit/icons'
import { Check, Copy } from '@/lab/icons'
import { ease } from '@/lab/lib/motion'
import { DetentMark } from '@/lab/ui/DetentMark'
import { Bloom, DrawnCheck } from '@/lab/ui/Outcome'
import { Spinner } from '@/lab/ui/Spinner'
import { BTN } from '@/site/shell/side'
import { Light } from './Light'
import { SMALL } from './Settings'

/*
 * Signing in and the account, set the way Apple sets its own: one quiet surface per step, type that
 * does the work, two quiet fields and one button, white plates for the other ways in, and
 * nothing that moves without a reason.
 */
const PRIMARY = 'ring-focus grid h-10 items-center rounded-[10px] bg-ink text-[14px] font-medium text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.18)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60'
const PLATE = `ring-focus relative grid h-10 w-full items-center rounded-[10px] ${BTN.plate} text-[14px] font-medium transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.98] disabled:opacity-70`
const QUIET = 'ring-focus flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-footnote text-ink-3 transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink)_7%,transparent)] hover:text-ink'
/* The field, compact the way Vercel and Stripe set theirs: a hairline, a label above, 16px on phones so iOS doesn't zoom in. */
const FIELD = 'block h-10 w-full rounded-[10px] px-3 text-[16px] text-ink outline-none transition-[box-shadow] duration-150 placeholder:text-ink-3 sm:text-[14px]'
const FIELD_IDLE = 'bg-surface shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ink)_28%,transparent)] focus:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_70%,transparent),0_0_0_3px_color-mix(in_oklch,var(--accent)_16%,transparent)]'
const FIELD_ERROR = 'bg-surface shadow-field-error'
const LABEL = 'mb-1.5 block text-[13px] font-medium text-ink-2'
const LINK = 'ring-focus rounded-[4px] text-[var(--accent-ink)] underline decoration-[color-mix(in_oklch,var(--accent)_35%,transparent)] underline-offset-2 hover:decoration-[var(--accent-ink)]'
const ACCENT_TILE = 'bg-[linear-gradient(180deg,color-mix(in_oklch,var(--accent),white_14%),var(--accent))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-8px_color-mix(in_oklch,var(--accent)_70%,transparent)]'

const Alert = ({ text }: { text?: string }) =>
  text ? (
    <p role="alert" className="mt-2 text-footnote leading-[1.5] text-[color-mix(in_oklch,var(--danger)_80%,var(--ink))]">
      {text}
    </p>
  ) : null

/** A label and a spinner in one cell, so a button keeps its size while it works. */
function Busy({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <>
      <span className={`col-start-1 row-start-1 flex items-center justify-center gap-2.5 transition-opacity duration-150 ${busy ? 'opacity-0' : ''}`}>{children}</span>
      <span aria-hidden={!busy} className={`col-start-1 row-start-1 flex justify-center transition-opacity duration-150 ${busy ? '' : 'opacity-0'}`}>
        <Spinner size={16} />
      </span>
    </>
  )
}

/** The heading every signed-out step starts with: the mark, then a title the size Apple would set it. */
export function AuthHead({ title, lead, mark = true }: { title: string; lead: ReactNode; mark?: boolean }) {
  return (
    <>
      {mark && <DetentMark size={34} className="mb-5" />}
      <h1 className="text-[22px] font-semibold leading-[28px] tracking-[-0.03em] text-ink">{title}</h1>
      <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-3">{lead}</p>
    </>
  )
}

/** One step giving way to the next in the same place: out, then in, never side by side. */
function Stage({ id, children }: { id: string; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: ease.out } }}
        exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.14, ease: ease.out } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* ───────────────────────── The card, over the light ───────────────────────── */

/** The plan someone is on their way to buy. */
export type Buying = { id: 'pro' | 'all'; name: string; price: number; line: string; features: string[] }

/**
 * Every signed-out step sits on one white card floating over Detent's midnight light, the way
 * Stripe and Clerk set theirs: the light is the brand moment, and the card stays plain. On the way
 * to buy, a slim strip above the card says what comes after.
 */
function Split({ plan, children }: { plan?: Buying; children: ReactNode }) {
  return (
    <div className="relative isolate -mx-5 grid min-h-[calc(100svh-72px)] place-items-center overflow-hidden px-4 pb-16 pt-10 sm:-mx-6 lg:mx-0 lg:mb-3 lg:rounded-[20px]">
      <Light />
      <div className="relative w-full max-w-[400px]">
        {plan && (
          <p className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] backdrop-blur-md">
            <span className="text-white/70">Next, checkout</span>
            <span className="text-white/40">·</span>
            <span className="font-medium">{plan.name}</span>
            <span className="tnum text-white/70">${plan.price}</span>
          </p>
        )}
        <div className="overflow-hidden rounded-[16px] bg-surface text-ink shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_28px_70px_-24px_rgb(2_6_40/0.7),0_10px_24px_-12px_rgb(2_6_40/0.4)]">{children}</div>
        <p className="mt-5 text-center text-[12px] text-white/65">Pro follows your email · You stay signed in for 30 days</p>
      </div>
    </div>
  )
}

/** The card's own padding, for what sits on it. */
const Body = ({ children }: { children: ReactNode }) => <div className="px-6 pb-7 pt-7 sm:px-8 sm:pt-8">{children}</div>

/** The grey band across the card's foot, for the one other way in. */
const Foot = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 bg-[color-mix(in_oklch,var(--ink)_3.5%,transparent)] px-6 py-3.5 text-[13px] text-ink-3 shadow-[inset_0_1px_0_var(--line)] sm:px-8">{children}</div>
)

/* ───────────────────────── The form ───────────────────────── */

const NAMES: Record<Provider, string> = { github: 'GitHub' }

/** How this browser signed in last time, on the way that was. */
const LastUsed = () => <span className="rounded-full bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-2 py-px text-[11px] font-medium leading-4 text-[var(--accent-ink)]">Last used</span>

function ProviderButton({ provider, last }: { provider: Provider; last: boolean }) {
  const status = useFormStatus()
  // Both buttons share the form, so only the one that was pressed shows it's on its way.
  const busy = status.pending && status.data?.get('provider') === provider
  return (
    <button type="submit" name="provider" value={provider} disabled={status.pending} className={PLATE}>
      <Busy busy={busy}>
        <BrandMark brand={provider} size={18} />
        Continue with {NAMES[provider]}
      </Busy>
      {last && !busy && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <LastUsed />
        </span>
      )}
    </button>
  )
}

/** Where the link landed, for the button that opens it there. */
const INBOXES: [RegExp, string, string][] = [
  [/@(gmail|googlemail)\.com$/, 'Gmail', 'https://mail.google.com/mail/u/0/#inbox'],
  [/@(outlook|hotmail|live|msn)\.[a-z.]+$/, 'Outlook', 'https://outlook.live.com/mail/0/'],
  [/@(icloud|me|mac)\.com$/, 'iCloud Mail', 'https://www.icloud.com/mail'],
  [/@(yahoo|ymail)\.[a-z.]+$/, 'Yahoo Mail', 'https://mail.yahoo.com'],
  [/@(proton\.me|protonmail\.com|pm\.me)$/, 'Proton Mail', 'https://mail.proton.me'],
]
const inboxOf = (email: string) => INBOXES.find(([re]) => re.test(email))

const WAIT = 30

/** The inbox step: where the link went, a way straight to that inbox, and a resend once a moment has passed. */
function Sent({ email, next, onBack }: { email: string; next: Next; onBack: () => void }) {
  const [again, resend, sending] = useActionState<LinkState, FormData>(askForLink, {})
  const [from, setFrom] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const reduce = useReducedMotion()
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, WAIT - Math.floor((now - from) / 1000))
  const inbox = inboxOf(email)
  return (
    <div role="status">
      <button type="button" onClick={onBack} className="ring-focus -ml-2.5 flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-footnote text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
        <ArrowLeft size={14} />
        Use a different email
      </button>
      <motion.span
        className={`relative mt-6 grid size-14 place-items-center rounded-[16px] ${ACCENT_TILE}`}
        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.05 }}
      >
        <Mail size={24} />
      </motion.span>
      <div className="mt-6">
        <AuthHead
          mark={false}
          title="Check your email"
          lead={
            <>
              We sent a sign-in link to <span className="text-ink">{email}</span>. It lasts 15 minutes and works once.
            </>
          }
        />
      </div>
      {inbox && (
        <a href={inbox[2]} target="_blank" rel="noopener noreferrer" className={`${PLATE} mt-8`}>
          <span className="flex items-center justify-center gap-1.5">
            Open {inbox[1]}
            <ArrowUpRight size={13} className="text-ink-3" />
          </span>
        </a>
      )}
      <form action={resend} onSubmit={() => setFrom(Date.now())} className={`${inbox ? 'mt-4' : 'mt-8'} flex flex-wrap items-center gap-x-1.5 text-footnote text-ink-3`}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        {again.error ? <span className="text-danger">{again.error}</span> : again.sent && !sending ? <span>Sent again.</span> : <span>Didn’t get it?</span>}
        <button type="submit" disabled={left > 0 || sending} className="ring-focus tnum rounded-[4px] font-medium text-[var(--accent-ink)] disabled:font-normal disabled:text-ink-3">
          {sending ? 'Sending…' : left > 0 ? `Resend in ${left}s` : 'Resend'}
        </button>
      </form>
      <p className="mt-2 text-footnote text-ink-3">Look in spam or promotions too.</p>
    </div>
  )
}

/**
 * The way in: GitHub where it's set up, or an email and then a link in the inbox. No password to
 * make or lose. `email` fills the field ahead of time, as when a buyer arrives back
 * from checkout; `error` is why GitHub came back without signing anyone in; `lastUsed`
 * marks the way this browser came in last time; `buying` is the plan someone's on their way to.
 */
export function SignIn({
  title,
  lead,
  email,
  providers = [],
  error,
  next = '/account',
  lastUsed,
  buying,
}: {
  title: string
  lead: ReactNode
  email?: string
  providers?: Provider[]
  error?: string
  next?: Next
  lastUsed?: string
  buying?: Buying
}) {
  const [state, action, pending] = useActionState<LinkState, FormData>(askForLink, {})
  // "Use a different email" sets aside this send; the next one shows its own inbox step.
  const [setAside, setSetAside] = useState<LinkState | null>(null)
  const sent = state.sent && state !== setAside ? state.sent : null
  const problem = state.error
  const typed = state.email ?? email
  return (
    <Split plan={buying}>
      <Stage id={sent ? 'sent' : 'start'}>
        {sent ? (
          <Body>
            <Sent email={sent} next={next} onBack={() => setSetAside(state)} />
          </Body>
        ) : (
          <div>
            <Body>
              <AuthHead title={title} lead={lead} />
              {providers.length > 0 && (
                <>
                  <form action={signInWith} className="mt-7 grid gap-2.5">
                    <input type="hidden" name="next" value={next} />
                    {providers.map((p) => (
                      <ProviderButton key={p} provider={p} last={lastUsed === p} />
                    ))}
                  </form>
                  <Alert text={error} />
                  <div aria-hidden className="my-5 flex items-center gap-3 text-[12px] text-ink-3">
                    <span className="h-px flex-1 bg-line" />
                    or
                    <span className="h-px flex-1 bg-line" />
                  </div>
                </>
              )}
              <form action={action} noValidate className={providers.length > 0 ? '' : 'mt-7'}>
                <input type="hidden" name="next" value={next} />
                <label htmlFor="email" className={LABEL}>
                  Email
                </label>
                <input
                  key={typed}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  defaultValue={typed}
                  placeholder="you@company.com"
                  aria-invalid={!!problem}
                  aria-describedby="sign-in-hint"
                  className={`${FIELD} ${problem ? FIELD_ERROR : FIELD_IDLE}`}
                />
                {/* One line held for the hint or the error, so nothing below moves. */}
                <p id="sign-in-hint" aria-live="polite" className={`mt-2 min-h-[18px] text-[12.5px] leading-[1.45] ${problem ? 'text-danger' : 'text-ink-3'}`}>
                  {problem ?? 'We’ll email you a link.'}
                </p>
                <button type="submit" disabled={pending} className={`${PRIMARY} relative mt-2 w-full`}>
                  <Busy busy={pending}>
                    Email me a sign-in link
                    <ArrowRight size={14} />
                  </Busy>
                  {lastUsed === 'magic-link' && !pending && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <LastUsed />
                    </span>
                  )}
                </button>
                <p className="mt-4 text-center text-[12px] text-ink-3">
                  By continuing you agree to the{' '}
                  <Link href="/terms" className={LINK}>
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className={LINK}>
                    Privacy policy
                  </Link>
                  .
                </p>
              </form>
            </Body>
            <Foot>
              New to Detent?
              <Link href="/pro" className="ring-focus rounded-[4px] font-medium text-ink hover:underline">
                See plans
              </Link>
            </Foot>
          </div>
        )}
      </Stage>
    </Split>
  )
}

type Emailed = { token: string; email: string; next: Next }

/**
 * The page a link opens. The token stays in the address's fragment, which never reaches a server
 * log, and is only spent when the button is pressed. A spent or expired link comes back here
 * from Better Auth with no fragment, and says so. `plans` lets the panel show the plan when the
 * link is on its way to a checkout.
 */
export function Confirm({ plans }: { plans: Buying[] }) {
  const [link, setLink] = useState<Emailed | null | undefined>(undefined)
  const [pending, setPending] = useState(false)
  // Read once and kept: the fragment is wiped from the address after, and React may run the effect twice.
  const read = useRef<Emailed | null | undefined>(undefined)
  useEffect(() => {
    if (read.current === undefined) {
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const token = fragment.get('token')
      read.current = token ? { token, email: fragment.get('email') ?? '', next: safeNext(fragment.get('next')) } : null
      if (token) window.history.replaceState(null, '', window.location.pathname)
    }
    // After hydration, since the server never sees the fragment.
    Promise.resolve(read.current).then(setLink)
  }, [])
  const buying = link ? plans.find((p) => link.next === `/checkout/${p.id}`) : undefined
  return (
    <Split plan={buying}>
      <Body>
      <Stage id={link === null ? 'expired' : 'confirm'}>
        {link === null ? (
          <div>
            <AuthHead title="That link has run out" lead="Sign-in links last 15 minutes and work once. Send yourself a new one and you’re back in a moment." />
            <Link href="/account" className={`${PRIMARY} mt-9 w-full justify-items-center`}>
              Send a new link
            </Link>
          </div>
        ) : (
          <div>
            <AuthHead
              title="Almost in"
              lead={
                link === undefined ? (
                  'Checking your link…'
                ) : (
                  <>
                    One press to finish signing in{link.email ? <> as <span className="text-ink">{link.email}</span></> : null}.
                  </>
                )
              }
            />
            {/* Better Auth's check, which signs in and sends the browser on to /account: a whole page load, so a plain link. */}
            <a
              href={link ? `/api/auth/magic-link/verify?${new URLSearchParams({ token: link.token, callbackURL: link.next, errorCallbackURL: '/account/confirm' })}` : undefined}
              onClick={() => setPending(true)}
              aria-disabled={!link || pending}
              className={`${PRIMARY} mt-9 w-full aria-disabled:pointer-events-none aria-disabled:opacity-70`}
            >
              <Busy busy={pending}>{buying ? 'Continue to checkout' : 'Continue to Detent'}</Busy>
            </a>
          </div>
        )}
      </Stage>
      </Body>
    </Split>
  )
}

/* ───────────────────────── The account ───────────────────────── */

/** Copies, then says so for a moment. */
export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  return (
    <button type="button" onClick={copy} aria-label={copied ? 'Copied' : label} className="ring-focus grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-3 transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink)_7%,transparent)] hover:text-ink">
      <span className="col-start-1 row-start-1 transition-opacity duration-150" style={{ opacity: copied ? 0 : 1 }}>
        <Copy size={14} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />
      </span>
      <span className="col-start-1 row-start-1 text-ok transition-opacity duration-150" style={{ opacity: copied ? 1 : 0 }}>
        <Check size={14} strokeWidth={2.6} />
      </span>
    </button>
  )
}

/** A file or a command to copy, the way a code sample sits in Apple's docs: its name, then its lines. */
export function Snippet({ file, code }: { file?: string; code: string }) {
  const text = code.trimEnd()
  return (
    <div className="overflow-hidden rounded-[10px] bg-surface shadow-[0_0_0_1px_var(--line)]">
      <div className="flex h-9 items-center justify-between gap-3 pl-3.5 pr-1 shadow-[inset_0_-1px_0_var(--line)]">
        <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-caption text-ink-3">
          {!file && <Terminal size={12} className="shrink-0" />}
          {file ?? 'Terminal'}
        </span>
        <CopyButton value={text} label={`Copy ${file ?? 'the command'}`} />
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-ink-2 [scrollbar-width:thin]" translate="no">
        {text}
      </pre>
    </div>
  )
}

function RemoveNow() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="ring-focus grid h-8 items-center rounded-[8px] bg-danger px-3 text-footnote font-medium text-white transition-opacity duration-150 hover:opacity-90">
      <Busy busy={pending}>Remove</Busy>
    </button>
  )
}

/** Removing a key asks once, in place: Cancel, or Remove in red. Anything installing with it stops working. */
export function RemoveKey({ id, name }: { id: string; name: string }) {
  const [asking, setAsking] = useState(false)
  if (!asking)
    return (
      <button type="button" onClick={() => setAsking(true)} aria-label={`Remove ${name}`} className={QUIET}>
        Remove
      </button>
    )
  return (
    <form action={deleteKey} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button type="button" onClick={() => setAsking(false)} className={QUIET} autoFocus>
        Cancel
      </button>
      <RemoveNow />
    </form>
  )
}

const ROW_FOCUS = 'outline-none focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_oklch,var(--accent)_60%,transparent)]'
const onClient = () => true
const onServer = () => false
const never = () => () => {}

/**
 * Making a key, in a sheet: name it, create it, then the key itself with a large Copy, shown this
 * once because only its hash is kept. From the bottom on a phone, in the middle on a laptop.
 */
/** `compact` makes the trigger a small button for a settings card's foot rather than a row. */
export function KeySheet({ count, max, compact = false }: { count: number; max: number; compact?: boolean }) {
  const full = count >= max
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<KeyState, FormData>(makeKey, {})
  // What the last opening started from, so each opening shows only what it made.
  const [base, setBase] = useState<KeyState>(state)
  const made = state !== base ? state.secret : undefined
  const error = state !== base ? state.error : undefined
  const mounted = useSyncExternalStore(never, onClient, onServer)
  const reduce = useReducedMotion()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const nameId = useId()

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      } else if (e.key === 'Tab' && panel.current) {
        // Focus stays inside the sheet while it's up.
        const all = [...panel.current.querySelectorAll<HTMLElement>('button, input, a[href]')].filter((el) => !el.hasAttribute('disabled'))
        const [firstEl, lastEl] = [all[0], all[all.length - 1]]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl?.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl?.focus()
        }
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      root.style.overflow = overflow
      document.removeEventListener('keydown', key)
    }
  }, [open])
  // The sheet's first thing to do takes focus: the name, then the Copy.
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [open, made])

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setBase(state)
          setOpen(true)
        }}
        disabled={full}
        className={compact ? SMALL : `flex min-h-[56px] w-full items-center gap-3.5 px-4 text-left text-callout font-medium text-[var(--accent-ink)] transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink)_3%,transparent)] disabled:cursor-default disabled:font-normal disabled:text-ink-3 disabled:hover:bg-transparent ${ROW_FOCUS}`}
      >
        {compact ? (
          <>
            <Plus size={13} />
            Create key
          </>
        ) : (
          <>
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[8px] bg-[color-mix(in_oklch,var(--accent)_13%,transparent)]">
              <Plus size={15} />
            </span>
            {full ? `You have ${max} keys. Remove one to make another.` : count ? 'Create another key' : 'Create your first key'}
          </>
        )}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.18 } }}>
                <div aria-hidden className="absolute inset-0 bg-black/35 backdrop-blur-[3px]" onClick={close} />
                <motion.div
                  ref={panel}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="relative w-full max-w-[420px] rounded-t-[26px] bg-surface p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45),0_0_0_1px_var(--line)] sm:m-6 sm:rounded-[22px] sm:p-7"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.16 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                >
                  {made ? (
                    <div role="status">
                      <span className="relative grid size-12 place-items-center rounded-full bg-ok text-white">
                        <DrawnCheck size={22} delay={0.12} strokeWidth={2.6} />
                        <Bloom k={made} radius={999} spread={12} delay={0.08} />
                      </span>
                      <h2 id={titleId} className="mt-5 text-title text-ink">
                        Your new key
                      </h2>
                      <p className="mt-1.5 text-callout leading-[1.55] text-ink-3">This is the only time it’s shown. Put it in .env.local as DETENT_PRO_KEY.</p>
                      <code className="mt-6 block break-all rounded-[12px] bg-[color-mix(in_oklch,var(--ink)_4.5%,transparent)] px-4 py-3.5 font-mono text-footnote leading-[1.6] text-ink" translate="no">
                        {made}
                      </code>
                      <div className="mt-6 grid grid-cols-2 gap-2.5">
                        <CopyBig value={made} />
                        <button type="button" onClick={close} className={PLATE}>
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form action={action}>
                      <span className={`grid size-12 place-items-center rounded-[14px] ${ACCENT_TILE}`}>
                        <Key size={20} />
                      </span>
                      <h2 id={titleId} className="mt-5 text-title text-ink">
                        New API key
                      </h2>
                      <p className="mt-1.5 text-callout leading-[1.55] text-ink-3">Name it after where it’ll live, so you know which one to remove later.</p>
                      <div className="mt-6">
                        <label htmlFor={nameId} className={LABEL}>
                          Name
                        </label>
                        <input id={nameId} name="name" maxLength={40} autoComplete="off" spellCheck={false} placeholder="MacBook, or CI" data-autofocus className={`${FIELD} ${error ? FIELD_ERROR : FIELD_IDLE}`} />
                      </div>
                      <Alert text={error} />
                      <div className="mt-6 grid grid-cols-2 gap-2.5">
                        <button type="button" onClick={close} className={PLATE}>
                          Cancel
                        </button>
                        <button type="submit" disabled={pending} className={PRIMARY}>
                          <Busy busy={pending}>Create key</Busy>
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}

/** The sheet's Copy: the main thing to do once the key is made. */
function CopyBig({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      data-autofocus
      onClick={() =>
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        })
      }
      className={PRIMARY}
    >
      <span className="flex items-center justify-center gap-2">
        {copied ? <Check size={15} strokeWidth={2.6} /> : <Copy size={15} style={{ ['--icon-cutout' as string]: 'var(--ink)' }} />}
        {copied ? 'Copied' : 'Copy key'}
      </span>
    </button>
  )
}

/** Just paid, and the store's note hasn't landed: look again every few seconds for half a minute. */
export function Arriving() {
  const router = useRouter()
  useEffect(() => {
    let tries = 0
    const timer = setInterval(() => (++tries > 10 ? clearInterval(timer) : router.refresh()), 3000)
    return () => clearInterval(timer)
  }, [router])
  return <Spinner size={18} />
}
