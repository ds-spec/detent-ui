'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Close, Mail, Shield } from '@/lab/icons'
import { PLANS, PRO_BLOCK_COUNT } from '@/catalog/pro'
import { ENTRIES } from '@/catalog/meta'
import { usePromo, priceWith } from './Promo'
import { useMe } from './UserMenu'
import { track } from './track'

/* Before checkout, a signed-out buyer says which email Pro goes on. Checkout then uses that address and
   can't change it, so the payment and the account are the same email from the start. Without this a buyer
   could pay with one address and sign in with another, see no Pro, and pay again. Signed-in buyers skip it:
   checkout already uses their account. The email is posted, never put in a URL, so analytics never sees it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'icloud.co': 'icloud.com', 'iclod.com': 'icloud.com', 'protonmail.co': 'protonmail.com',
}
const fixOf = (value: string) => {
  const at = value.lastIndexOf('@')
  if (at < 1) return null
  const right = TYPOS[value.slice(at + 1).toLowerCase()]
  return right ? `${value.slice(0, at)}@${right}` : null
}

const NOTCH = 'radial-gradient(circle 9px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 9px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat'

function Mark() {
  return (
    <svg aria-hidden width={40} height={40} viewBox="0 0 24 24" className="shrink-0 drop-shadow-[0_6px_14px_rgb(0_0_0/0.18)]">
      <rect width="24" height="24" rx="6.5" fill="var(--ink)" />
      <g transform="translate(12 12) scale(0.56) translate(-12 -12)" fill="var(--surface)">
        <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" />
        <path d="M11.25 3a9 9 0 0 1 0 18z" />
      </g>
    </svg>
  )
}

export function BuyGate() {
  const me = useMe()
  const reduce = useReducedMotion()
  const promo = usePromo()
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
    const t = window.setTimeout(() => field.current?.focus({ preventScroll: true }), 80)
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

  const plan = PLANS.find((p) => href?.startsWith(p.href)) ?? PLANS[0]!
  const now = priceWith(promo, plan.price)
  const cut = now < plan.price
  const fix = fixOf(email.trim())
  const ok = EMAIL.test(email.trim())
  const gets = [`All ${ENTRIES.length} components`, `${PRO_BLOCK_COUNT} blocks, whole screens ready to use`, 'Every template, and every update for life']

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {href && (
        <motion.div key="gate" className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <button type="button" aria-label="Close" tabIndex={-1} onClick={() => setHref(null)} className="absolute inset-0 cursor-default bg-[rgb(8_8_10/0.42)] backdrop-blur-[6px]" />
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
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', bounce: 0, duration: 0.42 }}
            className="relative w-full max-w-[440px] drop-shadow-[0_40px_60px_rgb(0_0_0/0.28)]"
          >
            <div className="relative rounded-t-[26px] bg-surface-2 px-6 pb-7 pt-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:px-7 sm:pt-7" style={{ WebkitMask: NOTCH, mask: NOTCH, maskPosition: 'left top, right top', WebkitMaskPosition: 'left top, right top', maskSize: '51% 200%', WebkitMaskSize: '51% 200%' }}>
              <span aria-hidden className="mx-auto -mt-2 mb-4 block h-1 w-9 rounded-full bg-[var(--line-strong)] sm:hidden" />
              <button type="button" aria-label="Close" onClick={() => setHref(null)} className="ring-focus absolute right-4 top-4 grid size-8 place-items-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-[var(--line)] hover:text-ink pointer-coarse:size-10 max-sm:top-5">
                <Close size={14} />
              </button>
              <div className="flex items-center gap-3.5 pr-10">
                <Mark />
                <div className="min-w-0">
                  <p className="text-[15px] font-medium leading-5 tracking-[-0.01em] text-ink">Detent {plan.name}</p>
                  <p className="mt-0.5 text-[13px] leading-[18px] text-ink-3">One payment · yours for life</p>
                </div>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <p className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-[40px] font-normal leading-none tracking-[-0.045em] text-ink">${now}</span>
                  {cut && <s className="text-[17px] leading-none tracking-[-0.02em] text-ink-3 decoration-[color-mix(in_oklch,var(--ink-3)_70%,transparent)]">${plan.price}</s>}
                </p>
                {cut && promo && (
                  <span className="mb-1 inline-flex h-6 shrink-0 items-center rounded-full bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-2.5 text-[12px] font-medium text-[color-mix(in_oklch,var(--accent)_82%,var(--ink))]">
                    {promo.name}
                    {promo.until ? ` · until ${promo.until}` : ''}
                  </span>
                )}
              </div>
              <ul className="mt-5 grid gap-2">
                {gets.map((g) => (
                  <li key={g} className="flex items-center gap-2.5 text-[13.5px] leading-5 text-ink-2">
                    <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-full bg-ink text-surface">
                      <Check size={9} strokeWidth={2.6} />
                    </span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative bg-surface px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 sm:rounded-b-[26px] sm:px-7 sm:pb-7" style={{ WebkitMask: NOTCH, mask: NOTCH, maskPosition: 'left bottom, right bottom', WebkitMaskPosition: 'left bottom, right bottom', maskSize: '51% 200%', WebkitMaskSize: '51% 200%' }}>
              <span aria-hidden className="absolute inset-x-[22px] top-0 h-px bg-[repeating-linear-gradient(90deg,var(--line-strong)_0_6px,transparent_6px_11px)]" />
              <h2 id={title} className="text-[17px] font-medium leading-6 tracking-[-0.02em] text-ink">
                Where should Pro go?
              </h2>
              <p className="mt-1 text-[13.5px] leading-5 text-ink-3">Use the email you&apos;ll sign in with. Your licence, receipt and sign-in link go there.</p>

              <label htmlFor={`${title}-email`} className="sr-only">
                Email
              </label>
              <div className={`group/field relative mt-4 rounded-[13px] bg-surface transition-[box-shadow] duration-150 ${wrong ? 'shadow-field-error' : 'shadow-[inset_0_0_0_1px_var(--line-strong)] focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_70%,transparent),0_0_0_4px_color-mix(in_oklch,var(--accent)_14%,transparent)]'}`}>
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 transition-colors duration-150 group-focus-within/field:text-ink-2" />
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
                  aria-describedby={`${title}-hint`}
                  className="block h-12 w-full rounded-[13px] bg-transparent pl-10 pr-10 text-[16px] text-ink outline-none placeholder:text-ink-3 sm:text-[15px]"
                />
                <span aria-hidden className={`absolute right-3.5 top-1/2 grid size-[18px] -translate-y-1/2 place-items-center rounded-full bg-[#22a35a] text-white transition-[opacity,transform] duration-200 ${ok && !fix ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  <Check size={10} strokeWidth={2.8} />
                </span>
              </div>
              <p id={`${title}-hint`} role={wrong ? 'alert' : undefined} className={`mt-2 min-h-[20px] text-[13px] leading-5 ${wrong ? 'text-[color-mix(in_oklch,var(--danger)_80%,var(--ink))]' : 'text-ink-3'}`}>
                {wrong ? (
                  'That doesn’t look like an email yet.'
                ) : fix ? (
                  <>
                    Did you mean{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(fix)
                        field.current?.focus()
                      }}
                      className="ring-focus rounded-[4px] font-medium text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink"
                    >
                      {fix}
                    </button>
                    ?
                  </>
                ) : (
                  'No account needed. You can sign in later with this email.'
                )}
              </p>

              <button
                type="submit"
                disabled={sending}
                className="ring-focus group/go mt-3 flex h-12 w-full items-center justify-between rounded-[13px] bg-ink pl-5 pr-4 text-[15px] font-medium text-surface shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_8px_20px_-10px_rgb(0_0_0/0.5)] transition-[opacity,transform] duration-150 hover:opacity-[0.92] active:scale-[0.985] disabled:opacity-70"
              >
                <span>{sending ? 'Opening secure checkout…' : 'Continue to payment'}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="text-surface/70">${now}</span>
                  {sending ? (
                    <span aria-hidden className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
                  ) : (
                    <ArrowRight size={14} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
                  )}
                </span>
              </button>

              <div className="mt-5 flex items-center justify-between gap-3 text-[12.5px] leading-[18px] text-ink-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Shield size={13} className="shrink-0" />
                  <span className="truncate">Secure payment by Dodo</span>
                </span>
                <Link href="/account" onClick={() => setHref(null)} className="ring-focus shrink-0 rounded-[4px] text-ink-2 transition-colors duration-150 hover:text-ink">
                  Have Pro? Sign in
                </Link>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
