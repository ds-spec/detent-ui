/**
 * Reads a JSON file written to public/_data at build time. A Worker has no filesystem and stays
 * small by not bundling these, so it asks its static assets; everywhere else they're on disk.
 */
export async function asset<T>(file: string): Promise<T | null> {
  'use cache'
  try {
    const { env } = await import(/* @vite-ignore */ /* turbopackIgnore: true */ `cloudflare:${'workers'}`)
    if (env?.ASSETS) {
      const res = await env.ASSETS.fetch(`https://assets.local/_data/${file}`)
      return res.ok ? ((await res.json()) as T) : null
    }
  } catch {}
  const [{ readFile }, { join }] = await Promise.all([import('node:fs/promises'), import('node:path')])
  const text = await readFile(join(process.cwd(), 'public/_data', file), 'utf8').catch(() => null)
  return text === null ? null : (JSON.parse(text) as T)
}
