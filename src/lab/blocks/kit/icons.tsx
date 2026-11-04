import { useId } from 'react'
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 18, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  )
}

export const Check = (p: P) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
)

export const ChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  </Svg>
)

export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 6.5 15 12l-5.5 5.5" />
  </Svg>
)

export const ChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 6.5 9 12l5.5 5.5" />
  </Svg>
)

export const Reset = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4.5v4h4" />
  </Svg>
)

export const Close = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Svg>
)

export const Plus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
)

export const Search = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.25" />
    <path d="m15.75 15.75 3.75 3.75" />
  </Svg>
)

export const Orbit = (p: P) => (
  <Svg {...p}>
    <path d="M18.06 8.5A7 7 0 1 1 15.5 5.94" />
    <circle cx="16.95" cy="7.05" r="1.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const Refresh = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </Svg>
)

export const Note = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M8.75 8.5h6.5M8.75 12h6.5M8.75 15.5h3.5" />
  </Svg>
)

export const FilePage = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 3.5H8A2.5 2.5 0 0 0 5.5 6v12A2.5 2.5 0 0 0 8 20.5h8a2.5 2.5 0 0 0 2.5-2.5V8.5Z" />
    <path d="M13.5 3.5v5h5" />
  </Svg>
)

export const Copy = (p: P) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </Svg>
)

export const ArrowUp = (p: P) => (
  <Svg {...p}>
    <path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5" />
  </Svg>
)

export const ArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />
  </Svg>
)

export const ArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5.5M11 6.5 5.5 12l5.5 5.5" />
  </Svg>
)

export const Return = (p: P) => (
  <Svg {...p}>
    <path d="M18.5 5.5V11a3 3 0 0 1-3 3H5.5M10 9.5 5.5 14l4.5 4.5" />
  </Svg>
)

export const ArrowUpRight = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 16.5l9-9M9 7.5h7.5V15" />
  </Svg>
)

export const Pencil = (p: P) => (
  <Svg {...p}>
    <path d="M11.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h10a2.5 2.5 0 0 0 2.5-2.5v-4.5" />
    <path d="M17.6 3.9a1.9 1.9 0 0 1 2.7 2.7l-7.8 7.8-3.5.8.8-3.5Z" />
  </Svg>
)

export const Folder = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.4c.6 0 1.1.2 1.5.6l1.2 1.2c.4.4.9.6 1.5.6H18a2.5 2.5 0 0 1 2.5 2.5v6.6A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5Z" />
  </Svg>
)

export const Code = (p: P) => (
  <Svg {...p}>
    <path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5" />
  </Svg>
)

export const Download = (p: P) => (
  <Svg {...p}>
    <path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14" />
  </Svg>
)

export const Upload = (p: P) => (
  <Svg {...p}>
    <path d="M12 15.5v-11M7.5 9 12 4.5 16.5 9M5 19.5h14" />
  </Svg>
)

export const Thumb = ({ down, ...p }: P & { down?: boolean }) => (
  <Svg {...p} style={{ transform: down ? 'scale(1, -1)' : undefined, ...p.style }}>
    <path d="M7.5 10.5 11 4a1.8 1.8 0 0 1 3.3 1.3l-.8 3.7h4.9a2 2 0 0 1 2 2.4l-1.2 6.4a2 2 0 0 1-2 1.7H7.5Z" />
    <path d="M4.5 10.5h3v9h-3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" />
  </Svg>
)

export const Sun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
  </Svg>
)

export const Moon = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
  </Svg>
)

export const Stop = (p: P) => (
  <Svg {...p}>
    <rect x="7" y="7" width="10" height="10" rx="2.25" fill="currentColor" stroke="none" />
  </Svg>
)

export const Pause = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2}>
    <path d="M9 7v10M15 7v10" />
  </Svg>
)

export const Mail = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 5.25 7.5-5.25" />
  </Svg>
)

export const Expand = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5l-6 6M4.5 19.5l6-6" />
  </Svg>
)

export const Card = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M3.5 10h17M7 15h3" />
  </Svg>
)

export const Bolt = (p: P) => (
  <Svg {...p}>
    <path d="M13 3.5 5.5 13.5h6l-1 7 7.5-10h-6Z" />
  </Svg>
)

export const People = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.3a5.5 5.5 0 0 1 3 4.7" />
  </Svg>
)

export const Person = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 19.5a7 7 0 0 1 14 0" />
  </Svg>
)

export const Sliders = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7.5h8.5M17 7.5h2.5M4.5 16.5H7M11 16.5h8.5" />
    <circle cx="15" cy="7.5" r="2" />
    <circle cx="9" cy="16.5" r="2" />
  </Svg>
)

export const Key = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="15.5" r="3.75" />
    <path d="M10.7 12.8 19 4.5M16 7.5l2.5 2.5M13.75 9.75l2 2" />
  </Svg>
)

export const Shield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 5 6.5v5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9v-5Z" />
    <path d="m9.25 12 2 2 3.5-3.75" />
  </Svg>
)

export const Lock = (p: P) => (
  <Svg {...p}>
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
)

export const Sidebar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M9.5 4.5v15" />
  </Svg>
)

export const PullRequest = (p: P) => (
  <Svg {...p}>
    <circle cx="6.5" cy="6" r="2" />
    <circle cx="6.5" cy="18" r="2" />
    <circle cx="17.5" cy="18" r="2" />
    <path d="M6.5 8v8M17.5 16v-6.5a3 3 0 0 0-3-3H11" />
    <path d="m13 4.5-2 2 2 2" />
  </Svg>
)

export const Clock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const Terminal = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="m7.5 9.5 2.5 2.5-2.5 2.5M12.5 14.5h4" />
  </Svg>
)

export const Filter = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7h15M7.5 12h9M10.5 17h3" />
  </Svg>
)

export const Mic = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
  </Svg>
)

export const MicOff = (p: P) => (
  <Svg {...p}>
    <path d="M15 9.5V6.5a3 3 0 0 0-5.6-1.5M9 9v2.5a3 3 0 0 0 4.9 2.3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 10.6 5M18.4 13a6.5 6.5 0 0 0 .1-1.5M12 18v2.5M4 4l16 16" />
  </Svg>
)

export const Captions = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
    <path d="M7.5 13.5h5M14.5 13.5h2M7.5 10.5h2M11.5 10.5h5" />
  </Svg>
)

function Solid({ size = 22, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
      {children}
    </svg>
  )
}

const HANDSET = 'M2.75 12.9C2.75 9.55 6.9 7.6 12 7.6S21.25 9.55 21.25 12.9v1.55c0 .95-.8 1.65-1.75 1.5l-2.6-.4a1.6 1.6 0 0 1-1.35-1.58v-1.4A12.6 12.6 0 0 0 12 11.9c-1.25 0-2.4.18-3.55.67v1.4a1.6 1.6 0 0 1-1.35 1.58l-2.6.4c-.95.15-1.75-.55-1.75-1.5Z'

export const MicSolid = (p: P) => (
  <Solid {...p}>
    <rect x="8.25" y="2.5" width="7.5" height="12.5" rx="3.75" />
    <path d="M5.25 11.25a6.75 6.75 0 0 0 13.5 0M12 18v3.25" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" />
  </Solid>
)

export function MicOffSolid(p: P) {
  const id = useId()
  return (
    <Solid {...p}>
      <mask id={id}>
        <rect width="24" height="24" fill="#fff" />
        <path d="M4.5 3.5 19.5 20.5" stroke="#000" strokeWidth={5} strokeLinecap="round" />
      </mask>
      <g mask={`url(#${id})`}>
        <rect x="8.25" y="2.5" width="7.5" height="12.5" rx="3.75" />
        <path d="M5.25 11.25a6.75 6.75 0 0 0 13.5 0M12 18v3.25" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" />
      </g>
      <path d="M4.5 3.5 19.5 20.5" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" />
    </Solid>
  )
}

export const Handset = (p: P) => (
  <Solid {...p}>
    <path d={HANDSET} />
  </Solid>
)

export function CaptionsSolid(p: P) {
  const id = useId()
  return (
    <Solid {...p}>
      <mask id={id}>
        <rect width="24" height="24" fill="#fff" />
        <path d="M6.75 10.25h3.5M12.25 10.25h5M6.75 13.75h7.5M16.25 13.75h1" stroke="#000" strokeWidth={1.9} strokeLinecap="round" />
      </mask>
      <rect x="3" y="5.5" width="18" height="13" rx="3.75" mask={`url(#${id})`} />
    </Solid>
  )
}

export const Calendar = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
)

export const Undo = (p: P) => (
  <Svg {...p}>
    <path d="M9 14 4.5 9.5 9 5" />
    <path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3" />
  </Svg>
)

export const Chart = (p: P) => (
  <Svg {...p}>
    <path d="M5 19.5v-7M10 19.5v-15M15 19.5v-9M20 19.5v-12" />
  </Svg>
)

export const Chats = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 4.5h9A2.5 2.5 0 0 1 19 7v6.5a2.5 2.5 0 0 1-2.5 2.5H10.5L6.5 19.5V16A2.5 2.5 0 0 1 5 13.5V7a2.5 2.5 0 0 1 2.5-2.5Z" />
  </Svg>
)

export const Share = (p: P) => (
  <Svg {...p}>
    <path d="M12 14V3.5M8.25 7.25 12 3.5l3.75 3.75" />
    <path d="M8.5 10.5h-1A2.5 2.5 0 0 0 5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13a2.5 2.5 0 0 0-2.5-2.5h-1" />
  </Svg>
)

export const Link = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
  </Svg>
)

export const Trash = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.8 11a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-11" />
  </Svg>
)

export const LogOut = (p: P) => (
  <Svg {...p}>
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7M10.5 12h9M16.5 8.5 20 12l-3.5 3.5" />
  </Svg>
)

export const Help = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M9.75 9.75a2.25 2.25 0 1 1 3.1 2.08c-.5.2-.85.68-.85 1.22v.45" />
    <path d="M12 16.5h.01" strokeWidth={2.2} />
  </Svg>
)

export const Grid = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="4.5" width="6" height="6" rx="1.75" />
    <rect x="13.5" y="4.5" width="6" height="6" rx="1.75" />
    <rect x="4.5" y="13.5" width="6" height="6" rx="1.75" />
    <rect x="13.5" y="13.5" width="6" height="6" rx="1.75" />
  </Svg>
)

export const Paperclip = (p: P) => (
  <Svg {...p}>
    <path d="m19 11.5-7.1 7.1a4.5 4.5 0 0 1-6.4-6.4l7.6-7.6a3 3 0 0 1 4.25 4.25l-7.4 7.4a1.5 1.5 0 0 1-2.1-2.1l6.7-6.7" />
  </Svg>
)

export const Photo = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="14" rx="3" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m20 15.5-4.2-4.2a1.5 1.5 0 0 0-2.1 0L6 19" />
  </Svg>
)

export const Plan = (p: P) => (
  <Svg {...p}>
    <path d="m4.5 7 1.5 1.5L8.75 5.75M4.5 15l1.5 1.5 2.75-2.75M11.5 7.5h8M11.5 15.5h8" />
  </Svg>
)

export const At = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.25" />
    <path d="M15.25 12v1.5a2.25 2.25 0 0 0 4.5 0V12a7.75 7.75 0 1 0-3.1 6.2" />
  </Svg>
)

export const Slash = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <path d="m14 8-4 8" />
  </Svg>
)
