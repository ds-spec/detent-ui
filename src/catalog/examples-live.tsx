'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { PRO_EXAMPLES } from '@pro'

// Live views for the worked examples in docs.ts, keyed `${id}:${key}`. Free ones live in
// src/lab/examples; Pro ones come from the Pro source (empty when it isn't checked out,
// and the page shows a quiet locked frame instead).
const FREE: Record<string, ComponentType> = {
  'diff:stream': dynamic(() => import('@/lab/examples/diff').then((m) => m.DiffStreamExample), { ssr: false }),
  'diff:one': dynamic(() => import('@/lab/examples/diff').then((m) => m.DiffOneExample), { ssr: false }),
  'trend:revenue': dynamic(() => import('@/lab/examples/trend').then((m) => m.TrendRevenue), { ssr: false }),
  'trend:capacity': dynamic(() => import('@/lab/examples/trend').then((m) => m.TrendCapacity), { ssr: false }),
  'chart:launch': dynamic(() => import('@/lab/examples/chart').then((m) => m.ChartLaunch), { ssr: false }),
  'chart:value': dynamic(() => import('@/lab/examples/chart').then((m) => m.ChartOrderValue), { ssr: false }),
  'models:two': dynamic(() => import('@/lab/examples/models').then((m) => m.ModelsTwo), { ssr: false }),
  'models:lineup': dynamic(() => import('@/lab/examples/models').then((m) => m.ModelsLineup), { ssr: false }),
  'models:task': dynamic(() => import('@/lab/examples/models').then((m) => m.ModelsByTask), { ssr: false }),
  'prompt:support': dynamic(() => import('@/lab/examples/prompt').then((m) => m.PromptSupport), { ssr: false }),
  'prompt:agent': dynamic(() => import('@/lab/examples/prompt').then((m) => m.PromptAgent), { ssr: false }),
  'prompt:writer': dynamic(() => import('@/lab/examples/prompt').then((m) => m.PromptWriter), { ssr: false }),
}

export const EXAMPLE_VIEWS: Record<string, ComponentType> = { ...PRO_EXAMPLES, ...FREE }
