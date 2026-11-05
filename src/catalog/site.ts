
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:5300' : 'https://detentui.com')).replace(/\/$/, '')

export const FIRST_COMPONENT = '/components'
export const FIRST_BLOCK = '/blocks'

export const AI_SDK: boolean = false

export const installCommand = (id: string, free: boolean) => (free ? `npx shadcn add ${SITE}/r/${id}` : `npx shadcn add @detent-pro/${id}`)

export const MANAGERS = ['npm', 'pnpm', 'bun', 'yarn'] as const
export type Manager = (typeof MANAGERS)[number]
const RUN = { npm: 'npx', pnpm: 'pnpm dlx', bun: 'bunx', yarn: 'yarn dlx' } satisfies Record<Manager, string>
const ADD = { npm: 'npm install', pnpm: 'pnpm add', bun: 'bun add', yarn: 'yarn add' } satisfies Record<Manager, string>

export const isManaged = (command: string) => /^(npx|npm (i|install)) /.test(command)
export const withManager = (command: string, m: Manager) => command.replace(/^npx /, `${RUN[m]} `).replace(/^npm (i|install) /, `${ADD[m]} `)
