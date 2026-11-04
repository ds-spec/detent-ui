'use client'

import { useEffect, useRef, useState } from 'react'
import { GRAIN } from '@/site/home/lights'

/*
 * Blue smoke, behind signing in: slow clouds of navy and blue folding through each other, a pale
 * haze where they're thickest, and a fine grain over all of it so it never bands. Calmer behind the
 * words, fuller toward the edges. A hand over it lights the smoke a little, like a lamp through fog.
 *
 * It's drawn at half resolution (smoke is soft; the grain carries the detail), at 30 frames a second
 * while it can be seen, resting when it can't, and holds one still frame for anyone who asks for
 * less motion. Without WebGL 2 a still gradient of the same colours shows instead.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uSize;   // css px
uniform float uScale; // canvas px per css px
uniform float uTime;  // seconds
uniform vec3 uTorch;  // css px from the top left, and how lit (0 to 1)

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
const mat2 TURN = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = TURN * p * 2.02 + 3.1; a *= 0.5; }
  return v;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  vec2 p = px / max(uSize.x, uSize.y) * 2.0;
  float t = uTime * 0.04;

  // Smoke: the field warped by itself, twice.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.8));
  vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p + 3.1 * r);

  // Calmer where the words are.
  vec2 n = px / uSize - 0.5;
  float edge = smoothstep(0.1, 0.62, length(n * vec2(1.0, 0.85)));

  vec3 deep = vec3(0.012, 0.024, 0.075);
  vec3 navy = vec3(0.035, 0.075, 0.29);
  vec3 blue = vec3(0.14, 0.30, 0.93);
  vec3 haze = vec3(0.50, 0.65, 1.0);
  vec3 col = mix(deep, navy, smoothstep(0.08, 0.62, f));
  col = mix(col, blue, smoothstep(0.3, 0.95, length(q)) * smoothstep(0.32, 0.88, f) * (0.55 + 0.45 * edge));
  col = mix(col, haze, smoothstep(0.5, 1.05, r.x * f * 1.7) * (0.3 + 0.55 * edge));
  col *= 0.6 + 0.85 * f * f * 1.35;

  // The hand's lamp in the fog.
  float d = distance(px, uTorch.xy);
  col += haze * uTorch.z * 0.2 * (1.0 - smoothstep(0.0, 280.0, d));

  o = vec4(col, 1.0);
}`

/** Without WebGL 2: the same smoke, held still. */
const STILL =
  'radial-gradient(60% 50% at 82% 14%, rgb(122 160 255 / 0.55), transparent 70%), radial-gradient(70% 60% at 12% 88%, rgb(36 77 236 / 0.6), transparent 70%), radial-gradient(80% 70% at 55% 50%, rgb(9 19 74), transparent 80%), #03061a'

export function Field() {
  const box = useRef<HTMLSpanElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const el = box.current
    const cv = canvas.current
    const gl = cv?.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false })
    if (!el || !cv || !gl) return
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('[detent] smoke shader:', gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindVertexArray(gl.createVertexArray())
    const [uSize, uScale, uTime, uTorch] = ['uSize', 'uScale', 'uTime', 'uTorch'].map((name) => gl.getUniformLocation(prog, name))

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now() - Math.random() * 90_000
    const torch = { x: -999, y: -999, z: 0, tz: 0 }
    let raf = 0
    let last = 0
    let seen = true
    let first = true

    const size = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      // Half the screen's resolution: smoke is soft, and the grain over it carries the detail.
      const scale = Math.min(2, devicePixelRatio || 1) * 0.5
      cv.width = Math.max(1, Math.round(w * scale))
      cv.height = Math.max(1, Math.round(h * scale))
      gl.viewport(0, 0, cv.width, cv.height)
      gl.uniform2f(uSize, w, h)
      gl.uniform1f(uScale, scale)
    }
    const frame = (now: number) => {
      raf = 0
      torch.z += (torch.tz - torch.z) * 0.1
      gl.uniform1f(uTime, still ? 40 : (now - start) / 1000)
      gl.uniform3f(uTorch, torch.x, torch.y, torch.z)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (first) {
        first = false
        setDrawn(true)
      }
      if (seen && (!still || Math.abs(torch.tz - torch.z) > 0.01)) loop()
    }
    // At most 30 frames a second, and only while it can be seen.
    const loop = () => {
      if (raf) return
      raf = requestAnimationFrame((now) => {
        if (now - last < 33) {
          raf = 0
          loop()
          return
        }
        last = now
        frame(now)
      })
    }

    size()
    loop()
    const ro = new ResizeObserver(() => {
      size()
      loop()
    })
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting && document.visibilityState === 'visible'
      if (seen) loop()
    })
    io.observe(el)
    const visible = () => {
      seen = document.visibilityState === 'visible'
      if (seen) loop()
    }
    document.addEventListener('visibilitychange', visible)
    // The lamp follows the hand over the panel the smoke lies under.
    const host = el.parentElement!
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      torch.x = e.clientX - r.left
      torch.y = e.clientY - r.top
      torch.tz = 1
      loop()
    }
    const leave = () => {
      torch.tz = 0
      loop()
    }
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', visible)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      // Free the program, not the context: React may run this again on the same canvas, and a lost context can't draw.
      gl.deleteProgram(prog)
    }
  }, [])

  return (
    <span ref={box} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" style={{ background: STILL }}>
      <canvas ref={canvas} className="absolute inset-0 size-full transition-opacity duration-700" style={{ opacity: drawn ? 1 : 0 }} />
      <span className="absolute inset-0 opacity-[0.14] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      {/* A hairline of light along the top edge, as on every wallpaper. */}
      <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]" />
    </span>
  )
}
