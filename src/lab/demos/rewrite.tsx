'use client'

import { useRef, useState } from 'react'
import { Rewrite } from '../components/rewrite/Rewrite'
import type { RewriteHandle } from '../components/rewrite/Rewrite'
import { Orb } from '@/lab/ui/Orb'
import { useLoop } from '@/lab/demos/loop'
import { useBench } from '@/lab/demos/bench'

const TEXT =
  'If an order arrives damaged, customers can ask for a refund within 30 days. In most cases we will be able to process the refund once the item has been returned to our warehouse and checked by the team, which usually takes about two weeks.'
const PHRASE = 'In most cases we will be able to process the refund once the item has been returned to our warehouse and checked by the team, which usually takes about two weeks.'
const ASK = 'Shorter, and say no return is needed'
const VERSIONS: Record<string, string> = {
  Shorter: 'We refund it straight away, and nothing needs to be sent back.',
  Friendlier: 'You won’t need to send anything back: we’ll refund it right away.',
}
const OWN = 'We refund it straight away. There’s nothing to send back.'

const rewrite = (_: string, ask: string) => new Promise<string>((r) => setTimeout(() => r(VERSIONS[ask] ?? OWN), 1300))

/** A policy draft: its slowest sentence is selected, asked to be shorter in plain words, reviewed and accepted. Touch it to select your own words. */
export function RewriteDemo() {
  const [run, setRun] = useState(0)
  return <RewriteRun key={run} onDone={() => setRun((r) => r + 1)} />
}

function RewriteRun({ onDone }: { onDone: () => void }) {
  const b = useBench()
  const ed = useRef<RewriteHandle>(null)
  const handlers = useLoop(async (beat) => {
    await beat(1200)
    const at = TEXT.indexOf(PHRASE)
    ed.current?.select(at, at + PHRASE.length)
    await beat(900)
    for (let i = 1; i <= ASK.length; i++) {
      ed.current?.ask(ASK.slice(0, i))
      await beat(ASK[i - 1] === ' ' ? 80 : 38)
    }
    await beat(500)
    ed.current?.run()
    await beat(1300 + 900)
    await beat(1500)
    ed.current?.accept()
    await beat(3200)
    onDone()
  })
  return (
    <div className="@container w-[560px] max-w-full">
    <div className="rounded-[24px] bg-surface px-5 pb-12 pt-6 @min-[480px]:pb-16 shadow-float @min-[480px]:px-8" {...handlers}>
      <div className="flex items-center justify-between gap-3 whitespace-nowrap text-caption text-ink-3">
        <span className="min-w-0 truncate">
          Help center <span className="px-1 text-ink-3/60">/</span> Policies
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--ok)]" />
            Draft · Saved
          </span>
          <Orb seed="Maya Chen" hue={150} size={20} />
        </span>
      </div>
      <h3 className="mt-5 text-[24px] font-medium leading-[30px] tracking-[-0.02em] text-ink">Refunds for damaged orders</h3>
      {/* Held at the height of the longest moment, the tracked change, so the card never resizes. */}
      <div className="mt-4 h-[276px] @min-[480px]:h-[140px]">
        <Rewrite ref={ed} text={TEXT} rewrite={rewrite} assistant={b.get('assistant', 'Detent')} onChange={b.on('onChange')} />
      </div>
    </div>
    </div>
  )
}
