'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createKey, MAX_KEYS, removeKey } from '@/lib/account/keys'
import { currentEmail, endSession, linkEmail, normalEmail, sendLink, spendLink } from '@/lib/account/session'

export type LinkState = { sent?: string; error?: string; email?: string }
export type KeyState = { secret?: string; error?: string }

export async function askForLink(_: LinkState, form: FormData): Promise<LinkState> {
  const email = normalEmail(form.get('email'))
  if (!email) return { error: 'That doesn’t look like an email address.', email: String(form.get('email') ?? '') }
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  try {
    return (await sendLink(email, ip)) ? { sent: email } : { error: 'That’s a lot of links. Try again in an hour.', email }
  } catch (error) {
    console.error(error)
    return { error: 'Couldn’t send the email just now. Try again in a minute.', email }
  }
}

export async function peekLink(token: string) {
  return linkEmail(token)
}

export async function confirmLink(_: { error?: string }, form: FormData) {
  if (!(await spendLink(String(form.get('token') ?? '')))) return { error: 'This link has run out or was already used.' }
  redirect('/account')
}

export async function makeKey(_: KeyState, form: FormData): Promise<KeyState> {
  const email = await currentEmail()
  if (!email) redirect('/account')
  const secret = await createKey(email, String(form.get('name') ?? '').trim().slice(0, 40) || 'My key')
  if (!secret) return { error: `You can have ${MAX_KEYS} keys. Remove one first.` }
  revalidatePath('/account')
  return { secret }
}

export async function deleteKey(form: FormData) {
  const email = await currentEmail()
  if (!email) redirect('/account')
  await removeKey(email, String(form.get('id')))
  revalidatePath('/account')
}

export async function signOut() {
  await endSession()
  redirect('/account')
}
