'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAPIError } from 'better-auth/api'
import { getAuth, socialProviders, type Provider } from '@/lib/account/auth'
import { createKey, MAX_KEYS, removeKey } from '@/lib/account/keys'
import { safeNext } from '@/lib/account/next'
import { currentEmail, endSession, normalEmail } from '@/lib/account/session'

export type LinkState = { sent?: string; error?: string; email?: string }
export type KeyState = { secret?: string; error?: string }

export async function askForLink(_: LinkState, form: FormData): Promise<LinkState> {
  const email = normalEmail(form.get('email'))
  if (!email) return { error: 'That doesn’t look like an email address.', email: String(form.get('email') ?? '') }
  try {
    await (await getAuth()).api.signInMagicLink({ body: { email, callbackURL: safeNext(form.get('next')), errorCallbackURL: '/account/confirm' }, headers: await headers() })
    return { sent: email }
  } catch (error) {
    if (isAPIError(error) && error.statusCode === 429) return { error: 'That’s a lot of links. Try again in an hour.', email }
    console.error(error)
    return { error: 'Couldn’t send the email just now. Try again in a minute.', email }
  }
}

export async function signInWith(form: FormData) {
  const provider = String(form.get('provider')) as Provider
  if (!(provider in socialProviders())) redirect('/account')
  const next = safeNext(form.get('next'))
  const { url } = await (await getAuth()).api.signInSocial({ body: { provider, callbackURL: next, errorCallbackURL: next === '/account' ? '/account' : `/account?next=${next}` }, headers: await headers() })
  redirect(url ?? '/account')
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

export async function signOutHere() {
  await endSession()
}
