'use client'

import { useImperativeHandle, useRef } from 'react'
import type { ReactNode, Ref } from 'react'
import { motion } from 'motion/react'
import { Check, ChevronDown } from '../../icons'
import { tap } from '../../lib/feel'
import { press } from '../../lib/motion'
import { Morph } from '../../ui/Morph'
import { DropdownMenu } from '../overlays/DropdownMenu'
import type { DropdownHandle } from '../overlays/DropdownMenu'

export type SplitOption = { id: string; label: string; icon?: ReactNode }
export type SplitHandle = { open(): void; choose(index: number): void }

const HOVER = 'hover:bg-[color-mix(in_oklch,var(--surface)_10%,transparent)]'

export function SplitButton({
  options,
  value,
  onValueChange,
  onAction,
  label = 'Other ways',
  ref,
}: {
  options: SplitOption[]
  value: string
  onValueChange: (id: string) => void
  onAction: (id: string) => void
  label?: string
  ref?: Ref<SplitHandle>
}) {
  const menu = useRef<DropdownHandle>(null)
  useImperativeHandle(ref, () => ({ open: () => menu.current?.open(), choose: (i) => menu.current?.choose([i]) }))
  const current = options.find((o) => o.id === value) ?? options[0]
  return (
    <div className="inline-flex h-9 items-stretch rounded-control bg-ink text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.16)]">
      <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={() => onAction(current.id)} className={`sink ring-focus flex items-center rounded-l-control pl-3.5 pr-3 transition-colors duration-150 ${HOVER}`}>
        <Morph
          view={current.id}
          views={Object.fromEntries(
            options.map((o) => [
              o.id,
              <span key={o.id} className="flex h-9 items-center gap-2 whitespace-nowrap text-callout font-medium">
                {o.icon}
                {o.label}
              </span>,
            ]),
          )}
          radius={0}
          anchor="center"
          justify="start"
        />
      </motion.button>
      <span aria-hidden className="my-2.5 w-px bg-[color-mix(in_oklch,var(--surface)_24%,transparent)]" />
      <DropdownMenu
        ref={menu}
        label={label}
        align="end"
        items={options.map((o) => ({ label: o.label, icon: o.id === current.id ? <Check size={15} strokeWidth={2.4} /> : <span className="size-[15px]" />, onSelect: () => onValueChange(o.id) }))}
        trigger={
          <motion.button type="button" whileTap={press} aria-label={label} className={`sink ring-focus flex h-9 w-9 items-center justify-center rounded-r-control transition-colors duration-150 ${HOVER}`}>
            <ChevronDown size={15} />
          </motion.button>
        }
      />
    </div>
  )
}
