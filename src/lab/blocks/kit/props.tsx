'use client'

import { createContext, useContext } from 'react'
import type { CSSProperties } from 'react'

export type BlockProps = {
  autoplay?: boolean
  accent?: string
  className?: string
}

export const Names = createContext({ assistant: 'Detent', product: 'Detent' })
export const useNames = () => useContext(Names)

export const handle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export function accentVars(accent?: string): CSSProperties | undefined {
  if (!accent) return undefined
  return {
    ['--accent' as string]: accent,
    ['--accent-ink' as string]: `light-dark(color-mix(in oklch, ${accent} 82%, black), color-mix(in oklch, ${accent} 60%, white))`,
  }
}
