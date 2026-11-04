'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { signOutHere } from '@/app/account/actions'
import { Bolt, ChevronDown, Key, LogOut, Person, Terminal } from '@/lab/blocks/kit/icons'
import { Orb } from '@/lab/ui/Orb'
import { Spinner } from '@/lab/ui/Spinner'
import { ProBadge } from './account/ProBadge'

/*
 * Who's signed in, in the header: their picture and name where Sign in and Get started were, and a
 * menu for the account. Whether anyone is signed in is known before the first paint (the root
 * layout marks <html data-in> from the hint cookie), so the bar never shows the wrong one; who it
 * is comes from /api/account/me once per tab.
 */

export type Me = { name: string; email: string; image: string | null; plan: 'pro' | 'all' | null }

/**
 * Who's signed in, asked once per tab. Null only when the server says nobody is (401); a request
 * that never got an answer (offline, or cut off by leaving the page) is undefined, unknown, and
 * asked again next time, so a quick click away never signs anyone out of the bar.
 */
let asked: Promise<Me | null | undefined> | null = null
const ask = () =>
  (asked ??= fetch('/api/account/me', { cache: 'no-store' }).then(
    (r) => (r.status === 401 ? null : r.ok ? (r.json() as Promise<Me>) : undefined),
    () => undefined,
  ).then((found) => {
    if (found === undefined) asked = null
    return found
  }))

/** Signed out here: the bar goes back to Sign in before the server has even answered. */
function forget() {
  asked = null
  delete document.documentElement.dataset.in
}

function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    const signedIn = 'in' in document.documentElement.dataset
    ;(signedIn ? ask() : Promise.resolve(null)).then((found) => {
      if (!live) return
      // The hint outlived the session: the server said nobody, so say signed out and stop asking.
      if (signedIn && found === null) {
        forget()
        document.cookie = 'detent.in=; Max-Age=0; path=/'
      }
      setMe(found)
    })
    return () => {
      live = false
    }
  }, [])
  return me
}

/** Their picture from GitHub or Google, or their own orb. */
export function Avatar({ email, image, size }: { email: string; image: string | null; size: number }) {
  if (image)
    return (
      // A picture from GitHub or Google at a size we choose; next/image would need their hosts listed for nothing gained.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover shadow-[0_0_0_1px_var(--line)]" style={{ width: size, height: size }} />
    )
  return <Orb seed={email} size={size} />
}

const first = (name: string) => name.split(/\s+/)[0]

/** Sign out without leaving: the bar and the page both catch up at once. */
export function SignOutButton({ className, children, inMenu = false, icon = true }: { className: string; children: ReactNode; inMenu?: boolean; icon?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      role={inMenu ? 'menuitem' : undefined}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await signOutHere()
        forget()
        router.refresh()
      }}
      className={className}
    >
      {busy ? <Spinner size={14} /> : icon && <LogOut size={14} />}
      {children}
    </button>
  )
}

const ITEM = 'ring-focus flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-footnote outline-none transition-colors duration-100 hover:bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] focus-visible:bg-[color-mix(in_oklch,var(--ink)_6%,transparent)]'
/* One colour each, so neither has to win over the other. */
const PLAIN = 'text-ink-2 hover:text-ink focus-visible:text-ink'
const ACCENT = 'text-[var(--accent-ink)]'

function Item({ href, icon: Icon, onPick, accent = false, children }: { href: string; icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>; onPick: () => void; accent?: boolean; children: ReactNode }) {
  return (
    <Link role="menuitem" href={href} onClick={onPick} className={`${ITEM} ${accent ? ACCENT : PLAIN}`}>
      <Icon size={14} />
      {children}
    </Link>
  )
}

/** The person's picture and first name, opening their account's menu. */
export function UserMenu() {
  const me = useMe()
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()

  // Open: the first item takes focus. Escape, Tab or a press outside closes it.
  useEffect(() => {
    if (!open) return
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const away = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      } else if (e.key === 'Tab') setOpen(false)
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
        const at = items.indexOf(document.activeElement as HTMLElement)
        items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
      }
    }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const close = () => setOpen(false)
  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={me ? `${me.name}, account menu` : 'Account menu'}
        onClick={() => setOpen((o) => !o)}
        className="ring-focus flex h-9 items-center gap-2 rounded-[10px] pl-1 pr-1 text-[13px] text-ink transition-colors duration-150 hover:bg-[var(--shell-hover)] sm:pr-2"
      >
        {me ? <Avatar email={me.email} image={me.image} size={26} /> : <span aria-hidden className="size-[26px] shrink-0 rounded-full bg-surface-3" />}
        {/* Held while it loads, so the bar doesn't shift when the name arrives. */}
        <span className="hidden max-w-[132px] truncate font-medium sm:block">{me ? first(me.name) : <span aria-hidden className="block h-2.5 w-14 rounded-full bg-surface-3" />}</span>
        <ChevronDown size={12} className={`hidden text-ink-3 transition-transform duration-200 sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && me && (
          <motion.div
            ref={menu}
            id={id}
            role="menu"
            aria-label="Account"
            className="material absolute right-0 top-[calc(100%+8px)] z-50 w-[272px] origin-top-right rounded-[14px] p-1.5"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 560, damping: 40 }}
          >
            <div className="flex items-center gap-3 px-2.5 pb-3 pt-2.5">
              <Avatar email={me.email} image={me.image} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-callout font-medium text-ink">{me.name}</p>
                <p className="truncate text-caption text-ink-3">{me.email}</p>
              </div>
            </div>
            {me.plan && (
              <div className="px-2.5 pb-3">
                <ProBadge plan={me.plan} />
              </div>
            )}
            <div aria-hidden className="mx-1 mb-1 h-px bg-line" />
            <Item href="/account" icon={Person} onPick={close}>
              Account
            </Item>
            <Item href="/account#keys" icon={Key} onPick={close}>
              API keys
            </Item>
            <Item href="/pro#install" icon={Terminal} onPick={close}>
              Install guide
            </Item>
            {!me.plan && (
              <Item href="/pro" icon={Bolt} onPick={close} accent>
                Get Pro
              </Item>
            )}
            <div aria-hidden className="mx-1 my-1 h-px bg-line" />
            <SignOutButton className={`${ITEM} ${PLAIN}`} inMenu>
              Sign out
            </SignOutButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
