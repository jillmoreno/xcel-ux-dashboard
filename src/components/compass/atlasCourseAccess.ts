/**
 * How the course head counts the access window.
 *
 * A plain `.ts` module because `react-refresh/only-export-components` does not
 * let a `.tsx` export a helper alongside its components — the same split this
 * repo already makes for `atlasHandoffPreviewsRegistry.ts` and `v4/sharedUtil.ts`.
 */

/** Where the count switches from days to weeks. Inclusive: 60 still reads in days. */
export const ATLAS_WEEKS_FROM_DAYS = 60

/** Where the amber "expires soon" treatment starts, in days remaining. */
export const ATLAS_EXPIRES_SOON_DAYS = 15

/**
 * "399 days" → "57 weeks". Anything past sixty days counts in weeks.
 *
 * ⚠ 2026-10-21, Jillienne: "anything that is more than 60 days will change to
 * weeks & days". A three-figure day count stops being a quantity anyone can
 * feel — "399 days to complete" is read as "a lot", which is the same thing
 * "57 weeks" says in a form the learner can picture against a calendar. Under
 * the threshold days stay days, because that is the unit someone with a
 * fortnight left is already thinking in.
 *
 * The remainder is dropped when the weeks divide evenly: "57 weeks" rather than
 * "57 weeks, 0 days".
 */
export function accessCountLabel(days: number): string {
  if (days <= ATLAS_WEEKS_FROM_DAYS) return `${days} ${days === 1 ? 'day' : 'days'}`
  const weeks = Math.floor(days / 7)
  const rest = days % 7
  const weekPart = `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  return rest === 0 ? weekPart : `${weekPart}, ${rest} ${rest === 1 ? 'day' : 'days'}`
}
