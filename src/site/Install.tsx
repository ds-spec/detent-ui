'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import LINES from '@/catalog/lines.json'
import { installCommand } from '@/catalog/site'
import { CopyCommand } from './parts'
import { useOwned } from './Owned'

const link = 'ring-focus rounded-[4px] underline-offset-2 hover:text-ink hover:underline'
const strong = `${link} font-medium text-ink-2`

export function Install({ id, free, bare = false }: { id: string; free: boolean; bare?: boolean }) {
  const template = id.startsWith('template-')
  const [noted, setNoted] = useState(false)
  const timer = useRef(0)
  const note = () => {
    setNoted(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNoted(false), 1600)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const owned = useOwned()
  const has = owned === 'all' || owned === 'pro'
  const lines = (LINES as Record<string, number>)[id]
  const plan = 'Pro'
  if (bare) return <CopyCommand fill command={installCommand(id, free)} onCopy={free ? undefined : note} />
  return (
    <div className="w-full">
      <CopyCommand fill command={installCommand(id, free)} onCopy={free ? undefined : note} />
      <p className="mt-2 flex h-4 items-center gap-1 whitespace-nowrap px-1 text-caption text-ink-3 sm:justify-end">
        {free ? (
          <>
            <span className="font-medium text-ink-2">Free</span> ·
            <Link href="/licence#free" className={link}>
              MIT
            </Link>
            · brings its files and the theme
          </>
        ) : (
          <motion.span key={String(noted)} className="flex items-center gap-1" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
            {noted ? (
              <>
                Runs with {template ? 'a' : 'your'} {plan} key ·
                {has ? (
                  <Link href="/account#keys" className={strong}>
                    Your keys
                  </Link>
                ) : (
                  <Link href="/pro" className={strong}>
                    {template ? 'Get it' : 'Get Pro'}
                  </Link>
                )}
              </>
            ) : (
              <>
                {lines ? <span className={template ? 'max-sm:hidden' : ''}>{lines.toLocaleString('en-US')} lines ·</span> : null}
                {has ? (
                  <span className="font-medium text-ink-2">In your plan</span>
                ) : (
                  <Link href="/pro" className={strong}>
                    {template ? `Comes with ${plan}` : 'Get Pro'}
                  </Link>
                )}
              </>
            )}
          </motion.span>
        )}
      </p>
    </div>
  )
}
