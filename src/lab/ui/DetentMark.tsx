import { Orb } from '@/lab/ui/Orb'

/**
 * Detent's mark in its tile: the Seated D, a slab and a half-disc that clicked into place. It
 * stands for the product and its AI wherever a block shows them; round sits it among people's
 * orbs. Swap it for your own logo.
 */
export function DetentMark({ size = 28, round = false, className = '' }: { size?: number; round?: boolean; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={`shrink-0 ${className}`}>
      <rect width="24" height="24" rx={round ? 12 : 7} fill="var(--ink)" />
      {/* The Seated D, at three-fifths, centred in its tile; a touch smaller in a circle. */}
      <g transform={`translate(12 12) scale(${round ? 0.54 : 0.6}) translate(-12 -12)`} fill="var(--surface)">
        <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" />
        <path d="M11.25 3a9 9 0 0 1 0 18z" />
      </g>
    </svg>
  )
}

/** What stands for a product or its AI: Detent's mark for Detent, and an orb of its own for any other name. */
export function ProductMark({ name, size = 20, round = false, hue = 250, className = '' }: { name: string; size?: number; round?: boolean; hue?: number; className?: string }) {
  return name === 'Detent' ? <DetentMark size={size} round={round} className={className} /> : <Orb seed={name} hue={hue} size={size} className={className} />
}
