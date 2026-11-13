import { Face, QuoteMark, VoiceRail } from '../VoiceRail'
import { ArrowUpRight } from '@/lab/icons'
import { VOICES, byline, source, voice } from '../quotes'

const LEAD = voice('adeline')
const LINE = LEAD.short ?? LEAD.text
const REST = VOICES.filter((v) => v.id !== LEAD.id)

export function Quotes() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-surface shadow-[var(--card-edge)] lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <figure className="flex flex-col justify-center gap-8 p-6 sm:gap-10 sm:p-10 lg:p-14">
        <blockquote className="max-w-[620px] text-pretty text-[clamp(22px,2.1vw,30px)] font-normal leading-[1.3] tracking-[-0.03em] text-ink">
          <p className="-indent-[0.38em]">“{LINE}”</p>
        </blockquote>
        <figcaption className="flex items-center gap-3">
          <span className="relative shrink-0">
            <Face v={LEAD} size={40} />
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-ink text-surface shadow-[0_0_0_2px_var(--surface)]">
              <QuoteMark size={7} />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] leading-5 text-ink">{LEAD.name}</span>
            <span className="mt-0.5 flex items-baseline gap-[0.45em] whitespace-nowrap text-[13px] leading-[18px] text-ink-3">
              <span className="min-w-0 truncate">{byline(LEAD)}</span>
              {source(LEAD) && (
                <>
              <span aria-hidden className="text-[var(--quiet)]">·</span>
              <a href={source(LEAD)} target="_blank" rel="noopener noreferrer" aria-label={`${LEAD.name} on X`} className="ring-focus group/src inline-flex shrink-0 items-center gap-0.5 rounded-[3px] transition-colors duration-150 hover:text-ink">
                on X
                <ArrowUpRight size={10} strokeWidth={2.2} className="transition-transform duration-150 group-hover/src:-translate-y-px group-hover/src:translate-x-px" />
              </a>
                </>
              )}
            </span>
          </span>
        </figcaption>
      </figure>
      <div className="p-6 shadow-[inset_0_1px_0_var(--line)] sm:p-10 lg:py-12 lg:pl-10 lg:pr-12 lg:shadow-[inset_1px_0_0_var(--line)]">
        <VoiceRail items={REST} size="md" fact={false} />
      </div>
    </div>
  )
}
