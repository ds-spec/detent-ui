'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Check } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press, spring } from '../../lib/motion'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { Dialog } from './Dialog'
import type { DialogHandle } from './Dialog'

export type ConfirmHandle = DialogHandle & { type(text: string): void; confirm(): void }

type Phase = 'idle' | 'busy' | 'done'

export function Confirm({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  doneLabel = 'Deleted',
  cancelLabel = 'Cancel',
  require,
  onConfirm,
  ref,
}: {
  trigger?: ReactNode
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  doneLabel?: string
  cancelLabel?: string
  require?: string
  onConfirm?: () => void | Promise<void>
  ref?: Ref<ConfirmHandle>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const dialog = useRef<DialogHandle>(null)
  const field = useRef<HTMLInputElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const shake = useAnimationControls()
  const reduce = useReducedMotion()
  const done = useRef(0)

  let matched = 0
  if (require) while (matched < text.length && matched < require.length && text[matched] === require[matched]) matched++
  const wrong = !!require && text.length > matched
  const ready = !require || text === require
  const fillTo = require ? matched / require.length : 1

  useEffect(() => () => clearTimeout(done.current), [])

  const change = (next: string) => {
    const before = text
    setText(next)
    let m = 0
    if (require) while (m < next.length && m < require.length && next[m] === require[m]) m++
    if (require && next.length > before.length && next.length > m && before.length <= m && !reduce) shake.start({ x: [0, -5, 4, -2, 0], transition: { duration: 0.28, ease: ease.out } })
  }

  const go = async () => {
    if (!ready || phase !== 'idle') return
    setPhase('busy')
    await Promise.all([onConfirm?.(), new Promise((r) => setTimeout(r, 900))])
    setPhase('done')
    done.current = window.setTimeout(() => setOpen(false), 900)
  }

  useImperativeHandle(ref, () => ({
    open: () => dialog.current?.open(),
    close: () => setOpen(false),
    type: (t) => change(t),
    confirm: () => go(),
  }))

  return (
    <Dialog
      ref={dialog}
      trigger={trigger}
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) {
          setText('')
          setPhase('idle')
        }
      }}
      size="sm"
      title={title}
      description={description}
      initialFocus={require ? field : cancel}
      footer={
        <>
          <Button ref={cancel} variant="secondary" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <motion.button
            type="button"
            whileTap={ready && phase === 'idle' ? press : undefined}
            aria-disabled={!ready}
            onPointerDown={() => ready && tap()}
            onClick={go}
            className={`ring-focus relative grid h-9 overflow-hidden rounded-control px-3.5 text-callout font-medium transition-[color,background-color,box-shadow] duration-200 ${ready ? 'bg-danger text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16)]' : 'bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] text-danger'}`}
          >
            {require && <motion.span aria-hidden className="absolute inset-y-0 left-0 bg-[color-mix(in_oklch,var(--danger)_16%,transparent)]" initial={false} animate={{ width: ready ? '100%' : `${fillTo * 100}%`, opacity: ready ? 0 : 1 }} transition={spring.smooth} />}
            {(['idle', 'busy', 'done'] as Phase[]).map((p) => (
              <span key={p} className={`relative col-start-1 row-start-1 flex items-center justify-center gap-1.5 transition-[opacity,transform] duration-200 ${p === phase ? '' : p === 'idle' ? '-translate-y-1 opacity-0' : 'translate-y-1 opacity-0'}`} aria-hidden={p !== phase}>
                {p === 'idle' && confirmLabel}
                {p === 'busy' && <Spinner size={15} />}
                {p === 'done' && (
                  <>
                    <Check size={15} /> {doneLabel}
                  </>
                )}
              </span>
            ))}
          </motion.button>
        </>
      }
    >
      {require && (
        <label className="block">
          <span className="text-footnote text-ink-2">
            Type <span className="rounded-[5px] bg-surface-2 px-1 font-mono text-ink">{require}</span> to confirm.
          </span>
          <motion.span animate={shake} className="mt-2 block">
            <input
              ref={field}
              value={text}
              onChange={(e) => change(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && go()}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={wrong}
              className={`h-10 w-full rounded-control bg-surface px-3 font-mono text-callout text-ink outline-none transition-shadow duration-200 placeholder:text-ink-3 ${wrong ? 'shadow-field-error' : 'shadow-[0_0_0_1px_var(--line-strong)] focus:shadow-field'}`}
              placeholder={require}
            />
          </motion.span>
        </label>
      )}
    </Dialog>
  )
}
