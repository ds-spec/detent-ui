'use client'

import { useActionState } from 'react'
import { sendFeedback, type FeedbackState } from '@/app/account/actions'
import type { Feedback } from '@/lib/account/keys'
import { SettingsCard, SMALL } from './Settings'

const FIELD =
  'block min-h-[96px] w-full resize-y rounded-[10px] bg-surface px-3 py-2.5 text-[16px] leading-[1.5] text-ink outline-none shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[box-shadow] duration-150 placeholder:text-ink-3 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ink)_28%,transparent)] focus:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_70%,transparent),0_0_0_3px_color-mix(in_oklch,var(--accent)_16%,transparent)] sm:text-[14px]'

export function FeedbackCard({ given }: { given: Feedback | null }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedback, {})
  const sent = state.saved || (given && !state.error)
  return (
    <SettingsCard
      id="feedback"
      title="How’s Detent working for you?"
      line="A line or two is plenty: what you built with it, what you’d change, anything. It goes straight to the person who made it."
      foot={state.error ? <span className="text-[var(--danger)]">{state.error}</span> : sent ? 'Thank you. You can change it any time.' : 'Private unless you tick the box.'}
      action={
        <button type="submit" form="feedback-form" disabled={pending} className={SMALL}>
          {pending ? 'Sending…' : given ? 'Update' : 'Send'}
        </button>
      }
    >
      <form id="feedback-form" action={action} className="grid gap-3">
        <label htmlFor="feedback-text" className="sr-only">
          Your feedback
        </label>
        <textarea id="feedback-text" name="text" required minLength={3} maxLength={600} defaultValue={given?.text ?? ''} placeholder="I used the onboarding block in…" className={FIELD} />
        <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-ink-2">
          <input type="checkbox" name="share" defaultChecked={given?.share ?? false} className="mt-[3px] size-4 shrink-0 accent-[var(--accent)]" />
          You can show this on detentui.com with my name
        </label>
      </form>
    </SettingsCard>
  )
}
