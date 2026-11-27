export type Promo = { price: number; off: string; until: string; ends: number; name?: string }

export const REGIONAL: Record<string, { price: number; off: string; name: string }> = {
  IN: { price: 59, off: '40%', name: 'India price' },
}

export const PROMO: Promo | null = { name: 'Black Friday', price: 69, off: '30%', until: 'Nov 30', ends: Date.parse('2026-11-30T23:59:00-08:00') }

export const promoLive = (promo: Promo | null, now = Date.now()): promo is Promo => !!promo && now < promo.ends
