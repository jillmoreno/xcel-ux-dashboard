import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * Which of the two navigations the rebrand shell draws — `nav-placement`.
 *
 * Kept OUT of `PlatformTopNav.tsx` so that file only exports components
 * (react-refresh lint), the same split `platformNav.ts` makes for the rail.
 * It also happens to be the honest home for it: both the header and the shell
 * read the placement, and neither of them is reading it "from the top nav".
 */

/**
 * The three options this branch compares.
 *
 *   `top`    — Option 1: the header row, no rail (Figma 765:3801).
 *   `left`   — Option 2: the rail, as it ships.
 *   `hybrid`      — Option 3: the header row AND the rail.
 *   `hybrid-tabs` — Option 4: the header row, no rail, and a tab strip over the
 *                   content for the learning sections (Figma 765:3801).
 *
 * ⚠ THREE AND FOUR ARE BOTH HYBRIDS, and the difference is what fills the gap a
 * three-item header leaves: Option 3 keeps the rail for it, Option 4 uses a tab
 * strip. Option 4 was briefly built as a REPLACEMENT for Option 3; it is a
 * fourth option, and both stand.
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
 * Does this placement draw the HEADER row? (Options 1 and 3.)
 *
 * Two predicates rather than the raw value at each call site, because the
 * header and the shell ask different questions of the same answer and `hybrid`
 * is the arm where those answers differ from each other. A `=== 'top'` left
 * behind in either place is the bug this shape prevents.
 */
export function showsTopNav(p: NavPlacement): boolean {
  return p === 'top' || p === 'hybrid' || p === 'hybrid-tabs'
}

/** Does this placement draw the RAIL? (Options 2 and 3.) */
export function showsRail(p: NavPlacement): boolean {
  return p === 'left' || p === 'hybrid'
}

/**
 * Does this placement draw the HOME TAB STRIP? (Option 4 only.)
 *
 * It is what stands in for the rail there: without it Study Pace, Courses and
 * Certificates would have no control at all under a three-item header. Option 3
 * answers the same gap with the rail, which is the whole difference between the
 * two hybrids.
 */
export function showsSectionTabs(p: NavPlacement): boolean {
  return p === 'hybrid-tabs'
}
