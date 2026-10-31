import { redirect } from 'next/navigation'
import { FIRST_BLOCK } from '@/catalog/site'

// The blocks page always has a block open, with every other one down its side; start with the first.
export default function BlocksPage() {
  redirect(FIRST_BLOCK)
}
