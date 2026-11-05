'use client'

import { Carousel } from '../components/carousel/Carousel'
import type { Slide } from '../components/carousel/Carousel'
import { useBench } from '@/lab/demos/bench'

const SLIDES: Slide[] = [
  { id: 'alpine', title: 'Alpine', src: '/media/search/alpine-lake.webp', alt: 'A green lake under snowy peaks' },
  { id: 'dunes', title: 'Dunes', src: '/media/search/dunes.webp', alt: 'Sand dunes in low sun' },
  { id: 'lighthouse', title: 'Lighthouse', src: '/media/search/lighthouse.webp', alt: 'A lighthouse on the coast' },
  { id: 'fog', title: 'Fog', src: '/media/search/fog-forest.webp', alt: 'Pines in morning fog' },
  { id: 'peaks', title: 'Peaks', src: '/media/search/snow-peaks.webp', alt: 'Snow on mountain peaks' },
]

export function CarouselDemo() {
  const b = useBench()
  return (
    <div className="w-[760px] max-w-full max-sm:w-[400px]">
      <Carousel slides={SLIDES} autoplay={b.get('autoplay', 5000)} label="Places" onChange={b.on('onChange')} />
    </div>
  )
}
