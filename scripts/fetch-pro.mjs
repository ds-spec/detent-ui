import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const token = process.env.DETENT_PRO_TOKEN
const repo = process.env.DETENT_PRO_REPO ?? 'ds-spec/detent-pro'

if (existsSync('src/pro')) process.exit(0)
if (!token) {
  console.log('Building without Detent Pro: every Pro preview is locked.')
  process.exit(0)
}

try {
  execFileSync('git', ['clone', '--quiet', '--depth', '1', `https://x-access-token:${token}@github.com/${repo}.git`, 'src/pro'], { stdio: 'ignore' })
  console.log(`Detent Pro checked out from ${repo}.`)
} catch {
  console.error(`Couldn't check out Detent Pro from ${repo}. Check DETENT_PRO_TOKEN can read it.`)
  process.exit(1)
}
