/*
 * Where signing in may send someone afterwards. Only these paths, so a crafted link can't use sign-in
 * to send a person somewhere else.
 */
export const NEXT = ['/account', '/checkout/pro', '/checkout/all'] as const
export type Next = (typeof NEXT)[number]

export const safeNext = (value: unknown): Next => (NEXT as readonly string[]).includes(String(value)) ? (value as Next) : '/account'
