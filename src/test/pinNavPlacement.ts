/**
 * Pin the LEFT RAIL for a suite written before the rail had an alternative.
 *
 * `nav-placement` made the rail one of TWO navigations and, on this branch,
 * not the default one — so a suite that renders the shell and then asserts
 * about rail rows is now asserting about an option it never asked for. These
 * suites are option 1's tests; this makes them say so.
 *
 * ⚠ IT MERGES RATHER THAN OVERWRITES. `?ff=` overrides are read from
 * `window.location.search` (not the MemoryRouter entry), and several of these
 * suites set their own `ff` before rendering — clobbering the param would
 * silently drop the flag the test was actually about, which fails in a way
 * that looks like the feature broke. An existing `nav-placement` token is left
 * alone, so a test CAN still opt into the top nav.
 */
export function pinLeftRail() {
  const url = new URL(window.location.href)
  const ff = url.searchParams.get('ff')
  const alreadySet = ff?.split(',').some((tok) => tok.split(':')[0] === 'nav-placement')
  if (alreadySet) return
  url.searchParams.set('ff', ff ? `${ff},nav-placement:left` : 'nav-placement:left')
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}
