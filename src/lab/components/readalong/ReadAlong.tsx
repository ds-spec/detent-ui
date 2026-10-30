'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { tap } from '../../lib/feel'

export type ReadAlongLine = { /** Seconds into the note. */ at: number; text: string }

const SPEEDS = [1, 1.5, 2]
const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`

/**
 * A voice note you can read. The sentence being said fills the card and darkens word by word as it
 * plays, so you can follow it on mute, or drag along the sound to find the part that matters. Give
 * it `src` to play real audio; without one the clock runs by itself, for demos.
 */
export function ReadAlong({
  lines,
  length,
  src,
  from,
  start = 0,
}: {
  /** What's said, and when each sentence starts. */
  lines: ReadAlongLine[]
  /** The note's length in seconds. */
  length: number
  /** The audio file. */
  src?: string
  /** Who it's from, and what about. */
  from?: string
  /** Where it opens, in seconds. */
  start?: number
}) {
  const [at, setAt] = useState(start)
  const [wanted, setWanted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const audio = useRef<HTMLAudioElement>(null)
  const wave = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const bars = useMemo(() => Array.from({ length: 72 }, (_, i) => 0.14 + 0.86 * Math.abs(Math.sin(i * 0.47) * Math.cos(i * 0.19 + 0.6) * (0.55 + 0.45 * Math.sin(i * 1.3)))), [])

  // Without a file the clock runs itself, and stops at the end of the note.
  const playing = wanted && (!!src || at < length)

  useEffect(() => {
    if (!playing || src) return
    const t = setInterval(() => setAt((s) => Math.min(length, s + 0.1 * speed)), 100)
    return () => clearInterval(t)
  }, [playing, speed, length, src])
  useEffect(() => {
    const a = audio.current
    if (!a) return
    a.playbackRate = speed
    if (playing) void a.play()
    else a.pause()
  }, [playing, speed])

  const seekTo = (s: number) => {
    setAt(s)
    if (audio.current) audio.current.currentTime = s
  }
  const seek = (e: PointerEvent<HTMLDivElement>) => {
    const r = wave.current!.getBoundingClientRect()
    seekTo(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * length)
  }
  const n = Math.max(0, lines.findLastIndex((l) => l.at <= at))
  const line = lines[n]
  const until = lines[n + 1]?.at ?? length
  const words = line.text.split(' ')
  const said = Math.ceil(((at - line.at) / (until - line.at)) * words.length)

  return (
    <section aria-label="Voice note" className="w-[440px] max-w-full rounded-[26px] bg-surface/85 p-5 text-ink shadow-[0_0_0_1px_var(--line),0_34px_64px_-28px_rgb(60_30_10/0.6)] backdrop-blur-2xl">
      {src ? <audio ref={audio} src={src} preload="metadata" onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)} onEnded={() => setWanted(false)} /> : null}
      {from ? <p className="text-[13px] text-ink-3">{from}</p> : null}
      <div className="relative mt-3 h-[118px] overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p key={n} className="absolute inset-x-0 top-0 text-[27px] leading-[1.26] tracking-[-0.03em]" initial={reduce ? false : { y: 118 }} animate={{ y: 0 }} exit={reduce ? undefined : { y: -118 }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}>
            {words.map((w, i) => (
              <span key={i} className={`transition-colors duration-200 ${i < said ? 'text-ink' : 'text-ink-3 opacity-50'}`}>
                {w}{' '}
              </span>
            ))}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        ref={wave}
        role="slider"
        tabIndex={0}
        aria-label="Position"
        aria-valuemin={0}
        aria-valuemax={length}
        aria-valuenow={Math.round(at)}
        aria-valuetext={time(at)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          seek(e)
        }}
        onPointerMove={(e) => e.buttons && seek(e)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
          e.preventDefault()
          seekTo(Math.min(length, Math.max(0, at + (e.key === 'ArrowRight' ? 5 : -5))))
        }}
        className="ring-focus mt-3 flex h-9 cursor-pointer touch-none items-center justify-between rounded-[6px]"
      >
        {bars.map((h, i) => (
          <span key={i} aria-hidden className={`w-[2px] shrink-0 rounded-full ${((i + 0.5) / bars.length) * length <= at ? 'bg-ink' : 'bg-[var(--line-strong)]'}`} style={{ height: `${Math.round(h * 100)}%` }} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            tap()
            if (at >= length) seekTo(0)
            setWanted(!playing)
          }}
          aria-label={playing ? 'Pause' : 'Play'}
          className="ring-focus grid size-10 place-items-center rounded-full bg-ink text-surface transition-transform duration-150 active:scale-[0.92]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            {playing ? (
              <>
                <rect x="6" y="4.5" width="4.4" height="15" rx="1.4" />
                <rect x="13.6" y="4.5" width="4.4" height="15" rx="1.4" />
              </>
            ) : (
              <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l12-7.2c.6-.4.6-1.3 0-1.7l-12-7.3C7.9 3.5 7 4 7 4.8z" />
            )}
          </svg>
        </button>
        <span className="tnum text-[13px] text-ink-3">
          {time(at)} / {time(length)}
        </span>
        <button
          type="button"
          onClick={() => {
            tap()
            setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])
          }}
          aria-label={`Speed ${speed} times`}
          className="ring-focus tnum ml-auto h-8 rounded-[9px] px-2.5 text-[13px] text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          {speed}×
        </button>
      </div>
    </section>
  )
}
