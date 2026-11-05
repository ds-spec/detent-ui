'use client'

import { useRouter } from 'next/navigation'

export function useIntent() {
  const router = useRouter()
  return (href: string) => {
    const warm = () => router.prefetch(href)
    return { onPointerEnter: warm, onPointerDown: warm, onFocus: warm }
  }
}
