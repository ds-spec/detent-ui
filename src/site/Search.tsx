'use client'

import { Palette } from './Palette'

export function Search({ open, onOpenChange, sound, toggleSound }: { open: boolean; onOpenChange: (open: boolean) => void; sound: boolean; toggleSound: () => void }) {
  return <Palette open={open} onOpenChange={onOpenChange} sound={sound} toggleSound={toggleSound} />
}
