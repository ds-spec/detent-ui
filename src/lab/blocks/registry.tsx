'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/** The free blocks, each its own chunk. Pro's block list takes these as they are, and so does src/locked. */
export const FREE_BLOCK_VIEWS: Record<string, ComponentType<{ autoplay?: boolean }>> = {
  'sign-in': dynamic(() => import('./signin/SignIn').then((m) => m.SignIn), { ssr: false }),
  testimonials: dynamic(() => import('./testimonials/Testimonials').then((m) => m.Testimonials), { ssr: false }),
  faq: dynamic(() => import('./faq/FAQ').then((m) => m.FAQ), { ssr: false }),
}
