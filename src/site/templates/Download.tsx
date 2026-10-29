'use client'

import { useState } from 'react'
import { Check } from '@/lab/icons'

/**
 * Starting fresh: the template as a whole project, zipped, for the licence key that bought it. The
 * key goes in a header, never the address, and isn't kept; the zip is made from the same source
 * `npx shadcn add` installs.
 */
export function DownloadStarter({ id, name }: { id: string; name: string }) {
  const [key, setKey] = useState('')
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'done' } | { kind: 'error'; text: string }>({ kind: 'idle' })
  const download = async () => {
    if (!key.trim()) return setState({ kind: 'error', text: 'Paste your licence key first. It’s in the email from your purchase.' })
    setState({ kind: 'busy' })
    try {
      const res = await fetch(`/r/pro/starter/${id}`, { method: 'POST', headers: { authorization: `Bearer ${key.trim()}` } })
      if (!res.ok) return setState({ kind: 'error', text: ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? 'That didn’t work. Try again in a minute.' })
      const url = URL.createObjectURL(await res.blob())
      const a = Object.assign(document.createElement('a'), { href: url, download: `${id}-app.zip` })
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setState({ kind: 'done' })
    } catch {
      setState({ kind: 'error', text: 'Couldn’t reach the download. Check your connection and try again.' })
    }
  }
  return (
    <div className="mt-8 max-w-[320px] rounded-[16px] p-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <p className="text-headline text-ink">Starting fresh?</p>
      <p className="mt-1 text-footnote leading-[1.55] text-ink-3">Download {name} as a whole Next.js project: unzip, npm install, npm run dev.</p>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void download()
        }}
      >
        <input
          type="password"
          value={key}
          onChange={(e) => (setKey(e.target.value), state.kind === 'error' && setState({ kind: 'idle' }))}
          placeholder="Your licence key"
          aria-label="Licence key"
          autoComplete="off"
          spellCheck={false}
          className="ring-focus h-9 rounded-[10px] bg-surface-2 px-3 font-mono text-footnote text-ink placeholder:font-sans placeholder:text-ink-3"
        />
        <button type="submit" disabled={state.kind === 'busy'} className="ring-focus flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-ink text-footnote font-medium text-surface transition-opacity disabled:opacity-60">
          {state.kind === 'busy' ? 'Getting it ready…' : state.kind === 'done' ? (
            <>
              <Check size={13} /> Downloaded
            </>
          ) : (
            `Download ${id}-app.zip`
          )}
        </button>
      </form>
      {state.kind === 'error' && (
        <p role="alert" className="mt-2 text-footnote leading-[1.5] text-[color-mix(in_oklch,var(--danger)_80%,var(--ink))]">
          {state.text}
        </p>
      )}
    </div>
  )
}
