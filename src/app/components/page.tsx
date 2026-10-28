import { redirect } from 'next/navigation'
import { ENTRIES } from '@/catalog/meta'

// The components page always has a component open, with every other one down its side; start
// with the first.
export default function ComponentsPage() {
  redirect(`/components/${ENTRIES[0].id}`)
}
