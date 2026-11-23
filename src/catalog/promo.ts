export type Promo = { price: number; off: string; until: string; ends: number; name?: string }

export const PROMO: Promo | null = { name: 'Black Friday', price: 69, off: '30%', until: 'Dec 1', ends: Date.parse('2026-12-01T23:59:00+05:30') }

export const promoLive = (promo: Promo | null, now = Date.now()): promo is Promo => !!promo && now < promo.ends
