export type Promo = { code: string; price: number; off: string; ends: number }

export const PROMO: Promo | null = { code: 'DETENT20', price: 79, off: '20%', ends: Date.parse('2026-11-15T23:59:00+05:30') }
