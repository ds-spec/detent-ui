'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { Check, Copy, Moon, Search, Sun } from '@/lab/icons'
import { ease, press } from '@/lab/lib/motion'
import { useTheme } from '@/lab/lib/hooks'
import { Kbd } from '@/lab/ui/Kbd'
import { MANAGERS, isManaged, withManager } from '@/catalog/site'
import { Popup } from '@/lab/components/popup/Popup'
import { useManager } from './manager'
import { BTN, useSideNew } from './shell/side'
import { useSite } from './Providers'

// The load click plays once a visit, not every time a page mounts the header.
let seated = false

/**
 * The mark: the Seated D. A slab and a half-disc on a 24-unit grid, machined to meet with a
 * two-unit gap: two parts that clicked into place. On the first load the half-disc slides home,
 * passes its seat by a hair and springs back (in CSS, so it plays at first paint). Pointing at
 * the brand clicks it again, with the site's click when sound is on. `still` leaves it at rest.
 */
export function Mark({ size = 22, still = false }: { size?: number; still?: boolean }) {
  const { tick } = useSite()
  const box = useRef<SVGSVGElement>(null)
  const x = useMotionValue(0)
  const [intro] = useState(() => !still && !seated)
  useEffect(() => {
    seated = true
    const brand = box.current?.closest('a')
    if (still || !brand || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let stop = () => {}
    const click = () => {
      stop()
      // Out a little, then a stiff, light spring brings it home past its seat and back.
      const out = animate(x, 2.2, { duration: 0.11, ease: [0.3, 0, 0.6, 1] })
      stop = () => out.stop()
      out.then(() => {
        const home = animate(x, 0, { type: 'spring', stiffness: 900, damping: 17, mass: 0.6 })
        const t = setTimeout(tick, 45)
        stop = () => (home.stop(), clearTimeout(t))
      })
    }
    brand.addEventListener('pointerenter', click)
    return () => {
      stop()
      brand.removeEventListener('pointerenter', click)
    }
  }, [still, tick, x])
  return (
    <svg ref={box} width={size} height={size} viewBox="0 0 24 24" overflow="visible" aria-hidden className="shrink-0 text-ink">
      <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" fill="currentColor" />
      <motion.g className={intro ? 'mark-seat' : undefined} style={{ x }}>
        <path d="M11.25 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </motion.g>
    </svg>
  )
}

export function Brand() {
  return (
    <Link href="/" className="ring-focus group/brand -mx-1.5 flex items-center gap-2.5 rounded-[8px] px-1.5 py-1">
      <Mark />
      <span className="whitespace-nowrap text-callout font-semibold tracking-[-0.01em]">Detent</span>
    </Link>
  )
}

export function SearchButton() {
  const side = useSideNew()
  const { openSearch } = useSite()
  return (
    <motion.button
      type="button"
      whileTap={press}
      onClick={openSearch}
      data-search
      aria-label="Search components"
      className={side ? `ring-focus flex h-8 items-center gap-2 rounded-[9px] bg-surface pl-3 pr-1.5 text-footnote text-ink-3 shadow-border transition-[color,box-shadow] duration-150 hover:text-ink-2 hover:shadow-[var(--elev-raised-hover)] max-xl:size-8 max-xl:justify-center max-xl:p-0 xl:w-[200px]` : "ring-focus flex h-8 items-center gap-2 rounded-full bg-surface pl-3 pr-1.5 text-footnote text-ink-3 shadow-border transition-[color,box-shadow] duration-150 hover:text-ink-2 hover:shadow-[var(--elev-raised-hover)] max-xl:size-8 max-xl:justify-center max-xl:p-0 xl:w-[200px]"}
    >
      <Search size={14} />
      <span className="flex-1 text-left max-xl:hidden">Search</span>
      <span className="flex gap-0.5 max-xl:hidden">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </motion.button>
  )
}

const round = 'ring-focus flex size-8 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink'

export function ThemeButton() {
  const side = useSideNew()
  const theme = useTheme()
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* storage unavailable */
    }
  }
  return (
    <motion.button type="button" whileTap={press} onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} className={side ? 'ring-focus flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-colors duration-150 hover:bg-[var(--shell-hover)] hover:text-ink' : round}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={theme} className="flex" initial={{ opacity: 0, rotate: -40, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 40, scale: 0.7 }} transition={{ duration: 0.2, ease: ease.out }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/** An install command you copy with one click; a sweep of colour confirms it. The package manager is a native menu, so it behaves on every keyboard and phone. */
export function CopyCommand({ command: given, fill = false, onCopy }: { command: string; /** Take the full width of its slot, so a font swap can never move its edges. */ fill?: boolean; onCopy?: () => void }) {
  const [copied, setCopied] = useState(0)
  const timer = useRef(0)
  const [manager, setManager] = useManager()
  const side = useSideNew()
  const command = withManager(given, manager)
  // Reads as one line: the picker is the command's first word, and what you're adding stays in full.
  const [first, ...words] = command.split(' ')
  const managed = isManaged(given)
  const firsts = MANAGERS.map((m) => withManager(given, m).split(' ')[0])
  const item = words.pop()?.replace(/^https?:\/\/.*\/r\//, '') ?? ''
  const name = item.slice(item.lastIndexOf('/') + 1)
  const lead = [...(managed ? words : [first, ...words]), item.slice(0, -name.length)].join(' ')
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      /* Clipboard blocked: the command is still there to select. */
    }
    setCopied((n) => n + 1)
    onCopy?.()
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(0), 1600)
  }
  return (
    <div className={`${fill ? 'flex w-full' : 'inline-flex max-w-full'} h-10 items-center gap-2 pl-0.5 pr-1 font-mono text-footnote ${side ? `rounded-[11px] ${BTN.plate}` : 'rounded-full bg-surface shadow-raised'}`}>
      {managed ? (
        <Popup label="Package manager" options={firsts} value={first} onChange={(w) => setManager(MANAGERS[firsts.indexOf(w)])} radius={side ? 9 : 18} textClass="font-mono text-footnote" className="shrink-0" />
      ) : (
        <span className="pl-3 text-ink-3">$</span>
      )}
      <span title={command} className="relative flex min-w-0 text-ink">
        <AnimatePresence>
          {copied > 0 && (
            <motion.span
              key={copied}
              aria-hidden
              className="absolute -inset-x-1 -inset-y-0.5 origin-left rounded-[4px]"
              style={{ background: 'color-mix(in oklch, var(--accent) 26%, transparent)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1, transition: { duration: 0.26, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            />
          )}
        </AnimatePresence>
        <span className="relative min-w-0 truncate pr-2 text-ink-3">{lead.trimEnd()}</span>
        <span className="relative max-w-full shrink-0 truncate">{name}</span>
      </span>
      <button type="button" onClick={copy} aria-label={copied ? 'Copied' : 'Copy command'} className={`ring-focus relative ml-auto flex size-8 shrink-0 items-center justify-center text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink ${side ? 'rounded-[8px]' : 'rounded-full'}`}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={copied ? 'ok' : 'copy'} className={`flex ${copied ? 'text-ok' : ''}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.16 }}>
            {copied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
