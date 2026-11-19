import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = process.cwd()
const WORKER = 'detent'
const SITE = 'https://detentui.com'
// IndexNow: the key file lives at public/<key>.txt; Bing (and through it ChatGPT search), Yandex and others share pings.
const INDEXNOW_KEY = '03cd067321ebecdcf7afe396ac982c83'
const SENT = path.join(root, '.detent/indexnow-sent.json')
const SECRETS = ['DETENT_DB_URL', 'DETENT_DB_TOKEN', 'RESEND_API_KEY', 'DETENT_MAIL_FROM', 'DODO_WEBHOOK_SECRET', 'DETENT_PLAN_PRO', 'DETENT_PLAN_ALL', 'DETENT_PLAN_TEAM',
  'BETTER_AUTH_SECRET', 'BETTER_AUTH_API_KEY', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']

const fail = (message) => {
  console.error(message)
  process.exit(1)
}
const run = (command, cwd, env = process.env) => execSync(command, { cwd, env, stdio: 'inherit' })

function readEnv() {
  if (!existsSync('.env.local')) return {}
  const lines = readFileSync('.env.local', 'utf8').split('\n')
  const pairs = lines.map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l)).filter(Boolean)
  return Object.fromEntries(pairs.map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]))
}

function sendSecrets() {
  const env = readEnv()
  const send = Object.fromEntries(SECRETS.filter((k) => env[k]).map((k) => [k, env[k]]))
  const missing = SECRETS.filter((k) => !env[k])
  if (!send.DETENT_DB_URL || !send.DETENT_DB_TOKEN || !send.BETTER_AUTH_SECRET) fail('.env.local needs DETENT_DB_URL, DETENT_DB_TOKEN and BETTER_AUTH_SECRET first.')
  const done = spawnSync('npx', ['wrangler', 'secret', 'bulk', '--name', WORKER], { input: JSON.stringify(send), stdio: ['pipe', 'inherit', 'inherit'] })
  if (done.status !== 0) process.exit(done.status ?? 1)
  console.log(`Sent: ${Object.keys(send).join(', ')}`)
  if (missing.length) console.log(`Not set yet: ${missing.join(', ')}`)
}

function deploy(dryRun) {
  if (!existsSync('src/pro/index.ts')) fail('src/pro is missing, so this would ship with Pro locked.')
  const work = mkdtempSync(path.join(tmpdir(), 'detent-deploy-'))
  try {
    console.log(`Public ${execSync('git rev-parse --short HEAD').toString().trim()}, Pro ${execSync('git -C src/pro rev-parse --short HEAD').toString().trim()}`)
    run(`git archive HEAD | tar -x -C ${JSON.stringify(work)}`, root)
    mkdirSync(path.join(work, 'src/pro'), { recursive: true })
    run(`git -C src/pro archive HEAD | tar -x -C ${JSON.stringify(path.join(work, 'src/pro'))}`, root)
    // Dates come from git here, where the history is; the archive has none. Uncommitted edits don't count, same as the archive.
    const lastmodFile = path.join(work, 'src/catalog/lastmod.json')
    run(`node scripts/build-lastmod.mjs ${JSON.stringify(lastmodFile)}`, root)
    const lastmod = JSON.parse(readFileSync(lastmodFile, 'utf8'))
    try {
      run(`cp -cR node_modules ${JSON.stringify(work)}/`, root)
    } catch {
      run('npm ci', work)
    }

    const { DETENT_UNLOCK, DETENT_DEV_KEY, ...clean } = process.env
    const published = Object.fromEntries(Object.entries(readEnv()).filter(([k]) => k.startsWith('NEXT_PUBLIC_')))
    run('npm run build:vinext', work, { ...clean, ...published })

    const maps = readdirSync(path.join(work, 'dist/client'), { recursive: true }).filter((f) => String(f).endsWith('.map'))
    if (maps.length) fail(`Stopped: ${maps.length} source maps would expose code.`)
    run(`npx wrangler deploy --config dist/server/wrangler.json${dryRun ? ' --dry-run' : ''}`, work)
    if (!dryRun) pingChanged(lastmod)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

/** Tells IndexNow about pages whose lastmod moved since the last ping, so Bing recrawls them within hours. Never fails the deploy. */
async function pingChanged(lastmod) {
  let sent = {}
  try {
    sent = JSON.parse(readFileSync(SENT, 'utf8'))
  } catch {}
  const paths = Object.keys(lastmod).filter((p) => sent[p] !== lastmod[p])
  if (!paths.length) return console.log('IndexNow: nothing changed since the last ping.')
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: paths.map((p) => (p === '/' ? SITE : `${SITE}${p}`)) }),
    })
    if (!res.ok) return console.log(`IndexNow: ${res.status} ${await res.text()}`)
    mkdirSync(path.dirname(SENT), { recursive: true })
    writeFileSync(SENT, JSON.stringify(lastmod, null, 2))
    console.log(`IndexNow: pinged ${paths.length} page${paths.length === 1 ? '' : 's'} (${res.status}).`)
  } catch (e) {
    console.log(`IndexNow: ping failed, try the next deploy (${e.message})`)
  }
}

if (process.argv.includes('--secrets')) sendSecrets()
else deploy(process.argv.includes('--dry-run'))
