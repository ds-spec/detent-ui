import { Orb } from '@/lab/ui/Orb'

export function DetentMark({ size = 28, round = false, className = '' }: { size?: number; round?: boolean; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={`shrink-0 ${className}`}>
      <rect width="24" height="24" rx={round ? 12 : 7} fill="var(--ink)" />
      <g transform={`translate(12 12) scale(${round ? 0.54 : 0.6}) translate(-12 -12)`} fill="var(--surface)">
        <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" />
        <path d="M11.25 3a9 9 0 0 1 0 18z" />
      </g>
    </svg>
  )
}

export function ProductMark({ name, size = 20, round = false, hue = 250, className = '' }: { name: string; size?: number; round?: boolean; hue?: number; className?: string }) {
  return name === 'Detent' ? <DetentMark size={size} round={round} className={className} /> : <Orb seed={name} hue={hue} size={size} className={className} />
}
