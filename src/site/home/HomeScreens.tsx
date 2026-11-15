'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@/lab/icons'
import { block } from '@/catalog/blocks'
import { PRO_BLOCK_COUNT } from '@/catalog/pro'
import type { Tone } from '@/site/home/lights'
import { BLOCK_VIEWS } from '@pro'
import { Backdrop, Window } from '@/site/blocks/Studio'
import { Fit } from '@/site/Fit'
import { useNear } from '@/site/near'

const PICKS: { id: string; name: string; tone: Tone; line: string }[] = [
  { id: 'agent-chat', name: 'Agent chat', tone: 'blue', line: 'Your useChat, drawn: streaming answers, tool calls, and a card that waits for a yes.' },
  { id: 'task-to-merge', name: 'Task to merge', tone: 'violet', line: 'An agent takes a task from plan to merged pull request. Deploying waits for a person.' },
  { id: 'support-inbox', name: 'Support inbox', tone: 'rose', line: 'Every conversation sorted and every reply drafted, with the sources it came from.' },
  { id: 'evals', name: 'Evals', tone: 'amber', line: 'A new prompt against the one in production, case by case. Shipping waits on every regression.' },
  { id: 'data-table', name: 'Data table', tone: 'blue', line: 'Sort, filter, select, and ask it a question in plain words.' },
]

const DWELL = 10000
const EASE = [0.22, 1, 0.36, 1] as const

export function HomeScreens() {
  const reduce = useReducedMotion()
  const [at, setAt] = useState(0)
  const [held, setHeld] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const dock = useRef<HTMLDivElement>(null)
  const near = useNear(box, '300px 0px', '700px 0px')
  const pick = PICKS[at]
  const b = block(pick.id)!
  const View = BLOCK_VIEWS[pick.id]
  const playing = !held && !reduce

  useEffect(() => {
    if (!playing || !near) return
    const t = setTimeout(() => setAt((i) => (i + 1) % PICKS.length), DWELL)
    return () => clearTimeout(t)
  }, [at, playing, near])

  useEffect(() => {
    const d = dock.current
    const el = d?.querySelector<HTMLElement>(`[data-id="${pick.id}"]`)
    if (!d || !el || d.scrollWidth <= d.clientWidth) return
    d.scrollTo({ left: el.offsetLeft - (d.clientWidth - el.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' })
  }, [pick.id, reduce])

  return (
    <section id="screens" aria-labelledby="screens-title" className="scroll-mt-20 px-2.5 sm:px-5">
      <div className="rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--paper)', boxShadow: 'var(--leaf-edge)' }}>
        <div className="mx-auto max-w-[1440px] px-3 pb-8 pt-20 sm:px-8 sm:pb-10 sm:pt-28">
          <div className="flex flex-col items-center px-2 text-center">
            <h2 id="screens-title" className="text-[clamp(38px,4.2vw,62px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
              Five screens you’d
              <br />
              <span className="text-quiet">otherwise build yourself.</span>
            </h2>
            <p className="mt-5 max-w-[500px] text-balance text-[16px] leading-[1.6] text-ink-3">
              Running live, with every state worked out. Install one with the shadcn CLI and it takes your theme.
            </p>
          </div>

          <div ref={box} className="mt-12 sm:mt-16">
            <div className="relative isolate aspect-[4/5] overflow-hidden rounded-[24px] sm:aspect-square sm:rounded-[30px] lg:aspect-auto lg:h-[clamp(560px,calc(100svh-96px),780px)]">
              <AnimatePresence initial={false}>
                <motion.div key={pick.tone + at} aria-hidden className="absolute inset-0 -z-10" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                  <Backdrop tone={pick.tone} />
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-x-0 bottom-0 top-0 sm:bottom-[76px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {near && View ? (
                    <motion.div key={pick.id} inert className="absolute inset-0" initial={reduce ? false : { opacity: 0, y: 14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.99 }} transition={{ duration: 0.42, ease: EASE }}>
                      <Fit pad={32} max={1} min={0.2}>
                        <div className="h-[calc(125vw-66px)] w-[calc(100vw-56px)] sm:h-[600px] sm:w-[760px] lg:h-[640px] lg:w-[1000px]">
                          <Window title={b.window} chrome={b.chrome === 'browser' ? 'browser' : 'titled'}>
                            <div className="h-full overflow-hidden">
                              <View autoplay />
                            </div>
                          </Window>
                        </div>
                      </Fit>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="absolute inset-x-0 bottom-5 hidden justify-center sm:flex">
                <Dock at={at} playing={playing} onPick={(i) => (setHeld(true), setAt(i))} />
              </div>
            </div>

            <div ref={dock} className="-mx-3 mt-3 flex overflow-x-auto px-3 [scrollbar-width:none] sm:hidden">
              <Dock at={at} playing={playing} onPick={(i) => (setHeld(true), setAt(i))} flat />
            </div>

            <div className="mt-5 flex flex-col gap-4 px-1 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
              <div className="min-h-[52px] min-w-0 max-w-[620px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={pick.id} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: EASE }}>
                    <p className="text-[17px] tracking-[-0.01em] text-ink">{pick.name}</p>
                    <p className="mt-1 text-[14.5px] leading-[1.55] text-ink-3">{pick.line}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/blocks/${pick.id}`} className="ring-focus group/open flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
                  Open<span className="hidden min-[400px]:inline"> {pick.name.toLowerCase()}</span>
                </Link>
                <Link href="/blocks" className="ring-focus group/go flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
                  All {PRO_BLOCK_COUNT} blocks
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover/go:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Dock({ at, playing, onPick, flat = false }: { at: number; playing: boolean; onPick: (i: number) => void; flat?: boolean }) {
  return (
    <div
      role="tablist"
      aria-label="Pro screens"
      className={`flex shrink-0 gap-1 rounded-full p-1 ${flat ? 'bg-surface-2' : 'bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35),0_0_0_1px_rgb(255_255_255/0.5)] backdrop-blur-xl backdrop-saturate-150'}`}
    >
      {PICKS.map((p, i) => {
        const on = i === at
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            data-id={p.id}
            aria-selected={on}
            onClick={() => onPick(i)}
            className={`ring-focus relative h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-[14px] transition-colors duration-200 ${on ? 'text-surface' : 'text-ink-2 hover:text-ink'}`}
          >
            {on && (
              <motion.span layoutId={flat ? 'screens-flat' : 'screens-dock'} aria-hidden className="absolute inset-0 overflow-hidden rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 36 }}>
                {playing && <motion.span key={at} className="absolute inset-y-0 left-0 bg-white/14" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: DWELL / 1000, ease: 'linear' }} />}
              </motion.span>
            )}
            <span className="relative">{p.name}</span>
          </button>
        )
      })}
    </div>
  )
}
