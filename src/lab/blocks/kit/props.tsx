'use client'

import { createContext, useContext } from 'react'
import type { CSSProperties } from 'react'

/** What every block takes. */
export type BlockProps = {
  /** Play the scripted demo. It hands over to whoever touches the block first. */
  autoplay?: boolean
  /** The one accent colour. Selection, focus, links and the AI's glow all derive from it. */
  accent?: string
  className?: string
}

/** What the AI and the product are called wherever a block names them. */
export const Names = createContext({ assistant: 'Detent', product: 'Detent' })
export const useNames = () => useContext(Names)

/** A name as it'd appear in a branch or a handle. */
export const handle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** The accent as scoped variables: the darker ink for text comes from the colour itself. */
export function accentVars(accent?: string): CSSProperties | undefined {
  if (!accent) return undefined
  return {
    ['--accent' as string]: accent,
    ['--accent-ink' as string]: `light-dark(color-mix(in oklch, ${accent} 82%, black), color-mix(in oklch, ${accent} 60%, white))`,
  }
}
