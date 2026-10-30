'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { SIZE } from '@/catalog/sizes'
import { SITE, installCommand, isProComponent } from '@/catalog/pro'
import { Check, Copy, Expand, Moon, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { Kbd } from '@/lab/ui/Kbd'
import { Code } from '../browser/Code'
import { InspectLayer } from '../browser/Inspect'
import { Fit } from '../Fit'
import { Mini } from '../Mini'
import { Footer } from '../Footer'
import { Header } from '../Header'
import { Install } from '../parts'
import { useSite } from '../Providers'
import { BenchProvider } from '../bench/state'
import { ProTag } from '../blocks/ProTag'
import { Index } from './Index'
import { Rail } from './Rail'
import { Shell, Trail, scroller } from '../shell/Shell'
import type { RailGroup } from './Rail'
import { CategoryIcon } from '../icons'
import { ExitFull } from '../blocks/BlockViewer'
import { wellOf } from '../wells'
import type { Tone } from '../home/lights'

/** Each family's light, for the stage a component runs on. */
const FAMILY_TONE: Record<string, Tone> = { agents: 'blue', data: 'amber', inputs: 'rose', feedback: 'violet', essentials: 'violet', overlays: 'rose', marketing: 'amber' }

const ease = [0.2, 0.9, 0.25, 1] as const
const lift = { type: 'spring', stiffness: 380, damping: 40 } as const
const glide = { type: 'spring', stiffness: 360, damping: 40 } as const

/** Components that explain themselves on the stage. The rest stand on their own. */
/** Air around a demo on the stage. */
const STAGE_PAD = 48


const first = (s: string) => s.split(/(?<=\.)\s/)[0]

/** Every component for the list down the side, family by family. */
const RAIL: RailGroup[] = CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  icon: <CategoryIcon name={c.icon} size={12} />,
  color: `var(--${c.id})`,
  items: ENTRIES.filter((x) => x.category === c.id).map((x) => ({ id: x.id, name: x.name, line: x.short ?? first(x.line), pro: isProComponent(x.id) })),
})).filter((g) => g.items.length)

/** A component, small, in its family's well: what the list shows beside a name you point at. */
function peek(id: string, onReady: () => void) {
  const x = ENTRIES.find((e) => e.id === id)
  const Demo = DEMOS[id]
  if (!x || !Demo) return null
  return (
    <div className="absolute inset-0" style={{ background: wellOf(FAMILY_TONE[x.category] ?? 'blue') }}>
      <Mini pad={14} max={0.55} onReady={onReady}>
        <Demo />
      </Mini>
    </div>
  )
}

/**
 * The components page, as an exhibit. One component has the page: a big two-tone title, the
 * live component standing on the page itself, and one floating dock with every tool. The
 * index is a sheet you open, not a sidebar you scroll past, and the page ends on what's next.
 * It's the layout for /components/[slug], so moving between components is one continuous
 * page: the URL changes, nothing reloads.
 */
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

/** The component on show. `children` is the route's own part, its props, which sits under the stage. */
function Shown({ at, children }: { at: string; children: ReactNode }) {
  const router = useRouter()
  // A move shows at once; the URL catches up behind it. Back and forward come in through the URL.
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
  const [present, setPresent] = useState(false)
  const [index, setIndex] = useState(false)
  const page = useTheme()
  const stage = useRef<HTMLElement>(null)
  // The view and the stage's theme belong to one component; moving on starts the next fresh.
  const [view, setView] = useState({ id, mode: 'preview' as 'preview' | 'code', theme: null as 'light' | 'dark' | null })
  const mode = view.id === id ? view.mode : 'preview'
  const stageTheme = view.id === id ? view.theme : null
  const setMode = (m: 'preview' | 'code') => setView({ id, mode: m, theme: stageTheme })
  const setStageTheme = (t: 'light' | 'dark' | null) => setView({ id, mode, theme: t })

  // Which way we moved, so the title and stage travel the same way. Going past either end wraps,
  // and still moves the way you pressed.
  const [seen, setSeen] = useState(i)
  const [dir, setDir] = useState(1)
  if (seen !== i) {
    const d = i - seen
    setSeen(i)
    setDir(Math.abs(d) > ENTRIES.length / 2 ? -Math.sign(d) : Math.sign(d) || 1)
  }
  // Arriving from another page, Next scrolls to this route's own part, the props, which sit below
  // the stage. The component comes first, so arrival starts at the top: of the panel on a laptop,
  // and of the page on anything smaller. A reload or a link to a part stays where it's going.
  useEffect(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (location.hash || entry?.type === 'reload') return
    const panel = scroller()
    if (panel) panel.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  // Each move clicks, if sound is on, and brings the new component back into view. Arriving doesn't.
  const last = useRef(i)
  useEffect(() => {
    if (last.current === i) return
    last.current = i
    tick()
    // The page scrolls in its panel on a laptop, and as a whole on anything smaller.
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
  // Tall enough for the demo at 90% or more, whatever the window: a short window scrolls to it
  // rather than shrinking it until it can't be read.
  const need = SIZE[e.id] ? Math.ceil(SIZE[e.id][1] * 0.9 + STAGE_PAD * 2 + 64) : 0
  // On a phone the stage follows the demo instead: as tall as it is at the width it gets, plus room for the dock.
  const phone = SIZE[e.id] ? `max(380px, calc(min(${SIZE[e.id][1]}px, (100vw - ${40 + STAGE_PAD * 2}px) * ${(SIZE[e.id][1] / SIZE[e.id][0]).toFixed(4)}) + ${STAGE_PAD * 2 + 64}px))` : '520px'

  const go = (to: string) => {
    if (to === id) return
    // Shown now, before the navigation starts: from a key press, React would otherwise hold this
    // update until the route had loaded.
    flushSync(() => setWant(to))
    router.push(`/components/${to}`, { scroll: false })
  }
  // The neighbours are fetched ahead, so the URL is ready by the time you press.
  useEffect(() => {
    router.prefetch(`/components/${next.id}`)
    router.prefetch(`/components/${prev.id}`)
  }, [router, next.id, prev.id])

  // Keys, unless a field or a component that uses them has focus.
  const latest = useRef({ go, prev, next })
  useEffect(() => {
    latest.current = { go, prev, next }
  })
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      const t = ev.target instanceof Element ? ev.target : document.body
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.defaultPrevented || index) return
      if (t.closest('input, textarea, [contenteditable], [role=listbox], [role=tree], [role=slider], [role=spinbutton], [role=dialog], [role=grid], [role=radiogroup]')) return
      const k = ev.key.toLowerCase()
      const { go: to, prev: p, next: n } = latest.current
      if (k === 'arrowright' || k === 'j') to(n.id)
      else if (k === 'arrowleft' || k === 'k') to(p.id)
      else if (k === '/') setIndex(true)
      else if (k === 'i') setInspect((v) => !v)
      else if (k === 'p') setPresent((v) => !v)
      else if (k === 'escape') {
        setPresent(false)
        setInspect(false)
      }
      else return
      ev.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [index])

  return (
    <Shell list={<Rail label="Components" groups={RAIL} current={id} onPick={go} preview={peek} />} bar={<Trail steps={['Components', family.name, e.name]} />}>
    <main className="mx-auto max-w-[1280px] px-4 sm:px-8">
      <div className="pb-6 sm:pb-8">
      {/* The title: which family, where you are in the forty, and what this one is. */}
      <header className="flex flex-col gap-6 pt-8 sm:pt-10 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="chip inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-footnote font-medium transition-[color,background-color,box-shadow] duration-300" style={{ color: `var(--${family.id})`, ['--chip' as string]: `var(--${family.id})` }}>
              <span className="size-1.5 rounded-full" style={{ background: `var(--${family.id})` }} />
              {family.name}
            </span>
            {isProComponent(e.id) && <ProTag />}
            <button type="button" onClick={() => setIndex(true)} className="ring-focus tnum flex h-7 items-center gap-2 rounded-full pl-2.5 pr-1.5 text-footnote text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden">
              All components
              <Kbd>/</Kbd>
            </button>
          </div>
          <h1 className="mt-5 text-[clamp(36px,4vw,56px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
            <span className="relative block h-[1.08em] overflow-hidden">
              <Glide k={e.id} dir={dir}>
                {e.name}
              </Glide>
            </span>
            <span className="relative block h-[1.08em] overflow-hidden text-quiet">
              <Glide k={e.id} dir={dir} delay={0.05}>
                {e.short ?? first(e.line)}
              </Glide>
            </span>
          </h1>
        </div>
        <div className="flex w-full max-w-[460px] shrink-0 flex-col gap-3 2xl:w-[460px]">
          {/* Hand it to your agent. */}
          <div className="flex items-center 2xl:justify-end">
            <CopyPrompt name={e.name} line={e.line} command={installCommand(e.id, !isProComponent(e.id))} page={`${SITE}/components/${e.id}.md`} />
          </div>
          <Install id={e.id} free={!isProComponent(e.id)} />
        </div>
      </header>

      {/* The bench: the component on its stage, its props under it, then the usage. One bench per component, so it starts clean. */}
      {present && <motion.div className="fixed inset-0 z-[45] bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setPresent(false)} />}
      <BenchProvider key={id}>
      <div className="mt-4 grid gap-3">
      <div className="relative flex h-[var(--stage-phone)] flex-col lg:h-[var(--stage)] " style={{ ['--stage' as string]: `max(clamp(540px, calc(100dvh - 290px), 760px), ${need}px)`, ['--stage-phone' as string]: phone }}>
        <motion.section
          ref={stage}
          layout
          transition={{ layout: lift }}
          data-theme={stageTheme ?? undefined}
          aria-label={`${e.name}, live`}
          // Full screen is the component alone, edge to edge on the page's own ground: no well, no frame.
          className={`overflow-hidden text-ink ${present ? 'fixed inset-0 z-50 bg-bg' : 'absolute inset-x-0 bottom-0 top-12 rounded-[28px] shadow-[inset_0_0_0_1px_var(--line)]'}`}
          // The stage is a well tinted with the family's light, the same as the plates on the walls.
          style={{ background: present ? undefined : wellOf(FAMILY_TONE[family.id] ?? 'blue') }}
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
              transition={{ duration: 0.45, ease }}
            >
              {/* Faded here, not on the moving layer above: Motion's own opacity there would win over a class. */}
              <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${mode === 'code' ? 'pointer-events-none opacity-0' : ''}`}>
                {e.bleed ? (
                  <div className="absolute inset-0">
                    <Demo />
                  </div>
                ) : (
                  <Fit pad={STAGE_PAD} max={e.zoom ?? 1.25} min={0.62}>
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
          {present && <ExitFull onExit={() => setPresent(false)} />}

        </motion.section>
        {/* Above the stage, quietly: what you're looking at on the left, and two small tools on the right. The rest are keys. */}
        <div className="absolute inset-x-0 top-0 flex h-12 items-start justify-between">
          <span className="flex rounded-full bg-surface-2 p-1">
            <Modes mode={mode} setMode={setMode} pro={isProComponent(e.id)} />
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
            <Tool className="hidden sm:block" label="Full screen" keys="P" onClick={() => setPresent(true)}>
              <Expand size={16} />
            </Tool>
          </span>
        </div>
      </div>

      {/* The props, beside the stage, and the usage under both: they're what you build with. Held out of sight while a move waits for its route, so they never describe the wrong component. */}
      <div className="contents" style={{ visibility: id === at ? undefined : 'hidden' }}>
        {children}
      </div>
      </div>
      </BenchProvider>

      {/* The keys it answers to, when it has any. */}
      {e.keys && (
        <section aria-labelledby="keys" className="mt-12 sm:mt-16">
          <h2 id="keys" className="px-1 text-[clamp(22px,2vw,28px)] font-normal tracking-[-0.035em] text-ink">
            Keyboard <span className="text-quiet">it answers to.</span>
          </h2>
          <dl className="mt-5 grid gap-x-8 rounded-[22px] bg-surface px-6 py-2 shadow-[var(--card-edge)] sm:grid-cols-2">
            {e.keys.map(([k, what]) => (
              <div key={k + what} className="flex items-center justify-between gap-4 py-3 shadow-[inset_0_1px_0_var(--line)] first:shadow-none sm:[&:nth-child(2)]:shadow-none">
                <dd className="text-callout text-ink-2">{what}</dd>
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

      <Index
        open={index}
        current={id}
        onClose={() => setIndex(false)}
        onPick={(to) => {
          setIndex(false)
          go(to)
        }}
      />
      </div>
    </main>
    </Shell>
  )
}


/** Hands the component to a coding agent: a prompt with what it is, the command that installs it, and the page that documents it. */
function CopyPrompt({ name, line, command, page }: { name: string; line: string; command: string; page: string }) {
  const [done, setDone] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    const text = `Add the ${name} component from Detent to this project. ${line}\n\nInstall it with:\n${command}\n\nIts props, usage and details are at ${page}. Fit it to the project's theme and use it where it belongs.`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* Clipboard blocked: nothing to show. */
    }
    setDone(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
  }
  return (
    <button type="button" onClick={copy} className="ring-focus flex h-9 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-[13px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={done ? 'ok' : 'copy'} className="flex" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.15 }}>
          {done ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} style={{ ['--icon-cutout' as string]: 'var(--ink)' }} />}
        </motion.span>
      </AnimatePresence>
      {done ? 'Copied for your agent' : 'Copy prompt'}
    </button>
  )
}

/**
 * The title travels with the component: the old one leaves the way you're going and the new one
 * arrives from the other side, quickly, inside its own clipped line so the two never overlap.
 */
function Glide({ k, dir = 1, delay = 0, children }: { k: string; dir?: number; delay?: number; children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false} custom={dir}>
      <motion.span
        key={k}
        className="block truncate"
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

/** A dock button; its name and key show above it while you point at it. */
export function Tool({ label, keys, on, onClick, children, className = '' }: { label: string; keys?: string; on?: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  const [tip, setTip] = useState(false)
  return (
    <span className={`relative ${className}`} onPointerEnter={() => setTip(true)} onPointerLeave={() => setTip(false)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        aria-label={label}
        aria-pressed={on}
        className={`ring-focus flex size-9 items-center justify-center rounded-full transition-[color,background-color,box-shadow] duration-150 ${on ? 'bg-plate text-ink shadow-raised' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
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

/** Preview or source; a plate glides between them. */
export function Modes({ mode, setMode, pro = false }: { mode: 'preview' | 'code'; setMode: (m: 'preview' | 'code') => void; /** The code is Pro: a small lock rides beside the word. */ pro?: boolean }) {
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
          className={`ring-focus relative h-9 rounded-full px-4 text-footnote font-medium capitalize transition-colors duration-200 ${mode === m ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
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
