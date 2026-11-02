'use client'

import { Announcement } from '../components/announce/Announcement'
import { Popup } from '../components/popup/Popup'

const Stage = ({ children }: { children: React.ReactNode }) => <div className="grid size-full grid-cols-[minmax(0,1fr)] place-items-center p-4">{children}</div>

export function AnnounceDemo() {
  return (
    <Stage>
      <Announcement href="#" dismissible>
        Version 2 is here
      </Announcement>
    </Stage>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex h-11 items-center gap-4">
    <span className="w-[76px] shrink-0 text-right text-[14px] text-ink-3">{label}</span>
    {children}
  </div>
)

export function PopupDemo() {
  return (
    <Stage>
      <div className="w-[340px] max-w-full text-ink">
        <p className="pl-[92px] text-[22px] font-semibold tracking-[-.02em]">Design review</p>
        <p className="mb-11 mt-1 pl-[92px] text-[14px] text-ink-3">Thursday 6 Nov, 10:00</p>
        <Field label="Repeat">
          <Popup label="Repeat" defaultValue="Every day" options={['Never', 'Every day', 'Every week', 'Every 2 weeks', 'Every month']} />
        </Field>
        <Field label="Alert">
          <Popup label="Alert" defaultValue="10 minutes before" options={['At time of event', '10 minutes before', '30 minutes before', '1 hour before']} />
        </Field>
        <Field label="Calendar">
          <Popup label="Calendar" options={['Work', 'Home', 'Studio']} />
        </Field>
      </div>
    </Stage>
  )
}
