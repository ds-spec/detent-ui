'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PLANS } from '@/catalog/pro'
import { usePathname } from 'next/navigation'
import { PROMO } from '@/catalog/promo'
import type { Promo } from '@/catalog/promo'
import { ArrowRight } from '@/lab/icons'
import { useOwned } from './Owned'

const BLUE = 'linear-gradient(90deg, #8fb0ff, #5b86ff 55%, #3d6dff)'
const TICKET = 'radial-gradient(circle 3.5px at 0 50%, transparent 95%, #000) left / 51% 100% no-repeat, radial-gradient(circle 3.5px at 100% 50%, transparent 95%, #000) right / 51% 100% no-repeat'

const tick = (go: () => void) => {
  const t = window.setInterval(go, 1000)
  return () => window.clearInterval(t)
}
const second = () => Math.floor(Date.now() / 1000)

export function usePromo(): Promo | null {
  const live = useSyncExternalStore(tick, () => !!PROMO && Date.now() < PROMO.ends, () => !!PROMO)
  return live ? PROMO : null
}

function useLeft() {
  const now = useSyncExternalStore(tick, second, () => 0)
  if (!PROMO || !now) return null
  const s = Math.max(0, Math.floor(PROMO.ends / 1000) - now)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`
}

export function PromoStrip() {
  const owned = useOwned()
  const promo = usePromo()
  const left = useLeft()
  if (!promo) return null

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
          <b className="font-semibold text-white">{promo.off} off</b>
          <span className="hidden sm:inline">Detent</span>
          <span className="bg-clip-text font-semibold text-transparent" style={{ backgroundImage: BLUE }}>
            Pro
          </span>
        </p>
        <span
          className="relative flex h-[26px] shrink-0 items-center gap-[0.4em] rounded-[7px] bg-white/[0.07] px-2.5 tabular-nums"
          style={{ mask: TICKET, WebkitMask: TICKET }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[7px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]" />
          <s className="text-[12px] text-white/45 decoration-white/45">
            <span className="sr-only">was </span>${PLANS[0].price}
          </s>
          <span className="text-[13px] font-semibold text-white">
            <span className="sr-only">now </span>${promo.price}
          </span>
        </span>
        {left && (
          <span className="hidden whitespace-nowrap tabular-nums text-white/45 md:inline">
            ends in <span className="text-white/80">{left}</span>
          </span>
        )}
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
  const promo = usePromo()
  if (!promo || promo.price >= value) return <>${value}</>
  return (
    <span className={`inline-flex items-baseline gap-[0.22em] ${className}`}>
      <s className="text-[0.62em] text-ink-3 decoration-[color-mix(in_oklch,var(--ink-3)_70%,transparent)] decoration-[0.08em]">${value}</s>
      <span>${promo.price}</span>
    </span>
  )
}

export const priceWith = (promo: Promo | null, value: number) => (promo && promo.price < value ? promo.price : value)

export function MobileBuy() {
  const owned = useOwned()
  const path = usePathname()
  const [down, setDown] = useState(false)
  useEffect(() => {
    const on = () => setDown(window.scrollY > 640)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const hidden = owned || !['/', '/components', '/blocks', '/templates', '/docs'].includes(path)
  return (
    <AnimatePresence>
      {down && !hidden && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[60] flex h-14 items-center gap-3 rounded-[18px] bg-[#0b0b0d] pl-4 pr-2 text-white shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45)] md:hidden"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium leading-4">Detent Pro</span>
            <span className="block text-[12px] leading-4 text-white/55">Full refund within 14 days</span>
          </span>
          <span className="tnum text-[17px] tracking-[-0.02em] [&_s]:text-white/45">
            <Price value={PLANS[0].price} />
          </span>
          <a href={PLANS[0].href} className="flex h-10 items-center rounded-[12px] bg-white px-4 text-[14px] font-semibold text-[#0b0b0d] active:scale-[0.97]">
            Get Pro
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
