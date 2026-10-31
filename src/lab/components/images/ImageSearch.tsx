'use client'

import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Close, Search, Spark } from '@/lab/icons'
import { useSize } from '@/lab/lib/hooks'

export type SearchImage = {
  id: string
  src: string
  /** The image's own size, for its shape in the grid. */
  width: number
  height: number
  /** What it shows, for people who can't see it. */
  alt: string
  /** What a vision model sees in it: subjects, places, light, mood. Matching reads these. */
  tags: string[]
}
/** One result: how well an image matches, and which words of the query it matched. */
export type ImageMatch = { id: string; score: number; matched: string[] }
/** For demos and tests: type, find images like one, or point at one, without a pointer. */
export type ImageSearchHandle = { type(query: string): void; like(id: string | null): void; point(id: string | null): void }

const STOP = new Set(['the', 'and', 'with', 'over', 'into', 'from', 'for', 'that', 'this', 'some', 'very', 'any', 'are', 'its', 'off', 'out', 'onto', 'under', 'near', 'like', 'just', 'kind'])
const NOT = /^(no|not|without|non)$/
const GAP = 6
const SPRING = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as const

/** The query as words, each marked as a term to match, a term to avoid ("no people"), or filler. */
function read(query: string) {
  const out: { text: string; at: number; term: string | null; avoid: boolean }[] = []
  let avoid = false
  for (const m of query.matchAll(/[\p{L}\p{N}'-]+/gu)) {
    const w = m[0].toLowerCase()
    if (NOT.test(w)) {
      out.push({ text: m[0], at: m.index!, term: null, avoid: false })
      avoid = true
      continue
    }
    const term = w.length > 2 && !STOP.has(w) ? w : null
    out.push({ text: m[0], at: m.index!, term, avoid: avoid && !!term })
    if (term) avoid = false
  }
  return out
}

/** A tag and a word mean the same when one starts the other: water and waters, golden and gold. */
const meets = (tag: string, term: string) => tag === term || (Math.min(tag.length, term.length) >= 4 && (tag.startsWith(term) || term.startsWith(tag)))
const has = (img: SearchImage, term: string) => img.tags.some((t) => t.split(' ').some((part) => meets(part, term)) || meets(t, term))

/**
 * The default matcher, a stand-in for a vision model's embeddings: each word of the query is
 * looked for in an image's tags, "no people" counts against images that have people, and an image
 * to find more like adds how much of its tags each image shares. Swap it for your own search; it
 * only has to say how well each image scores and which words it matched.
 */
export function matchImages(query: string, images: SearchImage[], like?: SearchImage | null): ImageMatch[] {
  const words = read(query).filter((w) => w.term)
  const want = words.filter((w) => !w.avoid)
  const avoid = words.filter((w) => w.avoid)
  return images.map((img) => {
    const hit = want.filter((w) => has(img, w.term!))
    const clear = avoid.filter((w) => !has(img, w.term!))
    let score = want.length ? hit.length / want.length : words.length ? 1 : 0
    if (clear.length < avoid.length) score *= 0.15
    if (like) {
      const shared = img.tags.filter((t) => like.tags.includes(t)).length / new Set([...img.tags, ...like.tags]).size
      score = words.length ? score * 0.55 + shared * 0.45 * 2 : Math.min(1, shared * 2.2)
      // The image you asked for more of always leads.
      if (img.id === like.id) score = 2
    }
    return { id: img.id, score, matched: [...hit, ...clear].map((w) => w.term!) }
  })
}

type Tile = { id: string; x: number; y: number; w: number; h: number }

/** How many images the spread holds: one hero, four beside it, four along the foot. */
const SLOTS = 9

/** On a narrow stage: three columns, the hero two wide and two tall, the next two beside it, six below. */
function stack(width: number): { tiles: Tile[]; height: number } {
  const cw = (width - GAP * 2) / 3
  const rh = Math.round(cw * 0.92)
  const at = (c: number, r: number, cs = 1, rs = 1) => ({ id: '', x: c * (cw + GAP), y: r * (rh + GAP), w: cs * cw + (cs - 1) * GAP, h: rs * rh + (rs - 1) * GAP })
  return {
    tiles: [at(0, 0, 2, 2), at(2, 0), at(2, 1), ...[0, 1, 2].map((c) => at(c, 2)), ...[0, 1, 2].map((c) => at(c, 3))],
    height: 4 * rh + 3 * GAP,
  }
}

/**
 * The spread: rank is size. The best match takes the hero, half the width and two rows tall;
 * the next four sit beside it, two by two; the next four run along the foot.
 */
function spread(width: number, height: number): Tile[] {
  const cw = (width - GAP * 3) / 4
  const foot = Math.round(height * 0.27)
  const top = height - foot - GAP
  const rh = (top - GAP) / 2
  const right = 2 * cw + 2 * GAP
  return [
    { x: 0, y: 0, w: 2 * cw + GAP, h: top },
    { x: right, y: 0, w: cw, h: rh },
    { x: right + cw + GAP, y: 0, w: cw, h: rh },
    { x: right, y: rh + GAP, w: cw, h: rh },
    { x: right + cw + GAP, y: rh + GAP, w: cw, h: rh },
    ...[0, 1, 2, 3].map((i) => ({ x: i * (cw + GAP), y: top + GAP, w: cw, h: foot })),
  ].map((t) => ({ ...t, id: '' }))
}

/**
 * Searching images by describing them. One field and a spread: type what you're after in plain
 * words, "golden light over water, no people", and the spread re-deals as you type. Rank is
 * size: the best match takes the hero, the next four sit beside it, four more run along the foot,
 * and images that don't match leave. Nothing is scored out loud; the layout is the ranking.
 *
 * Point at an image and the query reads it: the words it matched light up in the field, the
 * words it missed step back, so why it ranked where it did is plain without a tooltip. Ask for
 * more like any image and it joins the query as a small thumbnail, and the grid re-ranks around it.
 */
export function ImageSearch({
  images,
  search = matchImages,
  onOpen,
  onQuery,
  onSeeAll,
  placeholder = 'Describe what you’re looking for',
  height = 440,
  ref,
}: {
  /** Every image it can find, with what a vision model sees in each. */
  images: SearchImage[]
  /** Scores every image for a query, and an image to find more like. May answer later, from a server. */
  search?: (query: string, images: SearchImage[], like?: SearchImage | null) => ImageMatch[] | Promise<ImageMatch[]>
  /** Called when an image is opened, by click or Enter. */
  onOpen?: (image: SearchImage) => void
  /** Called with the query and the image to find more like, whenever either changes. */
  onQuery?: (query: string, like: SearchImage | null) => void
  /** Called from the foot to see every match, not just the best nine. Without it, the link is hidden. */
  onSeeAll?: () => void
  /** The field's placeholder. */
  placeholder?: string
  /** The spread's height in px. */
  height?: number
  ref?: Ref<ImageSearchHandle>
}) {
  const reduce = useReducedMotion()
  const uid = useId()
  const [query, setQuery] = useState('')
  const [likeId, setLikeId] = useState<string | null>(null)
  const [aim, setAim] = useState<string | null>(null)
  const [matches, setMatches] = useState<ImageMatch[] | null>(null)
  const field = useRef<HTMLInputElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const { w } = useSize(box)
  const byId = useMemo(() => new Map(images.map((i) => [i.id, i])), [images])
  const like = likeId ? (byId.get(likeId) ?? null) : null
  // A search starts with the first real word; a letter or two leaves the spread as it was.
  const asking = read(query).some((w) => w.term) || !!like

  // Scores arrive from the search, now or later; the grid keeps its last order until they do.
  useEffect(() => {
    let live = true
    onQuery?.(query, like)
    if (!asking) return
    Promise.resolve(search(query, images, like)).then((m) => live && setMatches(m))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, like, images, search, asking])

  const scored = asking && matches ? matches : null
  const score = useMemo(() => new Map((scored ?? []).map((m) => [m.id, m])), [scored])
  // Matches first, best first; then the rest in their own order, which sink and grey.
  const order = useMemo(() => {
    if (!scored) return images.map((i) => i.id)
    const ranked = [...images].sort((a, b) => (score.get(b.id)?.score ?? 0) - (score.get(a.id)?.score ?? 0))
    return ranked.map((i) => i.id)
  }, [images, scored, score])
  const found = scored ? scored.filter((m) => m.score >= 0.34).length : images.length
  const compact = w > 0 && w < 520
  const slots = useMemo(() => (compact ? stack(w).tiles : spread(w, height - 16)), [w, height, compact])
  const stage = compact ? stack(w).height + 16 : height
  // The spread holds the best nine; near misses only fill it when too few match, faded so they read as second.
  const shown = order.slice(0, SLOTS)
  const tiles = shown.map((id, i) => ({ ...slots[i], id }))

  // A finger can't leave: the image it touched stays read until a tap lands somewhere else.
  const fresh = useRef(false)
  useEffect(() => {
    if (!aim) return
    const away = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && !box.current?.contains(e.target as Node)) setAim(null)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [aim])

  const type = (q: string) => {
    setQuery(q)
    if (!q.trim()) setAim(null)
  }
  useImperativeHandle(ref, () => ({ type, like: setLikeId, point: setAim }))

  // The field reads the image being pointed at: matched words in ink with the accent under them, missed ones stepping back.
  const words = read(query)
  const aimed = aim && scored ? score.get(aim) : undefined
  const sync = () => mirror.current && field.current && (mirror.current.style.transform = `translateX(${-field.current.scrollLeft}px)`)

  return (
    <div className="w-full overflow-hidden rounded-[22px] bg-surface shadow-[0_0_0_1px_var(--line),0_24px_60px_-28px_rgb(0_0_0/0.28),0_8px_20px_-12px_rgb(0_0_0/0.1)]">
      {/* The field: the query, an image to find more like, and how many match. */}
      <div className="flex h-14 items-center gap-3 px-5 shadow-[inset_0_-1px_0_var(--line)]">
        <Search size={17} className="shrink-0 text-ink-3" />
        <AnimatePresence initial={false}>
          {like && (
            <motion.span
              key={like.id}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] bg-surface-2 pl-1 pr-1.5"
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.14 } }}
              transition={SPRING}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={like.src} alt="" className="size-6 rounded-[6px] object-cover" />
              <span className="text-footnote text-ink-2">Like this</span>
              <button type="button" aria-label="Stop finding images like this one" onClick={() => setLikeId(null)} className="ring-focus relative grid size-5 place-items-center rounded-full text-ink-3 transition-colors before:absolute before:-inset-2.5 before:content-[''] hover:bg-surface-3 hover:text-ink pointer-fine:before:hidden">
                <Close size={11} />
              </button>
            </motion.span>
          )}
        </AnimatePresence>
        <div className="relative h-full min-w-0 flex-1 overflow-hidden">
          <div ref={mirror} aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre text-[16px] text-ink">
            {words.length ? (
              <Mirror query={query} words={words} matched={aimed?.matched ?? null} />
            ) : null}
          </div>
          <input
            ref={field}
            value={query}
            onChange={(e) => type(e.target.value)}
            onScroll={sync}
            onKeyUp={sync}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (query) type('')
                else setLikeId(null)
              } else if (e.key === 'Backspace' && !query && like) setLikeId(null)
            }}
            placeholder={like ? (w < 340 ? 'Add words' : 'Add words, or search just by the image') : w > 0 && w < 340 && placeholder.length > 22 ? 'Describe a photo' : placeholder}
            aria-label="Search images"
            aria-controls={`${uid}-grid`}
            className="relative h-full w-full bg-transparent text-[16px] text-transparent caret-[var(--ink)] outline-none selection:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)] selection:text-transparent placeholder:text-ink-3"
          />
        </div>
      </div>

      {/* The spread: rank is size, the hero first. */}
      <div className="p-2" style={{ height: stage }}>
        <div ref={box} id={`${uid}-grid`} role="list" className="relative size-full">
          <AnimatePresence initial={false}>
            {w > 0 &&
              tiles.map((t, i) => {
                const img = byId.get(t.id)!
                const m = score.get(t.id)
                const weak = !!scored && (m?.score ?? 0) < 0.34
                const pointed = aim === t.id
                const hero = i === 0
                return (
                  <motion.div
                    key={t.id}
                    role="listitem"
                    className="group absolute left-0 top-0"
                    initial={reduce ? false : { opacity: 0, scale: 0.94, x: t.x, y: t.y, width: t.w, height: t.h }}
                    animate={{ opacity: 1, scale: 1, x: t.x, y: t.y, width: t.w, height: t.h }}
                    exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
                    transition={reduce ? { duration: 0 } : { ...SPRING, delay: i * 0.02 }}
                    onPointerEnter={() => setAim(t.id)}
                    onPointerLeave={(e) => e.pointerType !== 'touch' && setAim(null)}
                    onPointerDownCapture={(e) => void (fresh.current = e.pointerType === 'touch' && aim !== t.id)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (fresh.current) fresh.current = false
                        else onOpen?.(img)
                      }}
                      onFocus={() => setAim(t.id)}
                      onBlur={() => setAim(null)}
                      aria-label={img.alt}
                      className={`ring-focus relative block size-full overflow-hidden bg-surface-2 ${hero ? 'rounded-[16px]' : 'rounded-[12px]'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt=""
                        draggable={false}
                        className="size-full object-cover transition-[filter,opacity,transform] duration-500 ease-out group-hover:scale-[1.03]"
                        style={{ filter: weak && !pointed ? 'saturate(0.45)' : 'none', opacity: weak && !pointed ? 0.55 : 1 }}
                      />
                      {/* The hero carries what the model saw in it, set small like a caption in a magazine. */}
                      {hero && (
                        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end bg-gradient-to-t text-left from-[rgb(0_0_0/0.45)] to-transparent p-4">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span key={img.id} className="text-footnote leading-5 text-white/90" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                              {img.alt}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                      )}
                      <span aria-hidden className={`pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)] ${hero ? 'rounded-[16px]' : 'rounded-[12px]'}`} />
                    </button>
                    {/* Find more like this: the one action on an image, there when you point at it. */}
                    <button
                      type="button"
                      onClick={() => setLikeId(t.id)}
                      onFocus={() => setAim(t.id)}
                      className={`ring-focus absolute right-2 top-2 flex h-7 pointer-coarse:h-9 items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.88)] pl-2 pr-2.5 text-caption font-medium text-[#18181b] shadow-[0_2px_8px_rgb(0_0_0/0.18)] backdrop-blur-md transition-[opacity,transform] duration-200 focus-visible:opacity-100 ${pointed && likeId !== t.id && t.w > 88 ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}
                    >
                      <Spark size={11} />
                      Similar
                    </button>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>
      </div>

      {/* The foot: how many match, and the way to all of them. */}
      <div className="flex h-10 items-center gap-3 px-5 text-caption text-ink-3 shadow-[inset_0_1px_0_var(--line)]" aria-live="polite">
        <span className="tnum">
          {asking ? (
            <>
              <span className="text-ink-2">{found}</span> {found === 1 ? 'match' : 'matches'}
              {found > SLOTS && <>, the best {SLOTS} shown</>}
            </>
          ) : (
            <>
              <span className="text-ink-2">{images.length}</span> images
            </>
          )}
        </span>
        {onSeeAll && (
          <button type="button" onClick={onSeeAll} className="ring-focus ml-auto rounded-[6px] px-1.5 py-0.5 pointer-coarse:min-h-9 text-ink-2 transition-colors hover:text-ink">
            See all
          </button>
        )}
      </div>
    </div>
  )
}

/** The query drawn behind the field, word for word in the same places, so each word can wear its own ink. */
function Mirror({ query, words, matched }: { query: string; words: ReturnType<typeof read>; matched: string[] | null }) {
  const parts: { text: string; tone: 'plain' | 'hit' | 'miss' | 'filler' }[] = []
  let at = 0
  for (const w of words) {
    if (w.at > at) parts.push({ text: query.slice(at, w.at), tone: 'filler' })
    const neg = NOT.test(w.text.toLowerCase())
    // "no" belongs to the word it negates: it lights or steps back with it.
    const term = w.term ?? (neg ? words.find((x) => x.at > w.at && x.term)?.term : null)
    const tone = matched === null ? 'plain' : term ? (matched.includes(term) ? 'hit' : 'miss') : 'filler'
    parts.push({ text: w.text, tone })
    at = w.at + w.text.length
  }
  if (at < query.length) parts.push({ text: query.slice(at), tone: 'filler' })
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className="underline decoration-[1.5px] underline-offset-[5px] transition-[color,text-decoration-color] duration-200"
          style={{
            color: p.tone === 'miss' ? 'color-mix(in oklch, var(--ink) 30%, transparent)' : p.tone === 'filler' && matched ? 'color-mix(in oklch, var(--ink) 45%, transparent)' : 'var(--ink)',
            textDecorationColor: p.tone === 'hit' ? 'var(--accent)' : 'transparent',
          }}
        >
          {p.text}
        </span>
      ))}
    </>
  )
}
