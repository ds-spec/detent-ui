import type { Plan } from '@/catalog/licence'

const LIT =
  'text-white bg-[linear-gradient(180deg,color-mix(in_oklch,var(--accent),white_9%),var(--accent))] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_0_0_1px_color-mix(in_oklch,var(--accent),black_22%),0_1px_2px_rgb(0_0_0/0.14)] dark:bg-[#3b66f5] dark:bg-none dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_0_1px_#2a4fd0]'

function Seated({ size }: { size: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" />
      <path d="M11.25 3a9 9 0 0 1 0 18z" />
    </svg>
  )
}

export const planLabel = (plan: Plan) => (plan === 'all' ? 'Pro + Templates' : 'Pro')

export function ProBadge({ plan, size = 'sm' }: { plan: Plan; size?: 'sm' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <span className={`inline-flex shrink-0 select-none items-center font-semibold tracking-[0.01em] ${LIT} ${lg ? 'h-7 gap-1.5 rounded-[8px] pl-2 pr-2.5 text-footnote' : 'h-[22px] gap-1 rounded-[6px] pl-1.5 pr-2 text-caption'}`}>
      <Seated size={lg ? 13 : 11} />
      {lg ? `Detent ${planLabel(plan)}` : planLabel(plan)}
    </span>
  )
}
