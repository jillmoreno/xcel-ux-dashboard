import type { IndividualCourse } from '@/data/catalog/types'
import type { PodcastRecord } from '@/data/podcastFixtures'

/**
 * Convert a catalog `IndividualCourse` into the shape `PodcastCard`
 * renders. Pre-abbreviates the first state so the card stays brand-agnostic.
 *
 * Two callers today: the Catalog page's podcast section and the dashboard's
 * Podcast Spotlight recommended shelf. Keep the projection in one place so
 * card output stays identical across surfaces.
 */
export function toPodcastRecord(
  c: IndividualCourse,
  stateAbbr: Record<string, string>,
): PodcastRecord {
  const firstState = c.states[0] ?? ''
  return {
    id: c.id,
    title: c.title,
    hours: c.hours,
    state: stateAbbr[firstState] ?? firstState,
    delivery: 'podcast',
    badge: c.badge,
    rating: c.rating,
    price: c.price,
    // Forward the catalog's resolved hero (now a topic-matched Unsplash
    // photo) so the dashboard's Podcast Spotlight cards stop falling back
    // to the empty `cre-tile-header` style.
    imageUrl: c.imageUrl,
    chapters: [],
  }
}
