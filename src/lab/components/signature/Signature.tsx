'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useAnimationControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'
import { Kbd } from '../../ui/Kbd'

/** For demos and tests: sign and seal as Enter would, or wipe the page. */
export type SignatureHandle = { sign(): Promise<void>; clear(): void }

/** Fountain-pen inks, each with a lighter twin for dark pages. */
const INKS = [
  { id: 'black', label: 'Black', css: 'var(--ink)' },
  { id: 'blue-black', label: 'Blue-black', css: 'light-dark(#1f2b5e, #a8b6ee)' },
  { id: 'royal', label: 'Royal blue', css: 'light-dark(#2350d8, #7d9cff)' },
]

const LEFT = 8
/** How fast the pen writes and lifts, in px a millisecond. */
const WRITE = 0.24
const LIFT = 1.1

/**
 * A pencil, drawn: a white barrel with a flat side catching the light and a grey nib, leaning
 * the way a right hand holds it. Its tip sits on its origin. Lifted, it floats higher and its
 * shadow spreads; on the page, the shadow tightens under it.
 */
function Pencil({ down }: { down: boolean }) {
  const id = useId()
  return (
    <motion.div className="absolute left-0 top-0" initial={false} animate={{ y: down ? 0 : -8, x: down ? 0 : 4 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
      <motion.svg
        width="14"
        height="150"
        viewBox="0 0 14 150"
        className="absolute"
        style={{ left: -7, top: -149, transformOrigin: '7px 149px', rotate: 32 }}
        initial={false}
        animate={{ filter: down ? 'drop-shadow(-3px 3px 2.5px rgb(0 0 0 / 0.2))' : 'drop-shadow(-10px 13px 8px rgb(0 0 0 / 0.14))' }}
        transition={{ duration: 0.22 }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#f3f3f5" />
            <stop offset="1" stopColor="#d4d4d9" />
          </linearGradient>
        </defs>
        <rect x="1" y="0" width="12" height="125" rx="2.5" fill={`url(#${id})`} stroke="rgb(0 0 0 / 0.08)" strokeWidth="0.75" />
        <rect x="9.3" y="4" width="1.7" height="118" rx="0.85" fill="#ffffff" opacity="0.9" />
        <path d="M1 125 L13 125 L8.1 144.5 Q7 147.6 5.9 144.5 Z" fill={`url(#${id})`} stroke="rgb(0 0 0 / 0.08)" strokeWidth="0.75" />
        <path d="M6 143.6 L7 149.4 L8 143.6 Z" fill="#8e8e93" />
        <rect x="1" y="122" width="12" height="1" fill="#e3e3e8" />
      </motion.svg>
    </motion.div>
  )
}

/**
 * The seal: a round rubber stamp, solid in the accent, with the words round its rim, an inner
 * ring and the signer's initials in the script, all knocked out of the ink. The ink is uneven the
 * way a real stamp's is: a fine speckle where the rubber didn't quite meet the page.
 */
function Seal({ initials, rim, fontFamily }: { initials: string; rim: string; fontFamily: string }) {
  const id = useId()
  const r = 33.5
  return (
    <svg aria-hidden width="92" height="92" viewBox="0 0 96 96" className="text-accent">
      <defs>
        <filter id={`${id}-rubber`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="7" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.55" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="inked" in2="warp" scale="1.2" />
        </filter>
        <path id={`${id}-rim`} d={`M 48 48 m -${r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 -${2 * r} 0`} />
        <mask id={`${id}-cut`}>
          <circle cx="48" cy="48" r="45" fill="#fff" />
          <circle cx="48" cy="48" r="40.5" fill="none" stroke="#000" strokeWidth="0.9" />
          <circle cx="48" cy="48" r="26" fill="none" stroke="#000" strokeWidth="1" />
          <text fontSize="7" fontWeight="650" letterSpacing="0.5" fill="#000" style={{ textTransform: 'uppercase' }}>
            <textPath href={`#${id}-rim`} textLength={2 * Math.PI * r - 3} lengthAdjust="spacing">
              {rim}
            </textPath>
          </text>
          <text x="48" y="56.5" textAnchor="middle" fontSize="26" fill="#000" style={{ fontFamily }}>
            {initials}
          </text>
        </mask>
      </defs>
      <g filter={`url(#${id}-rubber)`}>
        <circle cx="48" cy="48" r="45" fill="currentColor" mask={`url(#${id}-cut)`} />
      </g>
    </svg>
  )
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

/**
 * A document you sign by typing. Type your name and a pencil signs it above the line, a letter
 * at a time: the ink arrives behind its tip at the pace of a hand, with a wet edge where it's
 * still landing, and the tip rides the strokes it draws. Type faster than it writes and it keeps
 * up; delete and the ink lifts back off. Sign, or press Enter, and it finishes with a flourish,
 * lifts away, and a seal is stamped at the end of the name, its rim dated.
 *
 * The page is quiet print: a reference and the date in fine capitals, and the line itself a run
 * of microtext, carrying the signer's name, that reads as a hairline until you look closely.
 * Three fountain-pen inks. The script is any font you give it; a flowing one, like WindSong,
 * reads as a real signature.
 */
export function Signature({
  value,
  onChange,
  onSign,
  title = 'Agreement',
  reference,
  detail,
  fontFamily = "'WindSong', cursive",
  size = 54,
  pen = true,
  ref,
}: {
  /** The name being signed. */
  value: string
  onChange: (value: string) => void
  /** Called once it's sealed, with the name and when. */
  onSign?: (name: string, at: Date) => void
  /** What's being signed, in fine capitals at the top. */
  title?: string
  /** A reference beside the title, e.g. "Nº 0482". */
  reference?: string
  /** A line saying what the signature agrees to. */
  detail?: string
  /** The script it signs in, as a CSS font family. Load the font yourself. */
  fontFamily?: string
  /** The signature's size at its largest, in px. Long names shrink to fit the line. */
  size?: number
  /** Show the pencil that writes it. */
  pen?: boolean
  ref?: Ref<SignatureHandle>
}) {
  const paper = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const flourish = useRef<SVGPathElement>(null)
  const reduce = useReducedMotion()
  const inputId = useId()
  const [inkId, setInk] = useState('blue-black')
  const ink = INKS.find((i) => i.id === inkId) ?? INKS[0]
  // Where the ink has reached and where it's going, along the line, in px.
  const writing = useRef({ at: 0, to: 0, start: LEFT, columns: [] as number[][], base: 0 })
  const tipX = useMotionValue(LEFT)
  const tipY = useMotionValue(0)
  const [down, setDown] = useState(false)
  const [sealed, setSealed] = useState<Date | null>(null)
  const [w, setW] = useState(0)
  // The line the name sits on and how wide the name is, for the flourish under it and the seal after it.
  const [line, setLine] = useState({ base: 0, width: 0 })
  const drawn = useMotionValue(0)
  const drawnVisible = useTransform(drawn, (v) => (v > 0.001 ? 1 : 0))
  const flourishing = useRef(false)
  const [today] = useState(() => new Date())
  // The page gives under the stamp: a small thud as the seal lands.
  const thud = useAnimationControls()

  // Draw the whole name, then read where its ink sits in every column, for the pen to follow.
  useEffect(() => {
    const c = canvas.current
    const box = paper.current
    if (!c || !box || !w) return
    let live = true
    const h = box.clientHeight
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    const font = (s: number) => `${s}px ${fontFamily}`
    document.fonts.load(font(size), value || 'a').then(() => {
      if (!live) return
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Long names shrink to fit, leaving room for the seal at the end of the line.
      ctx.font = font(size)
      const room = w - LEFT - 100
      const fit = Math.min(size, size * (room / Math.max(1, ctx.measureText(value).width)))
      ctx.font = font(fit)
      const m = ctx.measureText(value)
      const base = h - 20
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = getComputedStyle(box).color
      ctx.fillText(value, LEFT, base)
      // The ink in each column, as the centres of its runs, so the pen can ride a stroke.
      const data = ctx.getImageData(0, 0, c.width, c.height).data
      const columns: number[][] = []
      for (let x = 0; x < w; x++) {
        const px = Math.round(x * dpr)
        const runs: number[] = []
        let from = -1
        for (let y = 0; y < c.height; y++) {
          const on = data[(y * c.width + px) * 4 + 3] > 90
          if (on && from < 0) from = y
          if (!on && from >= 0) {
            runs.push((from + y) / 2 / dpr)
            from = -1
          }
        }
        columns.push(runs)
      }
      const s = writing.current
      s.columns = columns
      s.base = base
      s.start = LEFT - m.actualBoundingBoxLeft
      s.to = value ? LEFT + m.actualBoundingBoxRight + 2 : 0
      if (!value) s.at = 0
      if (s.at < s.start && value) s.at = s.start
      setLine({ base, width: Math.max(0, s.to - LEFT) })
    })
    return () => {
      live = false
    }
  }, [value, w, fontFamily, size, inkId])

  useEffect(() => {
    const box = paper.current
    if (!box) return
    const ro = new ResizeObserver(() => setW(box.clientWidth))
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // The hand: each frame the ink moves toward where it's going, and the pen rides its edge.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let inking = false
    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      const s = writing.current
      const gap = s.to - s.at
      const moving = Math.abs(gap) > 0.5
      if (moving) s.at += reduce ? gap : Math.sign(gap) * Math.min(Math.abs(gap), (gap > 0 ? WRITE : LIFT) * dt)
      const c = canvas.current
      // A soft wet edge where the ink is still arriving.
      if (c) c.style.maskImage = `linear-gradient(to right, #000 ${Math.max(0, s.at) - 9}px, transparent ${Math.max(0, s.at) + 1}px)`
      if (!flourishing.current) {
        // The pen's tip: at the ink's edge, on the stroke nearest where it was.
        const col = s.columns[Math.max(0, Math.min(s.columns.length - 1, Math.round(s.at)))] ?? []
        const was = tipY.get() || s.base - 14
        const y = col.length ? col.reduce((a, b) => (Math.abs(b - was) < Math.abs(a - was) ? b : a)) : was
        tipX.set(Math.max(LEFT, s.at))
        tipY.set(was + (y - was) * 0.35)
        const now2 = moving && gap > 0
        if (now2 !== inking) {
          inking = now2
          setDown(now2)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduce, tipX, tipY])

  const sign = async () => {
    const s = writing.current
    if (!value.trim() || sealed) return
    // Wait for the hand to finish the last letter, then one flourish under the name.
    while (Math.abs(s.to - s.at) > 0.5) await new Promise((r) => setTimeout(r, 40))
    const path = flourish.current
    if (path) {
      const length = path.getTotalLength()
      flourishing.current = true
      setDown(true)
      await animate(drawn, 1, {
        duration: reduce ? 0 : 0.5,
        ease: ease.inOut,
        onUpdate: (v) => {
          const p = path.getPointAtLength(v * length)
          tipX.set(p.x)
          tipY.set(p.y)
        },
      })
      setDown(false)
      flourishing.current = false
    }
    const at = new Date()
    setSealed(at)
    onSign?.(value, at)
    if (!reduce) {
      await new Promise((r) => setTimeout(r, 110))
      tap()
      thud.start({ scale: [1, 0.993, 1], transition: { duration: 0.3, ease: ease.out } })
    } else tap()
  }
  const clear = () => {
    setSealed(null)
    drawn.set(0)
    onChange('')
  }
  useImperativeHandle(ref, () => ({ sign, clear }))

  const { base, width } = line
  const flourishD = `M ${LEFT + width * 0.1} ${base + 12} C ${LEFT + width * 0.4} ${base + 21}, ${LEFT + width * 0.68} ${base + 3}, ${LEFT + width + 6} ${base + 8}`
  const day = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const micro = `Signature · ${value.trim() || 'Your name'} · `.toUpperCase()

  return (
    <motion.div animate={thud} className="relative w-[520px] max-w-full rounded-[24px] bg-surface p-6 pb-5 shadow-raised">
      {/* Paper grain, just enough to feel. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full rounded-[24px] opacity-[0.07] mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-screen">
        <filter id={`${inputId}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${inputId}-grain)`} />
      </svg>

      {/* The document's head: what it is and its reference, the date, in fine capitals; then what it agrees to. */}
      <div className="relative flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
        <span>
          {title}
          {reference && <span className="text-ink-2"> · {reference}</span>}
        </span>
        <span className="tnum">{day(sealed ?? today)}</span>
      </div>
      {detail && <p className="relative mt-3 max-w-[400px] text-callout leading-[21px] text-ink-2">{detail}</p>}

      {/* Where the name is signed. */}
      <div ref={paper} className="relative mt-3 h-[108px]" style={{ color: ink.css }}>
        <canvas ref={canvas} role="img" aria-label={value ? `Signature: ${value}` : 'Not signed yet'} className="absolute inset-0 size-full" />
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <motion.path ref={flourish} d={flourishD} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ pathLength: drawn, opacity: drawnVisible }} />
        </svg>
        <AnimatePresence>
          {sealed && (
            <motion.div
              key="seal"
              className="pointer-events-none absolute -bottom-9 z-[5] mix-blend-multiply dark:mix-blend-normal"
              style={{ left: Math.min(w - 88, LEFT + width - 8) }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.7, rotate: 6 }}
              animate={{ opacity: 0.94, scale: 1, rotate: -12 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 560, damping: 24, mass: 0.9 }}
            >
              <Seal initials={initialsOf(value)} rim={`Signed and sealed · ${day(sealed)} · `} fontFamily={fontFamily} />
            </motion.div>
          )}
        </AnimatePresence>
        {pen && (
          <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10" style={{ x: tipX, y: tipY }} animate={{ opacity: sealed ? 0 : 1 }} transition={{ duration: 0.3 }}>
            <Pencil down={down} />
          </motion.div>
        )}
      </div>

      {/* The line: a run of microtext, carrying the name, that reads as a hairline until you look closely. */}
      <div aria-hidden className="relative flex items-center gap-2 text-ink-3">
        <span className="text-[13px] leading-none">×</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap text-[5.2px] font-semibold leading-none tracking-[0.2em]">{micro.repeat(14)}</span>
      </div>

      <div className="relative mt-3 flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="block font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            Signed by
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(e) => {
              setSealed(null)
              drawn.set(0)
              onChange(e.target.value)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), sign())}
            placeholder="Type your name"
            autoComplete="name"
            spellCheck={false}
            className="mt-1 w-full bg-transparent text-callout text-ink outline-none placeholder:text-ink-3"
          />
        </div>
        {/* Three inks, as dots. */}
        <div role="radiogroup" aria-label="Ink" className="flex items-center">
          {INKS.map((i) => (
            <button key={i.id} type="button" role="radio" aria-checked={inkId === i.id} aria-label={i.label} onPointerDown={tap} onClick={() => setInk(i.id)} className="ring-focus relative flex size-6 items-center justify-center rounded-full pointer-coarse:before:absolute pointer-coarse:before:-inset-1.5 pointer-coarse:before:content-['']">
              <span className={`size-3 rounded-full transition-shadow duration-200 ${inkId === i.id ? 'shadow-[0_0_0_2px_var(--surface),0_0_0_3.25px_currentColor]' : ''}`} style={{ background: i.css, color: i.css }} />
            </button>
          ))}
        </div>
      </div>

      {/* The actions and the sealed line take turns: one rolls out before the other rolls in, so they never sit on top of each other. */}
      <div className="relative mt-4 flex h-12 items-center justify-end gap-1 overflow-hidden border-t border-line pt-3">
        <AnimatePresence initial={false} mode="wait">
          {sealed ? (
            <motion.div key="sealed" className="flex items-center gap-2 text-footnote" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out } }} exit={{ opacity: 0, y: -10, transition: { duration: 0.12, ease: ease.exit } }}>
              <span className="text-ink">Signed and sealed</span>
              <span className="tnum text-ink-3">{sealed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={clear} className="ring-focus ml-2 h-8 pointer-coarse:h-9 rounded-full px-3 font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                Start over
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="actions" className="flex items-center gap-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out } }} exit={{ opacity: 0, y: -10, transition: { duration: 0.12, ease: ease.exit } }}>
              <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={clear} disabled={!value} className="ring-focus h-8 pointer-coarse:h-9 rounded-full px-3 text-footnote font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40">
                Clear
              </motion.button>
              <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={sign} disabled={!value.trim()} className="ring-focus flex h-8 pointer-coarse:h-9 items-center gap-2 rounded-full bg-ink pl-3.5 pr-1.5 pointer-coarse:pr-3.5 text-footnote font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40">
                Sign and seal
                <Kbd onInk>↵</Kbd>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
