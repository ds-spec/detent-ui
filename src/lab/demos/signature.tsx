'use client'

import { useRef, useState } from 'react'
import { WindSong } from 'next/font/google'
import { Signature } from '../components/signature/Signature'
import type { SignatureHandle } from '../components/signature/Signature'
import { useBench } from './bench'
import { useLoop } from './loop'

const script = WindSong({ weight: '400', subsets: ['latin'], display: 'swap' })

const NAMES = ['Maya Chen', 'Jonas Weber', 'Aiko Tanaka']

/** Someone types their name and the pencil signs it, a letter at a time; Enter adds the flourish. */
export function SignatureDemo() {
  const b = useBench()
  const [name, setName] = useState('')
  const sig = useRef<SignatureHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (let round = 0; ; round++) {
      const n = NAMES[round % NAMES.length]
      await beat(900)
      // People don't type at an even pace: capitals and the space take a beat longer.
      for (let i = 1; i <= n.length; i++) {
        setName(n.slice(0, i))
        const c = n[i - 1]
        await beat(c === ' ' ? 260 : /[A-Z]/.test(c) ? 230 : 120 + ((i * 53) % 90))
      }
      await beat(700)
      await sig.current?.sign()
      await beat(2600)
      sig.current?.clear()
    }
  })
  return (
    <div {...handlers}>
      <Signature ref={sig} value={name} onChange={setName} onSign={b.on('onSign')} fontFamily={script.style.fontFamily} />
    </div>
  )
}
