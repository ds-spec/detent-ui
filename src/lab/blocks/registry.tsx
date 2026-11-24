'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/* Installed blocks start still (autoplay is off by default), so a real app never runs the scripted demo.
   The site wraps each view so its demos still play; a caller can still pass autoplay={false}. */
export function playing<P extends { autoplay?: boolean }>(View: ComponentType<P>): ComponentType<P> {
  function Playing(props: P) {
    return <View {...({ autoplay: true, ...props } as P)} />
  }
  return Playing
}

export const FREE_BLOCK_VIEWS: Record<string, ComponentType<{ autoplay?: boolean }>> = {
  'sign-in': playing(dynamic(() => import('./signin/SignIn').then((m) => m.SignIn), { ssr: false })),
  testimonials: dynamic(() => import('./testimonials/Testimonials').then(({ Testimonials }) => function Demo({ autoplay = true }: { autoplay?: boolean }) {
    return <Testimonials autoplay={autoplay} />
  }), { ssr: false }),
  faq: dynamic(() => import('./faq/FAQ').then(({ FAQ }) => function Demo({ autoplay = true }: { autoplay?: boolean }) {
    return <FAQ autoplay={autoplay} subline="Search, or browse by topic. If it isn’t here, a person on the team will answer, usually within the hour." contact={{ title: 'Still stuck?', line: 'Maya and the team answer in under an hour on weekdays.', action: 'Talk to a person', name: 'Maya Chen' }} />
  }), { ssr: false }),
  cta: dynamic(() => import('./cta/CTA').then(({ CTA }) => function Demo({ autoplay = true }: { autoplay?: boolean }) {
    return <CTA autoplay={autoplay} assurances={[{ label: 'SOC 2 Type II', icon: 'shield' }, { label: 'Never trains on your data', icon: 'lock' }, { label: 'Cancel any time', icon: 'check' }]} queueLabel="Resolved today" resolved={1284} sentTitle="Check your inbox" sentLine="Your sign-in link is on its way to" />
  }), { ssr: false }),
  integrations: playing(dynamic(() => import('./integrations/Integrations').then((m) => m.Integrations), { ssr: false })),
}
