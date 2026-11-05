'use client'

import { useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useReducedMotion } from 'motion/react'
import { useStack } from '../../lib/hooks'
import { Morph } from '../../ui/Morph'
import { Orb } from '../../ui/Orb'

export type Line = { id: string; from: 'me' | 'agent'; text: string; typing?: boolean }

const spring = { type: 'spring', stiffness: 420, damping: 34 } as const

function Dots({ seed, still }: { seed: string; still: boolean }) {
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const s = useRef({ t: 0, phase: 0, amp: 0 })
  const hash = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)
  const beats = [900 + (hash & 0x1ff), 340 + ((hash >> 9) & 0xff), 650 + ((hash >> 17) & 0x1ff), 520 + ((hash >> 3) & 0xff)]
  useAnimationFrame((_, delta) => {
    if (still) return
    const st = s.current
    st.t += delta
    const cycle = beats.reduce((a, b) => a + b, 0)
    let at = st.t % cycle
    let typing = true
    for (let i = 0; i < beats.length; i++) {
      if (at < beats[i]) {
        typing = i % 2 === 0
        break
      }
      at -= beats[i]
    }
    st.amp += ((typing ? 1 : 0) - st.amp) * Math.min(1, delta / (typing ? 90 : 260))
    st.phase += (delta / 1000) * Math.PI * 2 * 1.6 * (0.35 + 0.65 * st.amp)
    dots.current.forEach((el, d) => {
      if (!el) return
      const v = st.amp * (0.5 + 0.5 * Math.sin(st.phase - d * 0.95))
      el.style.opacity = String(0.38 + 0.62 * v)
      el.style.transform = `translateY(${(-2.5 * v).toFixed(2)}px)`
    })
  })
  return (
    <>
      {[0, 1, 2].map((d) => (
        <span
          key={d}
          ref={(el) => {
            dots.current[d] = el
          }}
          className="size-[7px] rounded-full bg-ink-2"
          style={{ opacity: 0.38 }}
        />
      ))}
    </>
  )
}

export function TypingBubble({
  lines,
  agent = { name: 'Detent', hue: 310 },
  readAt,
}: {
  lines: Line[]
  agent?: { name: string; hue?: number; avatar?: ReactNode }
  readAt?: string
}) {
  const stack = useRef<HTMLDivElement>(null)
  useStack(stack, 6)
  const reduce = useReducedMotion()
  const lastMe = lines.findLastIndex((l) => l.from === 'me')
  const answering = lines.slice(lastMe + 1).some((l) => l.from === 'agent')
  return (
    <div className="relative h-[340px] w-[372px] max-w-full overflow-hidden" role="log" aria-live="polite">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-14 bg-gradient-to-b from-surface to-transparent" />
      <div ref={stack} className="absolute inset-x-0 top-full flex -translate-y-full flex-col gap-1.5 pb-3">
        <AnimatePresence initial={false}>
          {lines.map((l, i) => {
            const mine = l.from === 'me'
            const tail = !mine && lines[i + 1]?.from !== 'agent'
            const gap = i > 0 && lines[i - 1].from !== l.from
            return (
              <motion.div
                key={l.id}
                layout="position"
                className={`flex items-end gap-2 ${mine ? 'origin-bottom-right justify-end' : 'origin-bottom-left justify-start'} ${gap ? 'pt-2.5' : ''}`}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={spring}
              >
                {mine ? (
                  <div className="flex flex-col items-end">
                    <p className="max-w-[268px] rounded-[20px] rounded-br-[6px] bg-[light-dark(var(--ink),var(--surface-3))] px-3.5 py-2.5 text-body leading-5 text-[light-dark(var(--surface),var(--ink))]">{l.text}</p>
                    {i === lastMe && (
                      <span className="relative mt-1 h-4 pr-1 text-caption text-ink-3">
                        <AnimatePresence>
                          {answering && (
                            <motion.span key="read" className="block" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                              <span className="text-ink-2">Read</span>
                              {readAt && <span className="tnum"> {readAt}</span>}
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
                            <span className="flex h-10 items-center gap-[5px] px-[15px]" aria-label={`${agent.name} is typing`}>
                              <Dots seed={l.id} still={!!reduce} />
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
