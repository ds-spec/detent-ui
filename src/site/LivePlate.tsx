'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { Fit } from './Fit'
import { PassOver } from './PassOver'
import { useNear } from './near'

const CAPTION = 132

export function LivePlate({ id, bleed = false, well, caption, className = '', pad = 44 }: { id: string; bleed?: boolean; well: string; caption: ReactNode; className?: string; pad?: number }) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const near = useNear(box, '350px 0px', '600px 0px')
  const Demo = DEMOS[id]
  const [tall, setTall] = useState<number | null>(null)
  return (
    <motion.div
      ref={box}
      className={`relative flex flex-col rounded-[28px] bg-surface p-2 shadow-[var(--card-edge)] ${className}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      style={{ height: tall ? tall + CAPTION : undefined }}
    >
      <div className="relative isolate min-h-0 flex-1 overflow-hidden rounded-[22px]" style={{ background: well }}>
        <div className="library-grain pointer-events-none absolute inset-0 -z-10" />
        <div className="absolute inset-0">
          {near && Demo ? (
            bleed ? (
              <PassOver className="absolute inset-0">
                <Demo />
              </PassOver>
            ) : (
              <Fit pad={pad} max={1} min={0.5} onPhone={setTall}>
                <Demo />
              </Fit>
            )
          ) : null}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_0_1px_var(--line)]" />
      </div>
      {caption}
    </motion.div>
  )
}
