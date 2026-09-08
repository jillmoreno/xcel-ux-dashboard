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
// Per-widget Lo-Fi variant — scopes the global Lo-Fi wireframe treatment
// to a single dashboard widget. Appended to each featured widget's flag
// so reviewers can preview one widget as a placeholder without flipping
// the whole page via the global Lo-Fi master switch.
const LO_FI_VARIANT: FeatureFlagVariant = {
  value: 'lo-fi',
  label: 'Lo-Fi',
  description:
    'Render just this widget as a lo-fi wireframe placeholder. Same treatment as the global Lo-Fi master switch, scoped to this widget.',
}

// Variant set for widgets that were previously toggle-only — a plain
// rendered "Default" plus the Lo-Fi placeholder option.
const DEFAULT_PLUS_LOFI: FeatureFlagVariant[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Normal rendered widget.',
  },
  LO_FI_VARIANT,
]

export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  {
    key: 'dashboard-kpi-card',
    group: 'KPI Card',
    label: 'Dashboard KPI Card',
    description:
      "Hero band at the top of the dashboard showing the welcome row + key stats (credits, progress, certificates). Toggle off to hide it entirely, or switch between the new light treatment and the original dark teal version.",
    defaultEnabled: true,
    defaultVariant: 'light',
    variants: [
      {
        value: 'light',
        label: 'Light',
        description: 'White card surface, primary-800 text — current V3 default.',
      },
      {
        value: 'dark',
        label: 'Dark',
        description: 'Original teal background with white text.',
      },
      LO_FI_VARIANT,
    ],
    secondaryVariantLabel: 'Orientation',
    defaultSecondaryVariant: 'auto',
    secondaryVariants: [
      {
        value: 'auto',
        label: 'Auto',
        description:
          "Use each dashboard version's natural orientation — horizontal band on V1–V3, vertical widget on V4.",
      },
      {
        value: 'horizontal',
        label: 'Horizontal',
        description:
          'Force the long, full-width horizontal band (welcome + 4 inline stats) regardless of version.',
      },
      {
        value: 'vertical',
        label: 'Vertical',
        description:
          'Force the short, vertical widget — welcome block on top, stats as a 2×2 grid below. Best in a narrow column.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'jump-back-in-card',
    // One of two mutually-exclusive Jump Back In versions — this is the
    // original (course-card) version. Enabling the "+ Quick Links"
    // version below auto-disables this one and vice versa.
    mutexGroup: 'jump-back-in',
    group: 'Jump Back In Card',
    label: 'Jump Back In',
    description:
      'Standard Jump Back In tile (no quick links). Toggle to hide; pick a variant to switch between the single full-size course card, the stacked rows, and the 3-card spotlight. Mutually exclusive with the "+ Quick Links" version.',
    defaultEnabled: true,
    defaultVariant: 'single',
    variants: [
      {
        value: 'single',
        label: 'Single card',
        description:
          'Current V3 default — one full-size course card for the most recent in-progress course. View All opens the in-progress slide-over.',
      },
      {
        value: 'stacked',
        label: 'Stacked rows',
        description:
          'Up to two smaller in-progress course rows, then a Recently Added subhead with up to two not-started rows (four cards max). View All routes to My Courses.',
      },
      {
        value: 'path-aware',
        label: 'Stacked + What\'s Next',
        description:
          "Demo simulation of the empty-in-progress state — the card title flips to \"What's Next\" and the top rows show two 0%-progress cards (the next not-started courses from the learner's path). Pick this to preview the UX without changing fixture data.",
      },
      {
        value: 'stacked-trio',
        label: 'Stacked (3 cards)',
        description:
          'Three larger stacked cards — one in-progress, one recently added, one recent certificate. Each card is sized up so the tile keeps the same vertical footprint as the 6-card stacked variant.',
      },
      LO_FI_VARIANT,
    ],
    page: 'dashboard',
  },
  {
    key: 'jump-back-in-card-links',
    // The second Jump Back In version — in-progress card + a Quick
    // Links section. Mutually exclusive with the standard version
    // above (enabling one disables the other).
    mutexGroup: 'jump-back-in',
    group: 'Jump Back In Card',
    label: 'Jump Back In + Quick Links',
    description:
      'Alternate Jump Back In tile: the in-progress card on top, then a Quick Links section (Catalog, Certificates, Podcasts, Explore Membership, Recent Purchases). Pick the tile or list presentation, and the in-progress card size. Off by default; enabling it disables the standard Jump Back In version.',
    defaultEnabled: false,
    defaultVariant: 'links-tiles',
    variants: [
      {
        value: 'links-tiles',
        label: 'Quick Links (tiles)',
        description:
          'Quick Links render as a 2-up grid of square tiles below the in-progress card.',
      },
      {
        value: 'links-list',
        label: 'Quick Links (list)',
        description:
          'Quick Links render as a vertical list of rows (medallion + label + caption) below the in-progress card.',
      },
      LO_FI_VARIANT,
    ],
    secondaryVariantLabel: 'Card size',
    defaultSecondaryVariant: 'normal',
    secondaryVariants: [
      {
        value: 'normal',
        label: 'Normal size',
        description:
          'In-progress card uses the standard compact course card (image header + title + progress).',
      },
      {
        value: 'medium',
        label: 'Medium size',
        description:
          'In-progress card keeps the full card anatomy (image header + title + meta + progress) but with a shorter image and collapsed spacing — a denser take on Normal.',
      },
      {
        value: 'small',
        label: 'Small size',
        description:
          'In-progress card shrinks to a compact row — small thumbnail + title + progress — so the Quick Links sit higher.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'jump-back-in-chrome',
    group: 'Jump Back In Card',
    label: 'Jump Back In Container',
    description:
      'How the Jump Back In card is framed. Framed (default) keeps the white card container + View All link. Bare hides the container (no background, border, or padding) and the View All link, so the content sits directly on the page.',
    defaultEnabled: true,
    defaultVariant: 'framed',
    variants: [
      {
        value: 'framed',
        label: 'Framed',
        description: 'White card container with border + View All link — current default.',
      },
      {
        value: 'bare',
        label: 'Bare (no container)',
        description: 'Drops the white container and the View All link; content sits directly on the page.',
      },
    ],
    page: 'dashboard',
  },
  // Per-tile toggles for the Jump Back In Quick Links grid — each tile
  // can be turned on/off independently. The Quick Links section hides
  // entirely when every tile is off.
  {
    key: 'jbi-quicklink-catalog',
    group: 'Quick Links Tiles',
    label: 'Tile — Course Catalog',
    description: 'Show the "Course Catalog" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-library',
    group: 'Quick Links Tiles',
    label: 'Tile — Resource Library',
    description: 'Show the "Resource Library" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-courses',
    group: 'Quick Links Tiles',
    label: 'Tile — My Courses',
    description: 'Show the "My Courses" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-explore-membership',
    group: 'Quick Links Tiles',
    label: 'Tile — Membership',
    description: 'Show the "Membership" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-podcasts',
    group: 'Quick Links Tiles',
    label: 'Tile — Podcasts',
    description: 'Show the "Podcasts" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-certificates',
    group: 'Quick Links Tiles',
    label: 'Tile — Certificates',
    description: 'Show the "Certificates" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-requirements',
    group: 'Quick Links Tiles',
    label: 'Tile — Requirements',
    description: 'Show the "Requirements" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'jbi-quicklink-notes',
    group: 'Quick Links Tiles',
    label: 'Tile — My Notes',
    description: 'Show the "My Notes" tile in the Jump Back In Quick Links grid.',
    defaultEnabled: true,
    page: 'dashboard',
  },
  {
    key: 'learning-path-card',
    group: 'Learning Path Card',
    label: 'Learning Path Card',
    description:
      'Compact V3 path card with progress ring + status pill + key stats (Hours Completed, Expires, etc.). Bottom-left of the V3 main section right column.',
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'courses-summary-card',
    group: 'Courses Card',
    label: 'Courses Summary',
    description:
      'Enlarged multi-segment half-donut gauge showing Completed / In Progress / Not Started / Recently Added counts. Bottom-right of the V3 main section right column.',
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'premium-membership-card',
    group: 'Right Rail',
    label: 'Premium Membership Card',
    description:
      "Right-rail membership card. Non-members see the benefits checklist variant directly under the Rubi widget; members see the lighter informational SidebarCard at the bottom of the rail. Toggle hides both.",
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'whats-new-card',
    group: 'Right Rail',
    label: "What's New Card",
    description:
      "Right-rail card surfacing the latest platform / catalog updates. Pulled from the shared `SIDEBAR_CARDS` fixture.",
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'dashboard-rail-tray',
    group: 'Right Rail',
    label: 'Right Rail Tray',
    description:
      'Wraps the right-rail cards in a tinted tray (28px padding) so the rail reads as a distinct section from the main column. Pick the tray color, or toggle off to sit the rail cards directly on the page background.',
    defaultEnabled: true,
    defaultVariant: 'gray',
    variants: [
      {
        value: 'gray',
        label: 'Gray',
        description: 'Neutral light gray (neutral-100) — a step below the page surface.',
      },
      {
        value: 'deep-gray',
        label: 'Deep gray',
        description: 'A darker neutral (neutral-200) for a more pronounced divide.',
      },
      {
        value: 'brand',
        label: 'Brand tint',
        description: "Soft brand wash (primary-100) — picks up the active brand's primary hue.",
      },
      {
        value: 'accent',
        label: 'Accent tint',
        description: 'Soft accent wash (tertiary-100) for a warmer separation.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'dashboard-top5-pagination',
    group: 'Membership Card',
    label: 'Top 5 Pagination',
    description:
      'Show the Featured Products → Top 5 carousel navigation — the prev/next arrows and the page dots that switch between the Popular / Recommended / Top Podcasts views. Toggle off to lock the carousel to a single view with no nav chrome; pick which view below.',
    defaultEnabled: true,
    secondaryVariantLabel: 'Shown view',
    secondaryVariantWhenDisabled: true,
    defaultSecondaryVariant: 'popular',
    secondaryVariants: [
      {
        value: 'popular',
        label: 'Popular',
        description: 'Lock to the "Top 5 right now" view.',
      },
      {
        value: 'recommended',
        label: 'Recommended',
        description: 'Lock to the "Recommended for you" view.',
      },
      {
        value: 'podcasts',
        label: 'Top Podcasts',
        description: 'Lock to the "Top podcasts" view.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'membership-card-layout',
    group: 'Membership Card',
    label: 'Layout',
    description:
      "Controls how Featured Products is composed when the doubled-height variant is on. Default keeps the current 2-column layout (horizontal Snacks + AI MasterTracks on the left, vertical Top 5 list on the right). Tiles below puts the two feature cards side-by-side at the top and spans the bottom with five Recommended-style square tiles for Top 5 (still showing kind + star rating).",
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: [
      {
        value: 'default',
        label: 'Default (Top 5 right)',
        description:
          'Current layout — Snacks + AI MasterTracks stacked on the left, Top 5 list on the right.',
      },
      {
        value: 'tiles-bottom',
        label: 'Top 5 tiles below',
        description:
          'Snacks + AI MasterTracks horizontal cards along the top; Top 5 spans the bottom as five `SimpleCard`-style square tiles (image + title bar), each tile showing the content type and star rating in the bar.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'membership-card-theme',
    group: 'Membership Card',
    label: 'Theme',
    description:
      'Light keeps the current white surface — the default. Dark drops the card onto a deep teal background (primary-800) with inverted eyebrow text, so the Membership block reads as a marketing-style hero. Inner feature cards stay light so they still pop.',
    defaultEnabled: true,
    defaultVariant: 'light',
    variants: [
      {
        value: 'light',
        label: 'Light',
        description:
          'White surface — current default. Standard card chrome.',
      },
      {
        value: 'dark',
        label: 'Dark',
        description:
          'Deep teal (primary-800) surface with white eyebrow. Inner feature cards retain their light tint for contrast.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'membership-card-height',
    group: 'Membership Card',
    label: 'Height',
    description:
      'Controls the placeholder Membership card content. Single keeps the existing "To be designed" copy. Double doubles the card height and adds three stacked lo-fi feature sections (Feature 1 / 2 / 3) so reviewers can mock placement for the eventual membership-teaser content.',
    defaultEnabled: true,
    defaultVariant: 'single',
    variants: [
      {
        value: 'single',
        label: 'Single (placeholder)',
        description:
          'Current default — "To be designed" subhead + the planned-content one-liner.',
      },
      {
        value: 'double',
        label: 'Double + 3 features',
        description:
          'Roughly 2× the height. Adds three lo-fi sections labeled Feature 1, Feature 2, Feature 3 to scaffold the future membership-teaser content.',
      },
    ],
    page: 'dashboard',
  },
  {
    key: 'membership-card-width',
    group: 'Membership Card',
    label: 'Width',
    description:
      "Controls where the placeholder Membership card sits on V3. Full-width spans the dashboard above the Jump Back In / Learning Paths / Courses row (current default). Two-thirds drops the card into the right column above Learning Paths + Courses so Jump Back In moves up next to it.",
    defaultEnabled: true,
    defaultVariant: 'full',
    variants: [
      {
        value: 'full',
        label: 'Full width',
        description:
          'Spans the whole main column above the Jump Back In row. Matches the original V3 layout.',
      },
      {
        value: 'two-thirds',
        label: 'Two-thirds width',
        description:
          'Sits inside the right column above Learning Paths + Courses (LP + Courses combined width). Jump Back In moves up to the top-left so the row reads JBI · Membership at the top.',
      },
    ],
    page: 'dashboard',
  },
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
    key: 'dashboard-drag-and-drop',
    group: 'Not MVP',
    label: 'Drag-and-Drop Widgets',
    description:
      "Demo affordance — when on, every top-level widget on the dashboard becomes draggable. Grab any card and drop it onto another widget in the same column to reorder; widgets snap back to the dashboard grid. Order resets on page refresh (no persistence — this is a UI/UX preview).",
    defaultEnabled: false,
    page: 'dashboard',
  },
  {
    key: 'quick-links-card',
    group: 'Right Rail',
    label: 'Quick Links',
    description:
      '2×2 tile grid in the right rail — Catalog, Resource Library, Podcasts, Certificates. Each tile has a top-left medallion icon + label + caption.',
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'rubi-tutor-widget',
    group: 'Right Rail',
    label: 'Rubi Tutor Widget',
    description:
      'AI assistant widget at the top of the dashboard right rail — "What can I help you with?" prompt + suggested actions. Toggle off to hide the widget entirely.',
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'streak-hero-card',
    group: 'Not MVP',
    label: 'Streak Hero',
    description:
      'Current learning streak card with personal-best progress + 30-day / this-week activity chart. Top of the V3 main section right column.',
    defaultEnabled: true,
    defaultVariant: 'default',
    variants: DEFAULT_PLUS_LOFI,
    page: 'dashboard',
  },
  {
    key: 'membership-hero-band',
    label: 'Membership Hero',
    description:
      "Welcome band at the top of /membership — eyebrow + greeting + member-since/renewal sub-line + CTAs. Toggle off to hide the whole band, or swap between the dark teal treatment (current) and a light card surface.",
    defaultEnabled: true,
    defaultVariant: 'dark',
    variants: [
      {
        value: 'dark',
        label: 'Dark',
        description: 'Teal gradient with white text — current default.',
      },
      {
        value: 'light',
        label: 'Light',
        description: 'White card surface with primary-800 text.',
      },
    ],
    page: 'membership',
  },
  {
    key: 'membership-v7-bleed-rail',
    label: 'V7 — Full-bleed dark rail',
    description:
      'V7 only. Turn the floating dark nav card into a full-height sidebar: the primary-800 background bleeds to the top, left, and bottom edges of the page (no gutter, no rounded card). Off keeps the current floating-card rail.',
    defaultEnabled: false,
    page: 'membership',
  },
  {
    key: 'membership-summary-style',
    label: 'Membership Summary Style',
    description:
      'Visual treatment of the "Membership Summary" KPI band (Member for / You Saved / Credits / Certificates / Time Spent) on the membership overview.',
    defaultEnabled: true,
    defaultVariant: 'dark',
    variants: [
      {
        value: 'dark',
        label: 'Dark band',
        description: 'Current default — deep teal (secondary-800) surface with white text.',
      },
      {
        value: 'bare',
        label: 'No background',
        description: 'Drops the surface entirely; stats sit on the page with primary-700 text.',
      },
      {
        value: 'light',
        label: 'White card',
        description: 'White card surface (border-defined) with primary-700 text.',
      },
      {
        value: 'banner',
        label: 'Banner header',
        description:
          'Member only — the dark band gains an upper "Your Membership" banner (Passport Lite badge + plan expiry + a "Manage Membership" link) above the stats. Non-members fall back to the dark band.',
      },
    ],
    page: 'dashboard-rebrand',
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
    key: 'membership-hero-stats',
    label: 'Hero Stats Row',
    description:
      'Three inline stats inside the membership hero (Active courses · Saved to library · Unread replies). Toggle off to hide the stats row while keeping the greeting + CTAs.',
    defaultEnabled: true,
    page: 'membership',
  },
  {
    key: 'membership-card-tier-header',
    label: 'Membership Card — Tier Header',
    description:
      'How each membership renders in the "Multiple memberships" page version. ON (default) = the tier-header treatment: a tier-tinted identity block (profession + state + tier pill, with the tier glyph as a large watermark) over a white data body reading Auto-Renews / Expires / Expired on plus Member Tenure in days, and no divider above Manage. OFF = the original all-gradient passport card, where the data sits on the tinted surface and the second cell shows Saved. Applies to BOTH the 3-up tile (3+ memberships) and the landscape band (1–2). Saved leaves the card in the ON state because the roll-up scorecard directly above already totals it.',
    defaultEnabled: true,
    page: 'membership',
  },
  {
    key: 'membership-savings-cta',
    label: 'Non-member Savings CTA',
    description:
      'How the non-member dashboard KPI band ends. Split keeps the separate Potential Savings + Current Plan (Free Account) stats. The combined variants merge them into one Potential Savings cell ($1,180 /year) with an "Explore Membership" CTA — subtle (matches the band) or bold (attention-grabbing).',
    defaultEnabled: true,
    defaultVariant: 'split',
    variants: [
      {
        value: 'split',
        label: 'Split stats',
        description: 'Separate Potential Savings + Current Plan (Free Account) stats — current default.',
      },
      {
        value: 'cta',
        label: 'Combined + subtle CTA',
        description:
          'Merge into one Potential Savings cell (Save $1,180 · /year with membership) + a subtle outlined "Explore Membership" CTA matching the band.',
      },
      {
        value: 'bold',
        label: 'Combined + bold CTA',
        description:
          'Same combined cell on a tinted callout with a filled magenta "Explore Membership" CTA — more attention-grabbing.',
      },
    ],
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
    key: 'membership-count',
    group: 'Navigation',
    label: 'Show Multiple Memberships',
    description:
      'How many memberships the learner holds — a fact about the ACCOUNT, so one flag drives every surface that shows them (the left-rail Membership block and the Membership page\'s "Multiple memberships" version). Off (default) = a single membership: the rail shows the tier badge + Member since / Expires, and the Membership page shows one landscape band. On = multiple, with the variant picking how many: Two renders two landscape bands; three or more render a horizontal carousel of passport tiles. Uses the Elite / Fitzgerald demo fixtures (Elite carries six — one per renewal state); brands with fewer than 2 authored memberships fall back to the single block. Also driven by the Demo Controls bar\'s "Multiple memberships" persona.',
    defaultEnabled: false,
    defaultVariant: 'three',
    variants: [
      {
        value: 'two',
        label: 'Two',
        description: 'Two memberships — the Membership page renders two stacked landscape bands.',
      },
      {
        value: 'three',
        label: 'Three',
        description: 'Three memberships — the Membership page renders a horizontal carousel of passport tiles.',
      },
      {
        value: 'five',
        label: 'Five',
        description: 'Five memberships — the carousel scrolls (arrows + peek) since the tiles overflow the row.',
      },
      {
        value: 'seven',
        label: 'Six',
        description:
          'All six — the full Elite set, one membership per renewal state: auto-renews, expires inside the renewal window, expires outside it, payment failed, grace period, and expired. This is the one to pick to review the renewal-state copy end to end. (The value is still `seven` so existing ?ff= links keep working; the set dropped to six on 2026-08-31 when the second expires-outside-window record was removed for rendering copy identical to the first.)',
      },
    ],
    page: 'dashboard-rebrand',
    // Also surfaces under the Membership page card: the same flag drives the
    // Membership page's multi-membership view, and a second toggle would let
    // the rail and the page disagree about how many memberships exist.
    extraPages: ['membership'],
  },
  {
    // Store for the "Membership Version" picker (opened from the Feature Flag
    // sheet, next to "Dashboard Version") — drives the Dashboard Rebrand
    // "Membership" rail section (MembershipStandalonePage). Not listed in
    // REBRAND_FLAGS: on the rebrand it's set only via the picker, not as a flag
    // row (mirrors how Dashboard Version isn't a flag). Variant-only.
    key: 'membership-page-version',
    group: 'Widgets',
    label: 'Membership page version',
    description:
      'Which layout the Dashboard Rebrand "Membership" rail section renders. Membership Hub (default) is the redesigned at-a-glance hero (personalized heading + a stat band led by Lifetime Member Savings) with the Lo-fi benefits treatment below. Full is the detailed page — hero, comparison grid, upgrade banner, the "Included with Your Membership" shelves, and the "Explore Additional…" benefit spotlights. Set from the "Membership Version" picker in the Feature Flag sheet. (Simple + Lo-fi benefits were archived out of the picker on 2026-08-21 but remain valid values here for deep links.)',
    defaultEnabled: true,
    defaultVariant: 'hub',
    variants: [
      { value: 'hub', label: 'Membership Hub', description: 'The default — redesigned at-a-glance hero (personalized heading + a Lifetime Member Savings stat band) over the Lo-fi benefits treatment. The hero layout (base / + card / split / savings-on-top) is picked by the separate "membership-hub-hero" flag.' },
      { value: 'full', label: 'Full page', description: 'The detailed page with every section.' },
      // ARCHIVED (2026-08-21) — 'simple' + 'lofi' were removed from the
      // Membership Version PICKER (MEMBERSHIP_PAGE_VERSIONS). Like 'scorecard' /
      // 'multi' below, they stay valid flag values so the implementations remain
      // reachable via `?ff=` / deep links and their smoke tests still exercise
      // them. See ARCHIVED_ITEMS for the re-wire.
      { value: 'simple', label: 'Simple (archived)', description: 'Hero + comparison grid (when applicable) + the upgrade banner only. Not in the version picker.' },
      { value: 'lofi', label: 'Lo-fi benefits (archived)', description: 'Full page, but the benefit hero sections become lo-fi wireframe blocks (Benefit N · title · desc · bullets · alternating image). Not in the version picker.' },
      // 'scorecard' (Two sections) + 'multi' (Multiple memberships) were removed
      // from the Membership Version PICKER (MEMBERSHIP_PAGE_VERSIONS) but are kept
      // here as valid flag values so the implementations stay reachable via `?ff=`
      // / deep links and their smoke tests still exercise them.
      { value: 'scorecard', label: 'Two sections', description: 'Full page, but the hero’s five-stat band is replaced by two sections beneath it — Current Membership (passport card) + Membership Scorecard (savings-led KPI strip). Benefit sections render lo-fi. Member-only. Not in the version picker.' },
      { value: 'multi', label: 'Multiple memberships', description: 'For a learner with several memberships: one roll-up savings scorecard over passport cards (grid, or scroll past 3), with Profession + State pill filters below. Benefit sections render lo-fi. Needs Elite or Fitzgerald. Not in the version picker.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    // Hero layout for the "Membership Hub" version (the default Membership page).
    // Split out from the Membership Version picker: those were hero-only tweaks,
    // so they live here as a regular flag on the Membership page card. Only
    // applies when the Membership Version is "Membership Hub".
    key: 'membership-hub-hero',
    group: 'Widgets',
    label: 'Membership Hub — hero layout',
    description:
      'How the Membership Hub hero lays out its "at a glance" stats. Base = the savings-led stat band alone. Split cards puts the Current Membership passport card (tier · plan · state · expiry · Manage) and the Lifetime Member Details card (Total Saved bar over the four stats) as two separate cards. Member-only; only applies to the Membership Hub version.',
    defaultEnabled: true,
    defaultVariant: 'split',
    variants: [
      { value: 'base', label: 'Base (savings band)', description: 'The at-a-glance stat band alone — no membership card.' },
      { value: 'split', label: 'Split cards', description: 'The membership card and the Lifetime Member Details card (Total Saved bar over the four stats) as two separate cards.' },
    ],
    page: 'membership',
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
    key: 'whats-new-image',
    group: 'Widgets',
    label: 'Featured background',
    description:
      "Background treatment for the Featured hero slides (the full-width rotating hero under the Current Learning Path). Image (default) lays the slide's cover photo behind the copy, under a darkening scrim. No image swaps in a brand-gradient panel — the fallback for slides with no cover photo available — keeping the eyebrow / title / copy / CTA legible. Variant-only.",
    defaultEnabled: true,
    // Project default: Image (cover photo behind each slide) — per demo baseline.
    defaultVariant: 'image',
    variants: [
      {
        value: 'no-image',
        label: 'No image',
        description: 'A brand-gradient panel behind the copy — the fallback when no cover photo is available.',
      },
      {
        value: 'image',
        label: 'Image',
        description: "The slide's cover photo behind the copy, under a darkening scrim (the default).",
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
    secondaryVariantLabel: 'When to show',
    defaultSecondaryVariant: 'always',
    secondaryVariants: [
      {
        value: 'always',
        label: 'Always',
        description: 'The full-width Current Learning Path band replaces the top band whenever this flag is on.',
      },
      {
        value: 'when-whats-new-off',
        label: "When What's New is off",
        description:
          "Only when the \"What's Trending\" section is turned off — the Current Learning Path shifts into this full-width view to fill the space the carousel left. With What's New on, the normal top band shows.",
      },
    ],
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
    key: 'dashboard-whats-new-layout',
    group: 'Widgets',
    label: "What's Trending section",
    description:
      'Show/hide the "What\'s Trending" section on the Dashboard Rebrand overview — the image-forward carousel of newly-added content (full-bleed cover photos + gradient + title/meta + a play affordance, scrolled like Recommended for you). Off by default (the "What\'s New off" persona is the default view coming in); the "What\'s New on" persona turns it on.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    // Featured — the single full-width rotating hero on the Dashboard Rebrand
    // overview, directly under the Current Learning Path. It's the one What's New
    // surface (the former What's New carousels were retired). The enable toggle
    // shows/hides the whole widget; the variant picks the motion model:
    //   - `manual` (default) — no auto-advance (matches our shipped carousels
    //     + the Carousel component rules; manual arrows/keys/swipe only).
    //   - `auto` — auto-advances WITH a visible Pause/Play control +
    //     pause-on-hover/focus + prefers-reduced-motion (WCAG 2.2.2). The
    //     variant to demo/discuss with stakeholders.
    // Renders on the Home-style overview (main rebrand, held off the pure Demo).
    key: 'dashboard-featured',
    group: 'Widgets',
    label: 'Featured hero',
    description:
      'The full-width "Featured" rotating hero on the Dashboard Rebrand overview, directly under the Current Learning Path (one image at a time; the image, title, and CTA change as you advance). The enable toggle shows/hides it. Variant: Manual (default — no auto-advance, arrows/keys/swipe only) or Auto-rotate (adds a Pause/Play control, pauses on hover/focus, and respects reduced-motion — for stakeholder review).',
    defaultEnabled: true,
    defaultVariant: 'manual',
    variants: [
      { value: 'manual', label: 'Manual', description: 'No auto-advance — the learner drives it with the arrows, ← / → keys, or swipe. Matches our shipped carousels.' },
      { value: 'auto', label: 'Auto-rotate (+ pause)', description: 'Auto-advances every 6s with a visible Pause/Play control, pauses on hover/focus, and respects prefers-reduced-motion (WCAG 2.2.2).' },
    ],
    secondaryVariantLabel: 'Height',
    defaultSecondaryVariant: 'standard',
    secondaryVariants: [
      { value: 'standard', label: 'Standard', description: 'The full 380px hero (default).' },
      { value: 'compact', label: 'Compact', description: 'A shorter hero (~260px) with slightly smaller title/description — takes less vertical space.' },
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
    // INERT since 2026-08-25 — nothing reads this. Its only consumer,
    // MembershipMultiSections, was unwired with the `multi` page version
    // (Archive row `membership-multi-page`). Kept so a restore is a re-wire.
    key: 'membership-multi-pills',
    group: 'Membership',
    label: 'Multi-membership filter pills',
    description:
      'What the Profession / State pill rows do on the Membership page\'s "Multiple memberships" version — an open design question, so all three are switchable. Filter + roll-up (default): the pills narrow the membership rows AND the scorecard above recomputes to match, so the total always describes what\'s on screen. Filter only: the pills narrow the rows but the scorecard stays the lifetime all-memberships total. Display only: no filtering — profession and state read as labels on each row and the pill rows are hidden. Variant-only; no effect outside that page version.',
    defaultEnabled: true,
    defaultVariant: 'filter-rollup',
    variants: [
      {
        value: 'filter-rollup',
        label: 'Filter + roll-up',
        description: 'Pills filter the rows and the scorecard recomputes to match the selection.',
      },
      {
        value: 'filter-only',
        label: 'Filter only',
        description: 'Pills filter the rows; the scorecard stays the lifetime total across all memberships.',
      },
      {
        value: 'display-only',
        label: 'Display only',
        description: 'No filtering — the pill rows are hidden and profession / state are just labels on each row.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'membership-sections',
    group: 'Membership',
    label: 'Current Membership + Scorecard',
    description:
      'Splits the Explore Membership summary into two sections directly under the hero: "Current Membership" (the passport-card treatment — tier, plan line, member-since / renews, Manage CTA + auto-renew chip) beside "Membership Scorecard" (a value-realized banner with the payback meter over four metric tiles). OFF (default) is a true no-op — the section renders exactly as it does today (upsell band → quick filter → product sections). Member + non-member; all brands. Concept C from explorations/membership-sections.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'membership-cancel-steps',
    group: 'Membership',
    label: 'Cancellation flow — steps',
    description:
      'How many screens the cancellation flow takes. A SEPARATE axis from `membership-cancel-flow`, which picks the container (modal / page / sheet) — this picks the shape. Stepped (default) is the built flow: retention alternatives, then a review screen listing what happens, then the confirmation. Single screen collapses the first two: the alternatives become stacked full-width rows, and the review content — the five facts and the cancel action — sits underneath them, so cancelling is one click instead of two. Fewer clicks, but the facts a learner should read before ending a membership are no longer a screen of their own, which is the trade being tested. Variant-only (the enable toggle is ignored).',
    defaultEnabled: true,
    defaultVariant: 'stepped',
    variants: [
      {
        value: 'stepped',
        label: 'Stepped',
        description:
          'Alternatives, then a review screen, then the confirmation. The exit is a peer card in the alternatives row and leads to review.',
      },
      {
        value: 'single-screen',
        label: 'Single screen',
        description:
          'Alternatives as stacked full-width rows, with the review facts and the cancel action below them. No intermediate screen.',
      },
    ],
    page: 'dashboard-rebrand',
    extraPages: ['membership'],
  },
  {
    key: 'membership-cancel-flow',
    group: 'Membership',
    label: 'Cancellation flow container',
    description:
      'Where the self-service cancellation flow runs after "Cancel membership" on the Manage Membership sheet. The STEPS and COPY are identical in every arm — retention offers shown all at once and skippable, a review step, then a confirmation with an undo and an optional reason question — so the only thing being compared is the container. In modal (the default) the sheet hands off to a centred dialog: the offers sit side by side as columns, which is what makes them genuinely parallel rather than a queue, while the dialog keeps the flow a clearly bounded thing the learner can close and return from. In page the handoff goes to a full-width region instead — the same columns with more room, but it takes over the whole view. In sheet the 480px panel swaps its own contents step by step: cheapest to build, calmest to read, but the three offers stack, so the learner scrolls to reach the third and by then the first is gone. Variant-only (the enable toggle is ignored). Both non-sheet arms need a host to hand off to and fall back to the sheet arm where there is none. Comparison: explorations/membership-cancellation/cancellation-flow-options.html.',
    defaultEnabled: true,
    defaultVariant: 'modal',
    variants: [
      {
        value: 'modal',
        label: 'Modal',
        description:
          'Cancel hands off to a centred dialog. Offers render as columns — all visible at once, terms inline — inside a bounded overlay the learner can close.',
      },
      {
        value: 'sheet',
        label: 'In sheet',
        description:
          'The flow runs inside the Manage Membership panel, stepping in place with a back link. Offers stack.',
      },
      {
        value: 'page',
        label: 'Full page',
        description:
          'Cancel hands off to a full-width region. Offers render as columns — all visible at once, terms inline, no scrolling between them.',
      },
    ],
    page: 'dashboard-rebrand',
    // Also surfaces under the Membership page card — the sheet it governs opens
    // from every membership card's footer CTA on `/membership` too.
    extraPages: ['membership'],
  },
  {
    key: 'membership-compare-view',
    label: 'Plan comparison view',
    description:
      'How the Membership page renders "Compare your Membership Options" — a feature-matrix Table (default) or the stacked plan Cards. Applies to both the CRE (Plus/Pro/Premier) and Elite (Passport Lite/Passport) non-member comparisons. Variant-only (the enable toggle is ignored).',
    defaultEnabled: true,
    // Default: the feature-matrix table.
    defaultVariant: 'table',
    variants: [
      {
        value: 'table',
        label: 'Table',
        description:
          'The "What\'s Included" feature matrix — plans across the top, features down the side.',
      },
      {
        value: 'cards',
        label: 'Cards',
        description: 'The stacked plan cards, each with its own price + benefit bullets.',
      },
    ],
    // Its own "Membership" page card in the panel (kept in REBRAND_FLAGS so it
    // surfaces on /dashboard-rebrand, where the standalone Membership section lives).
    page: 'membership',
  },
  {
    key: 'aimt-band-style',
    label: 'AI MasterTracks band',
    description:
      'The AI MasterTracks benefit section treatment — a Dark spotlight band (deep-teal, white text, glass feature cards) or a Light version (white card, dark text, teal-accent feature cards). Variant-only (the enable toggle is ignored).',
    defaultEnabled: true,
    // Default: the dark spotlight band.
    defaultVariant: 'dark',
    variants: [
      {
        value: 'dark',
        label: 'Dark band',
        description: 'Deep-teal spotlight band — white text, amber accents, glass feature cards.',
      },
      {
        value: 'light',
        label: 'Light',
        description: 'White card — dark text, teal accents, bordered feature cards.',
      },
    ],
    page: 'membership',
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
    key: 'partner-offers-featured',
    group: 'Widgets',
    label: 'Featured Offers',
    description:
      'Add a "Featured Offers" band to the top of the Partner Offers page — a wide hero card + a row of smaller cards (demo data) — and drop the brand\'s regular offers under an "Additional Offerings" subheading. Off (default) renders every offer in one flat grid with no subheadings.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'benefits-cta-style',
    group: 'Membership Benefits',
    label: 'Benefit CTAs (non-member)',
    description:
      'CTA style on the non-member "Membership Benefits" tab heroes. Default shows "Learn more" (deep-links into the benefit) + "Become a member"; single collapses to just "Become a member".',
    defaultEnabled: true,
    defaultVariant: 'learn-more',
    variants: [
      {
        value: 'learn-more',
        label: 'Learn more + Become a member',
        description: 'Two CTAs — "Learn more" deep-links to the benefit page; "Become a member" anchors to the plans.',
      },
      {
        value: 'join-only',
        label: 'Become a member only',
        description: 'A single "Become a member" CTA per hero (anchors to the plans).',
      },
    ],
    page: 'membership',
  },
  {
    key: 'benefits-plans-layout',
    group: 'Membership Benefits',
    label: 'Plan block (non-member)',
    description:
      'Which plan block the non-member "Membership Benefits" tab renders below the heroes. Default is the Elite-native Passport vs. Passport Lite comparison; strip uses the generic 3-up plan-tier strip.',
    defaultEnabled: true,
    defaultVariant: 'comparison',
    variants: [
      {
        value: 'comparison',
        label: 'Passport comparison',
        description: 'Passport vs. Passport Lite two-column comparison (PassportPlanComparison).',
      },
      {
        value: 'strip',
        label: 'Plan-tier strip',
        description: 'The generic 3-up PlanTierStrip used elsewhere on the non-member page.',
      },
    ],
    page: 'membership',
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
  const saveAsDefault = useCallback(
    (keys: string[]) => {
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
    [flags],
  )

  // Clear all saved custom defaults and snap every flag back to the
  // catalog (factory) defaults.
  const restoreOriginals = useCallback(() => {
    setCustomDefaults({})
    const fresh: Record<string, FeatureFlagState> = {}
    for (const def of FEATURE_FLAGS) {
      fresh[def.key] = catalogDefault(def)
    }
    setFlags(fresh)
  }, [])

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
