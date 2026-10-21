'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'

const roll = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 } as const

/**
 * Text whose digits roll like an odometer when they change.
 * `proportional` uses the font's natural figures: each column springs to the width of the
 * digit it lands on, so large prices don't get the mechanical look of tabular figures.
 */
export function RollingText({ text, className = '', proportional = false }: { text: string; className?: string; proportional?: boolean }) {
  const chars = [...text]
  const probe = useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = useState<number[] | null>(null)

  useLayoutEffect(() => {
    if (!proportional || !probe.current) return
    const read = () => setWidths([...probe.current!.children].map((c) => (c as HTMLElement).getBoundingClientRect().width))
    read()
    document.fonts?.ready.then(read)
  }, [proportional])

  return (
    <span className={`relative inline-flex ${proportional ? '' : 'tnum'} ${className}`} style={{ lineHeight: '1.25em', height: '1.25em' }}>
      {/* Screen readers get the value as plain text; the rolling columns are hidden from them. */}
      <span className="sr-only">{text}</span>
      {proportional && (
        <span ref={probe} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex whitespace-pre">
          {Array.from({ length: 10 }, (_, n) => (
            <span key={n}>{n}</span>
          ))}
        </span>
      )}
      {chars.map((c, i) => {
        const key = chars.length - i // align from the right so "9:45" -> "10:00" keeps columns stable
        return /\d/.test(c) ? (
          <Digit key={key} d={+c} width={proportional && widths ? widths[+c] : undefined} />
        ) : (
          <span key={`${key}${c}`} aria-hidden className="whitespace-pre">
            {c}
          </span>
        )
      })}
    </span>
  )
}

function Digit({ d, width }: { d: number; width?: number }) {
  // Fixed 1ch column until the font is measured; then the first width lands instantly
  // and later changes spring, so nothing collapses while waiting for a frame.
  const w = useMotionValue<number | string>(width ?? '1ch')
  const had = useRef(width !== undefined)
  useLayoutEffect(() => {
    if (width === undefined) return
    if (!had.current) {
      had.current = true
      w.set(width)
      return
    }
    const ctl = animate(w, width, roll)
    return () => ctl.stop()
  }, [width, w])

  return (
    <motion.span aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1.25em', width: w }}>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col items-center" initial={false} animate={{ y: `${-d * 10}%` }} transition={roll}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block" style={{ height: '1.25em' }}>
            {n}
          </span>
        ))}
      </motion.span>
    </motion.span>
  )
}
