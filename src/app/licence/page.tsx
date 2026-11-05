import type { Metadata } from 'next'
import Link from 'next/link'
import { ENTRIES } from '@/catalog/meta'
import { PRO_COMPONENTS } from '@/catalog/pro'
import { CONTACT, LICENSOR, UPDATED, updated } from '@/catalog/trust'
import { LegalPage, List, P, Strong } from '@/site/trust/Legal'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Licence',
  description: 'What you can do with Detent: the free components under MIT, and Pro for any number of projects, yours or your clients’.',
  path: '/licence',
  image: '/opengraph-image',
})

const MIT = `MIT License

Copyright (c) ${UPDATED.slice(0, 4)} ${LICENSOR}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

export default function Licence() {
  const free = ENTRIES.length - PRO_COMPONENTS.length
  return (
    <LegalPage
      label="Licence"
      title="Build anything with it. Just don’t sell it on."
      intro={<p>The free components are MIT: use them however you like. Pro is yours to use in as many projects as you want, for yourself or for clients. The one thing you can’t do is pass the source on as a kit of your own.</p>}
      updated={updated()}
      sections={[
        {
          id: 'free',
          title: 'The free components',
          body: (
            <>
              <P>The {free} free components are licensed under the MIT License. Use them in anything, change them however you like, and share what you make. Keep the notice below with them.</P>
              <pre className="mt-5 whitespace-pre-wrap break-words rounded-[14px] bg-surface-2 p-5 font-mono text-[12px] leading-[1.6] text-ink-2 sm:whitespace-pre sm:overflow-x-auto">{MIT}</pre>
            </>
          ),
        },
        {
          id: 'pro',
          title: 'What a Pro licence covers',
          body: (
            <>
              <P>A Pro licence covers the {PRO_COMPONENTS.length} Pro components, every block that isn’t free and, with Pro + Templates, every template: everything sold now and every update that follows.</P>
              <P>
                <Strong>Pro</Strong> and <Strong>Pro + Templates</Strong> are for one person, who can make keys for CI and shared repositories.
              </P>
            </>
          ),
        },
        {
          id: 'can',
          title: 'What you can do',
          body: (
            <List
              tone="yes"
              items={[
                'Use it in unlimited projects: your own products, your company’s, and your clients’.',
                'Use it in things you sell, like apps, SaaS products, websites and paid client work.',
                'Change it however you like. The source lands in your project; it’s yours to edit.',
                'Use it with AI coding tools while you build your own projects.',
                'Hand a client a finished project with Pro inside it. The licence goes with the project, not the source as a kit.',
              ]}
            />
          ),
        },
        {
          id: 'cannot',
          title: 'What you can’t do',
          body: (
            <List
              tone="no"
              items={[
                'Sell, give away or publish the Pro source on its own, or as part of a component library, UI kit, template, theme or starter, whether it’s changed or not.',
                'Make something whose main purpose is to let others build with Pro, like a page builder or a design tool that hands out the components.',
                'Put Pro files in a public repository. In an open-source project, keep them out of the public code.',
                'Share your key with people it doesn’t cover.',
                'Use Pro to train or fine-tune a model that generates components.',
              ]}
            />
          ),
        },
        {
          id: 'templates',
          title: 'Templates',
          body: <P>A template can be used for as many sites and apps as you like, for yourself or for clients. Each should be a real product, with its own words and brand; reselling the template, or a lightly changed copy of it, as a template is the one thing that’s off limits.</P>,
        },
        {
          id: 'ending',
          title: 'If the licence ends',
          body: <P>A licence lasts as long as its terms are kept. If they’re broken in a way that isn’t put right after we ask, the licence ends, and the Pro code should come out of anything not yet shipped. Projects shipped while the licence was in good standing can stay as they are.</P>,
        },
        {
          id: 'questions',
          title: 'Not sure?',
          body: (
            <P>
              If something you’re planning isn’t clearly covered, write to{' '}
              <a href={`mailto:${CONTACT}`} className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
                {CONTACT}
              </a>{' '}
              before you build it. The answer is usually yes. See also the{' '}
              <Link href="/terms" className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
                terms
              </Link>{' '}
              and the{' '}
              <Link href="/refunds" className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
                refund policy
              </Link>
              .
            </P>
          ),
        },
      ]}
    />
  )
}
