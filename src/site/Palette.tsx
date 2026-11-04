'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { isProBlock, isProComponent } from '@/catalog/pro'
import { FIRST_COMPONENT, installCommand, withManager } from '@/catalog/site'
import { useManager } from './manager'
import { track } from './track'
import { clamp } from '@/lab/lib/detent'
import { Layer, useDismiss } from '@/lab/lib/layer'

/*
 * The site's ⌘K. A soft shell, a sheet inside it and a quiet inset field, separated by tone alone. It
 * knows where you are: on a component's page it opens on Copy install, so ⌘K then Enter is the whole
 * job. As you type, a ghost finishes the word you probably mean and follows the row you're on. Tab
 * takes it, and if it was a place, the word stays exactly where it is and a plate grows behind it, and
 * you're searching inside it. Backspace hands you the word back. Rows that survive a keystroke glide,
 * and the bottom edge of the field wakes under your caret while you type.
 */

const VISIBLE = 7
const ROW = 34
const LABEL = 26
const TRAY = 8
const INK = 'var(--p1)'
const SOFT = 'var(--p2)'
const FAINT = 'var(--p3)'
const SPRING = { type: 'spring', stiffness: 720, damping: 52, mass: 0.7 } as const
const SIZE = { type: 'spring', bounce: 0, duration: 0.26 } as const
const RECENT = ['rewind', 'find', 'popup', 'region']
const PLACES = ['Components', 'Blocks', 'Actions'] as const
type Place = (typeof PLACES)[number]

const COPY = 'M5.5 5.5V3.2c0-.4.3-.7.7-.7h6.6c.4 0 .7.3.7.7v6.6c0 .4-.3.7-.7.7h-2.3M3.2 5.5h6.6c.4 0 .7.3.7.7v6.6c0 .4-.3.7-.7.7H3.2a.7.7 0 0 1-.7-.7V6.2c0-.4.3-.7.7-.7Z'
const GO = 'M3 8h9.5M8.5 4l4 4-4 4'
const SUN = 'M8 2.5v1M8 12.5v1M2.5 8h1M12.5 8h1M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z'
const SOUND = 'M3 6.2v3.6h2.2L8.5 12.5v-9L5.2 6.2H3ZM11 6a3 3 0 0 1 0 4'

const SKIN = `
.pal{--p1:#1d1d1f;--p2:#6e6e73;--p3:#a1a1a6;--shell:#efeff0;--sheet:#fff;--field:#f5f5f6;--sel:#f5f5f6;--chip:#e9e9eb;--beam:rgb(0 0 0/.35);--rim:rgb(0 0 0/.06)}
[data-theme=dark] .pal{--p1:#f5f5f7;--p2:#a1a1a6;--p3:#6e6e73;--shell:#26262a;--sheet:#1a1a1d;--field:#232327;--sel:#27272c;--chip:#34343a;--beam:rgb(255 255 255/.7);--rim:rgb(255 255 255/.06)}
@keyframes pal-solid{from{color:var(--p3)}to{color:var(--p1)}}
@keyframes pal-chip{from{background:transparent}to{background:var(--chip)}}
`

type Item = { id: string; name: string; note: string; tag: string; icon: string; group?: string; words?: string; run: () => void; copied?: boolean }

function fuzzy(name: string, q: string) {
  const low = name.toLowerCase()
  const whole = low.indexOf(q)
  if (whole >= 0) return whole
  // Otherwise each letter has to start a word or follow the last one, so "dh" finds Dot histogram
  // and "dot" doesn't find Model & effort through a stray d, o and t.
  let at = 0
  let first = -1
  let prev = -2
  for (const c of q) {
    let i = low.indexOf(c, at)
    while (i >= 0 && i !== prev + 1 && i > 0 && /[a-z0-9]/.test(low[i - 1])) i = low.indexOf(c, i + 1)
    if (i < 0) return null
    if (first < 0) first = i
    prev = i
    at = i + 1
  }
  return 40 + at - first
}

export function Palette({ open, onOpenChange, sound, toggleSound }: { open: boolean; onOpenChange: (open: boolean) => void; sound: boolean; toggleSound: () => void }) {
  const router = useRouter()
  const path = usePathname()
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState<Place | null>(null)
  const [at, setAt] = useState(0)
  const [done, setDone] = useState(false)
  const field = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLElement | null)[]>([])
  const mirror = useRef<HTMLSpanElement>(null)
  const typed = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const y = useMotionValue(0)
  const beam = useMotionValue(0)
  const glow = useMotionValue(0)
  const q = query.trim().toLowerCase()

  const close = () => onOpenChange(false)
  const [manager] = useManager()
  const here = useMemo(() => {
    const m = path.match(/^\/(components|blocks)\/([^/]+)/)
    if (!m) return null
    if (m[1] === 'components') return ENTRIES.some((e) => e.id === m[2]) ? { id: m[2], free: !isProComponent(m[2]) } : null
    return BLOCKS.some((b) => b.id === m[2]) ? { id: m[2], free: !isProBlock(m[2]) } : null
  }, [path])

  const { items } = useMemo(() => {
    const go = (href: string) => () => {
      close()
      router.push(href)
    }
    const comps: Item[] = ENTRIES.map((e) => ({ id: e.id, name: e.name, note: '', tag: isProComponent(e.id) ? 'Pro' : '', icon: GO, run: go(`/components/${e.id}`) }))
    const blocks: Item[] = BLOCKS.map((b) => ({ id: `block-${b.id}`, name: b.name, note: '', tag: 'Block', icon: GO, run: go(`/blocks/${b.id}`) }))
    const actions: Item[] = [
      { id: 'home', name: 'Home', note: '', tag: '', icon: GO, run: go('/') },
      { id: 'all', name: 'All components', note: '', tag: '', icon: GO, run: go(FIRST_COMPONENT) },
      { id: 'system', name: 'System', note: 'Type, materials, motion', tag: '', icon: GO, run: go('/system') },
      { id: 'pricing', name: 'Pricing', note: '', tag: '', icon: GO, run: go('/pro') },
      {
        id: 'theme',
        name: 'Switch theme',
        note: 'Light or dark',
        tag: '',
        icon: SUN,
        run: () => {
          const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.dataset.theme = next
          try {
            localStorage.setItem('theme', next)
          } catch {
            /* storage unavailable */
          }
        },
      },
      { id: 'sound', name: sound ? 'Turn sound off' : 'Turn sound on', note: '', tag: '', icon: SOUND, run: toggleSound },
    ]
    const local: Item[] = here
      ? [
          {
            id: 'copy',
            name: 'Copy install',
            note: withManager(installCommand(here.id, here.free), manager),
            tag: '',
            group: 'On this page',
            icon: COPY,
            run: () => {
              void navigator.clipboard?.writeText(withManager(installCommand(here.id, here.free), manager)).catch(() => {})
              track('copy_install', { item: here.id, manager, from: 'palette' })
              setDone(true)
              window.setTimeout(close, 620)
            },
          },
        ]
      : []
    const pool = place === 'Blocks' ? blocks : place === 'Components' ? comps : place === 'Actions' ? actions : [...comps, ...blocks, ...actions]
    if (!q) {
      if (place) return { items: pool.slice(0, VISIBLE) }
      // Your best pieces lead, and then everything else, so the list is the whole library.
      const first = RECENT.flatMap((id) => comps.filter((c) => c.id === id))
      const rest = comps.filter((c) => !RECENT.includes(c.id))
      const all = [...first, ...rest].filter((c) => c.id !== here?.id).map((c) => ({ ...c, group: 'Go to' }))
      return { items: [...local, ...all] }
    }
    const found = pool.flatMap((r) => {
      const f = fuzzy(r.name, q)
      return f === null ? [] : [{ r, rank: f - (RECENT.includes(r.id) ? 6 : 0) }]
    })
    found.sort((a, b) => a.rank - b.rank)
    const places: Item[] = place ? [] : PLACES.filter((p) => p.toLowerCase().startsWith(q)).map((p) => ({ id: `place-${p}`, name: p, note: 'Search inside', tag: '', icon: GO, run: () => fold(p) }))
    return { items: [...local.filter((l) => l.name.toLowerCase().includes(q)), ...places, ...found.map((x) => x.r)] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, place, here, sound, manager])

  // A row that has just been swapped out reads 0, which would sit the plate on the field, so use where rows start instead.
  const seat = (i: number) => {
    const el = rows.current[i]
    return el?.isConnected && el.offsetTop ? el.offsetTop : TRAY + (i ? i * ROW : 0)
  }
  const go = (i: number, instant = false) => {
    const n = clamp(i, 0, Math.max(0, items.length - 1))
    setAt(n)
    if (instant) y.set(seat(n))
    else animate(y, seat(n), SPRING)
    const box = list.current, el = rows.current[n]
    if (box && el) {
      if (el.offsetTop - TRAY < box.scrollTop) box.scrollTop = el.offsetTop - TRAY
      else if (el.offsetTop + ROW + TRAY > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + ROW + TRAY - box.clientHeight
    }
  }
  useLayoutEffect(() => {
    if (!open) return
    if (list.current) list.current.scrollTop = 0
    go(0, true)
    // Typed fast, the rows can still be settling here; measure again once they're on screen.
    const f = requestAnimationFrame(() => y.set(seat(0)))
    return () => cancelAnimationFrame(f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, place, open, items.length])

  useEffect(() => {
    if (open) {
      setQuery('')
      setPlace(null)
      setDone(false)
      requestAnimationFrame(() => field.current?.focus())
    }
  }, [open])
  useDismiss(open, [panel], close)

  // The light in the field sits under the caret, and fades once your hands stop.
  useLayoutEffect(() => {
    if (!query) return void animate(glow, 0, { duration: 0.3 })
    const to = (mirror.current?.getBoundingClientRect().right ?? 0) - (field.current?.closest('label')?.getBoundingClientRect().left ?? 0)
    animate(beam, to, { type: 'spring', stiffness: 520, damping: 44 })
    glow.set(1)
    const stop = animate(glow, 0, { delay: 0.35, duration: 0.7, ease: 'easeOut' })
    return () => stop.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function fold(p: Place) {
    typed.current = query.length
    setPlace(p)
    setQuery('')
  }
  const pick = (it: Item) => {
    if (!it.id.startsWith('place-')) track('search', { search_term: query.trim().toLowerCase(), item: it.id })
    it.run()
  }
  const keys = (e: KeyboardEvent) => {
    const by = { ArrowDown: 1, ArrowUp: -1 }[e.key]
    if (by && items.length) {
      e.preventDefault()
      go((at + by + items.length) % items.length, e.repeat)
    }
    if (e.key === 'Enter' && items[at]) pick(items[at])
    if (e.key === 'Tab' && items[at]) {
      // Tab takes the ghost. If it was a place, you're now inside it.
      e.preventDefault()
      if (items[at].id.startsWith('place-')) items[at].run()
      else setQuery(items[at].name)
    }
    if (e.key === 'Backspace' && !query && place) {
      e.preventDefault()
      // Backing out hands you the word again, one letter shorter, as if you'd just pressed delete.
      setQuery(place.slice(0, -1).toLowerCase())
      setPlace(null)
    }
  }

  const count = items.length
  const best = items[at]?.name ?? ''
  // The ghost only shows while what you typed really is the start of the word.
  const ghost = query && best.toLowerCase().startsWith(query.toLowerCase()) ? best.slice(query.length) : ''
  const labels = new Set(items.map((i) => i.group).filter(Boolean)).size
  // A long list stops halfway through a row, so you can see there's more.
  const body = count ? (count > VISIBLE ? (VISIBLE + 0.5) * ROW + labels * LABEL + TRAY : count * ROW + labels * LABEL + TRAY * 2) : 72

  return (
    <Layer>
      <AnimatePresence>
        {open && (
          <div className="pointer-events-auto fixed inset-0 z-[60] flex justify-center px-3 pt-[14dvh] sm:pt-[18dvh]">
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.12, ease: [0.2, 0.9, 0.25, 1] }}
              className="pal h-fit w-[500px] max-w-full rounded-[18px] p-[5px] antialiased [box-shadow:0_0_0_.5px_rgb(0_0_0/.08),0_24px_48px_-24px_rgb(0_0_0/.25)]"
              style={{ color: INK, background: 'var(--shell)' }}
            >
              <style>{SKIN}</style>
              <div className="overflow-hidden rounded-[14px] [box-shadow:0_0_0_.5px_var(--rim)]" style={{ background: 'var(--sheet)' }}>
                <div className="px-2 pt-2">
                  <label className="relative flex h-[38px] items-center gap-2 overflow-hidden rounded-[9px] px-2.5" style={{ background: 'var(--field)' }}>
                    <svg viewBox="0 0 16 16" aria-hidden className="size-[14px] shrink-0" fill="none" stroke={SOFT} strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="7" cy="7" r="4.8" />
                      <path d="m10.6 10.6 3 3" />
                    </svg>
                    <AnimatePresence initial={false} mode="popLayout">
                      {place && (
                        <motion.button
                          key={place}
                          type="button"
                          exit={{ opacity: 0, transition: { duration: 0.08 } }}
                          onClick={() => {
                            setPlace(null)
                            field.current?.focus()
                          }}
                          className="h-[22px] shrink-0 rounded-[6px] px-1.5 text-[13.5px] leading-none [animation:pal-chip_220ms_ease-out_both]"
                        >
                          <span>{place.slice(0, typed.current)}</span>
                          <span className="[animation:pal-solid_200ms_ease-out_both]">{place.slice(typed.current)}</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <span className="relative min-w-0 flex-1">
                      <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-[13.5px]">
                        <span ref={mirror} className="invisible">
                          {query}
                        </span>
                        {/* Typing has no delay, so neither does the rest of the word: no fade to blink through. */}
                        <span style={{ color: FAINT }}>{ghost}</span>
                      </span>
                      <input
                        ref={field}
                        role="combobox"
                        aria-label="Search"
                        aria-expanded
                        aria-controls="palette-list"
                        aria-activedescendant={items[at] ? `palette-${items[at].id}` : undefined}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={keys}
                        spellCheck={false}
                        autoComplete="off"
                        placeholder={place ? '' : 'Search'}
                        className="relative w-full bg-transparent text-[16px] outline-none placeholder:text-[var(--p3)] sm:text-[13.5px]"
                      />
                    </span>
                    <motion.span aria-hidden className="absolute bottom-0 left-0 h-px w-32 -translate-x-1/2" style={{ x: beam, opacity: glow, background: 'linear-gradient(90deg,transparent,var(--beam),transparent)' }} />
                  </label>
                </div>

                <motion.div initial={false} animate={{ height: body }} transition={SIZE} className="relative overflow-hidden">
                  <div ref={list} id="palette-list" role="listbox" className="relative h-full overflow-y-auto overscroll-contain px-2 pb-2 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {count > 0 && <motion.div aria-hidden className="absolute inset-x-2 top-0 rounded-[8px]" style={{ y, height: ROW, background: 'var(--sel)' }} />}
                    {items.map((it, i) => {
                      const on = i === at
                      const copied = done && it.id === 'copy'
                      return (
                        <motion.div key={it.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ opacity: { duration: 0.14 }, layout: SIZE }}>
                          {it.group && it.group !== items[i - 1]?.group && (
                            <p className="flex items-end px-2.5 pb-1 text-[12px]" style={{ height: LABEL, color: FAINT }}>
                              {it.group}
                            </p>
                          )}
                          <div
                            ref={(el) => {
                              rows.current[i] = el
                            }}
                            id={`palette-${it.id}`}
                            role="option"
                            aria-selected={on}
                            onPointerMove={(e) => {
                              if (e.clientX === mouse.current.x && e.clientY === mouse.current.y) return
                              mouse.current = { x: e.clientX, y: e.clientY }
                              if (!on) go(i)
                            }}
                            onClick={() => pick(it)}
                            className="relative flex cursor-default items-center gap-2 rounded-[8px] px-2.5"
                            style={{ height: ROW }}
                          >
                            <svg viewBox="0 0 16 16" aria-hidden className="size-[13px] shrink-0" fill="none" stroke={on ? SOFT : FAINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d={it.icon} />
                            </svg>
                            <span className="shrink-0 text-[13.5px]">{copied ? 'Copied' : it.name}</span>
                            <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: FAINT, opacity: on && !copied ? 1 : 0, transition: 'opacity 120ms' }}>
                              {it.note}
                            </span>
                            {it.tag && (
                              <span className="shrink-0 text-[12px]" style={{ color: FAINT }}>
                                {it.tag}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                    {!count && (
                      <div className="grid h-full place-items-center text-center">
                        <p className="text-[13.5px]" style={{ color: SOFT }}>
                          No results for “{query.trim()}”
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
              <div className="flex h-8 items-center justify-between px-3.5 text-[12px]" style={{ color: SOFT }}>
                <span>↑↓ To navigate</span>
                <span>↵ To select</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layer>
  )
}
