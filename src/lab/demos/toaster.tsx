'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { createToaster } from '../components/toast/Toaster'
import type { ToastPosition } from '../components/toast/Toaster'
import { LayerHost } from '../lib/layer'
import { spring } from '../lib/motion'
import { Kbd } from '../ui/Kbd'

// Its own toaster, so the page's toasts and the demo's never mix.
const { toast, Toaster } = createToaster()

const wait = <T,>(ms: number, v: T, fail = false) => new Promise<T>((r, x) => setTimeout(() => (fail ? x(new Error('no')) : r(v)), ms))
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** An upload that moves in uneven steps, the way real ones do, then lands. */
async function upload() {
  const id = toast.loading('Uploading hero.mp4', { description: '24.6 MB', progress: 0 })
  for (const p of [0.08, 0.21, 0.34, 0.38, 0.55, 0.71, 0.86, 0.94, 1]) {
    await pause(260)
    toast.update(id, { progress: p })
  }
  toast.update(id, { kind: 'success', title: 'Uploaded hero.mp4' })
}

const TRIGGERS: { label: string; run: () => unknown }[] = [
  { label: 'Success', run: () => toast.success('Invite sent', { description: 'maya@acme.com can join now' }) },
  { label: 'Error', run: () => toast.error('Couldn’t reach the server', { description: 'We’ll keep trying in the background.' }) },
  { label: 'Warning', run: () => toast.warning('90% of this month’s allowance used') },
  { label: 'Info', run: () => toast.info('A new version is ready', { action: { label: 'Reload', onClick: () => {} } }) },
  { label: 'Promise', run: () => toast.promise(wait(1600, 1), { loading: 'Saving the draft…', success: 'Draft saved', error: 'Couldn’t save' }) },
  { label: 'Upload', run: upload },
  { label: 'Message', run: () => toast.message('Maya Chen', { from: { name: 'Maya Chen' }, description: 'Can you look at the pricing copy before 3?', replies: ['On it', 'After lunch'] }) },
  { label: 'Undo', run: () => toast('Archived 3 threads', { undo: () => toast('Back in your inbox') }) },
]

const SPOTS: ToastPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']

/**
 * A save that settles, an upload, a message with replies, a warning, the same toast three times
 * folding into one, the stack fanned out, Undo counting down, a deploy that fails, and the whole
 * stack moving to the top and back. Hovering pauses; touching hands it over.
 */
export function ToasterDemo() {
  const touched = useRef(false)
  const held = useRef(false)
  const [position, setPosition] = useState<ToastPosition>('bottom-right')
  const [fan, setFan] = useState(false)
  const plate = useId()
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (;;) {
        await beat(900)
        toast.promise(wait(1500, 1), { loading: 'Saving the draft…', success: 'Draft saved', error: 'Couldn’t save' })
        await beat(1800)
        await upload()
        await beat(1100)
        toast.message('Maya Chen', { from: { name: 'Maya Chen' }, description: 'Can you look at the pricing copy before 3?', replies: ['On it', 'After lunch'] })
        await beat(2200)
        toast.warning('90% of this month’s allowance used', { description: 'Haiku is past its share since batch jobs moved to it.' })
        await beat(1500)
        for (let k = 0; k < 3; k++) {
          toast.success('Link copied')
          await tick(520)
        }
        await beat(900)
        setFan(true)
        await beat(2400)
        setFan(false)
        await beat(700)
        toast('Archived 3 threads', { undo: () => toast('Back in your inbox') })
        await beat(1800)
        toast.promise(wait(1300, 1, true), { loading: 'Deploying to production…', success: 'Live', error: 'Deploy failed: 2 build errors' })
        await beat(2600)
        setPosition('top-center')
        await beat(2200)
        setPosition('bottom-right')
        await beat(1400)
        toast.dismiss()
        await beat(900)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
      setFan(false)
    }
  }, [])

  return (
    <div className="w-[720px] max-w-full" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={(e) => !e.altKey && (touched.current = true)}>
      <div className="flex flex-wrap justify-center gap-1.5">
        {TRIGGERS.map((t) => (
          <button key={t.label} type="button" onClick={t.run} className="ring-focus h-8 rounded-full bg-surface px-3.5 text-footnote font-medium text-ink shadow-raised transition-shadow hover:shadow-[var(--elev-raised-hover)]">
            {t.label}
          </button>
        ))}
      </div>
      <LayerHost className="mt-4 h-[440px] rounded-card bg-surface shadow-raised ring-1 ring-[var(--line)]">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          {/* Where the toasts go: a small screen with six places to put them. */}
          <div role="radiogroup" aria-label="Position" className="relative grid h-[104px] w-[168px] grid-cols-3 grid-rows-2 rounded-[14px] bg-surface-2 p-2 ring-1 ring-[var(--line)]">
            {SPOTS.map((s) => {
              const [v, h] = s.split('-')
              return (
                <button key={s} type="button" role="radio" aria-checked={position === s} aria-label={s.replace('-', ' ')} onClick={() => setPosition(s)} className={`ring-focus group flex rounded-[8px] p-1 ${v === 'top' ? 'items-start' : 'items-end'} ${h === 'left' ? 'justify-start' : h === 'right' ? 'justify-end' : 'justify-center'}`}>
                  {position === s ? (
                    <motion.span layoutId={plate} transition={spring.move} className="h-3 w-9 rounded-[4px] bg-ink shadow-raised" />
                  ) : (
                    <span className="h-3 w-9 rounded-[4px] bg-[color-mix(in_oklch,var(--ink)_8%,transparent)] transition-colors group-hover:bg-[color-mix(in_oklch,var(--ink)_16%,transparent)]" />
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-footnote capitalize text-ink-2">{position.replace('-', ' ')}</p>
          <p className="flex items-center gap-1.5 text-caption text-ink-3">
            <Kbd>⌥</Kbd>
            <Kbd>T</Kbd>
            <span className="mr-2">to reach them</span>
            <Kbd>Esc</Kbd>
            <span>to dismiss</span>
          </p>
        </div>
        <Toaster position={position} expand={fan} />
      </LayerHost>
    </div>
  )
}
