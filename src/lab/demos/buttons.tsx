'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import { CopyButton } from '../components/buttons/CopyButton'
import type { CopyHandle } from '../components/buttons/CopyButton'
import { HoldButton } from '../components/buttons/HoldButton'
import type { HoldHandle } from '../components/buttons/HoldButton'
import { ProgressButton } from '../components/buttons/ProgressButton'
import { SplitButton } from '../components/buttons/SplitButton'
import type { SplitHandle } from '../components/buttons/SplitButton'
import { ToggleButton } from '../components/buttons/ToggleButton'
import { Bin, Bolt, Fork } from '../icons'
import { Button } from '../ui/Button'
import { Kbd } from '../ui/Kbd'
import { useBench } from './bench'
import { useLoop } from './loop'

/** One specimen: a white tile on the stage, its name in the corner, the button in the middle. */
function Cell({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`relative flex h-[128px] items-center justify-center rounded-[22px] bg-surface shadow-raised ${wide ? 'col-span-2' : ''}`}>
      <span className="absolute left-4 top-3.5 text-footnote text-ink-3">{label}</span>
      {children}
    </div>
  )
}

/** The demo's press: the button dips the way a real press settles it. */
function Dip({ on, children }: { on: number; children: ReactNode }) {
  const c = useAnimationControls()
  useEffect(() => {
    if (on) c.start({ scale: [1, 0.96, 1], transition: { duration: 0.26 } })
  }, [on, c])
  return (
    <motion.span className="flex" animate={c}>
      {children}
    </motion.span>
  )
}

const MERGE = [
  { id: 'squash', label: 'Squash and merge', icon: <Fork size={15} /> },
  { id: 'rebase', label: 'Rebase and merge', icon: <Fork size={15} /> },
  { id: 'merge', label: 'Create a merge commit', icon: <Fork size={15} /> },
]

/** Every kind of button, each doing its one job in turn. Hovering pauses; touching hands it over. */
export function ButtonsDemo() {
  const b = useBench()
  const copy = useRef<CopyHandle>(null)
  const split = useRef<SplitHandle>(null)
  const hold = useRef<HoldHandle>(null)
  const [follow, setFollow] = useState(false)
  const [merge, setMerge] = useState('squash')
  const [progress, setProgress] = useState<number | null>(null)
  const [deployed, setDeployed] = useState(false)
  const [dips, setDips] = useState<Record<string, number>>({})
  const dip = (id: string) => setDips((d) => ({ ...d, [id]: (d[id] ?? 0) + 1 }))

  const deploy = async (beat?: (ms: number) => Promise<void>) => {
    const wait = beat ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
    // Work doesn't move at an even pace: quick at first, a stall, then the rest.
    for (const p of [0, 0.08, 0.21, 0.34, 0.42, 0.44, 0.45, 0.58, 0.73, 0.86, 0.97, 1]) {
      setProgress(p)
      await wait(p > 0.42 && p < 0.5 ? 420 : 210)
    }
    setDeployed(true)
    await wait(1700)
    setDeployed(false)
    setProgress(null)
  }

  const handlers = useLoop(async (beat) => {
    for (let round = 0; ; round++) {
      await beat(1000)
      dip('copy')
      copy.current?.copy()
      await beat(1800)
      dip('follow')
      setFollow((f) => !f)
      await beat(1600)
      split.current?.open()
      await beat(900)
      split.current?.choose(round % 2 ? 0 : 1)
      await beat(1500)
      dip('deploy')
      await deploy(beat)
      await beat(600)
      await hold.current?.hold()
      await beat(2200)
    }
  })

  const size = b.get('size', 'md')
  return (
    <div className="grid w-[620px] max-w-full grid-cols-2 gap-3" {...handlers}>
      <Cell label="Variants" wide>
        <div className="flex items-center gap-2.5">
          <Button variant="primary" size={size}>
            Publish
            <span className="-mr-1 flex gap-0.5">
              <Kbd onInk>⌘</Kbd>
              <Kbd onInk>↵</Kbd>
            </span>
          </Button>
          <Button variant="secondary" size={size}>
            Share
          </Button>
          <Button variant="ghost" size={size}>
            Cancel
          </Button>
          <Button variant="danger" size={size}>
            Delete
          </Button>
        </div>
      </Cell>
      <Cell label="Copy">
        <Dip on={dips.copy ?? 0}>
          <CopyButton ref={copy} value="https://northwind.co/d/q3-board" label="Copy link" size="md" onCopy={b.on('onCopy')} />
        </Dip>
      </Cell>
      <Cell label="Toggle">
        <Dip on={dips.follow ?? 0}>
          <ToggleButton pressed={follow} onPressedChange={b.on('onPressedChange', setFollow)} />
        </Dip>
      </Cell>
      <Cell label="Split">
        <SplitButton ref={split} options={MERGE} value={merge} onValueChange={b.on('onValueChange', setMerge)} onAction={b.on('onAction')} label="Other ways to merge" />
      </Cell>
      <Cell label="Progress">
        <Dip on={dips.deploy ?? 0}>
          <ProgressButton progress={progress} done={deployed} icon={<Bolt size={15} />} onClick={() => deploy()}>
            Deploy
          </ProgressButton>
        </Dip>
      </Cell>
      <Cell label="Hold to confirm" wide>
        <HoldButton ref={hold} icon={<Bin size={15} />} done="Project deleted" onConfirm={b.on('onConfirm')}>
          Hold to delete project
        </HoldButton>
      </Cell>
    </div>
  )
}
