import { Bell, Bolt, Chart, Layers, Node, Pencil, Orbit } from '@/lab/icons'
import type { IconName } from '@/catalog/meta'

const ICONS = { Bell, Bolt, Chart, Layers, Node, Pencil, Orbit }

export function CategoryIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Icon = ICONS[name]
  return <Icon size={size} />
}
