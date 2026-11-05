'use client'

import { useRef, useState } from 'react'
import { BLOCK_VIEWS } from '@pro'
import { useNear } from '../near'
import { Backdrop, Window } from '../blocks/Studio'

export function Live({ keep = false, height = 'h-[clamp(600px,calc(100dvh-180px),820px)]' }: { keep?: boolean; height?: string }) {
  const View = BLOCK_VIEWS['agent-chat']
  const box = useRef<HTMLDivElement>(null)
  const near = useNear(box, '200px 0px', '480px 0px')
  const [seen, setSeen] = useState(false)
  if (near && !seen) setSeen(true)
  return (
    <div className="relative rounded-[32px] p-3 sm:p-8">
      <Backdrop />
      <div ref={box} className={`relative ${height}`}>
        <Window title="Detent Support" chrome="titled">
          {(keep ? seen : near) ? <View /> : null}
        </Window>
      </div>
    </div>
  )
}
