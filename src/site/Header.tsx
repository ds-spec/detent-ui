'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@/lab/icons'
import { Mark, SearchButton, ThemeButton } from './parts'

const NAV = [
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks', pro: true },
  { href: '/templates', label: 'Templates', pro: true },
  { href: '/pro', label: 'Pricing' },
  { href: '/#library', label: 'Library' },
  { href: '/#install', label: 'Install' },
]

/** Clear at the top; once something scrolls under it, frosted with a single hairline. */
export function Header() {
  const [under, setUnder] = useState(false)
  const path = usePathname()
  useEffect(() => {
    const on = () => setUnder(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header
      className="sticky top-0 z-40 transition-[background-color,box-shadow] duration-200"
      style={{
        // Nearly opaque instead of blurred: a blur behind the header repaints every frame something moves under it.
        background: under ? 'color-mix(in oklch, var(--bg) 94%, transparent)' : 'transparent',
        boxShadow: under ? 'inset 0 -1px 0 var(--line)' : 'none',
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-6 px-5 sm:px-6 xl:gap-8">
        <Link href="/" className="ring-focus group/brand -mx-1.5 flex items-center gap-2.5 rounded-[8px] px-1.5 py-1">
          <Mark />
          <span className="text-headline tracking-[-0.02em] text-ink">Detent</span>
        </Link>
        <Nav path={path} />
        <span className="flex-1" />
        <div className="flex items-center gap-2">
          <SearchButton />
          <ThemeButton />
          <Link
            href="/components"
            className="ring-focus hidden h-8 items-center whitespace-nowrap rounded-full bg-ink px-3.5 text-footnote font-medium text-surface transition-opacity duration-150 hover:opacity-90 sm:flex"
          >
            Get started
          </Link>
          <MenuButton path={path} />
        </div>
      </div>
    </header>
  )
}

const here = (href: string, path: string) => !href.includes('#') && path.startsWith(href)

/**
 * The main links. Pointing at one turns it the accent, and a short tick of the accent slides
 * along under the row to sit beneath it, the way a pointer settles on a mark. It rests under the
 * page you're on and goes back there when you leave.
 */
function Nav({ path }: { path: string }) {
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
    <nav ref={box} aria-label="Main" className="relative hidden h-16 items-center gap-5 lg:flex xl:gap-6" onPointerLeave={() => setHot(null)}>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute bottom-[17px] left-0 h-[2px] w-3 rounded-full bg-accent"
        initial={false}
        animate={spot ? { x: spot.x + spot.w / 2 - 6, opacity: 1 } : { opacity: 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 560, damping: 38, opacity: { duration: 0.15 } }}
      />
      {NAV.map((n, i) => {
        const lit = hot === i
        return (
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
            className={`ring-focus relative flex h-8 items-center gap-1.5 rounded-[6px] text-footnote transition-colors duration-200 ${lit ? 'text-[var(--accent-ink)]' : i === active ? 'text-ink' : 'text-ink-2'}`}
          >
            {n.label}
            {n.pro && <span className="rounded-full bg-surface-2 px-1.5 text-caption font-medium leading-[18px] text-ink-2">Pro</span>}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Below 1024px the links don't fit beside search, so they fold into a menu: a sheet that drops
 * from under the header with every link set large, the page you're on marked, and a way in at
 * the bottom. Escape, a link or the button closes it.
 */
function MenuButton({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  // Moving to another page closes it.
  const [seen, setSeen] = useState(path)
  if (seen !== path) {
    setSeen(path)
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])
  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="ring-focus relative grid size-8 place-items-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <span aria-hidden className="relative block h-3 w-4">
          <motion.span className="absolute left-0 top-0 h-[1.5px] w-4 rounded-full bg-current" initial={false} animate={open ? { y: 5.25, rotate: 45 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
          <motion.span className="absolute bottom-0 left-0 h-[1.5px] w-4 rounded-full bg-current" initial={false} animate={open ? { y: -5.25, rotate: -45 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.button key="scrim" type="button" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/20 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            <motion.nav
              key="menu"
              aria-label="Main"
              className="fixed inset-x-0 top-16 z-40 bg-bg px-5 pb-6 pt-2 shadow-[0_1px_0_var(--line),0_24px_48px_-24px_rgb(0_0_0/0.25)] sm:px-6 lg:hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.14 } }}
              transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}
            >
              <ul className="mx-auto max-w-[1360px]">
                {NAV.map((n, i) => {
                  const on = here(n.href, path)
                  return (
                    <motion.li key={n.href} initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.03 * i }}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        aria-current={on ? 'page' : undefined}
                        className={`ring-focus flex h-14 items-center gap-2.5 rounded-[10px] text-[24px] tracking-[-0.03em] shadow-[inset_0_-1px_0_var(--line)] ${on ? 'text-ink' : 'text-ink-2'}`}
                      >
                        {on && <span aria-hidden className="h-[2px] w-3 rounded-full bg-accent" />}
                        {n.label}
                        {n.pro && <span className="rounded-full bg-surface-2 px-1.5 text-caption font-medium leading-[18px] text-ink-2">Pro</span>}
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
              <Link href="/components" onClick={() => setOpen(false)} className="ring-focus mx-auto mt-5 flex h-11 max-w-[1360px] items-center justify-center gap-2 rounded-full bg-ink text-callout font-medium text-surface sm:hidden">
                Get started
                <ArrowRight size={15} />
              </Link>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
