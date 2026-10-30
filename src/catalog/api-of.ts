import { asset } from '@/lib/asset'
import type { Api } from './api'
import { FILES } from './source'

/** A free component's props, worked out at build time. */
export async function apiOf(id: string) {
  return FILES[id] ? asset<Api>(`api/${id}.json`) : null
}
