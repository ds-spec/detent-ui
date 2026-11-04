export const NEXT = ['/account', '/checkout/pro', '/checkout/all', '/checkout/upgrade'] as const
export type Next = (typeof NEXT)[number]

export const safeNext = (value: unknown): Next => (NEXT as readonly string[]).includes(String(value)) ? (value as Next) : '/account'
