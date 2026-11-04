'use client'

import { MeshGradient } from '@paper-design/shaders-react'
import { useReducedMotion } from 'motion/react'

/*
 * Midnight light, behind signing in: navy folding into electric blue, a periwinkle haze where the
 * light gathers, and a fine grain over all of it so it reads as a material rather than a wash.
 * Drawn with Paper Shaders' mesh gradient (Apache 2.0). It drifts slowly, and holds still for anyone
 * who asks for less motion. A gradient of the same colours sits underneath for the first frame and
 * for any browser without WebGL.
 */
export function Light() {
  const still = useReducedMotion()
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_70%_20%,#3d6bff_0%,#0d2bd1_38%,#040a26_100%)]">
      <MeshGradient
        style={{ width: '100%', height: '100%' }}
        colors={['#040a26', '#0d2bd1', '#3d6bff', '#a9bcff', '#1a1a6e']}
        distortion={0.85}
        swirl={0.25}
        grainMixer={0.18}
        grainOverlay={0.32}
        speed={still ? 0 : 0.22}
      />
    </div>
  )
}
