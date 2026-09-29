import type { FeatureAccent } from '@/data/prototypeFeatures'

/**
 * What picture a Refinement row gets. Both halves ENCODE SOMETHING TRUE about
 * the row; neither is decoration, and neither is random.
 *
 * Exploration rows can show a live miniature of their own URL. Refinement rows
 * cannot — see the note in `GeneratedThumb.tsx` — so the tile has to earn its
 * place some other way. It does it by being readable at a glance:
 *
 *   GLYPH → what kind of thing the link opens.
 *   HUE   → which deploy it lives on, so two rows pointing at the SAME branch
 *           are the same colour. That is the one relationship a list of URLs
 *           hides completely: the host is mid-string, in 11px grey, and two
 *           rows on one branch look exactly as different as two rows on two.
 */

export type LinkThumbKind = 'document' | 'gallery' | 'product' | 'other'

/** Read the destination. Deliberately a small, closed set — a glyph that could
 *  mean anything means nothing, so anything unrecognised says so plainly by
 *  falling to `other` rather than being guessed at. */
export function linkThumbKind(url: string): LinkThumbKind {
  let path: string
  try {
    path = new URL(url).pathname
  } catch {
    return 'other'
  }
  if (/^\/prototypes\//.test(path)) return 'document'
  if (/^\/review\b/.test(path)) return 'gallery'
  if (/^\/dashboard-rebrand/.test(path)) return 'product'
  return 'other'
}

const ACCENTS: FeatureAccent[] = ['teal', 'gold', 'blue', 'neutral']

/**
 * Host → hue, assigned by ORDER OF FIRST APPEARANCE down the list.
 *
 * This started as a hash of the hostname and that was wrong in practice, not
 * just in theory: with four buckets, the four real rows put two DIFFERENT
 * branches on the same hue, which is precisely the false statement the colour
 * exists to avoid — it says "these two are the same work" when they are not.
 * Hashing buys stability (a row keeps its hue as the list grows) and pays for
 * it in collisions. Grouping is the whole point, so it is the wrong trade.
 *
 * Assigning in order makes the first four distinct hosts GUARANTEED distinct,
 * which is the case that actually occurs. Past four the list wraps and
 * collisions return — unavoidable with four hues, and by then the palette is
 * exhausted rather than the idea being wrong.
 *
 * The cost, stated plainly: a row's hue is not stable. Add a row on a new host
 * above it and it shifts. That is fine because the hue is not an identity — it
 * is a "these go together" cue read within one screen — but it does mean the
 * colour must never be the ONLY place a fact appears. The host is also printed
 * under every title.
 */
export function accentsByHost(urls: readonly string[]): Record<string, FeatureAccent> {
  const out: Record<string, FeatureAccent> = {}
  let n = 0
  for (const url of urls) {
    const host = hostKey(url)
    if (host in out) continue
    out[host] = ACCENTS[n % ACCENTS.length]
    n++
  }
  return out
}

/** The grouping key: the HOST, so `…/dashboard-rebrand?demo=1` and
 *  `…/prototypes/x.html` on one branch are one body of work and match.
 *  Unparseable addresses group under the raw string — they still render, and
 *  `safeHref` decides separately whether they are linkable. */
export function hostKey(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
