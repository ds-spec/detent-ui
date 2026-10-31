'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Close, Upload as UploadIcon } from '../../icons'
import { ease, spring, dur } from '../../lib/motion'
import { Button } from '../../ui/Button'
import { FileGlyph } from '../../ui/FileGlyph'
import { RollingText } from '../../ui/RollingText'

type Kind = 'image' | 'pdf' | 'video' | 'zip' | 'doc'
type Item = { id: string; name: string; size: number; kind: Kind; preview?: string; url?: string; progress: number; done: boolean; speed: number }

/** For demos and tests: hold files over the folder, drop the samples, start over. */
export type UploadHandle = { hover(n: number): void; drop(): void; clear(): void }

const kindOf = (f: File): Kind => (f.type.startsWith('image/') ? 'image' : f.type === 'application/pdf' ? 'pdf' : f.type.startsWith('video/') ? 'video' : /zip|compressed/.test(f.type) ? 'zip' : 'doc')
const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)
const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))

let seq = 0
const SAMPLES: Omit<Item, 'id' | 'progress' | 'done' | 'speed'>[] = [
  { name: 'hero-shot.png', size: 2.4e6, kind: 'image', preview: 'linear-gradient(180deg, #c7d3e6 0%, #e9ddcc 54%, #8e9c7c 55%, #6a7a5c 100%)' },
  { name: 'Q3 board update.pdf', size: 1.1e6, kind: 'pdf' },
  { name: 'launch-film.mp4', size: 18.2e6, kind: 'video' },
]

const ROW = 56
const VISIBLE_ROWS = 3

/**
 * Upload as a folder. Files hovering over it tip the front flap open; dropped files fall in as
 * sheets carrying their thumbnails. The list below has a fixed height, so the component never
 * changes size as files arrive.
 */
export function Upload({
  accept = 'PNG, JPG, PDF or MP4',
  onFiles,
  ref,
}: {
  /** What it takes, in words, under the drop zone. */
  accept?: string
  /** Called with the files a person drops or picks. Start the real upload here. */
  onFiles?: (files: File[]) => void
  ref?: Ref<UploadHandle>
}) {
  const filesTo = useRef(onFiles)
  useLayoutEffect(() => {
    filesTo.current = onFiles
  })
  const [items, setItems] = useState<Item[]>([])
  const [over, setOver] = useState(0)
  const depth = useRef(0)
  const picker = useRef<HTMLInputElement>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const t = setInterval(() => {
      if (!itemsRef.current.some((i) => !i.done)) return
      setItems((list) =>
        list.map((i) => {
          if (i.done) return i
          const p = Math.min(1, i.progress + i.speed * (0.5 + Math.random()))
          return { ...i, progress: p, done: p >= 1 }
        }),
      )
    }, 140)
    return () => clearInterval(t)
  }, [])

  useEffect(() => () => itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url)), [])

  const add = (list: Omit<Item, 'id' | 'progress' | 'done' | 'speed'>[]) =>
    setItems((cur) => [...list.map((f, k) => ({ ...f, id: `f${++seq}`, progress: 0, done: false, speed: Math.min(0.12, 0.9 / Math.max(6, f.size / 1e5)) * (1 - k * 0.12) })), ...cur])

  const addFiles = (files: File[]) => {
    filesTo.current?.(files)
    return add(
      files.map((f) => {
        const kind = kindOf(f)
        const url = kind === 'image' ? URL.createObjectURL(f) : undefined
        return { name: f.name, size: f.size, kind, url, preview: url ? `center / cover no-repeat url("${url}")` : undefined }
      }),
    )
  }

  useImperativeHandle(ref, () => ({
    hover: setOver,
    drop: () => {
      setOver(0)
      add(SAMPLES)
    },
    clear: () => setItems([]),
  }))

  const remove = (id: string) =>
    setItems((list) => {
      const gone = list.find((i) => i.id === id)
      if (gone?.url) URL.revokeObjectURL(gone.url)
      return list.filter((i) => i.id !== id)
    })

  const total = items.reduce((n, i) => n + i.size, 0)
  const sent = items.reduce((n, i) => n + i.size * i.progress, 0)
  const pct = total ? Math.round((sent / total) * 100) : 0
  const busy = items.some((i) => !i.done)

  const headline = over ? `Release to add ${over} ${over === 1 ? 'file' : 'files'}` : items.length ? (busy ? 'Uploading' : 'All files uploaded') : 'Drop files into the folder'

  return (
    <div className="w-[440px] max-w-full">
      <div
        role="button"
        data-invite
        tabIndex={0}
        onClick={() => picker.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), picker.current?.click())}
        onDragEnter={(e) => {
          e.preventDefault()
          depth.current++
          setOver(e.dataTransfer.items.length || 1)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          if (--depth.current <= 0) setOver(0)
        }}
        onDrop={(e) => {
          e.preventDefault()
          depth.current = 0
          setOver(0)
          if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files))
        }}
        className="ring-focus group relative flex h-[292px] cursor-pointer flex-col items-center justify-center rounded-panel bg-surface transition-shadow duration-300"
        style={{ boxShadow: over ? '0 0 0 2px color-mix(in oklch, var(--ink) 14%, transparent), var(--elev-float)' : 'var(--elev-raised)' }}
      >
        <Folder open={!!over} items={items} pct={pct} busy={busy} />

        <div className="mt-6 flex h-[42px] flex-col items-center">
          <Swap k={headline} className="w-[300px] text-headline">
            {items.length && !over ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                {headline}
                {busy && <RollingText text={`${pct}%`} className="tnum text-ink-2" />}
              </span>
            ) : (
              headline
            )}
          </Swap>
          <p className="mt-0.5 text-footnote text-ink-3">
            or <span className="text-ink-2 underline decoration-line-strong underline-offset-[3px]">browse</span> · {accept}
          </p>
        </div>

        <input
          ref={picker}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(Array.from(e.target.files))
            e.target.value = ''
          }}
        />
      </div>

      {/* Fixed-height list: arrivals scroll inside it instead of growing the component. */}
      <div className="relative mt-3" style={{ height: ROW * VISIBLE_ROWS + 8 }}>
        <ul className="h-full overflow-y-auto pb-2 [scrollbar-width:none]" style={{ maskImage: items.length > VISIBLE_ROWS ? 'linear-gradient(to bottom, black 80%, transparent)' : undefined }}>
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.li
                key={i.id}
                layout="position"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }}
                transition={{ duration: 0.3, ease: ease.out }}
                className="flex items-center gap-3 rounded-row px-2.5"
                style={{ height: ROW }}
              >
                <FileGlyph name={i.name} preview={i.preview} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-callout font-medium">{i.name}</span>
                  <span className="relative mt-1.5 block h-[3px] overflow-hidden rounded-full bg-surface-2">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      initial={false}
                      animate={{ width: `${i.progress * 100}%`, backgroundColor: i.done ? 'var(--ok)' : 'var(--ink)' }}
                      transition={spring.release}
                    />
                  </span>
                </span>
                <span className="tnum w-[64px] shrink-0 text-right text-caption text-ink-3">{fmtSize(i.size)}</span>
                {/* Status and cancel share one fixed slot. */}
                <span className="relative flex size-7 shrink-0 items-center justify-center">
                  <AnimatePresence initial={false}>
                    {i.done ? (
                      <motion.span
                        key="ok"
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={spring.pop}
                        className="absolute flex size-6 items-center justify-center rounded-full bg-ok text-white"
                      >
                        <Check size={14} strokeWidth={2.8} />
                      </motion.span>
                    ) : (
                      <motion.button
                        key="x"
                        exit={{ scale: 0.8, opacity: 0 }}
                        aria-label={`Cancel ${i.name}`}
                        onClick={() => remove(i.id)}
                        className="ring-focus absolute flex size-7 pointer-coarse:before:absolute pointer-coarse:before:-inset-1 pointer-coarse:before:content-[''] items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink" transition={{ duration: dur.enter, ease: ease.out }}
                      >
                        <Close size={15} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <AnimatePresence>
          {!items.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-card text-footnote text-ink-3"
              style={{ boxShadow: 'inset 0 0 0 1.5px var(--line)' }} transition={{ duration: dur.enter, ease: ease.out }}
            >
              Files you add will appear here
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button variant="ghost" size="sm" onClick={() => add(SAMPLES)} className="mt-1 w-full text-ink-3">
        Try with sample files
      </Button>
    </div>
  )
}

/* ───────────────────────────── Folder ───────────────────────────── */

const FW = 224
const FH = 168
const PLACEHOLDERS = ['p1', 'p2']

function Folder({ open, items, pct, busy }: { open: boolean; items: Item[]; pct: number; busy: boolean }) {
  const sheets = items.slice(0, 4).reverse()
  const papers: { id: string; item?: Item }[] = sheets.length ? sheets.map((s) => ({ id: s.id, item: s })) : PLACEHOLDERS.map((id) => ({ id }))
  return (
    <div className="relative" style={{ width: FW, height: FH, perspective: 720 }}>
      {/* Back panel with its tab */}
      <div className="absolute left-0 top-0 h-[30px] w-[96px] bg-[var(--folder-back)]" style={{ borderRadius: '14px 14px 0 0', clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 top-[22px] rounded-[18px] bg-[var(--folder-back)]" style={{ boxShadow: 'inset 0 -12px 24px -16px rgb(0 0 0 / 0.25)' }} />

      {/* Papers: two blanks while empty, then one sheet per file (newest in front) */}
      <AnimatePresence initial={false}>
        {papers.map((p, k) => {
          const h = hash(p.id)
          const rot = ((h % 7) - 3) * 1.4
          const dx = ((h % 5) - 2) * 3
          const depth = papers.length - 1 - k
          return (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-[36px] flex flex-col overflow-hidden rounded-[10px] bg-[var(--sheet)] p-1.5"
              style={{ width: 172, height: 112, marginLeft: -86, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.6), 0 4px 10px -4px rgb(0 0 0 / 0.22)' }}
              initial={p.item ? { y: -150, rotate: rot * 3, opacity: 0, scale: 0.92 } : false}
              animate={{ y: (open ? -16 : 0) - depth * 6, x: dx, rotate: rot, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20, transition: { duration: dur.exit, ease: ease.out } }}
              transition={{ ...spring.soft, delay: p.item ? k * 0.08 : 0 }}
            >
              {p.item ? <SheetFace item={p.item} /> : <span className="flex-1 rounded-[7px] bg-[var(--sheet-line)] opacity-60" />}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Front flap: tips open toward you while files hover */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[112px] rounded-[18px] bg-[var(--folder-front)]"
        style={{ transformOrigin: '50% 100%', boxShadow: 'inset 0 1px 0 light-dark(rgb(255 255 255 / 0.55), transparent), inset 0 0 0 1px light-dark(transparent, rgb(255 255 255 / 0.145)), 0 -8px 20px -12px rgb(0 0 0 / 0.25)' }}
        animate={{ rotateX: open ? -30 : 0 }}
        transition={open ? spring.soft : spring.pop}
      >
        <motion.div className="pointer-events-none absolute inset-0 rounded-[18px] bg-black" initial={false} animate={{ opacity: open ? 0.08 : 0 }} transition={{ duration: 0.3, ease: ease.out }} />
        <div className="absolute inset-x-0 top-[34px] flex justify-center text-[var(--folder-ink)]">
          <motion.span animate={{ y: open ? -3 : 0 }} transition={spring.snappy}>
            <UploadIcon size={26} />
          </motion.span>
        </div>
        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out, delay: dur.enter } }}
              className="absolute inset-x-6 bottom-5 h-[4px] overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.1]" transition={{ duration: dur.enter, ease: ease.out }}
            >
              <motion.div className="h-full rounded-full bg-[var(--folder-ink)]" initial={false} animate={{ width: `${pct}%` }} transition={spring.release} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function SheetFace({ item }: { item: Item }) {
  return (
    <>
      {/* Images show themselves; everything else is a quiet panel with its extension. */}
      <span
        className="flex h-[62px] items-center justify-center rounded-[7px] text-[10px] font-semibold tracking-[0.06em] text-[var(--folder-ink)]"
        style={{ background: item.preview ?? 'color-mix(in oklch, var(--sheet-line) 55%, var(--sheet))' }}
      >
        {!item.preview && (item.name.split('.').pop() ?? '').toUpperCase()}
      </span>
      <span className="mt-1.5 truncate px-0.5 text-caption font-medium text-[#3a3a3f]">{item.name}</span>
      <span className="mt-1 h-[3px] w-1/2 rounded-full bg-[var(--sheet-line)]" />
    </>
  )
}

/** Text that crossfades in place; the caller fixes the width so nothing reflows. */
function Swap({ k, className, children }: { k: string; className: string; children: ReactNode }) {
  return (
    <span className={`relative block h-[22px] overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={k}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: ease.out }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
