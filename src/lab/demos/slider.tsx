'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DetentSlider } from '../components/slider/DetentSlider'
import type { Detent, DetentSliderHandle } from '../components/slider/DetentSlider'
import { ease } from '../lib/motion'
import { useBench } from './bench'
import { useLoop } from './loop'

const DETENTS: Detent[] = [
  { value: 0.2, label: 'Precise' },
  { value: 0.7, label: 'Balanced', recommended: true },
  { value: 1.4, label: 'Creative' },
]

/** The same answer at each setting, so moving the slider shows what it does. */
const SAID: Record<string, string> = {
  Precise: 'Refunds are open for 45 days after delivery.',
  Balanced: 'You can ask for a refund up to 45 days after your order arrives.',
  Creative: 'Changed your mind? You’ve got a generous 45 days from delivery to send it back.',
}

/** A model's temperature: it slides to Precise, clicks out to Creative, then settles back on the recommended Balanced. */
export function SliderDemo() {
  const b = useBench()
  const [t, setT] = useState(0.7)
  const s = useRef<DetentSliderHandle>(null)
  const handlers = useLoop(async (beat) => {
    for (;;) {
      await beat(1200)
      await s.current?.glide(0.2, 900)
      await beat(1400)
      await s.current?.glide(1.4, 1400)
      await beat(1600)
      await s.current?.glide(0.7, 1000)
      await beat(1400)
    }
  })
  // The stretch it's in: the nearest detent.
  const zone = DETENTS.reduce((a, d) => (Math.abs(d.value - t) < Math.abs(a.value - t) ? d : a)).label!
  return (
    <div className="w-[400px] rounded-[26px] bg-surface p-5 shadow-float" {...handlers}>
      <DetentSlider ref={s} label="Temperature" value={t} onChange={b.on('onChange', setT)} onDetent={b.on('onDetent')} min={0} max={2} step={0.05} detents={DETENTS} snap={b.get('snap', 9)} format={(v) => v.toFixed(2)} unit="/ 2" />
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-footnote text-ink-3">Sounds like</p>
        {/* Fixed height: the answer changes, the card doesn't. */}
        <div className="relative mt-1.5 h-[44px]">
          <AnimatePresence initial={false}>
            <motion.p
              key={zone}
              className="absolute inset-0 text-callout leading-[22px] text-ink"
              initial={{ opacity: 0, filter: 'blur(3px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(3px)', transition: { duration: 0.14 } }}
              transition={{ duration: 0.28, ease: ease.out }}
            >
              {SAID[zone]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
