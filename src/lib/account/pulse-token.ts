import { createHmac, timingSafeEqual } from 'node:crypto'

export const MOODS = ['great', 'fine', 'notyet'] as const
export type Mood = (typeof MOODS)[number]
export const isMood = (v: unknown): v is Mood => typeof v === 'string' && (MOODS as readonly string[]).includes(v)

const sign = (orderId: string, secret: string) => createHmac('sha256', secret).update(`pulse:${orderId}`).digest('base64url').slice(0, 24)

export function pulseToken(orderId: string, secret = process.env.BETTER_AUTH_SECRET ?? '') {
  if (!secret) throw new Error('BETTER_AUTH_SECRET isn’t set')
  return `${Buffer.from(orderId).toString('base64url')}.${sign(orderId, secret)}`
}

export function orderOfToken(token: string, secret = process.env.BETTER_AUTH_SECRET ?? '') {
  const [id, mac] = token.split('.')
  if (!id || !mac || !secret) return null
  const orderId = Buffer.from(id, 'base64url').toString()
  const want = Buffer.from(sign(orderId, secret))
  const given = Buffer.from(mac)
  return want.length === given.length && timingSafeEqual(want, given) ? orderId : null
}
