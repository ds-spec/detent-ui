'use client'

import { useRef } from 'react'
import { ImageSearch } from '../components/images/ImageSearch'
import type { ImageSearchHandle, SearchImage } from '../components/images/ImageSearch'
import { useLoop } from '@/lab/demos/loop'
import { useBench } from '@/lab/demos/bench'

/** Photos from Unsplash (Unsplash Licence), each with the tags a vision model might give it. */
const P = (id: string, w: number, h: number, alt: string, tags: string) => ({ id, src: `/media/search/${id}.jpg`, width: w, height: h, alt, tags: tags.split(', ') })
export const PHOTOS: SearchImage[] = [
  P('sea-golden', 600, 400, 'The sea at golden hour under soft clouds', 'sea, ocean, water, waves, horizon, golden, golden hour, sunset, light, warm, clouds, sky, calm'),
  P('fog-forest', 600, 400, 'Pine trees fading into fog', 'forest, pine, trees, fog, mist, green, moody, calm, nature'),
  P('surfer', 600, 900, 'A surfer on a wave at sunset', 'surfer, surfing, person, people, ocean, sea, water, waves, sunset, golden, light, silhouette'),
  P('alpine-lake', 600, 400, 'A turquoise lake under snowy mountains', 'lake, mountains, snow, pine, forest, water, turquoise, reflection, calm, nature'),
  P('coffee', 600, 900, 'Steam rising from a cup in warm light', 'coffee, cup, mug, steam, morning, light, warm, cozy, home, table'),
  P('neon-street', 600, 900, 'A wet street at night under neon signs', 'city, street, night, neon, lights, rain, wet, reflection, urban, people'),
  P('dunes', 600, 400, 'Sculpted sand dunes in low sun', 'desert, sand, dunes, warm, golden, light, shadows, minimal'),
  P('calm-lake', 600, 899, 'A calm lake glowing at golden hour', 'lake, water, calm, golden, golden hour, light, sunset, reflection, warm'),
  P('plant', 600, 800, 'A monstera against a terracotta wall', 'plant, monstera, green, leaves, terracotta, wall, shadows, interior, home'),
  P('snow-peaks', 600, 400, 'Snow-covered mountain peaks', 'mountains, snow, peaks, winter, cold, blue, sky'),
  P('lighthouse', 600, 368, 'A lighthouse on a breakwater at golden hour', 'lighthouse, sea, water, rocks, golden, golden hour, sunset, light, coast, warm'),
  P('cat-window', 600, 400, 'A ginger cat sitting in a patch of sunlight', 'cat, pet, animal, sunlight, light, warm, home, floor'),
  P('dandelion', 600, 400, 'Dandelion seeds blowing away at sunset', 'dandelion, flower, seeds, sunset, golden, light, wind, nature, soft'),
  P('kayak', 600, 338, 'A person in a kayak on a still lake', 'kayak, person, people, lake, water, boat, calm, mountains'),
  P('concrete', 600, 369, 'A brutalist concrete building against blue sky', 'architecture, concrete, brutalist, building, sky, blue, minimal, shadows'),
  P('aerial-shore', 600, 1068, 'A shoreline from above', 'aerial, ocean, sea, water, waves, beach, shore, sand, turquoise'),
  P('autumn', 600, 800, 'Orange autumn leaves', 'autumn, leaves, orange, fall, nature, warm'),
  P('rain-window', 600, 900, 'City lights blurred through a rainy window', 'rain, window, drops, glass, city, lights, night, bokeh, moody'),
  P('balloon', 600, 900, 'A red hot-air balloon over mountains at sunset', 'balloon, hot air, red, sunset, mountains, sky, golden, light'),
  P('desert-road', 600, 400, 'A winding road through red desert rock', 'road, desert, rocks, travel, empty, sky, warm'),
]

const FIRST = 'golden light over water'
const NOPE = ', no people'

/** Describes a photo, narrows it, reads why the dunes and the lake ranked where they did, then finds more like the lighthouse. Touch it to take over. */
export function ImagesDemo() {
  const b = useBench()
  const box = useRef<ImageSearchHandle>(null)
  const handlers = useLoop(async (beat) => {
    const say = async (from: string, add: string) => {
      for (let i = 1; i <= add.length; i++) {
        box.current?.type(from + add.slice(0, i))
        await beat(add[i - 1] === ' ' ? 90 : 52)
      }
    }
    for (;;) {
      box.current?.type('')
      box.current?.like(null)
      await beat(1400)
      await say('', FIRST)
      await beat(1300)
      box.current?.point('surfer')
      await beat(1500)
      box.current?.point(null)
      await say(FIRST, NOPE)
      await beat(1200)
      box.current?.point('dunes')
      await beat(1500)
      box.current?.point('calm-lake')
      await beat(1500)
      box.current?.point(null)
      await beat(500)
      box.current?.type('')
      await beat(700)
      box.current?.point('lighthouse')
      await beat(900)
      box.current?.like('lighthouse')
      box.current?.point(null)
      await beat(3200)
    }
  })
  return (
    <div className="w-[780px] max-w-full" {...handlers}>
      <ImageSearch ref={box} images={PHOTOS} placeholder={b.get('placeholder', 'Describe what you’re looking for')} onOpen={b.on('onOpen')} onQuery={b.on('onQuery')} onSeeAll={b.on('onSeeAll')} />
    </div>
  )
}
