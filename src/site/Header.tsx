'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { FIRST_BLOCK, FIRST_COMPONENT } from '@/catalog/site'
import { ArrowRight, Search } from '@/lab/icons'
import { Mark, ThemeButton } from './parts'
import { useSite } from './Providers'

const NAV = [
  { href: FIRST_COMPONENT, section: '/components', label: 'Components' },
  { href: FIRST_BLOCK, section: '/blocks', label: 'Blocks' },
  { href: '/templates', section: '/templates', label: 'Templates' },
  { href: '/ai-sdk', section: '/ai-sdk', label: 'AI SDK' },
  { href: '/pro', section: '/pro', label: 'Pricing' },
]

const UI = 'cubic-bezier(0.2, 0, 0, 1)'
const here = (section: string, path: string) => path.startsWith(section)
/** How long the bar takes to gather or open. */
const MOVE = 220
/** The floating bar's width, and how far each end steps in from the open bar to reach it. */
const PILL = 980
const INSET = `max(0px, (min(1440px, 100vw - 40px) - ${PILL}px) / 2)`

/*
 * The header, made of the page's own material. Three parts on one line: the mark on the left, the
 * links in the middle in a small pill of their own, and search, the theme and the way in on the
 * right. A plate rests under the page you're on and slides to whichever link you point at, so the
 * pill reads as one control rather than five words.
 *
 * At the top of a page the bar lies open on the ground. As soon as the page moves a pill fades in
 * over the page, narrower, and the ends step in to sit on it while the links' pill dissolves into
 * it. The bar itself never changes size: only opacity and transforms move, so scrolling past the
 * top doesn't lay anything out.
 */
export function Header() {
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
  // Moving to another page closes the menu.
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
    <header className="pointer-events-none sticky top-0 z-50 h-[72px] px-2.5 sm:px-5">
      <div className="pointer-events-auto relative mx-auto grid h-[72px] max-w-[1440px] grid-cols-[1fr_auto] items-center pl-6 pr-2.5 lg:grid-cols-[1fr_auto_1fr]">
        {/* The floating pill: always there, and only ever faded and settled. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[20px] -z-10 h-[54px] w-full max-w-[980px] rounded-full will-change-[opacity,transform]"
          style={{
            background: 'color-mix(in oklch, var(--leaf) 90%, transparent)',
            boxShadow: 'var(--leaf-edge), 0 14px 34px -16px rgb(0 0 0 / 0.24)',
            backdropFilter: 'blur(14px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
            opacity: stuck ? 1 : 0,
            transform: `translateX(-50%) scale(${stuck ? 1 : 0.985})`,
            transition: `opacity ${MOVE}ms ${UI}, transform ${MOVE}ms ${UI}`,
          }}
        />
        <div className="w-fit" style={step(stuck, `calc(${INSET} - 6px)`)}>
          <Link href="/" className="ring-focus -mx-1.5 flex w-fit items-center gap-2.5 rounded-[8px] px-1.5 py-1">
            <Mark />
            <span className="text-[15px] font-medium tracking-[-0.02em] text-ink">Detent</span>
          </Link>
        </div>

        <div className="hidden lg:block" style={step(stuck, '0px')}>
          <Links stuck={stuck} path={path} />
        </div>

        <div className="flex items-center justify-end gap-1.5" style={step(stuck, `calc(${INSET} * -1 + 2px)`)}>
          <button
            type="button"
            onClick={openSearch}
            data-search
            aria-label="Search components (⌘K)"
            title="Search  ⌘K"
            className="ring-focus grid size-9 place-items-center rounded-full text-ink-2 transition-[background-color,box-shadow,color,transform] duration-200 hover:text-ink active:scale-[0.97]"
            style={{ transitionTimingFunction: UI, background: stuck ? 'transparent' : 'color-mix(in oklch, var(--leaf) 75%, transparent)', boxShadow: stuck ? 'none' : 'inset 0 0 0 1px var(--line)' }}
          >
            <Search size={15} />
          </button>
          <ThemeButton />
          <Link href={FIRST_COMPONENT} className="ring-focus group/go hidden h-9 items-center gap-1.5 rounded-full bg-ink pl-4 pr-3.5 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] sm:flex">
            Get started
            <ArrowRight size={13} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
          </Link>
          <button type="button" aria-label={menu ? 'Close menu' : 'Menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="ring-focus grid size-9 place-items-center rounded-full text-ink-2 transition-transform duration-150 hover:bg-[var(--line)] active:scale-[0.97] lg:hidden">
            <span aria-hidden className="relative block h-3 w-4">
              <motion.span className="absolute left-0 top-0 h-[1.5px] w-4 rounded-full bg-current" initial={false} animate={menu ? { y: 5.25, rotate: 45 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
              <motion.span className="absolute bottom-0 left-0 h-[1.5px] w-4 rounded-full bg-current" initial={false} animate={menu ? { y: -5.25, rotate: -45 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
            </span>
          </button>
        </div>
        <AnimatePresence>{menu && <Menu path={path} onClose={() => setMenu(false)} />}</AnimatePresence>
      </div>
    </header>
  )
}

/** One part of the bar stepping between open and gathered: across by `x`, and down onto the pill. */
const step = (stuck: boolean, x: string) => ({ transform: stuck ? `translate(${x}, 11px)` : 'none', transition: `transform ${MOVE}ms ${UI}` })

/** The links in a small pill of their own, with a plate that rests under the current page and slides to the one you point at. */
function Links({ stuck, path }: { stuck: boolean; path: string }) {
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
      className="relative hidden h-10 items-center rounded-full p-1 transition-[background-color,box-shadow] duration-200 lg:flex"
      style={{ transitionTimingFunction: UI, background: stuck ? 'transparent' : 'color-mix(in oklch, var(--leaf) 55%, transparent)', boxShadow: stuck ? 'none' : 'inset 0 0 0 1px var(--line)' }}
      onPointerLeave={() => setHot(null)}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-0 top-1 h-8 rounded-full"
        style={{ background: stuck ? 'var(--line)' : 'var(--surface)', boxShadow: stuck ? 'none' : 'var(--elev-raised)' }}
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
          className={`ring-focus relative flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[13.5px] transition-[color,transform] duration-200 active:scale-[0.97] ${at === i ? 'text-ink' : 'text-ink-2'}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  )
}

/** Below a laptop: the links drop as a sheet from under the bar. */
function Menu({ path, onClose }: { path: string; onClose: () => void }) {
  const reduce = useReducedMotion()
  // These links never get pointed at or scrolled past first, so they're fetched as soon as they show.
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
      <Link href={FIRST_COMPONENT} onClick={onClose} className="ring-focus mt-1 flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[14px] font-medium text-surface transition-transform duration-150 active:scale-[0.97] sm:hidden">
        Get started
        <ArrowRight size={13} />
      </Link>
    </motion.nav>
  )
}
