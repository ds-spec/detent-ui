'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { AgentScaffold } from '../components/scaffold/AgentScaffold'
import { FileTree } from '../components/tree/FileTree'
import type { TreeNode } from '../components/tree/FileTree'
import { CopyCommand } from '../components/terminal/Terminal'
import { Bubble, Calendar, Orbit, Wrench } from '../icons'
import { useBench } from './bench'

/* ───────────────────────────── Scaffold: one window, terminal → tree ───────────────────────────── */

const FILES = ['prompt.md', 'agent.ts', 'tools/refund.ts', 'tools/lookup-order.ts', 'channels/slack.ts']
const ICONS: Record<string, ReactNode> = {
  'tools/refund.ts': <Wrench size={16} />,
  'tools/lookup-order.ts': <Wrench size={16} />,
  'channels/slack.ts': <Bubble size={16} />,
}

export function ScaffoldDemo() {
  const b = useBench()
  return <AgentScaffold name={b.get('name', 'support-bot')} files={FILES} icons={ICONS} />
}

/* ───────────────────────────── File tree on its own ───────────────────────────── */

const PROJECT: TreeNode[] = [
  {
    name: 'northwind-agent',
    children: [
      { name: 'instructions.md' },
      { name: 'agent.ts' },
      {
        name: 'tools',
        children: [
          { name: 'search-orders.ts', icon: <Wrench size={16} /> },
          { name: 'issue-refund.ts', icon: <Wrench size={16} /> },
        ],
      },
      {
        name: 'skills',
        children: [
          { name: 'tone-of-voice.md', icon: <Orbit size={16} /> },
          { name: 'escalation.md', icon: <Orbit size={16} /> },
        ],
      },
      { name: 'schedules', children: [{ name: 'weekly-digest.md', icon: <Calendar size={16} /> }] },
      { name: 'channels', children: [{ name: 'slack.ts', icon: <Bubble size={16} /> }] },
    ],
  },
]

export function TreeDemo() {
  const b = useBench()
  const [selected, setSelected] = useState<string | null>('northwind-agent/tools/issue-refund.ts')
  return (
    <div className="flex h-[420px] w-[300px] flex-col gap-4">
      <CopyCommand command="npx create-agent@latest" />
      <div className="rounded-row bg-surface p-1.5 shadow-float">
        <FileTree nodes={PROJECT} defaultOpen={['northwind-agent', 'northwind-agent/tools']} selected={selected} onSelect={b.on('onSelect', setSelected)} label={b.get('label', 'Agent files')} />
      </div>
    </div>
  )
}
