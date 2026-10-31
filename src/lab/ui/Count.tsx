'use client'

import { useEffect, useState } from 'react'
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react'
import { ease } from '@/lab/lib/motion'

/** A number that counts to its new value instead of jumping or rolling. The text is tabular, so its width holds. */
export function Count({ value, format = (n) => String(Math.round(n)), duration = 0.7 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const mv = useMotionValue(value)
  const [text, setText] = useState(() => format(value))
  useMotionValueEvent(mv, 'change', (v) => setText(format(v)))
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: ease.out })
    return () => c.stop()
  }, [value, mv, duration])
  return <span className="tnum">{text}</span>
}
