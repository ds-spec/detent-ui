'use client'

import { AiCalendar } from '../components/week/AiCalendar'
import type { CalEvent, CalPerson } from '../components/week/AiCalendar'
import { useBench } from '@/lab/demos/bench'

const PEOPLE: Record<string, CalPerson> = {
  Priya: { name: 'Priya Shah', photo: 'https://images.unsplash.com/photo-1637325262485-5cf1abb98c05?w=160&h=160&fit=crop&crop=faces&q=80', tint: '#c9734a', online: true },
  Sam: { name: 'Sam Okafor', photo: 'https://images.unsplash.com/photo-1518725522904-4b3939358342?w=160&h=160&fit=crop&crop=faces&q=80', tint: '#6b7bd6', online: false },
  Ana: { name: 'Ana Ruiz', photo: 'https://images.unsplash.com/photo-1736962260221-66372772e63d?w=160&h=160&fit=crop&crop=faces&q=80', tint: '#e0703c', online: true },
  Theo: { name: 'Theo Park', photo: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=160&h=160&fit=crop&crop=faces&q=80', tint: '#4b7bec', online: true },
}

const EVENTS: CalEvent[] = [
  { id: 'a', day: 0, start: 600, dur: 30, title: 'Sprint kickoff', with: 'Theo', where: 'Main room' },
  { id: 'b', day: 1, start: 630, dur: 45, title: 'Onboarding flow review', with: 'Theo', where: 'Figma · Studio, 2nd floor' },
  { id: 'c', day: 1, start: 840, dur: 30, title: 'Pricing call with the Acme team', with: 'Priya', where: 'Google Meet' },
  { id: 'd', day: 1, start: 1005, dur: 60, title: 'Release notes for v3.2', with: 'Sam', where: 'Docs · Shared draft' },
  { id: 'e', day: 2, start: 570, dur: 30, title: 'Coffee chat', with: 'Ana', where: 'Blue Tokai, Indiranagar' },
  { id: 'f', day: 4, start: 840, dur: 30, title: '1:1', with: 'Theo', where: 'Walk' },
  { id: 'g', day: 4, start: 1020, dur: 90, title: 'Team dinner', with: 'Priya', where: 'Toit, 7 PM booking' },
]

export function WeekDemo() {
  const b = useBench()
  return (
    <div className="flex size-full items-center justify-center p-4">
      <AiCalendar month="November 2026" dates={[16, 17, 18, 19, 20, 21, 22]} today={1} now={790} people={PEOPLE} events={EVENTS} onAdd={(e) => b.log('onAdd', e)} />
    </div>
  )
}
