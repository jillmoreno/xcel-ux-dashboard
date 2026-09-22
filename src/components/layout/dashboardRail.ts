/**
 * WHICH ROWS THE RAIL DROPS, and which layout a `?version=` lands on.
 *
 * ITS OWN MODULE as of 2026-09-22, and not for tidiness: both of these are
 * questions asked from OUTSIDE the shell now — the demo bar greys its Readiness
 * dropdown when this says the section is unreachable — and `PlatformShell.tsx`
 * exports components, so sharing a function from there costs Fast Refresh for
 * the whole shell. Plain data and predicates, no React.
 */
import type { DashboardLayout } from '@/data/dashboardVersions'
import type { PlatformSection } from '@/components/layout/PlatformSideNav'

/**
 * Rail rows the TESTING dashboard version drops (2026-09-21). See the note at
 * `trimmedRailSections` for why this is a layout property rather than four
 * `NAV_SECTION_FLAGS` edits.
 *
 * `m-career-tools` is Rubi Insights — the id kept its Elite-era name through
 * two renames (see `careerToolsLabelFor`), so the rail LABEL and this id do not
 * match and that is expected rather than a mistake.
 */
const TESTING_HIDDEN_RAIL_SECTIONS = [
  'study-plan',
  'readiness',
  'resources',
  'm-career-tools',
] as const satisfies readonly PlatformSection[]

/**
 * Which layouts carry the trim — BOTH pacing versions as of 2026-09-21, when
 * Testing 2 was asked for the same rail ("hide all others").
 *
 * A FUNCTION, because the rule had two call sites written as two literal
 * comparisons — the desktop rail and the phone drawer — and the drawer's own
 * note already claimed "one owner for the rule" while being the second copy of
 * it. Adding `'testing-2'` to one and not the other would have given the phone
 * a fuller rail than the desktop on the same version, which is the silent
 * divergence `MobileNavDrawer` reuses the real rail to prevent.
 */
export function hiddenRailSectionsFor(
  layout: DashboardLayout,
): readonly PlatformSection[] | undefined {
  return layout === 'testing' || layout === 'testing-2'
    ? TESTING_HIDDEN_RAIL_SECTIONS
    : undefined
}

/**
 * Which layout a `?version=` resolves to. LIFTED OUT OF THE COMPONENT
 * 2026-09-22, unchanged, so that something outside the shell can ask the rail
 * questions — see {@link railHidesSection}. It was an inline ternary in
 * `PlatformShellBody`, which meant the only way to know what a version renders
 * was to be the thing rendering it.
 */
export function dashboardLayoutForVersion(versionParam: string): DashboardLayout {
  return versionParam === 'discoverability-qe-focused'
    ? 'qe-focused'
    : // "Testing 2" is a CLONE of QE Focused — see its entry in
      // `dashboardVersions`. It resolves to its own layout rather than to
      // 'qe-focused' so the two can be opened in two tabs and compared;
      // everything downstream treats it as QE Focused except the one tile.
      versionParam === 'discoverability-testing-2'
      ? 'testing-2'
    : // "Testing" — QE Focused with the pace/readiness row given over to the
      // pacing exploration. Its own layout value rather than a flag on
      // `qe-focused`, so the picker, the URL and the page all name the same
      // thing; `MembershipOverview` then sets `qeFocused` for it so every
      // other QE behaviour is inherited rather than re-listed.
      versionParam === 'discoverability-testing'
      ? 'testing'
      : versionParam === 'discoverability-learner-focused'
        ? 'learner-focused'
        : versionParam === 'discoverability-badged'
          ? 'badged'
          : 'marketing-focused'
}

/**
 * Whether a `?version=` drops a rail row — i.e. whether that section is
 * UNREACHABLE on this version.
 *
 * Exists for the demo bar, which offers one dropdown per demo axis and must not
 * offer an axis the reviewer cannot see the effect of. Readiness is the case
 * that forced it: both pacing versions hide the rail row, so on the DEFAULT
 * dashboard the Readiness dropdown read "On Track" over a page with no
 * Readiness on it. A dropdown that changes nothing when clicked is the defect
 * the flag audit spent a pass removing.
 *
 * Derived from {@link hiddenRailSectionsFor} rather than re-listing the
 * versions, so un-hiding a row re-enables its control with no second edit.
 */
export function railHidesSection(versionParam: string, section: PlatformSection): boolean {
  return (hiddenRailSectionsFor(dashboardLayoutForVersion(versionParam)) ?? []).includes(section)
}
