'use client'

import { useEffect } from 'react'
import { PLANS } from '@/catalog/pro'
import { track } from './track'

export function Analytics() {
  useEffect(() => {
    const buy = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="/checkout/"]')
      const href = link?.getAttribute('href')
      if (!href) return
      const plan = PLANS.find((p) => p.href === href)
      track('begin_checkout', { plan: plan?.id ?? href, value: plan?.price, currency: 'USD', cta: link?.getAttribute('data-cta') ?? undefined })
    }
    document.addEventListener('click', buy, true)
    return () => document.removeEventListener('click', buy, true)
  }, [])
  return null
}
