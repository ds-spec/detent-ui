'use client'

import { useEffect, useRef } from 'react'
import { TagInput } from '../components/tags/TagInput'
import { Orb } from '../ui/Orb'
import type { TagsHandle } from '../components/tags/TagInput'
import { UndoList } from '../components/UndoList'
import type { Entry, UndoHandle } from '../components/UndoList'
import { FeedbackPulse } from '../components/FeedbackPulse'
import { Upload } from '../components/upload/Upload'
import type { UploadHandle } from '../components/upload/Upload'
import type { PulseHandle } from '../components/FeedbackPulse'
import { useBench } from './bench'

/* ───────────────────────────── Tag input ───────────────────────────── */

const TOPICS = ['Design systems', 'Motion', 'Typography', 'Accessibility', 'React', 'Prototyping', 'Colour', 'Interaction design', 'Research', 'Illustration', 'Branding', 'Animation']

/** Tags a post before it's published: adds a suggested topic, tries a duplicate (it nudges the one you have), removes with two Backspaces, pastes a list, then creates a topic of its own. Hovering pauses; touching hands it over. */
export function TagsDemo() {
  const b = useBench()
  const tags = useRef<TagsHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const write = async (text: string) => {
      for (let i = 1; i <= text.length; i++) {
        tags.current?.type(text.slice(0, i))
        await beat(90 + Math.random() * 70)
      }
    }
    const t = () => tags.current
    const play = async () => {
      for (;;) {
        await beat(1500)
        await write('acc')
        await beat(700)
        t()?.enter()
        await beat(1100)
        await write('motion')
        await beat(400)
        t()?.enter()
        await beat(1400)
        t()?.backspace()
        await beat(800)
        t()?.backspace()
        await beat(1100)
        t()?.paste('Colour, Layout, Sound')
        await beat(1800)
        await write('Haptics')
        await beat(900)
        t()?.enter()
        await beat(2600)
        t()?.reset()
        await beat(500)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <div
      className="w-[460px] max-w-full rounded-[24px] bg-surface px-6 pb-5 pt-6 shadow-float"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onPointerDownCapture={() => (touched.current = true)}
      onKeyDownCapture={() => (touched.current = true)}
    >
      <p className="text-caption text-ink-3">Publish to the journal</p>
      <p className="mt-1 text-title text-ink">Designing for the half-second</p>
      <p className="mt-1 text-footnote text-ink-3">Draft · 6 min read</p>
      {/* Held at two rows of tags, so the card never grows as they land. */}
      <div className="mt-6 h-[146px]">
        <TagInput ref={tags} width={412} initial={['Motion', 'Typography']} suggestions={TOPICS} label={b.get('label', 'Topics')} max={b.get('max', 8)} placeholder={b.get('placeholder', 'Add a topic…')} onChange={b.on('onChange')} />
      </div>
      <div className="flex items-center justify-between pt-4 shadow-[inset_0_1px_0_var(--line)]">
        <span className="flex items-center gap-2 text-footnote text-ink-3">
          <Orb seed="Maya Chen" hue={150} size={20} />
          Maya Chen
        </span>
        <span className="flex h-9 items-center rounded-full bg-ink px-4 text-footnote font-medium text-surface">Publish</span>
      </div>
    </div>
  )
}

/* ───────────────────────────── Undo delete ───────────────────────────── */

const FILES: Entry[] = [
  { id: 'f1', name: 'Q3 board update.pdf', meta: '1.1 MB · Edited 2h ago' },
  { id: 'f2', name: 'hero-shot.png', meta: '2.4 MB · Edited yesterday', preview: 'linear-gradient(180deg, #c7d3e6 0%, #e9ddcc 54%, #8e9c7c 55%, #6a7a5c 100%)' },
  { id: 'f3', name: 'launch-film.mp4', meta: '18.2 MB · Edited Monday' },
  { id: 'f4', name: 'brand-guidelines.fig', meta: '6.2 MB · Edited Oct 12' },
  { id: 'f5', name: 'release-notes.md', meta: '4 KB · Edited Oct 9' },
]

/** Deletes two files in a burst and takes them back, then lets one go for good. Hovering pauses it; touching hands it over. */
export function UndoDemo() {
  const b = useBench()
  const list = useRef<UndoHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const l = () => list.current
    const play = async () => {
      for (;;) {
        await beat(1600)
        l()?.point('f2')
        await beat(700)
        l()?.remove('f2')
        await beat(450)
        l()?.point('f4')
        await beat(500)
        l()?.remove('f4')
        await beat(2300)
        l()?.undo()
        await beat(2000)
        l()?.point('f5')
        await beat(700)
        l()?.remove('f5')
        await beat(7400)
        l()?.reset()
        await beat(400)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <UndoList ref={list} initial={FILES} title={b.get('title', 'Recent files')} seconds={b.get('seconds', 5)} onDelete={b.on('onDelete')} onUndo={b.on('onUndo')} />
    </div>
  )
}

/* ───────────────────────────── Feedback ───────────────────────────── */

/** Rates the page it sits under: the dots fill as it points, a 4 opens the card, two reasons, Send. Hovering pauses; touching hands it over. */
export function FeedbackDemo() {
  const b = useBench()
  const pulse = useRef<PulseHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const p = () => pulse.current
    const play = async () => {
      for (;;) {
        await beat(1600)
        for (const n of [1, 2, 3, 4, 5, 4]) {
          p()?.hover(n)
          await beat(n === 5 ? 520 : 300)
        }
        await beat(400)
        p()?.rate(4)
        await beat(1300)
        p()?.toggle('Clear')
        await beat(600)
        p()?.toggle('Saved me time')
        await beat(1000)
        p()?.send()
        await beat(3600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="@container relative h-[420px] w-[420px] max-w-full max-sm:overflow-x-clip" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      {/* The end of a docs page, so the widget has something to be about. */}
      <div className="absolute inset-x-0 top-6 px-1" style={{ maskImage: 'linear-gradient(to bottom, #000 55%, transparent 92%)' }}>
        <p className="text-footnote text-ink-3">Docs / Billing</p>
        <p className="mt-1.5 text-title text-ink">How refunds work</p>
        <p className="mt-3 text-callout leading-[23px] text-ink-2">
          Refunds go back to the original payment method within five to ten business days. Items damaged on arrival are refunded in full without a return, up to $150.
        </p>
        <p className="mt-3 text-callout leading-[23px] text-ink-2">Annual plans can be refunded within 45 days. Anything above $500 needs a second approval from finance before it’s sent.</p>
      </div>
      {/* Anchored to the bottom so the card grows upward over the page, like a real docs footer. */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <FeedbackPulse ref={pulse} question={b.get('question', 'Was this helpful?')} onSend={b.on('onSend')} />
      </div>
    </div>
  )
}

/* ───────────────────────────── Upload ───────────────────────────── */

/** Drags three files over the folder (its flap tips open), drops them, lets them upload, and starts again. Hovering pauses; touching hands it over. */
export function UploadDemo() {
  const b = useBench()
  const up = useRef<UploadHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (;;) {
        await beat(1600)
        up.current?.hover(3)
        await beat(1300)
        up.current?.drop()
        await beat(9000)
        up.current?.clear()
        await beat(600)
      }
    }
    play().catch(() => up.current?.hover(0))
    return () => {
      live = false
    }
  }, [])
  return (
    <div onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <Upload ref={up} accept={b.get('accept', 'PNG, JPG, PDF or MP4')} onFiles={b.on('onFiles')} />
    </div>
  )
}
