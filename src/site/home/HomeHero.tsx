'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { PLANS, installCommand, isProComponent } from '@/catalog/pro'
import { ArrowRight, ArrowUpRight, Code, Mic, Note, Prompt } from '@/lab/icons'
import { Fit } from '@/site/Fit'
import { CopyCommand } from '@/site/parts'
import { BRIDGE, CARDS, GRAIN, LAYER, useWide } from './lights'
import type { Card } from './lights'
import type { LibItem } from './library'

/*
 * The home page's first sheet. The sentence sits in the middle: what's new above it, one quiet
 * line and the two ways in below. Under it, the four lights: each part on a mount, its colour in a
 * window behind a thin bezel. Point at one and it opens, the part running in it at its real size;
 * left alone, the row opens one after another. The full stop at the end of the sentence takes the
 * colour of whichever light is open, so the sentence and the lights move together.
 *
 * From the sheet's foot hangs a bridge to the next sheet, joined to both by concave curves, which
 * carries the install command for the open light.
 */

const UI = [0.2, 0, 0, 1] as const
const OPEN = { type: 'spring', stiffness: 280, damping: 34 } as const
const DWELL = 6500
/** The radius of the curves that join the bridge to the sheets. */
const JOIN = 22
const ICON: Record<string, ReactNode> = { prompt: <Prompt size={15} />, activity: <Note size={15} />, diff: <Code size={15} />, voice: <Mic size={15} /> }

export function HomeHero({ lib }: { lib: LibItem[] }) {
  const [open, setOpen] = useState(CARDS[0].id)
  const dot = CARDS.find((c) => c.id === open)?.dot
  return (
    <section className="px-2.5 sm:px-5">
      <div className="relative rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--leaf)', boxShadow: 'var(--leaf-edge)' }}>
        <div className="mx-auto max-w-[1440px] px-4 pb-3 pt-12 sm:px-8 sm:pb-4 sm:pt-16">
          <div className="flex flex-col items-center px-2 text-center">
            <Link href="/templates/rapport" className="rise ring-focus group/new inline-flex h-8 items-center gap-2 rounded-full bg-surface pl-1 pr-3 text-[13px] text-ink-2 shadow-raised transition-shadow duration-200 hover:shadow-[var(--elev-raised-hover)]">
              <span className="rounded-full bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-2 text-[11.5px] font-medium leading-6 text-[var(--accent-ink)]">New</span>
              Rapport, a CRM that follows up
              <ArrowRight size={12} className="text-ink-3 transition-transform duration-150 group-hover/new:translate-x-0.5" />
            </Link>
            <h1 className="focus-in mt-7 text-[clamp(42px,5vw,74px)] font-normal leading-[1.01] tracking-[-0.055em] text-ink">
              Most AI apps feel like demos.
              <br />
              <span className="text-quiet">Yours won’t</span>
              {/* The full stop, in the colour of the open light. */}
              <span aria-hidden className="ml-[0.03em] inline-block size-[0.15em] rounded-full align-baseline transition-colors duration-700 [transition-timing-function:cubic-bezier(0.2,0,0,1)]" style={{ background: dot }} />
              <span className="sr-only">.</span>
            </h1>
            <p className="rise mt-6 max-w-[540px] text-[16px] leading-[1.6] text-ink-3" style={{ animationDelay: '120ms' }}>
              The UI kit for AI products. <span className="text-ink">{lib.length} components</span> for streaming answers, tool{' '}calls, approvals and everything around them. Every state worked out, wired to the AI{'\u00a0'}SDK, styled by your theme.
            </p>
            <div className="rise mt-8 flex items-center gap-2.5" style={{ animationDelay: '200ms' }}>
              <Link href="/components" className="ring-focus group/go flex h-11 items-center whitespace-nowrap gap-1.5 rounded-full bg-ink pl-5 pr-4 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:opacity-90 active:scale-[0.97]">
                Browse components
                <ArrowRight size={14} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
              </Link>
              <Link href="/pro" className="ring-focus flex h-11 items-center whitespace-nowrap rounded-full bg-surface px-5 text-[14px] font-medium text-ink shadow-raised transition-[box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--elev-raised-hover)] active:scale-[0.97]">
                Get Pro<span className="hidden sm:inline">&nbsp;· ${PLANS[0].price}</span>
              </Link>
            </div>
          </div>
          <Plates lib={lib} onOpen={setOpen} className="rise mt-12 lg:mt-14 lg:h-[clamp(480px,calc(100svh-300px),620px)]" />
        </div>
        <Bridge id={open} />
      </div>
    </section>
  )
}

/**
 * The bridge between the first sheet and the next: the leaf's colour where it leaves, the paper's
 * where it lands, with concave curves at all four corners so it grows out of one and into the
 * other. It holds the install command for the open light, in a slot of fixed width, so a longer or
 * shorter command never moves it.
 */
function Bridge({ id }: { id: string }) {
  const free = !isProComponent(id)
  const corner = (x: 'left' | 'right', y: 'top' | 'bottom') => ({
    [x]: -JOIN,
    [y]: 0,
    width: JOIN,
    height: JOIN,
    background: `radial-gradient(circle at ${x === 'left' ? '0%' : '100%'} ${y === 'top' ? '100%' : '0%'}, transparent ${JOIN - 0.5}px, ${y === 'top' ? 'var(--leaf)' : 'var(--paper)'} ${JOIN}px)`,
  })
  return (
    <div className="absolute left-1/2 top-full z-10 flex -translate-x-1/2 items-center px-3" style={{ height: BRIDGE, background: 'linear-gradient(var(--leaf), var(--paper))' }}>
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

/** The row of four plates. `onOpen` hears which part is open; `className` places the row. */
function Plates({ lib, onOpen, className = '' }: { lib: LibItem[]; onOpen?: (id: string) => void; className?: string }) {
  const reduce = useReducedMotion()
  const wide = useWide()
  const [open, setOpen] = useState(0)
  const [held, setHeld] = useState(false)
  // The first part is there from the start; the rest mount one at a time once the page has settled.
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
      className={`flex flex-col gap-2 lg:flex-row ${className}`}
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
        <Plate key={c.id} c={c} item={lib.find((x) => x.id === c.id)} on={k === open} mounted={seen.includes(k)} wide={wide} onAim={() => aim(k)} onPick={() => show(k)} />
      ))}
    </div>
  )
}

function Plate({ c, item, on, mounted, wide, onAim, onPick }: { c: Card; item?: LibItem; on: boolean; mounted: boolean; wide: boolean; onAim: () => void; onPick: () => void }) {
  const reduce = useReducedMotion()
  const Demo = DEMOS[c.id]
  const name = item?.name ?? c.id
  // The colour layer is fixed-width on a laptop so nothing repaints as a plate opens; full width on a phone. Set in CSS, so the server's HTML already matches the screen.
  const layer = 'left-0 w-full lg:left-1/2 lg:w-[var(--layer)] lg:ml-[calc(var(--layer)/-2)]'
  const layerVar = { '--layer': `${LAYER}px` } as CSSProperties

  return (
    // On a phone the plates stack and their height comes from CSS, so the server's HTML is already
    // the right size at any width and nothing below moves once the page wakes up. On a laptop they
    // share the row, and Motion springs their widths.
    <motion.div
      className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] p-1.5 max-lg:!grow-0 max-lg:!basis-auto max-lg:transition-[height] max-lg:duration-500 max-lg:[transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${on ? 'max-lg:h-[520px]' : 'max-lg:h-[168px]'}`}
      style={{ background: 'var(--mount)', boxShadow: 'inset 0 0 0 1px var(--line)', contain: 'layout paint' }}
      initial={false}
      animate={wide ? { flexGrow: on ? 2.8 : 1, flexBasis: '0px' } : { flexGrow: 0, flexBasis: 'auto' }}
      transition={reduce ? { duration: 0 } : OPEN}
      onPointerEnter={onAim}
    >
      {/* The mount: its name, its family under it, and its icon in a framed square. */}
      <div className="flex h-[52px] shrink-0 items-center gap-3 px-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-5 text-ink">{name}</p>
          <p className="truncate text-[12px] leading-4 text-ink-3">{item?.family}</p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface text-ink-2 shadow-raised">{ICON[c.id]}</span>
      </div>

      {/* The window of colour, set into the mount behind a thin bezel. */}
      <div className="relative isolate min-h-0 flex-1 overflow-hidden rounded-[19px]" style={{ boxShadow: '0 0 0 4px var(--bezel), 0 0 0 5px var(--line)' }}>
        <div aria-hidden className={`pointer-events-none absolute inset-y-0 -z-10 ${layer}`} style={{ ...layerVar, background: c.paint }}>
          <div className={`absolute -inset-[20%] ${on && !reduce ? 'plates-drift' : ''}`} style={{ background: `radial-gradient(32% 26% at 64% 30%, ${c.sheen}, transparent 70%)`, opacity: on ? 0.55 : 0.3, transition: 'opacity 600ms cubic-bezier(0.2,0,0,1)' }} />
          <div className="plates-grain absolute inset-0" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[19px]" style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.3)' }} />

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={on ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: wide ? 0.86 : 0.5 }}
          transition={on ? { duration: 0.14, ease: UI } : { duration: 0.3, ease: UI, delay: 0.12 }}
        >
          {c.emblem}
        </motion.div>
        {!on && <button type="button" onClick={onPick} aria-label={`Open ${name}`} className="ring-focus absolute inset-0 rounded-[19px]" />}

        {mounted && (
          <motion.div
            data-theme="light"
            className={`absolute bottom-12 top-3 ${layer}`}
            style={{ ...layerVar, contentVisibility: on ? 'visible' : 'hidden', background: 'transparent', contain: 'strict' }}
            inert={!on}
            initial={false}
            animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={on ? { duration: 0.32, ease: UI, delay: 0.14 } : { duration: 0.1, ease: UI }}
          >
            <div className="absolute left-1/2 top-0 h-full w-[min(600px,100%)] -translate-x-1/2">
              {Demo ? (
                <Fit pad={16} max={1}>
                  <Demo />
                </Fit>
              ) : null}
            </div>
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
              <span className="min-w-0 flex-1 truncate text-white/85">{c.line}</span>
              <Link href={`/components/${c.id}`} className="ring-focus group/open flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/25">
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
