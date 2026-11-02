'use client'

import { useEffect, useState } from 'react'
import { NEVER, Rewind } from '../components/rewind/Rewind'
import type { RewindCell, RewindHistory, RewindStep } from '../components/rewind/Rewind'

// A real little writing session, with its wrong turns, so the demo has something worth going back to.
function session(): RewindHistory {
  const living = (t: RewindCell[]) => t.filter((m) => m.died === NEVER)
  let id = 0
  let caret = 0
  let t = 0
  const tape: RewindCell[] = []
  const steps: RewindStep[] = [{ text: '', caret, t }]
  const push = (gap: number) => {
    t += gap
    steps.push({ text: living(tape).map((m) => m.c).join(''), caret, t })
  }
  const type = (s: string) => {
    for (const c of s) {
      const now = living(tape)
      let at = caret ? tape.indexOf(now[caret - 1]) + 1 : 0
      while (at < tape.length && tape[at].died !== NEVER) at++
      tape.splice(at, 0, { id: id++, c, born: steps.length, died: NEVER })
      caret++
      push(0.09 + ((c.charCodeAt(0) * 7) % 10) / 90)
    }
  }
  const back = (n: number) => {
    for (let i = 0; i < n; i++) {
      living(tape)[caret - 1].died = steps.length
      caret--
      push(0.06)
    }
  }
  const wait = (s: number) => (t += s)
  const go = (find: string, after = true) => {
    const i = living(tape).map((m) => m.c).join('').indexOf(find)
    caret = after ? i + find.length : i
    wait(1.4)
  }
  type('The launch moves to Thursday.')
  wait(9)
  back(9)
  type('Friday, after the review.')
  wait(14)
  type(' Maya will send the notes tonight.')
  wait(6)
  back(8)
  type('in the morning.')
  wait(21)
  type('\n\nWe should cut the pricing page. Nobody reads it.')
  wait(11)
  back(16)
  wait(3)
  type('People skim it and leave.')
  wait(32)
  go('cut the pricing page')
  back(20)
  type('rewrite the pricing page')
  wait(17)
  go('People skim it and leave.')
  type(' Start with the one question everyone asks.')
  wait(26)
  caret = living(tape).length
  type('\n\nDecide by Wednesday.')
  const shift = Date.now() / 1000 - t
  return { tape, steps: steps.map((s) => ({ ...s, t: s.t + shift })) }
}

export function RewindDemo() {
  // The session is dated from now, so it's built once we're in the browser.
  const [history, setHistory] = useState<RewindHistory | null>(null)
  useEffect(() => setHistory(session()), [])
  // It goes back to where the most lost words can be seen at once.
  const intro = history?.steps.findLastIndex((s) => s.text.includes('Nobody reads it'))
  return (
    <div className="grid size-full grid-cols-[minmax(0,1fr)] place-items-center p-6 text-ink">
      <div className="w-[640px] max-w-full text-[clamp(20px,2.8vw,25px)] font-medium leading-[1.36] tracking-[-.018em]">
        {history && <Rewind history={history} intro={intro} rows={8} maxHeight={330} />}
      </div>
    </div>
  )
}
