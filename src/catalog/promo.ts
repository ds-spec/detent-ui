export type Promo = { price: number; off: string; until: string; ends: number }

export const PROMO: Promo | null = { price: 79, off: '20%', until: 'Nov 15', ends: Date.parse('2026-11-15T23:59:00+05:30') }
