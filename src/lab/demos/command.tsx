'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CommandMenu } from '../components/command/CommandMenu'
import type { Command, CommandHandle } from '../components/command/CommandMenu'
import { Calendar, Check, Code, Folder, Mail, Plus } from '../icons'
import { Kbd } from '../ui/Kbd'
import { useBench } from './bench'

const PEOPLE = ['Maya Chen', 'Jonas Weber', 'Aiko Tanaka', 'Sam Ortiz']
const PROJECTS = ['northwind-web', 'support-bot', 'billing-api', 'design-system']

/** Finds things on its own: types "dep" and deploys, finds a teammate, then walks the list with the keyboard. Hovering pauses; touching hands it over. */
export function CommandDemo() {
  const b = useBench()
  const [last, setLast] = useState<string | null>(null)
  const menu = useRef<CommandHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  const commands = useMemo<Command[]>(
    () => [
      ...PROJECTS.map((p) => ({ id: `p-${p}`, label: p, group: 'Projects', icon: <Folder size={16} />, hint: 'Project', onSelect: () => setLast(`Opened ${p}`) })),
      { id: 'a-new', label: 'New project', group: 'Actions', icon: <Plus size={16} />, hint: <Kbd>N</Kbd>, onSelect: () => setLast('Started a new project') },
      { id: 'a-deploy', label: 'Deploy to production', group: 'Actions', icon: <Code size={16} />, keywords: 'ship release', onSelect: () => setLast('Deploy queued for northwind-web') },
      { id: 'a-meet', label: 'Schedule a review', group: 'Actions', icon: <Calendar size={16} />, onSelect: () => setLast('Review scheduled') },
      ...PEOPLE.map((p) => ({ id: `u-${p}`, label: p, group: 'People', icon: <Mail size={16} />, hint: 'Message', onSelect: () => setLast(`Messaged ${p}`) })),
    ],
    [],
  )

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const m = () => menu.current
    const write = async (q: string) => {
      for (let i = 1; i <= q.length; i++) {
        m()?.type(q.slice(0, i))
        await beat(110 + Math.random() * 90)
      }
    }
    const play = async () => {
      for (;;) {
        await beat(1400)
        await write('dep')
        await beat(900)
        m()?.run()
        await beat(1600)
        m()?.type('')
        setLast(null)
        await beat(700)
        await write('jo')
        await beat(800)
        m()?.run()
        await beat(1600)
        m()?.type('')
        setLast(null)
        await beat(800)
        for (const i of [1, 2, 3]) {
          m()?.move(i)
          await beat(380)
        }
        await beat(500)
        m()?.run()
        await beat(1800)
        m()?.move(0)
        setLast(null)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="w-[460px]" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <CommandMenu ref={menu} inline open onOpenChange={b.on('onOpenChange')} commands={commands} listHeight={288} placeholder={b.get('placeholder', 'Search projects, people and actions…')} />
      {/* The status line rolls through its slot, so the old and new lines never overlap. */}
      <div className="relative mt-4 h-6 overflow-hidden text-center text-footnote">
        <AnimatePresence initial={false}>
          <motion.p
            key={last ?? 'hint'}
            className={`absolute inset-0 flex items-center justify-center gap-1.5 ${last ? 'text-ink-2' : 'text-ink-3'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            {last ? (
              <>
                <Check size={13} strokeWidth={2.6} className="text-ok" />
                {last}
              </>
            ) : (
              'Type to filter, or walk the list with the arrow keys.'
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
