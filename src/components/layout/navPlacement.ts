import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * Which navigation the rebrand shell draws, and what follows from it —
 * `nav-placement` + `nav-help`.
 *
 * Kept OUT of `PlatformTopNav.tsx` so that file only exports components
 * (react-refresh lint), the same split `platformNav.ts` makes for the rail.
 * It also happens to be the honest home for it: the header, the shell, the
 * rail, the account menu and the Home band all read this, and none of them is
 * reading it "from the top nav".
 */

/**
 * ONE AXIS, TWO ANSWERS — restructured 2026-10-01, the direct ask ("Left Nav
 * Options, or Top Nav Options").
 *
 *   `left` — the rail carries the destinations, as it ships.
 *   `top`  — a row in the header carries the primary two, and everything the
 *            rail used to hold is re-homed: My Courses + Certificates become
 *            TILES above the Quick Question card on Home (`HomeNavTiles`), and
 *            Help gets a control of its own (`useHelpPlacement`).
 *
 * ⚠ THEY ARE EXCLUSIVE, and that is the change. `hybrid` drew BOTH, which is
 * why Home lit up in two navigations at once — the duplication that made the
 * old Option 3 hard to read. If the header is the navigation, there is no rail
 * for the header to disagree with.
 *
 * ⚠ `hybrid` AND `hybrid-tabs` ARE OFF THE PICKER, NOT GONE. The old four
 * options are still resolvable by URL (`?ff=nav-placement:hybrid`) so the new
 * shape can be compared against what it replaces while the decision is open.
 * They are not offered on the demo bar and nothing new is built for them;
 * deleting them for good is a separate pass, with an ARCHIVED_ITEMS row.
 */
export type NavPlacement = 'left' | 'top' | 'hybrid' | 'hybrid-tabs'

/**
 * Read the placement.
 *
 * OFF RESOLVES TO `left`, deliberately: the rail is what ships, so a reviewer
 * who switches the flag off should get the shipped product back rather than a
 * shell with no navigation at all. Only an explicit `top` moves it.
 */
export function useNavPlacement(): NavPlacement {
  const flag = useFeatureFlag('nav-placement')
  if (!flag.enabled) return 'left'
  if (flag.variant === 'top') return 'top'
  if (flag.variant === 'hybrid') return 'hybrid'
  if (flag.variant === 'hybrid-tabs') return 'hybrid-tabs'
  return 'left'
}

/**
 * Is the navigation exploration ON AT ALL?
 *
 * ⚠ NOT THE SAME QUESTION AS `useNavPlacement() === 'left'`, which is the trap
 * this exists to close: the flag OFF and the flag ON AT `left` both draw the
 * rail, but only the second is the exploration. Anything the exploration ADDS
 * to the left-nav arm — the Compass rail row, the Home greeting — has to hang
 * on this, or it leaks into the shipped rail for everyone.
 */
export function useNavExploration(): boolean {
  return useFeatureFlag('nav-placement').enabled
}

/**
 * WHERE HELP LIVES UNDER THE TOP NAV — `nav-help`, 2026-10-01, the direct ask.
 *
 *   `header-icon`  — a `?` in the header utilities, left of the bell.
 *   `profile-menu` — a row in the account dropdown, directly above Logout.
 *
 * BOTH OPEN THE SAME SHEET (`HelpSheet`), which is the point of the pair: the
 * question is discoverability versus a tidier header, not two different help
 * experiences. One component, two triggers.
 *
 * ⚠ MEANINGLESS UNDER `left`, where the rail's own Get Help row carries it —
 * see `showsHelpControl`. The flag is read unconditionally (rules of hooks) and
 * the caller gates on the placement.
 */
export type HelpPlacement = 'header-icon' | 'profile-menu'

export function useHelpPlacement(): HelpPlacement {
  const flag = useFeatureFlag('nav-help')
  if (!flag.enabled) return 'header-icon'
  return flag.variant === 'profile-menu' ? 'profile-menu' : 'header-icon'
}

/**
 * Does this placement draw the HEADER row?
 *
 * Predicates rather than the raw value at each call site, because the header,
 * the shell, the rail and the Home band ask different questions of the same
 * answer. A `=== 'top'` left behind in any one of them is the bug this shape
 * prevents.
 */
export function showsTopNav(p: NavPlacement): boolean {
  return p === 'top' || p === 'hybrid' || p === 'hybrid-tabs'
}

/** Does this placement draw the RAIL? */
export function showsRail(p: NavPlacement): boolean {
  return p === 'left' || p === 'hybrid'
}

/**
 * Does Home draw the NAV TILES — My Courses + Certificates as buttons above
 * the Quick Question card? (`top` only.)
 *
 * They are what stands in for the rail there. A two-item header leaves both of
 * those with no control at all, and under `top` there is no rail to fall back
 * on and no tab strip either — so without these the sections are reachable
 * only by deep link, which is the gap the old Option 1 shipped with.
 */
export function showsHomeNavTiles(p: NavPlacement): boolean {
  return p === 'top'
}

/**
 * Does Help need a control of its own — the `?` icon or the account-menu row?
 *
 * ⚠ KEYED TO THE RAIL'S ABSENCE, not to `=== 'top'`. The rail carries Get Help
 * as a row, so wherever the rail is up a second Help control is a duplicate;
 * wherever it is not, Help has nowhere else to live. That is the same rule
 * under the off-picker hybrids, which is why they get this for free.
 */
export function showsHelpControl(p: NavPlacement): boolean {
  return !showsRail(p)
}

/**
 * Does this placement draw the HOME TAB STRIP? (`hybrid-tabs`, off the picker.)
 *
 * Kept wired while the old options stay resolvable by URL; nothing new is
 * built on it. `showsHomeNavTiles` is the shape that replaced it.
 */
export function showsSectionTabs(p: NavPlacement): boolean {
  return p === 'hybrid-tabs'
}

/**
 * WHICH SECTIONS SWAP THE SHELL'S TITLE FOR HOME'S HEADER — Courses and
 * Certificates, 2026-10-02, the direct ask.
 *
 * ⚠ THESE TWO BECAUSE THEY ARE THE TILES' DESTINATIONS. Under `top` the Home
 * tiles are the only way into them, so they are the two screens a learner
 * arrives at having just left Home — which is what makes "Back to Home" the
 * right crumb rather than a generic one. Flashcards also navigates (to Compass
 * Learning) and deliberately does NOT get this: it was not asked for, and
 * Compass is reachable from the header's own nav row, so it is not a screen
 * you can only have come from Home.
 */
export const BREADCRUMB_SECTIONS: readonly string[] = ['courses', 'certificates']

/**
 * Does `active` draw the breadcrumb header — `< Back to Home` where Home's
 * greeting sits, and Home's own title under it?
 *
 * ⚠ `top` ONLY, and `=== 'top'` is right here where it is wrong elsewhere.
 * This is not "no rail" (which would take `hybrid-tabs` too) — it is the arm
 * whose Home TILES are how you got here. Under `left` the rail already carries
 * a Home row, so a crumb would be a second way back to a place you can already
 * see; that was the choice, 2026-10-02.
 *
 * ⚠ ONE HOOK, THREE CALL SITES. `PlatformShell` renders the header,
 * `SectionShell` drops the title it replaces, and each page restacks its own
 * controls under it. Three separate `placement === 'top' && active === …`
 * checks is how those three come to disagree — the Home-greeting header has a
 * note recording exactly that risk.
 */
export function useSectionBreadcrumb(active: string): boolean {
  return useNavPlacement() === 'top' && BREADCRUMB_SECTIONS.includes(active)
}
