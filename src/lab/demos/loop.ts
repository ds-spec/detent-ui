import { createContext, useContext, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { InPlay } from '@/lab/blocks/kit/director'
import { hover, pressed } from '@/lab/lib/hand'

/** True when a demo sits in a page being scrolled past, so anything that wants a vertical swipe should give it up. */
export const PassingOver = createContext(false)

/**
 * Holds a demo's `beat` while it's scrolled out of view, so nothing plays to an empty room. It uses
 * the same `held` a resting pointer does, and `onAway` is for anything a beat alone won't stop.
 */
export function useAway(held: RefObject<boolean>, box: RefObject<Element | null>, onAway?: (gone: boolean) => void) {
  const latest = useRef(onAway)
  useEffect(() => {
    latest.current = onAway
  })
  useEffect(() => {
    const el = box.current
    if (!el) return
    let gone = false
    const seen = new IntersectionObserver(([e]) => {
      if (gone === !e.isIntersecting) return
      gone = !e.isIntersecting
      held.current = gone
      latest.current?.(gone)
    })
    seen.observe(el)
    return () => seen.disconnect()
  }, [held, box])
}

/**
 * Drives a self-playing demo. `beat` waits out its time, and keeps waiting while someone
 * points at the demo or it's scrolled away; the moment they press or type inside it, the loop
 * stops for good and the controls are theirs. Spread the returned handlers on the demo's frame.
 */
export function useLoop(play: (beat: (ms: number) => Promise<void>) => Promise<void>, deps: unknown[] = [], onAway?: (gone: boolean) => void) {
  const held = useRef(false)
  const touched = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const box = useRef<any>(null)
  useAway(held, box, onAway)
  const inPlay = useContext(InPlay)
  const seen = useRef(inPlay)
  useEffect(() => {
    seen.current = inPlay
  }, [inPlay])
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current || !seen.current; t += 100) await tick(100)
    }
    // Start on the next task, so a mount React throws away (Strict Mode's double run) never
    // gets to play its first step.
    const go = setTimeout(() => play(beat).catch(() => {}), 0)
    return () => {
      live = false
      clearTimeout(go)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return {
    ref: box,
    ...hover(held),
    ...pressed(() => (touched.current = true)),
    onKeyDownCapture: () => (touched.current = true),
  }
}
