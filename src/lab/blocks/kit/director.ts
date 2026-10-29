'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'

export const STOP = Symbol('stop')
export type Wait = (ms: number) => Promise<void>

/**
 * Whether a block is on screen to be watched. On its own a block always is; a landing page
 * provides it per section, so a demo starts the first time it's seen and holds its place while
 * it's scrolled away.
 */
export const InPlay = createContext(true)

/**
 * Plays a block's script on a loop until someone touches the block, then hands it over for
 * good. Each pass gets a `wait` that rejects once the script should stop, so a script reads as
 * a plain sequence of steps. A whole screen doesn't pause on hover: a pointer resting on it is
 * the normal case. Spread the returned handlers on the block's root.
 */
export function useDirector(script: (wait: Wait, pass: number) => Promise<void>, autoplay = true, onTakeOver?: () => void) {
  const play = useContext(InPlay)
  const touched = useRef(!autoplay)
  const latest = useRef(script)
  useLayoutEffect(() => {
    latest.current = script
  })
  // It starts the first time it's in play, and from then on only pauses.
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
  return { onPointerDownCapture: takeOver, onKeyDownCapture: takeOver, touched }
}

/** A sleep that stops when its run is superseded or the block unmounts. */
export const sleeper = (ok: () => boolean) => (ms: number) => new Promise<void>((r, x) => setTimeout(() => (ok() ? r() : x(STOP)), ms))
