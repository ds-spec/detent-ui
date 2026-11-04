'use client'

import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Expand, Refresh } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'
import { ModesLine, Tool } from '../exhibit/Exhibit'
import { BTN } from '../shell/side'
import { Window } from './Studio'
import type { Chrome } from './Studio'

export type Device = 'desktop' | 'phone'

/** The two devices a block is tried on: the width it's laid out at, the height of the screen, and the frame round it. */
const DEVICES = {
  phone: { w: 390, h: 844, bezel: 10, radius: 48 },
} as const

const ICONS: Record<Device, ReactNode> = {
  desktop: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </svg>
  ),
  phone: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  ),
}
const NAMES: Record<Device, string> = { desktop: 'Desktop', phone: 'Phone' }

/**
 * The stage a block or a template runs on, the same as a component's: Preview or Code on the left
 * of its edge, and on the right the device to try it on, then replay and full screen. Light or dark
 * follows the site's own switch, in the sidebar. On a desktop it runs in its window across the stage; on a tablet or a phone it's laid out
 * at that device's real size inside a plain frame, and the stage grows to hold it.
 */
export function DeviceStage({ title, chrome, mode, setMode, pro, theme, onReplay, onFull, run, view, code, tools }: { title: string; chrome?: Chrome; mode: 'preview' | 'code'; setMode: (m: 'preview' | 'code') => void; pro: boolean; theme: 'light' | 'dark'; onReplay: () => void; onFull: () => void; run: number; view: ReactNode; code: ReactNode; /** More tools, at the end of the bar. */ tools?: ReactNode }) {
  const [device, setDevice] = useState<Device>('desktop')
  // A device is shown at its real size: the stage grows to hold it and the page scrolls past it, the way you'd hold a phone up to look at it.
  const d = device === 'desktop' ? null : DEVICES[device]
  return (
    <div data-desk className="relative mt-5 flex flex-col rounded-[20px] bg-[var(--mount)] transition-[height] duration-300 max-sm:-mx-3" style={{ height: d ? d.h + d.bezel * 2 + 44 + 72 : 'clamp(680px, calc(100dvh - 140px), 1000px)' }}>
      <div className="flex h-[44px] shrink-0 items-center justify-between px-[5px] pt-[5px]">
        <ModesLine mode={mode} setMode={setMode} pro={pro} />
        <span className="flex items-center gap-1.5">
          <Devices device={device} setDevice={setDevice} />
          {/* The device switch is for a laptop's screen; on a phone there's nothing to set it apart from. */}
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-line-strong sm:block" />
          <Tool small label="Replay" onClick={onReplay}>
            <motion.span key={run} className="flex" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <Refresh size={15} />
            </motion.span>
          </Tool>
          <Tool small className="hidden sm:block" label="Full screen" keys="Esc" onClick={onFull}>
            <Expand size={15} />
          </Tool>
          {tools}
        </span>
      </div>
      <section data-theme={theme} aria-label={`${title}, live`} className="relative m-[5px] mt-0 min-h-0 flex-1 overflow-hidden rounded-[15px] bg-bg text-ink shadow-[0_0_0_.5px_var(--line)]">
        <Screen device={device} title={title} chrome={chrome}>
          <div key={run} className={`h-full transition-opacity duration-300 ${mode === 'code' ? 'pointer-events-none opacity-0' : ''}`}>
            {view}
          </div>
        </Screen>
        <AnimatePresence>
          {mode === 'code' && (
            <motion.div key="code" className="absolute inset-0 z-[5]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }} transition={{ duration: 0.3 }}>
              {code}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

/** Desktop or phone: the same sunk track and raised plate as Preview / Code, icons only. */
function Devices({ device, setDevice }: { device: Device; setDevice: (d: Device) => void }) {
  const id = useId()
  return (
    <span role="radiogroup" aria-label="Device" className={`hidden h-[34px] items-center rounded-[11px] p-[3px] sm:flex ${BTN.track}`}>
      {(Object.keys(NAMES) as Device[]).map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={device === d}
          aria-label={NAMES[d]}
          title={NAMES[d]}
          onClick={() => {
            if (d !== device) tap()
            setDevice(d)
          }}
          className={`ring-focus relative grid h-full w-9 place-items-center rounded-[8px] transition-colors duration-150 ${device === d ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {device === d && <motion.span layoutId={id} className={`absolute inset-0 rounded-[8px] ${BTN.plate}`} transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
          <span className="relative">{ICONS[d]}</span>
        </button>
      ))}
    </span>
  )
}

/**
 * What the block runs in. On a desktop, its window across the stage. On a tablet or a phone, the
 * block is laid out at the device's own width and height, inside a plain dark frame with a hairline,
 * shown at its real size, so what you see is what that screen would show. A stage too narrow for
 * it scales it down to fit across.
 */
function Screen({ device, title, chrome, children }: { device: Device; title: string; chrome?: Chrome; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [room, setRoom] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const read = () => setRoom({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const d = device === 'desktop' ? null : DEVICES[device]
  const outer = d ? { w: d.w + d.bezel * 2, h: d.h + d.bezel * 2 } : null
  // Only the width can make a device smaller: the stage is as tall as the device.
  const scale = outer && room.w ? Math.min(1, (room.w - 48) / outer.w) : 1
  return (
    <div ref={box} className={`absolute inset-0 flex items-center justify-center ${d ? 'p-4 sm:p-6' : 'p-3 sm:p-4'}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {d && outer ? (
          <motion.div key={device} className="shrink-0" style={{ width: outer.w * scale, height: outer.h * scale }} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}>
            <div
              className="origin-top-left bg-[#0e0e10]"
              style={{ width: outer.w, height: outer.h, padding: d.bezel, borderRadius: d.radius, transform: `scale(${scale})`, boxShadow: '0 0 0 1px var(--line-strong), inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 24px 60px -24px rgb(0 0 0 / 0.35)' }}
            >
              <div className="relative h-full w-full overflow-hidden bg-surface" style={{ borderRadius: d.radius - d.bezel }}>
                {children}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="desktop" className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <Window title={title} chrome={chrome}>
              {children}
            </Window>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
