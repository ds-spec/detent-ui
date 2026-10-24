'use client'

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { PointerEvent, Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Pause, Play } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press, spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'

/** A word of the transcript and when it's said, in seconds. */
export type SpokenWord = { word: string; at: number }
/** For demos and tests: drive playback without touching it. */
export type VoiceNoteHandle = { play(): void; pause(): void; seek(seconds: number): void; speed(rate: number): void; transcript(open: boolean): void }

const COLS = 38
const ROWS = 7
const RATES = [1, 1.5, 2]
const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/**
 * A voice reply you can read along with. The waveform is a field of dots, loud moments reaching
 * further from the middle, and it inks in as the note plays; drag across it to scrub. The time
 * rolls, the speed steps from 1× to 2×, and under it the transcript follows the voice, each
 * word turning to ink as it's said. Pass `src` for real audio; without it the note plays on a
 * clock, which is how the demo runs.
 */
export function VoiceNote({
  words,
  duration,
  src,
  peaks: given,
  defaultTranscript = true,
  ref,
}: {
  /** The transcript, word by word, with when each is said. */
  words: SpokenWord[]
  /** How long the note is, in seconds. */
  duration: number
  /** The audio itself. Leave it out to play on a clock. */
  src?: string
  /** Loudness, 0 to 1, across the note. Worked out from the words' timing when left out. */
  peaks?: number[]
  /** Whether the transcript starts open. */
  defaultTranscript?: boolean
  ref?: Ref<VoiceNoteHandle>
}) {
  const [t, setT] = useState(0)
  // The same time, for the frame loop to read and advance without a stale closure.
  const head = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [reading, setReading] = useState(defaultTranscript)
  const audio = useRef<HTMLAudioElement | null>(null)
  const wave = useRef<HTMLDivElement>(null)
  const scrubbing = useRef(false)

  // Loudness per column: from the audio's peaks if given, else from where the words fall, so
  // speech reads as a shape and the pauses between phrases as quiet.
  const peaks = useMemo(() => {
    if (given) return Array.from({ length: COLS }, (_, c) => given[Math.floor((c / COLS) * given.length)] ?? 0)
    return Array.from({ length: COLS }, (_, c) => {
      const at = ((c + 0.5) / COLS) * duration
      const w = words.findLast((x) => x.at <= at)
      const next = words.find((x) => x.at > at)
      const gap = next && w ? next.at - w.at : 1
      const into = w ? at - w.at : 9
      // Inside a word it's loud, with a little texture; in a long gap it falls to a murmur.
      const voiced = into < Math.min(0.42, gap * 0.85)
      return voiced ? 0.2 + 0.8 * Math.abs(Math.sin(c * 2.3 + w!.word.length) * Math.cos(c * 0.7)) : 0.04
    })
  }, [given, duration, words])

  useEffect(() => {
    if (!src) return
    const a = new Audio(src)
    audio.current = a
    a.onended = () => setPlaying(false)
    return () => {
      a.pause()
      audio.current = null
    }
  }, [src])

  // The clock: the audio's own time when there is audio, otherwise time advanced at the rate.
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!scrubbing.current) {
        const next = Math.min(duration, audio.current ? audio.current.currentTime : head.current + dt * rate)
        head.current = next
        setT(next)
        if (next >= duration) setPlaying(false)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, duration])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate
  }, [rate])

  const play = () => {
    const from = t >= duration ? 0 : t
    head.current = from
    setT(from)
    if (audio.current) {
      audio.current.currentTime = from
      audio.current.play().catch(() => {})
    }
    setPlaying(true)
  }
  const pause = () => {
    audio.current?.pause()
    setPlaying(false)
  }
  const seek = (s: number) => {
    const to = Math.max(0, Math.min(duration, s))
    if (audio.current) audio.current.currentTime = to
    head.current = to
    setT(to)
  }
  const cycle = () => setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length])

  useImperativeHandle(ref, () => ({ play, pause, seek, speed: setRate, transcript: setReading }))

  const scrubTo = (e: PointerEvent) => {
    const r = wave.current!.getBoundingClientRect()
    seek(((e.clientX - r.left) / r.width) * duration)
  }

  const played = t / duration
  const spoken = words.findLastIndex((w) => w.at <= t + 0.05)
  return (
    <div className="w-[384px] rounded-[22px] bg-surface p-3 shadow-raised">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          whileTap={press}
          onPointerDown={tap}
          onClick={playing ? pause : play}
          className="ring-focus flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-surface"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={playing ? 'pause' : 'play'} className="flex" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring.snappy}>
              {playing ? <Pause size={15} /> : <Play size={15} className="translate-x-px" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* The waveform: a column of dots for each moment, inked once it's been played. */}
        <div
          ref={wave}
          role="slider"
          tabIndex={0}
          aria-label="Position"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(t)}
          aria-valuetext={`${time(t)} of ${time(duration)}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') seek(t + 2)
            else if (e.key === 'ArrowLeft') seek(t - 2)
            else return
            e.preventDefault()
          }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            scrubbing.current = true
            scrubTo(e)
          }}
          onPointerMove={(e) => scrubbing.current && scrubTo(e)}
          onPointerUp={() => (scrubbing.current = false)}
          onPointerCancel={() => (scrubbing.current = false)}
          className="ring-focus grid h-9 min-w-0 flex-1 cursor-pointer touch-none content-center items-center justify-between gap-y-[1.5px] rounded-[6px] outline-none"
          style={{ gridTemplateColumns: `repeat(${COLS}, 3px)`, gridTemplateRows: `repeat(${ROWS}, 3px)`, gridAutoFlow: 'column' }}
        >
          {peaks.flatMap((p, c) => {
            // How far from the middle row this moment reaches: 0 (a murmur) to 3 (the full column).
            const reach = p < 0.08 ? 0 : p < 0.35 ? 1 : p < 0.65 ? 2 : 3
            const done = (c + 0.5) / COLS <= played
            return Array.from({ length: ROWS }, (_, r) => {
              const lit = Math.abs(r - 3) <= reach
              return <span key={`${c}-${r}`} className="size-[3px] rounded-full bg-ink transition-opacity duration-150" style={{ opacity: lit ? (done ? 1 : 0.28) : 0.07 }} />
            })
          })}
        </div>

        <p className="tnum flex w-[74px] shrink-0 justify-end text-footnote">
          <RollingText text={time(t)} className="text-ink" />
          <span className="text-ink-3">&nbsp;/ {time(duration)}</span>
        </p>
      </div>

      <div className="mt-2 flex items-center gap-1 pl-[52px]">
        <motion.button type="button" whileTap={press} onPointerDown={tap} onClick={cycle} aria-label={`Speed ${rate}×`} className="ring-focus flex h-6 items-center rounded-full bg-surface-2 px-2 text-caption font-medium text-ink transition-colors hover:bg-surface-3">
          <RollingText text={`${rate}×`} />
        </motion.button>
        <button type="button" onClick={() => setReading((o) => !o)} aria-expanded={reading} className="ring-focus flex h-6 items-center gap-1 rounded-full px-2 text-caption font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
          Transcript
          <motion.span className="flex" animate={{ rotate: reading ? 180 : 0 }} transition={spring.snappy}>
            <ChevronDown size={12} />
          </motion.span>
        </button>
      </div>

      {/* The transcript follows the voice: what's been said in ink, what's coming in grey. */}
      <AnimatePresence initial={false}>
        {reading && (
          <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: spring.smooth, opacity: { duration: 0.2, ease: ease.out } }}>
            <p className="px-[52px] pb-1.5 pr-3 pt-2.5 text-callout leading-[22px]">
              {words.map((w, i) => (
                <span key={i} className={`transition-colors duration-200 ${i <= spoken ? 'text-ink' : 'text-ink-3'}`}>
                  {i > 0 && ' '}
                  {w.word}
                </span>
              ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
