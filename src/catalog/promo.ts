export type Promo = { price: number; off: string; until: string; ends: number }

export const PROMO: Promo | null = null

export const promoLive = (promo: Promo | null, now = Date.now()): promo is Promo => !!promo && now < promo.ends
