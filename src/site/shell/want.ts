'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { scroller } from './Shell'

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
      flushSync(() => setWant(to))
      router.push(`${base}/${to}`, { scroll: false })
    },
    [id, base, router],
  )
  const last = useRef(id)
  useEffect(() => {
    if (last.current === id) return
    last.current = id
    scroller()?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])
  return { id, go }
}
