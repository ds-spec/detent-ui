import { ImageResponse } from 'next/og'

/* The home-screen icon: the Seated D, light on an ink tile, as in the favicon. */

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#17171a' }}>
      <svg width="112" height="112" viewBox="0 0 24 24">
        <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" fill="#fafafa" />
        <path d="M11.25 3a9 9 0 0 1 0 18z" fill="#fafafa" />
      </svg>
    </div>,
    size,
  )
}
