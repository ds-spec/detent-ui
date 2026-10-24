'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ContextMenu } from '../components/overlays/ContextMenu'
import type { ContextMenuHandle } from '../components/overlays/ContextMenu'
import { Confirm } from '../components/overlays/Confirm'
import type { ConfirmHandle } from '../components/overlays/Confirm'
import { Dialog } from '../components/overlays/Dialog'
import type { DialogHandle } from '../components/overlays/Dialog'
import { DropdownMenu } from '../components/overlays/DropdownMenu'
import type { DropdownHandle } from '../components/overlays/DropdownMenu'
import { HoverCard, HoverCardGroup } from '../components/overlays/HoverCard'
import type { HoverCardHandle } from '../components/overlays/HoverCard'
import type { MenuItem } from '../components/overlays/Menu'
import { Popover } from '../components/overlays/Popover'
import type { PopoverHandle } from '../components/overlays/Popover'
import { Sheet } from '../components/overlays/Sheet'
import type { SheetHandle } from '../components/overlays/Sheet'
import { Tooltip, TooltipGroup } from '../components/overlays/Tooltip'
import type { TooltipGroupHandle } from '../components/overlays/Tooltip'
import { Bin, Bubble, Check, Code, Copy, FilePage, Folder, Link, More, Pencil, Plus, Prompt } from '../icons'
import { LayerHost } from '../lib/layer'
import { spring } from '../lib/motion'
import { Button } from '../ui/Button'
import { Orb } from '../ui/Orb'
import { Switch } from '../ui/Switch'
import { useBench } from './bench'

/*
 * The overlays, each in a small app window that keeps them inside it. Every demo plays its
 * moment on a loop; hovering pauses it, and the first press or key hands it to you.
 */

type Beat = (ms: number) => Promise<void>

/** Runs a demo's script on a loop until someone touches it. Hovering holds it where it is. */
function useScript(script: (beat: Beat) => Promise<void>) {
  const held = useRef(false)
  const touched = useRef(false)
  const latest = useRef(script)
  useEffect(() => {
    latest.current = script
  })
  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat: Beat = async (ms) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const loop = async () => {
      for (;;) await latest.current(beat)
    }
    loop().catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return {
    onPointerEnter: () => (held.current = true),
    onPointerLeave: () => (held.current = false),
    onPointerDownCapture: () => (touched.current = true),
    onKeyDownCapture: () => (touched.current = true),
  }
}

/** A small app window: a title bar and a body, holding its own overlays. */
function Window({ title, children, hands, wide = false }: { title: string; children: ReactNode; hands: ReturnType<typeof useScript>; wide?: boolean }) {
  return (
    <div {...hands}>
      <LayerHost className={`${wide ? 'h-[400px] w-[580px]' : 'h-[360px] w-[520px]'} max-w-full rounded-[20px] bg-surface shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.14)]`}>
        <div className="flex h-10 items-center gap-1.5 border-b border-line px-3.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[10px] rounded-full bg-[color-mix(in_oklch,var(--ink)_12%,transparent)]" />
          ))}
          <span className="flex-1 text-center text-footnote text-ink-3">{title}</span>
          <span className="w-[38px]" />
        </div>
        <div className="relative h-[calc(100%-40px)] bg-[color-mix(in_oklch,var(--surface-2)_55%,var(--surface))]">{children}</div>
      </LayerHost>
    </div>
  )
}

/** A pointer for demos that need to show where a press happens. */
function Pointer({ at, press }: { at: { x: number; y: number } | null; press: number }) {
  return (
    <AnimatePresence>
      {at && (
        <motion.div key="pointer" className="pointer-events-none absolute left-0 top-0 z-[70]" initial={{ opacity: 0, x: at.x + 30, y: at.y + 30 }} animate={{ opacity: 1, x: at.x, y: at.y }} exit={{ opacity: 0 }} transition={spring.move}>
          <motion.span key={press} className="absolute -left-3 -top-3 size-6 rounded-full border-2 border-[var(--accent)]" initial={{ opacity: press ? 0.9 : 0, scale: 0.3 }} animate={{ opacity: 0, scale: 1.3 }} transition={{ duration: 0.5 }} />
          <svg width="18" height="20" viewBox="0 0 18 20" className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)]">
            <path d="M2 1.5 15.5 9.6l-6.2 1.4-3.1 5.8Z" fill="var(--ink)" stroke="var(--surface)" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────────────────────── Dialog ───────────────────────────── */

const ROLES = [
  { id: 'admin', name: 'Admin', line: 'Everything, including billing.' },
  { id: 'member', name: 'Member', line: 'Projects and runs, not billing.' },
  { id: 'viewer', name: 'Viewer', line: 'Can look, can’t change.' },
]

/** Opens an invite, then a second dialog from inside it, which pushes the first back until it closes. */
export function DialogDemo() {
  const b = useBench()
  const invite = useRef<DialogHandle>(null)
  const roles = useRef<DialogHandle>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const hands = useScript(async (beat) => {
    setEmail('')
    setRole('member')
    await beat(1200)
    invite.current?.open()
    await beat(700)
    const to = 'aiko@acme.dev'
    for (let i = 1; i <= to.length; i++) {
      setEmail(to.slice(0, i))
      await beat(55)
    }
    await beat(700)
    roles.current?.open()
    await beat(1100)
    setRole('admin')
    await beat(900)
    roles.current?.close()
    await beat(1300)
    invite.current?.close()
    await beat(900)
  })
  const current = ROLES.find((r) => r.id === role)!
  return (
    <Window title="Acme · Team" hands={hands} wide>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-headline text-ink">Team</p>
            <p className="text-footnote text-ink-3">3 people</p>
          </div>
          <Dialog
            ref={invite}
            dismissable={b.get('dismissable', true)}
            onOpenChange={b.on('onOpenChange')}
            trigger={
              <Button variant="primary" size="sm">
                <Plus size={14} /> Invite people
              </Button>
            }
            title="Invite people"
            description="They’ll get an email with a link to join Acme."
            footer={
              <>
                <Button variant="secondary" onClick={() => invite.current?.close()}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => invite.current?.close()}>
                  Send invite
                </Button>
              </>
            }
          >
            <label className="block">
              <span className="text-footnote text-ink-2">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1.5 h-10 w-full rounded-control bg-surface px-3 text-callout text-ink shadow-[0_0_0_1px_var(--line-strong)] outline-none transition-shadow placeholder:text-ink-3 focus:shadow-field"
              />
            </label>
            <div className="mt-4 flex items-center justify-between rounded-row bg-surface-2 py-2.5 pl-3.5 pr-2.5">
              <div className="min-w-0">
                <p className="text-callout text-ink">{current.name}</p>
                <p className="text-footnote text-ink-3">{current.line}</p>
              </div>
              <Dialog
                ref={roles}
                size="sm"
                description="What Aiko can do in Acme."
                trigger={
                  <Button variant="secondary" size="sm">
                    Change
                  </Button>
                }
                title="Choose a role"
                footer={
                  <Button variant="primary" onClick={() => roles.current?.close()}>
                    Done
                  </Button>
                }
              >
                <div className="flex flex-col gap-1">
                  {ROLES.map((r) => (
                    <button key={r.id} type="button" onClick={() => setRole(r.id)} className={`ring-focus flex items-center gap-3 rounded-row px-3 py-2.5 text-left transition-colors ${r.id === role ? 'bg-surface-2' : 'hover:bg-surface-2/60'}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-callout text-ink">{r.name}</span>
                        <span className="block text-footnote text-ink-3">{r.line}</span>
                      </span>
                      <span className={`text-ink transition-opacity ${r.id === role ? '' : 'opacity-0'}`}>
                        <Check size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              </Dialog>
            </div>
          </Dialog>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          {[
            ['Maya Chen', 'Admin', 150],
            ['Jonas Weber', 'Member', 250],
            ['Lena Ortiz', 'Member', 20],
          ].map(([n, r, h]) => (
            <div key={n} className="flex h-12 items-center gap-3 rounded-row bg-surface px-3 shadow-raised">
              <Orb seed={n as string} hue={h as number} size={26} />
              <span className="flex-1 text-callout text-ink">{n}</span>
              <span className="text-footnote text-ink-3">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  )
}

/* ───────────────────────────── Confirm ───────────────────────────── */

/** Asks before deleting a project: types the name, slips on a letter, fixes it, and confirms. */
export function ConfirmDemo() {
  const b = useBench()
  const confirm = useRef<ConfirmHandle>(null)
  const [gone, setGone] = useState(false)
  const hands = useScript(async (beat) => {
    setGone(false)
    await beat(1200)
    confirm.current?.open()
    await beat(900)
    const name = 'acme-web'
    for (const t of ['a', 'ac', 'acm', 'acmw']) {
      confirm.current?.type(t)
      await beat(150)
    }
    await beat(500)
    confirm.current?.type('acm')
    await beat(260)
    for (let i = 4; i <= name.length; i++) {
      confirm.current?.type(name.slice(0, i))
      await beat(140)
    }
    await beat(700)
    confirm.current?.confirm()
    await beat(2300)
    setGone(true)
    await beat(1800)
  })
  return (
    <Window title="Settings · Projects" hands={hands} wide>
      <div className="p-5">
        <p className="text-headline text-ink">Danger zone</p>
        <p className="mt-0.5 text-footnote text-ink-3">These can’t be undone.</p>
        <div className="mt-4 flex items-center gap-3 rounded-row bg-surface p-3.5 shadow-raised">
          <span className="flex size-9 items-center justify-center rounded-control bg-surface-2 text-ink-2">
            <Folder size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-callout transition-colors ${gone ? 'text-ink-3 line-through' : 'text-ink'}`}>acme-web</span>
            <span className="block text-footnote text-ink-3">{gone ? 'Deleted just now' : '128 runs · 14 environments'}</span>
          </span>
          <Confirm
            ref={confirm}
            trigger={
              <Button variant="danger" size="sm">
                Delete project
              </Button>
            }
            title="Delete acme-web?"
            description="Its runs, environments and logs go with it. This can’t be undone."
            require="acme-web"
            confirmLabel={b.get('confirmLabel', 'Delete project')}
            doneLabel={b.get('doneLabel', 'Deleted')}
            onConfirm={b.on('onConfirm')}
          />
        </div>
      </div>
    </Window>
  )
}

/* ───────────────────────────── Popover ───────────────────────────── */

/** Opens a share panel from a button by the window's edge; the panel slides in to stay inside and its arrow keeps pointing at the button. */
export function PopoverDemo() {
  const b = useBench()
  const share = useRef<PopoverHandle>(null)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(true)
  const hands = useScript(async (beat) => {
    setCopied(false)
    await beat(1000)
    share.current?.open()
    await beat(1500)
    setCopied(true)
    await beat(1300)
    setOpen(false)
    await beat(1100)
    setOpen(true)
    await beat(1200)
    share.current?.close()
    await beat(800)
  })
  return (
    <Window title="Docs · Launch plan" hands={hands}>
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
        <FilePage size={16} className="text-ink-3" />
        <span className="flex-1 text-callout text-ink">Launch plan</span>
        <Popover
          ref={share}
          label="Share"
          align="center"
          side={b.get('side', 'bottom')}
          arrow={b.get('arrow', true)}
          className="w-[300px] p-4"
          trigger={
            <Button variant="primary" size="sm">
              Share
            </Button>
          }
        >
          <p className="text-headline text-ink">Share this doc</p>
          <div className="mt-3 flex items-center gap-2 rounded-control bg-surface-2 py-1.5 pl-3 pr-1.5">
            <Link size={15} className="shrink-0 text-ink-3" />
            <span className="min-w-0 flex-1 truncate font-mono text-footnote text-ink-2">acme.dev/d/launch-plan</span>
            <button type="button" onClick={() => setCopied(true)} className="ring-focus grid h-7 rounded-[7px] bg-surface px-2 text-footnote font-medium text-ink shadow-raised">
              <span className={`col-start-1 row-start-1 flex items-center gap-1 transition-opacity ${copied ? 'opacity-0' : ''}`}>
                <Copy size={13} /> Copy
              </span>
              <span className={`col-start-1 row-start-1 flex items-center gap-1 text-ok transition-opacity ${copied ? '' : 'opacity-0'}`}>
                <Check size={13} /> Copied
              </span>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-footnote text-ink-2">Anyone with the link can view</span>
            <Switch checked={open} onChange={setOpen} label="Anyone with the link can view" />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <span className="flex -space-x-1.5">
              {[150, 250, 20].map((h, i) => (
                <span key={h} className="rounded-full shadow-[0_0_0_2px_var(--surface)]">
                  <Orb seed={`p${i}`} hue={h} size={22} />
                </span>
              ))}
            </span>
            <span className="text-footnote text-ink-3">3 people can edit</span>
          </div>
        </Popover>
      </div>
      <div className="space-y-2.5 p-5">
        {[92, 78, 86, 64, 70].map((w, i) => (
          <span key={i} className="block h-2.5 rounded-full bg-[color-mix(in_oklch,var(--ink)_7%,transparent)]" style={{ width: `${w}%` }} />
        ))}
      </div>
    </Window>
  )
}

/* ───────────────────────────── Tooltip ───────────────────────────── */

const TOOLS = [
  { label: 'Bold', keys: ['⌘', 'B'], glyph: <span className="text-[15px] font-bold">B</span> },
  { label: 'Italic', keys: ['⌘', 'I'], glyph: <span className="font-serif text-[16px] italic">I</span> },
  { label: 'Link', keys: ['⌘', 'K'], glyph: <Link size={16} /> },
  { label: 'Code', keys: ['⌘', 'E'], glyph: <Code size={16} /> },
  { label: 'Comment', keys: ['⌘', '⌥', 'M'], glyph: <Bubble size={16} /> },
  { label: 'Ask AI', keys: ['⌘', 'J'], glyph: <Prompt size={16} /> },
]

/** A pointer runs along a toolbar: the first tooltip waits, then one bubble glides from button to button. */
export function TooltipDemo() {
  const b = useBench()
  const group = useRef<TooltipGroupHandle>(null)
  const box = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  // Where a button's middle is, in the window's own pixels, whatever it's zoomed to.
  const point = (i: number) => {
    const btn = bar.current?.children[i] as HTMLElement | undefined
    const w = box.current
    if (!btn || !w) return
    const r = w.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const k = r.width / (w.offsetWidth || 1)
    setAt({ x: (b.left + b.width / 2 - r.left) / k + 2, y: (b.top + b.height / 2 - r.top) / k + 4 })
  }
  const hands = useScript(async (beat) => {
    await beat(900)
    point(0)
    group.current?.show(0)
    await beat(1300)
    for (const i of [1, 2, 3, 4, 5]) {
      point(i)
      group.current?.show(i)
      await beat(800)
    }
    await beat(500)
    group.current?.hide()
    setAt(null)
    await beat(1400)
  })
  return (
    <Window title="Editor" hands={hands}>
      <div ref={box} className="relative h-full">
        <TooltipGroup ref={group}>
          <div ref={bar} className="absolute left-1/2 top-[118px] flex -translate-x-1/2 items-center gap-0.5 rounded-row bg-surface p-1 shadow-float">
            {TOOLS.map((t) => (
              <Tooltip key={t.label} label={t.label} shortcut={t.keys} side={b.get('side', 'top')}>
                <button type="button" aria-label={t.label} className="ring-focus flex size-8 items-center justify-center rounded-[9px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                  {t.glyph}
                </button>
              </Tooltip>
            ))}
          </div>
        </TooltipGroup>
        <div className="absolute inset-x-8 top-[176px] space-y-2.5">
          {[88, 72, 80].map((w, i) => (
            <span key={i} className="block h-2.5 rounded-full bg-[color-mix(in_oklch,var(--ink)_7%,transparent)]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <Pointer at={at} press={0} />
      </div>
    </Window>
  )
}

/* ───────────────────────────── Dropdown ───────────────────────────── */

/** Opens a file's menu, walks down it, opens "Move to" and picks a folder. */
export function DropdownDemo() {
  const b = useBench()
  const menu = useRef<DropdownHandle>(null)
  const [pinned, setPinned] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const items: MenuItem[] = [
    { label: 'Open', icon: <FilePage size={16} />, shortcut: '⌘O', onSelect: () => setNote('Opened brand-guide.pdf') },
    { label: 'Rename', icon: <Pencil size={16} />, shortcut: '⌘R', onSelect: () => setNote('Renaming…') },
    { label: 'Duplicate', icon: <Copy size={16} />, shortcut: '⌘D', onSelect: () => setNote('Duplicated') },
    { kind: 'sub', label: 'Move to', icon: <Folder size={16} />, items: ['Design', 'Engineering', 'Archive'].map((f) => ({ label: f, onSelect: () => setNote(`Moved to ${f}`) })) },
    { kind: 'separator' },
    { kind: 'check', label: 'Pin to sidebar', checked: pinned, onCheckedChange: setPinned },
    { kind: 'separator' },
    { label: 'Delete', icon: <Bin size={16} />, shortcut: '⌫', danger: true, onSelect: () => setNote('Moved to trash') },
  ]
  const hands = useScript(async (beat) => {
    setNote(null)
    await beat(1000)
    menu.current?.open()
    await beat(600)
    for (const i of [0, 1, 2]) {
      menu.current?.point([i])
      await beat(380)
    }
    menu.current?.point([3])
    await beat(500)
    menu.current?.point([3, 1])
    await beat(800)
    menu.current?.choose([3, 1])
    await beat(2200)
  })
  return (
    <Window title="Files" hands={hands}>
      <div className="p-4">
        {[
          ['brand-guide.pdf', '2.4 MB', true],
          ['q3-roadmap.key', '18 MB', false],
          ['launch-notes.md', '12 KB', false],
        ].map(([name, size, menuHere]) => (
          <div key={name as string} className={`flex h-12 items-center gap-3 rounded-row px-3 ${menuHere ? 'bg-surface shadow-raised' : ''}`}>
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-surface-2 text-ink-3">
              <FilePage size={16} />
            </span>
            <span className="flex-1 text-callout text-ink">{name}</span>
            <span className="text-footnote text-ink-3">{size}</span>
            {menuHere ? (
              <DropdownMenu
                ref={menu}
                label="File actions"
                align="end"
                side={b.get('side', 'bottom')}
                items={items}
                trigger={
                  <button type="button" aria-label="More" className="ring-focus flex size-8 items-center justify-center rounded-[9px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink aria-expanded:bg-surface-2 aria-expanded:text-ink">
                    <More size={18} />
                  </button>
                }
              />
            ) : (
              <span className="size-8" />
            )}
          </div>
        ))}
        <p className="mt-3 grid h-5 px-3 text-footnote text-ink-3">
          <AnimatePresence>
            {note && (
              <motion.span key={note} className="col-start-1 row-start-1 flex items-center gap-1.5" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Check size={13} /> {note}
              </motion.span>
            )}
          </AnimatePresence>
        </p>
      </div>
    </Window>
  )
}

/* ───────────────────────────── Context menu ───────────────────────────── */

const NOTES = [
  { x: 36, y: 34, w: 132, text: 'Interview 5 users', hue: 85 },
  { x: 196, y: 58, w: 120, text: 'Pricing page v2', hue: 150 },
  { x: 92, y: 150, w: 140, text: 'Onboarding emails', hue: 250 },
]

/** Right-clicks the board twice, once in the open and once by the corner, where the menu flips to stay inside. */
export function ContextDemo() {
  const menu = useRef<ContextMenuHandle>(null)
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const [press, setPress] = useState(0)
  const [snap, setSnap] = useState(true)
  const items: MenuItem[] = [
    { label: 'Add note', icon: <Plus size={16} />, shortcut: 'N' },
    { label: 'Paste', icon: <Copy size={16} />, shortcut: '⌘V' },
    { kind: 'sub', label: 'Arrange', icon: <Folder size={16} />, items: [{ label: 'In a grid' }, { label: 'In a stack' }, { label: 'By colour' }] },
    { kind: 'separator' },
    { kind: 'check', label: 'Snap to grid', checked: snap, onCheckedChange: setSnap },
    { kind: 'separator' },
    { label: 'Clear board', icon: <Bin size={16} />, danger: true },
  ]
  const hands = useScript(async (beat) => {
    await beat(800)
    for (const p of [
      { x: 250, y: 150 },
      { x: 420, y: 250 },
    ]) {
      setAt(p)
      await beat(800)
      setPress((n) => n + 1)
      menu.current?.openAt(p.x, p.y)
      await beat(700)
      menu.current?.point([1])
      await beat(450)
      menu.current?.point([2])
      await beat(500)
      menu.current?.point([2, 0])
      await beat(900)
      menu.current?.close()
      await beat(700)
    }
    setAt(null)
    await beat(1000)
  })
  return (
    <Window title="Board" hands={hands}>
      <ContextMenu ref={menu} label="Board" items={items} className="relative block h-full bg-[radial-gradient(color-mix(in_oklch,var(--ink)_14%,transparent)_1px,transparent_1.2px)] bg-[length:16px_16px] outline-none">
        {NOTES.map((n) => (
          <div key={n.text} className="absolute rounded-[12px] p-3 text-footnote text-ink shadow-raised" style={{ left: n.x, top: n.y, width: n.w, background: `light-dark(oklch(0.97 0.03 ${n.hue}), oklch(0.3 0.04 ${n.hue}))` }}>
            {n.text}
          </div>
        ))}
        <p className="absolute bottom-3 left-4 text-caption text-ink-3">Right-click anywhere</p>
      </ContextMenu>
      <Pointer at={at} press={press} />
    </Window>
  )
}

/* ───────────────────────────── Sheet ───────────────────────────── */

const RUNS = [
  { id: 3121, title: 'Apply discount codes before tax', state: 'Passed', ok: true },
  { id: 3120, title: 'Send each order email once', state: 'Passed', ok: true },
  { id: 3119, title: 'Dark mode for the account page', state: 'Failed', ok: false },
]

/** Opens a run's details from the side, tugs the sheet partway and lets it spring back, then flicks it away. */
export function SheetDemo() {
  const b = useBench()
  const sheet = useRef<SheetHandle>(null)
  const hands = useScript(async (beat) => {
    await beat(1100)
    sheet.current?.open()
    await beat(1700)
    sheet.current?.tug(90)
    await beat(1600)
    sheet.current?.close()
    await beat(1200)
  })
  return (
    <Window title="Runs" hands={hands} wide>
      <div className="p-4">
        {RUNS.map((r, i) => (
          <div key={r.id} className={`flex h-12 items-center gap-3 rounded-row px-3 ${i === 0 ? 'bg-surface shadow-raised' : ''}`}>
            <span className={`size-2 rounded-full ${r.ok ? 'bg-ok' : 'bg-danger'}`} />
            <span className="font-mono text-footnote text-ink-3">{r.id}</span>
            <span className="min-w-0 flex-1 truncate text-callout text-ink">{r.title}</span>
            {i === 0 ? (
              <Sheet
                ref={sheet}
                side={b.get('side', 'right')}
                onOpenChange={b.on('onOpenChange')}
                title="Run 3121"
                description="Apply discount codes before tax"
                trigger={
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                }
                footer={
                  <>
                    <Button variant="secondary" size="sm">
                      Rerun
                    </Button>
                    <Button variant="primary" size="sm">
                      Open PR
                    </Button>
                  </>
                }
              >
                <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-y-2.5 text-callout">
                  {[
                    [
                      'Status',
                      <span key="s" className="flex items-center gap-1.5 text-ok">
                        <span className="size-1.5 rounded-full bg-ok" /> Passed
                      </span>,
                    ],
                    [
                      'Branch',
                      <span key="b" className="font-mono text-footnote text-ink-2">
                        kiln/482-codes
                      </span>,
                    ],
                    ['Duration', '4m 12s'],
                    ['Tests', '128 passed'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="contents">
                      <dt className="text-ink-3">{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 rounded-row bg-surface-2 p-3 font-mono text-[12px] leading-[20px] text-ink-2">
                  <p>✓ Read the issue</p>
                  <p>✓ Planned 3 changes</p>
                  <p>✓ Edited 3 files</p>
                  <p>✓ 128 tests passed</p>
                </div>
              </Sheet>
            ) : (
              <span className="text-footnote text-ink-3">{r.state}</span>
            )}
          </div>
        ))}
      </div>
    </Window>
  )
}

/* ───────────────────────────── Hover card ───────────────────────────── */

type Person = { name: string; handle: string; role: string; hue: number; bio: string; time: [string, string]; city: string; reviews: number; month: number; seed: number }

const PEOPLE: Record<string, Person> = {
  maya: { name: 'Maya Chen', handle: 'maya', role: 'Staff engineer', hue: 150, bio: 'Checkout and payments at Acme. Reviews most of what Kiln opens.', time: ['9:41', 'PM'], city: 'Lisbon', reviews: 412, month: 38, seed: 3 },
  jonas: { name: 'Jonas Weber', handle: 'jonas', role: 'Design engineer', hue: 260, bio: 'Owns the empty states and most of the words on screen.', time: ['10:41', 'PM'], city: 'Berlin', reviews: 167, month: 12, seed: 11 },
}

/** Twelve weeks of reviews as a field of dots, a column a week, darker on busier days. */
function Activity({ seed }: { seed: number }) {
  const rand = (i: number) => {
    const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453
    return x - Math.floor(x)
  }
  return (
    <span aria-hidden className="grid grid-flow-col grid-rows-5 gap-[2.5px]">
      {Array.from({ length: 60 }, (_, i) => {
        const v = rand(i) * (0.45 + 0.55 * (i / 60))
        return <span key={i} className="size-[4px] rounded-full bg-ink" style={{ opacity: v < 0.18 ? 0.09 : v < 0.36 ? 0.3 : v < 0.55 ? 0.6 : 1 }} />
      })}
    </span>
  )
}

function Profile({ p }: { p: Person }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Orb seed={p.name} hue={p.hue} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-headline text-ink">{p.name}</p>
          <p className="truncate text-footnote text-ink-3">
            @{p.handle} · {p.role}
          </p>
        </div>
        {/* Their local time, the hour in ink and the rest in grey. */}
        <p className="tnum text-right text-footnote leading-5">
          <span className="text-ink">{p.time[0]}</span> <span className="text-ink-3">{p.time[1]}</span>
          <span className="block text-caption text-ink-3">{p.city}</span>
        </p>
      </div>
      <p className="mt-3 text-callout leading-[21px] text-ink-2">{p.bio}</p>
      <div className="mt-3.5 flex items-end justify-between border-t border-line pt-3.5">
        <p className="text-footnote leading-5">
          <span className="tnum text-ink">{p.reviews}</span> <span className="text-ink-3">reviews</span>
          <span className="block">
            <span className="tnum text-ink">{p.month}</span> <span className="text-ink-3">this month</span>
          </span>
        </p>
        <Activity seed={p.seed} />
      </div>
    </div>
  )
}

/**
 * Two mentions in one comment, sharing a card. It rests on the first and the card opens in the
 * shape of a profile, then fills in; it moves to the second and the same card glides over and
 * becomes the next person, without waiting.
 */
export function HoverCardDemo() {
  const b = useBench()
  const maya = useRef<HoverCardHandle>(null)
  const jonas = useRef<HoverCardHandle>(null)
  const [round, setRound] = useState(0)
  const hands = useScript(async (beat) => {
    // A fresh group each time round, so each profile loads again.
    setRound((n) => n + 1)
    await beat(1200)
    maya.current?.open()
    await beat(2600)
    jonas.current?.open()
    await beat(2600)
    jonas.current?.close()
    await beat(1400)
  })
  const mention = (who: string) => (
    <a href="#" onClick={(e) => e.preventDefault()} className="ring-focus rounded-[4px] font-medium text-[var(--accent)] hover:underline">
      @{who}
    </a>
  )
  const card = (who: keyof typeof PEOPLE, ref: typeof maya) => (
    <HoverCard
      ref={ref}
      label={PEOPLE[who].name}
      width={320}
      align="center"
      openDelay={b.get('openDelay', 450)}
      side={b.get('side', 'bottom')}
      load={() => new Promise((r) => setTimeout(() => r(<Profile p={PEOPLE[who]} />), 800))}
      trigger={mention(who)}
    />
  )
  return (
    <Window title="Pull request #1290" hands={hands}>
      <div className="p-5">
        <div className="flex gap-3">
          <Orb seed="Lena Ortiz" hue={20} size={28} />
          <div className="min-w-0 flex-1 rounded-row bg-surface p-3.5 shadow-raised">
            <p className="text-footnote text-ink-3">
              <span className="text-ink">Lena Ortiz</span> commented
            </p>
            <HoverCardGroup key={round}>
              <p className="mt-1.5 text-callout leading-[22px] text-ink-2">
                This looks right to me. Before we merge, can one of you check the rounding in <span className="rounded-[5px] bg-surface-2 px-1 font-mono text-footnote text-ink">total()</span>, {card('maya', maya)} or {card('jonas', jonas)}?
              </p>
            </HoverCardGroup>
          </div>
        </div>
      </div>
    </Window>
  )
}
