import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = process.cwd()
const WORKER = 'detent'
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
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

if (process.argv.includes('--secrets')) sendSecrets()
else deploy(process.argv.includes('--dry-run'))
