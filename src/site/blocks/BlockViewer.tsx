'use client'

import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, animate, motion } from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Close, Copy, Expand, Layers, Moon, Node, Note, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { tap } from '@/lab/lib/feel'
import { RollingText } from '@/lab/ui/RollingText'
import { BLOCK_VIEWS } from '@pro'
import { BLOCKS, BLOCK_GROUPS, BLOCK_ORDER, KINDS } from '@/catalog/blocks'
import type { Block } from '@/catalog/blocks'
import { Kbd } from '@/lab/ui/Kbd'
import { Hover } from '@/lab/ui/Hover'
import { Code } from '../browser/Code'
import { Modes, Tool } from '../exhibit/Exhibit'
import { Install } from '../parts'
import { PropRows, PropsSection } from '../PropsTable'
import { isProBlock } from '@/catalog/pro'
import { FreeTag, ProTag } from './ProTag'
import { Rail } from '../exhibit/Rail'
import { Pager } from '../shell/Pager'
import { Shell, Trail } from '../shell/Shell'
import type { RailGroup } from '../exhibit/Rail'
import { Backdrop, Window } from './Studio'

/** Widths the frame clicks into as you drag it: the sizes a screen most often meets. */
const DETENTS = [
  { w: 390, name: 'Phone' },
  { w: 768, name: 'Tablet' },
  { w: 1024, name: 'Laptop' },
]
const MIN = 340
const SNAP = 14
const settle = { type: 'spring', stiffness: 460, damping: 44 } as const

const first = (s: string) => s.split(/(?<=\.)\s/)[0]

/** Every block for the list down the side, kind by kind. */
const KIND_LOOK = { app: { icon: <Layers size={12} />, color: 'var(--data)' }, flow: { icon: <Node size={12} />, color: 'var(--agents)' }, section: { icon: <Note size={12} />, color: 'var(--marketing)' } } as const
const RAIL: RailGroup[] = BLOCK_GROUPS.filter((g) => g.items.length).map((g) => ({ id: g.k, name: `${KINDS[g.k]}s`, ...KIND_LOOK[g.k], items: g.items.map((b) => ({ id: b.id, name: b.name, line: b.short, pro: isProBlock(b.id), free: !isProBlock(b.id) })) }))

/**
 * A block on its desk. The frame is the block's container, and the block sizes itself by it,
 * so dragging the handle shows the real responsive behaviour, not a scaled picture. The ruler
 * above clicks into the common widths, the way the library's name says things should.
 */
export function BlockViewer({ id }: { id: string }) {
  const b = BLOCKS.find((x) => x.id === id)!
  // Previous and next follow the order the site lists them in.
  const at = BLOCK_ORDER.indexOf(b)
  const router = useRouter()
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const [run, setRun] = useState(0)
  const [present, setPresent] = useState(false)
  const page = useTheme()
  const [stageTheme, setStageTheme] = useState<'light' | 'dark' | null>(null)
  const shown = stageTheme ?? page

  useEffect(() => {
    if (!present) return
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setPresent(false)
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [present])

  const prev = BLOCK_ORDER[(at - 1 + BLOCK_ORDER.length) % BLOCK_ORDER.length]
  const next = BLOCK_ORDER[(at + 1) % BLOCK_ORDER.length]

  // ← and → walk through the blocks, unless a field, the frame's handle or the block itself has the keys.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || present) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const t = e.target as HTMLElement
      if (t.closest?.('input, textarea, select, [contenteditable], [role="slider"], [role="radiogroup"], [role="listbox"], [data-desk]')) return
      router.push(`/blocks/${(e.key === 'ArrowLeft' ? prev : next).id}`)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [router, prev, next, present])

  return (
    <Shell list={<Rail label="Blocks" groups={RAIL} current={b.id} onPick={(to) => router.push(`/blocks/${to}`)} />} bar={<Trail steps={['Blocks', `${KINDS[b.kind]}s`, b.name]} />}>
    <main className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-8 lg:pb-16">
      <header className="pt-8 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[13px] text-ink-2">{KINDS[b.kind]}</span>
          {isProBlock(b.id) ? <ProTag /> : <FreeTag />}
          <span className="lg:hidden">
            <Switcher current={b.id} prev={prev} next={next} />
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="min-w-0 text-[clamp(36px,4vw,56px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
            {b.name}
            <span className="block text-quiet">{b.short}</span>
          </h1>
          <div className="w-full shrink-0 sm:w-[400px] lg:w-[460px]">
            <Install id={b.id} free={!isProBlock(b.id)} />
          </div>
        </div>
      </header>

      {/* Above the desk, quietly: what you're looking at on the left, three small tools on the right. */}
      <div className="relative mt-8">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex rounded-full bg-surface-2 p-1">
            <Modes mode={mode} setMode={setMode} pro={isProBlock(b.id)} />
          </span>
          <span className="flex items-center gap-0.5">
            <Tool label="Replay" onClick={() => setRun((r) => r + 1)}>
              <motion.span key={run} className="flex" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                <Refresh size={16} />
              </motion.span>
            </Tool>
            <Tool label={shown === 'dark' ? 'View in light' : 'View in dark'} onClick={() => setStageTheme(stageTheme ? null : page === 'dark' ? 'light' : 'dark')}>
              {shown === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Tool>
            <Tool className="hidden sm:block" label="Full screen" keys="Esc" onClick={() => setPresent(true)}>
              <Expand size={16} />
            </Tool>
          </span>
        </div>
        <Desk title={b.window} chrome={b.chrome} run={run} mode={mode} theme={stageTheme} present={present} onExit={() => setPresent(false)} view={<Live id={b.id} />} code={<Code id={b.id} />} />
      </div>

      <Props b={b} />

      {/* The way on: the blocks either side, small enough to pass, plain enough to press. */}
      <nav aria-label="More blocks" className="mt-28 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Neighbour b={prev} dir="prev" />
        <Neighbour b={next} dir="next" />
      </nav>
      {!present && <Pager prev={{ name: prev.name, href: `/blocks/${prev.id}` }} next={{ name: next.name, href: `/blocks/${next.id}` }} />}
    </main>
    </Shell>
  )
}

/* ───────────────────────────── Switcher ───────────────────────────── */

/**
 * Previous, every block, next, by the title: as quiet as the component pages' own, an arrow
 * either side of "All blocks" and no frame around them. "/" opens the list, grouped the way the
 * Blocks page groups it, with the one you're on in view.
 */
function Switcher({ current, prev, next }: { current: string; prev: Block; next: Block }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setOpen(false)
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', down)
    // The one you're on, in view as the list opens.
    const menu = list.current
    const on = menu?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (menu && on) menu.scrollTop += on.getBoundingClientRect().top - menu.getBoundingClientRect().top - (menu.clientHeight - on.offsetHeight) / 2
    return () => window.removeEventListener('pointerdown', down)
  }, [open])
  return (
    <div ref={box} className="relative flex items-center gap-0.5">
      <Step b={prev} dir="prev" />
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className={`ring-focus flex h-8 items-center gap-2 rounded-full pl-3 pr-1.5 text-footnote transition-colors ${open ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:bg-surface-2 hover:text-ink'}`}
      >
        All blocks
        <Kbd>/</Kbd>
      </button>
      <Step b={next} dir="next" />
      <AnimatePresence>
        {open && (
          <motion.div
            ref={list}
            role="listbox"
            aria-label="Blocks"
            className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-[min(460px,70vh)] w-[280px] overflow-y-auto rounded-[16px] bg-surface p-1.5 shadow-modal [scrollbar-width:thin]"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 38 }}
            style={{ transformOrigin: 'top right' }}
          >
            <Hover radius={9} className="flex flex-col">
              {BLOCK_GROUPS.map(({ k, items }) => (
                <div key={k} className="flex flex-col">
                  <p className="flex h-8 items-end px-2.5 pb-1.5 text-caption text-ink-3">
                    {KINDS[k]}s <span className="tnum ml-1.5">{items.length}</span>
                  </p>
                  {items.map((x) => (
                    <Link key={x.id} href={`/blocks/${x.id}`} role="option" aria-selected={x.id === current} data-row onClick={() => setOpen(false)} className="ring-focus relative flex h-9 items-center gap-3 rounded-[9px] px-2.5">
                      <span className={`min-w-0 flex-1 truncate text-footnote ${x.id === current ? 'font-medium text-ink' : 'text-ink-2'}`}>{x.name}</span>
                      {x.id === current && <Check size={14} className="shrink-0 text-ink" />}
                    </Link>
                  ))}
                </div>
              ))}
            </Hover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** An arrow to the next or previous block, naming it under the pointer. */
function Step({ b, dir }: { b: Block; dir: 'prev' | 'next' }) {
  const [tip, setTip] = useState(false)
  return (
    <span className="relative" onPointerEnter={() => setTip(true)} onPointerLeave={() => setTip(false)}>
      <Link href={`/blocks/${b.id}`} aria-label={`${dir === 'prev' ? 'Previous' : 'Next'} block: ${b.name}`} className="ring-focus flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
        {dir === 'prev' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
      </Link>
      <AnimatePresence>
        {tip && (
          <motion.span
            className={`pointer-events-none absolute top-[calc(100%+8px)] z-30 flex h-7 items-center gap-2 whitespace-nowrap rounded-full bg-ink pl-3 pr-1.5 text-footnote text-surface shadow-float ${dir === 'prev' ? 'left-0' : 'right-0'}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.15 }}
          >
            {b.name}
            <kbd className="flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-[color-mix(in_oklch,var(--surface)_18%,transparent)] px-1 font-sans text-caption">{dir === 'prev' ? '←' : '→'}</kbd>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/** The block either side, at the foot of the page: its name and what it is, and an arrow that leans the way you'd go. */
function Neighbour({ b, dir }: { b: Block; dir: 'prev' | 'next' }) {
  const back = dir === 'prev'
  return (
    <Link
      href={`/blocks/${b.id}`}
      className={`ring-focus group/n flex items-center gap-4 rounded-[18px] p-5 shadow-[inset_0_0_0_1px_var(--line)] transition-[background-color,box-shadow] duration-200 hover:bg-[color-mix(in_oklch,var(--accent)_5%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_30%,transparent)] ${back ? '' : 'flex-row-reverse text-right'}`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 transition-[transform,color,background-color] duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] group-hover/n:bg-accent group-hover/n:text-white ${back ? 'group-hover/n:-translate-x-1' : 'group-hover/n:translate-x-1'}`}
      >
        {back ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-caption text-ink-3">
          {back ? 'Previous' : 'Next'} · {KINDS[b.kind]}
        </span>
        <span className="mt-0.5 block truncate text-title text-ink">{b.name}</span>
        <span className="block truncate text-footnote text-ink-3">{first(b.line)}</span>
      </span>
    </Link>
  )
}

/* ───────────────────────────── Props ───────────────────────────── */

const isEvent = (p: { type: string }) => p.type.includes('=>')
/** The names a callback is called with, read from its type: `(conversation: Conversation, text: string) => void` gives "conversation, text". */
const argsOf = (type: string) => [...type.split('=>')[0].matchAll(/(\w+)\s*:/g)].map((m) => m[1]).join(', ')
/** What's worth showing first in the usage: your records (arrays and maps) before plain copy. */
const weight = (p: { type: string }) => (/\[\]|Record<|\{/.test(p.type) ? 0 : 1)

/**
 * The wiring, as you'd write it: the block with your data passed in and your handlers, the way a
 * real app uses it. The data are the records it shows; the handlers are what it tells you.
 */
function Usage({ b }: { b: Block }) {
  const data = b.props.filter((p) => !isEvent(p)).sort((x, y) => weight(x) - weight(y)).slice(0, 3)
  const events = b.props.filter(isEvent).slice(0, 3)
  const lines = [...data.map((p) => `  ${p.name}={${p.name}}`), ...events.map((p) => `  ${p.name}={(${argsOf(p.type)}) => {}}`)]
  const text = lines.length ? `<${b.component}\n${lines.join('\n')}\n/>` : `<${b.component} />`
  const [copied, setCopied] = useState(false)
  return (
    <div className="overflow-hidden rounded-[14px] bg-surface-2">
      <div className="flex h-10 items-center justify-between pl-4 pr-1.5 shadow-[inset_0_-1px_0_var(--line)]">
        <span className="text-caption text-ink-3">Usage</span>
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy usage'}
          onClick={() => {
            navigator.clipboard?.writeText(text).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          }}
          className="ring-focus grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface hover:text-ink"
        >
          <span className={`col-start-1 row-start-1 transition-opacity ${copied ? 'opacity-0' : ''}`}>
            <Copy size={14} />
          </span>
          <span className={`col-start-1 row-start-1 text-accent transition-opacity ${copied ? '' : 'opacity-0'}`}>
            <Check size={14} />
          </span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-ink-2 [scrollbar-width:thin]" translate="no">
        {text}
      </pre>
    </div>
  )
}

/**
 * Wiring the block into an app, grouped by job rather than listed as an API: what you pass in, what
 * it tells you back, and the three every block shares in one line. The source is yours, so this is
 * only what connects it; everything else you change in the file.
 */
function Props({ b }: { b: Block }) {
  const data = b.props.filter((p) => !isEvent(p)).sort((x, y) => weight(x) - weight(y))
  const events = b.props.filter(isEvent)
  return (
    <PropsSection className="mt-6" title="Wire it up" blurb="All optional. With none, it plays exactly as it does here and hands over to whoever touches it.">
      <div className="px-6 pb-5">
        <Usage b={b} />
      </div>
      {data.length > 0 && <PropRows list={data} title="Your data" />}
      {events.length > 0 && (
        <div className={data.length ? 'shadow-[inset_0_1px_0_var(--line)]' : ''}>
          <PropRows list={events} title="What it tells you" />
        </div>
      )}
      <p className="px-6 py-4 text-footnote leading-[1.6] text-ink-3 shadow-[inset_0_1px_0_var(--line)]">
        Every block also takes <code className="font-mono text-ink-2">accent</code>, the one colour everything in it derives from; <code className="font-mono text-ink-2">autoplay</code>, which plays the demo until someone touches it; and <code className="font-mono text-ink-2">className</code>.
      </p>
    </PropsSection>
  )
}

/**
 * Screens of one product that are sold as separate blocks: pressing a page in one's sidebar opens
 * the block that is that page, so on the site they read as one app.
 */
const LINKED: Record<string, Record<string, string>> = {
  analytics: { Conversations: 'data-table' },
  'data-table': { Overview: 'analytics' },
}

/** The block itself, kept out of the viewer's renders: dragging the frame only resizes its box. */
const Live = memo(function Live({ id }: { id: string }) {
  const router = useRouter()
  const View = BLOCK_VIEWS[id] as ComponentType<{ onNavigate?: (page: string) => void }>
  const links = LINKED[id]
  return links ? <View onNavigate={(page) => links[page] && router.push(`/blocks/${links[page]}`, { scroll: false })} /> : <View />
})

/**
 * The desk: a backdrop, a ruler, and whatever it shows in a window you can resize, from a phone's
 * width to the desk's. Blocks and templates both sit on it. `view` is what runs in the window and
 * `code` what the Code tab shows.
 */
export function Desk({ title, chrome, run, mode, theme, present, onExit, view, code }: { title: string; chrome?: 'app' | 'titled' | 'browser'; run: number; mode: 'preview' | 'code'; theme: 'light' | 'dark' | null; present: boolean; onExit: () => void; view: ReactNode; code: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [max, setMax] = useState(0)
  // null follows the desk: the frame is as wide as there's room for.
  const [w, setW] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const glide = useRef<AnimationPlaybackControls | null>(null)

  useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    const read = () => setMax(el.clientWidth)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
    // Leaving full screen brings a new track to measure.
  }, [present])

  const width = w === null ? max : Math.min(w, max)
  const stops = DETENTS.filter((d) => d.w < max - 40)
  const atStop = (v: number) => (Math.abs(v - max) < 1 ? 'full' : (stops.find((d) => Math.abs(d.w - v) < 1)?.name ?? null))
  const here = atStop(width)

  const to = (target: number | null) => {
    glide.current?.stop()
    const end = target ?? max
    if (end === width) return setW(target)
    tap()
    glide.current = animate(width, end, { ...settle, onUpdate: (v) => setW(v), onComplete: () => setW(target) })
  }

  // Drag the handle: the frame follows, and clicks into a detent when it passes close to one.
  const drag = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault()
    glide.current?.stop()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const x0 = e.clientX
    const w0 = width
    let last = here
    setDragging(true)
    const move = (ev: PointerEvent) => {
      const raw = Math.max(MIN, Math.min(max, w0 + ev.clientX - x0))
      const near = raw > max - SNAP ? max : stops.find((d) => Math.abs(d.w - raw) < SNAP)?.w
      const v = near ?? Math.round(raw)
      const now = atStop(v)
      if (now && now !== last) tap()
      last = now
      setW(v >= max ? null : v)
    }
    const up = () => {
      setDragging(false)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  const key = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 100 : 10
    if (e.key === 'ArrowLeft') to(Math.max(MIN, Math.round(width - step)))
    else if (e.key === 'ArrowRight') to(width + step >= max ? null : Math.round(width + step))
    else if (e.key === 'Home') to(MIN)
    else if (e.key === 'End') to(null)
    else return
    e.preventDefault()
  }

  // Full screen is the block alone: no backdrop, no window, no ruler, edge to edge on the page's own ground.
  if (present)
    return (
      <motion.div data-theme={theme ?? undefined} className="fixed inset-0 z-50 bg-bg text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <div key={run} className={`h-full transition-opacity duration-300 ${mode === 'code' ? 'pointer-events-none opacity-0' : ''}`}>
          {view}
        </div>
        <AnimatePresence>
          {mode === 'code' && (
            <motion.div key="code" className="absolute inset-0 z-[5] bg-surface" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }} transition={{ duration: 0.3 }}>
              {code}
            </motion.div>
          )}
        </AnimatePresence>
        <ExitFull onExit={onExit} />
      </motion.div>
    )

  return (
    <>
      {/* The desk: the block's own backdrop, a ruler, and the block in a window you can resize. */}
      <div data-desk data-theme={theme ?? undefined} className="relative mt-6 rounded-[32px] px-3 pb-3 pt-3 text-ink sm:px-8 sm:pb-8 sm:pt-0">
        <Backdrop />
        <Ruler max={max} width={width} stops={stops} here={here} onPick={to} />
        <div ref={track} className="relative h-[clamp(560px,calc(100dvh-320px),840px)]">
          {max > 0 && (
            <Window title={title} chrome={chrome} width={width} compact={width < 520}>
              <div key={run} className={`h-full transition-opacity duration-300 ${mode === 'code' ? 'pointer-events-none opacity-0' : ''}`}>
                {view}
              </div>
              <AnimatePresence>
                {mode === 'code' && (
                  <motion.div key="code" className="absolute inset-0 z-[5] bg-surface" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }} transition={{ duration: 0.3 }}>
                    {code}
                  </motion.div>
                )}
              </AnimatePresence>
            </Window>
          )}

          {max > 0 && (
            <button
              type="button"
              role="slider"
              aria-label="Frame width"
              aria-valuemin={MIN}
              aria-valuemax={max}
              aria-valuenow={Math.round(width)}
              aria-valuetext={`${Math.round(width)} pixels${here && here !== 'full' ? `, ${here}` : ''}`}
              onPointerDown={drag}
              onKeyDown={key}
              onDoubleClick={() => to(null)}
              className="ring-focus group/h absolute top-1/2 hidden h-20 w-5 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full sm:flex"
              style={{ left: width + 4 }}
            >
              <span className={`h-12 w-[5px] rounded-full transition-[background-color,height] duration-200 group-hover/h:h-16 group-hover/h:bg-ink-2 ${dragging ? 'h-16 bg-ink' : 'bg-[color-mix(in_oklch,var(--ink)_30%,transparent)]'}`} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * A ruler across the top of the desk: a tick every 50px, the common widths named, and the
 * frame's own width riding along its edge. At a detent the name lights up; between them the
 * width itself shows, and the names it would cover step aside.
 */
function Ruler({ max, width, stops, here, onPick }: { max: number; width: number; stops: typeof DETENTS; here: string | null; onPick: (w: number | null) => void }) {
  const marks = [...stops, ...(max > 0 ? [{ w: max, name: 'Full' }] : [])]
  const free = !here
  const x = Math.min(max - 28, Math.max(28, width))
  return (
    <div className="relative hidden h-12 sm:block">
      {/* Ticks: minor every 50, major every 100, drawn by the background so there are no nodes to lay out. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-2 h-2.5"
        style={{
          backgroundImage: 'repeating-linear-gradient(to right, var(--line-strong) 0 1px, transparent 1px 100px), repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px 50px)',
          backgroundSize: '100% 10px, 100% 5px',
          backgroundPosition: 'left bottom, left bottom',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {marks.map((m) => {
        const on = m.name === 'Full' ? here === 'full' : here === m.name
        const last = m.name === 'Full'
        const covered = free && Math.abs((last ? m.w - 40 : m.w) - x) < 76
        return (
          <span key={m.name}>
            <span aria-hidden className={`absolute bottom-2 h-3.5 w-px transition-colors duration-200 ${on ? 'bg-ink' : 'bg-ink-3/60'}`} style={{ left: m.w - 1 }} />
            <button
              type="button"
              onClick={() => onPick(last ? null : m.w)}
              tabIndex={covered ? -1 : 0}
              className={`ring-focus absolute top-1 flex h-6 items-center gap-1.5 rounded-full px-2 text-caption transition-[color,opacity] duration-200 ${last ? '-translate-x-full' : '-translate-x-1/2'} ${on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'} ${covered ? 'pointer-events-none opacity-0' : ''}`}
              style={{ left: last ? m.w + 8 : m.w }}
            >
              {m.name}
              {!last && <span className="tnum opacity-70">{m.w}</span>}
            </button>
          </span>
        )
      })}
      {/* The frame's edge on the ruler: a solid notch, and its width while it's between detents. */}
      <span aria-hidden className="absolute bottom-1.5 h-4 w-[2px] rounded-full bg-ink" style={{ transform: `translateX(${Math.max(0, width - 1)}px)` }} />
      <span aria-hidden className="pointer-events-none absolute left-0 top-1 flex h-6 -translate-x-1/2 items-center rounded-full bg-ink px-2 text-caption font-medium text-surface transition-opacity duration-150" style={{ left: x, opacity: free ? 1 : 0 }}>
        <RollingText text={String(Math.round(width))} />
      </span>
    </div>
  )
}

/** The way out of full screen: a small pill at the foot, faint until it's pointed at. Escape works too. */
export function ExitFull({ onExit }: { onExit: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onExit}
      className="ring-focus fixed bottom-5 left-1/2 z-[60] flex h-9 -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--sheet)] pl-3 pr-2 text-footnote text-ink-2 shadow-float transition-opacity duration-200 hover:!opacity-100 focus-visible:!opacity-100"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 0.6 }}
      transition={{ delay: 0.2, duration: 0.25 }}
    >
      <Close size={13} /> Exit full screen
      <Kbd>Esc</Kbd>
    </motion.button>
  )
}
