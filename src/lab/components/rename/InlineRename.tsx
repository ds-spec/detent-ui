'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Check, Pencil } from '../../icons'
import { ease } from '../../lib/motion'
import { Spinner } from '../../ui/Spinner'

type Status = 'idle' | 'saving' | 'saved'
/** For demos and tests: rename without touching focus. The selection is drawn instead of real. */
export type RenameHandle = { edit(): void; type(text: string): void; commit(): void; cancel(): void }

/**
 * Rename in place. The text becomes a field without moving a single pixel: same font, same
 * spot, the field drawn around it. File extensions stay put as a faint suffix while only the
 * name is selected, the way a file manager does it. Enter saves (with a spinner, then a
 * check), Escape puts the old name back, and a bad name shakes once and says why.
 *
 * It inherits its typography, so it works for a page title as well as a row in a list.
 */
export function InlineRename({
  value,
  onRename,
  validate,
  keepExtension = false,
  activate = 'click',
  label = 'Name',
  className = '',
  ref,
}: {
  /** The current name. */
  value: string
  /** Return a promise to show saving; reject it to roll back. */
  onRename: (next: string) => Promise<unknown> | void
  /** Return a message to block the name, or null to allow it. */
  validate?: (next: string) => string | null
  /** Edit the name but not its extension: the selection stops at the dot. */
  keepExtension?: boolean
  /** Start editing on one click or on a double click. */
  activate?: 'click' | 'double-click'
  /** What's being renamed, for screen readers. */
  label?: string
  /** Added to the name as it's shown. */
  className?: string
  ref?: Ref<RenameHandle>
}) {
  const [shown, setShown] = useState(value)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [w, setW] = useState(0)
  // Driven from code: no focus is taken, so the name's selection is painted rather than real.
  const [driven, setDriven] = useState(false)
  const [painted, setPainted] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const mirror = useRef<HTMLSpanElement>(null)
  const settled = useRef(false)
  const timer = useRef(0)
  const shake = useAnimationControls()
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!editing && status === 'idle') setShown(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  useEffect(() => () => clearTimeout(timer.current), [])

  const dot = keepExtension ? shown.lastIndexOf('.') : -1
  const base = dot > 0 ? shown.slice(0, dot) : shown
  const ext = dot > 0 ? shown.slice(dot) : ''

  const begin = (quiet = false) => {
    if (status === 'saving') return
    settled.current = false
    setDraft(base)
    setError(null)
    setDriven(quiet)
    setPainted(quiet)
    setEditing(true)
  }

  // Focus and select the name (not the extension) as the field appears.
  useLayoutEffect(() => {
    const el = input.current
    if (!editing || !el || driven) return
    el.focus()
    const cut = keepExtension ? el.value.length : el.value.lastIndexOf('.')
    el.setSelectionRange(0, cut > 0 ? cut : el.value.length)
  }, [editing, keepExtension, driven])

  // The field is exactly as wide as its text, measured from an invisible copy.
  useLayoutEffect(() => {
    if (mirror.current) setW(mirror.current.offsetWidth)
  }, [draft, editing])

  const fail = (message: string) => {
    setError(message)
    if (!reduce) shake.start({ x: [0, -5, 4, -3, 2, 0], transition: { duration: 0.32, ease: ease.out } })
    if (!driven) input.current?.focus()
  }

  const cancel = () => {
    settled.current = true
    setEditing(false)
    setError(null)
  }

  const commit = async () => {
    const name = draft.trim()
    const next = name + ext
    if (!name) return fail('Give it a name first')
    if (next === shown) return cancel()
    const problem = validate?.(next)
    if (problem) return fail(problem)

    settled.current = true
    const before = shown
    setShown(next)
    setEditing(false)
    setError(null)
    clearTimeout(timer.current)
    const result = onRename(next)
    if (result instanceof Promise) {
      setStatus('saving')
      try {
        await result
      } catch {
        setShown(before)
        setStatus('idle')
        setError('Couldn’t rename. Try again.')
        timer.current = window.setTimeout(() => setError(null), 2600)
        return
      }
    }
    setStatus('saved')
    timer.current = window.setTimeout(() => setStatus('idle'), 1400)
  }

  const latest = useRef({ commit, cancel })
  useLayoutEffect(() => {
    latest.current = { commit, cancel }
  })
  useImperativeHandle(ref, () => ({
    edit: () => begin(true),
    type: (text) => {
      setPainted(false)
      setDraft(text)
      setError(null)
    },
    commit: () => latest.current.commit(),
    cancel: () => latest.current.cancel(),
  }))

  const ring = error ? 'var(--elev-field-error)' : 'var(--elev-field)'

  return (
    <span className={`group/rename relative inline-flex min-w-0 max-w-full align-top ${className}`}>
      {/* The field is drawn around the text with negative insets, so the text itself never moves. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-x-1.5 -inset-y-0.5 rounded-[8px] transition-[background-color,box-shadow] duration-150 ${editing ? 'bg-surface' : 'group-hover/rename:bg-surface-2 group-focus-within/rename:bg-surface-2'}`}
        style={{ boxShadow: editing ? ring : 'none' }}
      />

      <motion.span animate={shake} className="relative flex min-w-0 max-w-full">
        {editing ? (
          <span className="relative flex min-w-0 max-w-full items-baseline">
            {/* The name's selection, painted when the rename was started from code. */}
            {painted && <span aria-hidden className="absolute left-0 top-0 h-[1lh] rounded-[2px]" style={{ width: w, background: 'color-mix(in oklch, var(--accent) 24%, transparent)' }} />}
            <input
              ref={input}
              value={draft}
              aria-label={label}
              aria-invalid={!!error}
              onChange={(e) => {
                setPainted(false)
                setDraft(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  cancel()
                }
              }}
              onBlur={() => {
                if (settled.current) return
                // Leaving with a bad name quietly puts the old one back.
                if (error || !draft.trim()) cancel()
                else commit()
              }}
              spellCheck={false}
              className="relative m-0 block h-[1lh] min-w-[2px] max-w-full bg-transparent p-0 outline-none"
              style={{ width: w + 1 }}
            />
            {ext && <span className="shrink-0 select-none text-ink-3">{ext}</span>}
          </span>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.button
              key={shown}
              type="button"
              aria-label={`${label}: ${shown}. ${activate === 'click' ? 'Click' : 'Double-click'} to rename`}
              onClick={activate === 'click' ? () => begin() : undefined}
              onDoubleClick={activate === 'double-click' ? () => begin() : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'F2') {
                  e.preventDefault()
                  begin()
                }
              }}
              className="block max-w-full cursor-text truncate text-left outline-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: ease.out }}
            >
              {shown}
            </motion.button>
          </AnimatePresence>
        )}
      </motion.span>

      <span ref={mirror} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-pre">
        {draft || ' '}
      </span>

      {/* After the text, floating: the pencil on hover, then saving and saved. */}
      <span className="pointer-events-none absolute left-full top-1/2 ml-2.5 flex h-5 -translate-y-1/2 items-center">
        <AnimatePresence initial={false} mode="popLayout">
          {status === 'saving' ? (
            <motion.span key="saving" className="flex text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Spinner size={14} />
            </motion.span>
          ) : status === 'saved' ? (
            <motion.span
              key="saved"
              className="flex items-center gap-1.5 whitespace-nowrap text-footnote font-normal tracking-normal text-ink-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.2 }}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-ok text-white">
                <Check size={10} strokeWidth={3.2} />
              </span>
              Saved
            </motion.span>
          ) : (
            !editing && (
              <motion.span key="pencil" className="flex text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="flex opacity-0 transition-opacity duration-150 group-hover/rename:opacity-100">
                  <Pencil size={14} />
                </span>
              </motion.span>
            )
          )}
        </AnimatePresence>
      </span>

      <AnimatePresence>
        {error && (
          <motion.span
            role="alert"
            className="absolute -left-1.5 top-[calc(100%+8px)] z-10 whitespace-nowrap rounded-[8px] bg-surface px-2.5 py-1.5 text-footnote font-normal leading-4 tracking-normal text-danger shadow-float"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: ease.out }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
