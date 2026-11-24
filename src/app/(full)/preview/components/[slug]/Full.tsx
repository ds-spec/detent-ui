'use client'

import { DEMOS } from '@/catalog/demos'
import { Fit } from '@/site/Fit'

export function Full({ id, bleed, zoom }: { id: string; bleed: boolean; zoom?: number }) {
  const Demo = DEMOS[id]
  return (
    <main className="relative h-dvh overflow-hidden bg-[var(--panel)] text-ink antialiased">
      {bleed ? (
        <div className="absolute inset-0">
          <Demo />
        </div>
      ) : (
        <Fit pad={48} max={zoom ?? 1.5} min={0.62} stage>
          <Demo />
        </Fit>
      )}
    </main>
  )
}
