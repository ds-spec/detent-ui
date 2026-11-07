'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PLANS } from '@/catalog/pro'
import { PROMO } from '@/catalog/promo'
import { ArrowRight } from '@/lab/icons'
import { useOwned } from './Owned'

const BLUE = 'linear-gradient(90deg, #8fb0ff, #5b86ff 55%, #3d6dff)'
const TICKET = 'radial-gradient(circle 3.5px at 0 50%, transparent 95%, #000) left / 51% 100% no-repeat, radial-gradient(circle 3.5px at 100% 50%, transparent 95%, #000) right / 51% 100% no-repeat'

export function PromoStrip() {
  const owned = useOwned()
  const [copied, setCopied] = useState(false)
  const [round, setRound] = useState(0)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  if (!PROMO) return null
  const code = PROMO.code

  const copy = () => {
    void navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true)
    setRound((r) => r + 1)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <AnimatePresence initial={false}>
      {!owned && (
    <motion.div
      key="strip"
      role="region"
      aria-label="Offer"
      exit={{ height: 0, opacity: 0 }}
      transition={{ height: { type: 'spring', stiffness: 380, damping: 40 }, opacity: { duration: 0.18 } }}
      className="relative z-[51] h-[38px] overflow-hidden bg-[#0b0b0d] text-white"
    >
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
          aria-label={copied ? `Copied ${code}` : `Copy code ${code}`}
          className="group/code relative flex h-[26px] shrink-0 items-center rounded-[7px] bg-white/[0.07] outline-none transition-[background-color,scale] duration-150 hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.96]"
          style={{ mask: TICKET, WebkitMask: TICKET }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[7px] transition-shadow duration-300"
            style={{ boxShadow: copied ? 'inset 0 0 0 1px rgb(110 231 160 / 0.7)' : 'inset 0 0 0 1px rgb(255 255 255 / 0.2)' }}
          />
          <span className="relative overflow-hidden pl-3 pr-2.5 font-mono text-[12px] font-semibold tracking-[0.08em] text-white">
            {code}
            {copied && (
              <motion.span
                key={round}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-8 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                initial={{ left: '-40%' }}
                animate={{ left: '120%' }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </span>
          <span aria-hidden className="h-3.5 border-l border-dashed border-white/25" />
          <span className="grid size-[26px] place-items-center pr-0.5 [&>*]:col-start-1 [&>*]:row-start-1">
            <AnimatePresence initial={false}>
              {copied ? (
                <motion.svg
                  key="done"
                  className="block"
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="rgb(110 231 160)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                >
                  <motion.path d="M3 7.4 5.8 10 11 4.2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, delay: 0.05, ease: [0.65, 0, 0.35, 1] }} />
                </motion.svg>
              ) : (
                <motion.svg
                  key="copy"
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  className="block text-white/55 transition-colors duration-150 group-hover/code:text-white"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                >
                  <rect x="4.6" y="4.6" width="7" height="7" rx="1.8" />
                  <path d="M9.4 4.4V3.6a1.6 1.6 0 0 0-1.6-1.6H3.6A1.6 1.6 0 0 0 2 3.6v4.2a1.6 1.6 0 0 0 1.6 1.6h.8" />
                </motion.svg>
              )}
            </AnimatePresence>
          </span>
          <span className="sr-only" aria-live="polite">
            {copied ? 'Code copied' : ''}
          </span>
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
    </motion.div>
      )}
    </AnimatePresence>
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
