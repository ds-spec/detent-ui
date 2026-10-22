'use client'

import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'
import { spring } from '@/lab/lib/motion'
import { Morph } from '@/lab/ui/Morph'
import { Glow } from '@/lab/ui/Intelligence'
import { RollingText } from '@/lab/ui/RollingText'

/* ───────────────────────────── Type ───────────────────────────── */

const SCALE = [
  { name: 'Display', cls: 'text-display', spec: '40 / 44 · Regular · −4%', sample: '$48,213' },
  { name: 'Large', cls: 'text-large', spec: '28 / 32 · Regular · −3.2%', sample: 'Ship the Q3 refund rules' },
  { name: 'Title', cls: 'text-title', spec: '20 / 26 · Medium · −2.2%', sample: 'Payment methods' },
  { name: 'Headline', cls: 'text-headline', spec: '15 / 20 · Medium · −1%', sample: 'Detent Pro is thinking about your question' },
  { name: 'Body', cls: 'text-body', spec: '15 / 23 · Regular · −1%', sample: 'Refunds for damaged items no longer need a return, and annual plans get 45 days.' },
  { name: 'Callout', cls: 'text-callout', spec: '14 / 20 · Regular', sample: 'Controls, menu items and anything you press.' },
  { name: 'Footnote', cls: 'text-footnote', spec: '13 / 18 · Regular', sample: 'Secondary lines under a title, and details.' },
  { name: 'Caption', cls: 'text-caption', spec: '12 / 16 · Regular', sample: 'Timestamps, counts and the smallest labels.' },
]

export function Type() {
  return (
    <div className="rounded-[28px] bg-card px-6 sm:px-8">
      {SCALE.map((t, i) => (
        <div key={t.name} className="grid items-baseline gap-x-8 gap-y-1 py-5 sm:grid-cols-[184px_minmax(0,1fr)]" style={{ boxShadow: i ? 'inset 0 1px 0 var(--line)' : undefined }}>
          <div>
            <p className="text-footnote font-medium text-ink">{t.name}</p>
            <p className="tnum text-caption text-ink-3">{t.spec}</p>
          </div>
          <p className={`${t.cls} min-w-0 truncate text-ink`}>{t.sample}</p>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────── Materials ───────────────────────────── */

function Tile({ name, line, children }: { name: string; line: string; children: ReactNode }) {
  return (
    <div>
      <div className="relative flex h-[220px] items-center justify-center overflow-hidden rounded-[28px] bg-card">{children}</div>
      <p className="mt-3 text-headline text-ink">{name}</p>
      <p className="mt-0.5 text-footnote text-ink-3">{line}</p>
    </div>
  )
}

export function Materials() {
  const [down, setDown] = useState(false)
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile name="Base" line="The page, and the cards that sit on it.">
        <span className="text-callout text-ink-3">The card is the base</span>
      </Tile>
      <Tile name="Raised" line="Components. A hairline, a tight shadow, and light on the top edge in dark.">
        <div className="flex h-24 w-44 items-center justify-center rounded-[22px] bg-surface text-callout font-medium text-ink shadow-float">Raised</div>
      </Tile>
      <Tile name="Floating" line="Menus and popovers. Glass: what's beneath stays faintly there.">
        {/* Something busy underneath, so the glass has something to show. */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-center gap-2 px-6 opacity-80">
          {['Ship the Q3 refund rules', 'Update the limits in refunds.ts', 'Run the test suite', 'Open a pull request'].map((l) => (
            <p key={l} className="text-body font-medium text-ink-2">
              {l}
            </p>
          ))}
        </div>
        <div className="glass relative flex h-24 w-48 flex-col justify-center rounded-[18px] bg-surface px-4 shadow-modal">
          <p className="text-headline text-ink">Floating</p>
          <p className="text-footnote text-ink-3">Over whatever is below</p>
        </div>
      </Tile>
      <Tile name="Pressed" line="Press it: surfaces sink under your finger, and click if sound is on.">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onPointerDown={() => {
            tap()
            setDown(true)
          }}
          onPointerUp={() => setDown(false)}
          onPointerLeave={() => setDown(false)}
          className="sink ring-focus flex h-14 items-center rounded-full bg-surface px-7 text-callout font-medium text-ink shadow-float"
        >
          {down ? 'Pressed' : 'Press and hold'}
        </motion.button>
      </Tile>
      <div className="sm:col-span-2 xl:col-span-4">
        <Intelligence />
      </div>
    </div>
  )
}

/** The fifth material: light that means the AI is alive. It breathes on while working and cools off when done. */
function Intelligence() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const t = window.setInterval(() => setOn((v) => !v), 3200)
    return () => clearInterval(t)
  }, [])
  return (
    <div>
      <div className="relative flex h-[220px] items-center justify-center overflow-hidden rounded-[28px] bg-card">
        <div className="relative w-[340px]">
          <Glow on={on} layer="halo" radius={28} style={{ height: 56, bottom: 'auto' }} />
          <div className="relative flex h-14 items-center gap-3 rounded-full bg-surface pl-5 pr-5 shadow-float">
            <span className="relative block h-5 min-w-0 flex-1 overflow-hidden text-headline">
              <AnimatePresence initial={false}>
                <motion.span key={on ? 'on' : 'off'} className={`absolute inset-0 truncate ${on ? 'ai-text' : 'text-ink'}`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
                  {on ? 'Reading the Q3 refund policy' : 'Read the Q3 refund policy'}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="tnum text-footnote text-ink-3">{on ? 'Working' : 'Done'}</span>
          </div>
          <Glow on={on} layer="ring" radius={28} style={{ height: 56, bottom: 'auto' }} />
        </div>
      </div>
      <p className="mt-3 text-headline text-ink">Intelligence</p>
      <p className="mt-0.5 max-w-[560px] text-footnote text-ink-3">The one material with colour of its own, worn only while AI is thinking, listening, streaming or working. Light runs round the edge, a halo breathes behind, text flows through the spectrum, and when the work is done it cools back to ink. It speaks up once: each surface wears the colour the first time it comes alive, then does the same work quietly in ink, and is loud again only after two minutes of rest.</p>
    </div>
  )
}

/* ───────────────────────────── Motion ───────────────────────────── */

export function Motion() {
  const [on, setOn] = useState(false)
  const [n, setN] = useState(1280)
  const [saved, setSaved] = useState(false)
  const plate = useId()
  useEffect(() => {
    const t = window.setInterval(() => {
      setOn((v) => !v)
      setN((v) => (v > 9000 ? 1280 : v + Math.round(400 + Math.random() * 1800)))
      setSaved((v) => !v)
    }, 1800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Tile name="Move" line="The plate travels to its new place; nothing fades out and back.">
        <div className="flex h-12 items-center rounded-full bg-surface-2 p-1">
          {['Unified', 'Split'].map((l, i) => (
            <span key={l} className={`relative flex h-10 w-[96px] items-center justify-center text-callout font-medium ${on === Boolean(i) ? 'text-ink' : 'text-ink-3'}`}>
              {on === Boolean(i) && <motion.span layoutId={plate} className="absolute inset-0 rounded-full bg-plate shadow-raised" transition={spring.move} />}
              <span className="relative">{l}</span>
            </span>
          ))}
        </div>
      </Tile>
      <Tile name="Roll" line="Numbers and labels roll through a fixed slot, digit by digit.">
        <p className="text-display text-ink">
          <span className="flex">
            $<RollingText text={n.toLocaleString('en-US')} />
          </span>
        </p>
      </Tile>
      <Tile name="Reshape" line="A control springs to its new measured size; the words never squash.">
        <Morph
          view={saved ? 'saved' : 'save'}
          radius={24}
          anchor="center"
          className={`transition-colors duration-300 ${saved ? 'bg-surface text-ok shadow-float' : 'bg-ink text-surface'}`}
          views={{
            save: <span className="flex h-12 items-center px-6 text-callout font-medium">Save changes</span>,
            saved: (
              <span className="flex h-12 items-center gap-2 px-5 text-callout font-medium">
                <Check size={16} strokeWidth={2.6} />
                Saved
              </span>
            ),
          }}
        />
      </Tile>
    </div>
  )
}

/* ───────────────────────────── Shape ───────────────────────────── */

export function Shape() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Tile name="Concentric radii" line="An inner radius is the outer one minus the padding between: 28 − 8 = 20, 20 − 4 = 16, 16 − 4 = 12.">
        <div className="rounded-[28px] bg-surface p-2 shadow-float">
          <div className="rounded-[20px] bg-surface-2 p-1">
            <div className="rounded-[16px] bg-plate p-1 shadow-raised">
              <div className="flex h-12 w-40 items-center justify-center rounded-[12px] bg-ink text-callout font-medium text-surface">12</div>
            </div>
          </div>
        </div>
      </Tile>
      <Tile name="4pt grid, 32pt targets" line="Every size and gap is a multiple of four; nothing you press is smaller than 32 points.">
        <div className="relative">
          <div aria-hidden className="absolute -inset-6 rounded-[16px]" style={{ backgroundImage: 'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
          <div className="relative flex items-center gap-2">
            {[32, 36, 40, 44].map((s) => (
              <span key={s} className="tnum flex items-center justify-center rounded-full bg-surface text-caption font-medium text-ink-2 shadow-raised" style={{ width: s, height: s }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </Tile>
    </div>
  )
}

