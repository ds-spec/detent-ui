'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/* What a block is shown on: the colour wallpaper. The UI inside stays quiet; the showcase around it doesn't. */
export { Wallpaper as Backdrop } from '@/site/blocks/Wallpaper'

export type Chrome = 'app' | 'titled' | 'browser'

const LIGHTS = (
  <span aria-hidden className="flex gap-2">
    <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.14)]" />
    <span className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.14)]" />
    <span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.14)]" />
  </span>
)

/**
 * A Mac window around a block. An app window is unified: no title bar, the traffic lights sit in
 * the block's sidebar, and the sidebar is vibrant, so the wallpaper glows through it. Below
 * 768px, or for blocks without a sidebar, it's a slim titled window; a landing page gets
 * browser chrome with its address. On a phone-width frame the chrome drops away entirely.
 */
export function Window({ title, width, chrome = 'app', compact = false, solid = true, children }: { title: string; width?: number | string; chrome?: Chrome; compact?: boolean; /** An opaque sidebar; false lets what's behind the window glow through it. */ solid?: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    setW(el.offsetWidth)
    return () => ro.disconnect()
  }, [])
  const reduce = useReducedMotion()
  const unified = chrome === 'app' && !compact && w >= 768
  const bar = !compact && !unified
  return (
    // The window settles onto the desk once, the way you'd set something down: up a little, then at rest.
    <motion.div
      ref={box}
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }}
      className={`relative flex h-full flex-col overflow-hidden text-ink ${compact ? 'rounded-[26px] bg-surface' : 'rounded-[12px]'} ${unified && !solid ? 'pro-vibrant' : 'bg-surface'}`}
      style={{
        width: width ?? '100%',
        ['--lights' as string]: unified ? '86px' : undefined,
        ['--lights-top' as string]: unified ? '46px' : undefined,
        boxShadow:
          '0 0 0 0.5px light-dark(rgb(0 0 0 / 0.16), transparent), 0 0 0 1px light-dark(transparent, rgb(255 255 255 / 0.145)), inset 0 0.5px 0 light-dark(rgb(255 255 255 / 0.6), transparent), 0 30px 70px -24px light-dark(rgb(50 30 10 / 0.36), rgb(0 0 0 / 0.72)), 0 10px 24px -12px light-dark(rgb(50 30 10 / 0.2), rgb(0 0 0 / 0.5))',
      }}
    >
      {unified && <span className="pointer-events-none absolute left-[18px] top-[19px] z-[60]">{LIGHTS}</span>}
      {bar && chrome === 'browser' && (
        <div className="relative flex h-10 shrink-0 items-center gap-4 bg-[light-dark(#f1f0ed,#0a0a0a)] px-3.5 shadow-[inset_0_-0.5px_0_light-dark(rgb(0_0_0/0.12),transparent),inset_0_-1px_0_light-dark(transparent,rgb(255_255_255/0.1))]">
          {LIGHTS}
          <span className="mx-auto flex h-[26px] w-[min(420px,60%)] items-center justify-center gap-1.5 rounded-[7px] bg-[light-dark(rgb(0_0_0/0.05),rgb(255_255_255/0.07))] text-[12px] text-ink-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" stroke="none" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            {title}
          </span>
          <span className="w-[52px]" />
        </div>
      )}
      {bar && chrome !== 'browser' && (
        <div className="relative flex h-[30px] shrink-0 items-center bg-[light-dark(#f1f0ed,#0a0a0a)] px-3 shadow-[inset_0_-0.5px_0_light-dark(rgb(0_0_0/0.12),transparent),inset_0_-1px_0_light-dark(transparent,rgb(255_255_255/0.1))]">
          {LIGHTS}
          <span className="absolute inset-x-24 truncate text-center text-[12px] font-medium text-ink-3">{title}</span>
        </div>
      )}
      <div className="relative min-h-0 flex-1">{children}</div>
    </motion.div>
  )
}
