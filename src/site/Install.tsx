'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import LINES from '@/catalog/lines.json'
import { installCommand } from '@/catalog/site'
import { CopyCommand } from './parts'

const link = 'ring-focus rounded-[4px] underline-offset-2 hover:text-ink hover:underline'
const strong = `${link} font-medium text-ink-2`

/**
 * The install command for one thing and, under it, what installing it means. Free things say they
 * bring their files and the theme. Pro things say how much is there, in real lines, and
 * name the plan that has them; just after copying, the line says it runs with a key. All of it
 * sits in one fixed height, so a free page and a Pro page sit the same.
 */
export function Install({ id, free, bare = false }: { id: string; free: boolean; /** Just the command, for a page that says the rest elsewhere. */ bare?: boolean }) {
  const template = id.startsWith('template-')
  const [noted, setNoted] = useState(false)
  const timer = useRef(0)
  const note = () => {
    setNoted(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNoted(false), 1600)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const lines = (LINES as Record<string, number>)[id]
  const plan = template ? 'Pro + Templates' : 'Pro'
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
                <Link href="/pro" className={strong}>
                  {template ? 'Get it' : 'Get Pro'}
                </Link>
              </>
            ) : (
              <>
                {lines ? <span className={template ? 'max-sm:hidden' : ''}>{lines.toLocaleString('en-US')} lines ·</span> : null}
                <Link href="/pro" className={strong}>
                  {template ? `Comes with ${plan}` : 'Get Pro'}
                </Link>
              </>
            )}
          </motion.span>
        )}
      </p>
    </div>
  )
}
