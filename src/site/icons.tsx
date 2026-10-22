import { Bell, Bolt, Chart, Layers, Node, Pencil, Orbit } from '@/lab/icons'
import type { IconName } from '@/catalog/meta'

const ICONS = { Bell, Bolt, Chart, Layers, Node, Pencil, Orbit }

/** A category's icon, by name, so the catalog itself can stay plain data. */
export function CategoryIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Icon = ICONS[name]
  return <Icon size={size} />
}
