'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PLANS } from '@/catalog/pro'
import { PROMO } from '@/catalog/promo'
import { ArrowRight } from '@/lab/icons'
import { useOwned } from './Owned'

const BLUE = 'linear-gradient(90deg, #8fb0ff, #5b86ff 55%, #3d6dff)'

export function PromoStrip() {
  const owned = useOwned()
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  if (!PROMO || owned) return null
  const code = PROMO.code

  const copy = () => {
    void navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div role="region" aria-label="Offer" className="relative z-[51] bg-[#0b0b0d] text-white">
      <div className="mx-auto flex h-[38px] max-w-[1440px] items-center justify-center gap-2.5 px-3 text-[13px] text-white/60 sm:gap-3 sm:text-[13.5px]">
        <p className="flex min-w-0 items-center gap-[0.3em] whitespace-nowrap leading-[1.25]">
          <span className="hidden sm:inline">Grab</span>
          <b className="font-semibold text-white">{PROMO.off} off</b>
          <span className="hidden sm:inline">Detent</span>
          <span className="bg-clip-text font-semibold text-transparent" style={{ backgroundImage: BLUE }}>
            Pro
          </span>
          <span>with</span>
        </p>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy code ${PROMO.code}`}
          className="relative grid h-[24px] shrink-0 place-items-center overflow-hidden rounded-[7px] px-2 font-mono text-[12px] font-medium tracking-[0.06em] text-white outline-none shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] transition-[background-color,scale] duration-150 [background-image:repeating-linear-gradient(90deg,rgb(255_255_255/0.07)_0_4px,transparent_4px_8px)] hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.96]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copied ? 'done' : 'code'}
              className="col-start-1 row-start-1"
              initial={{ y: '90%', opacity: 0, filter: 'blur(2px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-90%', opacity: 0, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            >
              {copied ? 'Copied' : PROMO.code}
            </motion.span>
          </AnimatePresence>
          <span aria-hidden className="invisible col-start-1 row-start-1">{PROMO.code}</span>
        </button>
        <a
          href={PLANS[0].href}
          className="group/buy flex h-[24px] shrink-0 items-center gap-1 rounded-full bg-white pl-2.5 pr-2 text-[12.5px] font-semibold text-[#0b0b0d] outline-none transition-[opacity,scale] duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.97]"
        >
          Buy now
          <ArrowRight size={12} className="transition-transform duration-200 group-hover/buy:translate-x-0.5" />
        </a>
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
    </div>
  )
}

export function Price({ value, className = '' }: { value: number; className?: string }) {
  if (!PROMO || PROMO.price >= value) return <>${value}</>
  return (
    <span className={`inline-flex items-baseline gap-[0.22em] ${className}`}>
      <s className="text-[0.62em] text-ink-3 decoration-[color-mix(in_oklch,var(--ink-3)_70%,transparent)] decoration-[0.08em]">${value}</s>
      <span>${PROMO.price}</span>
    </span>
  )
}

export const nowPrice = (value: number) => (PROMO && PROMO.price < value ? PROMO.price : value)
