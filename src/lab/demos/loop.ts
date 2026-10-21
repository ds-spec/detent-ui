import { useEffect, useRef } from 'react'

/**
 * Drives a self-playing demo. `beat` waits out its time, and keeps waiting while someone
 * points at the demo; the moment they press or type inside it, the loop stops for good and
 * the controls are theirs. Spread the returned handlers on the demo's frame.
 */
export function useLoop(play: (beat: (ms: number) => Promise<void>) => Promise<void>, deps: unknown[] = []) {
  const held = useRef(false)
  const touched = useRef(false)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
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
    onPointerEnter: () => (held.current = true),
    onPointerLeave: () => (held.current = false),
    onPointerDownCapture: () => (touched.current = true),
    onKeyDownCapture: () => (touched.current = true),
  }
}
