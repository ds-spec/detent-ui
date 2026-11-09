import { ENTRIES } from './meta'

export type Latest = { href: string; text: string }

export function latest(room = 30): Latest {
  const [a, b] = ENTRIES.slice(-2).reverse()
  const both = b ? `${a.name} and ${b.name}` : a.name
  return { href: `/components/${a.id}`, text: both.length <= room ? both : a.name }
}
