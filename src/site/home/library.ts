import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'

export type LibItem = { id: string; name: string; line: string; family: string; pro: boolean; bleed?: boolean }

export const libraryIndex = (): LibItem[] =>
  CATEGORIES.flatMap((c) => ENTRIES.filter((e) => e.category === c.id).map((e) => ({ id: e.id, name: e.name, line: e.short ?? e.line, family: c.name, pro: isProComponent(e.id), bleed: e.bleed })))
