/**
 * Count + unit, pluralised.
 *
 * Added 2026-09-16 with the QE path's move from credit hours to DAYS of XCEL's
 * 7-day study plan. `hrs` is unit-invariant, so nothing in this app had ever
 * needed to pluralise a count — the moment one unit did, four surfaces printed
 * "1 days": the category bars, the band's KPI cell, the journey rows and the
 * detail sheet.
 *
 * Shared rather than fixed in each, for the reason `DELIVERY_LABEL` moved to
 * `courseDelivery`: four copies of a rule is four places for it to be wrong,
 * and three of them would have been fixed.
 *
 * The rule is deliberately narrow — drop a trailing "s" at exactly 1 — because
 * the units in play are "hrs" and "days". A unit with an irregular plural wants
 * a real pluraliser, not a special case bolted onto this.
 */
export function unitCount(count: number, unit: string): string {
  return `${count} ${count === 1 && unit.endsWith('s') ? unit.slice(0, -1) : unit}`
}
