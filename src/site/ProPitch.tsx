'use client'

import Link from 'next/link'
import { block } from '@/catalog/blocks'
import { entry } from '@/catalog/meta'
import { PLANS, PRO_BLOCK_COUNT, PRO_COMPONENTS, isProBlock, isProComponent } from '@/catalog/pro'
import { TEMPLATE_COUNT } from '@/catalog/templates'
import { REFUND_DAYS } from '@/catalog/trust'
import { ArrowRight, ArrowUpRight } from '@/lab/icons'
import { ForPlan } from './Owned'
import { Price } from './Promo'

const PICKS = ['glyph', 'region', 'threads', 'find', 'funnel', 'forecast']
const BLOCK_PICKS = ['onboarding', 'support-inbox', 'task-to-merge', 'agent-chat', 'evals', 'calendar']

export function ProPitch({ id, shelf = 'components', near = false }: { id: string; shelf?: 'components' | 'blocks'; near?: boolean }) {
  const blocks = shelf === 'blocks'
  const pro = blocks ? isProBlock(id) : isProComponent(id)
  const name = (blocks ? block(id)?.name : entry(id)?.name) ?? id
  const others = blocks ? BLOCK_PICKS.filter((p) => p !== id && isProBlock(p)).slice(0, 4) : PICKS.filter((p) => p !== id && PRO_COMPONENTS.includes(p)).slice(0, 4)
  const plan = PLANS[0]
  return (
    <ForPlan
      none={
        <section aria-labelledby="pro-pitch" className={`overflow-hidden rounded-[28px] bg-surface shadow-[var(--card-edge)] ${near ? 'mt-3 sm:mt-5' : blocks ? 'mt-6 sm:mt-8' : 'mt-12 sm:mt-16'}`}>
          <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 id="pro-pitch" className="text-[clamp(24px,2.4vw,32px)] font-normal leading-[1.1] tracking-[-0.035em] text-ink">
                {pro ? (
                  <>
                    {name} is in Pro. <span className="text-quiet">So is everything else.</span>
                  </>
                ) : (
                  <>
                    Like this one? <span className="text-quiet">Pro has {blocks ? `${PRO_BLOCK_COUNT} more screens` : `${PRO_COMPONENTS.length} more`}.</span>
                  </>
                )}
              </h2>
              <p className="mt-3 max-w-[520px] text-[15px] leading-[1.6] text-ink-3">
                {PRO_COMPONENTS.length} Pro components, {PRO_BLOCK_COUNT} whole screens and {TEMPLATE_COUNT}. The source lands in your project, yours to change, with every update for life.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {others.map((o) => (
                  <li key={o}>
                    <Link href={`/${shelf}/${o}`} className="ring-focus group/chip flex h-8 items-center gap-1 rounded-full bg-surface-2 pl-3 pr-2.5 text-[13px] text-ink-2 transition-colors duration-150 hover:text-ink">
                      {(blocks ? block(o)?.name : entry(o)?.name) ?? o}
                      <ArrowUpRight size={11} className="text-ink-3 transition-transform duration-150 group-hover/chip:-translate-y-px group-hover/chip:translate-x-px" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className="flex items-baseline gap-1.5">
                <span className="tnum text-[40px] leading-none tracking-[-0.045em] text-ink">
                  <Price value={plan.price} />
                </span>
                <span className="text-[14px] text-ink-3">once</span>
              </p>
              <a href={plan.href} data-cta="piece-pitch" className="ring-focus group/buy mt-2 flex h-11 items-center gap-2 rounded-full bg-ink pl-5 pr-4 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
                Get Pro
                <ArrowRight size={14} className="transition-transform duration-150 group-hover/buy:translate-x-0.5" />
              </a>
              <p className="text-[12.5px] text-ink-3">{REFUND_DAYS}-day refund while you try it.</p>
            </div>
          </div>
        </section>
      }
    />
  )
}
