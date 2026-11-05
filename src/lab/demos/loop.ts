import { createContext, useContext, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { InPlay } from '@/lab/blocks/kit/director'
import { hover, pressed } from '@/lab/lib/hand'

export const PassingOver = createContext(false)

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
    onDropCapture: () => (touched.current = true),
  }
}
