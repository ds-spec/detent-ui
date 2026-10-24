'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ElementType, Ref } from 'react'
import { useReducedMotion } from 'motion/react'

/*
 * The headline is glass and the cursor is the light. Each letter is a pillow of glass with a bevel
 * worked out from a blurred copy of the text; light falling through it lands on the page below,
 * thrown away from the light, brighter where the bevels focus it, and split into its colours at
 * the edges, wider the further it travels. On the letters themselves the bevels catch a glint
 * that follows the light round.
 *
 * The real text stays in the page for selection, search and screen readers; only its paint is
 * hidden once the glass has drawn its first frame, so nothing moves and nothing flashes.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uMask;   // the text, sharp, in alpha
uniform sampler2D uHeight; // the text, blurred, in red: the glass's height
uniform vec2 uSize;        // canvas, css px
uniform float uDpr;
uniform vec3 uLight;       // css px; z is the light's height over the page
uniform float uR;          // bevel radius, css px
uniform float uReach;      // how far the light streams past the letters, css px
uniform float uSpread;     // how far the colours part
uniform float uIntensity;
uniform vec3 uInk;
uniform float uDark;
uniform float uMode;       // 0: light streams out of the letters; 1: caustic lines behind them
out vec4 o;

const int BANDS = 6;
const vec3 SPEC[6] = vec3[6](
  vec3(0.42, 0.22, 1.00), vec3(0.10, 0.52, 1.00), vec3(0.10, 0.88, 0.80),
  vec3(0.60, 0.95, 0.20), vec3(1.00, 0.72, 0.10), vec3(1.00, 0.22, 0.22));

float H(vec2 p) { return texture(uHeight, p / uSize).r; }
float M(vec2 p) { return texture(uMask, p / uSize).a; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 L = uLight.xy;
  vec2 v = L - p;
  float dist = max(length(v), 1.0);
  vec2 dir = v / dist;
  vec3 norm = vec3(0.0);
  for (int i = 0; i < BANDS; i++) norm += SPEC[i];

  /* ── The light that came through ── */
  vec3 lightCol = vec3(0.0);
  if (uMode < 0.5) {
    // Walk back toward the light; whatever glass lies on the way lit this point. Each colour bends
    // a little differently, so the streams end in a spectrum.
    float len = min(dist * 0.8, uReach);
    float j = hash(gl_FragCoord.xy);
    const int STEPS = 22;
    vec3 acc = vec3(0.0);
    for (int k = 0; k < STEPS; k++) {
      float t = (float(k) + j) / float(STEPS);
      float w = pow(1.0 - t, 1.6);
      for (int i = 0; i < BANDS; i++) {
        float bend = 1.0 - uSpread * 0.07 * float(i);
        acc += SPEC[i] * H(p + dir * len * t * bend) * w;
      }
    }
    vec3 c = acc / (norm * float(STEPS) * 0.38);
    float fall = smoothstep(uReach * 1.4, 0.0, dist) * 0.6 + 0.4;
    lightCol = c * fall;
  } else {
    // Behind each letter, the bevels gather the light into thin lines, split into colours.
    vec2 q0 = p + dir * min(dist, uReach) * 0.12;
    float e = max(1.0, uR * 0.35);
    vec2 g0 = vec2(H(q0 + vec2(e, 0.0)) - H(q0 - vec2(e, 0.0)), H(q0 + vec2(0.0, e)) - H(q0 - vec2(0.0, e))) / (2.0 * e) * uR;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < BANDS; i++) {
      vec2 q = q0 - g0 * uR * (0.8 + uSpread * 0.35 * float(i));
      float hc = H(q);
      float lap = (H(q + vec2(e, 0.0)) + H(q - vec2(e, 0.0)) + H(q + vec2(0.0, e)) + H(q - vec2(0.0, e)) - 4.0 * hc) / (e * e) * uR * uR;
      acc += SPEC[i] * clamp(-lap * 0.5, 0.0, 1.5);
    }
    lightCol = acc / norm * 1.4;
  }
  float lum = max(lightCol.r, max(lightCol.g, lightCol.b));
  vec4 light;
  if (uDark > 0.5) {
    light = vec4(lightCol * uIntensity, 0.0);
  } else {
    // On a pale page, light can only show as colour.
    float a = clamp(lum * uIntensity * 0.55, 0.0, 0.5);
    vec3 tint = lum > 0.001 ? lightCol / lum : vec3(1.0);
    light = vec4(tint * a, a);
  }

  /* ── The glass ── */
  float a = M(p);
  vec4 glass = vec4(0.0);
  if (a > 0.002) {
    float e = max(1.0, uR * 0.35);
    vec2 g = vec2(H(p + vec2(e, 0.0)) - H(p - vec2(e, 0.0)), H(p + vec2(0.0, e)) - H(p - vec2(0.0, e))) / (2.0 * e) * uR;
    float tilt = clamp(length(g) * 1.6, 0.0, 1.0);
    vec3 n = normalize(vec3(-g * 1.8, 1.0));
    vec3 l = normalize(vec3(v, uLight.z));
    vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));
    float nh = max(dot(n, h), 0.0);
    // The bevels that face the light shine; the ones turned away fall into shade.
    float facing = dot(normalize(-g + 1e-5), dir);
    float bevel = tilt * smoothstep(0.0, 0.9, facing);
    float away = tilt * smoothstep(0.0, 0.9, -facing);
    // A soft reflection of the light, travelling across the faces of the letters.
    float sheen = exp(-dot(v, v) / (2.0 * pow(uLight.z * 0.32, 2.0)));
    float spec = pow(nh, 160.0);
    vec3 body = uDark > 0.5 ? uInk * 0.72 : uInk;
    vec3 col = body;
    col = mix(col, vec3(1.0), clamp(sheen * (uDark > 0.5 ? 0.28 : 0.2), 0.0, 1.0));
    col = mix(col, uDark > 0.5 ? vec3(0.0) : body * 0.6, away * 0.35);
    col = mix(col, vec3(1.0), clamp(bevel * 0.85 + spec, 0.0, 1.0));
    glass = vec4(col * a, a);
  }

  o = glass + light * (1.0 - glass.a);
}`

/** A box blur, three passes, which comes close to a gaussian. */
function blur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length)
  const line = (from: Float32Array, to: Float32Array, n: number, count: number, stride: number, step: number) => {
    for (let k = 0; k < count; k++) {
      const base = k * stride
      let acc = 0
      for (let i = -r; i <= r; i++) acc += i >= 0 && i < n ? from[base + i * step] : 0
      for (let i = 0; i < n; i++) {
        to[base + i * step] = acc / (2 * r + 1)
        const out = i - r
        const inn = i + r + 1
        if (out >= 0) acc -= from[base + out * step]
        if (inn < n) acc += from[base + inn * step]
      }
    }
  }
  for (let pass = 0; pass < 3; pass++) {
    line(src, tmp, w, h, w, 1)
    line(tmp, src, h, w, 1, w)
  }
}

export type PrismHandle = {
  /** Move the light to a point, as fractions of the headline's box (it may be outside it), over `ms`. */
  lightTo(x: number, y: number, ms?: number): Promise<void>
  /** Give the light back to the cursor and its own drift. */
  release(): void
}

/**
 * A headline made of glass, lit by the cursor: the letters catch a glint as the light moves, and
 * the light that passes through them lands on the page split into its colours. Left alone, the
 * light drifts slowly over it like the sun. Without WebGL, or before the first frame, it's just
 * the headline.
 */
export function Prism({
  children,
  as: Tag = 'h1',
  className = '',
  intensity = 1,
  spread = 1,
  elevation = 1,
  follow = true,
  drift = true,
  ref,
}: {
  /** The words. Plain text, so it can be measured letter by letter. */
  children: string
  as?: ElementType
  className?: string
  /** How strong the light on the page is, 0 to 1.5. */
  intensity?: number
  /** How far the colours part, 0 to 2. */
  spread?: number
  /** How high the glass sits over the page, which is how far the light is thrown. 0.5 to 2. */
  elevation?: number
  /** Let the cursor be the light. */
  follow?: boolean
  /** Let the light wander when nobody is moving it. */
  drift?: boolean
  ref?: Ref<PrismHandle>
}) {
  const host = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  const [box, setBox] = useState<{ pad: number; w: number; h: number } | null>(null)
  const [ready, setReady] = useState(false)
  const api = useRef<PrismHandle>({ lightTo: async () => {}, release: () => {} })
  // Read by the drawing loop every frame, so changing a prop never rebuilds the glass.
  const opts = useRef({ intensity, spread, elevation, follow, drift, reduce })
  useEffect(() => {
    opts.current = { intensity, spread, elevation, follow, drift, reduce }
  })
  useImperativeHandle(ref, () => ({ lightTo: (x, y, ms) => api.current.lightTo(x, y, ms), release: () => api.current.release() }))

  useEffect(() => {
    const el = host.current
    const cv = canvas.current
    if (!el || !cv) return
    const gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) return
    let alive = true

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
      return s
    }
    const prog = gl.createProgram()!
    try {
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
    } catch (err) {
      console.warn('Prism: falling back to plain text.', err)
      return
    }
    gl.useProgram(prog)
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const loc = { mask: u('uMask'), height: u('uHeight'), size: u('uSize'), dpr: u('uDpr'), light: u('uLight'), r: u('uR'), reach: u('uReach'), spread: u('uSpread'), intensity: u('uIntensity'), ink: u('uInk'), dark: u('uDark'), mode: u('uMode') }
    const texture = () => {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const maskTex = texture()
    const heightTex = texture()
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    /* ── The text, as the glass sees it ── */
    let size = { w: 0, h: 0, pad: 0, font: 16, dpr: 1 }
    let ink: [number, number, number] = [0, 0, 0]
    let dark = 0
    const readInk = () => {
      const m = getComputedStyle(el).color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
      ink = [m[0] / 255, m[1] / 255, m[2] / 255]
      dark = 0.2126 * ink[0] + 0.7152 * ink[1] + 0.0722 * ink[2] > 0.5 ? 1 : 0
    }
    const build = () => {
      const cs = getComputedStyle(el)
      const font = parseFloat(cs.fontSize)
      const rect = el.getBoundingClientRect()
      const k = rect.width / el.offsetWidth || 1
      const w = el.offsetWidth
      const h = el.offsetHeight
      const pad = Math.round(Math.max(64, font * 1.3))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = w + pad * 2
      const Hh = h + pad * 2
      size = { w: W, h: Hh, pad, font, dpr }
      setBox({ pad, w: W, h: Hh })
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(Hh * dpr)
      readInk()

      // Every letter is drawn where the page put it, so the glass and the real text never disagree.
      const fontStr = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      const draw = (scale: number) => {
        const c = document.createElement('canvas')
        c.width = Math.round(W * scale)
        c.height = Math.round(Hh * scale)
        const ctx = c.getContext('2d')!
        ctx.scale(scale, scale)
        ctx.font = fontStr
        ctx.fillStyle = '#fff'
        const range = document.createRange()
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        for (let node = walk.nextNode() as Text | null; node; node = walk.nextNode() as Text | null) {
          const text = node.data
          for (let i = 0; i < text.length; i++) {
            const ch = text[i]
            if (/\s/.test(ch)) continue
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            const r = range.getBoundingClientRect()
            const ascent = ctx.measureText(ch).fontBoundingBoxAscent
            ctx.fillText(ch, (r.left - rect.left) / k + pad, (r.top - rect.top) / k + pad + ascent)
          }
        }
        return c
      }
      const sharp = draw(dpr)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, maskTex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sharp)

      const soft = draw(1)
      const data = soft.getContext('2d')!.getImageData(0, 0, soft.width, soft.height).data
      const hgt = new Float32Array(soft.width * soft.height)
      for (let i = 0; i < hgt.length; i++) hgt[i] = data[i * 4 + 3] / 255
      blur(hgt, soft.width, soft.height, Math.max(1, Math.round(font * 0.045)))
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, heightTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, soft.width, soft.height, 0, gl.RED, gl.FLOAT, hgt)
    }

    /* ── The light ── */
    const light = { x: 0, y: 0, tx: 0, ty: 0, set: false }
    let lastMove = -1e9
    let driven: { x: number; y: number } | null = null
    const home = (t: number) => {
      const { w, h, pad } = size
      // The sun's path: a slow, wide arc above and to the sides of the words.
      const s = opts.current.reduce || !opts.current.drift ? 0 : t / 1000
      return { x: pad + (w - pad * 2) * (0.5 + 0.46 * Math.sin(s * 0.42 + 2.2)), y: pad - h * 0.5 + h * 0.2 * Math.sin(s * 0.57) }
    }
    const pointer = (e: PointerEvent) => {
      if (!opts.current.follow || driven) return
      const r = cv.getBoundingClientRect()
      const k = r.width / size.w || 1
      light.tx = (e.clientX - r.left) / k
      light.ty = (e.clientY - r.top) / k
      lastMove = performance.now()
    }
    window.addEventListener('pointermove', pointer, { passive: true })

    api.current = {
      lightTo: (x, y, ms = 900) =>
        new Promise<void>((done) => {
          const { pad, w, h } = size
          const from = { x: light.tx, y: light.ty }
          const to = { x: pad + x * (w - pad * 2), y: pad + y * (h - pad * 2) }
          const t0 = performance.now()
          driven = from
          const step = () => {
            const p = Math.min(1, (performance.now() - t0) / Math.max(1, ms))
            const q = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
            driven = { x: from.x + (to.x - from.x) * q, y: from.y + (to.y - from.y) * q }
            if (p < 1) requestAnimationFrame(step)
            else done()
          }
          requestAnimationFrame(step)
        }),
      release: () => {
        driven = null
        lastMove = -1e9
      },
    }

    /* ── Drawing, only while it can be seen ── */
    let visible = true
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      if (visible) loop()
    })
    io.observe(cv)
    let raf = 0
    let last = performance.now()
    let frame = 0
    const render = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (frame++ % 30 === 0) readInk()
      const idle = now - lastMove > 2400
      const target = driven ?? (idle ? home(now) : { x: light.tx, y: light.ty })
      if (!light.set) {
        Object.assign(light, { x: target.x, y: target.y, set: true })
      } else {
        const f = 1 - Math.exp(-dt * (driven ? 0.03 : idle ? 0.0025 : 0.012))
        light.x += (target.x - light.x) * f
        light.y += (target.y - light.y) * f
      }
      gl.viewport(0, 0, cv.width, cv.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1i(loc.mask, 0)
      gl.uniform1i(loc.height, 1)
      gl.uniform2f(loc.size, size.w, size.h)
      gl.uniform1f(loc.dpr, size.dpr)
      gl.uniform3f(loc.light, light.x, light.y, Math.max(size.w, size.h) * 0.42)
      gl.uniform1f(loc.r, size.font * 0.09)
      gl.uniform1f(loc.reach, size.font * 2.4 * opts.current.elevation)
      gl.uniform1f(loc.mode, Number(new URLSearchParams(location.search).get('mode') ?? 0))
      gl.uniform1f(loc.spread, opts.current.spread)
      gl.uniform1f(loc.intensity, opts.current.intensity)
      gl.uniform3f(loc.ink, ink[0], ink[1], ink[2])
      gl.uniform1f(loc.dark, dark)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const loop = () => {
      cancelAnimationFrame(raf)
      const tick = (now: number) => {
        if (!alive || !visible || document.hidden) return
        render(now)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const onVisibility = () => !document.hidden && loop()
    document.addEventListener('visibilitychange', onVisibility)

    let pending = 0
    const rebuild = () => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(() => {
        if (!alive) return
        build()
        render(performance.now())
        setReady(true)
        loop()
      })
    }
    const ro = new ResizeObserver(rebuild)
    ro.observe(el)
    document.fonts?.ready.then(rebuild)
    document.fonts?.addEventListener?.('loadingdone', rebuild)
    cv.addEventListener('webglcontextlost', () => setReady(false))

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pending)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', pointer)
      document.removeEventListener('visibilitychange', onVisibility)
      document.fonts?.removeEventListener?.('loadingdone', rebuild)
    }
  }, [])

  return (
    <Tag ref={host} className={`relative ${className}`} style={ready ? { WebkitTextFillColor: 'transparent' } : undefined}>
      {children}
      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none absolute transition-opacity duration-300"
        style={box ? { left: -box.pad, top: -box.pad, width: box.w, height: box.h, opacity: ready ? 1 : 0 } : { opacity: 0, width: 0, height: 0 }}
      />
    </Tag>
  )
}
