'use client'

import type { ComponentType } from 'react'
import { BLOCKS } from '@/catalog/blocks'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { FREE_BLOCK_VIEWS } from '@/lab/blocks/registry'

function Locked() {
  return (
    <div className="flex size-full min-h-40 flex-col items-center justify-center gap-1 p-6 text-center">
      <p className="text-footnote font-medium text-ink-2">Detent Pro</p>
      <p className="text-caption text-ink-3">This preview plays with the Pro source checked out.</p>
    </div>
  )
}

const each = <T,>(ids: string[], view: T) => Object.fromEntries(ids.map((id) => [id, view])) as Record<string, T>

export const PRO_DEMOS: Record<string, ComponentType> = each(PRO_COMPONENTS, Locked)

export const preloadProDemo = (id: string) => void id

export const SPOTS: Record<string, ComponentType> = {}

export const BLOCK_VIEWS: Record<string, ComponentType<{ autoplay?: boolean }>> = { ...each(BLOCKS.map((b) => b.id), Locked), ...FREE_BLOCK_VIEWS }

export const TEMPLATE_VIEWS: Record<string, ComponentType> = each(TEMPLATES.map((t) => t.id), Locked)

export const TemplateBody: ComponentType<{ id: string; theme?: 'light' | 'dark' }> = () => <Locked />

export const TemplateView: ComponentType<{ id: string }> = () => (
  <div className="h-dvh">
    <Locked />
  </div>
)
