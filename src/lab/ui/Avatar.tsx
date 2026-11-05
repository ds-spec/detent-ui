'use client'

import { Orb } from './Orb'

export function Avatar({ name, hue, size = 32, className = '' }: { name: string; hue: number; size?: number; className?: string }) {
  return <Orb seed={name} hue={hue} size={size} className={className} />
}
