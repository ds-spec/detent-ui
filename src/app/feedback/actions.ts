'use server'

import { revalidatePath } from 'next/cache'
import { purchaseFor } from '@/lib/account/keys'
import { emailOfToken, savePulse } from '@/lib/account/pulse'
import { isMood } from '@/lib/account/pulse-token'
import { currentEmail } from '@/lib/account/session'

export type PulseState = { saved?: 'mood' | 'favourite' | 'note'; error?: string }

export async function sendPulse(_: PulseState, form: FormData): Promise<PulseState> {
  const token = form.get('token')
  const email = typeof token === 'string' && token ? await emailOfToken(token) : await currentEmail()
  if (!email) return { error: 'This link has run out. Sign in at detentui.com/account and it’s there too.' }
  if (!token && !(await purchaseFor(email))) return { error: 'This opens once Pro is on your account.' }

  const mood = form.get('mood')
  const favourite = form.get('favourite')
  const text = form.get('text')
  if (typeof text === 'string') {
    if (text.trim().length < 3) return { error: 'Write a few words first.' }
    await savePulse(email, { mood: isMood(mood) ? mood : undefined, text, share: form.get('share') === 'on' })
    revalidatePath('/account')
    return { saved: 'note' }
  }
  if (typeof favourite === 'string' && favourite) {
    await savePulse(email, { favourite: favourite.slice(0, 64) })
    return { saved: 'favourite' }
  }
  if (isMood(mood)) {
    await savePulse(email, { mood })
    return { saved: 'mood' }
  }
  return { error: 'Pick one first.' }
}
