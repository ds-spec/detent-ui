// Checks out Detent Pro at src/pro before a build. Pro is its own private repository; a deploy
// reaches it with a read-only token in DETENT_PRO_TOKEN. Without one the site still builds, with
// every Pro preview locked, which is how anyone who clones this repository runs it.
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
  // Quiet, so a failure can't print the address with the token in it.
  execFileSync('git', ['clone', '--quiet', '--depth', '1', `https://x-access-token:${token}@github.com/${repo}.git`, 'src/pro'], { stdio: 'ignore' })
  console.log(`Detent Pro checked out from ${repo}.`)
} catch {
  // A deploy that was meant to have Pro shouldn't quietly ship without it.
  console.error(`Couldn't check out Detent Pro from ${repo}. Check DETENT_PRO_TOKEN can read it.`)
  process.exit(1)
}
