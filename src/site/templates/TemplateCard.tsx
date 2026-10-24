'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { animate, useReducedMotion } from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import { ArrowRight } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { TemplateBody } from '@pro'
import type { Template } from '@/catalog/templates'
import { Backdrop, Window } from '../blocks/Studio'
import { useNear } from '../near'

/**
 * A template on the gallery, running live in a browser window. A whole site doesn't fit in a
 * card, so pointing at it takes you on a tour: the page scrolls slowly from top to bottom and
 * every section plays as it comes past. Leave and it glides back to the top. The card is the
 * link; nothing inside it takes the pointer.
 */
export function TemplateCard({ t }: { t: Template }) {
  // An app fills its window and plays its own demo, so there's no page to tour.
  const app = t.form === 'app'
  const scheme = useTheme()
  const box = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const near = useNear(box, '240px 0px', '480px 0px')
  const reduce = useReducedMotion()
  const tour = useRef<AnimationPlaybackControls | null>(null)
  const [touring, setTouring] = useState(false)

  const go = (down: boolean) => {
    const el = page.current
    if (!el || reduce) return
    tour.current?.stop()
    const end = down ? el.scrollHeight - el.clientHeight : 0
    const dist = Math.abs(end - el.scrollTop)
    if (!dist) return
    setTouring(down)
    tour.current = animate(el.scrollTop, end, {
      // Down at reading pace; back up in a breath.
      duration: down ? Math.min(18, dist / 600) : Math.min(1.1, 0.4 + dist / 8000),
      ease: down ? [0.45, 0, 0.55, 1] : [0.2, 0.9, 0.25, 1],
      onUpdate: (v) => {
        el.scrollTop = v
      },
      onComplete: () => setTouring(false),
    })
  }

  return (
    // The page inside has links of its own, so the card isn't one: a single link lies over all of it.
    <article className="group/card relative rounded-[32px]" onPointerEnter={(e) => e.pointerType === 'mouse' && go(true)} onPointerLeave={() => go(false)}>
      <div className="relative overflow-hidden rounded-[28px] p-3 sm:p-10">
        <Backdrop />
        <div ref={box} className="relative h-[clamp(520px,58vw,780px)]" inert>
          <Window title={t.window} chrome="browser">
            <div ref={page} className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {near ? <TemplateBody id={t.id} theme={app ? scheme : undefined} /> : null}
            </div>
          </Window>
        </div>
      </div>
      <div className="relative flex items-end justify-between gap-6 px-2 pb-1 pt-5">
        <div className="min-w-0">
          <p className="text-footnote text-ink-3">
            {app ? 'App' : 'Landing page'} · {t.kind}
          </p>
          <h2 className="mt-1 text-title text-ink">{t.name}</h2>
          <p className="mt-1 line-clamp-2 max-w-[680px] text-callout text-ink-3">{t.line}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-footnote text-ink-3">
            <span>
              {t.parts.length} {app ? 'parts' : 'sections'}
            </span>
            <span aria-hidden className="size-[3px] rounded-full bg-ink-3/60" />
            <span>Light and dark</span>
            <span aria-hidden className="size-[3px] rounded-full bg-ink-3/60" />
            <span>Fits any width</span>
            <span aria-hidden className={`hidden size-[3px] rounded-full bg-ink-3/60 ${app ? '' : '[@media(hover:hover)]:block'}`} />
            <span className={`hidden ${app ? '' : '[@media(hover:hover)]:inline'}`}>
              <span className="grid">
                <span className={`col-start-1 row-start-1 transition-opacity duration-300 ${touring ? 'opacity-0' : ''}`}>Point at it to tour the page</span>
                <span className={`col-start-1 row-start-1 text-[var(--accent-ink)] transition-opacity duration-300 ${touring ? '' : 'opacity-0'}`}>Touring the page</span>
              </span>
            </span>
          </p>
        </div>
        <span aria-hidden className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-surface transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] group-hover/card:translate-x-1">
          <ArrowRight size={18} />
        </span>
      </div>
      <Link href={`/templates/${t.id}`} aria-label={`${t.name}, ${app ? 'an app' : 'a landing page'} for ${t.suits}`} className="ring-focus absolute inset-0 z-10 rounded-[32px]" />
    </article>
  )
}
