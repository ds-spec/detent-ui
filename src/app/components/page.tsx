import { redirect } from 'next/navigation'
import { FIRST_COMPONENT } from '@/catalog/site'

// The components page always has a component open, with every other one down its side; it opens
// on the best one.
export default function ComponentsPage() {
  redirect(FIRST_COMPONENT)
}
