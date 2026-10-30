'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

const OUT = [0.16, 1, 0.3, 1] as const

/**
 * A headline cut into fine strips that fly in from both sides and align into sharp letters. Once
 * it's in place it stays alive: move over it and it cuts apart around the pointer, then heals when
 * you leave. The real words stay in the page for screen readers.
 */
export function SliceText({
  text,
  strips = 16,
  fill,
  reach = 26,
  interactive = true,
  className = '',
}: {
  /** The words. One line works best. */
  text: string
  /** How many strips it's cut into. */
  strips?: number
  /** Any CSS background for the letters. Leave it out to use the text colour. */
  fill?: string
  /** How far the strips part under the pointer, in pixels. */
  reach?: number
  /** Whether it cuts apart under the pointer. */
  interactive?: boolean
  /** Classes for the text: its size, weight and tracking. */
  className?: string
}) {
  const box = useRef<HTMLSpanElement>(null)
  const parts = useRef<(HTMLSpanElement | null)[]>([])
  const aim = useRef<number | null>(null)
  const seen = useInView(box, { once: true, amount: 0.4 })
  const reduce = useReducedMotion()
  const mid = (strips - 1) / 2

  useEffect(() => {
    if (!interactive || reduce) return
    const now = Array.from({ length: strips }, () => 0)
    let raf = 0
    let last = 0
    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000 || 0.016)
      last = time
      for (let i = 0; i < strips; i++) {
        const at = (i + 0.5) / strips
        const near = aim.current === null ? 0 : Math.exp(-(((at - aim.current) / 0.1) ** 2))
        const want = (i % 2 ? 1 : -1) * near * reach
        now[i] += (want - now[i]) * (1 - Math.exp(-dt * 11))
        const node = parts.current[i]
        if (node) node.style.transform = `translate3d(${now[i].toFixed(2)}px, 0, 0)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [strips, reach, interactive, reduce])

  return (
    <span
      ref={box}
      role="img"
      aria-label={text}
      onPointerMove={(e) => {
        const r = box.current!.getBoundingClientRect()
        aim.current = (e.clientY - r.top) / r.height
      }}
      onPointerLeave={() => {
        aim.current = null
      }}
      className={`relative inline-block whitespace-nowrap leading-[1.12] ${className}`}
    >
      <span className="invisible">{text}</span>
      {Array.from({ length: strips }, (_, i) => (
        <span
          key={i}
          ref={(n) => {
            parts.current[i] = n
          }}
          aria-hidden
          className="absolute inset-0"
          style={{ clipPath: `inset(${(i / strips) * 100}% -20% ${((strips - 1 - i) / strips) * 100 - 0.3}% -20%)` }}
        >
          <motion.span
            className={`absolute inset-0 ${fill ? 'bg-clip-text text-transparent' : ''}`}
            style={fill ? { backgroundImage: fill } : undefined}
            initial={reduce ? false : { x: `${(i % 2 ? 1 : -1) * (90 + Math.abs(i - mid) * 16)}%` }}
            animate={seen || reduce ? { x: '0%' } : undefined}
            transition={{ duration: 1.25, delay: Math.abs(i - mid) * 0.028, ease: OUT }}
          >
            {text}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
