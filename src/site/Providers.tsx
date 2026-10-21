'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { MotionGlobalConfig } from 'motion/react'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'
import type { Command } from '@/lab/components/command/CommandMenu'
import { CategoryIcon } from './icons'

// The palette is only fetched the first time someone asks for it.
const CommandMenu = dynamic(() => import('@/lab/components/command/CommandMenu').then((m) => m.CommandMenu), { ssr: false })

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
  const router = useRouter()
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

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href)
    return [
      { id: 'home', label: 'Home', group: 'Site', hint: 'Page', onSelect: go('/') },
      { id: 'all', label: 'All components', group: 'Site', hint: 'Page', onSelect: go('/components') },
      { id: 'system', label: 'System', group: 'Site', hint: 'Page', keywords: 'type materials motion shape tokens', onSelect: go('/system') },
      ...ENTRIES.map((e) => {
        const c = CATEGORIES.find((x) => x.id === e.category)!
        return { id: e.id, label: e.name, group: c.name, icon: <CategoryIcon name={c.icon} size={15} />, hint: isProComponent(e.id) ? 'Pro' : e.tags?.includes('New') ? 'New' : undefined, keywords: `${c.name} ${e.line}`, onSelect: go(`/components/${e.id}`) }
      }),
      {
        id: 'theme',
        label: 'Switch theme',
        group: 'Settings',
        onSelect: () => {
          const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.dataset.theme = next
          try {
            localStorage.setItem('theme', next)
          } catch {
            /* storage unavailable */
          }
        },
      },
      { id: 'sound', label: sound ? 'Turn sound off' : 'Turn sound on', group: 'Settings', onSelect: toggleSound },
    ]
  }, [router, sound, toggleSound])

  const value = useMemo(() => ({ openSearch, sound, toggleSound, tick }), [openSearch, sound, toggleSound, tick])

  return (
    <SiteContext.Provider value={value}>
      {children}
      {loaded && <CommandMenu open={open} onOpenChange={setOpen} commands={commands} placeholder="Search components…" />}
    </SiteContext.Provider>
  )
}
