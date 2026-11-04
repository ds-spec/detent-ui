import type { PointerEvent, RefObject } from 'react'

const HOLD = 3000
const CONTROL = 'button,a,input,textarea,select,label,[role="button"],[role="tab"],[role="option"],[role="slider"],[role="switch"],[contenteditable],[draggable]'
const timers = new WeakMap<object, ReturnType<typeof setTimeout>>()
let downAt: [number, number] | null = null

export const hover = (held: RefObject<boolean>) => ({
  onPointerEnter: (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    held.current = true
    clearTimeout(timers.get(held))
    timers.set(held, setTimeout(() => (held.current = false), HOLD))
  },
  onPointerLeave: () => {
    clearTimeout(timers.get(held))
    held.current = false
  },
})

export const pressed = (take: () => void) => ({
  onPointerDownCapture: (e?: PointerEvent) => {
    if (e?.pointerType === 'touch') downAt = [e.clientX, e.clientY]
    else take()
  },
  onPointerUpCapture: (e?: PointerEvent) => {
    if (e?.pointerType !== 'touch' || !downAt) return
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 10
    downAt = null
    if (moved || (e.target as Element).closest?.(CONTROL)) take()
  },
})
