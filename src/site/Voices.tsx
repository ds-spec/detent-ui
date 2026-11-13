'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, FocusEvent, KeyboardEvent as KeyEvent, MouseEvent } from 'react'
import { AnimatePresence, MotionConfig, motion, useDragControls, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { MotionValue, PanInfo } from 'motion/react'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, ChevronRight, Close } from '@/lab/icons'
import { useOwned } from './Owned'
import { track } from './track'
import { Face, QuoteMark } from './VoiceRail'
import { VOICES, byline, source } from './quotes'
import type { Voice } from './quotes'

const SEEN = 'detent:voices'
const FIRST = 'detent:voices-first'
const AUTO = 1100
const N = VOICES.length
const ease = [0.2, 0.9, 0.25, 1] as const
const SPRING = { type: 'spring', stiffness: 520, damping: 44 } as const
const FLY = { type: 'spring', stiffness: 380, damping: 34 } as const
const GROW = { type: 'spring', stiffness: 420, damping: 42 } as const
const OUT = { duration: 0.14, ease } as const
const STAY = 9000
const AGAIN = 3500
const FACE = 30
const BIG = 44
const GAP = 10
const MIN = 14
const MAX = 24

const VARS = {
  '--v-hi': 'light-dark(rgb(255 255 255 / 0), rgb(255 255 255 / .07))',
  '--v-edge': 'light-dark(rgb(0 0 0 / .1), rgb(255 255 255 / .13))',
  '--v-near': 'light-dark(rgb(0 0 0 / .05), rgb(0 0 0 / .4))',
  '--v-drop': 'light-dark(rgb(0 0 0 / .16), rgb(0 0 0 / .62))',
  '--v-tray': 'light-dark(#f1f1ef, #19191c)',
  '--v-sheet': 'light-dark(#ffffff, #27272b)',
  '--v-sheet-edge': 'light-dark(rgb(0 0 0 / .07), rgb(255 255 255 / .07))',
  '--v-sheet-hi': 'light-dark(rgb(255 255 255 / 1), rgb(255 255 255 / .07))',
  '--v-sheet-drop': 'light-dark(rgb(0 0 0 / .06), rgb(0 0 0 / .45))',
  '--v-chip': 'light-dark(rgb(0 0 0 / .045), rgb(255 255 255 / .07))',
  '--v-chip-hover': 'light-dark(rgb(0 0 0 / .08), rgb(255 255 255 / .12))',
} as CSSProperties

const FLOAT = 'shadow-[inset_0_1px_0_var(--v-hi),0_0_0_0.5px_var(--v-edge),0_1px_3px_var(--v-near),0_24px_56px_-14px_var(--v-drop)]'
const CURVE = '[transition-timing-function:cubic-bezier(.2,.9,.25,1)]'

const SWAP = {
  enter: (d: number) => ({ opacity: 0, x: d * 16 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24, ease } },
  exit: (d: number) => ({ opacity: 0, x: d * -16, transition: { duration: 0.12, ease } }),
}

export type Peek = { at: string; who: string; text: string }

const say = (v: Voice) => v.short ?? v.text

const type = (size: number): CSSProperties => {
  const t = Math.min(1, Math.max(0, (size - MIN) / (MAX - MIN)))
  return { fontSize: size, lineHeight: `${(1.5 - t * 0.28).toFixed(3)}`, letterSpacing: `${(-0.006 - t * 0.02).toFixed(4)}em` }
}

const seen = () => {
  try {
    return sessionStorage.getItem(SEEN) === '1'
  } catch {
    return false
  }
}

const firstVisit = () => {
  try {
    if (localStorage.getItem(FIRST)) return false
    localStorage.setItem(FIRST, '1')
    return true
  } catch {
    return false
  }
}

const mark = () => {
  try {
    sessionStorage.setItem(SEEN, '1')
  } catch {}
}

function fit(probe: HTMLElement, width: number, height: number) {
  probe.style.width = `${width}px`
  return VOICES.map((p) => {
    probe.textContent = say(p)
    let lo = MIN
    let hi = MAX
    while (hi - lo > 0.25) {
      const mid = (lo + hi) / 2
      const t = type(mid)
      probe.style.fontSize = `${mid}px`
      probe.style.lineHeight = String(t.lineHeight)
      probe.style.letterSpacing = String(t.letterSpacing)
      if (probe.scrollHeight <= height) lo = mid
      else hi = mid
    }
    return Math.floor(lo * 2) / 2
  })
}

function Dot({ id, fresh }: { id: string; fresh: boolean }) {
  return (
    <motion.span
      layoutId={`${id}-dot`}
      aria-hidden
      className="absolute -bottom-[7px] left-[calc(50%-2px)] size-1 rounded-full bg-ink"
      initial={fresh ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.08 } }}
      transition={{ layout: SPRING, default: { duration: 0.2, delay: fresh ? 0.18 : 0 } }}
    />
  )
}

function DockFace({ p, i, cur, id, mx, fresh, onPick }: { p: Voice; i: number; cur: number; id: string; mx: MotionValue<number>; fresh: boolean; onPick: (i: number) => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const on = i === cur
  const near = useTransform(mx, (x) => {
    const r = ref.current?.getBoundingClientRect()
    return r ? x - (r.left + r.width / 2) : Infinity
  })
  const size = useSpring(useTransform(near, [-120, 0, 120], [FACE, BIG, FACE], { clamp: true }), { stiffness: 420, damping: 34, mass: 0.5 })
  const from = { opacity: 0, x: (cur - i) * (FACE + GAP), scale: 0.8 }
  return (
    <motion.button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={on}
      aria-controls={`${id}-q`}
      aria-label={p.name}
      tabIndex={on ? 0 : -1}
      onClick={() => onPick(i)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
      initial={on ? false : from}
      animate={{ opacity: 1, x: 0, scale: 1, transition: FLY }}
      exit={on ? { transition: { duration: 0 } } : { ...from, transition: OUT }}
      style={{ width: size, height: size }}
      className="group/f relative shrink-0 rounded-full outline-none before:absolute before:-inset-1.5 before:content-[''] active:brightness-90"
    >
      <motion.span layoutId={`${id}-face-${p.id}`} transition={FLY} className="block size-full rounded-full shadow-[0_0_0_1px_var(--v-sheet-edge),0_1px_2px_var(--v-sheet-drop)] transition-shadow duration-150 group-focus-visible/f:shadow-[0_0_0_2px_var(--v-tray),0_0_0_4px_var(--accent)]">
        <Face v={p} ring={false} className={`size-full transition-[opacity,filter] duration-200 ${on ? '' : 'opacity-75 saturate-[.35] [@media(hover:hover)]:group-hover/f:opacity-100 [@media(hover:hover)]:group-hover/f:saturate-100'}`} />
      </motion.span>
      {on && <Dot id={id} fresh={fresh} />}
      <AnimatePresence>
        {hover && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.14, ease } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="pointer-events-none absolute bottom-[calc(100%+7px)] left-1/2 z-10 -ml-[50vw] flex w-[100vw] justify-center"
          >
            <span className="whitespace-nowrap rounded-[6px] bg-ink px-[7px] py-[3px] text-[11.5px] leading-[15px] text-surface">{p.name}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function Voices({ peek, hideAt = 'footer', dodge, auto = false }: { peek?: Peek; hideAt?: string; dodge?: string; auto?: boolean }) {
  const start = Math.max(
    0,
    VOICES.findIndex((v) => v.id === peek?.who),
  )
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(start)
  const [dir, setDir] = useState(1)
  const [peeking, setPeeking] = useState(false)
  const [away, setAway] = useState(false)
  const [dodging, setDodging] = useState(false)
  const [held, setHeld] = useState(false)
  const [tabAway, setTabAway] = useState(false)
  const [fresh, setFresh] = useState(true)
  const [tip, setTip] = useState(true)
  const [sizes, setSizes] = useState<number[]>([])
  const owned = useOwned()
  const path = usePathname()
  const id = useId()
  const drag = useDragControls()
  const mx = useMotionValue(Infinity)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLParagraphElement>(null)
  const live = useRef({ open: false, away: false })
  const stays = useRef(0)

  const at = peek?.at
  const lead = VOICES[start]
  const studio = lead.role?.split(',')[0]
  const v = VOICES[cur]

  useEffect(() => {
    live.current = { open, away }
  }, [open, away])

  useEffect(() => {
    if (!auto || owned !== null) return
    const t = window.setTimeout(() => {
      if (live.current.open || live.current.away || window.scrollY > 200 || !firstVisit()) return
      mark()
      setPeeking(false)
      setFresh(true)
      setOpen(true)
      track('voices_open', { from: 'auto', page: location.pathname })
    }, AUTO)
    return () => window.clearTimeout(t)
  }, [auto, owned])

  useEffect(() => {
    if (!at || owned !== null || seen()) return
    const el = document.querySelector(at)
    if (!el) return
    let wait = 0
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(wait)
        if (!e?.isIntersecting) return
        wait = window.setTimeout(() => {
          io.disconnect()
          if (seen() || live.current.open || live.current.away) return
          mark()
          stays.current = 0
          setPeeking(true)
          track('voices_peek', { page: location.pathname })
        }, 900)
      },
      { rootMargin: '0px 0px -35% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(wait)
    }
  }, [at, owned])

  useEffect(() => {
    if (!peeking || held || tabAway) return
    const t = window.setTimeout(() => setPeeking(false), stays.current++ === 0 ? STAY : AGAIN)
    return () => window.clearTimeout(t)
  }, [peeking, held, tabAway])

  useEffect(() => {
    const on = () => setTabAway(document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  useEffect(() => {
    const els = [...document.querySelectorAll(hideAt)]
    if (!els.length) return
    const near = new Set<Element>()
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) near.add(e.target)
          else near.delete(e.target)
        }
        setAway(near.size > 0)
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [hideAt])

  useEffect(() => {
    if (!dodge) return
    const els = [...document.querySelectorAll<HTMLElement>(dodge)]
    if (!els.length) return
    let io: IntersectionObserver | null = null
    const watch = () => {
      io?.disconnect()
      const near = new Set<Element>()
      io = new IntersectionObserver(
        (es) => {
          for (const e of es) {
            if (e.isIntersecting && e.boundingClientRect.left < 96) near.add(e.target)
            else near.delete(e.target)
          }
          setDodging(near.size > 0)
        },
        { rootMargin: `-${Math.max(0, window.innerHeight - 140)}px 0px 0px 0px` },
      )
      els.forEach((el) => io!.observe(el))
    }
    watch()
    window.addEventListener('resize', watch)
    return () => {
      window.removeEventListener('resize', watch)
      io?.disconnect()
    }
  }, [dodge])

  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  useLayoutEffect(() => {
    const box = area.current
    const el = probe.current
    if (!open || !box || !el) return
    let w = 0
    const ro = new ResizeObserver(() => {
      if (box.clientWidth === w) return
      w = box.clientWidth
      const fitted = fit(el, box.clientWidth, box.clientHeight)
      const one = Math.min(...fitted)
      setSizes(fitted.map(() => one))
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [open])

  const show = (from: 'dock' | 'peek', e: MouseEvent) => {
    setPeeking(false)
    setHeld(false)
    setFresh(true)
    mark()
    if (from === 'peek') setCur(start)
    setOpen(true)
    track('voices_open', { from, page: path })
    if (e.detail === 0) window.setTimeout(() => tabs.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(), 0)
  }

  const pick = (i: number, focus = false) => {
    if (i < 0 || i >= N || i === cur) return
    setDir(i > cur ? 1 : -1)
    setCur(i)
    setFresh(false)
    if (focus) window.setTimeout(() => tabs.current?.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus(), 0)
  }

  const keys = (e: KeyEvent) => {
    const to = e.key === 'ArrowRight' ? cur + 1 : e.key === 'ArrowLeft' ? cur - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? N - 1 : null
    if (to === null) return
    e.preventDefault()
    pick(Math.max(0, Math.min(N - 1, to)), true)
  }

  const swiped = (_: unknown, info: PanInfo) => {
    const reach = info.offset.x + info.velocity.x * 0.2
    if (reach < -48) pick(cur + 1)
    else if (reach > 48) pick(cur - 1)
  }

  const leave = (e: FocusEvent) => {
    if (open && e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) setOpen(false)
  }

  const hidden = (away || dodging) && !open
  const bubble = peeking && !away && !open && !!peek
  const size = sizes[cur] ?? 16

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={VARS}
        className={`pointer-events-none fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-3 z-[55] transition-transform duration-300 ${CURVE} motion-reduce:transition-none sm:bottom-5 sm:left-5 [html[data-buybar]_&]:-translate-y-[68px] md:[html[data-buybar]_&]:translate-y-0`}
      >
        <div ref={root} onBlur={leave} inert={hidden} className={`relative transition-[opacity,translate] duration-200 ${CURVE} motion-reduce:transition-none ${hidden ? 'translate-y-2 opacity-0' : ''}`}>
          <AnimatePresence>
            {open && (
              <motion.div
                key="panel"
                id={id}
                role="dialog"
                aria-label="What people said about Detent"
                onKeyDown={keys}
                exit={{ transition: { duration: 0.2 } }}
                className="pointer-events-auto absolute bottom-[calc(100%+10px)] left-0 w-[calc(100vw-24px)] sm:w-[352px]"
              >
                <motion.div
                  aria-hidden
                  className={`absolute inset-0 origin-bottom-left rounded-[22px] bg-[var(--v-tray)] ${FLOAT}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, transition: GROW }}
                  exit={{ opacity: 0, scale: 0.96, transition: OUT }}
                />
                <div className="relative">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { ...GROW, delay: 0.04 } }} exit={{ opacity: 0, y: 4, transition: OUT }}>
                    <div className="relative m-1.5 h-[clamp(150px,calc(100dvh-230px),198px)] overflow-hidden rounded-[16px] bg-[var(--v-sheet)] shadow-[inset_0_1px_0_var(--v-sheet-hi),0_0_0_0.5px_var(--v-sheet-edge),0_1px_2px_var(--v-sheet-drop),0_8px_18px_-10px_var(--v-sheet-drop)]">
                      <div ref={area} aria-hidden className="pointer-events-none invisible absolute inset-x-[18px] bottom-[52px] top-[18px]">
                        <p ref={probe} className="whitespace-pre-line text-pretty" />
                      </div>
                      <AnimatePresence initial={false} custom={dir}>
                        <motion.div
                          key={v.id}
                          id={`${id}-q`}
                          role="tabpanel"
                          aria-label={v.name}
                          custom={dir}
                          variants={SWAP}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          drag="x"
                          dragListener={false}
                          dragControls={drag}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.18}
                          dragTransition={{ bounceStiffness: 520, bounceDamping: 40 }}
                          onDragEnd={swiped}
                          onPointerDown={(e) => e.pointerType === 'touch' && drag.start(e)}
                          className="absolute inset-x-[18px] bottom-[14px] top-[18px] flex touch-pan-y flex-col"
                        >
                          <p className="min-h-0 flex-1 whitespace-pre-line text-pretty text-ink" style={type(size)}>
                            {say(v)}
                          </p>
                          <p className="flex min-w-0 items-center whitespace-nowrap text-[12px] leading-4 text-ink-3">
                            <span className="shrink-0 text-[12.5px] font-medium text-ink">{v.name}</span>
                            <span aria-hidden className="px-[0.45em] text-[var(--quiet)]">
                              ·
                            </span>
                            <span className="min-w-0 truncate">{byline(v)}</span>
                            {source(v) && (
                            <a
                              href={source(v)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${v.name} on X`}
                              className="ring-focus group/src ml-auto inline-flex h-[22px] shrink-0 items-center gap-0.5 rounded-full bg-[var(--v-chip)] pl-2 pr-1.5 text-[11.5px] text-ink-2 transition-[color,background-color,scale] duration-150 hover:bg-[var(--v-chip-hover)] hover:text-ink active:scale-[.96] motion-reduce:active:scale-100"
                            >
                              on X
                              <ArrowUpRight size={9} strokeWidth={2.2} className="transition-transform duration-150 group-hover/src:-translate-y-px group-hover/src:translate-x-px" />
                            </a>
                            )}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  <div
                    ref={tabs}
                    role="tablist"
                    aria-label="People"
                    onPointerMove={(e) => e.pointerType === 'mouse' && mx.set(e.clientX)}
                    onPointerLeave={() => mx.set(Infinity)}
                    className="flex h-[58px] items-end justify-center pb-[11px]"
                    style={{ gap: GAP }}
                  >
                    {VOICES.map((p, i) => (
                      <DockFace key={p.id} p={p} i={i} cur={cur} id={id} mx={mx} fresh={fresh} onPick={pick} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {bubble && (
              <motion.div
                key="peek"
                initial={{ opacity: 0, scale: 0.94, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0, transition: SPRING }}
                exit={{ opacity: 0, scale: 0.98, x: -3, transition: OUT }}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
                onPointerLeave={() => setHeld(false)}
                onFocus={() => setHeld(true)}
                onBlur={() => setHeld(false)}
                className={`group/bubble pointer-events-auto absolute bottom-0 left-[calc(100%+10px)] w-[300px] max-w-[calc(100vw-82px)] origin-bottom-left rounded-[12px] bg-surface pointer-coarse:max-w-[calc(100vw-90px)] ${FLOAT}`}
              >
                <button type="button" onClick={(e) => show('peek', e)} className="ring-focus group/peek block w-full rounded-[inherit] px-3 pb-3 pt-2.5 text-left">
                  <span className="flex items-baseline whitespace-nowrap text-[12px] leading-4 text-ink-3">
                    <span className="font-medium text-ink-2">{lead.name}</span>
                    {studio && (
                      <>
                        <span aria-hidden className="px-[0.45em] text-[var(--quiet)]">
                          ·
                        </span>
                        <span className="truncate">{studio}</span>
                      </>
                    )}
                    <span className="ml-auto flex shrink-0 items-center gap-px pl-3 text-ink-3 transition-colors duration-150 group-hover/peek:text-ink">
                      All {N}
                      <ChevronRight size={11} strokeWidth={2.2} className="transition-transform duration-150 group-hover/peek:translate-x-px" />
                    </span>
                  </span>
                  <span className="mt-[5px] block text-pretty text-[13px] leading-5 text-ink">{peek?.text}</span>
                </button>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setPeeking(false)}
                  className={`ring-focus absolute -left-2 -top-2 grid size-5 place-items-center rounded-full bg-surface text-ink-3 opacity-0 transition-[color,opacity,scale] duration-150 before:absolute before:-inset-2.5 before:content-[''] hover:text-ink focus-visible:opacity-100 active:scale-[.9] group-focus-within/bubble:opacity-100 group-hover/bubble:opacity-100 motion-reduce:active:scale-100 pointer-coarse:opacity-100 ${FLOAT}`}
                >
                  <Close size={10} strokeWidth={2.6} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls={open ? id : undefined}
            aria-label={open ? 'Close what people said' : `What people said about Detent, ${N} people`}
            onClick={(e) => {
              setTip(false)
              if (open) setOpen(false)
              else show('dock', e)
            }}
            onPointerLeave={() => setTip(true)}
            className={`ring-focus group/dock pointer-events-auto relative grid size-9 place-items-center rounded-full bg-surface transition-[scale] duration-150 active:scale-[.95] motion-reduce:active:scale-100 pointer-coarse:size-11 ${FLOAT}`}
          >
            {!open && (
              <motion.span layoutId={`${id}-face-${v.id}`} transition={FLY} aria-hidden className="relative grid size-[30px] place-items-center pointer-coarse:size-[38px]">
                <Face v={v} ring={false} className="size-full" />
              </motion.span>
            )}
            <motion.span
              aria-hidden
              className="absolute -bottom-[3px] -right-[3px] grid size-[15px] place-items-center rounded-full bg-ink text-surface shadow-[0_0_0_2px_var(--surface)]"
              initial={false}
              animate={open ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1, transition: { ...SPRING, delay: 0.12 } }}
              transition={{ duration: 0.14, ease }}
            >
              <QuoteMark size={7} />
            </motion.span>
            <motion.span
              aria-hidden
              className="absolute inset-0 grid place-items-center text-ink"
              initial={false}
              animate={open ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.6, rotate: -45 }}
              transition={{ duration: 0.18, ease }}
            >
              <Close size={14} strokeWidth={2.2} />
            </motion.span>
            {!open && !bubble && tip && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-[7px] bg-ink py-[5px] pl-2 pr-[5px] text-[12px] leading-4 text-surface opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-hover/dock:opacity-100 [@media(hover:hover)]:group-hover/dock:delay-300"
              >
                What people said
                <span className="rounded-[4px] bg-[color-mix(in_oklch,var(--surface)_16%,transparent)] px-[5px] text-[11px] tabular-nums">{N}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </MotionConfig>
  )
}
