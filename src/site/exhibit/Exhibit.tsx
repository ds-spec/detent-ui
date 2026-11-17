'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { BESIDE } from '@/catalog/beside'
import { DEMOS, preloadDemo } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { SIZE } from '@/catalog/sizes'
import { ProPitch } from '@/site/ProPitch'
import { isProComponent } from '@/catalog/pro'
import { track } from '@/site/track'
import { Code as CodeIcon, Expand, Eye, Moon, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { Kbd } from '@/lab/ui/Kbd'
import { Code, warmSource } from '../browser/Code'
import { InspectLayer } from '../browser/Inspect'
import { Fit } from '../Fit'
import { Pager } from '../shell/Pager'
import { Mini } from '../Mini'
import { Footer } from '../Footer'
import { Header } from '../Header'
import { Install } from '../Install'
import { useSite } from '../Providers'
import { BenchProvider } from '../bench/state'
import { ProTag } from '../blocks/ProTag'
import { Beside } from './Beside'
import { MoreLike } from '../library/Library'
import { Rail } from './Rail'
import { Shell, Trail, scroller } from '../shell/Shell'
import { BTN, useSideNew } from '../shell/side'
import type { RailGroup } from './Rail'
import { CategoryIcon } from '../icons'
import { wellOf } from '../wells'
import type { Tone } from '../home/lights'

if (typeof window !== 'undefined') preloadDemo(location.pathname.split('/')[2] ?? '')

const FAMILY_TONE: Record<string, Tone> = { agents: 'blue', data: 'amber', inputs: 'rose', feedback: 'violet', essentials: 'violet', overlays: 'rose', marketing: 'amber' }

const ease = [0.2, 0.9, 0.25, 1] as const
const lift = { type: 'spring', stiffness: 380, damping: 40 } as const
const glide = { type: 'spring', stiffness: 360, damping: 40 } as const

const STAGE_PAD = 48
const SCALED = new Set(['prompt'])

const HOLDS_HEIGHT = new Set(['checklist', 'readalong', 'secret', 'halo', 'slices', 'dotlight'])

const first = (s: string) => s.split(/(?<=\.)\s/)[0]
const open = (id: string) => {
  track('open_full', { item: id })
  window.open(`/full/components/${id}`, '_blank', 'noopener')
}

const RAIL: RailGroup[] = CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  icon: <CategoryIcon name={c.icon} size={12} />,
  color: `var(--${c.id})`,
  items: ENTRIES.filter((x) => x.category === c.id).map((x) => ({ id: x.id, name: x.name, line: x.short ?? first(x.line), pro: isProComponent(x.id) })),
})).filter((g) => g.items.length)

function peek(id: string, onReady: () => void, big = false) {
  const x = ENTRIES.find((e) => e.id === id)
  const Demo = DEMOS[id]
  if (!x || !Demo) return null
  return (
    <div className="absolute inset-0" style={{ background: wellOf(FAMILY_TONE[x.category] ?? 'blue') }}>
      <Mini pad={big ? 72 : 14} max={big ? 1 : 0.55} onReady={onReady}>
        {x.bleed && SIZE[id] ? (
          <div className="relative" style={{ width: SIZE[id][0], height: SIZE[id][1] }}>
            <Demo />
          </div>
        ) : (
          <Demo />
        )}
      </Mini>
    </div>
  )
}

export function Exhibit({ children }: { children: ReactNode }) {
  const at = usePathname().split('/')[2] ?? ''
  if (ENTRIES.some((e) => e.id === at)) return <Shown at={at}>{children}</Shown>
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

function Shown({ at, children }: { at: string; children: ReactNode }) {
  const router = useRouter()
  const [want, setWant] = useState<string | null>(null)
  const [urlSeen, setUrlSeen] = useState(at)
  if (urlSeen !== at) {
    setUrlSeen(at)
    if (want === at) setWant(null)
  }
  const id = want ?? at
  const i = ENTRIES.findIndex((e) => e.id === id)
  const { tick } = useSite()
  const [run, setRun] = useState(0)
  const [inspect, setInspect] = useState(false)
  const page = useTheme()
  const stage = useRef<HTMLElement>(null)
  const [tall, setTall] = useState<{ id: string; height: number } | null>(null)
  const demoHeight = tall?.id === id ? tall.height : null
  const onDemoHeight = useCallback(
    (height: number | null) => setTall((was) => (height === null ? null : was?.id === id && was.height >= height ? was : { id, height })),
    [id],
  )
  const [view, setView] = useState({ id, mode: 'preview' as 'preview' | 'code', theme: null as 'light' | 'dark' | null })
  const mode = view.id === id ? view.mode : 'preview'
  const stageTheme = view.id === id ? view.theme : null
  const setMode = (m: 'preview' | 'code') => setView({ id, mode: m, theme: stageTheme })
  const setStageTheme = (t: 'light' | 'dark' | null) => setView({ id, mode, theme: t })

  const [seen, setSeen] = useState(i)
  const [dir, setDir] = useState(1)
  if (seen !== i) {
    const d = i - seen
    setSeen(i)
    setDir(Math.abs(d) > ENTRIES.length / 2 ? -Math.sign(d) : Math.sign(d) || 1)
  }
  useLayoutEffect(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (location.hash || (entry?.type === 'reload' && entry.name === location.href)) return
    const undo = () => {
      const panel = scroller()
      if (panel) panel.scrollTop = 0
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    undo()
    queueMicrotask(undo)
    const frame = requestAnimationFrame(() => requestAnimationFrame(undo))
    const t = setTimeout(undo, 120)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(t)
    }
  }, [])
  const last = useRef(i)
  useEffect(() => {
    if (last.current === i) return
    last.current = i
    tick()
    const panel = scroller()
    if (panel && panel.scrollTop > 80) panel.scrollTo({ top: 0, behavior: 'smooth' })
    else if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [i, tick])

  const e = ENTRIES[i]
  const prev = ENTRIES[(i - 1 + ENTRIES.length) % ENTRIES.length]
  const next = ENTRIES[(i + 1) % ENTRIES.length]
  const family = CATEGORIES.find((c) => c.id === e.category)!
  const Demo = DEMOS[e.id]
  const shown = stageTheme ?? page
  const need = SIZE[e.id] ? Math.ceil(SIZE[e.id][1] * 0.9 + STAGE_PAD * 2 + 64) : 0
  const phone = HOLDS_HEIGHT.has(e.id) ? `${SIZE[e.id][1] + 48 + 64}px` : SIZE[e.id] ? `max(380px, calc(min(${SIZE[e.id][1]}px, (100vw - ${40 + STAGE_PAD * 2}px) * ${(SIZE[e.id][1] / SIZE[e.id][0]).toFixed(4)}) + ${STAGE_PAD * 2 + 64}px))` : '520px'

  const go = (to: string) => {
    if (to === id) return
    flushSync(() => setWant(to))
    router.push(`/components/${to}`, { scroll: false })
  }
  useEffect(() => {
    router.prefetch(`/components/${next.id}`)
    router.prefetch(`/components/${prev.id}`)
    const t = setTimeout(() => preloadDemo(next.id), 2000)
    return () => clearTimeout(t)
  }, [router, next.id, prev.id])
  const pro = isProComponent(e.id)
  useEffect(() => {
    if (!pro || !matchMedia('(pointer: coarse)').matches) return
    const t = setTimeout(() => warmSource(e.id), 1500)
    return () => clearTimeout(t)
  }, [pro, e.id])

  const latest = useRef({ go, prev, next })
  useEffect(() => {
    latest.current = { go, prev, next }
  })
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      const t = ev.target instanceof Element ? ev.target : document.body
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.defaultPrevented) return
      if (t.closest('input, textarea, [contenteditable], [role=listbox], [role=tree], [role=slider], [role=spinbutton], [role=dialog], [role=grid], [role=radiogroup]')) return
      const k = ev.key.toLowerCase()
      const { go: to, prev: p, next: n } = latest.current
      if (k === 'arrowright' || k === 'j') to(n.id)
      else if (k === 'arrowleft' || k === 'k') to(p.id)
      else if (k === 'i') setInspect((v) => !v)
      else if (k === 'p') open(id)
      else if (k === 'escape') setInspect(false)
      else return
      ev.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const side = useSideNew()
  return (
    <Shell bare list={<Rail label="Components" groups={RAIL} current={id} onPick={go} preview={peek} />} bar={<Trail steps={['Components', family.name, e.name]} />}>
    <main className="mx-auto max-w-[1280px] px-4 pb-20 sm:px-8 lg:pb-0">
      <div className="pb-6 sm:pb-8">
      <header className="flex flex-col gap-4 pt-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          {side && (
            <p className="mb-2 flex items-center gap-2 text-[13px] text-ink-3">
              {family.name}
              {pro && <ProTag />}
            </p>
          )}
          <h1 className="text-[clamp(32px,3.8vw,48px)] font-normal leading-[1.08] tracking-[-0.045em] text-ink">
            <span className="relative block h-[1.2em] overflow-hidden">
              <Glide k={e.id} dir={dir}>
                {e.name}
              </Glide>
            </span>
          </h1>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1 lg:w-[300px] lg:flex-none">
            <Install id={e.id} free={!pro} bare />
          </div>
        </div>
      </header>

      <BenchProvider key={id}>
      <div className="mt-5 grid gap-3">
      <div className="relative flex h-[var(--stage-phone)] flex-col rounded-[20px] bg-[var(--mount)] max-sm:-mx-3 lg:h-[var(--stage)]" style={{ ['--stage' as string]: demoHeight ? `max(540px, ${demoHeight + 48 + 64}px)` : `max(clamp(540px, calc(100dvh - 290px), 760px), ${need}px)`, ['--stage-phone' as string]: demoHeight ? `${demoHeight + 48 + 64}px` : phone }}>
        <motion.section
          ref={stage}
          layout
          transition={{ layout: lift }}
          data-theme={stageTheme ?? undefined}
          aria-label={`${e.name}, live`}
          className={`absolute inset-x-[5px] bottom-[5px] overflow-hidden ${side ? 'top-[44px]' : 'top-[56px]'} rounded-[15px] text-ink shadow-[0_0_0_.5px_var(--line)]`}
          style={{ background: wellOf(FAMILY_TONE[family.id] ?? 'blue') }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={`${e.id}-${run}`}
              data-inspect-root
              custom={dir}
              className="absolute inset-0"
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 48 }),
                still: { opacity: 1, x: 0 },
                leave: (d: number) => ({ opacity: 0, x: d * -32 }),
              }}
              initial="enter"
              animate="still"
              exit="leave"
              transition={{ duration: 0.28, ease }}
            >
              <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${mode === 'code' ? 'pointer-events-none opacity-0' : ''}`}>
                {e.bleed ? (
                  <div className="absolute inset-0">
                    <Demo />
                  </div>
                ) : (
                  <Fit pad={STAGE_PAD} max={e.zoom ?? 1.25} min={0.62} onPhone={SCALED.has(e.id) ? undefined : onDemoHeight} scale={SCALED.has(e.id)} stage>
                    <Demo />
                  </Fit>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {mode === 'code' && (
              <motion.div key="code" className="absolute inset-0 z-[5]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease }}>
                <Code id={e.id} />
              </motion.div>
            )}
          </AnimatePresence>

          <InspectLayer on={inspect && mode === 'preview'} stage={stage} />
        </motion.section>
        <div className={side ? 'absolute inset-x-[5px] top-[5px] flex h-[34px] items-center justify-between pr-0.5' : 'absolute inset-x-[5px] top-[8px] flex h-[36px] items-center justify-between pl-1'}>
          <span className="flex">
            {side ? <ModesLine mode={mode} setMode={setMode} pro={pro} onWarm={() => warmSource(e.id)} /> : <Modes mode={mode} setMode={setMode} pro={pro} onWarm={() => warmSource(e.id)} />}
          </span>
          <span className="flex items-center gap-0.5">
            <Tool small={side} label="Replay" onClick={() => setRun((r) => r + 1)}>
              <motion.span key={run} className="flex" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                <Refresh size={side ? 15 : 16} />
              </motion.span>
            </Tool>
            {!side && (
              <Tool small={side} label={shown === 'dark' ? 'View in light' : 'View in dark'} onClick={() => setStageTheme(stageTheme ? null : page === 'dark' ? 'light' : 'dark')}>
              {shown === 'dark' ? <Sun size={side ? 15 : 16} /> : <Moon size={side ? 15 : 16} />}
            </Tool>
            )}
            <Tool small={side} className="hidden sm:block" label="Full screen" keys="P" onClick={() => open(e.id)}>
              <Expand size={side ? 15 : 16} />
            </Tool>
          </span>
        </div>
      </div>

      {pro && <ProPitch id={e.id} near />}

      <div className="contents" style={{ visibility: id === at ? undefined : 'hidden' }}>
        {children}
      </div>
      </div>
      </BenchProvider>

      {e.keys && (
        <section aria-labelledby="keys" className={side ? 'mt-12' : 'mt-12 sm:mt-16'}>
          {side ? (
            <h2 id="keys" className="text-[18px] font-medium tracking-[-0.015em] text-ink">Keyboard</h2>
          ) : (
            <h2 id="keys" className="px-1 text-[clamp(22px,2vw,28px)] font-normal tracking-[-0.035em] text-ink">
              Keyboard <span className="text-quiet">it answers to.</span>
            </h2>
          )}
          <dl className={side ? 'mt-4 grid gap-x-10 shadow-[inset_0_1px_0_var(--line)] sm:grid-cols-2' : 'mt-5 grid gap-x-8 rounded-[22px] bg-surface px-6 py-2 shadow-[var(--card-edge)] sm:grid-cols-2'}>
            {e.keys.map(([k, what]) => (
              <div key={k + what} className={side ? 'flex items-center justify-between gap-4 py-3.5 shadow-[inset_0_-1px_0_var(--line)]' : 'flex items-center justify-between gap-4 py-3 shadow-[inset_0_1px_0_var(--line)] first:shadow-none sm:[&:nth-child(2)]:shadow-none'}>
                <dd className={side ? 'text-[14px] text-ink-2' : 'text-callout text-ink-2'}>{what}</dd>
                <dt className="flex shrink-0 gap-1">
                  {k.split(' ').map((part, j) => (
                    <Kbd key={j}>{part}</Kbd>
                  ))}
                </dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {BESIDE[e.id] && <Beside key={`beside-${e.id}`} id={BESIDE[e.id]} />}

      {!pro && <ProPitch id={e.id} />}

      <MoreLike key={`more-${e.id}`} shelf="components" id={e.id} />

      <Pager prev={{ name: prev.name, href: prev.id }} next={{ name: next.name, href: next.id }} onPick={go} />

      </div>
    </main>
    </Shell>
  )
}

function Glide({ k, dir = 1, delay = 0, wrap = false, children }: { k: string; dir?: number; delay?: number; wrap?: boolean; children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false} custom={dir}>
      <motion.span
        key={k}
        className={wrap ? 'block lg:truncate xl:overflow-visible xl:whitespace-normal' : 'block truncate'}
        custom={dir}
        variants={{
          in: (d: number) => ({ x: d * 56, opacity: 0 }),
          at: { x: 0, opacity: 1, transition: { x: { ...glide, delay }, opacity: { duration: 0.28, delay: delay + 0.06 } } },
          out: (d: number) => ({ x: d * -40, opacity: 0, transition: { x: glide, opacity: { duration: 0.14 } } }),
        }}
        initial="in"
        animate="at"
        exit="out"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}

export function Rule() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-line-strong" />
}

export function Tool({ label, keys, on, onClick, children, className = '', small = false }: { label: string; keys?: string; on?: boolean; onClick: () => void; children: ReactNode; className?: string; /** Quiet, square-ish, the sidebar's grey: for the new page. */ small?: boolean }) {
  const [tip, setTip] = useState(false)
  return (
    <span className={`relative ${className}`} onPointerEnter={() => setTip(true)} onPointerLeave={() => setTip(false)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        aria-label={label}
        aria-pressed={on}
        className={`ring-focus flex items-center justify-center transition-[color,background-color,box-shadow] duration-150 ${small ? 'size-8 rounded-[8px]' : 'size-9 rounded-full'} ${on ? 'bg-plate text-ink shadow-raised' : small ? 'text-ink-3 hover:bg-[var(--shell-hover)] hover:text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
      >
        {children}
      </motion.button>
      <AnimatePresence>
        {tip && (
          <motion.span
            className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 flex h-7 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink pl-3 pr-1.5 text-footnote text-surface shadow-float"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.15 }}
          >
            {label}
            {keys ? <span className="flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-surface/15 px-1 text-caption leading-none">{keys}</span> : <span className="w-1.5" />}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function Modes({ mode, setMode, pro = false, onWarm }: { mode: 'preview' | 'code'; setMode: (m: 'preview' | 'code') => void; /** The code is Pro: a small lock rides beside the word. */ pro?: boolean; /** The hand is heading for Code: fetch it now. */ onWarm?: () => void }) {
  const id = useId()
  return (
    <span role="radiogroup" aria-label="Show" className="flex h-9 items-center">
      {(['preview', 'code'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          onPointerEnter={m === 'code' ? onWarm : undefined}
          onPointerDown={m === 'code' ? onWarm : undefined}
          className={`ring-focus relative h-9 rounded-full px-4 text-footnote font-medium capitalize transition-[color,transform] duration-200 active:scale-[0.97] ${mode === m ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {mode === m && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-plate shadow-raised" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span className="relative flex items-center gap-1.5">
            {m}
            {m === 'code' && pro && (
              <svg aria-label="Pro" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
                <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
              </svg>
            )}
          </span>
        </button>
      ))}
    </span>
  )
}

export function ModesLine({ mode, setMode, pro = false, onWarm }: { mode: 'preview' | 'code'; setMode: (m: 'preview' | 'code') => void; pro?: boolean; onWarm?: () => void }) {
  const id = useId()
  return (
    <span role="radiogroup" aria-label="Show" className={`flex h-[34px] items-center rounded-[11px] p-[3px] ${BTN.track}`}>
      {(['preview', 'code'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          onPointerEnter={m === 'code' ? onWarm : undefined}
          onPointerDown={m === 'code' ? onWarm : undefined}
          className={`ring-focus relative flex h-full items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium capitalize transition-[color,transform] duration-150 active:scale-[0.97] ${mode === m ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {mode === m && <motion.span layoutId={id} className={`absolute inset-0 rounded-[8px] ${BTN.plate}`} transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
          <span className="relative flex items-center gap-1.5">
            {m === 'preview' ? <Eye size={13} /> : <CodeIcon size={13} />}
            {m}
            {m === 'code' && pro && <span className="text-[10.5px] font-normal text-ink-3">Pro</span>}
          </span>
        </button>
      ))}
    </span>
  )
}
