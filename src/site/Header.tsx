'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AI_SDK, FIRST_BLOCK, FIRST_COMPONENT } from '@/catalog/site'
import { ArrowRight, Search } from '@/lab/icons'
import { Mark, ThemeButton } from './parts'
import { BTN, useSideNew } from './shell/side'
import { useSite } from './Providers'
import { UserMenu } from './UserMenu'
import { MobileBuy, PromoStrip } from './Promo'
import { GitHubStars } from './GitHubStars'

const NAV = [
  { href: FIRST_COMPONENT, section: '/components', label: 'Components' },
  { href: FIRST_BLOCK, section: '/blocks', label: 'Blocks' },
  { href: '/templates', section: '/templates', label: 'Templates' },
  { href: '/docs', section: '/docs', label: 'Docs' },
  ...(AI_SDK ? [{ href: '/ai-sdk', section: '/ai-sdk', label: 'AI SDK' }] : []),
  { href: '/pro', section: '/pro', label: 'Pricing' },
]

const UI = 'cubic-bezier(0.2, 0, 0, 1)'
const here = (section: string, path: string) => path.startsWith(section)
const MOVE = 220
const PILL = 980
const INSET = `max(0px, (min(1440px, 100vw - 40px) - ${PILL}px) / 2)`

export function Header() {
  const side = useSideNew()
  const [stuck, setStuck] = useState(false)
  const [menu, setMenu] = useState(false)
  const path = usePathname()
  const { openSearch } = useSite()
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const [seen, setSeen] = useState(path)
  if (seen !== path) {
    setSeen(path)
    setMenu(false)
  }
  useEffect(() => {
    if (!menu) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [menu])

  return (
    <>
    <PromoStrip />
    <MobileBuy />
    <header className="pointer-events-none sticky top-0 z-50 h-[72px] px-2.5 sm:px-5">
      <div className="pointer-events-auto relative mx-auto grid h-[72px] max-w-[1440px] grid-cols-[1fr_auto] items-center pl-6 pr-2.5 lg:grid-cols-[1fr_auto_1fr]">
        <span
          aria-hidden
          className={side ? `pointer-events-none absolute left-1/2 top-[20px] -z-10 h-[54px] w-full max-w-[980px] rounded-[16px] will-change-[opacity,transform]` : "pointer-events-none absolute left-1/2 top-[20px] -z-10 h-[54px] w-full max-w-[980px] rounded-full will-change-[opacity,transform]"}
          style={{
            background: 'var(--nav)',
            boxShadow: 'inset 0 0 0 1px var(--line), 0 14px 34px -16px rgb(0 0 0 / 0.24)',
            opacity: stuck ? 1 : 0,
            transform: `translateX(-50%) scale(${stuck ? 1 : 0.985})`,
            transition: `opacity ${MOVE}ms ${UI}, transform ${MOVE}ms ${UI}`,
          }}
        />
        <div className="pointer-events-none w-fit [&>*]:pointer-events-auto" style={step(stuck, `calc(${INSET} - 6px)`)}>
          <Link href="/" className="ring-focus -mx-1.5 flex w-fit items-center gap-2.5 rounded-[8px] px-1.5 py-1">
            <Mark />
            <span className="text-[15px] font-medium tracking-[-0.02em] text-ink">Detent</span>
          </Link>
        </div>

        <div className="hidden lg:block" style={step(stuck, '0px')}>
          <Links stuck={stuck} path={path} />
        </div>

        <div className="pointer-events-none flex items-center justify-end gap-1.5 [&>*]:pointer-events-auto" style={step(stuck, `calc(${INSET} * -1 + 2px)`)}>
          <button
            type="button"
            onClick={openSearch}
            data-search
            aria-label="Search components (⌘K)"
            title="Search  ⌘K"
            className={side ? `ring-focus grid size-8 place-items-center rounded-[8px] text-ink-3 transition-colors duration-150 hover:bg-[var(--shell-hover)] hover:text-ink active:scale-[0.97]` : "ring-focus grid size-9 place-items-center rounded-full text-ink-2 transition-[background-color,box-shadow,color,transform] duration-200 hover:text-ink active:scale-[0.97]"}
            style={side ? { transitionTimingFunction: UI } : { transitionTimingFunction: UI, background: stuck ? 'transparent' : 'var(--nav)', boxShadow: stuck ? 'none' : 'inset 0 0 0 1px var(--line)' }}
          >
            <Search size={15} />
          </button>
          <GitHubStars
            className="hidden sm:flex lg:hidden xl:flex"
            style={side ? undefined : { transitionTimingFunction: UI, background: stuck ? 'transparent' : 'var(--nav)', boxShadow: stuck ? 'none' : 'inset 0 0 0 1px var(--line)' }}
          />
          <ThemeButton />
          {/* Signed out: the way in and the way to start. Signed in: who it is, and their menu. Which shows is
              decided before first paint (<html data-in>), so the bar never flashes the other. */}
          <div className="when-out contents">
          <Link
            href="/account"
            aria-current={here('/account', path) ? 'page' : undefined}
            className={`ring-focus hidden h-9 items-center px-3 text-[13px] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97] sm:flex ${side ? 'rounded-[9px]' : 'rounded-full'} ${here('/account', path) ? 'text-ink' : 'text-ink-2'}`}
            style={{ transitionTimingFunction: UI }}
          >
            Sign in
          </Link>
          <Link href={FIRST_COMPONENT} className={side ? `ring-focus group/go hidden h-9 items-center gap-1.5 rounded-[9px] ${BTN.accent} pl-4 pr-3.5 text-[13px] font-medium transition-[opacity,transform] duration-150 active:scale-[0.97] sm:flex` : "ring-focus group/go hidden h-9 items-center gap-1.5 rounded-full bg-ink pl-4 pr-3.5 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] sm:flex"}>
            Get started
            <ArrowRight size={13} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
          </Link>
          </div>
          <div className="when-in">
            <UserMenu />
          </div>
          <button type="button" aria-label={menu ? 'Close menu' : 'Menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)} className={side ? `ring-focus grid size-9 place-items-center rounded-[9px] text-ink-2 transition-transform duration-150 hover:bg-[var(--line)] active:scale-[0.97] lg:hidden` : "ring-focus grid size-9 place-items-center rounded-full text-ink-2 transition-transform duration-150 hover:bg-[var(--line)] active:scale-[0.97] lg:hidden"}>
            <span aria-hidden className="relative block h-3 w-4">
              <motion.span className="absolute left-0 top-0 h-[1.5px] w-4 rounded-full bg-current" initial={false} animate={menu ? { y: 5.25, rotate: 45 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
              <motion.span className="absolute bottom-0 left-0 h-[1.5px] w-4 rounded-full bg-current" initial={false} animate={menu ? { y: -5.25, rotate: -45 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
            </span>
          </button>
        </div>
        <AnimatePresence>{menu && <Menu path={path} onClose={() => setMenu(false)} />}</AnimatePresence>
      </div>
    </header>
    </>
  )
}

const step = (stuck: boolean, x: string) => ({ transform: stuck ? `translate(${x}, 11px)` : 'none', transition: `transform ${MOVE}ms ${UI}` })

function Links({ stuck, path }: { stuck: boolean; path: string }) {
  const side = useSideNew()
  const box = useRef<HTMLElement>(null)
  const links = useRef<(HTMLAnchorElement | null)[]>([])
  const [hot, setHot] = useState<number | null>(null)
  const [spots, setSpots] = useState<{ x: number; w: number }[]>([])
  const reduce = useReducedMotion()
  const active = NAV.findIndex((n) => here(n.section, path))
  const at = hot ?? (active >= 0 ? active : null)
  useLayoutEffect(() => {
    const read = () => setSpots(links.current.map((a) => (a ? { x: a.offsetLeft, w: a.offsetWidth } : { x: 0, w: 0 })))
    read()
    const ro = new ResizeObserver(read)
    if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  const spot = at !== null ? spots[at] : undefined
  return (
    <nav
      ref={box}
      aria-label="Main"
      className={side ? `relative hidden h-10 items-center rounded-[12px] p-1 transition-[background-color,box-shadow] duration-200 lg:flex` : "relative hidden h-10 items-center rounded-full p-1 transition-[background-color,box-shadow] duration-200 lg:flex"}
      style={{ transitionTimingFunction: UI, background: stuck ? 'transparent' : 'var(--nav)', boxShadow: stuck ? 'none' : 'inset 0 0 0 1px var(--line)' }}
      onPointerLeave={() => setHot(null)}
    >
      <motion.span
        aria-hidden
        className={side ? `pointer-events-none absolute left-0 top-1 h-8 rounded-[9px]` : "pointer-events-none absolute left-0 top-1 h-8 rounded-full"}
        style={{ background: 'var(--surface)', boxShadow: 'var(--elev-raised)' }}
        initial={false}
        animate={spot ? { x: spot.x, width: spot.w, opacity: 1 } : { opacity: 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40, opacity: { duration: 0.15 } }}
      />
      {NAV.map((n, i) => (
        <Link
          key={n.href}
          ref={(el) => {
            links.current[i] = el
          }}
          href={n.href}
          aria-current={i === active ? 'page' : undefined}
          onPointerEnter={() => setHot(i)}
          onFocus={() => setHot(i)}
          onBlur={() => setHot(null)}
          className={side ? `ring-focus relative flex h-8 items-center whitespace-nowrap rounded-[9px] px-3.5 text-[13.5px] transition-[color,transform] duration-200 active:scale-[0.97] ${at === i ? 'text-ink' : 'text-ink-2'}` : `ring-focus relative flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[13.5px] transition-[color,transform] duration-200 active:scale-[0.97] ${at === i ? 'text-ink' : 'text-ink-2'}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  )
}

function Menu({ path, onClose }: { path: string; onClose: () => void }) {
  const side = useSideNew()
  const reduce = useReducedMotion()
  const router = useRouter()
  useEffect(() => NAV.forEach((n) => router.prefetch(n.href)), [router])
  return (
    <motion.nav
      aria-label="Main"
      className="absolute inset-x-0 top-[calc(100%+8px)] origin-top rounded-[22px] p-2 lg:hidden"
      style={{ background: 'var(--leaf)', boxShadow: 'var(--leaf-edge), 0 24px 48px -20px rgb(0 0 0 / 0.3)' }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
    >
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} onClick={onClose} aria-current={here(n.section, path) ? 'page' : undefined} className={`ring-focus flex h-12 items-center rounded-[14px] px-3.5 text-[17px] tracking-[-0.01em] hover:bg-[var(--line)] active:bg-[var(--line)] ${here(n.section, path) ? 'text-ink' : 'text-ink-2'}`}>
          {n.label}
        </Link>
      ))}
      <GitHubStars label="GitHub" className="h-12! gap-3! rounded-[14px]! px-3.5! text-[17px]! tracking-[-0.01em] hover:bg-[var(--line)] sm:hidden" />
      <div className="when-out">
      <Link href="/account" onClick={onClose} aria-current={here('/account', path) ? 'page' : undefined} className={`ring-focus flex h-12 items-center rounded-[14px] px-3.5 text-[17px] tracking-[-0.01em] hover:bg-[var(--line)] active:bg-[var(--line)] sm:hidden ${here('/account', path) ? 'text-ink' : 'text-ink-2'}`}>
        Sign in
      </Link>
      <Link href={FIRST_COMPONENT} onClick={onClose} className={side ? `ring-focus mt-1 flex h-11 items-center justify-center gap-1.5 rounded-[11px] ${BTN.accent} text-[14px] font-medium transition-transform duration-150 active:scale-[0.97] sm:hidden` : "ring-focus mt-1 flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[14px] font-medium text-surface transition-transform duration-150 active:scale-[0.97] sm:hidden"}>
        Get started
        <ArrowRight size={13} />
      </Link>
      </div>
    </motion.nav>
  )
}
