'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from '@/lab/icons'
import { BLOCK_GROUPS, BLOCK_ORDER, KINDS } from '@/catalog/blocks'
import { isProBlock } from '@/catalog/pro'
import type { Block } from '@/catalog/blocks'
import { BLOCK_VIEWS } from '@pro'
import { watchLine } from '../line'
import { useNear } from '../near'
import { useSite } from '../Providers'
import { Backdrop, Window } from './Studio'

/**
 * Every block by name, grouped by what it is, and the one on the reading line running beside
 * them in its own window, at the size the window gives it. Nothing changes until you scroll or
 * press a name; the scroll has detents, so each name settles on the line. Press it again, or its
 * Open, to go to its page; what's running is named above the window, so the way in is always in
 * view. All but five blocks are Pro. Below 1024px each name carries its block underneath it instead.
 */

const GROUPS = BLOCK_GROUPS
const ALL = BLOCK_ORDER
const first = (s: string) => s.split(/(?<=\.)\s/)[0]
/** At the stage's width an app's own sidebar may fold away, and the unified window's lights would sit on its content: so every window here has a title bar. */
const bar = (b: Block) => (b.chrome === 'browser' ? 'browser' : 'titled')

export function BlockIndex() {
  const { tick } = useSite()
  const router = useRouter()
  const [at, setAt] = useState(0)
  const [stage, setStage] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const now = useRef(0)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    return watchLine(el, [...el.querySelectorAll<HTMLElement>('[data-at]')], (row) => {
      const i = Number(row.dataset.at)
      if (i === now.current) return
      now.current = i
      setAt(i)
      tick()
      if (settle.current) clearTimeout(settle.current)
      settle.current = setTimeout(() => setStage(i), 160)
    })
  }, [tick])

  const b = ALL[stage]
  const View = BLOCK_VIEWS[b.id]
  let n = -1

  return (
    <div ref={box} className="index-detents grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <ol aria-label="Blocks" className="lg:pb-[calc(100dvh-180px)]">
        {GROUPS.map(({ k, items }) => (
          <li key={k}>
            <p className="pb-2 pl-7 pt-12 text-footnote text-ink-3 first:pt-0">
              {KINDS[k]}s <span className="tnum">{items.length}</span>
            </p>
            <ol>
              {items.map((it) => {
                const i = ++n
                const on = i === at
                return (
                  <li key={it.id} className="relative lg:snap-start lg:scroll-mt-[calc(var(--read-line,150px)-28px)]">
                    <button
                      type="button"
                      data-at={i}
                      aria-current={on ? 'true' : undefined}
                      aria-label={on ? `Open ${it.name}` : undefined}
                      onClick={(e) => (on ? router.push(`/blocks/${it.id}`) : e.currentTarget.closest('li')!.scrollIntoView({ behavior: 'smooth', block: 'start' }))}
                      className="ring-focus group relative hidden h-[56px] w-full items-center gap-3 rounded-[12px] pl-7 pr-24 text-left lg:flex"
                    >
                      {on && <motion.span layoutId="block-tick" aria-hidden className="absolute left-1 top-[calc(50%-1px)] h-[2px] w-3 rounded-full bg-[var(--accent)]" transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
                      <span className={`min-w-0 truncate text-[clamp(24px,2.4vw,34px)] font-normal leading-[1.1] tracking-[-0.045em] transition-colors duration-200 ${on ? 'text-ink' : 'text-ink/25 group-hover:text-ink/50'}`}>{it.name}</span>
                    </button>
                    <Link
                      href={`/blocks/${it.id}`}
                      tabIndex={on ? 0 : -1}
                      aria-hidden={!on}
                      className={`ring-focus absolute right-0 top-[28px] hidden h-8 -translate-y-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 text-footnote font-medium text-surface transition-[opacity,transform] duration-200 lg:flex ${on ? 'opacity-100' : 'pointer-events-none translate-x-[-4px] opacity-0'}`}
                    >
                      Open <ArrowRight size={13} />
                    </Link>
                    <Inline b={it} />
                  </li>
                )
              })}
            </ol>
          </li>
        ))}
      </ol>

      {/* The stage: the block in its window, and what it is under it. */}
      <div className="sticky top-24 hidden h-[calc(100dvh-128px)] min-h-[620px] flex-col gap-3 lg:flex">
        <Caption b={b} />
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] p-6">
          <Backdrop />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={b.id} className="absolute inset-6" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.2, 0.9, 0.25, 1] } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <Reveal>
                <Window title={b.window} chrome={bar(b)}>
                  <View />
                </Window>
              </Reveal>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/**
 * Holds a window back until the block inside it has arrived (each block is its own chunk), then
 * fades it in whole, so an empty frame and its shadow never land first with the app popping in
 * after. It never waits longer than a moment.
 */
function Reveal({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const arrived = () => !!el.querySelector('.pro-app')
    let done = false
    const show = () => {
      if (done) return
      done = true
      setReady(true)
    }
    const mo = new MutationObserver(() => arrived() && requestAnimationFrame(show))
    mo.observe(el, { childList: true, subtree: true })
    const cap = setTimeout(show, 700)
    const now = requestAnimationFrame(() => arrived() && show())
    return () => {
      mo.disconnect()
      clearTimeout(cap)
      cancelAnimationFrame(now)
    }
  }, [])
  return (
    <div ref={box} className="absolute inset-0 transition-opacity duration-200 ease-out" style={{ opacity: ready ? 1 : 0 }}>
      {children}
    </div>
  )
}

/** Over the stage: the block's name, its kind and what it does, and the way to its page. */
function Caption({ b }: { b: Block }) {
  return (
    <div className="flex h-[84px] shrink-0 items-center gap-6 rounded-[24px] bg-surface px-6 shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <p className="flex items-center gap-2 text-callout font-medium text-ink">
              {b.name}
              {isProBlock(b.id) ? (
                <span className="rounded-full bg-ink px-1.5 text-[10.5px] font-semibold leading-[17px] text-surface">Pro</span>
              ) : (
                <span className="rounded-full px-1.5 text-[10.5px] font-semibold leading-[17px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">Free</span>
              )}
              <span className="text-caption font-normal text-ink-3">{KINDS[b.kind]}</span>
            </p>
            <p className="mt-0.5 truncate text-footnote text-ink-3">{first(b.line)}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <Link href={`/blocks/${b.id}`} className="ring-focus flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-footnote font-medium text-surface transition-opacity hover:opacity-90">
        Open <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/** Below 1024px: the name, then its block in a window under it, running once it's near. */
function Inline({ b }: { b: Block }) {
  const box = useRef<HTMLDivElement>(null)
  const near = useNear(box, '240px 0px', '480px 0px')
  const View = BLOCK_VIEWS[b.id]
  return (
    <div className="pb-8 pt-2 lg:hidden">
      <Link href={`/blocks/${b.id}`} className="ring-focus flex items-center gap-2 rounded-[10px] pb-3">
        <span className="min-w-0 flex-1 text-[26px] font-normal leading-[1.1] tracking-[-0.045em] text-ink">{b.name}</span>
        <ArrowRight size={16} className="text-ink-3" />
      </Link>
      <div className="relative h-[600px] overflow-hidden rounded-[24px] p-3">
        <Backdrop />
        <div ref={box} className="relative h-full">
          <Window title={b.window} chrome={bar(b)}>
            {near ? <View /> : null}
          </Window>
        </div>
      </div>
    </div>
  )
}
