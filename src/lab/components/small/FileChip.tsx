'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Close, Refresh } from '../../icons'
import { tap } from '../../lib/feel'
import { ease } from '../../lib/motion'
import { FileGlyph } from '../../ui/FileGlyph'

export type Upload = {
  id: string
  name: string
  /** In bytes. */
  size: number
  /** 0 to 1. */
  progress: number
  status: 'uploading' | 'done' | 'error'
  /** A CSS background for images: the tile shows it, and it comes into focus as it uploads. */
  preview?: string
}

const sizeOf = (b: number) => (b < 1024 ** 2 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`)
const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toUpperCase() : 'FILE')
const enter = { type: 'spring', stiffness: 460, damping: 34 } as const

/**
 * Attachments in a composer, each showing its upload in its own terms. An image is a square
 * of itself, blurred and quiet while it uploads, and the sharp picture rises through it as the
 * bytes go up, so it comes into focus the moment it's ready. A document is a card whose ground
 * fills as it goes, then settles to its kind and size. A failure tints in place and offers to
 * try again. Point at any file for its ✕.
 *
 * The row keeps one height, empty or full, and files arrive and leave sideways, so the
 * composer never changes size around them.
 */
export function FileChips({
  files,
  onRemove,
  onRetry,
  empty = 'Attach files, or drop them here',
}: {
  /** The attachments, each with its progress and status. Images with a `preview` show as tiles. */
  files: Upload[]
  /** Called with a file's id when a person removes it. */
  onRemove: (id: string) => void
  /** Called with a file's id when a person retries a failed upload. */
  onRetry: (id: string) => void
  /** What the row says while it's empty. */
  empty?: string
}) {
  return (
    <div className="relative h-[72px]">
      <AnimatePresence>
        {!files.length && (
          <motion.p
            key="empty"
            className="absolute inset-0 flex items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-[var(--line-strong)] text-footnote text-ink-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            {empty}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="flex h-full items-center gap-2 overflow-x-auto [scrollbar-width:none]" role="list" aria-label="Attachments">
        <AnimatePresence initial={false} mode="popLayout">
          {files.map((f) => (
            <motion.div
              key={f.id}
              role="listitem"
              layout="position"
              className="group/f relative shrink-0"
              initial={{ opacity: 0, scale: 0.86, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.16, ease: ease.out } }}
              transition={enter}
              aria-label={`${f.name}, ${f.status === 'uploading' ? `${Math.round(f.progress * 100)}% uploaded` : f.status === 'done' ? 'uploaded' : 'upload failed'}`}
            >
              {f.preview ? <Tile f={f} onRetry={onRetry} /> : <Doc f={f} onRetry={onRetry} />}
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => {
                  tap()
                  onRemove(f.id)
                }}
                className="ring-focus absolute -right-1.5 -top-1.5 z-10 flex size-5 scale-75 items-center justify-center rounded-full bg-ink text-surface opacity-0 shadow-[0_0_0_2px_var(--surface)] transition-[opacity,scale] duration-150 ease-out group-hover/f:scale-100 group-hover/f:opacity-100 focus-visible:scale-100 focus-visible:opacity-100"
              >
                <Close size={10} strokeWidth={3} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** An image: blurred and quiet while it uploads, with the sharp picture rising through it. */
function Tile({ f, onRetry }: { f: Upload; onRetry: (id: string) => void }) {
  const up = f.status === 'uploading'
  const bad = f.status === 'error'
  return (
    <div className="relative size-16 overflow-hidden rounded-[14px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]">
      <span aria-hidden className="absolute -inset-2 block" style={{ background: f.preview, filter: 'blur(7px) saturate(0.55)', opacity: 0.85 }} />
      <span
        aria-hidden
        className="absolute inset-0 block transition-[clip-path] duration-200 ease-linear"
        style={{ background: f.preview, clipPath: `inset(${bad ? 100 : (1 - f.progress) * 100}% 0 0 0)` }}
      />
      {/* The edge where the picture is sharp: a hairline of light that rises with it. */}
      {up && <span aria-hidden className="absolute inset-x-0 h-px bg-white/80 transition-[top] duration-200 ease-linear" style={{ top: `${(1 - f.progress) * 100}%` }} />}
      <AnimatePresence>
        {up && (
          <motion.span
            key="pct"
            className="tnum absolute bottom-1 left-1 rounded-full bg-black/45 px-1.5 text-[10px] font-medium leading-4 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {Math.round(f.progress * 100)}%
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bad && (
          <motion.button
            key="retry"
            type="button"
            aria-label={`Retry ${f.name}`}
            onClick={() => {
              tap()
              onRetry(f.id)
            }}
            className="ring-focus absolute inset-0 flex items-center justify-center text-white"
            style={{ background: 'color-mix(in oklch, var(--danger) 62%, transparent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Refresh size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A document: a card whose ground fills as it goes up, then settles to its kind and size. */
function Doc({ f, onRetry }: { f: Upload; onRetry: (id: string) => void }) {
  const up = f.status === 'uploading'
  const bad = f.status === 'error'
  return (
    <div className="relative flex h-16 w-[196px] items-center gap-3 overflow-hidden rounded-[14px] bg-surface-2 pl-3 pr-3.5">
      {/* The fill: a scale, not a width, so nothing lays out as it grows. */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left transition-[scale,background-color,opacity] duration-200 ease-linear"
        style={{ scale: `${bad ? 1 : f.progress} 1`, background: bad ? 'color-mix(in oklch, var(--danger) 12%, transparent)' : 'color-mix(in oklch, var(--accent) 11%, transparent)', opacity: up || bad ? 1 : 0 }}
      />
      <FileGlyph name={f.name} size={34} className="relative" />
      <span className="relative min-w-0 flex-1">
        <span className="block truncate text-callout font-medium text-ink">{f.name.replace(/\.[^.]+$/, '')}</span>
        <span className="relative mt-0.5 block h-4 text-caption">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={f.status}
              className="tnum absolute inset-0 flex items-center gap-1.5 whitespace-nowrap"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: ease.out }}
            >
              {up ? (
                <span className="text-ink-3">Uploading · {Math.round(f.progress * 100)}%</span>
              ) : bad ? (
                <>
                  <span className="text-danger">Didn’t upload</span>
                  <button
                    type="button"
                    onClick={() => {
                      tap()
                      onRetry(f.id)
                    }}
                    className="ring-focus rounded-[4px] font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-current"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <span className="text-ink-3">
                  {extOf(f.name)} · {sizeOf(f.size)}
                </span>
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </div>
  )
}
