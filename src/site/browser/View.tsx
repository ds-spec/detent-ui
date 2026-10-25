'use client'

import { useId, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { ENTRIES } from '@/catalog/meta'
import type { Entry } from '@/catalog/meta'
import { ArrowLeft, ArrowRight, Close, Expand, Inspect, Moon, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { Kbd } from '@/lab/ui/Kbd'
import { Fit } from '../Fit'
import { installCommand, isProComponent } from '@/catalog/pro'
import { CopyCommand } from '../parts'
import { Code } from './Code'
import { InspectLayer } from './Inspect'
import { useShell } from './shell'

const ease = [0.2, 0.9, 0.25, 1] as const
const lift = { type: 'spring', stiffness: 380, damping: 40 } as const

/** The light that follows the pointer across a card: two CSS variables, set directly, no re-render per move. */
const light = (ev: PointerEvent<HTMLElement>) => {
  const r = ev.currentTarget.getBoundingClientRect()
  ev.currentTarget.style.setProperty('--mx', `${ev.clientX - r.left}px`)
  ev.currentTarget.style.setProperty('--my', `${ev.clientY - r.top}px`)
}

function Light({ group, size = 560 }: { group: 'stage' | 'card'; size?: number }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ${group === 'stage' ? 'group-hover/stage:opacity-100' : 'group-hover/card:opacity-100'}`}
      style={{ background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), var(--card-light), transparent 65%)` }}
    />
  )
}

/** One component: alone on a large stage, a caption underneath, and how it's made below the fold. */
export function View({ id }: { id: string }) {
  const { present, setPresent, inspect, setInspect, dir } = useShell()
  const stageRef = useRef<HTMLElement>(null)
  const i = ENTRIES.findIndex((x) => x.id === id)
  const e = ENTRIES[i]
  const prev = ENTRIES[(i - 1 + ENTRIES.length) % ENTRIES.length]
  const next = ENTRIES[(i + 1) % ENTRIES.length]
  const Demo = DEMOS[e.id]
  // The stage's controls: what it shows, which theme it's in, and a replay.
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const page = useTheme()
  const [stage, setStage] = useState<'light' | 'dark' | null>(null)
  const [run, setRun] = useState(0)
  const shown = stage ?? page

  return (
    <article>
      {/* The stage's place in the page is held while it presents, so nothing underneath moves. */}
      <div className="relative h-[clamp(440px,calc(100dvh-16rem),680px)] lg:h-[max(520px,calc(100dvh-12.5rem))]">
        <AnimatePresence>
          {present && (
            <motion.div
              key="veil"
              aria-hidden
              className="fixed inset-0 z-[45] bg-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              onClick={() => setPresent(false)}
            />
          )}
        </AnimatePresence>

        {/* Presenting lifts this same stage out of the page to fill the screen; the component keeps running through it. */}
        <motion.section
          ref={stageRef}
          layout
          transition={{ layout: lift }}
          aria-label={`${e.name}, live`}
          data-theme={stage ?? undefined}
          onPointerMove={light}
          className={`group/stage overflow-hidden bg-card text-ink transition-[background-color] duration-300 ${present ? 'fixed inset-3 z-50 sm:inset-4' : 'absolute inset-0'}`}
          style={{ borderRadius: 28 }}
        >
          <Light group="stage" />

          {/* The component arrives from the direction you're moving through the index. */}
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={`${e.id}-${run}`}
              data-inspect-root
              layout
              custom={dir}
              className={`absolute inset-0 transition-[opacity,filter] duration-300 ${mode === 'code' ? 'pointer-events-none opacity-0 blur-sm' : ''}`}
              variants={{
                enter: (d: number) => ({ opacity: 0, y: d * 36, filter: 'blur(8px)' }),
                still: { opacity: 1, y: 0, filter: 'blur(0px)' },
                leave: (d: number) => ({ opacity: 0, y: d * -24, filter: 'blur(8px)' }),
              }}
              initial="enter"
              animate="still"
              exit="leave"
              transition={{ duration: 0.45, ease, layout: lift }}
            >
              {e.bleed ? (
                <Demo />
              ) : (
                <Fit pad={40} max={e.zoom ?? 1.2} min={0.62}>
                  <Demo />
                </Fit>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {mode === 'code' && (
              <motion.div key="code" layout className="absolute inset-0 z-[5]" initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: 6, filter: 'blur(6px)', transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease, layout: lift }}>
                <Code id={e.id} />
              </motion.div>
            )}
          </AnimatePresence>

          <InspectLayer on={inspect && mode === 'preview'} stage={stageRef} />

          {/* Presenting, the controls stay out of the picture until you reach for them. */}
          <div className={`absolute inset-x-0 top-0 z-10 flex h-[68px] items-center justify-between px-4 transition-opacity duration-300 ${present ? 'opacity-0 focus-within:opacity-100 hover:opacity-100' : ''}`}>
            <motion.div layout="position" transition={{ layout: lift }}>
              <Modes mode={mode} setMode={setMode} />
            </motion.div>
            <motion.div layout="position" transition={{ layout: lift }} className="flex items-center gap-0.5">
              <Ghost label={inspect ? 'Stop inspecting' : 'Inspect'} on={inspect} onClick={() => setInspect((v) => !v)}>
                <Inspect size={16} />
              </Ghost>
              <Ghost label={shown === 'dark' ? 'View this in light' : 'View this in dark'} onClick={() => setStage(stage ? null : page === 'dark' ? 'light' : 'dark')}>
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span key={shown} className="flex" initial={{ opacity: 0, rotate: -40, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 40, scale: 0.7 }} transition={{ duration: 0.2 }}>
                    {shown === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  </motion.span>
                </AnimatePresence>
              </Ghost>
              <Ghost label="Replay" onClick={() => setRun((r) => r + 1)}>
                <motion.span key={run} className="flex" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                  <Refresh size={15} />
                </motion.span>
              </Ghost>
              <Ghost label={present ? 'Stop presenting' : 'Present'} onClick={() => setPresent(!present)}>
                {present ? <Close size={15} /> : <Expand size={15} />}
              </Ghost>
            </motion.div>
          </div>
        </motion.section>
      </div>

      <Caption e={e} />
      <Notes e={e} />

      <nav aria-label="More components" className="mt-20 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Step to={prev} side="prev" />
        <Step to={next} side="next" />
      </nav>
    </article>
  )
}

/** The name and what it is, under the stage like a caption. The name drops into place, the way the home headline's last word does. */
function Caption({ e }: { e: Entry }) {
  return (
    <div className="flex min-h-[112px] flex-col gap-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={e.id} className="min-w-0" exit={{ opacity: 0, transition: { duration: 0.1 } }}>
          <h1 className="text-title text-ink">
            <span className="slot">
              <motion.span className="inline-block" initial={{ y: '-105%' }} animate={{ y: ['-105%', '5%', '-1.5%', '0%'] }} transition={{ duration: 0.7, times: [0, 0.62, 0.8, 1], ease: [0.3, 0.8, 0.3, 1] }}>
                {e.name}
              </motion.span>
            </span>
          </h1>
          <motion.p className="mt-1 max-w-[580px] text-body text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.12 }}>
            {e.line}
          </motion.p>
        </motion.div>
      </AnimatePresence>
      {/* A fixed column, so a longer command never re-wraps the line beside it. */}
      <div className="flex shrink-0 sm:w-[360px] sm:justify-end">
        <CopyCommand command={installCommand(e.id, !isProComponent(e.id))} />
      </div>
    </div>
  )
}

/** How it's made, and the keys it answers to. */
function Notes({ e }: { e: Entry }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section key={e.id} aria-label="How it's made" className="mt-16 grid gap-14 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.3, ease }}>
        <div>
          <h2 className="text-footnote text-ink-3">What makes it</h2>
          <ol className="mt-6 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {e.details.map((d, n) => (
              <li key={n}>
                <span className="tnum block font-mono text-caption text-ink-3">{String(n + 1).padStart(2, '0')}</span>
                <p className="mt-2 text-body text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </div>
        {e.keys && (
          <div>
            <h2 className="text-footnote text-ink-3">Keyboard</h2>
            <dl className="mt-6 rounded-[20px] bg-card px-1 py-1">
              {e.keys.map(([k, what], n) => (
                <div key={k + what} className="flex items-center justify-between gap-4 px-3.5 py-2.5" style={{ boxShadow: n ? 'inset 0 1px 0 var(--line)' : undefined }}>
                  <dd className="text-callout text-ink-2">{what}</dd>
                  <dt className="flex shrink-0 gap-1">
                    {k.split(' ').map((part, j) => (
                      <Kbd key={j}>{part}</Kbd>
                    ))}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        )}
      </motion.section>
    </AnimatePresence>
  )
}

/** The previous or next component, as a soft card with the same light as the stage. */
function Step({ to, side }: { to: Entry; side: 'prev' | 'next' }) {
  const next = side === 'next'
  return (
    <Link
      href={`/components/${to.id}`}
      scroll={false}
      onPointerMove={light}
      className={`ring-focus group/card relative flex h-[96px] flex-col justify-center overflow-hidden rounded-[24px] bg-card px-6 ${next ? 'items-end text-right' : ''}`}
    >
      <Light group="card" size={360} />
      <span className="relative flex items-center gap-1.5 text-footnote text-ink-3">
        {!next && <ArrowLeft size={12} className="transition-transform duration-200 group-hover/card:-translate-x-0.5" />}
        {next ? 'Next' : 'Previous'}
        {next && <ArrowRight size={12} className="transition-transform duration-200 group-hover/card:translate-x-0.5" />}
      </span>
      <span className="relative mt-1 text-title text-ink">{to.name}</span>
    </Link>
  )
}

/** A quiet round button for the stage's corner: no fill until you point at it. */
function Ghost({ label, on, onClick, children }: { label: string; on?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={`ring-focus flex size-9 items-center justify-center rounded-full transition-[color,background-color,box-shadow] duration-150 ${on ? 'bg-plate text-ink shadow-raised' : 'text-ink-3 hover:bg-surface/70 hover:text-ink'}`}
    >
      {children}
    </motion.button>
  )
}

/** Preview or source; a white plate glides between them. */
function Modes({ mode, setMode }: { mode: 'preview' | 'code'; setMode: (m: 'preview' | 'code') => void }) {
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
          className={`ring-focus relative h-8 rounded-full px-3.5 text-footnote font-medium capitalize transition-colors duration-200 ${mode === m ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {mode === m && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-plate shadow-raised" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span className="relative">{m}</span>
        </button>
      ))}
    </span>
  )
}
