'use client'

import { useEffect, useRef, useState } from 'react'
import { Buddy } from './buddy'
import type { BuddyMood } from './buddy'

const MOODS: BuddyMood[] = ['idle', 'listening', 'thinking', 'happy', 'sleepy']

export default function BuddyDemo() {
  const [mood, setMood] = useState<BuddyMood>('idle')
  const [text, setText] = useState('')
  const timer = useRef(0)
  const run = () => {
    window.clearTimeout(timer.current)
    setText('')
    setMood('thinking')
    timer.current = window.setTimeout(() => {
      setMood('happy')
      timer.current = window.setTimeout(() => setMood('idle'), 1600)
    }, 1400)
  }
  const pick = (m: BuddyMood) => {
    window.clearTimeout(timer.current)
    setMood(m)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const shown: BuddyMood = mood === 'idle' && text ? 'listening' : mood
  const small: BuddyMood = mood === 'happy' ? 'happy' : 'idle'
  return (
    <div className="flex min-h-[560px] w-full items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-9 text-foreground">
        <Buddy size={136} mood={shown} label={`Buddy, ${shown}`} />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) run()
          }}
          className="flex h-12 w-[320px] max-w-full items-center rounded-full bg-muted px-5 shadow-[inset_0_0_0_0.5px_var(--color-border)] transition-shadow duration-150 focus-within:shadow-[inset_0_0_0_0.5px_var(--color-border),0_0_0_3px_color-mix(in_oklch,var(--color-ring)_30%,transparent)]"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything, then press Enter" aria-label="Message" className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground pointer-coarse:text-[16px]" />
        </form>
        <div role="radiogroup" aria-label="Mood" className="flex flex-wrap justify-center gap-1">
          {MOODS.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mood === m} onClick={() => pick(m)} className={`h-7 rounded-full px-2.5 text-[12px] capitalize transition-[transform,background-color,color] duration-150 active:scale-[.97] ${mood === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Buddy size={28} tone="ink" mood={small} />
          <Buddy size={28} tone="paper" mood={small} />
          <Buddy size={28} tone="blue" mood={small} />
        </div>
      </div>
    </div>
  )
}
