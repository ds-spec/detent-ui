'use client'

import { Palette } from './Palette'

/**
 * The ⌘K palette. It's its own chunk, fetched the first time someone asks for search, so the
 * catalogue it reads never rides along on an ordinary page load.
 */
export function Search({ open, onOpenChange, sound, toggleSound }: { open: boolean; onOpenChange: (open: boolean) => void; sound: boolean; toggleSound: () => void }) {
  return <Palette open={open} onOpenChange={onOpenChange} sound={sound} toggleSound={toggleSound} />
}
