'use client'

import { Orb } from './Orb'

/**
 * A person, as a soft gradient ball of their colour. Calm in a list of many, distinct enough to
 * tell people apart, and the same in both themes. Decorative: the name beside it is what gets
 * read out.
 */
export function Avatar({ name, hue, size = 32, className = '' }: { name: string; hue: number; size?: number; className?: string }) {
  return <Orb seed={name} hue={hue} size={size} className={className} />
}
