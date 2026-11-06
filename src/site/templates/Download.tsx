'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLANS } from '@/catalog/pro'
import { Check } from '@/lab/icons'

type Owner = 'all' | 'pro' | null

export function DownloadStarter({ id, name }: { id: string; name: string }) {
  const [key, setKey] = useState('')
  const [open, setOpen] = useState(false)
  const [owner, setOwner] = useState<Owner | undefined>(undefined)
  const plan = PLANS[0]
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'done' } | { kind: 'error'; text: string }>({ kind: 'idle' })

  useEffect(() => {
    let live = true
    fetch('/api/account/me')
      .then((res) => (res.ok ? (res.json() as Promise<{ plan: Owner } | null>) : null))
      .then((me) => live && setOwner(me?.plan ?? null))
      .catch(() => live && setOwner(null))
    return () => {
      live = false
    }
  }, [])

  const owns = owner === 'all' || owner === 'pro'

  const download = async () => {
    if (!owns && !key.trim()) return setState({ kind: 'error', text: 'Paste your key first. You can generate one in your account.' })
    setState({ kind: 'busy' })
    try {
      const res = await fetch(`/r/pro/starter/${id}`, { method: 'POST', headers: owns ? {} : { authorization: `Bearer ${key.trim()}` } })
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

  const button = (
    <button type="submit" disabled={state.kind === 'busy'} className="ring-focus flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-ink text-footnote font-medium text-surface transition-[opacity,transform] duration-150 enabled:hover:opacity-90 enabled:active:scale-[0.97] disabled:opacity-60">
      {state.kind === 'busy' ? 'Getting it ready…' : state.kind === 'done' ? (
        <>
          <Check size={13} /> Downloaded
        </>
      ) : (
        `Download ${id}-app.zip`
      )}
    </button>
  )

  return (
    <div className="mt-8 max-w-[320px] rounded-[16px] p-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <p className="text-headline text-ink">Starting fresh?</p>
      <p className="mt-1 text-footnote leading-[1.55] text-ink-3">Download {name} as a whole Next.js project: unzip, npm install, npm run dev.</p>
      {owns ? (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault()
            void download()
          }}
        >
          {button}
        </form>
      ) : (
        <>
          <p className="mt-3 text-footnote text-ink-2">
            Comes with{' '}
            <Link href="/pro" className="ring-focus rounded-[4px] font-medium text-ink underline-offset-2 hover:underline">
              {plan.name}
            </Link>{' '}
            · ${plan.price}
          </p>
          {open ? (
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
                placeholder="Your key"
                aria-label="Your key"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                className="ring-focus h-9 rounded-[10px] bg-surface-2 px-3 font-mono text-footnote text-ink placeholder:font-sans placeholder:text-ink-3"
              />
              {button}
            </form>
          ) : (
              <button type="button" onClick={() => setOpen(true)} className="ring-focus mt-1 -ml-1 flex h-9 items-center rounded-[8px] px-1 text-footnote text-ink-3 transition-colors duration-150 hover:text-ink active:text-ink-2">
                Already have a key? Paste it here
              </button>
          )}
        </>
      )}
      {state.kind === 'error' && (
        <p role="alert" className="mt-2 text-footnote leading-[1.5] text-[color-mix(in_oklch,var(--danger)_80%,var(--ink))]">
          {state.text}
        </p>
      )}
    </div>
  )
}
