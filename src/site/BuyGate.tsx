'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@/lab/icons'
import { useMe } from './UserMenu'
import { track } from './track'

/* Before checkout, a signed-out buyer says which email Pro goes on. Checkout then uses that address and
   can't change it, so the payment and the account are the same email from the start. Without this a buyer
   could pay with one address and sign in with another, see no Pro, and pay again. Signed-in buyers skip it:
   checkout already uses their account. The email is posted, never put in a URL, so analytics never sees it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function BuyGate() {
  const me = useMe()
  const reduce = useReducedMotion()
  const [href, setHref] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [wrong, setWrong] = useState(false)
  const [sending, setSending] = useState(false)
  const field = useRef<HTMLInputElement>(null)
  const title = useId()

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.('a[href^="/checkout/"]')
      if (!link || me) return
      e.preventDefault()
      setHref(link.getAttribute('href'))
      setWrong(false)
      setSending(false)
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [me])

  useEffect(() => {
    if (!href) return
    const t = window.setTimeout(() => field.current?.focus(), 60)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setHref(null)
    addEventListener('keydown', esc)
    const lock = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      removeEventListener('keydown', esc)
      document.documentElement.style.overflow = lock
    }
  }, [href])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {href && (
        <motion.div key="gate" className="fixed inset-0 z-[80] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button type="button" aria-label="Close" tabIndex={-1} onClick={() => setHref(null)} className="absolute inset-0 cursor-default bg-[rgb(0_0_0/0.35)] backdrop-blur-[2px]" />
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby={title}
            method="post"
            action={href}
            noValidate
            onSubmit={(e) => {
              const value = email.trim()
              if (!EMAIL.test(value)) {
                e.preventDefault()
                setWrong(true)
                field.current?.focus()
                return
              }
              setSending(true)
              track('checkout_email', { page: location.pathname })
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
            className="relative w-[420px] max-w-full rounded-[22px] bg-surface p-6 shadow-[var(--card-edge),0_32px_80px_-24px_rgb(0_0_0/0.45)] sm:p-7"
          >
            <h2 id={title} className="text-[22px] font-normal leading-[1.15] tracking-[-0.03em] text-ink">
              Where should Pro go?
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-ink-3">Pro is tied to this email. Use the one you&apos;ll sign in with, on any computer.</p>

            <label htmlFor={`${title}-email`} className="mt-6 mb-1.5 block text-[13px] font-medium text-ink-2">
              Email
            </label>
            <input
              ref={field}
              id={`${title}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setWrong(false)
              }}
              placeholder="you@company.com"
              aria-invalid={wrong}
              aria-describedby={wrong ? `${title}-wrong` : undefined}
              className={`block h-11 w-full rounded-[11px] bg-surface px-3.5 text-[16px] text-ink outline-none transition-[box-shadow] duration-150 placeholder:text-ink-3 sm:text-[15px] ${wrong ? 'shadow-field-error' : 'shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_70%,transparent),0_0_0_3px_color-mix(in_oklch,var(--accent)_16%,transparent)]'}`}
            />
            <p id={`${title}-wrong`} role={wrong ? 'alert' : undefined} className={`mt-2 min-h-[20px] text-[13px] leading-[1.5] ${wrong ? 'text-[color-mix(in_oklch,var(--danger)_80%,var(--ink))]' : 'text-ink-3'}`}>
              {wrong ? 'That doesn’t look like an email yet.' : 'Your receipt and sign-in link go here too.'}
            </p>

            <button
              type="submit"
              disabled={sending}
              className="ring-focus group/go mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-ink text-[15px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {sending ? 'Opening checkout…' : 'Continue to checkout'}
              {!sending && <ArrowRight size={14} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />}
            </button>

            <p className="mt-5 text-center text-[13px] text-ink-3">
              Already have Pro?{' '}
              <Link href="/account" onClick={() => setHref(null)} className="ring-focus rounded-[4px] text-ink-2 underline decoration-[var(--line-strong)] underline-offset-[3px] transition-colors duration-150 hover:text-ink hover:decoration-ink">
                Sign in
              </Link>
            </p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
