import { ArrowUpRight } from '@/lab/icons'
import { FACT, byline, source } from './quotes'
import type { Voice } from './quotes'

const SIZES = {
  sm: { face: 20, cols: 'grid-cols-[20px_minmax(0,1fr)] gap-x-2.5', label: 'text-[12px] leading-4', lift: 'pt-0.5', text: 'mt-[3px] text-[13px] leading-5', gap: 'pb-[18px]', dot: 'mt-[7px]', arrow: 9 },
  md: { face: 24, cols: 'grid-cols-[24px_minmax(0,1fr)] gap-x-3', label: 'text-[12.5px] leading-[18px]', lift: 'pt-[3px]', text: 'mt-1 text-[14px] leading-[22px]', gap: 'pb-6', dot: 'mt-[9px]', arrow: 10 },
}

export function QuoteMark({ size = 7 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size * 0.8} viewBox="0 0 10 8" fill="currentColor">
      <path d="M0 8V5.3C0 2.4 1.3.6 3.9 0l.5 1.1C3 1.6 2.3 2.6 2.2 4H4v4H0Zm5.6 0V5.3C5.6 2.4 6.9.6 9.5 0l.5 1.1C8.6 1.6 7.9 2.6 7.8 4h1.8v4H5.6Z" />
    </svg>
  )
}

export function Face({ v, size, ring = true, className = '' }: { v: Voice; size?: number; ring?: boolean; className?: string }) {
  const box = size ? { width: size, height: size } : undefined
  const edge = ring ? 'shadow-[0_0_0_1px_var(--line)]' : ''
  if (v.photo)
    return <img src={v.photo} alt="" width={size ?? 64} height={size ?? 64} draggable={false} loading="lazy" decoding="async" className={`block shrink-0 rounded-full object-cover ${edge} ${className}`} style={box} />
  const initials = v.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-surface-3 font-medium tracking-[-0.02em] text-ink-2 ${className}`} style={{ ...box, fontSize: size ? Math.round(size * 0.4) : 11 }}>
      {initials}
    </span>
  )
}

const Sep = () => (
  <span aria-hidden className="px-[0.45em] text-[var(--quiet)]">
    ·
  </span>
)

const LINK = 'ring-focus rounded-[3px] transition-colors duration-150 hover:text-ink'

function Line({ top }: { top: number }) {
  return <span aria-hidden className="absolute bottom-1 left-1/2 w-px -translate-x-1/2 bg-line" style={{ top }} />
}

export function VoiceRail({ items, size = 'sm', fact = true }: { items: Voice[]; size?: 'sm' | 'md'; fact?: boolean }) {
  const s = SIZES[size]
  return (
    <ol className="flex flex-col">
      {items.map((v, i) => {
        const last = !fact && i === items.length - 1
        return (
          <li key={v.id} className={`grid ${s.cols}`}>
            <span className="relative flex justify-center">
              <Face v={v} size={s.face} />
              {!last && <Line top={s.face + 4} />}
            </span>
            <div className={`min-w-0 ${s.lift} ${last ? '' : s.gap}`}>
              <p className={`flex min-w-0 items-baseline whitespace-nowrap ${s.label} text-ink-3`}>
                <span className="shrink-0 font-medium text-ink-2">{v.name}</span>
                <Sep />
                <span className="min-w-0 truncate">{byline(v)}</span>
                {source(v) && (
                  <>
                <Sep />
                <a href={source(v)} target="_blank" rel="noopener noreferrer" aria-label={`${v.name} on X`} className={`${LINK} group/src inline-flex shrink-0 items-center gap-0.5`}>
                  on X
                  <ArrowUpRight size={s.arrow} strokeWidth={2.2} className="transition-transform duration-150 group-hover/src:-translate-y-px group-hover/src:translate-x-px" />
                </a>
                  </>
                )}
              </p>
              <p className={`whitespace-pre-line text-pretty ${s.text} text-ink`}>{v.text}</p>
            </div>
          </li>
        )
      })}
      {fact && (
        <li className={`grid ${s.cols}`}>
          <span className="flex justify-center">
            <span aria-hidden className={`size-1.5 rounded-full bg-[var(--quiet)] ${s.dot}`} />
          </span>
          <div className={`min-w-0 ${s.lift}`}>
            <p className={`flex items-baseline whitespace-nowrap ${s.label} text-ink-3`}>
              <span className="font-medium text-ink-2">Fact</span>
              <Sep />
              <a href={FACT.href} target="_blank" rel="noopener noreferrer" className={`${LINK} group/src inline-flex items-center gap-0.5`}>
                on X
                <ArrowUpRight size={s.arrow} strokeWidth={2.2} className="transition-transform duration-150 group-hover/src:-translate-y-px group-hover/src:translate-x-px" />
              </a>
            </p>
            <p className={`text-pretty ${s.text} text-ink`}>
              {FACT.before} <span className="tabular-nums text-accent">{FACT.count}</span> {FACT.after}
            </p>
          </div>
        </li>
      )}
    </ol>
  )
}
