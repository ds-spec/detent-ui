'use client'

import { useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Roll } from '../../ui/Roll'

const CSS = `
@property --announce-spin { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.announce-ring { position:absolute; inset:0; border-radius:inherit; padding:1px; pointer-events:none; opacity:0; transition:opacity .3s; background:conic-gradient(from var(--announce-spin), transparent 0 68%, currentColor 88%, transparent 100%); -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; }
.announce:hover .announce-ring, .announce:focus-within .announce-ring { opacity:.75; animation:announce-run 1.8s cubic-bezier(.6,0,.3,1) both; }
@keyframes announce-run { to { --announce-spin:360deg } }
@media (prefers-reduced-motion: reduce) { .announce:hover .announce-ring, .announce:focus-within .announce-ring { animation:none; opacity:0 } }
`

export type AnnouncementProps = {
  /** What it says. */
  children: ReactNode
  href: string
  /** The word in the tag, which rolls to `action` when you reach for it. */
  tag?: string
  action?: string
  /** Show a close button. Pair it with `onDismiss` to remember the choice. */
  dismissible?: boolean
  onDismiss?: () => void
  /** Your router's link, if it has one. */
  linkAs?: ElementType
  className?: string
}

/** The "New" pill above a headline. A line of light runs round its edge once when you reach for it, and the tag says what pressing it will do. */
export function Announcement({ children, href, tag = 'New', action = 'View', dismissible = false, onDismiss, linkAs: Link = 'a', className = '' }: AnnouncementProps) {
  const [near, setNear] = useState(false)
  const [gone, setGone] = useState(false)
  return (
    <>
      <style>{CSS}</style>
      <AnimatePresence initial={false}>
        {!gone && (
          <motion.div
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
            onPointerEnter={() => setNear(true)}
            onPointerLeave={() => setNear(false)}
            className={`announce relative inline-flex h-9 max-w-full items-center rounded-full bg-surface pl-1 text-[14px] font-medium text-ink shadow-raised ${dismissible ? '' : 'pr-1'} ${className}`}
          >
            <span aria-hidden className="announce-ring" />
            <Link href={href} onFocus={() => setNear(true)} onBlur={() => setNear(false)} className="ring-focus flex min-w-0 items-center gap-2 rounded-full pr-3">
              <span className="grid h-7 shrink-0 place-items-center rounded-full bg-ink px-2.5 text-[13px] text-surface">
                <Roll word={near ? action : tag} />
              </span>
              <span className="truncate">{children}</span>
            </Link>
            {dismissible && (
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => {
                  setGone(true)
                  onDismiss?.()
                }}
                className="ring-focus mr-1 grid size-7 shrink-0 place-items-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                </svg>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
