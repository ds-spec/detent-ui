import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'

/**
 * The library as the home page needs it: each component's name, line and family, and whether
 * it's Pro, in catalogue order. Built on the server and handed down as props, so the home page
 * never ships the full catalogue (every key, prop and long description) to the browser.
 * Client files import only the type from here.
 */
export type LibItem = { id: string; name: string; line: string; family: string; pro: boolean }

export const libraryIndex = (): LibItem[] =>
  CATEGORIES.flatMap((c) => ENTRIES.filter((e) => e.category === c.id).map((e) => ({ id: e.id, name: e.name, line: e.short ?? e.line, family: c.name, pro: isProComponent(e.id) })))
