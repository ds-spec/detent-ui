'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

const OUT = [0.16, 1, 0.3, 1] as const

export function SliceText({
  text,
  strips = 16,
  fill,
  reach = 26,
  interactive = true,
  className = '',
}: {
  text: string
  strips?: number
  fill?: string
  reach?: number
  interactive?: boolean
  className?: string
}) {
  const box = useRef<HTMLSpanElement>(null)
  const parts = useRef<(HTMLSpanElement | null)[]>([])
  const aim = useRef<number | null>(null)
  const wake = useRef(() => {})
  const seen = useInView(box, { once: true, amount: 0.4 })
  const reduce = useReducedMotion()
  const mid = (strips - 1) / 2

  useLayoutEffect(() => {
    const el = box.current
    const host = el?.parentElement
    if (!el || !host) return
    const fit = () => {
      el.style.fontSize = ''
      const pad = getComputedStyle(host)
      const room = host.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight)
      const own = el.offsetWidth
      if (room > 0 && own > room) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * room) / own}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    return () => ro.disconnect()
  }, [text])

  useEffect(() => {
    if (!interactive || reduce) return
    const now = Array.from({ length: strips }, () => 0)
    let raf = 0
    let last = 0
    let shown = true
    const loop = (time: number) => {
      raf = 0
      const dt = Math.min(0.05, (time - last) / 1000 || 0.016)
      last = time
      let moving = false
      for (let i = 0; i < strips; i++) {
        const at = (i + 0.5) / strips
        const near = aim.current === null ? 0 : Math.exp(-(((at - aim.current) / 0.1) ** 2))
        const want = (i % 2 ? 1 : -1) * near * reach
        now[i] += (want - now[i]) * (1 - Math.exp(-dt * 11))
        if (Math.abs(want - now[i]) < 0.02) now[i] = want
        else moving = true
        const node = parts.current[i]
        if (node) node.style.transform = `translate3d(${now[i].toFixed(2)}px, 0, 0)`
      }
      if (moving && shown) raf = requestAnimationFrame(loop)
    }
    wake.current = () => {
      if (raf || !shown) return
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => {
      shown = e.isIntersecting
      if (shown) wake.current()
    })
    if (box.current) io.observe(box.current)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      wake.current = () => {}
    }
  }, [strips, reach, interactive, reduce])

  const aimAt = (e: PointerEvent<HTMLSpanElement>) => {
    const r = box.current!.getBoundingClientRect()
    aim.current = (e.clientY - r.top) / r.height
    wake.current()
  }

  return (
    <span
      ref={box}
      role="img"
      aria-label={text}
      onPointerDown={aimAt}
      onPointerMove={aimAt}
      onPointerLeave={() => {
        aim.current = null
        wake.current()
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
