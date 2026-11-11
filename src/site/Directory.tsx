import { ArrowUpRight } from '@/lab/icons'

export const DIRECTORY = 'https://ui.shadcn.com/docs/directory?q=detent'

function ShadcnMark() {
  return (
    <svg aria-hidden width="13" height="13" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="28" strokeLinecap="round">
      <line x1="208" y1="128" x2="128" y2="208" />
      <line x1="192" y1="40" x2="40" y2="192" />
    </svg>
  )
}

export function InDirectory({ pill = false, className = '' }: { pill?: boolean; className?: string }) {
  return (
    <a
      href={DIRECTORY}
      target="_blank"
      rel="noopener noreferrer"
      className={`ring-focus group/dir inline-flex items-center gap-1.5 text-[13px] transition-[color,box-shadow,transform] duration-150 active:scale-[0.97] ${
        pill ? 'h-8 rounded-full bg-surface pl-3 pr-2.5 text-ink-2 shadow-[var(--card-edge)] hover:text-ink' : 'rounded-[6px] text-ink-2 hover:text-ink'
      } ${className}`}
    >
      <span className="text-ink">
        <ShadcnMark />
      </span>
      In the official shadcn directory
      <ArrowUpRight size={11} className="text-ink-3 transition-transform duration-150 group-hover/dir:-translate-y-px group-hover/dir:translate-x-px" />
    </a>
  )
}
