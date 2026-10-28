'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'

const roll = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 } as const

/**
 * Text whose digits roll like an odometer when they change.
 * `proportional` uses the font's natural figures: each column springs to the width of the
 * digit it lands on, so large prices don't get the mechanical look of tabular figures.
 * `still` swaps digits without rolling, for numbers that follow a hand frame by frame, where a roll
 * would never catch up; proportional columns still spring, so the number doesn't jitter.
 */
export function RollingText({ text, className = '', proportional = false, still = false }: { text: string; className?: string; proportional?: boolean; still?: boolean }) {
  const chars = [...text]
  const probe = useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = useState<number[] | null>(null)

  useLayoutEffect(() => {
    if (!proportional || !probe.current) return
    // Measured in layout pixels: under a CSS `zoom` (the gallery's Fit, a film's stage) the rects come
    // back zoomed, so divide by the probe's own zoom or every column lands too wide or too narrow.
    // Kept in em, so the columns follow the type if its size changes later: a headline set with
    // clamp() and a window resized, or a breakpoint crossed.
    const read = () => {
      const box = probe.current!
      const z = box.offsetWidth ? box.getBoundingClientRect().width / box.offsetWidth : 1
      const em = parseFloat(getComputedStyle(box).fontSize) || 16
      setWidths([...box.children].map((c) => (c as HTMLElement).getBoundingClientRect().width / z / em))
    }
    read()
    document.fonts?.ready.then(read)
  }, [proportional])

  return (
    <span className={`relative inline-flex ${proportional ? '' : 'tnum'} ${className}`} style={{ lineHeight: '1.25em', height: '1.25em' }}>
      {/* Screen readers get the value as plain text; the rolling columns are hidden from them. */}
      <span className="sr-only">{text}</span>
      {proportional && (
        // The measuring strip keeps its own width inside a clip of no size, so it never widens the page beside a price at its edge.
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 size-0 overflow-hidden">
          <span ref={probe} className="invisible flex w-max whitespace-pre">
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      )}
      {chars.map((c, i) => {
        const key = chars.length - i // align from the right so "9:45" -> "10:00" keeps columns stable
        return /\d/.test(c) ? (
          <Digit key={key} d={+c} width={proportional && widths ? widths[+c] : undefined} still={still} />
        ) : (
          <span key={`${key}${c}`} aria-hidden className="whitespace-pre">
            {c}
          </span>
        )
      })}
    </span>
  )
}

function Digit({ d, width, still }: { d: number; width?: number; still: boolean }) {
  // Fixed 1ch column until the font is measured; then the first width lands instantly
  // and later changes spring, so nothing collapses while waiting for a frame.
  const w = useMotionValue<string>(width === undefined ? '1ch' : `${width}em`)
  const had = useRef(width !== undefined)
  useLayoutEffect(() => {
    if (width === undefined) return
    if (!had.current) {
      had.current = true
      w.set(`${width}em`)
      return
    }
    const ctl = animate(w, `${width}em`, roll)
    return () => ctl.stop()
  }, [width, w])

  return (
    <motion.span aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1.25em', width: w }}>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col items-center" initial={false} animate={{ y: `${-d * 10}%` }} transition={still ? { duration: 0 } : roll}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block" style={{ height: '1.25em' }}>
            {n}
          </span>
        ))}
      </motion.span>
    </motion.span>
  )
}
