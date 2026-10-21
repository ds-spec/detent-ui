import { redirect } from 'next/navigation'
import { ENTRIES } from '@/catalog/meta'

// The browser always has a component open; start with the first.
export default function ComponentsPage() {
  redirect(`/components/${ENTRIES[0].id}`)
}
