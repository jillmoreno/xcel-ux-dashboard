/**
 * THE DEMO CLOCK'S DAY OFFSET — 2026-09-21.
 *
 * Every dated surface in this app is anchored to one constant, `FIXTURE_TODAY`,
 * so the demo renders the same states whenever it is opened. That anchor is a
 * MONDAY, which is correct and unhelpful: the pace card's week strip shows how
 * much of each day was studied, and on a Monday exactly one day has elapsed, so
 * the feature is invisible whatever the data says.
 *
 * This shifts the anchor by whole days. `FIXTURE_TODAY` derives from it, so
 * every one of its ~30 call sites moves together — the header countdown, the
 * study calendar, course expiry, the journey and the pace card all agree about
 * what day it is. That agreement is the whole reason it is done here rather
 * than by passing a different `today` to the pace tile: a card saying Thursday
 * beside a plan saying Monday is the cross-surface disagreement this repo
 * treats as a defect.
 *
 * ⚠ IT IS READ ONCE, AT MODULE LOAD, AND CHANGING IT NEEDS A RELOAD. That is
 * the deliberate trade. `FIXTURE_TODAY` is a `const` that fixtures evaluate at
 * import time — `courseExpiry`, `notificationsFixtures` and `myCoursesFixtures`
 * are plain data modules with no React context to subscribe to — so making the
 * clock reactive would mean turning every one of those constants into a
 * function and threading a value through code that has no component tree. The
 * demo control reloads the page instead, which also guarantees that nothing is
 * left holding a date from the previous clock.
 *
 * PER BROWSER and never committed, the same footing as `cgp.examDate`: it is
 * the reviewer's own view of the demo, so a machine holding one shows a
 * different week from a clean machine with nothing in the repo to explain it.
 * `clearDemoDayOffset()` is the way back.
 */
const KEY = 'cgp.demoDayOffset'

/** Whole days to add to the base anchor. Clamped hard — an offset big enough to
 *  walk past a course's expiry would change which STATE every fixture is in,
 *  which is a different demo rather than the same one on another day. */
const MAX_OFFSET = 6

export function readDemoDayOffset(): number {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return 0
    const n = Number(raw)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(MAX_OFFSET, Math.trunc(n)))
  } catch {
    // Storage unavailable (private mode, a sandboxed frame, a thumbnail
    // capture). The anchor stands, which is the right default everywhere.
    return 0
  }
}

/**
 * Write the offset and reload, because the constants that read it are already
 * evaluated. The reload is the mechanism, not a side effect of one — see the
 * file header.
 */
export function setDemoDayOffset(days: number) {
  try {
    localStorage.setItem(KEY, String(Math.max(0, Math.min(MAX_OFFSET, Math.trunc(days)))))
  } catch {
    /* storage unavailable — the clock simply does not move */
  }
  if (typeof location !== 'undefined') location.reload()
}

export function clearDemoDayOffset() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}
