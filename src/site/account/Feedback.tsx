'use client'

import type { Piece, Pulse as Given } from '@/lib/account/pulse'
import { Pulse } from './Pulse'
import { SettingsCard } from './Settings'

export function FeedbackCard({ given, pieces }: { given: Given | null; pieces: Piece[] }) {
  return (
    <SettingsCard id="feedback" title="How’s Detent working for you?" line="A tap is plenty. It goes straight to the person who made it." foot="Private unless you tick the box.">
      <Pulse pieces={pieces} given={given} />
    </SettingsCard>
  )
}
