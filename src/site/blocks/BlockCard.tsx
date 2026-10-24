'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@/lab/icons'
import { BLOCK_VIEWS } from '@pro'
import { useNear } from '../near'
import { Backdrop, Window } from './Studio'

/**
 * A block on the index, running live at the card's own size: not a scaled picture, so a narrow
 * card shows the block's narrow layout. It only runs while it's near the screen. The preview is
 * for looking at; the card is the link, so nothing inside it competes for the press.
 */
export function BlockCard({ id, name, kind, line, title, chrome, featured = false }: { id: string; name: string; kind: string; line: string; title: string; chrome?: 'app' | 'titled' | 'browser'; featured?: boolean }) {
  const View = BLOCK_VIEWS[id]
  const box = useRef<HTMLDivElement>(null)
  const near = useNear(box, '240px 0px', '480px 0px')
  return (
    <Link href={`/blocks/${id}`} className="ring-focus group/card block rounded-[32px]">
      {/* The stage: the block's window on the wallpaper. The caption sits below it, on the page. */}
      <div className={`relative overflow-hidden rounded-[28px] ${featured ? 'p-3 sm:p-10' : 'p-3 sm:p-7'}`}>
        <Backdrop />
        <div ref={box} className={`relative ${featured ? 'h-[clamp(500px,54vw,720px)]' : 'h-[clamp(400px,36vw,500px)]'}`} inert>
          <Window title={title} chrome={chrome}>{near ? <View /> : null}</Window>
        </div>
      </div>
      <div className="relative flex items-end justify-between gap-6 px-2 pb-1 pt-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-footnote text-ink-3">
            {kind}
          </p>
          <p className="mt-1 text-title text-ink">{name}</p>
          <p className="mt-1 line-clamp-2 max-w-[640px] text-callout text-ink-3">{line}</p>
        </div>
        <span className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-surface transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] group-hover/card:translate-x-1">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  )
}
