/**
 * Pin the SHIPPED RAIL for a suite written before the rail had an alternative.
 *
 * `nav-placement` made the rail one of TWO navigations and, on this branch, not
 * the default one — so a suite that renders the shell and then asserts about
 * rail rows is now asserting about an option it never asked for. These suites
 * predate the exploration entirely; this makes them say so.
 *
 * ⚠ IT PINS THE FLAG **OFF**, NOT `left` — changed 2026-10-01, and the
 * difference is the whole point of the helper now. Both draw the rail, but
 * `left` is the exploration's left ARM, which legitimately ADDS things the
 * shipped rail does not have (the Compass Learning row, Home's greeting). A
 * suite asserting the shipped rail's exact rows has to mean "the flag is not in
 * play", and `off` is the only spelling of that. Pinning `left` is how four
 * suites started failing on a Compass row they never asked about.
 *
 * ⚠ IT MERGES RATHER THAN OVERWRITES. `?ff=` overrides are read from
 * `window.location.search` (not the MemoryRouter entry), and several of these
 * suites set their own `ff` before rendering — clobbering the param would
 * silently drop the flag the test was actually about, which fails in a way that
 * looks like the feature broke. An existing `nav-placement` token is left
 * alone, so a test CAN still opt into either arm.
 */
export function pinLeftRail() {
  const url = new URL(window.location.href)
  const ff = url.searchParams.get('ff')
  const alreadySet = ff?.split(',').some((tok) => tok.split(':')[0] === 'nav-placement')
  if (alreadySet) return
  url.searchParams.set('ff', ff ? `${ff},nav-placement:off` : 'nav-placement:off')
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}

/**
 * PIN THE DEMOED LICENCE TO NEW YORK — 2026-10-20.
 *
 * ⚠ THESE SUITES ARE ABOUT LAYOUT AND WERE INHERITING A JURISDICTION. QE
 * Focused, Testing, Testing 2 and Testing 3 assert lesson counts, headings
 * and exam facts that happen to be New York's, because New York is what the
 * `auto` default resolved to on every version outside the End-to-End family.
 * Automatic was removed that day and the default became Florida, so ~50
 * assertions across four files went red at once.
 *
 * ⚠ THE FIX IS TO SAY WHAT THEY MEAN, NOT TO FOLLOW THE DEFAULT. Rewriting
 * them to Florida would make them pass and leave them inheriting the next
 * default too — and these files' subject is the LAYOUT each version
 * introduced, not which licence it draws. Pinning makes the jurisdiction a
 * stated premise, so the next person to move the default moves nothing here.
 *
 * ⚠ IT DOES NOT PIN A CASE THAT ALREADY NAMES A COURSE. Same shape as
 * `pinLeftRail` above: a suite or case that sets `dashboard-course-state`
 * itself keeps its own value, which is what leaves the course-axis cases in
 * `QeFocusedVersion` ("does NOT move the Continuing Ed persona off Florida")
 * saying exactly what they always said.
 */
export function pinNewYorkCourse() {
  const url = new URL(window.location.href)
  const ff = url.searchParams.get('ff')
  const alreadySet = ff?.split(',').some((tok) => tok.split(':')[0] === 'dashboard-course-state')
  if (alreadySet) return
  url.searchParams.set('ff', ff ? `${ff},dashboard-course-state:ny` : 'dashboard-course-state:ny')
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}
