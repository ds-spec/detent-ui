'use client'

import { useEffect, useRef, useState } from 'react'
import { Buddy } from '../components/buddy/Buddy'
import type { BuddyMood } from '../components/buddy/Buddy'
import { IRIS } from '@/lab/lib/iris'

const MOODS: BuddyMood[] = ['idle', 'listening', 'thinking', 'happy', 'sleepy']

export function BuddyDemo() {
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
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const shown: BuddyMood = mood === 'idle' && text ? 'listening' : mood
  return (
    <div style={IRIS} className="flex size-full flex-col items-center justify-center gap-6 p-4">
      <Buddy size={88} mood={shown} label={`Buddy, ${shown}`} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) run()
        }}
        className="flex h-11 w-[300px] max-w-full items-center gap-2 rounded-full bg-[var(--i-tray)] pl-4 pr-1.5 shadow-[inset_0_0_0_0.5px_var(--i-edge)]"
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type, then press Enter" aria-label="Message" className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--i-t1)] outline-none placeholder:text-[var(--i-t3)] pointer-coarse:text-[16px]" />
      </form>
      <div role="radiogroup" aria-label="Mood" className="flex flex-wrap justify-center gap-1">
        {MOODS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mood === m} onClick={() => setMood(m)} className={`h-7 rounded-full px-2.5 text-[12px] capitalize transition-[transform,background-color,color] duration-150 active:scale-[.97] ${mood === m ? 'bg-[var(--i-ink)] text-[var(--i-ink-on)]' : 'text-[var(--i-t2)] hover:bg-[var(--i-hover)]'}`}>
            {m}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Buddy size={20} tone="ink" />
        <Buddy size={28} tone="paper" />
        <Buddy size={36} tone="blue" />
      </div>
    </div>
  )
}
