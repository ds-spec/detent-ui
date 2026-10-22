import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { apiFromSource } from './api'
import { FILES } from './source'

/** A free component's props, read from its main file. Cached: it runs once per component, at build time. */
export async function apiOf(id: string) {
  'use cache'
  const f = FILES[id]?.[0]
  if (!f) return null
  const code = await readFile(path.join(process.cwd(), 'src/lab', f), 'utf8')
  return apiFromSource(code, f)
}
