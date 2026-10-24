'use client'

import { useId } from 'react'

/*
 * How a block is shown: as an app in a window, on a wallpaper. The wallpaper is ours, drawn as
 * SVG: silk ribbons of colour sweeping across a warm field, soft at their edges, with one thread
 * of light along a fold and a whisper of grain. It's vivid on purpose: the window's vibrant
 * sidebar takes its colour from what's behind it. Light and dark are two moods of one picture:
 * in dark it's the same silk after sundown, the field a deep plum to navy and the ribbons ember and
 * blue, so a dark window stands on colour the way it would on a Mac, never black on black.
 */

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

const stop = (light: string, dark: string) => ({ stopColor: `light-dark(${light}, ${dark})` })

export function Wallpaper() {
  const id = useId().replace(/:/g, '')
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-field`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={stop('#fbe9dc', '#2a1424')} />
            <stop offset="0.55" style={stop('#f6dbe4', '#1d1233')} />
            <stop offset="1" style={stop('#dfe2fb', '#0f1a3d')} />
          </linearGradient>
          <linearGradient id={`${id}-a`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style={stop('#ff8a3d', '#c4531f')} />
            <stop offset="0.5" style={stop('#ff5c8a', '#a1295c')} />
            <stop offset="1" style={stop('#ff9a6b', '#c9683e')} />
          </linearGradient>
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={stop('#8b6cff', '#5a3fd6')} />
            <stop offset="0.6" style={stop('#4f8dff', '#2563eb')} />
            <stop offset="1" style={stop('#5cd3ff', '#1593c9')} />
          </linearGradient>
          <linearGradient id={`${id}-c`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={stop('#ffd27a', '#a8621c')} />
            <stop offset="1" style={stop('#ff7aa8', '#9e2a5c')} />
          </linearGradient>
          <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <rect width="1600" height="1000" fill={`url(#${id}-field)`} />
        {/* A glow to warm the top left, then three ribbons, back to front. */}
        <ellipse cx="260" cy="120" rx="520" ry="300" fill={`url(#${id}-c)`} opacity="0.55" filter={`url(#${id}-glow)`} />
        <path d="M-120 560 C 260 300, 560 720, 960 470 S 1500 120, 1760 260 L 1760 -100 L -120 -100 Z" fill={`url(#${id}-b)`} opacity="0.5" filter={`url(#${id}-soft)`} />
        <path d="M-120 830 C 300 600, 600 1000, 980 720 S 1480 380, 1760 520 L 1760 1120 L -120 1120 Z" fill={`url(#${id}-a)`} opacity="0.85" filter={`url(#${id}-soft)`} />
        <path d="M-120 930 C 360 760, 720 1060, 1100 860 S 1560 700, 1760 760 L 1760 1120 L -120 1120 Z" fill={`url(#${id}-b)`} opacity="0.75" filter={`url(#${id}-soft)`} />
        {/* One thread of light along the fold of the warm ribbon. */}
        <path d="M-120 830 C 300 600, 600 1000, 980 720 S 1480 380, 1760 520" fill="none" style={{ stroke: 'light-dark(rgb(255 255 255 / 0.7), rgb(255 255 255 / 0.32))' }} strokeWidth="1.5" filter={`url(#${id}-soft)`} opacity="0.9" />
      </svg>
      <span className="absolute inset-0 opacity-[0.09] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </span>
  )
}

