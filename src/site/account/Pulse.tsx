'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { sendPulse, type PulseState } from '@/app/feedback/actions'
import type { Mood } from '@/lib/account/pulse-token'
import type { Piece, Pulse as Given } from '@/lib/account/pulse'
import { SMALL } from './Settings'

const MOODS: [Mood, string][] = [
  ['great', 'Loving it'],
  ['fine', 'It’s fine'],
  ['notyet', 'Not yet'],
]

const ASK: Record<Mood, { label: string; placeholder: string }> = {
  great: { label: 'What are you building with it?', placeholder: 'An analytics page for…' },
  fine: { label: 'What would make it great?', placeholder: 'I wish it had…' },
  notyet: { label: 'What’s in the way?', placeholder: 'I got stuck on…' },
}

const FIELD =
  'block min-h-[88px] w-full resize-y rounded-[10px] bg-surface px-3 py-2.5 text-[16px] leading-[1.5] text-ink outline-none shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[box-shadow] duration-150 placeholder:text-ink-3 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ink)_28%,transparent)] focus:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_70%,transparent),0_0_0_3px_color-mix(in_oklch,var(--accent)_16%,transparent)] sm:text-[14px]'

const LABEL = 'text-[14px] font-medium tracking-[-0.005em] text-ink'

export function Pulse({ token, start = null, pieces, given }: { token?: string; start?: Mood | null; pieces: Piece[]; given: Given | null }) {
  const reduce = useReducedMotion()
  const [mood, setMood] = useState<Mood | null>(start ?? given?.mood ?? null)
  const [favourite, setFavourite] = useState<string | null>(given?.favourite ?? null)
  const [text, setText] = useState(given?.text ?? '')
  const [share, setShare] = useState(given?.share ?? false)
  const [state, setState] = useState<PulseState>({})
  const [pending, run] = useTransition()
  const opened = useRef(false)

  const save = (fields: Record<string, string>) =>
    run(async () => {
      const form = new FormData()
      if (token) form.set('token', token)
      for (const [k, v] of Object.entries(fields)) form.set(k, v)
      setState(await sendPulse({}, form))
    })

  useEffect(() => {
    if (opened.current || !token || !start || start === given?.mood) return
    opened.current = true
    save({ mood: start })
  })

  const pick = (m: Mood) => {
    setMood(m)
    if (m !== 'great') setShare(false)
    save({ mood: m })
  }
  const choose = (id: string) => {
    setFavourite(id)
    save({ favourite: id })
  }

  const reveal = { initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const } }
  const note = state.saved === 'note'

  return (
    <div className="grid gap-7">
      <div className="grid gap-3">
        <p className={LABEL}>How’s Detent so far?</p>
        <div role="radiogroup" aria-label="How’s Detent so far?" className="grid grid-cols-3 gap-2">
          {MOODS.map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mood === m}
              onClick={() => pick(m)}
              className={`ring-focus h-10 rounded-[10px] text-[14px] font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97] ${mood === m ? 'bg-ink text-surface shadow-none' : 'bg-surface text-ink shadow-[0_0_0_1px_var(--line-strong)] hover:bg-surface-2'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mood && pieces.length > 0 && (
          <motion.div key="pieces" className="grid gap-3" {...reveal}>
            <p className={LABEL}>Which piece earned its place?</p>
            <div className="flex flex-wrap gap-2">
              {pieces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={favourite === p.id}
                  onClick={() => choose(p.id)}
                  className={`ring-focus h-8 rounded-full px-3 text-[13px] transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97] ${favourite === p.id ? 'bg-[color-mix(in_oklch,var(--accent)_12%,var(--surface))] text-ink shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_55%,transparent)]' : 'bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line-strong)] hover:text-ink'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {mood && (
          <motion.form
            key="note"
            className="grid gap-3"
            {...reveal}
            onSubmit={(e) => {
              e.preventDefault()
              save({ mood, text, ...(share ? { share: 'on' } : {}) })
            }}
          >
            <label htmlFor="pulse-text" className={LABEL}>
              {ASK[mood].label} <span className="font-normal text-ink-3">Optional</span>
            </label>
            <textarea id="pulse-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder={ASK[mood].placeholder} className={FIELD} />
            {mood === 'great' && (
              <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-ink-2">
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-[3px] size-4 shrink-0 accent-[var(--accent)]" />
                You can show this on detentui.com with my name
              </label>
            )}
            <div className="flex items-center justify-between gap-3">
              <span aria-live="polite" className={`text-[13px] ${state.error ? 'text-[var(--danger)]' : 'text-ink-3'}`}>
                {state.error ?? (note ? 'Got it. Thank you, genuinely.' : state.saved ? 'Saved. Add a line if you like.' : '')}
              </span>
              <button type="submit" disabled={pending || text.trim().length < 3} className={SMALL}>
                {pending ? 'Sending…' : note ? 'Update' : 'Send'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
