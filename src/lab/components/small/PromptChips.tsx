'use client'

import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ArrowUp, Orbit } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'

/** For demos and tests: pick a suggestion and send, without touching focus. */
export type ChipsHandle = { pick(i: number): void; send(): void }

/**
 * Suggestions that fly into the box. Pick one and its words travel from the chip into the
 * field, landing where you'd have typed them, while the other suggestions step aside. Send
 * lifts the words away and the suggestions come back. The box never changes size.
 */
export function PromptChips({ suggestions, onSend, width = 380, ref }: {
  /** The prompts to offer, a chip each. */
  suggestions: string[]
  /** Called with a chip's prompt when a person sends it. */
  onSend?: (text: string) => void
  /** The box's width, in pixels. */
  width?: number
  ref?: Ref<ChipsHandle>
}) {
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  const [sent, setSent] = useState<{ id: number; text: string } | null>(null)
  // Each send starts a fresh flight, so a suggestion coming back doesn't fly out of the field.
  const [gen, setGen] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const pick = (i: number) => {
    setPicked(i)
    setText(suggestions[i])
  }
  const send = () => {
    if (!text.trim()) return
    onSend?.(text)
    setSent({ id: Date.now(), text })
    setText('')
    setPicked(null)
    setGen((g) => g + 1)
  }
  const latest = useRef({ pick, send })
  useLayoutEffect(() => {
    latest.current = { pick, send }
  })
  useImperativeHandle(ref, () => ({ pick: (i) => latest.current.pick(i), send: () => latest.current.send() }), [])

  return (
    <LayoutGroup>
      <div style={{ width, maxWidth: '100%' }}>
        <div className="mb-3.5 flex h-[92px] flex-wrap content-end justify-center gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {suggestions.map((s, i) =>
              picked === i ? null : (
                <motion.button
                  key={s}
                  layout="position"
                  type="button"
                  data-invite={i === 0 || undefined}
                  whileTap={press}
                  onPointerDown={tap}
                  onClick={() => {
                    pick(i)
                    input.current?.focus()
                  }}
                  className="sink ring-focus flex h-10 items-center gap-2 rounded-full bg-surface pl-3.5 pr-4 text-callout text-ink-2 shadow-raised transition-colors hover:text-ink"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: picked === null ? 1 : 0.55, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.25, ease: ease.out, delay: picked === null ? i * 0.04 : 0, layout: { type: 'spring', stiffness: 420, damping: 36 } }}
                >
                  <Orbit size={13} className="shrink-0 text-[var(--accent)]" />
                  <motion.span layoutId={`chip-${gen}-${s}`} className="block whitespace-nowrap" transition={{ type: 'spring', stiffness: 360, damping: 32 }}>
                    {s}
                  </motion.span>
                </motion.button>
              ),
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex h-16 items-center gap-2 rounded-[32px] bg-surface pl-6 pr-2.5 shadow-float">
          <div className="relative h-6 min-w-0 flex-1">
            {/* The chosen words travel here from their chip; the field takes over once they land. */}
            {picked !== null ? (
              <motion.span layoutId={`chip-${gen}-${suggestions[picked]}`} className="absolute left-0 top-0 block whitespace-nowrap text-body leading-6 text-ink" transition={{ type: 'spring', stiffness: 360, damping: 32 }}>
                {text}
              </motion.span>
            ) : null}
            <input
              ref={input}
              value={text}
              onChange={(e) => {
                setPicked(null)
                setText(e.target.value)
              }}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={picked === null ? 'Ask anything' : ''}
              aria-label="Message"
              className={`absolute inset-0 w-full bg-transparent text-body leading-6 outline-none placeholder:text-ink-3 ${picked !== null ? 'text-transparent caret-ink' : 'text-ink'}`}
            />
            <AnimatePresence>
              {sent && (
                <motion.span
                  key={sent.id}
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-body leading-6 text-ink"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.4, ease: ease.out }}
                  onAnimationComplete={() => setSent(null)}
                >
                  {sent.text}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            type="button"
            aria-label="Send"
            whileTap={text ? press : undefined}
            disabled={!text}
            onPointerDown={() => text && tap()}
            onClick={send}
            className="sink ring-focus flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200"
            style={{ background: text ? 'var(--ink)' : 'var(--surface-2)', color: text ? 'var(--surface)' : 'var(--ink-3)' }}
          >
            <ArrowUp size={18} />
          </motion.button>
        </div>
      </div>
    </LayoutGroup>
  )
}
