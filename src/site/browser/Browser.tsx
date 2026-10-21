'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { Kbd } from '@/lab/ui/Kbd'
import { Footer } from '../Footer'
import { Header } from '../Header'
import { useSite } from '../Providers'
import { ShellContext } from './shell'
import { View } from './View'

const spring = { type: 'spring', stiffness: 520, damping: 42 } as const

/**
 * The components page: a quiet index on the left and one component at a time, large, on
 * the right, with its notes below the fold. A small mark glides down the index to whatever
 * is open, ↑ ↓ browse from anywhere, / searches, P lifts the stage to fill the screen, and I inspects.
 */
export function Browser({ children }: { children: ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const id = path.split('/')[2] ?? ''
  const index = ENTRIES.findIndex((e) => e.id === id)
  const [present, setPresent] = useState(false)
  const [inspect, setInspect] = useState(false)

  // Which way we moved through the list, so the stage can slide the right way. Each move clicks, if sound is on.
  const { tick, openSearch } = useSite()
  const last = useRef(index)
  const [dir, setDir] = useState(1)
  useEffect(() => {
    if (index < 0 || index === last.current) return
    setDir(index >= last.current ? 1 : -1)
    last.current = index
    tick()
    // Reading the notes and moving on brings the new component back into view.
    if (window.scrollY > 120) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [index, tick])

  // Presenting holds the page still behind the stage.
  useEffect(() => {
    document.documentElement.style.overflow = present ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [present])

  const go = (i: number) => {
    const e = ENTRIES[(i + ENTRIES.length) % ENTRIES.length]
    router.push(`/components/${e.id}`, { scroll: false })
  }

  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      const t = ev.target instanceof Element ? ev.target : document.body
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.defaultPrevented) return
      if (ev.key === '/' && !t.closest('input, textarea, [contenteditable]')) {
        ev.preventDefault()
        setPresent(false)
        openSearch()
        return
      }
      // Never take keys from fields or from components that use them.
      if (t.closest('input, textarea, [contenteditable], [role=listbox], [role=tree], [role=slider], [role=spinbutton], [role=dialog], [role=grid], [role=radiogroup]')) return
      const k = ev.key.toLowerCase()
      if (k === 'arrowdown' || k === 'arrowright' || k === 'j') go(index + 1)
      else if (k === 'arrowup' || k === 'arrowleft' || k === 'k') go(index - 1)
      else if (k === 'p') setPresent((p) => !p)
      else if (k === 'i') setInspect((v) => !v)
      else if (k === 'escape' && present) setPresent(false)
      else if (k === 'escape' && inspect) setInspect(false)
      else return
      ev.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, present, inspect, openSearch])

  const shell = useMemo(() => ({ present, setPresent, inspect, setInspect, dir }), [present, inspect, dir])

  return (
    <ShellContext.Provider value={shell}>
      <Header />
      <Strip id={id} />
      <div className="mx-auto grid max-w-[1360px] gap-10 px-5 sm:px-6 lg:grid-cols-[176px_minmax(0,1fr)]">
        <Index id={id} />
        <main className="min-w-0 pt-2">
          {index >= 0 && <View id={id} />}
          {children}
        </main>
      </div>
      <Footer />
    </ShellContext.Provider>
  )
}

/** Every component by family, in small type. A short mark glides to the open one and its name steps in beside it. */
function Index({ id }: { id: string }) {
  const mark = useId()
  const nav = useRef<HTMLElement>(null)
  // Keep the open component in view inside the index (never by scrolling the page).
  useEffect(() => {
    const box = nav.current
    const el = box?.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!box || !el) return
    const top = el.offsetTop
    if (top < box.scrollTop + 24) box.scrollTo({ top: top - 24, behavior: 'smooth' })
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight - 56) box.scrollTo({ top: top + el.offsetHeight - box.clientHeight + 56, behavior: 'smooth' })
  }, [id])

  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] flex-col lg:flex">
      <nav
        ref={nav}
        aria-label="Components"
        className="relative min-h-0 flex-1 overflow-y-auto pb-12 pt-2"
        style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent, #000 12px, #000 calc(100% - 56px), transparent)' }}
      >
        {CATEGORIES.map((c) => {
          const items = ENTRIES.filter((e) => e.category === c.id)
          if (!items.length) return null
          return (
            <div key={c.id} className="mt-7 first:mt-2">
              <p className="pb-1.5 text-caption font-medium text-ink-3">{c.name}</p>
              {items.map((e) => {
                const on = e.id === id
                return (
                  <Link
                    key={e.id}
                    href={`/components/${e.id}`}
                    scroll={false}
                    aria-current={on ? 'page' : undefined}
                    data-id={e.id}
                    className={`ring-focus relative flex h-[30px] items-center rounded-[6px] text-callout transition-colors duration-200 ${on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
                  >
                    {on && <motion.span layoutId={mark} aria-hidden className="absolute left-0 top-[14px] h-[1.5px] w-2 rounded-full bg-ink" transition={spring} />}
                    <motion.span className="truncate" initial={false} animate={{ x: on ? 16 : 0 }} transition={spring}>
                      {e.name}
                    </motion.span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-6 pt-2 text-caption text-ink-3">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          browse
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>P</Kbd>
          present
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>I</Kbd>
          inspect
        </span>
      </p>
    </aside>
  )
}

/** Narrow screens: the index becomes one scrolling line, with the same mark underneath. */
function Strip({ id }: { id: string }) {
  const mark = useId()
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)
    const box = strip.current
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [id])
  return (
    <div
      ref={strip}
      className="flex gap-5 overflow-x-auto px-5 pb-3 sm:px-6 lg:hidden"
      style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 20px), transparent)' }}
    >
      {ENTRIES.map((e) => {
        const on = e.id === id
        return (
          <Link
            key={e.id}
            href={`/components/${e.id}`}
            scroll={false}
            data-id={e.id}
            aria-current={on ? 'page' : undefined}
            className={`ring-focus relative flex h-9 shrink-0 items-center whitespace-nowrap rounded-[6px] text-callout transition-colors duration-200 ${on ? 'text-ink' : 'text-ink-3'}`}
          >
            {e.name}
            {on && <motion.span layoutId={mark} aria-hidden className="absolute inset-x-0 bottom-0.5 h-[1.5px] rounded-full bg-ink" transition={spring} />}
          </Link>
        )
      })}
    </div>
  )
}
