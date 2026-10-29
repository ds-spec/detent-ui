import type { RegistryItem } from './registry'
import { TEMPLATES } from './templates'

/*
 * A template as a whole project, for people starting fresh: a Next.js app that runs the moment
 * it's unzipped and installed, built from the same registry item `npx shadcn add` installs, so
 * the zip and the registry can never drift apart. It's made on request from the Pro registry,
 * which the server already holds, so it needs no files on disk.
 */

/** The versions a starter pins: what the templates are built and tested against. */
const VERSIONS: Record<string, string> = {
  next: '16.4.2',
  react: '19.3.0',
  'react-dom': '19.3.0',
  ai: '^7.0.153',
  '@ai-sdk/react': '^4.0.157',
  motion: '^14.5.0',
  'simple-icons': '^16.35.0',
  tailwindcss: '^4.3.3',
  '@tailwindcss/postcss': '^4.3.3',
  typescript: '^5.9.3',
  '@types/react': '^19.3.0',
  '@types/react-dom': '^19.3.0',
  '@types/node': '^20',
}

/** Where each template opens, and what it asks for in .env. */
const HOME: Record<string, { path: string; ai: string }> = {
  tandem: { path: '/dashboard', ai: 'Ask Tandem and its agents' },
  rapport: { path: '/crm', ai: 'Ask Rapport' },
  detent: { path: '/chat', ai: 'the agent' },
}

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`

/** Every file of a template's starter project, path → contents. */
export function starterFiles(id: string, item: RegistryItem, theme: RegistryItem): Record<string, string> {
  const t = TEMPLATES.find((x) => x.id === id)
  const home = HOME[id]
  if (!t || !home) throw new Error(`No starter for ${id}`)
  const name = `${id}-app`
  const files: Record<string, string> = {}
  for (const f of [...theme.files, ...item.files]) files[f.target] = f.content

  files['package.json'] = json({
    name,
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: Object.fromEntries(['next', 'react', 'react-dom', ...(item.dependencies ?? [])].sort().map((d) => [d, VERSIONS[d] ?? 'latest'])),
    devDependencies: Object.fromEntries(['@tailwindcss/postcss', '@types/node', '@types/react', '@types/react-dom', 'tailwindcss', 'typescript'].map((d) => [d, VERSIONS[d]])),
  })
  files['tsconfig.json'] = json({
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: false,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'react-jsx',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
    exclude: ['node_modules'],
  })
  files['next.config.ts'] = `import type { NextConfig } from 'next'\n\nconst nextConfig: NextConfig = {}\n\nexport default nextConfig\n`
  files['postcss.config.mjs'] = `export default { plugins: { '@tailwindcss/postcss': {} } }\n`
  files['app/globals.css'] = `@import 'tailwindcss';\n/* ${t.name}'s theme: every token it's drawn with, in light and dark. */\n@import '../components/detent/detent.css';\n`
  files['app/layout.tsx'] = `import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = { title: '${t.name}', description: ${JSON.stringify(t.line.split('.')[0] + '.')} }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
`
  files['app/page.tsx'] = `import { redirect } from 'next/navigation'

/** The app lives at ${home.path}; this is where your landing page goes. */
export default function Home() {
  redirect('${home.path}')
}
`
  files['.env.example'] = `# Copy to .env.local. ${t.name} runs without a key: ${home.ai} answers from a script until you give it a model.\n# Then add your provider's key, for example:\n# ANTHROPIC_API_KEY=\n`
  files['.gitignore'] = ['node_modules', '.next', 'out', '.env*.local', '.env', '*.tsbuildinfo', 'next-env.d.ts', '.DS_Store', ''].join('\n')
  files['README.md'] = `# ${t.name}

${t.line}

## Run it

\`\`\`bash
npm install
npm run dev
\`\`\`

Then open http://localhost:3000${home.path}. It runs on demo data, and ${home.ai} answers from a script, so it needs no key yet.

## Make it yours

- **Your name**: \`components/detent/templates/${id}/config.ts\`
- **Your data**: \`components/detent/templates/${id}/db.ts\`, read by the layout on the server
- **Your model**: \`components/detent/templates/${id}/ai/route.ts\` (swap the script for any AI SDK model, and add its key to \`.env.local\`)
- **Your theme**: \`components/detent/detent.css\`, or install shadcn and it follows your theme

Everything here is yours to change. Docs: https://detentui.com/templates/${id}
`
  return files
}

/* ── A zip, stored (not compressed), so it needs no library ─────────── */

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** The files as a .zip, every one under `root/`. */
export function zip(files: Record<string, string>, root: string): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const local: Uint8Array[] = []
  const central: Uint8Array[] = []
  let at = 0
  // 1 January 2026, as DOS time and date.
  const time = 0
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1
  for (const [path, text] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const name = enc.encode(`${root}/${path}`)
    const data = enc.encode(text)
    const crc = crc32(data)
    const head = new DataView(new ArrayBuffer(30))
    head.setUint32(0, 0x04034b50, true)
    head.setUint16(4, 20, true)
    head.setUint16(6, 0x0800, true) // names are UTF-8
    head.setUint16(8, 0, true) // stored
    head.setUint16(10, time, true)
    head.setUint16(12, date, true)
    head.setUint32(14, crc, true)
    head.setUint32(18, data.length, true)
    head.setUint32(22, data.length, true)
    head.setUint16(26, name.length, true)
    local.push(new Uint8Array(head.buffer), name, data)
    const dir = new DataView(new ArrayBuffer(46))
    dir.setUint32(0, 0x02014b50, true)
    dir.setUint16(4, 20, true)
    dir.setUint16(6, 20, true)
    dir.setUint16(8, 0x0800, true)
    dir.setUint16(10, 0, true)
    dir.setUint16(12, time, true)
    dir.setUint16(14, date, true)
    dir.setUint32(16, crc, true)
    dir.setUint32(20, data.length, true)
    dir.setUint32(24, data.length, true)
    dir.setUint16(28, name.length, true)
    dir.setUint32(42, at, true)
    central.push(new Uint8Array(dir.buffer), name)
    at += 30 + name.length + data.length
  }
  const size = central.reduce((n, b) => n + b.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, central.length / 2, true)
  end.setUint16(10, central.length / 2, true)
  end.setUint32(12, size, true)
  end.setUint32(16, at, true)
  const parts = [...local, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(new ArrayBuffer(parts.reduce((n, b) => n + b.length, 0)))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
