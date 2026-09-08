/**
 * Stable image picker for course cards.
 *
 * Image pool: real-estate stock photos in /public/courses/0.webp..9.webp.
 *
 * For deterministic round-robin distribution across a list, use
 * `imageForIndex(i)` — guarantees no two adjacent cards share an image.
 *
 * For a free-floating card (e.g. a future course referenced from a route
 * outside any list), use `imageForId(id)` — hashes the id into the pool.
 * Lower collision uniformity, but stable per id.
 */

export const COURSE_IMAGE_COUNT = 10
const COURSE_IMAGES = Array.from({ length: COURSE_IMAGE_COUNT }, (_, i) => `/courses/${i}.webp`)

/** Round-robin image for a fixture entry's array index. */
export function imageForIndex(index: number): string {
  const safe = ((index % COURSE_IMAGE_COUNT) + COURSE_IMAGE_COUNT) % COURSE_IMAGE_COUNT
  return COURSE_IMAGES[safe]
}

/** FNV-1a 32-bit hash → image. Used as a fallback when no index is known. */
function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Stable image URL based on course id. */
export function imageForId(id: string): string {
  return COURSE_IMAGES[hashString(id) % COURSE_IMAGE_COUNT]
}

/** @deprecated use imageForIndex (preferred) or imageForId. Kept for compat. */
export const getCourseImage = imageForId
