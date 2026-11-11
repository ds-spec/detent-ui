type Quote = { name: string; handle: string; role: string; text: string; href: string }

const QUOTES: Quote[] = [
  {
    name: 'OPM',
    handle: 'mihirtwt',
    role: 'Design engineer, Amboras (YC)',
    text: 'bro really cooked with detentui.com',
    href: 'https://x.com/mihirtwt/status/2118617432248209800',
  },
  {
    name: 'Ana Bond',
    handle: 'imanabonda',
    role: 'Designer, ex-Snap',
    text: 'love it! definitely not a boring onboarding',
    href: 'https://x.com/imanabonda/status/2119772295539363899',
  },
  {
    name: 'Alex Debecker',
    handle: 'alexdebecker',
    role: 'Growth at Laravel Cloud',
    text: 'very cool',
    href: 'https://x.com/alexdebecker/status/2119806158131364243',
  },
  {
    name: 'Terry Carson',
    handle: 'mrterrycarson',
    role: 'Developer, Chicago',
    text: 'This sounds like a fantastic way to elevate a product’s feel. I’m excited to see what people create with this.',
    href: 'https://x.com/mrterrycarson/status/2119542943878951095',
  },
  {
    name: 'Karan Suthar',
    handle: 'karansuthardev',
    role: 'Builds marketing sites',
    text: 'fan of detent, quality work there.',
    href: 'https://x.com/karansuthardev/status/2120189310695776457',
  },
]

function XMark() {
  return (
    <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

export function Quotes() {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-6">
      {QUOTES.map((q, i) => (
        <li key={q.handle} className={`flex min-w-0 ${QUOTES.length % 3 === 2 && i >= QUOTES.length - 2 ? 'md:col-span-3' : 'md:col-span-2'}`}>
          <a
            href={q.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${q.name} on X: ${q.text}`}
            className="ring-focus group/q flex w-full min-w-0 flex-col justify-between gap-10 rounded-[24px] bg-surface p-6 shadow-[var(--card-edge)] transition-[box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:shadow-[var(--elev-raised)] active:scale-[0.99] sm:p-7"
          >
            <p className="text-[17px] leading-[1.5] tracking-[-0.01em] text-ink">“{q.text}”</p>
            <span className="flex items-center gap-3">
              <img src={`/media/quotes/${q.handle}.jpg`} alt="" width={36} height={36} loading="lazy" className="size-9 shrink-0 rounded-full object-cover shadow-[0_0_0_1px_var(--line)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-ink">
                  {q.name} <span className="text-[12.5px] text-ink-3">@{q.handle}</span>
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-[1.4] text-ink-3">{q.role}</span>
              </span>
              <span className="shrink-0 text-ink-3 transition-colors duration-150 group-hover/q:text-ink">
                <XMark />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
