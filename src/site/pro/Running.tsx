'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from '@/lab/icons'
import { BLOCK_VIEWS } from '@pro'
import { Backdrop, Window } from '../blocks/Studio'
import { Fit } from '../Fit'
import { useNear } from '../near'

export function Running({ id, name, title, count }: { id: string; name: string; title: string; count: number }) {
  const box = useRef<HTMLDivElement>(null)
  const near = useNear(box, '300px 0px', '700px 0px')
  const View = BLOCK_VIEWS[id]
  return (
    <div ref={box} className="mx-auto max-w-[1180px]">
      <div className="relative isolate aspect-[4/5] overflow-hidden rounded-[24px] sm:aspect-[16/10] sm:rounded-[28px] lg:aspect-auto lg:h-[600px]">
        <Backdrop tone="violet" />
        {near && View ? (
          <div inert className="absolute inset-0">
            <Fit pad={32} max={1} min={0.2}>
              <div className="h-[calc(125vw-66px)] w-[calc(100vw-56px)] sm:h-[660px] sm:w-[1000px]">
                <Window title={title} chrome="titled">
                  <div className="h-full overflow-hidden">
                    <View autoplay />
                  </div>
                </Window>
              </div>
            </Fit>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3 px-1">
        <p className="min-w-0 flex-1 truncate text-[14px] text-ink">
          {name}
        </p>
        <span className="hidden shrink-0 text-[13px] text-ink-3 sm:inline">One of {count} blocks</span>
        <Link href={`/blocks/${id}`} className="ring-focus group/open flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
          Open
          <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
        </Link>
      </div>
    </div>
  )
}
