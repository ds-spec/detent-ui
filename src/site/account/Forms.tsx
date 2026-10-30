'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { askForLink, confirmLink, inviteSeat, makeKey, peekLink, type KeyState, type LinkState, type SeatState } from '@/app/account/actions'
import { Check, Copy } from '@/lab/icons'

const FIELD = 'ring-focus h-10 min-w-0 flex-1 rounded-[10px] bg-surface-2 px-3 text-callout text-ink placeholder:text-ink-3'
const BUTTON = 'ring-focus flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-ink px-4 text-callout font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-60'

const Alert = ({ text }: { text?: string }) =>
  text ? (
    <p role="alert" className="mt-2 text-footnote leading-[1.5] text-[color-mix(in_oklch,var(--danger)_80%,var(--ink))]">
      {text}
    </p>
  ) : null

/** The way in: an email address, then a link in the inbox. No password to make or lose. */
export function SignIn() {
  const [state, action, pending] = useActionState<LinkState, FormData>(askForLink, {})
  if (state.sent)
    return (
      <div className="mt-8" role="status">
        <p className="text-headline text-ink">Check your inbox</p>
        <p className="mt-1 text-callout leading-[1.6] text-ink-3">
          We sent a sign-in link to <span className="text-ink">{state.sent}</span>. It lasts 15 minutes.
        </p>
      </div>
    )
  return (
    <form action={action} className="mt-8">
      <label htmlFor="email" className="text-footnote text-ink-3">
        Email
      </label>
      <div className="mt-2 flex gap-2">
        <input key={state.email} id="email" name="email" type="email" required autoComplete="email" defaultValue={state.email} placeholder="you@company.com" className={FIELD} />
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? 'Sending…' : 'Email me a link'}
        </button>
      </div>
      <Alert text={state.error} />
      <p className="mt-3 text-footnote leading-[1.55] text-ink-3">Bought Pro? Use the address on your receipt.</p>
    </form>
  )
}

/** The page a link opens. The token stays in the address's fragment, which never reaches a server log. */
export function Confirm() {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(confirmLink, {})
  useEffect(() => {
    const value = window.location.hash.slice(1)
    window.history.replaceState(null, '', window.location.pathname)
    Promise.resolve(value ? peekLink(value) : null).then(
      (found) => {
        setToken(value)
        setEmail(found)
      },
      () => setEmail(null),
    )
  }, [])
  if (email === undefined) return <p className="mt-8 text-callout text-ink-3">Checking your link…</p>
  if (!email || state.error)
    return (
      <div className="mt-8">
        <p className="text-callout text-ink-3">This link has run out or was already used.</p>
        <Link href="/account" className="ring-focus mt-4 inline-flex rounded-[4px] text-callout text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
          Send a new one
        </Link>
      </div>
    )
  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={pending} className={`${BUTTON} w-full max-w-[320px]`}>
        {pending ? 'Signing in…' : `Sign in as ${email}`}
      </button>
    </form>
  )
}

function CopyKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  return (
    <button type="button" onClick={copy} aria-label={copied ? 'Copied' : 'Copy key'} className="ring-focus grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
      {copied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
    </button>
  )
}

/** Naming and making a key. The new key shows here once, because only its hash is kept. */
export function NewKey() {
  const [state, action, pending] = useActionState<KeyState, FormData>(makeKey, {})
  return (
    <div>
      {state.secret && (
        <div className="mb-4 rounded-[14px] p-4 shadow-[inset_0_0_0_1px_var(--line-strong)]" role="status">
          <p className="text-headline text-ink">Copy your key now</p>
          <p className="mt-1 text-footnote leading-[1.55] text-ink-3">You won’t see it again. Put it in .env.local as DETENT_PRO_KEY.</p>
          <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-surface-2 py-1 pl-3 pr-1">
            <code className="min-w-0 flex-1 truncate font-mono text-footnote text-ink">{state.secret}</code>
            <CopyKey value={state.secret} />
          </div>
        </div>
      )}
      <form action={action} className="flex gap-2">
        <input name="name" aria-label="Key name" maxLength={40} autoComplete="off" placeholder="Name it: laptop, CI…" className={FIELD} />
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? 'Making…' : 'Generate key'}
        </button>
      </form>
      <Alert text={state.error} />
    </div>
  )
}

export function NewSeat() {
  const [state, action, pending] = useActionState<SeatState, FormData>(inviteSeat, {})
  return (
    <div>
      <form action={action} className="flex gap-2">
        <input name="email" type="email" required aria-label="Their email" placeholder="them@company.com" className={FIELD} />
        <button type="submit" disabled={pending} className={BUTTON}>
          Add
        </button>
      </form>
      <Alert text={state.error} />
    </div>
  )
}
