'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { PLANS, UPGRADE, installCommand, isProComponent } from '@/catalog/pro'
import { FIRST_COMPONENT } from '@/catalog/site'
import { Announcement } from '@/lab/components/announce/Announcement'
import { ArrowRight, ArrowUpRight, Chart, Note, Play, Prompt } from '@/lab/icons'
import { Fit } from '@/site/Fit'
import { CopyCommand } from '@/site/parts'
import { ForPlan } from '@/site/Owned'
import { BRIDGE, CARDS, GRAIN, LAYER, useWide } from './lights'
import type { Card } from './lights'
import { BTN, useSideNew } from '../shell/side'
import { DitherWord } from '../Dither'
import type { LibItem } from './library'

if (typeof window !== 'undefined') void import('@/lab/demos/inputs')

const UI = [0.2, 0, 0, 1] as const
const OPEN = { type: 'spring', stiffness: 280, damping: 34 } as const
const DWELL = 6500
const EDGE = 'light-dark(rgb(0 0 0 / 0.07), rgb(255 255 255 / 0.08))'
const JOIN = 22
const GROW = 1.8
const GAP = 8
const UNIT = `var(--plate)`
const widthOf = (open: number) => `calc(${UNIT} * ${(1 + GROW * open).toFixed(4)})`
const ICON: Record<string, ReactNode> = { prompt: <Prompt size={15} />, models: <Note size={15} />, voicenote: <Play size={15} />, metric: <Chart size={15} /> }

export function HomeHero({ lib }: { lib: LibItem[] }) {
  const side = useSideNew()
  const [open, setOpen] = useState(CARDS[0].id)
  const dot = CARDS.find((c) => c.id === open)?.dot
  return (
    <section className="px-2.5 sm:px-5">
      <div className="relative rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--leaf)', boxShadow: 'var(--leaf-edge)' }}>
        <div className="mx-auto max-w-[1440px] px-4 pb-3 pt-12 sm:px-8 sm:pb-4 sm:pt-16">
          <div className="flex flex-col items-center px-2 text-center">
            <Announcement href="/components/rewind" linkAs={Link} className="rise">
              Rewind and Popup
            </Announcement>
            <h1 className="focus-in mt-7 text-[clamp(42px,5vw,74px)] font-normal leading-[1.01] tracking-[-0.055em] text-ink">
              Most apps look the same.
              <br />
              <span className="text-quiet">
                Yours{' '}
                <DitherWord color={dot ?? 'currentColor'}>won’t</DitherWord>.
              </span>
            </h1>
            <p className="rise mt-6 max-w-[540px] text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
              Well-made React components for your product. Installed with shadcn, styled by your theme, yours to{'\u00a0'}change.
            </p>
            <div className="rise mt-8 flex items-center gap-2.5" style={{ animationDelay: '200ms' }}>
              <Link href={FIRST_COMPONENT} className={side ? `ring-focus group/go flex h-11 items-center whitespace-nowrap gap-1.5 rounded-[11px] ${BTN.accent} pl-5 pr-4 text-[14px] font-medium transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.97] max-[359px]:pl-4 max-[359px]:pr-3` : "ring-focus group/go flex h-11 items-center whitespace-nowrap gap-1.5 rounded-full bg-ink pl-5 pr-4 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97] max-[359px]:pl-4 max-[359px]:pr-3"}>
                Browse components
                <ArrowRight size={14} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
              </Link>
              <ForPlan
                none={
                  <Link href="/pro" className={side ? `ring-focus flex h-11 items-center whitespace-nowrap rounded-[11px] ${BTN.plate} px-5 text-[14px] font-medium transition-[box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--elev-raised-hover)] active:scale-[0.97] max-[359px]:px-4` : "ring-focus flex h-11 items-center whitespace-nowrap rounded-full bg-surface px-5 text-[14px] font-medium text-ink shadow-raised transition-[box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--elev-raised-hover)] active:scale-[0.97] max-[359px]:px-4"}>
                    Get Pro<span className="hidden sm:inline">&nbsp;· ${PLANS[0].price}</span>
                  </Link>
                }
                pro={
                  <a href={UPGRADE.href} className={side ? `ring-focus flex h-11 items-center whitespace-nowrap rounded-[11px] ${BTN.plate} px-5 text-[14px] font-medium transition-[box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--elev-raised-hover)] active:scale-[0.97] max-[359px]:px-4` : "ring-focus flex h-11 items-center whitespace-nowrap rounded-full bg-surface px-5 text-[14px] font-medium text-ink shadow-raised transition-[box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--elev-raised-hover)] active:scale-[0.97] max-[359px]:px-4"}>
                    {UPGRADE.cta}<span className="hidden sm:inline">&nbsp;· ${UPGRADE.price}</span>
                  </a>
                }
              />
            </div>
          </div>
          <Plates lib={lib} onOpen={setOpen} className="rise mt-12 lg:mt-14 lg:h-[clamp(480px,calc(100svh-300px),620px)]" />
        </div>
        <Bridge id={open} />
      </div>
    </section>
  )
}

function Bridge({ id }: { id: string }) {
  const free = !isProComponent(id)
  const corner = (x: 'left' | 'right', y: 'top' | 'bottom') => ({
    [x]: -JOIN,
    [y]: 0,
    width: JOIN,
    height: JOIN,
    background: `radial-gradient(circle at ${x === 'left' ? '0%' : '100%'} ${y === 'top' ? '100%' : '0%'}, transparent ${JOIN - 1}px, ${EDGE} ${JOIN - 0.5}px, ${EDGE} ${JOIN}px, ${y === 'top' ? 'var(--leaf)' : 'var(--paper)'} ${JOIN + 0.5}px)`,
  })
  return (
    <div className="absolute left-1/2 top-full z-10 flex -translate-x-1/2 items-center px-3" style={{ height: BRIDGE + 1, background: 'linear-gradient(var(--leaf), var(--paper))' }}>
      <span aria-hidden className="absolute" style={corner('left', 'top')} />
      <span aria-hidden className="absolute" style={corner('right', 'top')} />
      <span aria-hidden className="absolute" style={corner('left', 'bottom')} />
      <span aria-hidden className="absolute" style={corner('right', 'bottom')} />
      <div className="w-[min(420px,calc(100vw-136px))]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: UI } }} exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: UI } }}>
            <CopyCommand fill command={installCommand(id, free)} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Plates({ lib, onOpen, className = '' }: { lib: LibItem[]; onOpen?: (id: string) => void; className?: string }) {
  const reduce = useReducedMotion()
  const wide = useWide()
  const [open, setOpen] = useState(0)
  const [held, setHeld] = useState(false)
  const a = useMotionValue(1)
  const b = useMotionValue(0)
  const c = useMotionValue(0)
  const d = useMotionValue(0)
  const grow = useMemo(() => [a, b, c, d], [a, b, c, d])
  useEffect(() => {
    const going = grow.map((v, k) => animate(v, k === open ? 1 : 0, reduce ? { duration: 0 } : OPEN))
    return () => going.forEach((g) => g.stop())
  }, [grow, open, reduce])
  const [seen, setSeen] = useState<number[]>([0])
  const intent = useRef(0)
  useEffect(() => {
    const ts = CARDS.slice(1).map((_, k) => window.setTimeout(() => setSeen((s) => (s.includes(k + 1) ? s : [...s, k + 1])), 1400 + k * 500))
    return () => ts.forEach(clearTimeout)
  }, [])

  const show = useCallback(
    (k: number) => {
      setOpen(k)
      setSeen((s) => (s.includes(k) ? s : [...s, k]))
      onOpen?.(CARDS[k].id)
    },
    [onOpen],
  )
  useEffect(() => {
    if (held || reduce) return
    const t = window.setTimeout(() => show((open + 1) % CARDS.length), DWELL)
    return () => clearTimeout(t)
  }, [open, held, reduce, show])
  const aim = useCallback(
    (k: number) => {
      clearTimeout(intent.current)
      intent.current = window.setTimeout(() => show(k), 110)
    },
    [show],
  )
  useEffect(() => () => clearTimeout(intent.current), [])

  return (
    <div
      className={`relative flex flex-col gap-2 lg:block lg:[--plate:calc((100cqw-24px)/5.8)] lg:[container-type:inline-size] ${className}`}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => {
        clearTimeout(intent.current)
        setHeld(false)
      }}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      <style>{CSS}</style>
      {CARDS.map((c, k) => (
        <Plate key={c.id} c={c} k={k} grow={grow} item={lib.find((x) => x.id === c.id)} on={k === open} mounted={seen.includes(k)} wide={wide} onAim={() => aim(k)} onPick={() => show(k)} />
      ))}
    </div>
  )
}

function Plate({ c, k, grow, item, on, mounted, wide, onAim, onPick }: { c: Card; k: number; grow: MotionValue<number>[]; item?: LibItem; on: boolean; mounted: boolean; wide: boolean; onAim: () => void; onPick: () => void }) {
  const reduce = useReducedMotion()
  const Demo = DEMOS[c.id]
  const name = item?.name ?? c.id
  const width = useTransform(grow[k], widthOf)
  const across = useTransform(grow, (v: number[]) => {
    const before = v.slice(0, k).reduce((n, x) => n + 1 + GROW * x, 0)
    return `translateX(calc(${UNIT} * ${before.toFixed(4)} + ${k * GAP}px))`
  })
  const icon = useTransform(grow[k], (v) => `translateX(calc(${widthOf(v).slice(5, -1)} - 54px))`)
  const centre = useTransform(grow[k], (v) => `translateX(calc((${widthOf(v).slice(5, -1)} - 12px - ${LAYER}px) / 2))`)
  const layer = 'left-0 w-full lg:w-[var(--layer)]'
  const layerVar = { '--layer': `${LAYER}px` } as CSSProperties
  const carried = 'max-lg:![transform:none]'

  return (
    <motion.div
      className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] p-1.5 max-lg:!w-full max-lg:![transform:none] max-lg:transition-[height] max-lg:duration-500 max-lg:[transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none lg:absolute lg:left-0 lg:top-0 lg:h-full ${on ? 'max-lg:h-[520px]' : 'max-lg:h-[168px]'}`}
      style={{ background: 'var(--mount)', boxShadow: 'inset 0 0 0 1px var(--line)', contain: 'layout paint', width, transform: across }}
      onPointerEnter={onAim}
    >
      <div className="relative flex h-[52px] shrink-0 items-center gap-3 px-2.5">
        <div className="min-w-0 flex-1 lg:pr-10">
          <p className="truncate text-[14px] leading-5 text-ink">{name}</p>
          <p className="truncate text-[12px] leading-4 text-ink-3">{item?.family}</p>
        </div>
        <motion.span className={`flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface text-ink-2 shadow-raised lg:absolute lg:left-0 ${carried}`} style={{ transform: icon }}>
          {ICON[c.id]}
        </motion.span>
      </div>

      <div className="relative isolate min-h-0 flex-1 overflow-hidden rounded-[19px]" style={{ boxShadow: '0 0 0 4px var(--bezel), 0 0 0 5px var(--line)' }}>
        <motion.div aria-hidden className={`pointer-events-none absolute inset-y-0 -z-10 ${layer} ${carried}`} style={{ ...layerVar, background: c.paint, transform: centre }}>
          <div className={`absolute -inset-[20%] ${on && !reduce ? 'plates-drift' : ''}`} style={{ background: `radial-gradient(32% 26% at 64% 30%, ${c.sheen}, transparent 70%)`, opacity: on ? 0.55 : 0.3, transition: 'opacity 300ms cubic-bezier(0.2,0,0,1)' }} />
          <div className="plates-grain absolute inset-0" />
        </motion.div>
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[19px]" style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.3)' }} />

        <motion.div aria-hidden className={`pointer-events-none absolute inset-y-0 ${layer} ${carried}`} style={{ ...layerVar, transform: centre }}>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={on ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: wide ? 0.86 : 0.5 }}
            transition={on ? { duration: 0.14, ease: UI } : { duration: 0.3, ease: UI, delay: 0.12 }}
          >
            {c.emblem}
          </motion.div>
        </motion.div>
        {!on && <button type="button" onClick={onPick} aria-label={`Open ${name}`} className="ring-focus absolute inset-0 rounded-[19px]" />}

        {mounted && (
          <motion.div className={`pointer-events-none absolute bottom-12 top-3 ${layer} ${carried}`} style={{ ...layerVar, transform: centre }}>
            <motion.div
              data-theme="light"
              className="pointer-events-auto absolute inset-0"
              style={{ contentVisibility: on ? 'visible' : 'hidden', background: 'transparent', contain: 'strict' }}
              inert={!on}
              initial={false}
              animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={on ? { duration: 0.32, ease: UI, delay: 0.14 } : { duration: 0.1, ease: UI }}
            >
              <div className="plates-part absolute left-1/2 top-0 h-full w-[min(600px,100%)] -translate-x-1/2">
                {Demo ? (
                  <Fit pad={16} max={1}>
                    <Demo />
                  </Fit>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {on && (
            <motion.div
              key="foot"
              className="absolute inset-x-0 bottom-0 flex h-12 items-center gap-3 px-4 text-[13px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25, ease: UI, delay: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
            >
              <span className="flex-1" />
              <Link href={`/components/${c.id}`} className="ring-focus group/open flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 text-white backdrop-blur-sm transition-[background-color,transform] duration-150 hover:bg-white/25 active:scale-[0.97]">
                Open
                <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const CSS = `
.plates-grain { background-image: ${GRAIN}; opacity: 0.1; mix-blend-mode: overlay; }
@keyframes plates-drift { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-8%, 10%) scale(1.12); } }
.plates-drift { animation: plates-drift 9s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate; will-change: transform; }
`
