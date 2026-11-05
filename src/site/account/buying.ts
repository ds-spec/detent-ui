import { PLANS } from '@/catalog/pro'
import type { Buying } from './Forms'

export const buying = (id?: string): Buying | undefined => {
  const plan = PLANS.find((p) => p.id === id)
  return plan && { id: plan.id, name: plan.name, price: plan.price, line: plan.line, features: plan.features }
}

export const allBuying = () => PLANS.map((p) => buying(p.id)!)
