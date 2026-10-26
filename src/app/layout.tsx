import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SITE } from '@/catalog/pro'
import { Providers } from '@/site/Providers'
import { DESCRIPTION, NAME, TAGLINE } from '@/site/seo'
import { MarkdownAlternateLink } from '@/site/MarkdownAlternateLink'

// Geist: a plain Swiss grotesk. Big type is set regular and tight, so size does the work, not weight.
const sans = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap', preload: false })

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${NAME} — React components for AI products`, template: `%s · ${NAME}` },
  description: DESCRIPTION,
  applicationName: NAME,
  keywords: ['React components', 'AI UI components', 'shadcn', 'Tailwind CSS', 'Next.js', 'chat UI', 'AI chat components', 'agent UI', 'streaming answer', 'model picker', 'component library', 'React templates'],
  authors: [{ name: NAME, url: SITE }],
  creator: NAME,
  publisher: NAME,
  category: 'technology',
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  alternates: {
    canonical: '/',
    types: {
      'text/markdown': `${SITE}/index.md`,
    },
  },
  other: {
    'ai-summary': DESCRIPTION,
  },
  // The shared image is app/opengraph-image.tsx; sections and detail pages draw their own.
  openGraph: { title: `${NAME} — ${TAGLINE}`, description: DESCRIPTION, siteName: NAME, type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: `${NAME} — ${TAGLINE}`, description: DESCRIPTION },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

// Runs before first paint, so the page never flashes the wrong theme. Light unless dark was chosen,
// or the system's was and the system is dark.
const theme = `try{var s=localStorage.getItem('theme');var d=s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: theme }} />
        <MarkdownAlternateLink />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
