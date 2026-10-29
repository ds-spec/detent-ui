'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { MotionGlobalConfig } from 'motion/react'

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
  const audio = useRef<AudioContext | null>(null)

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
      document.removeEventListener('focusin', near)
      window.removeEventListener('keydown', held)
    }
    document.addEventListener('pointerover', near)
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

  // A click made from a few milliseconds of filtered noise: no audio files to download.
  const tick = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches) navigator.vibrate?.(4)
    if (!sound) return
    const ctx = (audio.current ??= new AudioContext())
    const len = Math.floor(ctx.sampleRate * 0.012)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 3200
    band.Q.value = 1.4
    const gain = ctx.createGain()
    gain.gain.value = 0.35
    src.connect(band).connect(gain).connect(ctx.destination)
    src.start()
  }, [sound])

  // Components announce real presses; with sound on, each one clicks.
  useEffect(() => {
    if (!sound) return
    const on = () => tick()
    window.addEventListener('detent:tap', on)
    return () => window.removeEventListener('detent:tap', on)
  }, [sound, tick])

  const value = useMemo(() => ({ openSearch, sound, toggleSound, tick }), [openSearch, sound, toggleSound, tick])

  return (
    <SiteContext.Provider value={value}>
      {children}
      {loaded && <Search open={open} onOpenChange={setOpen} sound={sound} toggleSound={toggleSound} />}
    </SiteContext.Provider>
  )
}
