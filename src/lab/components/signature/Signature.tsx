'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'

/** For demos and tests: finish the signature as Enter would, or wipe it. */
export type SignatureHandle = { sign(): Promise<void>; clear(): void }

const LEFT = 30
/** How fast the pen writes and lifts, in px a millisecond. */
const WRITE = 0.24
const LIFT = 1.1

/**
 * A pencil, drawn: a white barrel with a flat side catching the light and a grey nib, leaning
 * the way a right hand holds it. Its tip sits on the point it's given. Lifted, it floats higher
 * and its shadow spreads; on the page, the shadow tightens under it.
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
 * A signature that writes itself as you type. Each letter you type, a pencil signs: the ink
 * appears behind its tip, left to right, at the pace of a hand, and the tip rides the strokes it
 * draws rather than a straight line. Type faster than it writes and it keeps up without
 * skipping; delete and the ink lifts back off the page. Press Enter and it finishes with a
 * flourish under the name, lifts away, and dates the signature.
 *
 * The script is any font you give it; a flowing one, like WindSong, reads as a real signature.
 */
export function Signature({
  value,
  onChange,
  onSign,
  fontFamily = "'WindSong', cursive",
  size = 58,
  pen = true,
  label = 'Your full name',
  ref,
}: {
  /** The name being signed. */
  value: string
  onChange: (value: string) => void
  /** Called on Enter, once the flourish is drawn, with the name and when it was signed. */
  onSign?: (name: string, at: Date) => void
  /** The script it signs in, as a CSS font family. Load the font yourself. */
  fontFamily?: string
  /** The signature's size at its largest, in px. Long names shrink to fit the line. */
  size?: number
  /** Show the pencil that writes it. */
  pen?: boolean
  /** The field's label. */
  label?: string
  ref?: Ref<SignatureHandle>
}) {
  const paper = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const flourish = useRef<SVGPathElement>(null)
  const reduce = useReducedMotion()
  const inputId = useId()
  // Where the ink has reached and where it's going, along the line, in px; and the pen's tip.
  const ink = useRef({ at: 0, to: 0, start: LEFT, columns: [] as number[][], base: 0 })
  const tipX = useMotionValue(LEFT)
  const tipY = useMotionValue(0)
  const [down, setDown] = useState(false)
  const [signed, setSigned] = useState<Date | null>(null)
  const [w, setW] = useState(0)
  // The line the name sits on and how wide the name is, for the flourish under it.
  const [line, setLine] = useState({ base: 0, width: 0 })
  const drawn = useMotionValue(0)
  const drawnVisible = useTransform(drawn, (v) => (v > 0.001 ? 1 : 0))
  const flourishing = useRef(false)

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
      // Shrink long names to fit the line.
      ctx.font = font(size)
      const room = w - LEFT * 2
      const fit = Math.min(size, size * (room / Math.max(1, ctx.measureText(value).width)))
      ctx.font = font(fit)
      const m = ctx.measureText(value)
      const base = h * 0.66
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
      const s = ink.current
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
  }, [value, w, fontFamily, size])

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
    let writing = false
    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      const s = ink.current
      const gap = s.to - s.at
      const moving = Math.abs(gap) > 0.5
      if (moving) s.at += reduce ? gap : Math.sign(gap) * Math.min(Math.abs(gap), (gap > 0 ? WRITE : LIFT) * dt)
      if (flourishing.current) {
        raf = requestAnimationFrame(frame)
        return
      }
      // The pen's tip: at the ink's edge, on the stroke nearest where it was.
      const col = s.columns[Math.max(0, Math.min(s.columns.length - 1, Math.round(s.at)))] ?? []
      const was = tipY.get() || s.base - 14
      const y = col.length ? col.reduce((a, b) => (Math.abs(b - was) < Math.abs(a - was) ? b : a)) : was
      tipX.set(Math.max(LEFT - 6, s.at))
      tipY.set(was + (y - was) * 0.35)
      const c = canvas.current
      if (c) {
        const f = Math.max(0, s.at)
        // A soft wet edge where the ink is still arriving.
        c.style.maskImage = `linear-gradient(to right, #000 ${f - 9}px, transparent ${f + 1}px)`
      }
      const nowWriting = moving && gap > 0
      if (nowWriting !== writing) {
        writing = nowWriting
        setDown(nowWriting)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduce, tipX, tipY])

  const sign = async () => {
    const s = ink.current
    if (!value.trim() || signed) return
    // Wait for the hand to finish the last letter, then the flourish: one stroke under the name.
    while (Math.abs(s.to - s.at) > 0.5) await new Promise((r) => setTimeout(r, 40))
    const path = flourish.current
    if (path) {
      const length = path.getTotalLength()
      flourishing.current = true
      setDown(true)
      await animate(drawn, 1, {
        duration: reduce ? 0 : 0.55,
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
    tap()
    const at = new Date()
    setSigned(at)
    onSign?.(value, at)
  }
  const clear = () => {
    setSigned(null)
    drawn.set(0)
    onChange('')
  }
  useImperativeHandle(ref, () => ({ sign, clear }))

  const { base, width } = line
  const flourishD = `M ${LEFT + width * 0.12} ${base + 16} C ${LEFT + width * 0.42} ${base + 27}, ${LEFT + width * 0.7} ${base + 6}, ${LEFT + width * 1.04} ${base + 12}`
  const stamp = signed?.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="w-[460px] max-w-full rounded-[24px] bg-surface p-2 shadow-raised">
      {/* The page: the name in ink above a signing line. */}
      <div ref={paper} className="relative h-[160px] rounded-[18px] bg-[color-mix(in_oklch,var(--surface-2)_45%,var(--surface))] text-ink">
        <canvas ref={canvas} role="img" aria-label={value ? `Signature: ${value}` : 'No signature yet'} className="absolute inset-0 size-full" />
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <motion.path ref={flourish} d={flourishD} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ pathLength: drawn, opacity: drawnVisible }} />
        </svg>
        {/* The line you sign on, with its mark. */}
        <div aria-hidden className="absolute inset-x-[30px] bottom-[34px] flex items-end gap-2">
          <span className="text-callout leading-none text-ink-3">×</span>
          <span className="mb-[3px] h-px flex-1 bg-line-strong" />
        </div>
        {pen && (
          <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10" style={{ x: tipX, y: tipY }}>
            <Pencil down={down} />
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-3 px-3 pb-1.5 pt-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="block text-caption text-ink-3">
            {label}
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(e) => {
              setSigned(null)
              drawn.set(0)
              onChange(e.target.value)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), sign())}
            placeholder="Type to sign"
            autoComplete="name"
            spellCheck={false}
            className="mt-0.5 w-full bg-transparent text-callout text-ink outline-none placeholder:text-ink-3"
          />
        </div>
        {/* What it says once signed: when, two-toned; until then, how to finish. */}
        <div className="relative h-8 w-[180px] shrink-0">
          <AnimatePresence initial={false} mode="popLayout">
            {signed ? (
              <motion.p key="signed" className="absolute inset-0 flex items-center justify-end gap-2 text-footnote" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <span className="text-ink">Signed</span>
                <span className="truncate text-ink-3">{stamp}</span>
              </motion.p>
            ) : (
              <motion.div key="actions" className="absolute inset-0 flex items-center justify-end gap-1" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={clear} disabled={!value} className="ring-focus h-8 rounded-full px-3 text-footnote font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40">
                  Clear
                </motion.button>
                <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={sign} disabled={!value.trim()} className="ring-focus h-8 rounded-full bg-ink px-3.5 text-footnote font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40">
                  Sign
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
