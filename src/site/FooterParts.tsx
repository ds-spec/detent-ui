'use client'

import { useEffect, useId, useRef, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Moon, Sun } from '@/lab/icons'
import { BAYER } from './Dither'

type Choice = 'light' | 'dark' | 'system'
const dark = () => matchMedia('(prefers-color-scheme: dark)').matches
/** The saved choice is the store: no saved theme means light. */
const readChoice = (): Choice => {
  try {
    const s = localStorage.getItem('theme')
    return s === 'dark' || s === 'system' ? s : 'light'
  } catch {
    return 'light'
  }
}
const onChoice = (cb: () => void) => {
  window.addEventListener('detent:theme', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('detent:theme', cb)
    window.removeEventListener('storage', cb)
  }
}

/** Light, dark, or whatever the system says: a plate glides to the choice, and the page follows at once. */
export function ThemeSwitch() {
  const id = useId()
  const choice = useSyncExternalStore<Choice | null>(onChoice, readChoice, () => null)
  const pick = (c: Choice) => {
    document.documentElement.setAttribute('data-theme', c === 'system' ? (dark() ? 'dark' : 'light') : c)
    try {
      localStorage.setItem('theme', c)
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event('detent:theme'))
  }
  const items: [Choice, string, ReactNode][] = [
    ['light', 'Light', <Sun key="l" size={14} />],
    ['dark', 'Dark', <Moon key="d" size={14} />],
    [
      'system',
      'Match the system',
      <svg key="s" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="12.5" rx="2.5" />
        <path d="M9 20.5h6M12 16.5v4" />
      </svg>,
    ],
  ]
  return (
    <span role="radiogroup" aria-label="Theme" className="flex h-8 items-center rounded-full bg-surface-2 p-[3px]">
      {items.map(([c, label, icon]) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={choice === c}
          aria-label={label}
          title={label}
          onClick={() => pick(c)}
          className={`ring-focus relative flex h-full w-8 items-center justify-center rounded-full transition-colors duration-200 ${choice === c ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {choice === c && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-plate shadow-raised" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span className="relative">{icon}</span>
        </button>
      ))}
    </span>
  )
}

/* ───────────────────────────── The wordmark ───────────────────────────── */

/*
 * The wordmark's layout, measured from Geist at weight 760 and 300 units, tracked -16. The D is
 * the mark itself, scaled to Geist's cap height (213), so the logo and the word are one object;
 * the letters sit as close to it as they sit to each other. The view stops 38 units above the
 * baseline, so the word sinks off the page.
 */
const CAP = 213
const S = CAP / 18 // the mark's grid unit, so its D is exactly a capital tall
const BASE = 213
const VIEW = { w: 931, h: 175 }
const WORD: [string, number][] = [
  ['e', 200.65],
  ['t', 361.23],
  ['e', 477.9],
  ['n', 643.18],
  ['t', 802.01],
]
const WEIGHT = 760
/** One printed pixel, in CSS pixels. */
const CELL = 3
/** How strongly the name is printed at rest: barely there. */
const FAINT = 0.09
/** The light under the pointer, as a share of the word's width. */
const LENS = 0.09

/**
 * The foot of every page: the name, monumental and faint, printed in fine ordered dither and
 * sinking off the bottom edge, where it thins to single pixels. The first time it's seen it prints
 * in from the top. Point at it and a soft light follows the hand, bringing the pixels under it up
 * toward full ink, like a torch over a page.
 */
export function Wordmark() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const box = wrap.current
    const cv = canvas.current
    const g = cv?.getContext('2d')
    if (!box || !cv || !g) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let shape: Uint8ClampedArray = new Uint8ClampedArray()
    let w = 0
    let h = 0
    let dpr = 1
    // The pointer, eased; the lens grows in while the hand is over the word and fades when it leaves.
    const at = { x: -1, y: -1, tx: -1, ty: -1, r: 0, tr: 0 }
    let printed = still ? 1 : 0
    let seen = false
    let raf = 0

    // The word, drawn once at this size into a hidden canvas, so each cell can ask whether it's inside a letter.
    const shapeUp = () => {
      w = box.clientWidth
      h = Math.round((w * VIEW.h) / VIEW.w)
      dpr = Math.min(2, devicePixelRatio || 1)
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      cv.style.height = `${h}px`
      // Not laid out yet, or hidden: nothing to draw, and a 0-wide canvas can't be read. The resize brings it back.
      if (!w || !h) {
        shape = new Uint8ClampedArray()
        return
      }
      const k = w / VIEW.w
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const o = off.getContext('2d')!
      o.scale(k, k)
      o.save()
      o.translate(-3.75 * S, BASE - 21 * S)
      o.scale(S, S)
      o.beginPath()
      o.roundRect(3.75, 3, 5.5, 18, 1.1)
      o.fill(new Path2D('M11.25 3a9 9 0 0 1 0 18z'))
      o.fill()
      o.restore()
      const family = getComputedStyle(document.body).getPropertyValue('--font-geist').trim() || 'sans-serif'
      o.font = `${WEIGHT} 300px ${family}`
      ;(o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-16px'
      for (const [c, x] of WORD) o.fillText(c, x, BASE)
      shape = o.getImageData(0, 0, w, h).data
    }

    const draw = () => {
      raf = 0
      const ink = getComputedStyle(box).color
      at.x += (at.tx - at.x) * 0.2
      at.y += (at.ty - at.y) * 0.2
      at.r += (at.tr - at.r) * 0.14
      if (!still && seen && printed < 1) printed = Math.min(1, printed + 0.022)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      g.fillStyle = ink
      const cols = Math.ceil(w / CELL)
      const rows = Math.ceil(h / CELL)
      const R = Math.max(1, w * LENS * at.r)
      for (let y = 0; y < rows; y++) {
        const cy = y * CELL + CELL / 2
        // Whole for most of their height, breaking into dither only where the page cuts them off; while printing in, the top comes first.
        const sink = Math.min(1, 1.6 - (cy / h) * 1.5)
        const front = printed * 1.4 - cy / h
        for (let x = 0; x < cols; x++) {
          const cx = x * CELL + CELL / 2
          if (shape[(Math.min(h - 1, cy | 0) * w + Math.min(w - 1, cx | 0)) * 4 + 3] < 128) continue
          let light = front > 0 ? sink : 0
          let lit = 0
          if (at.r > 0.01) {
            const d = Math.hypot(cx - at.x, cy - at.y) / R
            lit = Math.max(0, 1 - d * d)
            light = Math.max(light, lit)
          }
          if (light <= BAYER[(y % 8) * 8 + (x % 8)]) continue
          // Faint, the way a name is pressed into paper; under the light it comes up toward full ink.
          g.globalAlpha = FAINT + lit * 0.62
          g.fillRect(x * CELL, y * CELL, CELL, CELL)
        }
      }
      const moving = Math.abs(at.tx - at.x) + Math.abs(at.ty - at.y) > 0.5 || Math.abs(at.tr - at.r) > 0.01 || (seen && printed < 1)
      if (moving) raf = requestAnimationFrame(draw)
    }
    const again = () => void (raf ||= requestAnimationFrame(draw))

    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      at.tx = e.clientX - r.left
      at.ty = e.clientY - r.top
      if (at.r < 0.01) {
        at.x = at.tx
        at.y = at.ty
      }
      at.tr = 1
      again()
    }
    const leave = () => {
      at.tr = 0
      again()
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen) {
        seen = true
        again()
      }
    }, { threshold: 0.3 })
    const ro = new ResizeObserver(() => {
      shapeUp()
      again()
    })
    // A theme change recolours the print.
    const mo = new MutationObserver(again)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    void document.fonts.ready.then(() => {
      shapeUp()
      again()
    })
    io.observe(cv)
    ro.observe(box)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
      cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerleave', leave)
    }
  }, [])
  return (
    <div ref={wrap} className="text-ink">
      <canvas ref={canvas} role="img" aria-label="Detent" className="block w-full select-none" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }} />
    </div>
  )
}
