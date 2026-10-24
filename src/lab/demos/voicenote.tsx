'use client'

import { useRef } from 'react'
import { VoiceNote } from '../components/voicenote/VoiceNote'
import type { SpokenWord, VoiceNoteHandle } from '../components/voicenote/VoiceNote'
import { DetentMark } from '../ui/DetentMark'
import { useLoop } from './loop'

const SAID = 'Your refund for order 4821 went out this morning. It’s on its way to the Visa ending 4021, and usually lands in three to five days. I’ve also flagged the carrier: that’s the third damaged box this month.'

/** When each word is said: an even pace, a longer breath after a comma, longer still after a full stop. */
const WORDS: SpokenWord[] = (() => {
  let at = 0.25
  return SAID.split(' ').map((word) => {
    const w = { word, at }
    at += 0.24 + word.length * 0.028 + (/[.:]$/.test(word) ? 0.55 : /,$/.test(word) ? 0.28 : 0)
    return w
  })
})()
const DURATION = Math.ceil(WORDS[WORDS.length - 1].at + 0.8)

/** An agent answers by voice: the note plays, speeds up, skips back to catch a number, and plays out. */
export function VoiceNoteDemo() {
  const note = useRef<VoiceNoteHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      note.current?.seek(0)
      note.current?.speed(1)
      await beat(1200)
      note.current?.play()
      await beat(3800)
      note.current?.speed(1.5)
      await beat(2600)
      // Back a few seconds, to hear the card number again.
      note.current?.seek(3.4)
      await beat(5200)
      note.current?.pause()
      await beat(2200)
    }
  })
  return (
    <div className="flex w-[430px] flex-col gap-3" {...handlers}>
      <p className="ml-auto w-fit max-w-[280px] rounded-[20px] rounded-br-[6px] bg-[light-dark(var(--ink),var(--surface-3))] px-3.5 py-2.5 text-body leading-5 text-[light-dark(var(--surface),var(--ink))]">Did the refund go through?</p>
      <div className="flex items-end gap-2">
        <span className="mb-1 flex">
          <DetentMark size={28} round />
        </span>
        <VoiceNote ref={note} words={WORDS} duration={DURATION} />
      </div>
    </div>
  )
}
