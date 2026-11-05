'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'
import { buttonClass } from '../../ui/Button'
import type { Size, Variant } from '../../ui/Button'

export type CopyHandle = { copy(): void }

export function CopyButton({
  value,
  label = 'Copy',
  copied: copiedLabel = 'Copied',
  variant = 'secondary',
  size = 'sm',
  hold = 1600,
  onCopy,
  ref,
}: {
  value: string
  label?: string
  copied?: string
  variant?: Variant
  size?: Size
  hold?: number
  onCopy?: (value: string) => void
  ref?: Ref<CopyHandle>
}) {
  const [done, setDone] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
    }
    setDone(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), hold)
    onCopy?.(value)
  }
  useImperativeHandle(ref, () => ({ copy }))

  return (
    <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={copy} aria-live="polite" className={buttonClass(variant, size)}>
      <span className="relative flex size-[15px] items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={done ? 'done' : 'copy'}
            className="flex"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          >
            {done ? <Check size={15} strokeWidth={2.6} /> : <Copy size={15} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative grid overflow-hidden">
        {[label, copiedLabel].map((t, i) => (
          <motion.span
            key={t}
            aria-hidden={(i === 1) !== done}
            className="[grid-area:1/1] whitespace-nowrap"
            initial={false}
            animate={{ y: (i === 1) === done ? '0%' : i === 1 ? '110%' : '-110%', opacity: (i === 1) === done ? 1 : 0 }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            {t}
          </motion.span>
        ))}
      </span>
    </motion.button>
  )
}
