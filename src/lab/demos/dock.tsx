'use client'

import { useRef, useState } from 'react'
import { MorphingDock } from '../components/dock/MorphingDock'
import type { DockHandle, DockTool } from '../components/dock/MorphingDock'
import { ArrowUp, Bubble, Check, Copy, Search, Send, Sliders } from '@/lab/icons'
import { Orb } from '@/lab/ui/Orb'
import { Switch } from '@/lab/ui/Switch'
import { useLoop } from './loop'
import { useBench } from './bench'

function Find() {
  const hits = [
    ['Light on the long dune', 'Plate 3'],
    ['Lines the wind leaves', 'Essay'],
    ['Light meter readings', 'Notes'],
    ['Last light, Erg Chebbi', 'Plate 7'],
  ]
  return (
    <div className="p-2">
      <div className="flex h-11 items-center gap-2.5 rounded-[14px] bg-surface-2 px-3.5 text-[14px] text-ink">
        <Search size={15} className="text-ink-3" />
        lig<span className="-ml-2 h-4 w-px animate-pulse bg-ink" />
      </div>
      <ul className="mt-1.5">
        {hits.map(([t, d], i) => (
          <li key={t} className={`flex h-11 items-center justify-between rounded-[12px] px-3 text-[13px] ${i === 0 ? 'bg-surface-2' : ''}`}>
            <span className="text-ink">{t}</span>
            <span className="text-[12px] text-ink-3">{d}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Share() {
  const [copied, setCopied] = useState(false)
  return (
    <div className="p-4">
      <p className="text-[13px] font-medium text-ink">Share “The colour of quiet”</p>
      <ul className="mt-3 space-y-2.5">
        {[
          ['Maya Chen', 'Owner'],
          ['Leo Marques', 'Can edit'],
          ['Inès Laurent', 'Can view'],
        ].map(([n, r]) => (
          <li key={n} className="flex items-center gap-3 text-[13px]">
            <Orb seed={n} size={26} />
            <span className="flex-1 text-ink">{n}</span>
            <span className="text-ink-3">{r}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        }}
        className="ring-focus mt-4 flex h-10 w-full items-center justify-between rounded-[12px] bg-surface-2 pl-3.5 pr-3 text-[13px]"
      >
        <span className="text-ink-3">folio.app/the-colour-of-quiet</span>
        <span className="flex items-center gap-1.5 text-ink">
          {copied ? <Check size={13} strokeWidth={2.6} /> : <Copy size={13} style={{ ['--icon-cutout' as string]: 'var(--surface-2)' }} />}
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
    </div>
  )
}

function Notes() {
  return (
    <div className="p-4">
      <p className="text-[13px] font-medium text-ink">Notes</p>
      <ul className="mt-3 space-y-3.5">
        {[
          ['Leo Marques', '2h', 'Plate 3 is the one. Could we print it larger and let the margin breathe?'],
          ['Inès Laurent', '40m', 'The grain in the shadows is lovely. Keep it, don’t clean it up.'],
        ].map(([n, t, c]) => (
          <li key={n} className="flex gap-3">
            <Orb seed={n} size={26} />
            <span className="min-w-0 text-[13px] leading-[1.5]">
              <span className="text-ink">{n}</span> <span className="text-ink-3">{t}</span>
              <span className="mt-0.5 block text-ink-2">{c}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex h-10 items-center rounded-[12px] bg-surface-2 pl-3.5 pr-1 text-[13px] text-ink-3">
        <span className="flex-1">Add a note…</span>
        <span className="grid size-8 place-items-center rounded-[9px] bg-ink text-surface">
          <ArrowUp size={14} />
        </span>
      </div>
    </div>
  )
}

function View() {
  const [v, setV] = useState({ captions: true, dark: false, exif: false })
  const rows: [keyof typeof v, string, string][] = [
    ['captions', 'Captions', 'A line under every plate'],
    ['dark', 'Read in the dark', 'Black pages, the way prints are shown'],
    ['exif', 'Camera details', 'Lens, aperture and time beside each plate'],
  ]
  return (
    <div className="p-4">
      <p className="text-[13px] font-medium text-ink">Reading</p>
      <ul className="mt-2">
        {rows.map(([k, t, d]) => (
          <li key={k} className="flex h-[50px] items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-ink">{t}</span>
              <span className="block truncate text-[12px] text-ink-3">{d}</span>
            </span>
            <Switch checked={v[k]} onChange={(x) => setV({ ...v, [k]: x })} label={t} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DockDemo() {
  const b = useBench()
  const dock = useRef<DockHandle>(null)
  const [unread, setUnread] = useState(2)
  const tools: DockTool[] = [
    { id: 'search', label: 'Search', icon: <Search size={17} />, panel: <Find />, height: 244, shortcut: '/' },
    { id: 'share', label: 'Share', icon: <Send size={16} />, panel: <Share />, height: 218, shortcut: 's' },
    { id: 'notes', label: 'Notes', icon: <Bubble size={17} />, panel: <Notes />, height: 248, shortcut: 'n', badge: unread },
    { id: 'view', label: 'Reading', icon: <Sliders size={16} />, panel: <View />, height: 200, shortcut: 'r' },
  ]
  const handlers = useLoop(async (beat) => {
    for (;;) {
      setUnread(2)
      await beat(1400)
      for (const id of ['search', 'share', 'notes', 'view']) {
        dock.current?.open(id)
        if (id === 'notes') setUnread(0)
        await beat(2200)
      }
      dock.current?.open(null)
      await beat(1600)
    }
  })
  return (
    <div className="h-[600px] w-[760px] max-w-full overflow-hidden rounded-[40px] bg-[color-mix(in_oklch,var(--ink)_3%,var(--surface))]" {...handlers}>
      <MorphingDock ref={dock} tools={tools} recede={b.get('recede', true)} onChange={b.on('onChange')}>
        <div className="mx-auto w-[480px] max-w-full pt-12">
          <div className="h-[230px] overflow-hidden rounded-[6px]">
            <img src="/media/search/dunes.webp" alt="" className="size-full object-cover" />
          </div>
          <p className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.14em] text-ink-3">
            <span>Plate 3 · Erg Chebbi, Morocco</span>
            <span>Issue 07</span>
          </p>
          <h2 className="mt-8 font-serif text-[34px] font-normal leading-[1.1] tracking-[-0.02em] text-ink">The colour of quiet</h2>
          <p className="mt-4 text-[14px] leading-[1.7] text-ink-2">An hour before sunrise the dunes have no colour at all. Then the first light catches one ridge, and the whole sea of sand turns slowly from grey to honey, one slope at a time.</p>
        </div>
      </MorphingDock>
    </div>
  )
}
