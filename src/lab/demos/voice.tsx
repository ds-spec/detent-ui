'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimationFrame, useMotionValue } from 'motion/react'
import { VoiceInput } from '../components/voice/VoiceInput'
import type { VoiceHandle, VoiceState } from '../components/voice/VoiceInput'
import { useBench } from './bench'
import { hover, pressed } from '@/lab/lib/hand'

const TAKE = ['Draft a note for the support team', 'about the new forty-five day window,', 'and keep it short.']
const THROWN = ['Actually, make it', 'a little more']

const join = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(' ')

type Recognition = {
  continuous: boolean
  interimResults: boolean
  onresult: (e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void
  start(): void
  stop(): void
}

export function VoiceDemo() {
  const b = useBench()
  const level = useMotionValue(0)
  const [state, setState] = useState<VoiceState>('idle')
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const voice = useRef<VoiceHandle>(null)
  const now = useRef({ state, text, interim })
  now.current = { state, text, interim }
  const before = useRef('')
  const speaking = useRef(false)
  const real = useRef<{ stop(): void } | null>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useAnimationFrame((t) => {
    if (real.current) return
    if (now.current.state !== 'listening') return level.set(0)
    level.set(speaking.current ? 0.28 + 0.6 * Math.abs(Math.sin(t / 85)) * (0.55 + 0.45 * Math.random()) : 0.02 + Math.random() * 0.03)
  })

  const listen = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      let raf = 0
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += ((v - 128) / 128) ** 2
        level.set(Math.min(1, Math.sqrt(sum / buf.length) * 6))
        raf = requestAnimationFrame(tick)
      }
      tick()
      const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
      const rec = SR ? new SR() : null
      if (rec) {
        rec.continuous = true
        rec.interimResults = true
        rec.onresult = (e) => {
          let fin = ''
          let mid = ''
          for (let i = 0; i < e.results.length; i++) {
            const r = e.results[i]
            if (r.isFinal) fin += r[0].transcript
            else mid += r[0].transcript
          }
          setText(join(before.current, fin))
          setInterim(mid.trim())
        }
        rec.start()
      }
      real.current = {
        stop() {
          cancelAnimationFrame(raf)
          stream.getTracks().forEach((t) => t.stop())
          ctx.close()
          rec?.stop()
          level.set(0)
        },
      }
    } catch {
    }
  }, [level])

  const start = useCallback(() => {
    before.current = now.current.text
    setInterim('')
    setState('listening')
    if (touched.current) listen()
  }, [listen])
  const finish = useCallback(() => {
    real.current?.stop()
    real.current = null
    setText((t) => join(t, now.current.interim))
    setInterim('')
    setState('idle')
  }, [])
  const discard = useCallback(() => {
    real.current?.stop()
    real.current = null
    setText(before.current)
    setInterim('')
    setState('idle')
  }, [])

  useEffect(() => {
    let live = true
    const wait = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await wait(100)
    }
    const say = async (phrase: string) => {
      speaking.current = true
      let heard = ''
      for (const w of phrase.split(' ')) {
        heard = join(heard, w)
        setInterim(heard)
        await wait(150 + Math.random() * 120)
      }
      setText((t) => join(t, heard))
      setInterim('')
      speaking.current = false
    }
    const play = async () => {
      for (;;) {
        await beat(1500)
        start()
        await wait(700)
        for (const p of TAKE) {
          await say(p)
          await wait(380)
        }
        while (now.current.state === 'listening') await wait(100)
        await beat(1500)
        voice.current?.send()
        await beat(1800)
        start()
        await wait(600)
        speaking.current = true
        let heard = ''
        for (const w of THROWN.join(' ').split(' ')) {
          heard = join(heard, w)
          setInterim(heard)
          await wait(170 + Math.random() * 100)
        }
        speaking.current = false
        await wait(700)
        discard()
      }
    }
    play().catch(() => {
      speaking.current = false
    })
    return () => {
      live = false
    }
  }, [start, discard])

  return (
    <div
      {...hover(held)}
      {...pressed(() => (touched.current = true))}
      onKeyDownCapture={() => (touched.current = true)}
    >
      <VoiceInput ref={voice} state={state} level={level} text={text} interim={interim} onTextChange={b.on('onTextChange', setText)} onStart={b.on('onStart', start)} onStop={b.on('onStop', finish)} onCancel={b.on('onCancel', discard)} onSend={b.on('onSend', () => setText(''))} placeholder={b.get('placeholder', 'Message Copilot, or tap the mic')} />
    </div>
  )
}
