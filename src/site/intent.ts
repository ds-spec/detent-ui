'use client'

import { useRouter } from 'next/navigation'

/**
 * For a Link with `prefetch={false}`: stays quiet on the page, and fetches its route when a hand
 * heads for it. Pages with many links use this so coming back to them doesn't fire a burst of
 * prefetches. A finger's pointerdown still comes well before the click.
 */
export function useIntent() {
  const router = useRouter()
  return (href: string) => {
    const warm = () => router.prefetch(href)
    return { onPointerEnter: warm, onPointerDown: warm, onFocus: warm }
  }
}
