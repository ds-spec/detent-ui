'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

const STRANDS = 240
const SEGMENTS = 180

const VERTEX = `attribute vec3 a;
uniform vec2 res;
uniform vec2 hand;
uniform float centre;
uniform float near;
uniform float pull;
uniform float time;
uniform float reveal;
uniform float front;
uniform float wave;
uniform float dark;
varying vec3 tone;
varying float alpha;

vec3 ramp(float x){
  vec3 p=vec3(1.,.56,.2);
  vec3 q=vec3(1.,.2,.52);
  vec3 r=vec3(.56,.3,1.);
  vec3 s=vec3(.24,.6,1.);
  x=clamp(x,0.,1.)*3.;
  if(x<1.)return mix(p,q,x);
  if(x<2.)return mix(q,r,x-1.);
  return mix(r,s,x-2.);
}

void main(){
  float t=a.x;
  float o=a.y;
  float seed=a.z;
  float side=2.*t-1.;
  float d=abs(side);

  // Threads gather to a point at the button and open out towards both edges, crossing on the way.
  float open=pow(d,1.75);
  float cross=cos(d*2.7-.55+sin(time*.22+seed*.01)*.12);
  float waist=mix(19.,12.,pull);
  float x=t*res.x;
  float y=centre+o*(waist+open*res.y*.62*cross);
  y+=sin(side*5.+time*.42+seed*.09)*open*(16.+o*12.);

  vec2 p=vec2(x,y)-hand;
  float fall=exp(-dot(p,p)/7000.)*near*smoothstep(.06,.2,d);
  y+=p.y/sqrt(p.y*p.y+560.)*fall*(58.+o*o*16.);

  float crest=wave*exp(-pow((d-front)*8.,2.));
  float sheen=.28+.72*pow(abs(sin(seed*2.4+d*3.+time*.22)),5.);
  float grown=smoothstep(reveal,reveal-.14,d);
  tone=ramp(t)+crest*.5;
  alpha=(dark>.5?.7:.82)*min(1.,sheen+crest+pull*.25)*grown+fall*.26;
  gl_Position=vec4(x/res.x*2.-1.,1.-y/res.y*2.,0.,1.);
}`

const FRAGMENT = `precision mediump float;
varying vec3 tone;
varying float alpha;
void main(){gl_FragColor=vec4(tone*alpha,alpha);}`

const compile = (gl: WebGLRenderingContext, type: number, code: string) => {
  const s = gl.createShader(type)!
  gl.shaderSource(s, code)
  gl.compileShader(s)
  return s
}

/**
 * A hero held together by its button. Threads sweep in from both edges of the page and gather
 * through the call to action: they tighten as you come near, part around your hand, and a press
 * sends light out along every one of them.
 */
export function ThreadHero({
  title,
  sub,
  action,
  sentLabel,
  onAction,
  className = '',
}: {
  /** The headline. */
  title: string
  /** The line under it. */
  sub: string
  /** The button's label. */
  action: string
  /** What the button says once pressed. Left out, it keeps its label. */
  sentLabel?: string
  /** Called when the button is pressed. */
  onAction?: () => void
  /** Classes for the section. It fills its parent, so give it a height here or there. */
  className?: string
}) {
  const reduce = useReducedMotion()
  const [sent, setSent] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const live = useRef({ x: 0, y: 0, nx: 0, ny: 0, near: 0, want: 0, pull: 0, pullWant: 0, pressed: -9 })

  useEffect(() => {
    const el = canvas.current!
    const gl = el.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
    if (!gl) return
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    gl.useProgram(program)

    const out: number[] = []
    for (let s = 0; s < STRANDS; s++) {
      const o = ((s + 0.5) / STRANDS) * 2 - 1
      for (let i = 0; i < SEGMENTS; i++) for (const k of [i, i + 1]) out.push(k / SEGMENTS, o, s)
    }
    const data = new Float32Array(out)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const at = gl.getAttribLocation(program, 'a')
    gl.enableVertexAttribArray(at)
    gl.vertexAttribPointer(at, 3, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.clearColor(0, 0, 0, 0)
    const u = (n: string) => gl.getUniformLocation(program, n)
    const [uRes, uHand, uCentre, uNear, uPull, uTime, uReveal, uFront, uWave, uDark] = ['res', 'hand', 'centre', 'near', 'pull', 'time', 'reveal', 'front', 'wave', 'dark'].map(u)

    const fit = () => {
      const scale = Math.max(2, Math.min(window.devicePixelRatio, 3))
      el.width = el.clientWidth * scale
      el.height = el.clientHeight * scale
      gl.viewport(0, 0, el.width, el.height)
      gl.uniform2f(uRes, el.clientWidth, el.clientHeight)
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(el)

    let seen = true
    const eye = new IntersectionObserver(([e]) => (seen = e.isIntersecting))
    eye.observe(el)

    let frame = 0
    let then = performance.now()
    const born = then
    let beat = 0
    let dark = false
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - then) / 1000, 0.033)
      then = now
      if (!seen) return
      if (beat++ % 40 === 0) {
        const root = document.documentElement
        dark = root.dataset.theme === 'dark' || root.classList.contains('dark')
        if (dark) gl.blendFunc(gl.ONE, gl.ONE)
        else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      }
      const s = live.current
      const ease = (r: number) => (reduce ? 1 : 1 - Math.exp(-dt * r))
      s.nx += (s.x - s.nx) * ease(9)
      s.ny += (s.y - s.ny) * ease(9)
      s.near += (s.want - s.near) * ease(5)
      s.pull += (s.pullWant - s.pull) * ease(7)

      const area = el.getBoundingClientRect()
      const b = button.current!.getBoundingClientRect()
      const age = (now - s.pressed) / 1000
      gl.uniform2f(uHand, s.nx, s.ny)
      gl.uniform1f(uCentre, b.top + b.height / 2 - area.top)
      gl.uniform1f(uNear, s.near)
      gl.uniform1f(uPull, s.pull)
      gl.uniform1f(uTime, reduce ? 0 : now / 1000)
      gl.uniform1f(uReveal, reduce ? 2 : Math.min(1.3, (now - born) / 1500))
      gl.uniform1f(uFront, age * 1.15)
      gl.uniform1f(uWave, reduce ? 0 : Math.max(0, 1 - age / 1.1))
      gl.uniform1f(uDark, dark ? 1 : 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.LINES, 0, data.length / 3)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      watch.disconnect()
      eye.disconnect()
    }
  }, [reduce])

  return (
    <section
      ref={box}
      className={`@container relative size-full overflow-hidden bg-surface ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const s = live.current
        s.x = e.clientX - r.left
        s.y = e.clientY - r.top
        s.want = 1
      }}
      onPointerLeave={() => (live.current.want = 0)}
    >
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      <div className="absolute inset-x-0 top-[15%] text-center">
        <h1 className="px-6 text-[clamp(30px,7cqw,76px)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">{title}</h1>
        <p className="mx-auto mt-4 hidden max-w-[520px] px-6 text-[19px] leading-[1.4] tracking-[-0.018em] text-ink-3 @xl:block">{sub}</p>
      </div>
      <button
        ref={button}
        onPointerEnter={() => (live.current.pullWant = 1)}
        onPointerLeave={() => (live.current.pullWant = 0)}
        onClick={() => {
          live.current.pressed = performance.now()
          setSent(true)
          onAction?.()
        }}
        className="absolute left-1/2 top-[64%] h-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink px-8 text-[16px] font-semibold tracking-[-0.015em] text-surface shadow-[0_1px_2px_rgb(0_0_0/.2)] transition-transform duration-150 active:scale-[.97]"
      >
        {sent && sentLabel ? sentLabel : action}
      </button>
    </section>
  )
}
