import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { codeToHtml } from 'shiki'
import { curved } from './registry'
import { FILES, TEASER, locked, type SourceFile } from './source'

const highlight = (code: string, f: string) =>
  codeToHtml(code, {
    lang: f.endsWith('.ts') ? 'ts' : 'tsx',
    themes: { light: 'github-light', dark: 'github-dark-default' },
    defaultColor: false,
  })

export async function buildSource(id: string): Promise<SourceFile[]> {
  const gated = locked(id)
  return Promise.all(
    (FILES[id] ?? []).map(async (f, i) => {
      const name = f.split('/').pop()!
      const raw = await readFile(path.join(process.cwd(), 'src/lab', f), 'utf8').catch(() => null)
      if (raw === null) return { name, lines: 0, code: '', html: '', teaser: true }
      const code = curved(raw)
      const lines = code.split('\n').length
      if (!gated) return { name, lines, code, html: await highlight(code, f) }
      const head = i === 0 ? await highlight(code.split('\n').slice(0, TEASER).join('\n'), f) : ''
      return { name, lines, code: '', html: head, teaser: true }
    }),
  )
}
