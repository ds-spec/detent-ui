'use client'

import type { ComponentType } from 'react'
import { BLOCK_VIEWS } from '@pro'
import { DEMOS } from '@/catalog/demos'
import { Fit } from './Fit'

/** A component or a block on its own, the whole window to itself: what full screen opens, in its own tab. */
export function FullPiece({ kind, id }: { kind: 'components' | 'blocks'; id: string }) {
  if (kind === 'blocks') {
    const View = BLOCK_VIEWS[id] as ComponentType | undefined
    return <div className="h-dvh bg-bg text-ink">{View && <View />}</div>
  }
  const Demo = DEMOS[id]
  return (
    <div className="relative h-dvh bg-bg text-ink">
      <Fit pad={48} max={1.6} min={0.5}>
        {Demo && <Demo />}
      </Fit>
    </div>
  )
}
