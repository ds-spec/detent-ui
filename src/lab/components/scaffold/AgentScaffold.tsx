'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Folder } from '../../icons'
import { ease, spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'
import { Terminal } from '../terminal/Terminal'
import type { Step } from '../terminal/Terminal'
import { FileTree } from '../tree/FileTree'
import type { TreeNode } from '../tree/FileTree'

type Phase = 'waiting' | 'scaffolding' | 'installing' | 'ready'

const LABEL: Record<Phase, string> = { waiting: 'Waiting', scaffolding: 'Scaffolding', installing: 'Installing', ready: 'Ready' }
/** Terminal rows: the whole run fits without scrolling, so the log reads top to bottom. */
const ROWS = 10
const TREE_ROW = 32

/** Builds a nested tree from the flat list of files created so far. */
const build = (root: string, files: string[], icons: Record<string, ReactNode>): TreeNode[] => {
  const top: TreeNode = { name: root, children: [] }
  for (const f of files) {
    let at = top
    f.split('/').forEach((part, i, all) => {
      let next = at.children!.find((c) => c.name === part)
      if (!next) {
        next = i === all.length - 1 ? { name: part, icon: icons[f] } : { name: part, children: [] }
        at.children!.push(next)
      }
      at = next
    })
  }
  return [top]
}

/** How many tree rows the finished project needs: the root, every folder and every file. */
const rowsFor = (files: string[]) => 1 + new Set(files.flatMap((f) => f.split('/').map((_, i, a) => a.slice(0, i + 1).join('/')))).size

/**
 * Creating an agent project, as one window. The command types itself on the left and each file
 * it prints lands in the tree on the right, flashing once as its folder opens. The title bar
 * says what the run is doing and keeps time, and settles on Ready when it's done. The window is
 * sized for the finished project before the first file arrives, so nothing ever resizes.
 */
export function AgentScaffold({ name, files, icons = {}, command = `npx create-agent ${name}` }: {
  /** The project's name. The command and the tree's root use it. */
  name: string
  /** Every path the command creates, in the order it prints them. The tree is sized for all of them before the first arrives. */
  files: string[]
  /** An icon per path, for files that deserve their own mark. */
  icons?: Record<string, ReactNode>
  /** What types itself at the prompt. */
  command?: string
}) {
  const [made, setMade] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('waiting')
  const [seconds, setSeconds] = useState(0)
  const started = useRef(0)

  // The clock runs from the first task until the project is ready.
  useEffect(() => {
    if (phase === 'waiting' || phase === 'ready') return
    const t = window.setInterval(() => setSeconds(Math.floor((performance.now() - started.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [phase])

  const add = useCallback((f: string) => setMade((l) => (l.includes(f) ? l : [...l, f])), [])

  const steps: Step[] = useMemo(
    () => [
      { type: 'pause', ms: 600 },
      { type: 'cmd', text: command },
      {
        type: 'task',
        text: 'Scaffolding',
        ms: 700,
        start: () => {
          started.current = performance.now()
          setSeconds(0)
          setPhase('scaffolding')
        },
      },
      ...files.map(
        (f): Step => ({
          type: 'out',
          wait: 260,
          text: (
            <>
              <span className="text-ok">+</span> <span className="text-ink-2">{f}</span>
            </>
          ),
          run: () => add(f),
        }),
      ),
      { type: 'task', text: 'Installing dependencies', ms: 1300, start: () => setPhase('installing') },
      { type: 'out', wait: 200, tone: 'muted', text: 'Ready. Run npm run dev to talk to it.', run: () => setPhase('ready') },
    ],
    [add, command, files],
  )

  const nodes = useMemo(() => build(name, made, icons), [name, made, icons])
  const working = phase === 'scaffolding' || phase === 'installing'
  const reduce = useReducedMotion()

  return (
    <div className="@container w-[720px] max-w-full overflow-hidden rounded-[24px] bg-surface shadow-float">
      <header className="flex h-14 items-center gap-3 pl-3 pr-5 shadow-[inset_0_-1px_0_var(--line)]">
        <span className="flex size-8 items-center justify-center rounded-[12px] bg-surface-2 text-ink-2">
          <Folder size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-headline text-ink">{name}</span>
        </span>
        {/* What the run is doing, and for how long. */}
        <span className="flex items-center gap-2 text-footnote" role="status">
          <span className="relative flex size-2">
            {working && !reduce && <motion.span className="absolute inset-0 rounded-full bg-ink-3" animate={{ scale: [1, 2.2], opacity: [0.5, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }} />}
            <span className={`relative size-2 rounded-full transition-colors duration-300 ${phase === 'ready' ? 'bg-ok' : working ? 'bg-ink-2' : 'bg-line-strong'}`} />
          </span>
          <span className="relative h-[18px] w-[84px] overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.span
                key={phase}
                className={`absolute inset-0 ${phase === 'ready' ? 'text-ink' : 'text-ink-2'}`}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={spring.move}
              >
                {LABEL[phase]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="tnum flex w-8 justify-end text-ink-3 @max-[300px]:hidden">
            <RollingText text={`0:${String(seconds).padStart(2, '0')}`} />
          </span>
        </span>
      </header>

      {/* The terminal and the tree side by side; narrow, the tree drops under the terminal. */}
      <div className="grid grid-cols-[minmax(0,1fr)_256px] @max-[560px]:grid-cols-1">
        <div className="px-2 py-1">
          <Terminal
            steps={steps}
            rows={ROWS}
            onRestart={() => {
              setMade([])
              setPhase('waiting')
              setSeconds(0)
            }}
          />
        </div>
        <motion.div className="p-2 shadow-[inset_1px_0_0_var(--line)] @max-[560px]:shadow-[inset_0_1px_0_var(--line)]" initial={false} animate={{ opacity: made.length ? 1 : 0.5 }} transition={{ duration: 0.3, ease: ease.out }}>
          <div style={{ height: rowsFor(files) * TREE_ROW }}>
            <FileTree nodes={nodes} defaultOpen={[name]} label={`${name} files`} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
