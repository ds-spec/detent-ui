'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pressed } from '@/lab/lib/hand'

export const STOP = Symbol('stop')
export type Wait = (ms: number) => Promise<void>

export const InPlay = createContext(true)

export function useDirector(script: (wait: Wait, pass: number) => Promise<void>, autoplay = true, onTakeOver?: () => void) {
  const play = useContext(InPlay)
  const touched = useRef(!autoplay)
  const latest = useRef(script)
  useLayoutEffect(() => {
    latest.current = script
  })
  const [begun, setBegun] = useState(play)
  if (play && !begun) setBegun(true)
  const gate = useRef(play)
  const held = useRef<(() => void)[]>([])
  useLayoutEffect(() => {
    gate.current = play
    if (!play) return
    const resume = held.current
    held.current = []
    resume.forEach((go) => go())
  }, [play])
  useEffect(() => {
    if (!autoplay || !begun) return
    let on = true
    const wait: Wait = (ms) =>
      new Promise((r, x) => {
        const go = () => (!on || touched.current ? x(STOP) : gate.current ? r() : held.current.push(go))
        setTimeout(go, ms)
      })
    ;(async () => {
      for (let pass = 0; ; pass++) await latest.current(wait, pass)
    })().catch(() => {})
    return () => {
      on = false
    }
  }, [autoplay, begun])
  const takeOver = () => {
    if (!touched.current) onTakeOver?.()
    touched.current = true
  }
  return { ...pressed(takeOver), onKeyDownCapture: takeOver, touched }
}

export const sleeper = (ok: () => boolean) => (ms: number) => new Promise<void>((r, x) => setTimeout(() => (ok() ? r() : x(STOP)), ms))
