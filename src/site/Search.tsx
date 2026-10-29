'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'
import { CommandMenu } from '@/lab/components/command/CommandMenu'
import type { Command } from '@/lab/components/command/CommandMenu'
import { CategoryIcon } from './icons'

/**
 * The ⌘K palette and everything it lists. It's its own chunk, fetched the first time someone
 * asks for search, so the catalogue it reads never rides along on an ordinary page load.
 */
export function Search({ open, onOpenChange, sound, toggleSound }: { open: boolean; onOpenChange: (open: boolean) => void; sound: boolean; toggleSound: () => void }) {
  const router = useRouter()
  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href)
    return [
      { id: 'home', label: 'Home', group: 'Site', hint: 'Page', onSelect: go('/') },
      { id: 'all', label: 'All components', group: 'Site', hint: 'Page', onSelect: go('/components') },
      { id: 'system', label: 'System', group: 'Site', hint: 'Page', keywords: 'type materials motion shape tokens', onSelect: go('/system') },
      ...ENTRIES.map((e) => {
        const c = CATEGORIES.find((x) => x.id === e.category)!
        return { id: e.id, label: e.name, group: c.name, icon: <CategoryIcon name={c.icon} size={15} />, hint: isProComponent(e.id) ? 'Pro' : e.tags?.includes('New') ? 'New' : undefined, keywords: `${c.name} ${e.line}`, onSelect: go(`/components/${e.id}`) }
      }),
      {
        id: 'theme',
        label: 'Switch theme',
        group: 'Settings',
        onSelect: () => {
          const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.dataset.theme = next
          try {
            localStorage.setItem('theme', next)
          } catch {
            /* storage unavailable */
          }
        },
      },
      { id: 'sound', label: sound ? 'Turn sound off' : 'Turn sound on', group: 'Settings', onSelect: toggleSound },
    ]
  }, [router, sound, toggleSound])

  return <CommandMenu open={open} onOpenChange={onOpenChange} commands={commands} placeholder="Search components…" />
}
