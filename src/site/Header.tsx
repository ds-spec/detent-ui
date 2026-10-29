'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Search } from '@/lab/icons'
import { Mark, ThemeButton } from './parts'
import { useSite } from './Providers'

const NAV = [
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/templates', label: 'Templates' },
  { href: '/ai-sdk', label: 'AI SDK' },
  { href: '/pro', label: 'Pricing' },
]

const UI = 'cubic-bezier(0.2, 0, 0, 1)'
const here = (href: string, path: string) => path.startsWith(href)

/*
 * The header, made of the page's own material. Three parts on one line: the mark on the left, the
 * links in the middle in a small pill of their own, and search, the theme and the way in on the
 * right. A plate rests under the page you're on and slides to whichever link you point at, so the
 * pill reads as one control rather than five words.
 *
 * At the top of a page the bar lies open on the ground. As soon as the page moves it gathers
 * itself into a sheet of its own, a pill floating over the page, narrower, and the links' pill
 * dissolves into it. The two states are one bar changing shape, so nothing jumps.
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
      <div
        className="pointer-events-auto relative mx-auto grid grid-cols-[1fr_auto] items-center transition-[max-width,height,margin,padding,background-color,box-shadow,border-radius] duration-500 lg:grid-cols-[1fr_auto_1fr]"
        style={{
          transitionTimingFunction: UI,
          maxWidth: stuck ? 980 : 1440,
          height: stuck ? 54 : 72,
          marginTop: stuck ? 9 : 0,
          padding: stuck ? '0 8px 0 18px' : '0 10px 0 24px',
          borderRadius: stuck ? 999 : 0,
          background: stuck ? 'color-mix(in oklch, var(--leaf) 90%, transparent)' : 'transparent',
          boxShadow: stuck ? 'var(--leaf-edge), 0 14px 34px -16px rgb(0 0 0 / 0.24)' : '0 0 0 0 transparent',
          backdropFilter: stuck ? 'blur(14px) saturate(1.2)' : 'none',
          WebkitBackdropFilter: stuck ? 'blur(14px) saturate(1.2)' : 'none',
        }}
      >
        <Link href="/" className="ring-focus -mx-1.5 flex w-fit items-center gap-2.5 rounded-[8px] px-1.5 py-1">
          <Mark />
          <span className="text-[15px] font-medium tracking-[-0.02em] text-ink">Detent</span>
        </Link>

        <Links stuck={stuck} path={path} />

        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={openSearch}
            data-search
            aria-label="Search components (⌘K)"
            title="Search  ⌘K"
            className="ring-focus grid size-9 place-items-center rounded-full text-ink-2 transition-[background-color,box-shadow,color] duration-300 hover:text-ink"
            style={{ transitionTimingFunction: UI, background: stuck ? 'transparent' : 'color-mix(in oklch, var(--leaf) 75%, transparent)', boxShadow: stuck ? 'none' : 'inset 0 0 0 1px var(--line)' }}
          >
            <Search size={15} />
          </button>
          <ThemeButton />
          <Link href="/components" className="ring-focus group/go hidden h-9 items-center gap-1.5 rounded-full bg-ink pl-4 pr-3.5 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] sm:flex">
            Get started
            <ArrowRight size={13} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
          </Link>
          <button type="button" aria-label={menu ? 'Close menu' : 'Menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="ring-focus grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[var(--line)] lg:hidden">
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

/** The links in a small pill of their own, with a plate that rests under the current page and slides to the one you point at. */
function Links({ stuck, path }: { stuck: boolean; path: string }) {
  const box = useRef<HTMLElement>(null)
  const links = useRef<(HTMLAnchorElement | null)[]>([])
  const [hot, setHot] = useState<number | null>(null)
  const [spots, setSpots] = useState<{ x: number; w: number }[]>([])
  const reduce = useReducedMotion()
  const active = NAV.findIndex((n) => here(n.href, path))
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
      className="relative hidden h-10 items-center rounded-full p-1 transition-[background-color,box-shadow] duration-500 lg:flex"
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
          className={`ring-focus relative flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[13.5px] transition-colors duration-200 ${at === i ? 'text-ink' : 'text-ink-2'}`}
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
        <Link key={n.href} href={n.href} onClick={onClose} aria-current={here(n.href, path) ? 'page' : undefined} className={`ring-focus flex h-12 items-center rounded-[14px] px-3.5 text-[17px] tracking-[-0.01em] hover:bg-[var(--line)] ${here(n.href, path) ? 'text-ink' : 'text-ink-2'}`}>
          {n.label}
        </Link>
      ))}
      <Link href="/components" onClick={onClose} className="ring-focus mt-1 flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[14px] font-medium text-surface sm:hidden">
        Get started
        <ArrowRight size={13} />
      </Link>
    </motion.nav>
  )
}
