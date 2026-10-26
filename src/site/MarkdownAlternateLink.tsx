'use client'
/**
 * Emits the <link rel="alternate" type="text/markdown"> for the current page.
 * Uses usePathname() (client-side) so it never blocks static prerendering.
 * Rendered inside <head> via the root layout.
 */

import { usePathname } from 'next/navigation'
import { SITE } from '@/catalog/pro'

export function MarkdownAlternateLink() {
  const pathname = usePathname()
  const href = pathname === '/' ? `${SITE}/index.md` : `${SITE}${pathname}.md`
  return <link rel="alternate" type="text/markdown" href={href} />
}
