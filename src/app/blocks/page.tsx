import { redirect } from 'next/navigation'
import { BLOCK_ORDER } from '@/catalog/blocks'

// The blocks page always has a block open, with every other one down its side; start with the first.
export default function BlocksPage() {
  redirect(`/blocks/${BLOCK_ORDER[0].id}`)
}
