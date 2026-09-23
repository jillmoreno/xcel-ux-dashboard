/* eslint-disable react-refresh/only-export-components -- same pattern as
   AccountContext: provider, hook, types, catalog, and helpers all live
   together so consumers import from a single path. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * Platform-wide feature-flag system. Powers the "Feature Flag" panel
 * surfaced under the Admin tools menu (the robot icon in the dark
 * prototype bar) → UI/UX Demo Tools → Feature Flag, so designers and PMs
 * can toggle in-progress features on / off (and pick a variant where
 * applicable) without changing code.
 *
 * - The flag catalog (`FEATURE_FLAGS`) is the source of truth for what
 *   exists. Each entry declares its default `enabled` state and — if
 *   it has multiple visual treatments — a list of `variants` plus the
 *   default `variant` value.
 * - State is persisted to `localStorage` under `cgp.featureFlags` so a
 *   reviewer's selections survive reloads.
 * - `useFeatureFlag(key)` is the consumer hook — components read
 *   `enabled` + `variant` for a single flag.
 * - `useFeatureFlags()` exposes the entire catalog + setters. The
 *   `<FeatureFlagPanel>` slide-over uses this to render the toggles.
 *
 * Adding a new flag is a one-line change in `FEATURE_FLAGS`. No other
 * wiring required — the panel auto-renders any flags in the catalog.
 */

/** A flag may either be a simple on/off (`variants` omitted) or carry
 *  a string-keyed variant list. The `variant` field is optional even
 *  when `variants` is provided — `undefined` means "use the default
 *  visual" at the consumer site. */
export type FeatureFlagVariant = {
  /** Stable identifier stored to localStorage / passed to consumers. */
  value: string
  /** Human label shown in the panel segmented control. */
  label: string
  /** Optional short description shown under the variant label when the
   *  variant is selected. Helps reviewers understand what changes. */
  description?: string
}

export type FeatureFlagDefinition = {
  /** Stable key — never change after release. localStorage entries
   *  reference this. */
  key: string
  /** Display label in the panel. */
  label: string
  /** Short helper text shown under the label. */
  description: string
  /** Default on/off state. */
  defaultEnabled: boolean
  /** Optional variant list. Omit for simple on/off flags. */
  variants?: FeatureFlagVariant[]
  /** Default variant value. Required when `variants` is set; ignored
   *  otherwise. */
  defaultVariant?: string
  /** Optional SECOND, independent variant dimension — renders as a
   *  second segmented control below the primary one (e.g. a size
   *  control alongside a layout variant). */
  secondaryVariants?: FeatureFlagVariant[]
  /** Default secondary variant value. Required when `secondaryVariants`
   *  is set. */
  defaultSecondaryVariant?: string
  /** Eyebrow label for the secondary variant row. Defaults to
   *  "Variant" when omitted. */
  secondaryVariantLabel?: string
  /** When true, the secondary variant row shows only while the flag is
   *  DISABLED (instead of the default — only while enabled). Used by the
   *  Top 5 flag so the "which view" picker appears exactly when
   *  pagination is turned off. */
  secondaryVariantWhenDisabled?: boolean
  /** Which platform surface this flag controls. Drives the page
   *  selector at the top of `<FeatureFlagPanel>` — reviewers pick
   *  a page first, then see only the flags scoped to that page. */
  page: FeatureFlagPageId
  /** Additional page cards this flag should ALSO surface under (it counts +
   *  renders on each). Use when one flag drives filters on more than one page —
   *  e.g. `profession-count` / `state-count` gate the filter rows on BOTH the
   *  Learning Paths landing and the Recommended for You page, so both flag pages
   *  list them. The primary `page` is unchanged. */
  extraPages?: FeatureFlagPageId[]
  /** Optional sub-section label inside a page. Flags that share
   *  the same `group` string render together under a single
   *  uppercase subhead in `<FeatureFlagPanel>`. Use this to
   *  cluster a family of related flags (e.g. the four
   *  `membership-card-*` flags). Omit on standalone flags. */
  group?: string
  /** Optional mutual-exclusion group. Flags sharing the same
   *  `mutexGroup` behave like radio buttons: enabling one
   *  automatically disables the others in the group. Used for the
   *  two Jump Back In versions (standard vs. quick-links) so only one
   *  ever renders. */
  mutexGroup?: string
}

/* ─── pages ────────────────────────────────────────────────────────── */
//
// Every page that *could* host a flag is listed here, even if it
// has zero flags today — the panel shows them all with "No flags
// yet" so reviewers see the platform's flag-coverage at a glance.
// Add a page here first, then tag new flag definitions with the
// matching `page` key.

export type FeatureFlagPageId =
  | 'dashboard'
  | 'dashboard-rebrand'
  | 'recommended-for-you'
  | 'onboarding-flow'
  | 'membership'
  | 'my-courses'
  | 'course-catalog'
  | 'learning-path'
  | 'learning-library'
  | 'learning-resources'
  | 'my-podcasts'
  | 'certificates'
  | 'account-purchases'

export type FeatureFlagPage = {
  id: FeatureFlagPageId
  label: string
  /** Short helper line shown under the page label in the selector. */
  description: string
}

export const FEATURE_FLAG_PAGES: FeatureFlagPage[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Hero band, sidebar widgets, KPI tiles.',
  },
  {
    id: 'dashboard-rebrand',
    label: 'Dashboard Rebrand',
    description: 'Section heroes, progress state, widgets, left-nav.',
  },
  {
    id: 'recommended-for-you',
    label: 'Recommended for You',
    description: 'Recommended page — tier-aware hero + shelf / catalog cards.',
  },
  {
    id: 'onboarding-flow',
    label: 'Onboarding Flow',
    description: 'New-user setup wizard — education type, goal step, licenses & states.',
  },
  {
    id: 'membership',
    label: 'Membership',
    description: 'Plan comparison, hero, benefit sections.',
  },
  {
    id: 'my-courses',
    label: 'My Courses',
    description: 'Filter rail, status tabs, course grid.',
  },
  {
    id: 'course-catalog',
    label: 'Course Catalog',
    description: 'Multi-brand catalog page sections.',
  },
  {
    id: 'learning-path',
    label: 'Learning Path',
    description: 'Welcome row, mandatory carousel, certificates.',
  },
  {
    id: 'learning-library',
    label: 'Resource Library',
    description: 'Profession filter, category chips, resource grid.',
  },
  {
    id: 'learning-resources',
    label: 'Learning Resources',
    description: 'Resource viewer — attachments block + suggested topics rail.',
  },
  {
    id: 'my-podcasts',
    label: 'My Podcasts',
    description: 'Playlist + browse tabs.',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    description: 'Year / state filters, certificate viewer.',
  },
  {
    id: 'account-purchases',
    label: 'Purchases',
    description: 'Gift Recipients — purchase-for-others history, claim status, reminders.',
  },
]

export type FeatureFlagState = {
  enabled: boolean
  /** `undefined` for simple on/off flags. */
  variant?: string
  /** Optional second, independent variant dimension (e.g. a size
   *  control alongside the primary layout variant). `undefined` unless
   *  the flag defines `secondaryVariants`. */
  secondaryVariant?: string
}

/* ─── catalog ──────────────────────────────────────────────────────── */

/**
 * Source-of-truth feature catalog. Add new entries here and they'll
 * appear in the panel automatically. The order is the render order.
 */
// PER-WIDGET LO-FI IS GONE — removed 2026-09-16 with the flags that carried it.
// `LO_FI_VARIANT` / `DEFAULT_PLUS_LOFI` appended a "Lo-Fi" option to each
// dashboard widget's flag so a reviewer could preview ONE widget as a wireframe
// placeholder. Every flag that offered it was a classic-`/dashboard` flag, and
// the XCEL flag audit removed all of them, so the option had nowhere left to
// appear. The GLOBAL Lo-Fi master switch is untouched (`LoFiContext` /
// `useLoFi`), and every `LoFiScope` wrapper is still in place in DashboardV3 /
// V4 — they now just receive `on={false}`. Restoring the per-widget scope means
// re-adding these two consts and the `variant === 'lo-fi'` reads that were
// pinned alongside each removed flag.

/* ─── left-nav section visibility ──────────────────────────────────────
 *
 * One toggle per rail item, so a reviewer can trim the left nav down to the
 * pages a given conversation is about without touching code.
 *
 * ⚠ HOME HAS NO FLAG, deliberately. The rail is the only way back to the
 * dashboard from a section — the wordmark links to `/dashboard-rebrand` but
 * reads as branding, not navigation — so a reviewer who hid Home would be
 * stranded on whatever section they were on with no way back except editing
 * the URL. "Always on" is a real constraint here, not a simplification, which
 * is why it is expressed as ABSENCE FROM THIS LIST rather than as a flag that
 * happens to default on: there is no toggle to find, and no way to flip it.
 *
 * This list is the single source of truth. `FEATURE_FLAGS` generates one
 * definition per entry below, and `PlatformSideNav` filters its rail items
 * through `navSectionFlagKey`, so the panel and the nav cannot drift — adding a
 * rail item that needs a toggle is one entry here.
 *
 * NOT LISTED, and not an oversight: `membership` and `m-more` (Partner Offers).
 * Both are gated by BRAND CAPABILITY — `supportsMembership` and
 * `hiddenBenefitSections` — and XCEL has neither, so the rail never renders
 * them. A flag for them would be a toggle a reviewer can flip with nothing
 * happening, which is worse than no toggle. Add them here if a brand that has a
 * membership ever returns; the flag is an ADDITIONAL gate on top of those
 * rules, never a replacement for them.
 */
/**
 * THE DEMO RAIL. `defaultEnabled: false` on an entry means the item is off in a
 * fresh browser — a real editorial choice about what a stakeholder sees on the
 * XCEL demo, not a disabled feature. Every section still WORKS; the flag hides
 * the rail row only, and `?section=…` continues to open it (which is what makes
 * a hidden section demoable on request rather than gone).
 *
 * Trimmed to the shipped story on 2026-09-09 (see CLAUDE.md, "The demo rail").
 * The five that are off are off for two different reasons, and the distinction
 * matters when deciding whether to bring one back:
 *
 *   - **Learning Path** — its content is already on Home, in the full-width
 *     Current Learning Path band. The rail row was a second door onto what the
 *     landing page leads with.
 *   - **Podcasts · Recommended for You · Resource Library · Exam & Cert Prep**
 *     — reachable, but not what this demo is about. Podcasts in particular is
 *     an EmptyState for XCEL (no podcast product), so it was showing a rail row
 *     that leads to "not part of the catalog today".
 *
 * Home is absent from this list entirely and can never be hidden — see below.
 */
export const NAV_SECTION_FLAGS: {
  section: string
  label: string
  /** Committed default. Omitted ⇒ true (shown). */
  defaultEnabled?: boolean
}[] = [
  // My Learning
  { section: 'study-plan', label: 'Study Plan' },
  { section: 'readiness', label: 'Readiness' },
  // Off: Home's Current Learning Path band already IS this.
  { section: 'learning-path', label: 'Learning Path', defaultEnabled: false },
  { section: 'courses', label: 'My Courses' },
  { section: 'certificates', label: 'Certificates' },
  // Explore
  //
  // BROWSE CATALOG IS OFF as of 2026-09-16, which empties the Explore group and
  // therefore drops the group and its caption from the rail (a group whose
  // items are all hidden falls out whole — see `PlatformSideNav`). It was the
  // only row left there once Resources and Rubi moved into My Learning.
  //
  // Editorial, not a capability cut, and done through the FLAG rather than by
  // deleting the row for the reason this baseline exists: the section still
  // resolves from `?section=catalog`, so a stakeholder who asks to see the
  // catalogue gets it, and a reviewer can bring the row back from the flag
  // panel without a code change. The QE Focused default is built for a
  // candidate working one booked exam — the shop is the least relevant thing on
  // that rail.
  { section: 'catalog', label: 'Browse Catalog', defaultEnabled: false },
  { section: 'resources', label: 'Resources' },
  { section: 'recommended', label: 'Recommended for You', defaultEnabled: false },
  { section: 'm-learning-library', label: 'Resource Library', defaultEnabled: false },
  { section: 'm-exam-prep', label: 'Exam & Cert Prep', defaultEnabled: false },
  { section: 'm-career-tools', label: 'Rubi Insights' },
  // Off: XCEL has no podcast product — the section is an EmptyState saying so.
  { section: 'podcasts', label: 'Podcasts', defaultEnabled: false },
  // Support
  { section: 'support', label: 'Get Help' },
]

/**
 * Flag key for a rail section. Stable — persisted to localStorage.
 *
 * `nav-show-` rather than `nav-`, because `nav-gray-scale` already exists and
 * is a nav STYLING flag. Sharing a prefix between "what the rail looks like"
 * and "what the rail contains" would make the catalog ambiguous to scan.
 */
export function navSectionFlagKey(section: string): string {
  return `nav-show-${section}`
}

/** The generated Navigation flags, spread into the catalog below. */
const NAV_SECTION_FLAG_DEFINITIONS: FeatureFlagDefinition[] = NAV_SECTION_FLAGS.map(
  ({ section, label, defaultEnabled = true }) => ({
    key: navSectionFlagKey(section),
    group: 'Navigation',
    label,
    description: `Show "${label}" in the left nav. Off removes the rail item; the section itself still resolves, so a deep link to ?section=${section} continues to open it.`,
    defaultEnabled,
    page: 'dashboard-rebrand',
  }),
)

export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  ...NAV_SECTION_FLAG_DEFINITIONS,
  // Per-tile toggles for the Jump Back In Quick Links grid — each tile
  // can be turned on/off independently. The Quick Links section hides
  // entirely when every tile is off.
  {
    key: 'learning-paths-count',
    group: 'Learning Path Card',
    label: 'Learning Paths Count',
    description:
      "Simulate how the dashboard's Learning Paths card + the My Learning Paths slide-over respond to different enrollment volumes. Affects the count badge on the LP card and the picker list — the Header dropdown + LP detail page still read the brand's real fixtures. Defaults to a single path; the Demo Controls \"Multiple learning paths\" persona (#9) is where the multi-path counts are exposed.",
    defaultEnabled: true,
    defaultVariant: 'one',
    variants: [
      {
        value: 'one',
        label: '1 path',
        description:
          "Single active learning path — the dashboard card shows '(1)' and the picker holds one entry.",
      },
      {
        value: 'realistic',
        label: '2–3 paths',
        description:
          "Default — uses each brand's authored fixture (3 paths today).",
      },
      {
        value: 'many',
        label: '10–12 paths',
        description:
          'Pads the list to ~11 entries with rotated status, progress, and cohort suffixes. Exercises the picker scroll + sort.',
      },
      {
        value: 'lots',
        label: '40+ paths',
        description:
          'Pads the list to ~42 entries. Useful for stress-testing the count badge layout and the slide-over scroll performance.',
      },
    ],
    // Page-specific: governs the Learning Path card / sheet, so it lives under
    // the Learning Path page. Still in REBRAND_FLAGS so the rebrand-scoped panel
    // surfaces it under its own page card.
    page: 'learning-path',
  },
  {
    key: 'learning-path-version',
    group: 'Learning Path',
    label: 'Learning Path Page',
    description:
      'Two versions of the "Learning Path" rail item. V1 opens a single learning path directly — when the learner has more than one path, a "Switch Learning Path" link (top-right) opens a sheet to pick another. V2 opens the new searchable landing page listing every learning path (grid or table view).',
    defaultEnabled: true,
    defaultVariant: 'v1',
    variants: [
      {
        value: 'v1',
        label: 'V1 — Single path + Switch',
        description:
          'Default — clicking Learning Path opens a single path. With 2+ paths, a "Switch Learning Path" link in the top right opens a sheet to select a different path.',
      },
      {
        value: 'v2',
        label: 'V2 — Landing page',
        description:
          'Clicking Learning Path opens the new landing page — a searchable list of every learning path (grid or table view). Selecting one opens its detail.',
      },
    ],
    // Page-specific: governs the Learning Path section, so it lives under the
    // Learning Path page. Still in REBRAND_FLAGS so the rebrand-scoped panel
    // surfaces it under its own page card.
    page: 'learning-path',
  },
  {
    key: 'dashboard-tab',
    group: 'Navigation',
    label: 'Dashboard Tab',
    description:
      'Show the Dashboard tab in the top navigation. OFF by default — the Dashboard tab is hidden and the learner lands on the Learning Path page (visiting /dashboard redirects here). Turn ON to reveal the Dashboard tab and open the dashboard. Lives on the Learning Path page because that is where the learner lands while the tab is hidden.',
    // Default hidden — the learner must turn this on to view the dashboard.
    defaultEnabled: false,
    // Scoped to the Learning Path page: that's where the learner lands while
    // the Dashboard tab is hidden, so it's the one place they can toggle it on.
    page: 'learning-path',
  },
  {
    key: 'courses-hide-filters',
    group: 'Courses',
    label: 'Hide Courses Filters',
    description:
      "Hide the Courses page's left filter rail (Results count, Sort By, and the Profession / State / Course Type / Credit Type / Credit Hours / Enrollment Date accordions). The course list expands to full width. Page-specific — affects only the Courses section (the embedded rebrand Courses view). Grouped under the My Courses page; still surfaced in the Dashboard Rebrand scope since that's where the Courses section lives.",
    defaultEnabled: false,
    // Page-specific: this flag governs the Courses page only, so it lives under
    // `my-courses` (not the whole `dashboard-rebrand` feature). It's still in
    // REBRAND_FLAGS so the rebrand-scoped panel surfaces it under its own
    // "My Courses" page card.
    page: 'my-courses',
  },
  {
    key: 'courses-table-view',
    group: 'Courses',
    label: 'Table View',
    description:
      "Show the Card / Table view toggle on the Courses page. Off (default) → only the card grid shows and the toggle is hidden; on → the toggle appears and the sortable table view becomes available. Page-specific — grouped under the My Courses page card.",
    defaultEnabled: false,
    page: 'my-courses',
  },
  {
    key: 'learning-paths-table-view',
    group: 'Learning Path',
    label: 'Table View',
    description:
      "Show the Grid / Table view toggle on the Learning Paths landing page. Off (default) → only the grid of tile cards shows and the toggle is hidden; on → the toggle appears and the sortable table view becomes available. Page-specific — grouped under the Learning Path page card.",
    defaultEnabled: false,
    page: 'learning-path',
  },
  {
    key: 'learning-paths-status-taxonomy',
    group: 'Learning Path',
    label: 'Status Labels',
    description:
      "How the Learning Paths landing labels each path's status (the filter tabs + card badges). Compliance (default) speaks in license terms — On Track / At Risk / Off Track / Not Started / Completed / Expired. Status reframes them to plain progress terms — In Progress / Expiring Soon (< 30 days to expiration) / Not Started / Complete / Expired. Same underlying derivation; only the labels change.",
    defaultEnabled: true,
    defaultVariant: 'compliance',
    variants: [
      {
        value: 'compliance',
        label: 'Compliance',
        description: 'On Track · At Risk · Off Track · Not Started · Completed · Expired.',
      },
      {
        value: 'status',
        label: 'Status',
        description: 'In Progress · Expiring Soon · Not Started · Complete · Expired.',
      },
    ],
    page: 'learning-path',
  },
  {
    // Current Learning Path → Details sheet: how the compliance status renders
    // + where it sits. Variant-only (read variant + secondaryVariant; ignore
    // enabled). Defaults reproduce today's panel byte-for-byte (band, inside
    // the Progress tab). Style `callout` is the color-coded alert card (Figma
    // "2.0 — Learning Launcher" 3700:3756/3772/3787/3802) whose color follows
    // the status. Placement `above-tabs` lifts it under the title so it shows
    // on every tab.
    key: 'learning-path-status-display',
    group: 'Learning Path',
    label: 'Status Display',
    description:
      "In the Current Learning Path → Details sheet, how the compliance status renders and where it sits. Style: Status strip (default) is the status pill + message on a very light status-tinted strip (no \"Status\" title) — and for the urgent states (At Risk / Off Track / Expired) it also tints the Time Remaining stat tile in the status color to reinforce the countdown; Band is the older caption + tinted pill + message in a neutral bordered row; Callout is the color-coded alert card (colored left border + tinted fill + status icon + title + message). All three take their color from the status — green On Track / Completed, teal Not Started, amber At Risk, red Off Track / Expired. Placement: Above CTA (default) puts it directly under the path title, above the Go to Learning Path button + the tabs, so it stays visible on both Progress and Requirements; In Progress tab keeps it below the gauge + KPI row inside the Progress tab.",
    defaultEnabled: true,
    defaultVariant: 'strip',
    variants: [
      {
        value: 'strip',
        label: 'Status strip',
        description:
          'Status pill + message on a very light status-tinted strip (no "Status" title). For At Risk / Off Track / Expired it also tints the Time Remaining stat tile in the status color.',
      },
      {
        value: 'band',
        label: 'Band',
        description:
          'Older treatment — "Status" caption + tinted status pill + supporting message in a neutral bordered band.',
      },
      {
        value: 'callout',
        label: 'Callout',
        description:
          'Color-coded alert card — colored left border + tinted fill + status icon + title + message. The color follows the status (green / teal / amber / red).',
      },
    ],
    secondaryVariantLabel: 'Placement',
    defaultSecondaryVariant: 'above-tabs',
    secondaryVariants: [
      {
        value: 'above-tabs',
        label: 'Above CTA',
        description:
          'Directly under the path title, above the Go to Learning Path button + the tabs — visible on both Progress and Requirements.',
      },
      {
        value: 'in-progress',
        label: 'In Progress tab',
        description: 'Keep the status inside the Progress tab, below the gauge + KPI row.',
      },
    ],
    page: 'learning-path',
  },
  {
    key: 'state-count',
    group: 'Learning Path',
    label: 'States',
    description:
      "Whether the learner holds licenses in more than one state. Single keeps the Learning Paths landing with no State filter row. Multiple adds a single-select State filter row (pill style) at the top of the landing — one pill per state across the learner's learning paths, defaulting to All — and filters the paths to the selected state. The states are derived from the current learning-path set (so the Learning Paths Count flag drives how many appear); when there are more than six, the row collapses with a “Show all (N)” / “Show less” expander. Defaults to single; the multi-state experience rides along with the \"Multiple learning paths\" persona (#9).",
    defaultEnabled: true,
    defaultVariant: 'single',
    variants: [
      {
        value: 'single',
        label: 'Single state',
        description: 'One state — the Learning Paths landing shows no State filter row (current default).',
      },
      {
        value: 'multiple',
        label: 'Multiple states',
        description:
          'A single-select State filter row (pills) at the top of the Learning Paths landing, filtering the paths to the chosen state. States come from the learner’s paths; > 6 collapse behind a “Show all (N)” expander.',
      },
    ],
    // Page-specific: governs the Learning Paths landing State filter, so it lives
    // under the Learning Path page. Still in REBRAND_FLAGS so the rebrand-scoped
    // panel surfaces it; `extraPages` also lists it under the Recommended for You
    // page card (it drives that page's State filter too).
    page: 'learning-path',
    extraPages: ['recommended-for-you'],
  },
  {
    key: 'study-calendar-state',
    label: 'Study Plan State',
    description:
      "Switch the STC Series 79 Study Plan tab between demo states. Lets reviewers compare each treatment without juggling separate learning-path entries in the picker. Also deep-linkable via the `?calState=add|edit|locked` URL param (the prototype walkthrough uses this) — a param overrides this flag when present.",
    defaultEnabled: true,
    defaultVariant: 'edit',
    variants: [
      {
        value: 'add',
        label: 'Add Calendar',
        description:
          'Default view — no calendar yet. Two-column empty state with the "Create calendar" CTA + dimmed month preview + lock pill.',
      },
      {
        value: 'edit',
        label: 'Edit Calendar',
        description:
          'Calendar exists. Full Study Calendar grid + Edit Calendar slide-over with every pacing field editable.',
      },
      {
        value: 'locked',
        label: 'Locked Calendar',
        description:
          "Manager-locked. Edit panel renders the locked layout — Target Exam Date is the only editable field; everything else disables behind the lock pill.",
      },
    ],
    page: 'learning-path',
  },
  {
    key: 'learning-path-daily-tasks',
    label: 'Daily Tasks card',
    description:
      'Demo states for the STC "Daily Tasks" promo card (shown on the Edit Calendar variant) — toggle between a single task vs. multiple tasks and different completion levels to preview the tracker + "up next" treatment.',
    defaultEnabled: true,
    defaultVariant: 'today',
    variants: [
      {
        value: 'today',
        label: "From calendar (today)",
        description: "Derives from the study calendar's tasks due today — the realistic state.",
      },
      {
        value: 'single',
        label: 'Single task · 0 of 1',
        description: 'One task due, none completed yet.',
      },
      {
        value: 'multi-early',
        label: 'Multiple · 1 of 4',
        description: 'Several tasks due, just getting started.',
      },
      {
        value: 'multi-late',
        label: 'Multiple · 3 of 4 (self-marked PDF next)',
        description:
          'Several tasks due, almost done — next is a self-marked reading/PDF. "Start Task" opens the resource, then the CTA swaps to "Mark as complete".',
      },
      {
        value: 'custom-task',
        label: 'Multiple · custom task next',
        description:
          'Next task is a pure custom reminder/scheduled call — nothing to open, so the CTA is "Mark as complete" directly.',
      },
      {
        value: 'all-done',
        label: 'All complete',
        description: "Every task done — the card shows the caught-up state with no CTA.",
      },
    ],
    page: 'learning-path',
  },
  {
    key: 'study-calendar-status',
    label: 'Study Plan Status',
    description:
      "Forces every STC learning path's study plan into a specific pacing status (Not Started / On Track / Off Track) so reviewers can compare the stat-band pill + calendar fill against the same path without swapping fixtures. Default `Match path` lets each path's natural status flow through. Also deep-linkable via the `?calStatus=match|not-started|on-track|off-track` URL param (the prototype walkthrough uses this) — a param overrides this flag when present.",
    defaultEnabled: true,
    defaultVariant: 'match',
    variants: [
      {
        value: 'match',
        label: 'Match path',
        description:
          'Use the path’s natural status — Series 79 reads On Track, Series 7 reads Off Track, Series 63 reads Not Started.',
      },
      {
        value: 'not-started',
        label: 'Force Not Started',
        description:
          'Re-statuses every task to upcoming and shifts dates so day 1 lands on today. Stat band shows the Not Started pill.',
      },
      {
        value: 'on-track',
        label: 'Force On Track',
        description:
          'Marks every past-due task as completed. Pacing reads at or above the expected proportion for elapsed time.',
      },
      {
        value: 'off-track',
        label: 'Force Off Track',
        description:
          'Marks only ~12% of past tasks completed and the rest as overdue. Pacing reads behind the expected proportion.',
      },
    ],
    page: 'learning-path',
  },
  {
    key: 'dashboard-journey-style',
    group: 'Widgets',
    label: 'Study Journey — rail style',
    description:
      'How the Study Journey rail is drawn. Default is the compact rail: an uppercase eyebrow, a "0 / 4" count, dot nodes on a spine, and a meta line only on stops that are not blocked. "Syllabus" is a formal treatment — a bordered card, a serif heading under a "Syllabus sequence" eyebrow, NUMBERED nodes (01, 02 …), serif row titles, a percentage chip on the active stop, and a meta line on every row including the blocked ones. Same stops and same data in both: the variant does not split, merge or rename anything, and it invents no descriptive copy the fixtures cannot source.',
    defaultEnabled: true,
    /* `syllabus` IS THE DEFAULT as of 2026-09-17 (the direct ask). It is no
       longer a restyle of the compact rail so much as the treatment the version
       was built around — numbered nodes, "Complete Coursework", titles-only
       rows, and Get Licensed continuing the same 01-07 sequence. `default`
       stays in the picker as the comparison. */
    defaultVariant: 'syllabus',
    variants: [
      {
        value: 'default',
        label: 'Default — compact rail',
        description:
          'Dot nodes, an uppercase eyebrow with the stop count, and no meta line on blocked stops.',
      },
      {
        value: 'syllabus',
        label: 'Syllabus sequence',
        description:
          'A bordered card with a serif heading, numbered nodes, serif titles, a percentage chip on the active stop, and a meta line on every row.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'study-pace-widget',
    group: 'Widgets',
    label: 'Study Pace — live widget',
    description:
      'Replaces the lo-fi Study Pace placeholder with the real derived widget, in the "Testing 2" dashboard version only (QE Focused keeps its stub whatever this says). The tile itself carries NO controls — a pace, a timeline and two buttons — and Adjust opens a sheet holding the three finish dates (Relaxed / Recommended / Focused), days a week, an exam date, and building a study plan on the calendar. Every figure derives from the resume course\u2019s published credit hours and the two ceilings (course access expiry, and the exam date minus a review buffer); nothing is authored. Off ⇒ Testing 2 shows the same placeholder as QE Focused, which is what makes this switch worth having.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-course-header',
    group: 'Widgets',
    label: 'Course header band',
    description:
      'A full-width header above the whole QE Focused overview: the course meta on one line, the course name as a large heading, two actions on the right, and a rule under it. OFF by default — the course name is already the heading of the Current Progress block a few lines below, and this deliberately says it twice, larger, as a page title. Turn it on to see the page read as a course rather than as a dashboard. Its action opens the requirements sheet. The reference had a second button labelled Syllabus (PDF), and the PDF XCEL actually links is a 7-day study PLAN, so it is not offered here rather than mislabelled.',
    defaultEnabled: true,
    /*
     * `band` IS THE DEFAULT as of 2026-09-17 (the direct ask: "set this view as
     * the default").
     *
     * It shipped as `none`, and the stated reason was that the band says the
     * course name TWICE — once as the page title and again as the block's own
     * heading — which made it a question to look at rather than an answer to
     * ship. That reason is GONE: `hideHeader` now drops the block's entire
     * header cluster while the band is on, so the name, the meta and the
     * progress bar appear once each.
     *
     * The flip also settles a real gap. Target Date and Time Remaining left the
     * block with its KPI row, and the band's stat line is the only thing that
     * states them — so at `none` the page had no target date and no countdown
     * anywhere, which is what `the page states its countdown ONLY via the
     * header band` was pinning as a known consequence.
     */
    defaultVariant: 'band',
    variants: [
      {
        value: 'none',
        label: 'None — no page header',
        description: 'No change. The block\u2019s own title is the only course name on the page.',
      },
      {
        value: 'band',
        label: 'Header band',
        description:
          'Meta line, large course name, two right-aligned actions, and a rule under the lot — above everything else on the page.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    /*
     * COURSE LAUNCHER — which surface "Start course" / "Resume" opens into.
     *
     * The launcher has rendered a LO-FI PLACEHOLDER since 2026-09-17 (the
     * direct ask: "a large lo-fi square with simple message, this is where
     * Compass Course content will live"). `compass` is the built player from
     * Figma `Atlas-Compass-Global-Navigation` node 49:2903 — the contents
     * sidebar, the exam-date and section-progress bar, the reading column and
     * the Rubi aside.
     *
     * VARIANT-ONLY, like `dashboard-clp-style`: the enable toggle stays on so
     * the flag is live and the CHOICE is the variant. "Off" would have to mean
     * "lo-fi", which the variant already says.
     *
     * DEFAULT `compass` ON THIS BRANCH, which is the Contributing guide's rule
     * for a branch build — the branch deploy is the review link, so the work
     * has to be what it opens on. It is NOT yet a baseline decision: whether
     * this is what `?demo=1` renders on `main` is `/promote-to-prototype`'s
     * call, and `lo-fi` is one click away in this panel for the comparison.
     *
     * ⚠ THE TWO VARIANTS DIFFER IN SHELL, not just in the panel they draw.
     * `compass` is a FULL-WINDOW TAKEOVER: its own 260px contents sidebar sits
     * where the dashboard rail is, so `PlatformShell` drops the rail and the
     * content column for it and keeps only the global header. `lo-fi` stays
     * inside the content column with the rail beside it, as it always has.
     * A reviewer switching between them is switching layouts, not skins.
     */
    key: 'course-launcher-style',
    group: 'Widgets',
    label: 'Course launcher — what Start course opens',
    description:
      'Which surface the Jump Back In card opens when a learner starts or resumes a course. Lo-fi is the placeholder that has stood there since 2026-09-17 — a large grey square reading "Compass Course content will live here" — kept so the new player can be compared against what ships today. Compass is the built course player: a contents sidebar with the chapter tree and its done / now / up next states, a bar carrying the learner\u2019s own exam date and the section progress, the reading column with its Previous and Next controls, and the Rubi aside. Compass is a FULL-WINDOW takeover — its contents sidebar occupies the space the dashboard rail does, so switching variants switches layout rather than styling. Everything in it is static except Close; the centre is deliberately still a "Course Content" placeholder, which is what the Figma itself draws, because the courseware is Compass\u2019s and neither the design nor this repo has it.',
    defaultEnabled: true,
    defaultVariant: 'compass',
    variants: [
      {
        value: 'lo-fi',
        label: 'Lo-fi — the placeholder',
        description:
          'What ships today: a Back link and a large grey square saying Compass course content will live here. Kept for comparison, and still the honest state wherever the player is not the subject.',
      },
      {
        value: 'compass',
        label: 'Compass — the course player',
        description:
          'The built player from Figma node 49:2903. Takes the full window: contents sidebar, exam-date and progress bar, reading column, Rubi aside. Static except Close.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-clp-style',
    group: 'Widgets',
    label: 'Current Progress — block style',
    description:
      'How the Current Progress block on the QE Focused overview is treated. Default is the light block on the page grey — art left, title, meta, a progress bar under it, then the KPI cells and the status strip. "Big number" keeps that light ground and moves the percentage out to its own column on the right, with the bar and the lesson count under it. "Navy card" puts the same cluster on a dark card with light type, a green bar and a white Resume button. All three read the SAME data — this is a treatment, not a different set of facts, and no variant invents lesson-level content the storefront does not publish.',
    // Variant-only, like `dashboard-heading-font`: the enable toggle is on so
    // the flag is live and the CHOICE is the variant. "Off" would have to mean
    // "default", which the variant already says.
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: [
      {
        value: 'default',
        label: 'Default — light block',
        description:
          'No change. Art left, title and meta right, the progress bar under the meta with the percentage beside it.',
      },
      {
        value: 'big-number',
        label: 'Big number — light',
        description:
          'Same light ground, but the percentage becomes a large figure in its own right-hand column with the bar and "26 of 42 lessons complete" beneath it. The title and meta keep the left.',
      },
      {
        value: 'navy',
        label: 'Navy card',
        description:
          'The header cluster sits on a dark navy card: light type, a green progress bar, a large percentage on the right and a white Resume button. The KPI cells, status strip and View Requirements stay on the page grey below it.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-journey-complete',
    group: 'Widgets',
    label: 'Study Journey — when the coursework is done',
    description:
      'What the Study Journey column does once the course is 100% complete. Only has an effect at 100%; below it the two variants are identical. Full keeps all four coursework stops on screen, each reading Completed, with the licensing steps (Schedule State Exam · Pass State Exam · Get Licensed) below them — so the column shows what was finished and what is still ahead. Collapsed shrinks the finished coursework card to a single "Coursework complete" summary so the licensing steps LEAD the column, on the argument that at 100% the only things left to do are the licensing ones and a four-stop list of finished work is a receipt rather than a next action. Both are honest about the same state; they disagree about whether a learner at 100% is still reading their coursework or has moved past it.',
    defaultEnabled: true,
    // `full` — the state the ask described first, and the one that changes
    // least from what every other progress level shows. Collapsed is the
    // exploration, one click away.
    defaultVariant: 'full',
    variants: [
      {
        value: 'full',
        label: 'Full — every stop, all complete',
        description:
          'The coursework card keeps its four stops, each marked Completed, and the licensing steps follow. The column reads as a record of the whole journey with the remaining steps at the end.',
      },
      {
        value: 'collapsed',
        label: 'Collapsed — coursework as one line',
        description:
          'The four finished stops become a single "Coursework complete" line, so Schedule State Exam leads the column. Argues that finished work is a receipt and the licensing steps are the only actionable things left.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-navigation',
    group: 'Widgets',
    label: 'Navigation',
    description:
      'Which course page Resume opens. `option-1` is the Compass player as it stands — the 260px contents sidebar, the Home / Overview / Course breadcrumb, the toolbar and the reading column, under the app header. `option-2` is a FULL-SCREEN page with its own header (logo · Compass · course · section, plus the exam-date pill, + Demo, brightness and ✕) and a section progress track; it has no sidebar, no breadcrumb, and it suppresses the app header while open. ⚠ THE TWO SHARE NO CHROME — the navigation IS the variable. `CourseContentV2` is the file Option 2 owns.',
    // Variant-only, like `study-pace-chooser` below.
    defaultEnabled: true,
    /* ⚠ `option-1` ON THE BRANCH TOO, which breaks this repo's usual rule that
       a designer's branch defaults its own work ON. Option 2 is one half of an
       A/B a moderator assigns PER PARTICIPANT from the session link
       (`?ff=dashboard-navigation:option-2`), not a proposal replacing Option 1
       — so defaulting it on would silently make every other link, and every
       reviewer's sandbox, the variant. The control condition has to be the
       default or the comparison has no baseline. */
    defaultVariant: 'option-1',
    variants: [
      {
        value: 'option-1',
        label: 'Option 1 — the current course page',
        description:
          'Resume opens the Compass player unchanged: app header, contents sidebar, Home / Overview / Course breadcrumb, the reading column with Previous / Next, and the Rubi panel.',
      },
      {
        value: 'option-2',
        label: 'Option 2 — the alternate course page',
        description:
          'Resume opens `CourseContentV2` — a full-screen course page whose own header carries the course and section naming, so there is no app header, no contents sidebar and no breadcrumb. Wired: ✕. Lo-fi for now: the exam-date pill (real date when one is booked), + Demo, brightness, Notes and Rubi.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'study-pace-chooser',
    group: 'Widgets',
    label: 'Study Pace chooser',
    description:
      'How the Study Pace card lets a learner pick a plan. `strip` is the card as it stands — the heading names the current plan ("Steady & Relaxed Study Pace") and the week strip is clickable at 0% to set the nights. `options` is the newer direction: the heading is a plain "Study Pace" and three named plans sit under it — Steady & Relaxed (the fewest evenings that still finish in time), Recommended (the model’s own suggestion, which lands between the other two), and Focused & Quick (all seven evenings). ⚠ THE THREE ARE NOT NEW PLANS: they are `studyPace`’s existing relaxed / recommended / focused presets with a nights count each, so the model still decides how long every plan takes — see `paceOptionsFor`.',
    // Variant-only, like `dashboard-heading-font`.
    defaultEnabled: true,
    /* `options` ON THE BRANCH, per the Contributing guide's rule. `strip` is
       kept rather than replaced because the ask was explicit — "don't lose
       current logic, make it a flagged variant" — and because the two answer
       different questions: the strip asks which evenings, the options ask which
       plan. */
    defaultVariant: 'options',
    variants: [
      {
        value: 'strip',
        label: 'Strip — the heading names the plan',
        description:
          'The clickable week strip at 0%, with the heading derived from the review gap (>15 days Focused & Quick, ≥7 Recommended, else Steady & Relaxed). Picking a night count writes a week and the card re-prices live.',
      },
      {
        value: 'options',
        label: 'Options — three named plans',
        description:
          'A plain "Study Pace" heading with three selectable plans under it, each showing the evening it asks for and the date it lands on. The week strip stays below as a readout of the chosen plan rather than a control.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'study-pace-preset',
    group: 'Widgets',
    label: 'Study pace preset',
    description:
      'Which of the model’s presets the Study Pace card opens on, so the three plans can be compared without going through the Adjust sheet — 2026-09-23, the direct ask for a Pacing demo control. `recommended` (default) is the card as a learner finds it. `focused` is the fastest plan the model will build and `relaxed` spends the whole window; the card names them "Focused & Quick Study Pace" and "Steady & Relaxed Study Pace" in its own heading. ⚠ IT SEEDS `choices.presetId`, the same field the sheet writes, so the card treats it as an ADJUSTMENT: picking anything but Recommended is indistinguishable from the learner having chosen it, which is what makes the comparison honest rather than a fourth rendering. A preset the model drops (Focused disappears once it is no longer faster than Recommended — see `studyPace`) falls back to the default, so the control cannot show a plan that does not exist.',
    defaultEnabled: true,
    defaultVariant: 'recommended',
    variants: [
      {
        value: 'recommended',
        label: 'Recommended',
        description:
          'No seed. The model’s own suggestion, finishing `RECOMMENDED_BUFFER_DAYS` short of the ceiling so there is review time at the end.',
      },
      {
        value: 'focused',
        label: 'Focused & Quick',
        description:
          'The fastest plan offered — up to a fortnight, or the ceiling if that is sooner. Heavier evenings, and the most days to review at the end.',
      },
      {
        value: 'relaxed',
        label: 'Steady & Relaxed',
        description:
          'The whole window spent. The lightest evenings the course allows, and one day to review.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'study-pace-readout',
    group: 'Widgets',
    label: 'Study Pace readout',
    description:
      'What the Study Pace card shows UNDER the pace sentence and the week strip. `prose` (default) is the card as it stands — three sentences: the window and its end date, the finish date, and the note that the estimate moves. `stats` replaces the first two with a three-cell readout divided by hairlines — Course Access (the countdown, with the access end date beneath it), Estimated Completion Date, and Status (the PACE status: Relaxed / Recommended / Focused, plus heavy). The third sentence and Customize Study Plan survive in both. NOTE the Status cell carries the PACE axis rather than the compliance one: "At Risk" is a verdict about the learner and this card only speaks about the plan — see `PaceChip`’s own note on why the two must not share a badge.',
    // Variant-only, like `dashboard-heading-font`: the enable toggle is on so
    // the flag is live and the CHOICE is the variant.
    defaultEnabled: true,
    /* `stats` ON THE BRANCH, per the Contributing guide's rule — the branch
       deploy is the review link, so it has to show the work. Whether it becomes
       the `?demo=1` baseline is `/promote-to-prototype`'s call. */
    defaultVariant: 'stats',
    variants: [
      {
        value: 'prose',
        label: 'Prose — three sentences',
        description:
          'No change. "You have 29 days left to finish the course material. (Access ends on Jun 10.)" / "At this pace, you will finish around Jun 5." / the estimate-moves note.',
      },
      {
        value: 'stats',
        label: 'Stats — three divided cells',
        description:
          'Course Access · Estimated Completion Date · Status, divided by hairlines, with the access end date as a second line under the countdown so nothing the prose said is lost. At the unreachable pace (At Risk, 3 days) the cells stay and the completion cell reads "Not achievable", with the won’t-fit sentence taking the estimate-moves line’s place — a readout that changes shape per state would be two cards behind one flag.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-text-tiers',
    group: 'Widgets',
    label: 'Text tiers',
    description:
      'The THREE-TIER text ramp from the sign-in prototype (`public/prototypes/xcel-signin.html`), applied to the whole Dashboard Rebrand app — ink #1f1d18 for headings and body, muted #5b5560 for secondary text, captions and eyebrows, faint #706b63 for third-tier meta (weights, timings, sub-labels). Measured on OUR two fills rather than the prototype’s: 16.84 / 7.21 / 5.29 on white, 15.44 / 6.61 / 4.85 on the page ground — AAA, AA, AA, and a correctly descending ladder. The `neutral` variant is the ramp as it stands (#3a3a3a / #666666 / #737373, the XCEL guide’s Charcoal and Gray plus a neutral third stop) and is kept for comparison. NOTE the two ramps differ in HUE as well as value: the tiers are warm — brown- and violet-tinted greys off an off-white surface — where the guide’s are true neutrals on white. That is the thing to look at, not the contrast; both ramps pass.',
    // Variant-only, like `dashboard-heading-font`: the enable toggle is on so
    // the flag is live and the CHOICE is the variant. "Off" would have to mean
    // "neutral", which the variant already says.
    defaultEnabled: true,
    /*
     * ⚠ `neutral`, AND THE FLIP IS THE FINDING — 2026-09-23, after the
     * side-by-side. The branch shipped `tiers` for an hour under the
     * Contributing guide's rule (the branch deploy is the review link, so it
     * should show the work). The review answered the question: "they look
     * basically the same."
     *
     * THEY DO, AND THE MEASUREMENTS SAY WHY. Stop for stop the two ramps
     * differ by dE 14.1 / 9.5 / 6.0, almost all of it LIGHTNESS on the top
     * tier. The warm tint carries a chroma of only 3.8 / 7.3 / 5.2 — and it
     * sits on a ground of chroma 0.0. Warmth is relational: the prototype
     * pairs this ink with `--paper: #faf0e8` and `--line: #e0dbcd`, so the
     * whole field is warm and the ink belongs to it. Dropped onto our neutral
     * `#f5f5f5`, warm ink at chroma 5 is a grey with nothing to be warm
     * against.
     *
     * So the variant as built asks for a hue the XCEL guide does not publish,
     * in exchange for a contrast gain invisible at 12px. Leaving it on would
     * have moved the committed baseline in a way no reviewer could perceive —
     * the risk of a palette change with none of the benefit.
     *
     * THE FLAG STAYS for now, off by default, so the comparison is one URL
     * away (`?ff=dashboard-text-tiers:tiers`). What is worth testing next is
     * the SURFACES rather than the ink — see the variant description.
     *
     * NOTE the real defect this exploration surfaced was fixed independently
     * and is not in this flag: `--color-text-tertiary` was DARKER than the
     * body ink on the XCEL brand, running the ladder backwards. See the
     * tertiary note in `tokens.css`.
     */
    defaultVariant: 'neutral',
    variants: [
      {
        value: 'neutral',
        label: 'Neutral — the ramp as it stands',
        description:
          'No change. `--color-text-primary` / `-secondary` / `-tertiary` as the XCEL brand block sets them: Charcoal #3a3a3a and Gray #666666 from the brand guide, plus #737373 for the third tier (11.37 / 5.74 / 4.74 on white).',
      },
      {
        value: 'tiers',
        label: 'Tiers — ink / muted / faint (reviewed, not adopted)',
        description:
          'Re-points the three text tokens to the prototype’s warm ramp for the Dashboard Rebrand routes only, so the gateway and the standalone prototypes are untouched. LIGHT THEME ONLY: dark mode re-pins these tokens to a blue-tinted set of its own. ⚠ REVIEWED 2026-09-23 AND NOT ADOPTED — side by side the two ramps are hard to tell apart, because this is a THIRD of the prototype’s system. There the ink is paired with `--paper: #faf0e8` and `--line: #e0dbcd`; here it lands on a neutral `#f5f5f5` ground, and warm ink at a chroma of 5 has nothing to be warm against. The thing worth testing next is the SURFACES with the ink, not the ink alone — and that one collides with the navy CTA, the dark rail and the whole `[data-theme=\'dark\']` block, so it is a piece of work rather than a token swap.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-heading-font',
    group: 'Widgets',
    label: 'Heading font',
    description:
      'Typeface for the HEADINGS on the Dashboard Rebrand overview — the Current Learning Progress title, the section leads, the widget and card titles. Sans (default) is the brand face. Serif re-points `--font-heading` for the page only, so the left rail, the header and the shell’s own page title stay on the brand face and the two sit side by side for comparison. NOTE the serif is a SYSTEM stack standing in for the style, not the face on xcelsolutions.com: that one is Amasis MT, which is unlicensed to us, absent from Google Fonts, and recorded in tokens.css as off-brand for XCEL ("Amasis appears nowhere in the guide"). This variant is for looking at the idea, not for shipping that face.',
    // Variant-only, like `learning-path-status-display`: the enable toggle is
    // on so the flag is live, and the CHOICE is the variant. A separate on/off
    // for a font would be two controls for one decision, and "off" would have
    // to mean "sans", which the variant already says.
    defaultEnabled: true,
    /*
     * `serif` IS THE DEFAULT as of 2026-09-17 (the direct ask).
     *
     * THE CAVEAT BELOW STILL STANDS AND NOW MATTERS MORE: the face is a SYSTEM
     * STACK (Georgia and its cousins) standing in for the style, not the Amasis
     * MT on xcelsolutions.com — that one is unlicensed to us, absent from
     * Google Fonts, and recorded in tokens.css as off-brand for XCEL. Making
     * this the default means the committed demo now ships a stand-in as its
     * headline typeface, which is fine for an exploration and would not be fine
     * for production. Repointing `--font-heading-serif` at a licensed face is
     * one declaration.
     */
    defaultVariant: 'serif',
    variants: [
      {
        value: 'sans',
        label: 'Sans — the brand face',
        description:
          'No change. `--font-heading` as the brand block sets it (Lato on XCEL, itself a documented placeholder for Avenir).',
      },
      {
        value: 'serif',
        label: 'Serif',
        description:
          'Headings on the overview render in a serif (a system stack — Georgia and its cousins). The page only: the rail, the header and the section title stay on the brand face.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    // Show/hide the whole band. Sits ABOVE the three flags that tune it
    // (`-blurb`, `-carousel`, `home-recommended-card-ab`) because it gates
    // them: with the section off, those three control nothing, and a reviewer
    // flipping them with no visible effect is the confusion this ordering
    // avoids. Same shape as `dashboard-whats-new-layout` does for What's
    // Trending.
    key: 'dashboard-recommended',
    group: 'Widgets',
    label: 'Recommended for You section',
    description:
      'Show the "Recommended for You" band on the Dashboard Rebrand overview — the personalized product carousel below the week summary. Off removes the section entirely, which also makes the three flags that tune it (blurb, carousel, card A/B) inert. Does not affect the Recommended for You PAGE in the left nav, which is `nav-show-recommended`.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-recommended-blurb',
    group: 'Recommended For You',
    label: 'Recommended card blurb',
    description:
      'The short "what this is" blurb under the title on the Dashboard Rebrand "Recommended for you" cards (the What’s Trending image cards). ON (default) shows the blurb; OFF hides it, leaving just the title + meta row.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-recommended-carousel',
    group: 'Recommended For You',
    label: 'Recommended layout (carousel)',
    description:
      'How the Dashboard Rebrand "Recommended for you" band lays out its cards. ON = the horizontal carousel (the ShelfScroller) — a scrolling track with a peek + arrows. OFF (default) = a fit-to-screen grid that shows only as many WHOLE cards as fit the row width (no carousel) and re-packs as the window resizes; it falls back to a swipe row only when the viewport is too narrow to show two cards. Works with every Card style (Shelf / Large / What\u2019s Trending).',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'home-recommended-card-ab',
    group: 'Recommended For You',
    label: 'Recommended card A/B',
    description:
      'A/B test for the Dashboard Rebrand Home "Recommended for you" band card style. OFF (default) leaves the band on its normal card style (whatever the Recommended band flag’s Card style axis is set to). ON overrides that with the A/B contender: A · Compact square (the compact square cover cards — small footprint, more per row) or B · What’s Trending (large image-forward cards — full-bleed cover photo, title/meta over a scrim, play affordance on audio/video). Compare both side-by-side from the "Recommended Card A/B" feature tile.',
    defaultEnabled: false,
    defaultVariant: 'compact',
    variants: [
      {
        value: 'compact',
        label: 'A · Compact square',
        description:
          'The compact square cover cards (SimpleCard) — small footprint, fits more per row.',
      },
      {
        value: 'trending',
        label: 'B · What’s Trending',
        description:
          'Large image-forward cards (VibrantCard) — full-bleed cover photo, title + meta over a dark scrim, and a play affordance on audio/video.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'profession-count',
    group: 'Widgets',
    label: 'Professions',
    description:
      "Whether the learner has more than one profession. Single keeps the Resource Library scoped to the one profession (no Profession filter row). Multiple adds a single-select Profession filter row above Category in the Resource Library — one chip per profession across the learner's memberships, defaulting to the first membership's profession — and filters the results to the selected profession. Demo-only; the professions come from the Elite fixture (Nursing / Occupational Therapy / Physical Therapy). Defaults to single; the multi-profession experience rides along with the \"Multiple learning paths\" persona (#9).",
    defaultEnabled: true,
    defaultVariant: 'single',
    variants: [
      {
        value: 'single',
        label: 'Single profession',
        description: 'One profession — the Resource Library shows no Profession filter row (current default).',
      },
      {
        value: 'multiple',
        label: 'Multiple professions',
        description:
          "A single-select Profession filter row in the Resource Library (one chip per membership profession, default = the first), filtering results to the chosen profession.",
      },
    ],
    // Page-specific: governs the Resource Library (+ Learning Paths + Recommended
    // for You) Profession filter, so it lives under the Resource Library page.
    // Still in REBRAND_FLAGS so the rebrand-scoped panel surfaces it; `extraPages`
    // also lists it under the Recommended for You page card (it drives that
    // page's Profession filter too).
    page: 'learning-library',
    extraPages: ['recommended-for-you'],
  },
  {
    key: 'learning-library-hero',
    group: 'Resource Library',
    label: 'Library Hero',
    description:
      "The Resource Library header treatment. Full (default) is the tall custom hero — the membership eyebrow + Passport tier pill + the three benefit tiles (Courses & CE / Video Skills / CE Podcasts) + a large search. Compact swaps it for the standard section hero used by Course Catalog and the other Explore sections — the smaller brand-gradient band with title + description + inline search.",
    defaultEnabled: true,
    defaultVariant: 'full',
    variants: [
      {
        value: 'full',
        label: 'Full',
        description: 'The tall custom hero with benefit tiles + large search (current default).',
      },
      {
        value: 'compact',
        label: 'Compact',
        description: 'The standard smaller gradient section hero, matching Course Catalog.',
      },
    ],
    page: 'learning-library',
  },
  {
    key: 'learning-library-card-style',
    group: 'Resource Library',
    label: 'Card Style',
    description:
      "The Resource Library results card treatment. Shelf (default) is the compact square cover card with a colored footer band + the title over it. Image shelf is the same compact square card, but the title + format · rating float over the cover image behind a dark gradient (no footer band) — matching the Home \"Recommended for you\" image tiles. Classic is the older-style card — a white card with the cover image on top, an outlined format chip, title, a short description, a divider, and a star rating + optional tag along the bottom.",
    defaultEnabled: true,
    // Default to the image-tile treatment (bannerless cover image + gradient +
    // overlaid title/meta) — matches the Home "Recommended for you" tiles.
    defaultVariant: 'image-shelf',
    variants: [
      {
        value: 'shelf',
        label: 'Shelf',
        description: 'Compact square cover cards with a colored footer band.',
      },
      {
        value: 'image-shelf',
        label: 'Image shelf',
        description:
          'Compact square cards with the title + format · rating floated over the cover image behind a gradient (no footer band) — the Home "Recommended for you" tile style.',
      },
      {
        value: 'classic',
        label: 'Classic',
        description: 'White cards — image header + format chip + title + description + rating/tag.',
      },
    ],
    page: 'learning-library',
  },
  {
    // Merged 2026-08-17: the old `platform-nav-color` (6 shipped rails) flag was
    // folded into this one — its six options now live at the TOP of this
    // dropdown, above the Nectar gray steps. One flag drives every rail color.
    key: 'nav-gray-scale',
    group: 'Navigation',
    label: 'Left Nav Color Options',
    description:
      "Force the left-nav rail to a specific color, overriding the user's Appearance preference. OFF by default (the rail follows Appearance — Account menu → Preferences). Turn ON and pick from the dropdown: the six shipped rails — three DARK (Navy #17233F, Graphite #2B2D31, Brand 800 per-brand) + three LIGHT (Light 1 #E3E6EB, Light 2 #E7EAEF, Light 3 a per-brand Brand-100 wash) — OR any Nectar 2.0 Neutral step (050 #FFFFFF → 950 #000000). Light rails + light gray steps carry dark text + the accessible selected bar; dark rails + dark steps carry white text. Light treatments invert to graphite in dark mode so they don't glare.",
    defaultEnabled: false,
    defaultVariant: 'navy',
    variants: [
      { value: 'navy', label: 'Navy · #17233F', description: 'A shared slate-navy dark rail (white text). A faint blue identity that pairs well with the blue-primary brands.' },
      { value: 'graphite', label: 'Graphite · #2B2D31', description: 'A shared true-neutral graphite dark rail (white text) — zero hue, so it sits equally beside teal, olive, and blue.' },
      { value: 'brand-800', label: 'Brand 800 · (per brand)', description: "The brand's own Primary 800 — its deepest navy/olive. Fully on-brand and identical to the dark-mode card surface, so rail + cards read as one family." },
      { value: 'light', label: 'Light 1 · #E3E6EB', description: 'A neutral light-gray rail with dark text + a hairline right border — open, content-first. Inverts to graphite in dark mode.' },
      { value: 'light-2', label: 'Light 2 · #E7EAEF', description: 'The same light-rail treatment as Light 1, one step lighter/airier. Inverts to graphite in dark mode.' },
      { value: 'light-3', label: 'Light 3 · Brand 100 wash (per brand)', description: "A very light brand tint (the brand's Primary 100 mixed 25% with white). Inverts to graphite in dark mode." },
      { value: '050', label: 'Neutral 050 · #FFFFFF', description: 'White (255/255/255). Dark text.' },
      { value: '075', label: 'Neutral 075 · #F5F5F5', description: 'Near-white (245). Dark text.' },
      { value: '100', label: 'Neutral 100 · #ECECEC', description: 'Light gray (236). Dark text.' },
      { value: '200', label: 'Neutral 200 · #D9D9D9', description: 'Light gray (217). Dark text.' },
      { value: '300', label: 'Neutral 300 · #C7C7C7', description: 'Light-mid gray (199). Dark text.' },
      { value: '400', label: 'Neutral 400 · #848484', description: 'Mid gray (132). Dark text.' },
      { value: '500', label: 'Neutral 500 · #A2A2A2', description: 'Mid gray (162). Dark text.' },
      { value: '600', label: 'Neutral 600 · #818181', description: 'Mid gray (129). Dark text.' },
      { value: '700', label: 'Neutral 700 · #616161', description: 'Dark-mid gray (97). White text.' },
      { value: '800', label: 'Neutral 800 · #404040', description: 'Dark gray (64). White text.' },
      { value: '900', label: 'Neutral 900 · #202020', description: 'Near-black (32). White text.' },
      { value: '950', label: 'Neutral 950 · #000000', description: 'Black (0). White text.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'ce-study-plan',
    group: 'Widgets',
    label: 'Study plan for Continuing Ed',
    description:
      "Give the Continuing Ed path a study plan, so its Today's Tasks and its Study Plan page have content. ON by default. Off restores the prior behaviour, where only the two PRE-LICENSING paths had a plan and CE fell to the empty branch — the reasoning being that a renewal cycle with a variable deadline is not a countdown to a booked exam. That still holds for the DEADLINE, which is why the CE plan paces hours and claims no exam date of its own; it did not hold for the workload, which is 24 required hours either way.",
    // Default ON: a CE learner with 24 hours to place before a renewal date has
    // the same pacing problem a pre-licensing learner does, and the card and
    // the Study Plan page both read empty without it.
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'clp-jump-back-in',
    group: 'Widgets',
    label: 'Jump Back In — card layout',
    description:
      "The white Jump Back In card inside the full-width Current Learning Path band. \"Up Next\" is the shipped layout — a full-width course cover, then title / meta / progress, the Resume CTA, and two not-started courses below. \"Today's Tasks\" compresses the resume block to roughly a quarter of the card (small cover LEFT, title and meta RIGHT of it, progress and CTA below) and gives the space back to today's tasks from the learner's STUDY PLAN, with a View all link into the Study Plan page when the day has more than fit.",
    defaultEnabled: true,
    // Default flipped to `todays-tasks` 2026-09-09 — the tasks layout is the
    // one this demo is about, and the shipped Up Next card is the comparison.
    // It sat on `up-next` for a day, which meant clearing local flag state
    // silently reverted the card a reviewer thought was the current design.
    defaultVariant: 'todays-tasks',
    variants: [
      {
        value: 'up-next',
        label: 'Up Next — courses',
        description:
          'The shipped card: large cover, then the next two not-started COURSES. Knows nothing about the study plan, so it reads the same for a learner with a plan and one without.',
      },
      {
        value: 'todays-tasks',
        label: "Today's Tasks — study plan",
        description:
          "Compact resume block over today's tasks from the study plan. Needs the CURRENT PATH to have a plan, not just the brand — XCEL's Continuing Ed path deliberately has none, so on the default view this falls back to Up Next. Switch Education to Pre-Licensing to see it.",
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-clp-fullwidth',
    group: 'Widgets',
    label: 'Current Learning Path — full width',
    description:
      "Show the full-width Current Learning Path band on the Dashboard Rebrand overview — a navy Current Learning Path (progress + Mandatory/Elective breakdown + license stats) joined to a white Jump Back In. Replaces the top band. Variant picks the treatment: Variant D/E vary the stat-tile style, or \"Jump Back In only\" drops the Current Learning Path entirely and shows just a full-width Jump Back In (cover left, content right). \"When to show\" decides whether it's always on, or only when What's New is turned off (the band expands to fill the space the carousel left). Off by default — when off, the Marketing Focused band is the default top band.",
    // Committed demo default: ON + the combined variant-d band (the "What's New
    // off" persona is the default view coming in).
    defaultEnabled: true,
    defaultVariant: 'variant-d',
    variants: [
      {
        value: 'variant-d',
        label: 'Variant D — White stat cards',
        description: 'License Expires / Time Remaining render as solid white cards on the navy.',
      },
      {
        value: 'variant-e',
        label: 'Variant E — Glass tiles',
        description: 'License Expires / Time Remaining render as translucent glass tiles on the navy (icon + white text).',
      },
      {
        value: 'jump-back-in',
        label: 'Jump Back In only',
        description:
          'Drops the Current Learning Path side entirely — a single full-width Jump Back In band (course cover on the left, title / meta / progress and the Resume CTA on the right).',
      },
    ],
    // The "When to show" secondary axis went with `dashboard-whats-new-layout`
    // on 2026-09-16. Its two options were `always` (the default) and
    // `when-whats-new-off`; the "What's Trending" section the latter waited on
    // was archived 2026-08-05, so with that flag gone the condition is
    // permanently true and the two options render identically. Restoring it
    // means restoring the section, the flag, and the `whatsNewOn` read pinned
    // false in `MembershipOverview`.
    page: 'dashboard-rebrand',
  },
  {
    // Drives the whole Dashboard Rebrand overview by the member's learning
    // progress. Variant-only (read `variant`, ignore `enabled`). Elite-only —
    // other brands have no progress persona and fall back to today's behavior.
    // Ungrouped so it reads directly under the "Dashboard Rebrand" page card.
    key: 'dashboard-progress-state',
    label: 'Progress state',
    description:
      "Which learning-progress + compliance state the member's Dashboard Rebrand renders — a populated Current Learning Path (gauge %, status band, deadline). Compliance status follows progress + time-to-deadline: Not Started (0%), On Track (progress + time remaining), At Risk (<30 days left & requirement <25% done), Expired (deadline passed, unmet), Completed (100% in time). Variant-only. Applies to every brand's Current Learning Path (each has its own renewal-cycle persona).",
    defaultEnabled: true,
    // Project default: On Track (populated dashboard) — per demo baseline.
    defaultVariant: 'progress-on-track',
    variants: [
      {
        value: 'not-started',
        label: 'Not Started · 0%',
        description: 'Plan created, no progress yet — 0% gauge, the Not Started status band, deadline far out.',
      },
      {
        value: 'progress-on-track',
        label: 'On Track · ~63%',
        description: '~63% complete, comfortably ahead of the deadline — the positive On Track treatment.',
      },
      {
        value: 'progress-at-risk',
        label: 'At Risk · ~15%',
        description: '~15% complete with under 30 days left (requirement <25% done) — the At Risk warning treatment.',
      },
      /* `progress-off-track` ARCHIVED 2026-09-23 — see `ARCHIVED_ITEMS`. Its
         whole job was reaching the pace model's `state: 'no'`, which At Risk
         now does at 3 days. ⚠ RE-DECLARING IT HERE IS HALF THE RESTORE: the
         variant was once absent from this list while every fixture behind it
         existed, so the seed was silently ignored and the branch was
         unreachable dead copy that still type-checked and still passed. That is
         why this is a comment rather than a quiet deletion. */
      {
        value: 'progress-expired',
        label: 'Expired',
        description: 'Deadline already passed with the requirement unmet — the Expired treatment (partial progress, no more time).',
      },
      {
        value: 'complete-100',
        label: 'Completed · 100%',
        description: 'Requirements met in time — the renewal-ready treatment (positive pill + certificate CTA).',
      },
      {
        value: 'completed-empty',
        label: 'Completed · nothing queued',
        description:
          'Finished everything with nothing left to launch — the Jump Back In slot shows the "You\'re all caught up" discovery empty state with a Browse Catalog CTA. Set by the "Completed · empty queue" persona.',
      },
      {
        value: 'new-empty',
        label: 'New · nothing queued',
        description:
          'Brand-new learner with nothing started or queued — the Jump Back In slot shows the "Find your next course" discovery empty state with a Browse Catalog CTA. Set by the "New · empty queue" persona.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    // QE (Qualifying / exam-prep / pre-licensing) vs CE (renewal / continuing
    // education) for the Dashboard Rebrand's Current Learning Path. Distinct
    // from the onboarding-scoped `onboarding-education-type` — this drives which
    // renewal/coursework persona the *dashboard* shows. Variant-only.
    //
    // Which brands SEE this control is `dashboardEducationSupported(brand)`,
    // which as of 2026-09-04 means "offers more than one education type" (it
    // used to mean "has a QE profile" — the same question only while there were
    // exactly two). A brand that lists a type with no persona of its own falls
    // back down the chain in `profileFor`.
    key: 'dashboard-education-type',
    label: 'Education type',
    description:
      "Which journey the Dashboard Rebrand's Current Learning Path shows: Continuing Education (renewal), Qualifying Education (get licensed), or Exam Prep. Brand-true labels — Real Estate \"Pre-Licensing\", Appraisal \"Qualifying Ed\", Securities and Insurance \"Exam Prep\". Only XCEL sells all three; the other brands bundle exam prep into their qualifying education, and a brand with no persona for the selected type falls back to the nearest one it has. Variant-only.",
    defaultEnabled: true,
    defaultVariant: 'ce',
    variants: [
      { value: 'ce', label: 'Continuing Education', description: 'The renewal / stay-current journey (CE hours, license renewal deadline).' },
      { value: 'qe', label: 'Qualifying Education', description: 'The pre-licensing / get-licensed journey (required coursework toward a first licence).' },
      { value: 'exam-prep', label: 'Exam Prep', description: "Exam preparation as a journey of its own — XCEL's Prep Review Course + Exam Simulators, counted down to the exam date. Other brands fall back to their Qualifying Education persona." },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-week-summary',
    group: 'Widgets',
    label: 'Week summary band',
    description:
      'The "Your study weeks" band on the Dashboard Rebrand overview, directly above Recommended for You — the current week of the learner\'s study plan plus the next three, each with its subject, a pip per task, a status chip and a done count. Summary only: every row opens the Study Plan rather than acting in place. Hidden for a brand or path with no plan.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    // The header bell. An ENABLE flag, not a variant one — the question a
    // reviewer asks first is "what does the shell look like without it", and
    // the header is the one surface where an extra icon changes the whole
    // top-right cluster's balance.
    key: 'header-notifications',
    group: 'Navigation',
    label: 'Notification bell',
    description:
      'Show the notification bell in the header, between Cart and the account menu. Off removes the bell and its unread badge entirely; the Notifications ACCOUNT section (preferences) is unaffected — that one is reached from the account dropdown and is a different thing (settings, not a feed).',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    // The bell's demo axis. Variant-only, and about the UNREAD COUNT rather
    // than about content: the badge is the whole visual argument, so four
    // authored lists would demonstrate one control four times.
    key: 'notification-state',
    group: 'Widgets',
    label: 'Notification state',
    description:
      'What the notification bell holds. Unread is the default view — three unread items over five read ones, so the badge, the unread rail and the read/unread type weights are all visible at once. All caught up keeps the same eight items with the badge cleared. Nothing yet is the new-learner empty state, which is the half of a notification centre that otherwise never gets designed. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'unread',
    variants: [
      { value: 'unread', label: 'Unread · 3', description: 'Three unread over five read. The default view.' },
      { value: 'all-read', label: 'All caught up', description: 'Same eight items, badge cleared.' },
      { value: 'empty', label: 'Nothing yet', description: 'No notifications at all — the new-learner empty state.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    // The Readiness section's demo axis. Variant-only, like
    // `dashboard-progress-state` — the Demo Controls bar exposes it as a
    // Readiness dropdown, so it is deliberately NOT in the flag panel's
    // rebrand scope (a redundant, worse copy of a control in the bar).
    key: 'readiness-state',
    group: 'Widgets',
    label: 'Readiness state',
    description:
      "Which readiness state the Exam Readiness section shows. Not Started is genuinely different from a low score — the learner has answered nothing, so the gauge shows no score and no status chip, the Chapter & Topic breakdown is empty, and there are no exam attempts. Off Track / At Risk / On Track vary the score, the course-progress figures, the number of simulator attempts, and shift the chapter and topic percentages together (relative strengths stay put; the level moves). Variant-only.",
    defaultEnabled: true,
    defaultVariant: 'on-track',
    variants: [
      { value: 'not-started', label: 'Not Started', description: 'No score yet — nothing answered, no attempts, empty breakdown.' },
      { value: 'off-track', label: 'Off Track', description: 'Score 38, below the at-risk window. Part-way through the course.' },
      { value: 'at-risk', label: 'At Risk', description: 'Score 62 — inside the window below the 70 pass mark.' },
      { value: 'on-track', label: 'On Track', description: 'Score 84, clear of the pass mark. The default view.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    // Variants of the new-user learning-setup wizard (Onboarding Flow).
    // Variant-only.
    key: 'dashboard-setup-variant',
    label: 'Setup wizard variant',
    description:
      "Which variant of the new-user learning-setup wizard runs on the Onboarding Flow. Default: Goal → License → About you → Interests (course tiles) → How you learn. Interest pills: the Interests step becomes a pill multi-select (\"What are your interests?\") with a \"more\" link. Skip goal: the platform already knows the goal, so the Goal step is skipped and Interests use pills. Variant-only. All four brands.",
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: [
      { value: 'default', label: 'Ask goal · course tiles', description: 'Goal step + the Courses-of-interest tile step (the original flow).' },
      { value: 'interest-pills', label: 'Ask goal · interest pills', description: 'Goal step + the Interests step as a pill multi-select with a "more" link.' },
      { value: 'renew-known', label: 'Skip goal · pills', description: 'Skips the Goal step (goal already known) and uses the interest pills.' },
    ],
    page: 'onboarding-flow',
  },
  {
    // Goal-step tile presentation — two independent axes (like
    // `dashboard-learning-path-width`): an ICON TREATMENT (primary) and an
    // OPTION COUNT (secondary), giving all 9 combos from the goal-tile
    // exploration. Variant-only (read variant + secondaryVariant; ignore
    // enabled). All four brands — goals are data-driven per brand + education
    // type, so the count axis just slices however many that brand presents.
    key: 'setup-goal-layout',
    group: 'Goal step layout',
    label: 'Goal tile style',
    description:
      "How the Goal-step tiles look. Icon treatment: Size + position (the plate scales with the room; stacked tiles gain an oversized watermark glyph — the current look), Icon as accent (a colored left rail + a small inline glyph, no plate), or Icon-forward (a big expressive icon in a soft disc). Option count (secondary): Auto follows the brand's real goals; Four keeps the compact 2×2 grid (bigger title); Three and Two stack vertically. Variant-only. All four brands.",
    defaultEnabled: true,
    defaultVariant: 'size',
    variants: [
      { value: 'size', label: 'Size + position', description: 'Plate scales with the available room; stacked tiles add an oversized watermark glyph. Closest to today.' },
      { value: 'accent', label: 'Icon as accent', description: 'No plate — a colored left rail plus a small inline glyph beside the title. Quietest; leans on text + selection.' },
      { value: 'forward', label: 'Icon-forward', description: 'A big expressive icon in a soft disc anchors each tile (centered at 4-up, big-icon-left when stacked).' },
    ],
    secondaryVariants: [
      { value: 'auto', label: 'Auto', description: "Follows the brand's real goal count (respects the four Goal-tile toggles)." },
      { value: 'four', label: 'Four (2×2)', description: 'Force four goals in the compact 2×2 grid with the larger title.' },
      { value: 'three', label: 'Three (stacked)', description: 'Force three goals stacked vertically.' },
      { value: 'two', label: 'Two (stacked)', description: 'Force two goals stacked vertically — the most breathing room.' },
    ],
    defaultSecondaryVariant: 'auto',
    secondaryVariantLabel: 'Option count',
    page: 'onboarding-flow',
  },
  {
    // QE (Qualifying / exam prep / pre-licensing) vs CE (renewal / continuing
    // education) — drives the goal options, license types, and interest courses
    // the Onboarding Flow shows. Variant-only.
    key: 'onboarding-education-type',
    label: 'Education type',
    description:
      'Which journey the Onboarding Flow runs: Qualifying Education (get licensed), Exam Prep, or Continuing Education (renew / stay current). Brand-labeled — Real Estate "Pre-Licensing", Appraisal "Qualifying Ed", Healthcare / Securities "Exam Prep". Only XCEL offers all three; every other brand bundles exam prep into its qualifying education, so their Exam Prep arm shows the same goals, licence types and courses as Qualifying Education. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'ce',
    variants: [
      { value: 'qe', label: 'Qualifying Education', description: 'Pre-licensing goals, license types, and courses.' },
      { value: 'exam-prep', label: 'Exam Prep', description: 'Exam-preparation goals and the study-tool shelf. Aliased to Qualifying Education on every brand except XCEL.' },
      { value: 'ce', label: 'Continuing Education', description: 'Renewal / CE goals, license types, and courses.' },
    ],
    page: 'onboarding-flow',
  },
  {
    // Single vs. multiple licenses/registrations — the License step's type
    // picker becomes a multi-select when `multiple`. Variant-only.
    key: 'onboarding-license-count',
    label: 'Licenses held',
    description:
      'Whether the learner holds a single license/registration or multiple. Multiple makes the Onboarding Flow License step a multi-select. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'single',
    variants: [
      { value: 'single', label: 'Single', description: 'One license/registration (single-select).' },
      { value: 'multiple', label: 'Multiple', description: 'Several licenses/registrations (multi-select).' },
    ],
    page: 'onboarding-flow',
  },
  {
    // Single vs. multiple states — the License step's state picker becomes a
    // multi-select when `multiple`. Variant-only.
    key: 'onboarding-state-count',
    label: 'States licensed',
    description:
      'Whether the learner is licensed in a single state or several. Multiple makes the Onboarding Flow License step\'s state picker a multi-select. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'single',
    variants: [
      { value: 'single', label: 'Single', description: 'Licensed in one state (single-select).' },
      { value: 'multiple', label: 'Multiple', description: 'Licensed in several states (multi-select).' },
    ],
    page: 'onboarding-flow',
  },
  {
    // One on/off flag per goal-tile SLOT on the setup wizard's Goal step. The
    // flags map by position (1–4), so they work for EVERY brand + education
    // type — the tile each controls varies (e.g. slot 1 = "Renew my license" on
    // McKissock CE, "Get my license" on CRE QE). Turning a slot off hides that
    // tile; turning all four off skips the Goal step entirely. Grouped so they
    // cluster in the panel.
    key: 'setup-goal-renew',
    group: 'Setup goal options',
    label: 'Goal tile 1',
    description: 'Show the 1st goal tile on the setup Goal step (varies by brand + education type, e.g. "Renew my license"). On by default; turn all four off to skip the Goal step.',
    defaultEnabled: true,
    page: 'onboarding-flow',
  },
  {
    key: 'setup-goal-certification',
    group: 'Setup goal options',
    label: 'Goal tile 2',
    description: 'Show the 2nd goal tile on the setup Goal step (varies by brand + education type, e.g. "Complete USPAP" / "Earn a certification"). On by default.',
    defaultEnabled: true,
    page: 'onboarding-flow',
  },
  {
    key: 'setup-goal-ce',
    group: 'Setup goal options',
    label: 'Goal tile 3',
    description: 'Show the 3rd goal tile on the setup Goal step (varies by brand + education type, e.g. "Stay current with CE"). On by default.',
    defaultEnabled: true,
    page: 'onboarding-flow',
  },
  {
    key: 'setup-goal-explore',
    group: 'Setup goal options',
    label: 'Goal tile 4',
    description: 'Show the 4th goal tile on the setup Goal step (varies by brand + education type, usually "Just exploring"). On by default.',
    defaultEnabled: true,
    page: 'onboarding-flow',
  },
  {
    key: 'dashboard-free-content-bands',
    group: 'Widgets',
    label: 'Free Content bands',
    description:
      'Show a promo band per Free Content item (the blog + the podcast) on the Dashboard Rebrand member overview, under the membership upsell band. Same banner treatment as the upsell, in the brand colour rather than the upsell plum, since these are free to everyone. Copy + glyphs come from the same fixture the Free Content page uses. Brand-gated by that fixture, so it self-hides where there is no free content.',
    // New — off by default so it is a deliberate stakeholder toggle.
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-career-tools',
    group: 'Widgets',
    label: 'Career Tools section',
    description:
      'Show the "Career Tools" section at the bottom of the Dashboard Rebrand overview — the three Rubi AI tool cards (Interview Simulation, Resume Review, Career Path Explorer), all included with membership.',
    // Project default: off (per demo baseline).
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    // Key kept stable (persisted in localStorage + referenced by the prototype
    // tile) even though the experience moved from a modal to an in-panel view.
    key: 'already-enrolled-modal',
    group: 'Enrollment',
    label: 'Manage Enrollment (owned course)',
    description:
      'How the Course Catalog handles the primary CTA on a course the member is ALREADY enrolled in. On → the "Manage Enrollment" CTA swaps the Course Details sheet body in place to the switch flows (change date/time · change format). Off → the CTA behaves as before (fresh enroll-confirmation). The owned-course treatment (Enrolled badge · "Course Details" title) is data-driven and shows regardless of this flag. Demo courses (McKissock): "Income Approach Case Studies" (sessions) + "Fair Housing & Bias in Appraisals" (formats).',
    defaultEnabled: true,
    page: 'course-catalog',
  },
  {
    key: 'catalog-upsell-flow',
    group: 'Course Catalog',
    label: 'Course upsell flow (non-member)',
    description:
      'Which sheet opens when a shopper clicks a course card in the Course ' +
      'Catalog. CURRENT (default) is today\u2019s single-screen Purchase Course ' +
      'sheet \u2014 price, Add to Cart / Course Overview buttons, and the ' +
      'Description \u00b7 Instructor \u00b7 Schedule tabs inline. NEW UPSELL is the ' +
      'two-step sheet from Figma: step 1 "Choose how to enroll" (one-time ' +
      'purchase vs. the membership that includes this course, pre-selected with ' +
      'a BEST VALUE pill and benefit lines), step 2 "Complete purchase" with the ' +
      'matching cart CTA \u2014 and Course Details moved behind a "View Course ' +
      'Details" link that swaps the sheet body in place. Purchase-only: a member ' +
      'already entitled to the course keeps the current sheet either way, since ' +
      'the Enroll / Manage Enrollment paths are out of scope for this design.',
    defaultEnabled: true,
    variants: [
      {
        value: 'current',
        label: 'Current',
        description:
          'Today\u2019s Purchase Course sheet. The control arm for the upsell test.',
      },
      {
        value: 'new',
        label: 'New upsell',
        description:
          'The two-step Choose-how-to-enroll \u2192 Complete-purchase sheet with the ' +
          'membership option and Course Details behind a link.',
      },
    ],
    // Demo baseline: the New Upsell flow is the committed default so the
    // Dashboard Discoverability Demo opens the two-step upsell sheet for everyone.
    defaultVariant: 'new',
    page: 'course-catalog',
  },
  {
    key: 'pricing-entitled-savings',
    group: 'Course Catalog',
    label: 'Show entitled savings',
    description:
      'On the Purchase Course sheet, when a member is already entitled to a product: ' +
      'ON shows the original price struck through as a savings anchor beside the ' +
      '"Included with Membership" chip; OFF (default) shows the chip alone. ' +
      'Neither state ever shows "$0.00".',
    defaultEnabled: false,
    page: 'course-catalog',
  },
  {
    key: 'catalog-included-tier-line',
    group: 'Course Catalog',
    label: 'Included-course tier accent',
    description:
      'On Course Catalog cards, mark a product already included in the member’s ' +
      'current membership with a 6px accent line along the bottom of the card ' +
      'image, colored to the membership tier (e.g. blue for Passport Lite). ' +
      'ON (default) shows the accent; OFF shows no accent.',
    defaultEnabled: true,
    page: 'course-catalog',
  },

  /* ─── Learning Resources Updates (resource viewer) ───────────────── */
  {
    key: 'resource-attachments',
    group: 'Learning Resources',
    label: 'Attachments block',
    description:
      'Show the Attachments block at the top of the resource right rail. ON (default) surfaces any attachments included with the resource; OFF hides the block entirely. Count-driven treatment: 0 → block omitted, 1 → single pinned card, 2+ → collapsed behind the "Attachments (n)" header.',
    defaultEnabled: true,
    page: 'learning-resources',
  },
  {
    key: 'resource-suggested-topics',
    group: 'Learning Resources',
    label: 'Suggested Topics pane',
    description:
      'Show the "Suggested Similar Topics" pane in the resource right rail (the YouTube-style related-resources list). ON (default) shows the pane below any attachments; OFF hides it.',
    defaultEnabled: true,
    page: 'learning-resources',
  },
  {
    key: 'resource-suggestion-reason',
    group: 'Learning Resources',
    label: 'Suggestion reason chips',
    description:
      'Show the "why you\'re seeing this" reason tag (Same topic, Popular with nurses…) on each Suggested Topics card. ON shows the chip; OFF (default) hides it. No effect when the Suggested Topics pane is off.',
    defaultEnabled: false,
    page: 'learning-resources',
  },
  {
    key: 'resource-suggestion-filters',
    group: 'Learning Resources',
    label: 'Suggestion filter chips',
    description:
      'Show the category filter-chip row (All · Medical Reference · Clinical Skills…) above the Suggested Topics list. ON shows the chips and enables client-side filtering; OFF (default) shows the full list with no filter row. No effect when the Suggested Topics pane is off.',
    defaultEnabled: false,
    page: 'learning-resources',
  },

  /* ─── Purchases → Gift Recipients (purchase for others) ───────────── */
  {
    key: 'gift-recipients',
    group: 'Gift Recipients',
    label: 'Gift Recipients section',
    description:
      'The "Purchase for Others" tracking section under Purchases — a history of everything bought on behalf of someone else, with each recipient\'s claim (redemption) status and a Send Reminder action. ON (default) adds the "Gift Recipients" row to the account sub-nav and serves /account/gift-recipients; OFF hides the row and redirects the route back to Purchases. Only appears for brands that sell purchase-for-others (STC today) — other brands show the section\'s empty state.',
    defaultEnabled: true,
    page: 'account-purchases',
  },
  {
    key: 'gift-recipients-layout',
    group: 'Gift Recipients',
    label: 'Layout (A/B)',
    description:
      'Which Gift Recipients layout renders. The roster TABLE is the design now; the expandable card list was archived on 2026-08-21 after the A/B (see ARCHIVED_ITEMS `gift-recipients-card-list`) but remains a valid value so its implementation stays reachable via `?ff=gift-recipients-layout:cards`. Variant-only — read the variant, ignore the toggle.',
    defaultEnabled: true,
    defaultVariant: 'table',
    variants: [
      {
        value: 'table',
        label: 'Roster table',
        description:
          'The default. A dense sortable roster — every column header sorts, clicking a row opens that purchase in a detail sheet, and each unclaimed row carries a Send Reminder link. Built for the story\'s 100+-seat manager: ~15 rows fit where 4 cards did.',
      },
      {
        value: 'cards',
        label: 'Card list (archived)',
        description:
          'The reference UX, kept reachable for comparison: records bucketed under collapsible month headings as expandable cards. Archived — no dev-handoff tile points at it.',
      },
    ],
    page: 'account-purchases',
  },
  {
    key: 'gift-recipients-reminder',
    group: 'Gift Recipients',
    label: 'Send Reminder placement (card arm only)',
    description:
      'Where the Send Reminder action sits on an unclaimed record. CARD ARM ONLY — the roster table has its own per-row link, so with the card list archived this flag is inert unless you pin `?ff=gift-recipients-layout:cards`. Variant-only — read the variant, ignore the toggle.',
    defaultEnabled: true,
    defaultVariant: 'detail',
    variants: [
      {
        value: 'detail',
        label: 'In details',
        description:
          'Reminder button lives inside the expanded record, under Claim status — the reference UX. The manager reads the record before nudging.',
      },
      {
        value: 'row',
        label: 'On the row',
        description:
          'Reminder button sits on the collapsed row beside View Details, so a long unclaimed list can be worked without expanding each record. Better for bulk purchasers (100+ seats).',
      },
    ],
    page: 'account-purchases',
  },
]

/* ─── persistence ──────────────────────────────────────────────────── */

const STORAGE_KEY = 'cgp.featureFlags'
// Custom per-flag default baseline captured via the panel's "Set as
// default" action. Only holds keys the reviewer explicitly saved —
// everything else falls back to the catalog `defaultEnabled` /
// `defaultVariant`. "Reset to defaults" reads custom-or-catalog;
// "Restore originals" clears this store.
const CUSTOM_DEFAULTS_KEY = 'cgp.featureFlags.customDefaults'

/** Persisted shape — keyed by flag key. Fields optional so the
 *  catalog defaults fill in any gaps when reading. */
type PersistedFlagState = Partial<{
  enabled: boolean
  variant: string
  secondaryVariant: string
}>
type PersistedState = Record<string, PersistedFlagState>

/** The catalog (factory) default for a single flag definition. */
function catalogDefault(def: FeatureFlagDefinition): FeatureFlagState {
  return {
    enabled: def.defaultEnabled,
    variant: def.defaultVariant,
    secondaryVariant: def.defaultSecondaryVariant,
  }
}

/** Load the saved custom-default baseline. Validates the same way as
 *  `loadInitial` (boolean enabled, variant must exist in the catalog)
 *  and keeps ONLY keys that were explicitly saved — a missing key means
 *  "use the catalog default". */
function loadCustomDefaults(): Record<string, FeatureFlagState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(CUSTOM_DEFAULTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PersistedState
    const out: Record<string, FeatureFlagState> = {}
    for (const def of FEATURE_FLAGS) {
      const saved = parsed[def.key]
      if (!saved) continue
      const enabled =
        typeof saved.enabled === 'boolean' ? saved.enabled : def.defaultEnabled
      const variantIsValid =
        typeof saved.variant === 'string' &&
        (def.variants?.some((v) => v.value === saved.variant) ?? false)
      const secondaryIsValid =
        typeof saved.secondaryVariant === 'string' &&
        (def.secondaryVariants?.some(
          (v) => v.value === saved.secondaryVariant,
        ) ?? false)
      out[def.key] = {
        enabled,
        variant: variantIsValid ? saved.variant : def.defaultVariant,
        secondaryVariant: secondaryIsValid
          ? saved.secondaryVariant
          : def.defaultSecondaryVariant,
      }
    }
    return out
  } catch {
    return {}
  }
}

/** Compute the initial in-memory state by merging catalog defaults with
 *  whatever is persisted. Unknown keys in localStorage are ignored. */
function loadInitial(): Record<string, FeatureFlagState> {
  const defaults: Record<string, FeatureFlagState> = {}
  for (const def of FEATURE_FLAGS) {
    defaults[def.key] = catalogDefault(def)
  }
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as PersistedState
    const merged: Record<string, FeatureFlagState> = { ...defaults }
    for (const def of FEATURE_FLAGS) {
      const persisted = parsed[def.key]
      if (!persisted) continue
      const enabled =
        typeof persisted.enabled === 'boolean'
          ? persisted.enabled
          : def.defaultEnabled
      // Reject variant values that aren't in the catalog — protects
      // against a stale localStorage entry pointing at a removed
      // variant.
      const variantIsValid =
        typeof persisted.variant === 'string' &&
        (def.variants?.some((v) => v.value === persisted.variant) ?? false)
      const variant = variantIsValid ? persisted.variant : def.defaultVariant
      const secondaryIsValid =
        typeof persisted.secondaryVariant === 'string' &&
        (def.secondaryVariants?.some(
          (v) => v.value === persisted.secondaryVariant,
        ) ?? false)
      const secondaryVariant = secondaryIsValid
        ? persisted.secondaryVariant
        : def.defaultSecondaryVariant
      merged[def.key] = { enabled, variant, secondaryVariant }
    }
    return merged
  } catch {
    return defaults
  }
}

/* ─── context ──────────────────────────────────────────────────────── */

export type FeatureFlagContextValue = {
  /** Full state map, keyed by flag key. */
  flags: Record<string, FeatureFlagState>
  /** Catalog (the source-of-truth definitions). Stable reference. */
  definitions: FeatureFlagDefinition[]
  setEnabled: (key: string, enabled: boolean) => void
  setVariant: (key: string, variant: string) => void
  /** Merge a batch of partial flag states into the live state in one
   *  update. Used to seed a starting configuration (e.g. the MVP
   *  dashboard's snapshot) that reviewers can then adjust via the panel
   *  like any other flag. */
  applyFlags: (map: Record<string, Partial<FeatureFlagState>>) => void
  /** Set the second variant dimension for flags that define
   *  `secondaryVariants`. */
  setSecondaryVariant: (key: string, secondaryVariant: string) => void
  /** Reset all flags to the effective default — the saved custom
   *  default where one exists, otherwise the catalog default. */
  reset: () => void
  /** Snapshot the current state of the given flag keys as the custom
   *  default baseline (used by the panel's per-page "Set as default"). */
  saveAsDefault: (keys: string[]) => void
  /** Clear every saved custom default and reset all flags to the
   *  catalog (factory) defaults. */
  restoreOriginals: () => void
  /** True when at least one custom default is currently saved. */
  hasCustomDefaults: boolean
  /** True while the Demo view is active. In demo mode the live flag
   *  state is swapped for the Default baseline (the saved custom default
   *  per key, else the catalog default) and NOTHING is persisted — any
   *  edits made from the back-door demo tools are ephemeral and are
   *  discarded when demo mode turns off. So the Demo always renders the
   *  Default configuration regardless of how the sandbox was tinkered. */
  demoMode: boolean
  /** Enter / leave demo mode. On enter, the current live flags are
   *  snapshotted and the working map is replaced by the Default baseline
   *  with persistence suspended; on leave, the snapshot is restored and
   *  persistence resumes. Safe to call repeatedly with the same value. */
  setDemoMode: (on: boolean) => void
  /** Drop the read-only `?ff=` URL flag overrides for the rest of this session.
   *  A shared link's pinned flags are seeded at page load and otherwise win over
   *  live edits until a reload; Reset calls this (after removing `ff` from the
   *  URL) so it can return the sandbox to baseline without a reload. */
  clearUrlOverrides: () => void
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null)

/** Compute the Default baseline for every flag — the saved custom
 *  default per key (the reviewer's "Set as default"), else the catalog
 *  factory default. This is what the Demo view renders. */
function baselineFrom(
  customDefaults: Record<string, FeatureFlagState>,
): Record<string, FeatureFlagState> {
  const out: Record<string, FeatureFlagState> = {}
  for (const def of FEATURE_FLAGS) {
    out[def.key] = customDefaults[def.key] ?? catalogDefault(def)
  }
  return out
}

/**
 * Read-only flag overrides from a `?ff=` URL param — `?ff=key:variant,key:on`
 * (`on`/`off` toggle enabled; any other value sets the variant + enables).
 * Layered on READS only (never written to localStorage), so a live-preview embed
 * can pin a flag state (e.g. `state-count:multiple`) without mutating the
 * reviewer's saved sandbox. Empty when the param is absent (every normal load).
 */
function readUrlFlagOverrides(): Record<string, Partial<FeatureFlagState>> {
  try {
    const ff = new URLSearchParams(window.location.search).get('ff')
    if (!ff) return {}
    const out: Record<string, Partial<FeatureFlagState>> = {}
    for (const tok of ff.split(',')) {
      // Grammar: `key` | `key:on` | `key:off` | `key:variant` |
      // `key:variant:secondaryVariant`. The optional third segment sets the
      // second variant axis (e.g. the Recommended band's card style), so a
      // shared link can pin BOTH the background variant and the card style.
      const [key, val, sec] = tok.split(':')
      if (!key) continue
      if (val === 'off') out[key] = { enabled: false }
      else if (!val || val === 'on') out[key] = { enabled: true }
      else {
        out[key] = { enabled: true, variant: val }
        if (sec) out[key].secondaryVariant = sec
      }
    }
    return out
  } catch {
    return {}
  }
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState(loadInitial)
  // `?ff=` overrides — seeded once from the URL, merged onto reads below. Kept in
  // state (not a plain memo) so it can be CLEARED live: a read-only URL override
  // is pinned at page load, so without this a control that removes `?ff=` from the
  // URL (e.g. the Demo Controls Reset) couldn't beat the override until a reload.
  const [urlOverrides, setUrlOverrides] = useState(readUrlFlagOverrides)
  const clearUrlOverrides = useCallback(() => setUrlOverrides({}), [])
  // Drop a single flag's `?ff=` override so an EXPLICIT edit (a panel toggle /
  // variant change) wins live. Without this, a pinned override masks the edit —
  // the saved value updates but reads still return the frozen override, so the
  // control appears dead ("why isn't this letting me click around").
  const dropUrlOverride = useCallback((key: string) => {
    setUrlOverrides((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])
  // Saved custom-default baseline (per-flag). Empty by default.
  const [customDefaults, setCustomDefaults] = useState(loadCustomDefaults)
  // Demo mode — the "pure" Demo view. When on, `flags` holds the Default
  // baseline and persistence is suspended (see the guard below), so any
  // ephemeral edits from the back-door demo tools never touch the saved
  // sandbox state. The pre-demo live flags are stashed in `snapshotRef`
  // and restored on exit.
  const [demoMode, setDemoModeState] = useState(false)
  const demoActiveRef = useRef(false)
  const snapshotRef = useRef<Record<string, FeatureFlagState> | null>(null)

  // Persist on every change — EXCEPT while demo mode is active, so the
  // ephemeral demo baseline + any in-demo tweaks are never written to
  // `cgp.featureFlags`. Quota / private-mode failures are swallowed —
  // state still lives in memory.
  useEffect(() => {
    if (demoActiveRef.current) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    } catch {
      // ignore
    }
  }, [flags])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CUSTOM_DEFAULTS_KEY,
        JSON.stringify(customDefaults),
      )
    } catch {
      // ignore
    }
  }, [customDefaults])

  const setEnabled = useCallback((key: string, enabled: boolean) => {
    dropUrlOverride(key)
    setFlags((prev) => {
      // Resilient to missing keys — if a flag is added to the catalog
      // mid-session (via HMR, or for any other reason), the existing
      // in-memory state map won't have an entry yet. Seed it from the
      // catalog's defaults instead of dropping the update silently.
      const def = FEATURE_FLAGS.find((f) => f.key === key)
      const current =
        prev[key] ??
        (def
          ? { enabled: def.defaultEnabled, variant: def.defaultVariant }
          : null)
      if (!current) return prev
      let next = { ...prev, [key]: { ...current, enabled } }
      // Mutual exclusion: enabling a flag in a `mutexGroup` disables its
      // peers (radio-button behavior). Only fires on enable — turning a
      // flag off leaves the rest alone (the group can be all-off).
      if (enabled && def?.mutexGroup) {
        for (const peer of FEATURE_FLAGS) {
          if (peer.key === key || peer.mutexGroup !== def.mutexGroup) continue
          const peerCurrent =
            next[peer.key] ?? {
              enabled: peer.defaultEnabled,
              variant: peer.defaultVariant,
            }
          if (peerCurrent.enabled) {
            next = { ...next, [peer.key]: { ...peerCurrent, enabled: false } }
          }
        }
      }
      return next
    })
  }, [dropUrlOverride])

  const setVariant = useCallback((key: string, variant: string) => {
    dropUrlOverride(key)
    setFlags((prev) => {
      const def = FEATURE_FLAGS.find((f) => f.key === key)
      const current = prev[key] ?? (def ? catalogDefault(def) : null)
      if (!current) return prev
      return { ...prev, [key]: { ...current, variant } }
    })
  }, [dropUrlOverride])

  const applyFlags = useCallback(
    (map: Record<string, Partial<FeatureFlagState>>) => {
      setFlags((prev) => {
        const next = { ...prev }
        for (const [key, override] of Object.entries(map)) {
          const def = FEATURE_FLAGS.find((f) => f.key === key)
          const current =
            prev[key] ?? (def ? catalogDefault(def) : { enabled: false })
          next[key] = { ...current, ...override }
        }
        return next
      })
    },
    [],
  )

  const setSecondaryVariant = useCallback(
    (key: string, secondaryVariant: string) => {
      dropUrlOverride(key)
      setFlags((prev) => {
        const def = FEATURE_FLAGS.find((f) => f.key === key)
        const current = prev[key] ?? (def ? catalogDefault(def) : null)
        if (!current) return prev
        return { ...prev, [key]: { ...current, secondaryVariant } }
      })
    },
    [dropUrlOverride],
  )

  // Reset to the effective default: the saved custom default per key,
  // else the catalog default.
  const reset = useCallback(() => {
    const fresh: Record<string, FeatureFlagState> = {}
    for (const def of FEATURE_FLAGS) {
      fresh[def.key] = customDefaults[def.key] ?? catalogDefault(def)
    }
    setFlags(fresh)
  }, [customDefaults])

  // Snapshot the current state of the given keys as the custom default
  // baseline, merging over any previously-saved keys.
  // Both of these write the DEFAULT BASELINE — the thing `?demo=1` renders — so
  // both refuse while the Demo view is on. `FeatureFlagPanel` already hides the
  // two buttons under `demoMode`, and that was the only guard until 2026-09-16,
  // when the robot became reachable inside the Demo view (see `AdminToolsMenu`).
  // A guard that lives only in whether a button renders is one stale call site
  // away from letting a demoer redefine what "pure" means, from inside the demo
  // — the same reasoning as `visibleNotifications` re-checking `requiredInApp`
  // rather than trusting what was stored. Demo mode already suspends ordinary
  // flag persistence; this closes the one write that bypassed it.
  const saveAsDefault = useCallback(
    (keys: string[]) => {
      if (demoMode) return
      setCustomDefaults((prev) => {
        const next = { ...prev }
        for (const key of keys) {
          const def = FEATURE_FLAGS.find((f) => f.key === key)
          if (!def) continue
          const current = flags[key] ?? catalogDefault(def)
          next[key] = { ...current }
        }
        return next
      })
    },
    [flags, demoMode],
  )

  // Clear all saved custom defaults and snap every flag back to the
  // catalog (factory) defaults. Refused in the Demo view for the same reason as
  // `saveAsDefault` above — it rewrites the baseline the Demo renders.
  const restoreOriginals = useCallback(() => {
    if (demoMode) return
    setCustomDefaults({})
    const fresh: Record<string, FeatureFlagState> = {}
    for (const def of FEATURE_FLAGS) {
      fresh[def.key] = catalogDefault(def)
    }
    setFlags(fresh)
  }, [demoMode])

  const hasCustomDefaults = Object.keys(customDefaults).length > 0

  // Enter / leave demo mode. On enter: snapshot the live flags (captured
  // inside the setState updater so it's never stale) and replace the
  // working map with the Default baseline. On leave: restore the snapshot.
  // The persist effect is gated on `demoActiveRef`, so entering, editing,
  // and leaving demo mode never write to localStorage — the sandbox state
  // survives untouched. Idempotent: a redundant call is a no-op.
  const setDemoMode = useCallback(
    (on: boolean) => {
      if (on === demoActiveRef.current) return
      demoActiveRef.current = on
      setDemoModeState(on)
      if (on) {
        const baseline = baselineFrom(customDefaults)
        setFlags((prev) => {
          snapshotRef.current = prev
          return baseline
        })
      } else {
        const restored = snapshotRef.current
        snapshotRef.current = null
        if (restored) setFlags(restored)
      }
    },
    [customDefaults],
  )

  // Reads see the `?ff=` overrides layered on top; writes/persistence use the
  // base `flags` only, so an override is never saved.
  const readFlags = useMemo(() => {
    const keys = Object.keys(urlOverrides)
    if (keys.length === 0) return flags
    const out = { ...flags }
    for (const k of keys) out[k] = { ...out[k], ...urlOverrides[k] }
    return out
  }, [flags, urlOverrides])

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags: readFlags,
      definitions: FEATURE_FLAGS,
      setEnabled,
      setVariant,
      applyFlags,
      setSecondaryVariant,
      reset,
      saveAsDefault,
      restoreOriginals,
      hasCustomDefaults,
      demoMode,
      setDemoMode,
      clearUrlOverrides,
    }),
    [
      readFlags,
      setEnabled,
      setVariant,
      applyFlags,
      setSecondaryVariant,
      reset,
      saveAsDefault,
      restoreOriginals,
      hasCustomDefaults,
      demoMode,
      setDemoMode,
      clearUrlOverrides,
    ],
  )

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

/* ─── hooks ────────────────────────────────────────────────────────── */

/**
 * Read all flags + setters. Use this in the Feature Flag panel; most
 * feature consumers want `useFeatureFlag(key)` instead.
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  const ctx = useContext(FeatureFlagContext)
  if (!ctx) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagProvider',
    )
  }
  return ctx
}

/**
 * Read a single flag's current state. Returns the catalog default if
 * the key isn't in state (shouldn't happen — `loadInitial` seeds
 * everything — but the fallback keeps consumers crash-free if a flag
 * was removed mid-session).
 */
/**
 * Read whether the "pure" Demo view is active, without throwing outside a
 * provider (returns `false`) — mirrors the safe-default pattern of
 * {@link useFeatureFlag}, so leaf components that branch on demo mode can
 * still be unit-mounted standalone.
 */
export function useDemoMode(): boolean {
  return useContext(FeatureFlagContext)?.demoMode ?? false
}

/**
 * Whether a left-nav section is currently shown, per its `nav-*` flag.
 *
 * Returns a PREDICATE rather than taking a key, because the rail resolves this
 * for a list: calling `useFeatureFlag` once per item would be a hook inside a
 * loop, and the loop's length changes with the brand and the rail variant.
 *
 * Unknown sections return `true` — a section with no flag (Home, and the
 * account-scoped sections that are not rail items at all) is not hidden by
 * omission. Outside a provider every section is visible, matching the
 * safe-default behaviour of `useFeatureFlag`.
 */
/**
 * Whether the Continuing Ed path has a study plan (`ce-study-plan`, default ON).
 *
 * A hook rather than a bare flag read because BOTH surfaces that resolve a plan
 * have to agree — the Jump Back In card's Today's Tasks and the Study Plan
 * page. One showing a CE plan while the other showed the empty branch is the
 * drift this exists to prevent.
 *
 * Outside a provider it returns the catalog default, matching `useFeatureFlag`.
 */
/**
 * The Readiness demo state. Falls back to `on-track` — the committed default,
 * and the state the section is meant to open on.
 */
export function useReadinessState(): string {
  return useFeatureFlag('readiness-state').variant ?? 'on-track'
}

export function useCeStudyPlanEnabled(): boolean {
  return useFeatureFlag('ce-study-plan').enabled
}

export function useNavSectionVisible(): (section: string) => boolean {
  const ctx = useContext(FeatureFlagContext)
  return useCallback(
    (section: string) => {
      const key = navSectionFlagKey(section)
      const def = FEATURE_FLAGS.find((f) => f.key === key)
      if (!def) return true
      return ctx?.flags[key]?.enabled ?? def.defaultEnabled
    },
    [ctx],
  )
}

export function useFeatureFlag(key: string): FeatureFlagState {
  // Read the context directly (rather than via `useFeatureFlags`) so a consumer
  // rendered outside a provider gets the catalog default instead of throwing —
  // mirrors the safe-default pattern used by `useTheme` / `useDeviceFrame`, and
  // lets leaf components (e.g. `ProductPriceSlot`) be unit-mounted standalone.
  const ctx = useContext(FeatureFlagContext)
  const def = FEATURE_FLAGS.find((f) => f.key === key)
  const fallback: FeatureFlagState = {
    enabled: def?.defaultEnabled ?? false,
    variant: def?.defaultVariant,
    secondaryVariant: def?.defaultSecondaryVariant,
  }
  return ctx?.flags[key] ?? fallback
}
