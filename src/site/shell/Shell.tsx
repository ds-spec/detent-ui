'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PLANS, UPGRADE } from '@/catalog/pro'
import { AI_SDK, FIRST_BLOCK, FIRST_COMPONENT } from '@/catalog/site'
import { ArrowRight, Clock, Folder, Layers, Orbit, Search, Sliders, Table } from '@/lab/icons'
import { Rail } from '../exhibit/Rail'
import type { RailGroup } from '../exhibit/Rail'
import { Header } from '../Header'
import { ForPlan } from '../Owned'
import { Mark, ThemeButton } from '../parts'
import { useSite } from '../Providers'
import { SideNext } from './SideNext'
import { BTN, useSideNew } from './side'
import { PanelIcon, STRIP_GAP, STRIP_W, Strip } from './Strip'

const NAV = [
  { href: FIRST_COMPONENT, section: '/components', label: 'Components', icon: <Layers size={16} /> },
  { href: FIRST_BLOCK, section: '/blocks', label: 'Blocks', icon: <Table size={16} /> },
  { href: '/templates', section: '/templates', label: 'Templates', icon: <Folder size={16} /> },
  ...(AI_SDK ? [{ href: '/ai-sdk', section: '/ai-sdk', label: 'AI SDK', icon: <Orbit size={16} /> }] : []),
  { href: '/system', section: '/system', label: 'System', icon: <Sliders size={16} /> },
  { href: '/changelog', section: '/changelog', label: 'Changelog', icon: <Clock size={16} /> },
]

export const scroller = () => document.querySelector<HTMLElement>('[data-scroller]')

export function Shell({ list, bar, children, bare = false }: { list: ReactNode; bar: ReactNode; children: ReactNode; /** The page has the whole window: no sidebar, and the list waits in a drawer behind one button. */ bare?: boolean }) {
  const path = usePathname()
  const { openSearch } = useSite()
  const side = useSideNew()
  const rail = (list as { props?: { groups?: RailGroup[]; current?: string; onPick?: (id: string) => void; preview?: (id: string, onReady: () => void) => ReactNode; label?: string } } | null)?.props
  if (bare && rail?.groups) return <Bare rail={rail as Required<NonNullable<typeof rail>>}>{children}</Bare>
  return (
    <div className="lg:fixed lg:inset-0 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]" style={{ background: 'var(--shell)' }}>
      <div className="lg:hidden">
        <Header />
      </div>

      {side && rail?.groups ? (
        <aside className="hidden h-dvh min-h-0 flex-col pb-3 pl-3 pt-4 lg:flex">
          <SideNext groups={rail.groups} current={rail.current ?? ''} onPick={rail.onPick ?? (() => {})} preview={rail.preview} label={rail.label} />
        </aside>
      ) : (
      <aside className="hidden h-dvh min-h-0 flex-col pb-3 pl-3 pt-4 lg:flex">
        <div className="flex h-10 items-center gap-2 pl-2 pr-3">
          <Link href="/" className="ring-focus -ml-1 flex items-center gap-2.5 rounded-[8px] px-1 py-1">
            <Mark />
            <span className="text-[15px] font-medium tracking-[-0.02em] text-ink">Detent</span>
          </Link>
          <span className="flex-1" />
          <button type="button" onClick={openSearch} data-search aria-label="Search (⌘K)" title="Search  ⌘K" className="ring-focus grid size-8 place-items-center rounded-[8px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-[var(--shell-hover)] hover:text-ink active:scale-[0.97]">
            <Search size={15} />
          </button>
        </div>
        <nav aria-label="Main" className="mt-3 flex flex-col gap-px pr-3">
          {NAV.map((n) => {
            const on = path.startsWith(n.section)
            return (
              <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} className={`ring-focus flex h-8 items-center gap-2.5 rounded-[8px] px-2 text-[13.5px] transition-colors ${on ? 'bg-[var(--shell-on)] text-ink' : 'text-ink-2 hover:bg-[var(--shell-hover)] hover:text-ink active:bg-[var(--shell-on)]'}`}>
                <span className={on ? 'text-ink' : 'text-ink-3'}>{n.icon}</span>
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="my-3 mr-3 h-px bg-[var(--line)]" />
        <div className="flex min-h-0 flex-1 flex-col">{list}</div>
        <ForPlan
          none={
            <Link href="/pro" className="ring-focus group/pro mr-3 mt-2 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12.5px] text-ink-2 transition-colors hover:bg-[var(--shell-hover)] hover:text-ink active:bg-[var(--shell-on)]">
              <span className="rounded-[5px] bg-ink px-1.5 text-[10.5px] font-medium leading-[18px] text-surface">Pro</span>
              Pricing
              <span className="ml-auto text-ink-3">from ${PLANS[0].price}</span>
              <ArrowRight size={12} className="text-ink-3 transition-transform duration-150 group-hover/pro:translate-x-0.5" />
            </Link>
          }
          pro={
            <a href={UPGRADE.href} className="ring-focus group/pro mr-3 mt-2 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12.5px] text-ink-2 transition-colors hover:bg-[var(--shell-hover)] hover:text-ink active:bg-[var(--shell-on)]">
              <span className="rounded-[5px] bg-ink px-1.5 text-[10.5px] font-medium leading-[18px] text-surface">New</span>
              Templates
              <span className="ml-auto text-ink-3">+${UPGRADE.price}</span>
              <ArrowRight size={12} className="text-ink-3 transition-transform duration-150 group-hover/pro:translate-x-0.5" />
            </a>
          }
        />
      </aside>
      )}

      <div className="min-w-0 lg:h-dvh lg:py-2 lg:pr-2">
        <div data-scroller className="relative lg:h-full lg:overflow-y-auto lg:rounded-[18px] lg:[scrollbar-width:thin]" style={{ background: 'var(--panel)', boxShadow: 'var(--panel-edge)' }}>
          <div className={`sticky top-0 z-30 hidden h-[52px] items-center gap-3 px-6 ${side && rail?.groups ? '' : 'lg:flex'}`} style={{ background: 'color-mix(in oklch, var(--panel) 88%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'inset 0 -1px 0 var(--line)' }}>
            {bar}
            <span className="flex-1" />
            <ThemeButton />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

const INDEX_KEY = 'detent.index.v2'
const indexShown = () => {
  try {
    return localStorage.getItem(INDEX_KEY) === 'shown'
  } catch {
    return false
  }
}
const onIndexChange = (on: () => void) => {
  window.addEventListener('storage', on)
  window.addEventListener(INDEX_KEY, on)
  return () => {
    window.removeEventListener('storage', on)
    window.removeEventListener(INDEX_KEY, on)
  }
}
const showIndex = (v: boolean) => {
  try {
    localStorage.setItem(INDEX_KEY, v ? 'shown' : 'hidden')
  } catch {}
  window.dispatchEvent(new Event(INDEX_KEY))
}

function Bare({ rail, children }: { rail: { groups: RailGroup[]; current: string; onPick: (id: string) => void; preview?: (id: string, onReady: () => void) => ReactNode; label?: string }; children: ReactNode }) {
  const { openSearch } = useSite()
  const label = rail.label ?? 'Components'
  const [wide, setWide] = useState(false)
  const shown = useSyncExternalStore(onIndexChange, indexShown, () => false)
  useEffect(() => {
    const m = matchMedia('(min-width: 1024px)')
    const on = () => setWide(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  const tool = 'ring-focus grid size-9 place-items-center rounded-[10px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-[var(--shell-hover)] hover:text-ink active:scale-[0.94]'
  return (
    <div className="lg:fixed lg:inset-0 lg:p-2 lg:transition-[padding] lg:duration-300 lg:[transition-timing-function:cubic-bezier(0.2,0.9,0.25,1)]" style={{ background: 'var(--shell)', paddingLeft: wide && shown ? STRIP_W + STRIP_GAP * 2 : undefined }}>
      <div className="lg:hidden">
        <Header />
      </div>
      <Strip groups={rail.groups} current={rail.current} onPick={rail.onPick} preview={rail.preview} label={label} open={shown} onHide={() => showIndex(false)} />
      <div data-scroller className="relative lg:h-full lg:overflow-y-auto lg:rounded-[18px] lg:[scrollbar-width:thin]" style={{ background: 'var(--panel)', boxShadow: 'var(--panel-edge)' }}>
        <div className="sticky top-0 z-30 hidden h-14 items-center gap-1 px-4 lg:flex" style={{ background: 'var(--panel)', boxShadow: 'inset 0 -1px 0 var(--line)' }}>
          {!shown && (
            <button type="button" onClick={() => showIndex(true)} aria-label="Show the index" title="Show the index" className={`${tool} mr-1`}>
              <PanelIcon />
            </button>
          )}
          <Link href="/" aria-label="Detent home" className="ring-focus flex items-center gap-2 rounded-[8px] px-1.5 py-1">
            <Mark />
            <span className="text-[15px] font-medium tracking-[-0.02em] text-ink">Detent</span>
          </Link>
          <span aria-hidden className="mx-1.5 text-ink-3/50">/</span>
          <Link href={`/${label.toLowerCase()}`} className="ring-focus group/back flex h-9 items-center gap-1.5 rounded-[10px] px-2 text-[14px] text-ink-3 transition-colors hover:bg-[var(--shell-hover)] hover:text-ink">
            {label}
          </Link>
          <span className="flex-1" />
          <button type="button" onClick={openSearch} data-search aria-label="Search (⌘K)" className={tool}>
            <Search size={15} />
          </button>
          <ThemeButton />
          <ForPlan
            none={
              <Link href="/pro" className={`ring-focus ml-1.5 flex h-8 items-center rounded-[9px] px-3 text-[13px] font-medium transition-transform duration-150 active:scale-[0.97] ${BTN.accent}`}>
                Get Pro
              </Link>
            }
            pro={
              <a href={UPGRADE.href} className={`ring-focus ml-1.5 flex h-8 items-center rounded-[9px] px-3 text-[13px] font-medium transition-transform duration-150 active:scale-[0.97] ${BTN.accent}`}>
                {UPGRADE.cta}
              </a>
            }
          />
        </div>
        {children}
      </div>
    </div>
  )
}

export function Trail({ steps }: { steps: ReactNode[] }) {
  return (
    <nav aria-label="You are here" className="flex min-w-0 items-center gap-2 text-[13.5px]">
      {steps.map((s, i) => (
        <span key={i} className="flex min-w-0 items-center gap-2">
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-ink-3/70">
              <path d="M9.5 6l6 6-6 6" />
            </svg>
          )}
          <span className={`truncate ${i === steps.length - 1 ? 'text-ink' : 'text-ink-3'}`}>{s}</span>
        </span>
      ))}
    </nav>
  )
}

export function LinkShell({ label, groups, links, current = '', trail, children }: { label: string; groups: RailGroup[]; links: Record<string, string>; current?: string; trail: ReactNode[]; children: ReactNode }) {
  const router = useRouter()
  const [at, setAt] = useState(current)
  const held = useRef(false)
  const settle = useRef(0)
  const hold = (ms: number) => {
    held.current = true
    clearTimeout(settle.current)
    settle.current = window.setTimeout(() => (held.current = false), ms)
  }

  useEffect(() => {
    const spots = Object.entries(links).filter(([, href]) => href.startsWith('#'))
    const box = scroller()
    if (!spots.length || !box) return
    const on = () => {
      if (held.current) return hold(160)
      const line = box.getBoundingClientRect().top + 160
      let here = spots[0][0]
      for (const [id, href] of spots) {
        const el = document.querySelector(href)
        if (el && el.getBoundingClientRect().top <= line) here = id
      }
      if (box.scrollTop > 0 && box.scrollTop + box.clientHeight >= box.scrollHeight - 2) here = spots[spots.length - 1][0]
      setAt(here)
    }
    on()
    box.addEventListener('scroll', on, { passive: true })
    return () => {
      box.removeEventListener('scroll', on)
      clearTimeout(settle.current)
    }
  }, [links])

  const pick = (id: string) => {
    const href = links[id]
    if (!href) return
    if (!href.startsWith('#')) return router.push(href)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    setAt(id)
    hold(600)
    document.querySelector(href)?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' })
  }

  return (
    <Shell list={<Rail label={label} groups={groups} current={at} onPick={pick} />} bar={<Trail steps={trail} />}>
      {children}
    </Shell>
  )
}
