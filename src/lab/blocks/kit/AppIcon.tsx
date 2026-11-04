'use client'

import type { CSSProperties, ReactNode } from 'react'
import { siGithub, siGrafana, siIntercom, siLinear, siNotion, siPagerduty, siTypeform, siGooglemeet } from 'simple-icons'
import { Orbit } from '@/lab/blocks/kit/icons'
import { Orb } from '@/lab/ui/Orb'

export type App = 'grafana' | 'linear' | 'github' | 'pagerduty' | 'notion' | 'meet' | 'typeform' | 'intercom' | 'agents'

type Mark = { path: string } | { glyph: (p: { size?: number }) => ReactNode }
const APPS: Record<App, { fill: string; ink?: string; mark: Mark; scale?: number }> = {
  grafana: { fill: 'linear-gradient(160deg, #ff8a2b, #f46800 70%)', mark: siGrafana },
  linear: { fill: 'linear-gradient(160deg, #7c86ec, #5e6ad2 70%)', mark: siLinear, scale: 0.54 },
  github: { fill: 'linear-gradient(160deg, #3b3b40, #181717 75%)', mark: siGithub },
  pagerduty: { fill: 'linear-gradient(160deg, #1fd05a, #06ac38 75%)', mark: siPagerduty, scale: 0.5 },
  notion: { fill: 'linear-gradient(160deg, #ffffff, #f0f0f0)', ink: '#111111', mark: siNotion },
  meet: { fill: 'linear-gradient(160deg, #1fb59f, #00897b 75%)', mark: siGooglemeet, scale: 0.56 },
  typeform: { fill: 'linear-gradient(160deg, #3c3c3e, #262627 75%)', mark: siTypeform, scale: 0.5 },
  intercom: { fill: 'linear-gradient(160deg, #3a8dff, #1b5fe0 75%)', mark: siIntercom, scale: 0.54 },
  agents: { fill: 'linear-gradient(160deg, #b18cff, #6a3df0 75%)', mark: { glyph: Orbit } },
}

export function AppIcon({ app, size = 20, className = '', style }: { app: App; size?: number; className?: string; style?: CSSProperties }) {
  const a = APPS[app]
  const g = Math.round(size * (a.scale ?? 0.58))
  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: a.fill,
        color: a.ink ?? '#fff',
        boxShadow: 'inset 0 0.5px 0 rgb(255 255 255 / 0.45), 0 0 0 0.5px rgb(0 0 0 / 0.14), 0 1px 1.5px rgb(0 0 0 / 0.12)',
        ...style,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(to_bottom,rgb(255_255_255/0.2),transparent)]" />
      <span className="relative flex">
        {'path' in a.mark ? (
          <svg width={g} height={g} viewBox="0 0 24 24" fill="currentColor">
            <path d={a.mark.path} />
          </svg>
        ) : (
          <a.mark.glyph size={g} />
        )}
      </span>
    </span>
  )
}

export function BrandMark({ brand, size = 16 }: { brand: 'github' | 'google'; size?: number }) {
  if (brand === 'github')
    return (
      <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d={siGithub.path} />
      </svg>
    )
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function Person({ name, hue, size = 28, quiet = false, className = '' }: { name: string; hue: number; size?: number; quiet?: boolean; className?: string }) {
  return <Orb seed={name} hue={hue} size={size} quiet={quiet} className={className} />
}
