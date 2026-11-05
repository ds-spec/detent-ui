import registry from '@pro-registry'
import type { RegistryItem } from './registry'

type Stored = Omit<RegistryItem, 'files'> & { files?: (Omit<RegistryItem['files'][number], 'content'> & { content?: string; shared?: number })[] }

const { items, shared = [] } = registry as unknown as { items: Record<string, Stored>; shared?: string[] }

export const hasProItems = () => Object.keys(items).length > 0

export function proItemByName(name: string): RegistryItem | null {
  const item = Object.hasOwn(items, name) ? items[name] : undefined
  if (!item) return null
  const files = item.files?.map(({ shared: at, content, ...file }) => ({ ...file, content: at === undefined ? (content ?? '') : shared[at] }))
  return { ...item, files } as RegistryItem
}
