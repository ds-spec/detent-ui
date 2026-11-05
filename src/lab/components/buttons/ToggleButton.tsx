'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Plus } from '../../icons'
import { tap } from '../../lib/feel'
import { Morph } from '../../ui/Morph'

export function ToggleButton({
  pressed,
  onPressedChange,
  off = 'Follow',
  on = 'Following',
  undo = 'Unfollow',
  icons = { off: <Plus size={15} />, on: <Check size={15} strokeWidth={2.4} /> },
}: {
  pressed: boolean
  onPressedChange: (next: boolean) => void
  off?: string
  on?: string
  undo?: string
  icons?: { off?: ReactNode; on?: ReactNode }
}) {
  const [over, setOver] = useState(false)
  const [fresh, setFresh] = useState(false)
  const view = !pressed ? 'off' : over && !fresh ? 'undo' : 'on'
  const face = (icon: ReactNode, text: string) => (
    <span className="flex h-9 items-center gap-1.5 whitespace-nowrap px-3.5 text-callout font-medium">
      {icon}
      {text}
    </span>
  )
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onPointerDown={tap}
      onPointerEnter={(e) => e.pointerType !== 'touch' && setOver(true)}
      onPointerLeave={() => {
        setOver(false)
        setFresh(false)
      }}
      onClick={() => {
        setFresh(!pressed)
        onPressedChange(!pressed)
      }}
      className="sink ring-focus rounded-control"
    >
      <Morph
        view={view}
        views={{ off: face(icons.off, off), on: face(icons.on, on), undo: face(null, undo) }}
        radius={10}
        anchor="center"
        justify="center"
        className={`transition-[background-color,color,box-shadow] duration-200 ${
          view === 'off'
            ? 'bg-ink text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.16)]'
            : view === 'undo'
              ? 'bg-[color-mix(in_oklch,var(--danger)_11%,transparent)] text-danger'
              : 'bg-surface-2 text-ink'
        }`}
      />
    </button>
  )
}
