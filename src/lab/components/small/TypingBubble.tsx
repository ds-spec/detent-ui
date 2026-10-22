'use client'

import { useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useStack } from '../../lib/hooks'
import { Morph } from '../../ui/Morph'
import { Orb } from '../../ui/Orb'

export type Line = { id: string; from: 'me' | 'agent'; text: string; typing?: boolean }

const spring = { type: 'spring', stiffness: 420, damping: 34 } as const

/**
 * A conversation where the reply grows out of its own typing bubble. The dots sit in a bubble
 * with the two small trailing circles messages are known by; when the words are ready, the
 * circles tuck away and the same bubble springs open to the reply's measured size, and the
 * words arrive one after another inside it. Your messages are the accent; theirs are paper,
 * beside their orb. Your last message says Read the moment they start to answer.
 *
 * The thread hangs from the bottom and older lines rise and fade at the top, so it never jumps.
 */
export function TypingBubble({
  lines,
  agent = { name: 'Detent', hue: 310 },
}: {
  /** The conversation, oldest first. A line marked typing shows the dots until its text arrives. */
  lines: Line[]
  /** Who's answering: their name, for screen readers, and the hue of their orb, or an avatar of your own, 28px round. */
  agent?: { name: string; hue?: number; avatar?: ReactNode }
}) {
  const stack = useRef<HTMLDivElement>(null)
  useStack(stack, 6)
  const reduce = useReducedMotion()
  const lastMe = lines.findLastIndex((l) => l.from === 'me')
  const answering = lines.slice(lastMe + 1).some((l) => l.from === 'agent')
  return (
    <div className="relative h-[340px] w-[372px] max-w-full overflow-hidden" role="log" aria-live="polite">
      {/* A plain fade at the top, not a mask, so moving lines don't recomposite under it. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-14 bg-gradient-to-b from-surface to-transparent" />
      <div ref={stack} className="absolute inset-x-0 top-full flex -translate-y-full flex-col gap-1.5 pb-3">
        <AnimatePresence initial={false}>
          {lines.map((l, i) => {
            const mine = l.from === 'me'
            // Their orb sits beside the last of their lines in a run, the way messages group.
            const tail = !mine && lines[i + 1]?.from !== 'agent'
            const gap = i > 0 && lines[i - 1].from !== l.from
            return (
              <motion.div
                key={l.id}
                layout="position"
                className={`flex items-end gap-2 ${mine ? 'origin-bottom-right justify-end' : 'origin-bottom-left justify-start'} ${gap ? 'mt-2.5' : ''}`}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={spring}
              >
                {mine ? (
                  <div className="flex flex-col items-end">
                    <p className="max-w-[268px] rounded-[20px] rounded-br-[6px] bg-[var(--accent)] px-3.5 py-2.5 text-body leading-5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]">{l.text}</p>
                    {/* One line held under your last message, for when they've read it. */}
                    {i === lastMe && (
                      <span className="relative mt-1 h-4 pr-1 text-caption text-ink-3">
                        <AnimatePresence>
                          {answering && (
                            <motion.span key="read" className="block" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                              Read
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="mb-0.5 flex size-7 shrink-0 items-end">{tail && (agent.avatar ?? <Orb seed={agent.name} hue={agent.hue} size={28} />)}</span>
                    <div className="relative">
                      <Morph
                        view={l.typing ? 'typing' : 'text'}
                        anchor="bottom"
                        justify="start"
                        radius={20}
                        className="rounded-bl-[6px] bg-surface-2"
                        views={{
                          typing: (
                            <span className="flex h-10 items-center gap-[5px] px-4" aria-label={`${agent.name} is typing`}>
                              {[0, 1, 2].map((d) => (
                                <motion.span
                                  key={d}
                                  className="size-2 rounded-full bg-ink-3"
                                  animate={reduce ? undefined : { y: [0, -3.5, 0], opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: d * 0.16, ease: 'easeInOut' }}
                                />
                              ))}
                            </span>
                          ),
                          text: (
                            <p className="block w-max max-w-[268px] px-3.5 py-2.5 text-body leading-5 text-ink">
                              {l.text.split(' ').map((w, j) => (
                                <span key={j} className={reduce ? undefined : 'word-in'} style={reduce ? undefined : { animationDelay: `${120 + j * 22}ms` }}>
                                  {j > 0 && ' '}
                                  {w}
                                </span>
                              ))}
                            </p>
                          ),
                        }}
                      />
                      {/* The trailing circles of a typing bubble, tucked away when the words arrive. */}
                      <AnimatePresence>
                        {l.typing && (
                          <motion.span key="tail" aria-hidden className="absolute -bottom-1 -left-1.5 block" exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.16 } }} style={{ transformOrigin: '100% 0%' }}>
                            <span className="absolute -left-1 top-1 block size-[5px] rounded-full bg-surface-2" />
                            <span className="block size-[9px] rounded-full bg-surface-2" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
