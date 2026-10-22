'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { SIZE } from '@/catalog/sizes'
import { isProComponent } from '@/catalog/pro'
import { ArrowLeft, ArrowRight, Close, Expand, Inspect, Moon, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { Kbd } from '@/lab/ui/Kbd'
import { ModelAnnotated } from '../annotated/ModelAnnotated'
import { Code } from '../browser/Code'
import { InspectLayer } from '../browser/Inspect'
import { Fit } from '../Fit'
import { Footer } from '../Footer'
import { Header } from '../Header'
import { Install } from '../parts'
import { useSite } from '../Providers'
import { BenchProvider } from '../bench/state'
import { ProTag } from '../blocks/ProTag'
import { Index } from './Index'

const ease = [0.2, 0.9, 0.25, 1] as const
const lift = { type: 'spring', stiffness: 380, damping: 40 } as const
const glide = { type: 'spring', stiffness: 360, damping: 40 } as const

/** Components that explain themselves on the stage. The rest stand on their own. */
/** Air around a demo on the stage. */
const STAGE_PAD = 48

const ANNOTATED: Record<string, (p: { className?: string }) => ReactNode> = { models: ModelAnnotated }

const first = (s: string) => s.split(/(?<=\.)\s/)[0]

/**
 * The components page, as an exhibit. One component has the page: a big two-tone title, the
 * live component standing on the page itself, and one floating dock with every tool. The
 * index is a sheet you open, not a sidebar you scroll past, and the page ends on what's next.
 * It's the layout for /components/[slug], so moving between components is one continuous
 * page: the URL changes, nothing reloads.
 */
export function Exhibit({ children }: { children: ReactNode }) {
  const at = usePathname().split('/')[2] ?? ''
  return (
    <>
      <Header />
      {ENTRIES.some((e) => e.id === at) ? <Shown at={at}>{children}</Shown> : children}
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
  // Each move clicks, if sound is on, and brings the new component back into view. Arriving doesn't.
  const last = useRef(i)
  useEffect(() => {
    if (last.current === i) return
    last.current = i
    tick()
    if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [i, tick])

  const e = ENTRIES[i]
  const prev = ENTRIES[(i - 1 + ENTRIES.length) % ENTRIES.length]
  const next = ENTRIES[(i + 1) % ENTRIES.length]
  const family = CATEGORIES.find((c) => c.id === e.category)!
  const Demo = DEMOS[e.id]
  const Story = ANNOTATED[e.id]
  const shown = stageTheme ?? page
  // Tall enough for the demo at 90% or more, whatever the window: a short window scrolls to it
  // rather than shrinking it until it can't be read.
  const need = SIZE[e.id] && !Story ? Math.ceil(SIZE[e.id][1] * 0.9 + STAGE_PAD * 2 + 64) : 0
  // On a phone the stage follows the demo instead: as tall as it is at the width it gets, plus room for the dock.
  const phone = SIZE[e.id] && !Story ? `max(380px, calc(min(${SIZE[e.id][1]}px, (100vw - ${40 + STAGE_PAD * 2}px) * ${(SIZE[e.id][1] / SIZE[e.id][0]).toFixed(4)}) + ${STAGE_PAD * 2 + 64}px))` : '520px'

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
    <main className="mx-auto max-w-[1360px] px-5 sm:px-8">
      {/* The title: which family, where you are in the forty, and what this one is. */}
      <header className="flex flex-col gap-6 pt-10 sm:pt-12 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="chip inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-footnote font-medium transition-[color,background-color,box-shadow] duration-300" style={{ color: `var(--${family.id})`, ['--chip' as string]: `var(--${family.id})` }}>
              <span className="size-1.5 rounded-full" style={{ background: `var(--${family.id})` }} />
              {family.name}
            </span>
            {isProComponent(e.id) && <ProTag />}
            <button type="button" onClick={() => setIndex(true)} className="ring-focus tnum flex h-7 items-center gap-2 rounded-full pl-2.5 pr-1.5 text-footnote text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
              All components
              <Kbd>/</Kbd>
            </button>
          </div>
          <h1 className="mt-4 text-[clamp(32px,3.8vw,48px)] font-normal leading-[1.08] tracking-[-0.045em] text-ink">
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
        <div className="w-full max-w-[460px] shrink-0 xl:w-[460px]">
          <Install id={e.id} free={!isProComponent(e.id)} />
        </div>
      </header>

      {/* The bench: the component on its stage, its props beside it, and the usage under both. One bench per component, so it starts clean. */}
      {present && <motion.div className="fixed inset-0 z-[45] bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setPresent(false)} />}
      <BenchProvider key={id}>
      <div className="mt-2 grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="relative h-[var(--stage-phone)] lg:h-[var(--stage)] xl:col-start-1 xl:row-start-1" style={{ ['--stage' as string]: `max(clamp(540px, calc(100dvh - 290px), 760px), ${need}px)`, ['--stage-phone' as string]: phone }}>
        <motion.section
          ref={stage}
          layout
          transition={{ layout: lift }}
          data-theme={stageTheme ?? undefined}
          aria-label={`${e.name}, live`}
          className={`overflow-hidden text-ink ${present ? 'fixed inset-3 z-50 rounded-[32px] bg-bg sm:inset-4' : 'absolute inset-0 rounded-[32px] bg-card shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line))]'}`}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={`${e.id}-${run}`}
              data-inspect-root
              custom={dir}
              className="absolute inset-x-0 bottom-0 top-16"
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
                {Story ? (
                  <Story className="min-h-0 flex-1" />
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
              <motion.div key="code" className="absolute inset-x-0 bottom-0 top-16 z-[5]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease }}>
                <Code id={e.id} />
              </motion.div>
            )}
          </AnimatePresence>

          <InspectLayer on={inspect && mode === 'preview'} stage={stage} />

        </motion.section>
        {/* Every tool in one floating dock across the top of the stage, in its own reserved strip, so it's
            in view the moment the page opens and never covers the component. Scrolling, it stays just
            under the site header until the stage has passed. */}
        <div className={present ? 'pointer-events-none fixed inset-x-0 bottom-8 z-[55] flex justify-center' : 'pointer-events-none absolute inset-0 z-10 flex flex-col justify-start'}>
          <div className={`pointer-events-auto flex justify-center ${present ? '' : 'sticky top-20 pt-3'}`}>
            <div className="glass flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-modal">
              <Modes mode={mode} setMode={setMode} pro={isProComponent(e.id)} />
              <Rule />
              <Tool className="hidden sm:block" label={inspect ? 'Stop inspecting' : 'Inspect'} keys="I" on={inspect} onClick={() => setInspect((v) => !v)}>
                <Inspect size={16} />
              </Tool>
              <Tool label={shown === 'dark' ? 'View in light' : 'View in dark'} onClick={() => setStageTheme(stageTheme ? null : page === 'dark' ? 'light' : 'dark')}>
                {shown === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </Tool>
              <Tool label="Replay" onClick={() => setRun((r) => r + 1)}>
                <motion.span key={run} className="flex" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                  <Refresh size={16} />
                </motion.span>
              </Tool>
              <Tool className="hidden sm:block" label={present ? 'Stop presenting' : 'Present'} keys="P" on={present} onClick={() => setPresent((v) => !v)}>
                {present ? <Close size={16} /> : <Expand size={16} />}
              </Tool>
              <Rule />
              <Tool label={`Previous: ${prev.name}`} keys="←" onClick={() => go(prev.id)}>
                <ArrowLeft size={16} />
              </Tool>
              <Tool label={`Next: ${next.name}`} keys="→" onClick={() => go(next.id)}>
                <ArrowRight size={16} />
              </Tool>
            </div>
          </div>
        </div>
      </div>

      {/* The props, beside the stage, and the usage under both: they're what you build with. Held out of sight while a move waits for its route, so they never describe the wrong component. */}
      <div className="contents" style={{ visibility: id === at ? undefined : 'hidden' }}>
        {children}
      </div>
      </div>
      </BenchProvider>

      {/* How it's made, quietly, for anyone who scrolls. */}
      <section aria-labelledby="details" className="mt-24 grid gap-x-16 gap-y-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <h2 id="details" className="text-title text-ink">
          The details
        </h2>
        <div className="grid gap-x-16 gap-y-10 xl:grid-cols-[minmax(0,1fr)_280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={e.id} className="grid gap-x-12 sm:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.3 }}>
            {e.details.map((d, n) => (
              <li key={n} className="py-4 text-body text-ink-2 shadow-[inset_0_1px_0_var(--line)]">
                {d}
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
        {e.keys && (
          <dl className="h-fit">
            {e.keys.map(([k, what], n) => (
              <div key={k + what} className="flex items-center justify-between gap-4 py-2.5" style={{ boxShadow: n ? 'inset 0 1px 0 var(--line)' : undefined }}>
                <dd className="text-callout text-ink-2">{what}</dd>
                <dt className="flex shrink-0 gap-1">
                  {k.split(' ').map((part, j) => (
                    <Kbd key={j}>{part}</Kbd>
                  ))}
                </dt>
              </div>
            ))}
          </dl>
        )}
        </div>
      </section>

      {/* The way on: the components either side, small enough to pass, plain enough to press. */}
      <nav aria-label="More components" className="mt-28 grid gap-3 sm:grid-cols-2">
        <Neighbour e={prev} dir="prev" onGo={() => go(prev.id)} />
        <Neighbour e={next} dir="next" onGo={() => go(next.id)} />
      </nav>

      <Index
        open={index}
        current={id}
        onClose={() => setIndex(false)}
        onPick={(to) => {
          setIndex(false)
          go(to)
        }}
      />
    </main>
  )
}

/** The component either side, at the foot of the page: its name and its family, and an arrow that leans the way you'd go. */
function Neighbour({ e, dir, onGo }: { e: (typeof ENTRIES)[number]; dir: 'prev' | 'next'; onGo: () => void }) {
  const back = dir === 'prev'
  const family = CATEGORIES.find((c) => c.id === e.category)!
  return (
    <button
      type="button"
      onClick={onGo}
      className={`ring-focus group/n flex items-center gap-4 rounded-[18px] p-5 text-left shadow-[inset_0_0_0_1px_var(--line)] transition-[background-color,box-shadow] duration-200 hover:bg-[color-mix(in_oklch,var(--accent)_5%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_30%,transparent)] ${back ? '' : 'flex-row-reverse text-right'}`}
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 transition-[transform,color,background-color] duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] group-hover/n:bg-accent group-hover/n:text-white ${back ? 'group-hover/n:-translate-x-1' : 'group-hover/n:translate-x-1'}`}>
        {back ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-caption text-ink-3">
          {back ? 'Previous' : 'Next'} · {family.name}
        </span>
        <span className="mt-0.5 block truncate text-title text-ink">{e.name}</span>
        <span className="block truncate text-footnote text-ink-3">{e.short ?? first(e.line)}</span>
      </span>
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
