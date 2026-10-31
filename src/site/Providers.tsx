'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { MotionGlobalConfig } from 'motion/react'
import { feedback } from '@/lab/lib/detent'
import '@/lab/lib/feel'

// The palette, and the catalogue it lists, are only fetched the first time someone asks for search.
const Search = dynamic(() => import('./Search').then((m) => m.Search), { ssr: false })

type Site = {
  openSearch: () => void
  sound: boolean
  toggleSound: () => void
  /** A short mechanical click, if sound is on. */
  tick: () => void
}

const SiteContext = createContext<Site | null>(null)
export const useSite = () => useContext(SiteContext)!

export function Providers({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [sound, setSound] = useState(false)

  useEffect(() => {
    // Dev only: lets automated checks jump animations to their end state.
    if (process.env.NODE_ENV !== 'production') Object.assign(window, { __motion: MotionGlobalConfig })
    try {
      setSound(localStorage.getItem('sound') === 'on')
    } catch {
      /* storage unavailable */
    }
  }, [])

  // Fetch the palette as soon as someone shows they might want it: a pointer or focus on a search
  // button, or ⌘/Ctrl held down. Never on load, so its catalogue stays off ordinary page loads.
  useEffect(() => {
    const warm = () => {
      void import('./Search')
      off()
    }
    const near = (e: Event) => (e.target as Element | null)?.closest?.('[data-search]') && warm()
    const held = (e: KeyboardEvent) => (e.key === 'Meta' || e.key === 'Control') && warm()
    const off = () => {
      document.removeEventListener('pointerover', near)
      document.removeEventListener('pointerdown', near)
      document.removeEventListener('focusin', near)
      window.removeEventListener('keydown', held)
    }
    document.addEventListener('pointerover', near)
    document.addEventListener('pointerdown', near)
    document.addEventListener('focusin', near)
    window.addEventListener('keydown', held)
    return off
  }, [])

  const openSearch = useCallback(() => {
    setLoaded(true)
    setOpen(true)
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setLoaded(true)
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const toggleSound = useCallback(() => {
    setSound((s) => {
      const next = !s
      try {
        localStorage.setItem('sound', next ? 'on' : 'off')
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  // The site's one sound setting is the library's off switch, so a piece never clicks with it off.
  useEffect(() => {
    feedback.set(sound)
    if (sound) feedback.warm()
  }, [sound])

  // The same voice as every piece: off, it stays silent and doesn't buzz.
  const tick = useCallback(() => {
    feedback.wake()
    feedback.tick()
  }, [])

  // Components announce real presses; with sound on, each one clicks.
  useEffect(() => {
    window.addEventListener('detent:tap', tick)
    return () => window.removeEventListener('detent:tap', tick)
  }, [tick])

  const value = useMemo(() => ({ openSearch, sound, toggleSound, tick }), [openSearch, sound, toggleSound, tick])

  return (
    <SiteContext.Provider value={value}>
      {children}
      {loaded && <Search open={open} onOpenChange={setOpen} sound={sound} toggleSound={toggleSound} />}
    </SiteContext.Provider>
  )
}
