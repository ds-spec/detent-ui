'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { scroller } from './Shell'

/**
 * One page open inside a section whose frame stays put. A move shows at once and the URL catches
 * up behind it; back and forward come in through the URL. `at` is the slug in the URL, and the
 * result is what to show and the way to move.
 */
export function useWant(at: string, base: string) {
  const router = useRouter()
  const [want, setWant] = useState<string | null>(null)
  const [seen, setSeen] = useState(at)
  if (seen !== at) {
    setSeen(at)
    if (want === at) setWant(null)
  }
  const id = want ?? at
  const go = useCallback(
    (to: string) => {
      if (to === id) return
      // Shown now, before the navigation starts: from a key press, React would otherwise hold this
      // update until the route had loaded.
      flushSync(() => setWant(to))
      router.push(`${base}/${to}`, { scroll: false })
    },
    [id, base, router],
  )
  // A new page starts at the top of the panel, or of the window on anything smaller.
  const last = useRef(id)
  useEffect(() => {
    if (last.current === id) return
    last.current = id
    scroller()?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])
  return { id, go }
}
