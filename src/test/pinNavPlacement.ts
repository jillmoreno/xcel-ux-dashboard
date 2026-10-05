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
