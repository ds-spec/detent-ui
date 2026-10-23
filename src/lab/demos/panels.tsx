'use client'

import { useEffect, useRef } from 'react'
import { Panel, PanelGroup, ResizeHandle } from '../components/panels/Panels'
import type { PanelGroupHandle } from '../components/panels/Panels'

const FILES = ['app/', '  page.tsx', '  layout.tsx', 'lib/', '  cart.ts', '  db.ts', 'package.json']
const CODE = [`export function cartTotal(items: Item[]) {`, `  const subtotal = sum(items)`, `  const off = subtotal * discount.percent`, `  return subtotal - off + tax(subtotal - off)`, `}`]

/** Narrows the files, closes them, opens them again; then the terminal shuts and springs back. Hovering pauses; touching hands it over. */
export function PanelsDemo() {
  const outer = useRef<PanelGroupHandle>(null)
  const inner = useRef<PanelGroupHandle>(null)
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
        await beat(1400)
        outer.current?.resize('files', 34)
        await beat(1300)
        outer.current?.collapse('files')
        await beat(1400)
        outer.current?.expand('files')
        await beat(1300)
        inner.current?.collapse('terminal')
        await beat(1400)
        inner.current?.expand('terminal')
        await beat(1200)
        outer.current?.resize('files', 24)
        await beat(1600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <div className="w-[860px]" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <div className="h-[440px] overflow-hidden rounded-card bg-surface shadow-raised ring-1 ring-[var(--line)]">
        <PanelGroup ref={outer}>
          <Panel id="files" defaultSize={24} minSize={16} collapsible>
            <div className="h-full bg-surface-2 p-3 font-mono text-[12.5px] leading-[24px] text-ink-2">
              <p className="mb-1 font-sans text-caption font-medium text-ink-3">Files</p>
              {FILES.map((f) => (
                <p key={f} className="truncate whitespace-pre">
                  {f}
                </p>
              ))}
            </div>
          </Panel>
          <ResizeHandle />
          <Panel id="main" defaultSize={76} minSize={40}>
            <PanelGroup direction="vertical" ref={inner}>
              <Panel id="editor" defaultSize={66} minSize={30}>
                <div className="h-full p-4 font-mono text-[12.5px] leading-[22px] text-ink-2">
                  <p className="mb-2 font-sans text-caption font-medium text-ink-3">lib/cart.ts</p>
                  {CODE.map((l, i) => (
                    <p key={i} className="whitespace-pre">
                      <span className="mr-4 inline-block w-4 text-right text-ink-3/70">{i + 1}</span>
                      {l}
                    </p>
                  ))}
                </div>
              </Panel>
              <ResizeHandle />
              <Panel id="terminal" defaultSize={34} minSize={18} collapsible>
                <div className="h-full bg-[#0f0f10] p-4 font-mono text-[12.5px] leading-[22px] text-[#d4d4d8]">
                  <p className="mb-1 font-sans text-caption font-medium text-[#8b8b93]">Terminal</p>
                  <p>
                    <span className="text-[#6e6e76]">$</span> pnpm test cart
                  </p>
                  <p className="text-[#4fcf8a]">✓ applies discounts before tax (4 ms)</p>
                  <p className="text-[#4fcf8a]">✓ rounds half to even (1 ms)</p>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
