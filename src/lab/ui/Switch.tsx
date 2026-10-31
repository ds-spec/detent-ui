'use client'

import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { spring } from '@/lab/lib/motion'

const knob = spring.snappy

/**
 * A switch whose knob stretches while pressed, the way a finger would squish it, then
 * springs across. Ink when on. Locked switches stay visible but can't be changed.
 */
export function Switch({ checked, onChange, label, disabled = false }: { checked: boolean; onChange?: (next: boolean) => void; label: string; disabled?: boolean }) {
  const [pressed, setPressed] = useState(false)
  const x = useMotionValue(checked ? 16 : 0)
  const w = useMotionValue(18)

  useEffect(() => {
    const width = pressed ? 22 : 18
    // When on, a wider knob grows toward the left so it stays against the right edge.
    const a = animate(x, checked ? 16 - (width - 18) : 0, knob)
    const b = animate(w, width, knob)
    return () => {
      a.stop()
      b.stop()
    }
  }, [checked, pressed, x, w])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="ring-focus relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45"
      style={{ background: checked ? 'var(--ink)' : 'var(--line-strong)' }}
    >
      <motion.span
        className="absolute left-[2px] top-[2px] block h-[18px] rounded-full transition-colors duration-200"
        // Surface-coloured when on, so the knob stays legible on the light ink track in dark mode.
        style={{ x, width: w, background: checked ? 'var(--surface)' : '#fff', boxShadow: '0 1px 3px rgb(0 0 0 / 0.22), 0 0 0 0.5px rgb(0 0 0 / 0.04)' }}
      />
    </button>
  )
}
