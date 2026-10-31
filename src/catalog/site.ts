/**
 * Where the site lives and how things install from it. Plain and tiny on purpose: the header
 * reads it on every page, so it must never pull the catalogue in behind it.
 */

/**
 * Where the site lives, for install commands that work with no setup. Set NEXT_PUBLIC_SITE_URL
 * to the real domain before launch; in development it's the local server.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:5300' : 'https://detentui.com')).replace(/\/$/, '')

/**
 * Where the library opens. The site's own links go straight here rather than through the
 * /components and /blocks redirects, which those pages keep for typed URLs.
 */
export const FIRST_COMPONENT = '/components/region'
export const FIRST_BLOCK = '/blocks/live-features'

/** The command that installs something: from the public registry when it's free, the private one when it's Pro. */
export const installCommand = (id: string, free: boolean) => (free ? `npx shadcn add ${SITE}/r/${id}` : `npx shadcn add @detent-pro/${id}`)
