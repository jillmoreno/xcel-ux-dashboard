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
import { isTestingGateway } from '@/data/gatewayMode'
/* ⚠ A VALUE IMPORT, AND IT DOES NOT CYCLE. `dashboardVersions` imports from
   this file too, but `import type { DesignerId }` only — erased at compile, so
   there is no runtime edge back. Keep that import type-only or this becomes a
   real cycle. */
import { versionInScope } from '@/data/dashboardVersions'
import { ATLAS_PROGRESS_LADDER } from '@/components/compass/atlasProgressLadder'
import {
  COURSE_FLAG_KEY,
  EXPIRY_FLAG_KEY,
  chosenCourse,
  chosenExpiryDays,
  resolveExpiry,
  type ExpirySelection,
  coursePathIdFor,
  courseStateFor,
  isRegulatedCourse,
  resolveSelection,
  type CourseId,
  type CourseSelection,
} from '@/data/courseFixtures'

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
/* `Maturity` (`wip` | `ready`) STOOD HERE from 2026-09-24 to 2026-10-15 — the
 * demo site's only gate: a flag, a variant or a demo-bar control reached the
 * stakeholder site only once marked `ready`, and absent meant `wip`. The demo
 * site is retired (see `gatewayMode.ts`) and the field went with it: a
 * readiness mark that gates nothing is one a reader trusts and is misled by.
 * The `archivedItems.ts` row says how it was wired. */

export type FeatureFlagVariant = {
  /** Stable identifier stored to localStorage / passed to consumers. */
  value: string
  /** Human label shown in the panel segmented control. */
  label: string
  /** Optional short description shown under the variant label when the
   *  variant is selected. Helps reviewers understand what changes. */
  description?: string
  /**
   * A SECOND, QUIETER LINE under `description` in a dropdown row —
   * 2026-10-16, for Anjani's nudge menu, where each row is a title over a
   * sub-line ("Gone quiet, progress stalled" / "batch · one per pacing
   * window"). The sub-line is a RULE about when the nudge may fire, not a
   * restatement of the title, which is why it needs its own line rather
   * than being folded into one.
   */
  detail?: string
  /**
   * What the row's badge shows, when that is not the `label` — 2026-10-16.
   * Her Clear row is marked "×" while the control's own pill has to keep
   * reading "None", because a pill reading "NUDGE ×" says nothing. Only set
   * it where the two genuinely differ.
   */
  badge?: string
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
  /** Which designer's exploration this belongs to. Absent means Jill — see
   *  `DesignerId`. Read it through `flagOwner()`, never directly, or the
   *  default lives in two places. */
  owner?: DesignerId
  /**
   * SURFACE IT ON THE DESIGN CONTROLS BAR — 2026-10-05, the direct ask for a
   * second bar: "fonts, brand colors, and things specifically related to design
   * decisions that have nothing to do with the stakeholders".
   *
   * ⚠ IT IS A PLACE, NOT A PERMISSION, and the distinction is the whole reason
   * the two bars exist. The DEMO bar shows stakeholders how the product behaves
   * for different learners — progress, tier, education. The DESIGN bar shows a
   * designer the decisions still open in their own exploration. A flag with no
   * `surface` is neither; it lives in the Feature Flag panel and nowhere else,
   * which is where the great majority belong.
   *
   * ⚠ THIS IS THE SANCTIONED WAY TO GET A CONTROL ON A BAR. `DemoControlsBar`
   * is protected precisely so nobody adds one by editing it; adding `surface`
   * to a flag you already own does the same job without touching shared chrome.
   */
  surface?: 'design'
  /**
   * Which dashboard VERSIONS this design control belongs to.
   *
   * ⚠ ABSENT FALLS BACK TO THE OWNER, not to "everywhere". A design flag with
   * no `versions` shows on every version its OWNER owns — which is right for
   * the common case (one designer, one exploration) and keeps the field
   * optional. Name versions explicitly when a designer has two and a control
   * belongs to only one of them.
   *
   * ⚠ MEANINGLESS WITHOUT `surface: 'design'`. The Feature Flag panel scopes by
   * the version's OWNER, not by this; only the Design bar reads it.
   */
  versions?: string[]
  /**
   * WHICH SURFACES THE CONTROL BELONGS ON — 2026-10-16. Ids from
   * `DesignSurfaceContext` (`compass:course`, `compass:study-planner`, …).
   *
   * ⚠ A SECOND FILTER AFTER `versions`, not a replacement. `versions` says
   * whose BAR carries a control; this says WHERE ON THAT BAR'S PRODUCT it is
   * worth showing. Anjani has two prototypes with two control sets — the
   * planner's four arms and the nudge journey's panel — and before this every
   * one of them sat on every page, including Eric's Home, which renders no
   * Compass at all.
   *
   * ⚠ OMIT IT AND NOTHING CHANGES. A flag with no `surfaces` shows wherever
   * `versions` already put it, which is what every control did before this
   * field existed.
   */
  surfaces?: string[]
  /**
   * A note under a dropdown's options, in the panel — 2026-10-16. Anjani's
   * nudge menu ends with one, and it is load-bearing: it says these three
   * are batch nudges that never fire inside a lesson, which is the rule a
   * reviewer needs in order to read the three options correctly.
   */
  panelNote?: string
  /**
   * OPEN AS A SHEET, NOT A DROPDOWN — 2026-10-27, Jillienne on the Invite
   * flow menu: "trigger this as sheet view where we can see all the options
   * better, there will likely be more added."
   *
   * The design bar picks a control's shape from its count — a few options
   * are a segmented group, more are a dropdown. A dropdown holds four or
   * five one-line rows well and six two-line ones badly: the Invite flow
   * menu ran past the bottom of the checkout it sits over. This says the
   * list is long enough, or its rows wordy enough, to deserve the versions
   * sheet's room instead — a trigger on the bar as before, opening a panel
   * at the side with one card per option, the description in full and the
   * default marked. The sheet takes any number of rows, which is the point.
   *
   * Only `variants` controls read it; an on/off switch has nothing to list.
   */
  picker?: 'sheet'
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

/**
 * WHOSE EXPLORATION A FLAG BELONGS TO — 2026-10-05, the direct ask: "there are
 * 2 designers working in this project… 2 filter tabs at the top, Jill and Eric".
 *
 * ⚠ IT IS A PERSON, NOT A SUBJECT, and that is the distinction to hold. `group`
 * already says WHERE a flag acts (Navigation, Widgets); two designers working
 * the same surfaces would be split by subject and called people, which is why
 * the owner is its own axis rather than being derived from the group.
 *
 * ⚠ ABSENT MEANS JILL, deliberately: every flag in the catalog today is hers,
 * so this change touches NO existing row and Eric's tab is empty by
 * construction rather than by a list someone has to maintain. The cost is that
 * a new flag with no `owner` quietly becomes Jill's — right while she is the
 * one authoring them, and the thing to revisit the day that stops being true.
 *
 * ⚠ IT IS A FILTER, NOT A PERMISSION. Both designers see both tabs and can flip
 * anything in either. Nothing here gates who may change what.
 */
export type DesignerId = 'jill' | 'eric' | 'anjani'

/** The tab strip's order and labels. The FIRST entry is the default selection,
 *  so reordering this changes which tab the panel opens on.
 *
 * ⚠ `anjani` ADDED 2026-10-15 — labeling only. She owns the Compass scope
 * (`PROTOTYPE_SCOPES`) and now owns her seven Compass flags below, but she
 * owns no dashboard VERSION, so her tab in the Dashboard Versions sheet is
 * expected to render empty — that's accurate, not broken; see
 * `DashboardVersionsPanel`'s owner filter. It does not change what the
 * Feature Flag panel shows: that filters by the ACTIVE VERSION's owner, which
 * for her flags is still reached through their own `versions` arrays
 * (`designControlsFor`), not through this id. */
export const FLAG_DESIGNERS: { id: DesignerId; label: string }[] = [
  { id: 'jill', label: 'Jill' },
  { id: 'eric', label: 'Eric' },
  { id: 'anjani', label: 'Anjani' },
]

/** A flag's (or a version's) owner, resolving the absent case in ONE place so
 *  no call site repeats `?? 'jill'` — the shape that lets two readers of the
 *  same catalog disagree about who owns a row. */
/**
 * THE DESIGN CONTROLS FOR ONE DASHBOARD VERSION — what the Design bar draws.
 *
 * ⚠ VERSION-SCOPED, NOT DESIGNER-SCOPED, which was the explicit choice
 * (2026-10-05). Switch to Eric's Atlas version and his font and brand controls
 * appear; switch to Testing 3 and they are replaced by its own. The app has no
 * notion of WHO is looking — there is no sign-in — so the version is the only
 * honest handle, and it is also the thing a designer is actually working on.
 *
 * ⚠ THE `versions` FALLBACK IS THE OWNER, so a design flag that names no
 * versions follows its author to every version they own. Without that default,
 * every new design flag would need a version list before it rendered anywhere,
 * and the first one a designer added would silently do nothing.
 *
 * ⚠ IT RETURNS FLAGS, NOT CONTROLS. The bar renders whatever shape each flag
 * declares — a radiogroup for `variants`, a toggle otherwise — so adding a
 * design control is adding a flag and nothing else. That is the point: the bar
 * itself is protected chrome that nobody needs to edit.
 */
export function designControlsFor(
  versionId: string,
  versionOwner: DesignerId,
  /* The surface on screen (`DesignSurfaceContext`), or null off a declared
     one — Home, the learning pages, anywhere that has not said what it is. */
  surface?: string | null,
): FeatureFlagDefinition[] {
  return FEATURE_FLAGS.filter((def) => {
    if (def.surface !== 'design') return false
    /* ⚠ A DECLARED SURFACE IS EXCLUSIVE IN BOTH DIRECTIONS — 2026-10-16,
       second pass, and the first one only did half of it.

       ⚠ AND IT IS THE ONLY ROUTE-ISH SCOPE THERE IS, since 2026-10-22. A
       `paths` field lived here for half a day, matching pathname prefixes and
       exclusive in ONE direction: a control naming paths showed on those
       alone, a control naming none showed everywhere. It was added so the
       invite flow's controls would not reach Atlas Home while Brand and Long
       title still reached checkout — and the half it left undone is exactly
       what Jillienne asked for next: "these design controls should not show
       when the Start is set to Invite & Checkout, they should display for
       Atlas." Two mechanisms with different exclusivity is one more than the
       catalog can explain, so the invite flow became a SURFACE
       (`InviteSurfaceSync` declares it from the route) and `paths` went.

       It used to be: a control that NAMES surfaces appears on those alone.
       That stopped the planner's arms riding along on Home, but it left the
       other half untouched — every control naming NO surface still appeared
       on Compass, so Anjani's pages carried Eric's Brand, Long title, Page
       and Progress. Compass renders inside HIS version (the Compass row opens
       `?section=compass` with no `?version=`, so it resolves to the default,
       which is the End-to-End Demo), and the bar was faithfully reporting
       that — which is exactly the thing that is not useful on her pages.
       Jillienne, 2026-10-16: "this is assuming erics feature flag, and its
       not, it should be on Anjanis, and the extra ones that are just for eric
       should not be showing."
       
       So now: ON a declared surface, only controls that name it. OFF one,
       only controls that name none. A surface is a room, not a tag — what is
       in it is what belongs to it. */
    const named = def.surfaces != null && def.surfaces.length > 0
    if (surface ? !(named && def.surfaces!.includes(surface)) : named) return false
    /* ⚠ THE VERSION STILL HAS TO AGREE, on a surface as much as off one. A
       surface narrows WHERE a control shows; it does not hand it a pass into
       a version it was never written for — Compass draws differently on the
       Atlas arm, and her controls say so in their own `versions`. */
    /* ⚠ A COPY OF A VERSION CARRIES ITS CONTROLS — 2026-10-20, with
       Jill/Atlas-Main. Twenty-six controls name `eric-atlas-e2e` in their own
       `versions`, and a duplicate of that version that did not answer to them
       would open with an EMPTY design bar — every control the Home was built
       against missing, silently, with the flags still at their defaults so the
       page LOOKED right and could not be adjusted. Asking the family rather
       than the literal id also means a control Eric scopes to the demo
       tomorrow reaches the copy without a second edit. The copy still wins its
       own name: a control written for `jill-atlas-main` alone matches on the
       first test and never reaches the demo. */
    if (def.versions && def.versions.length > 0) return versionInScope(def.versions, versionId)
    return flagOwner(def) === versionOwner
  })
}

export function flagOwner(def: { owner?: DesignerId }): DesignerId {
  return def.owner ?? 'jill'
}

export type FeatureFlagPageId =
  | 'dashboard'
  | 'dashboard-rebrand'
  | 'onboarding-flow'
  | 'membership'
  | 'my-courses'
  | 'learning-resources'
  | 'my-podcasts'
  | 'certificates'

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
  /* ⚠ SEVEN ROWS ARCHIVED 2026-09-28 — Learning Path, Browse Catalog,
     Recommended for You, Resource Library, Exam & Cert Prep, Rubi Insights and
     Podcasts. Their flags went WITH their rail rows, which is the order that
     matters: `useNavSectionVisible` returns TRUE for a section with no flag, so
     deleting a flag on its own would have turned six hidden rows permanently
     ON. See `rail-rows-2026-09-28` in archivedItems.ts.

     This reverses the reasoning recorded at Browse Catalog — that they were
     hidden via flag "rather than by deleting the row" so a reviewer could
     restore one without a code change. Jillienne's call, 2026-09-28: not coming
     back to these. The restore note carries what the flag used to buy. */

  // My Learning
  { section: 'study-plan', label: 'Study Plan' },
  { section: 'readiness', label: 'Readiness' },
  { section: 'courses', label: 'My Courses' },
  { section: 'certificates', label: 'Certificates' },
  { section: 'resources', label: 'Resources' },
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
    /* ⚠ KEPT 2026-10-05 WHEN THE OTHER SEVEN WENT, and re-filed here from the
       retired `learning-path` page. It was on the list to retire and should not
       have been: its readers are `learningPathsCountVariant.ts`, which
       `PlatformShell`, `MembershipOverview` and `LearnerOverviewPanel` all
       import — so it reaches the live dashboard, not a standalone LMS page.

       ⚠ AND IT IS THE WHOLE POINT OF A PERSONA. "Multiple learning paths" (#9
       in `demoControlsUtil`) is an expander whose sub-menu picks this flag's
       variant; retiring the flag would have left that menu rendering and doing
       nothing. Retiring it properly means retiring the persona's
       `pathCountOptions` with it — a product decision, not a cleanup. */
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
  },
  {
    key: 'exam-date-single-store',
    /* ONE EXAM DATE INSTEAD OF TWO — 2026-10-20.
       OFF restores the behaviour this branch found: the Study Calendar keeps
       its own `calendar.examDate` in component state (seeded from fixtures,
       reset on unmount) while the Schedule State Exam widget writes
       `cgp.examDate`, and neither reaches the other. ON makes the store the
       single truth for both, and lets the calendar's exam TIME persist for the
       first time (`cgp.examTime`).
       Default ON on this branch so the branch build shows the unified
       behaviour; whether it becomes the Prototypes baseline is Jillienne's
       call at merge, via `promote-to-prototype`.
       ⚠ Unifies the DATE, not the countdown — the two surfaces still measure
       from different todays. See `useExamCalendarOverlay`. */
    label: 'One exam date',
    description:
      'Makes the stored exam date (`cgp.examDate`) the single source for BOTH the Study Calendar and the Schedule State Exam widget, so editing in either moves the countdown, the Pacing tile\u2019s required rate and the course header band together. The calendar\u2019s exam time persists too. Off: each surface keeps its own date, as before \u2014 editing in the calendar moves nothing outside it.',
    defaultEnabled: true,
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
  /* ⚠ `exam-step-style` WAS HERE and was retired on 2026-09-29 — see the
     `exam-step-style-alternatives` row in `archivedItems.ts`. Its `ask-first`
     arm won and now renders unconditionally, so the flag had one option left
     and a picker with one option is a label. The two losing treatments are
     unwired, not deleted; the Archive row carries the re-wire. */
  {
    key: 'journey-quick-links',
    group: 'Widgets',
    label: 'Journey — quick links',
    description:
      'Where the journey column\u2019s SHEET LINKS live. ON (the default) collects them into a Quick links card under the last step \u2014 Exam Information, How to Get Your License, State Requirements \u2014 and HIDES the per-card ones: \u201cExam Details\u201d on the exam card, \u201cWhat to expect\u201d on Pass State Exam, \u201cHow to apply\u201d on Get Licensed. Off puts each link back on the card it belongs to and removes the Quick links card. \u26a0 IT IS ONE DECISION, NOT TWO, which is why one flag drives both halves: the question is whether these sheets are read as part of the step you are on or looked up when you want them, and running both at once would put every destination on the page twice. \u26a0 THE SHEETS AND THEIR DESTINATIONS ARE IDENTICAL EITHER WAY \u2014 only the way in moves, so what is being compared is findability and nothing else. \u26a0 IT MOVES WHAT A USER TEST CAN RIG: on the default, `home.schedule-exam`, `home.what-to-expect` and `home.how-to-apply` do not render, and the three quick-link ids do. `CtaTest`\u2019s unconditional list follows the default, and `promote-to-testing` freezes a SHA, so a session sheet cut from an older build still names the controls that build had.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'exam-card-background',
    group: 'Widgets',
    label: 'Exam card — background',
    description:
      'The GROUND the `ask-first` exam card sits on. `white` is the default and is what ships \u2014 the card carries no background of its own, so it takes `--color-surface-card` like every other widget in the column. `tint` fills it with the SELECTED RAIL ITEM\u2019s colour, which is what makes the pair worth comparing: that colour already means \u201cthis is where you are\u201d in this product, so putting it behind the exam card says the card is the live one rather than merely another widget. `outline` is the third answer and the only one that is not a fill \u2014 no ground, a hairline border, and NO SHADOW, because an elevation under a transparent card is a shadow cast by nothing. \u26a0 THE TINT IS BOUND TO THE RAIL\u2019S OWN TOKEN, not a copied hex \u2014 `color-mix(in srgb, var(--color-nav-icon-active-primary) 12%, \u2026)`, so the two cannot drift apart if the rail\u2019s colour is ever retuned. The STRENGTH is deliberately half the rail\u2019s 24%: the two do the same job at very different sizes, and what reads as a selection on a 40px nav row reads as a coloured panel across a whole card. It composites over `--color-surface-card` rather than `transparent` (which is what the rail does) because the card has its own white ground and the page behind it is grey \u2014 mixing to transparent would let that grey through and land a different colour from the rail it is quoting. Variant-only.',
    defaultEnabled: true,
    /* ⚠ STAYS `white`, AND THE ATTEMPT TO PROMOTE `outline` IS THE NOTE.
       2026-10-08: the pacing fork became the baseline and its side column is
       drawn as outlined cards, so `outline` looked like the obvious promotion.
       It is not — this flag has NO `versions` scope, so flipping its default
       gives EVERY version a bordered exam card, and `Testing3Version.test.tsx`
       says exactly what that costs: "a border added to the SHARED shell would
       silently reverse their own 2026-09-21 'remove stroke' ask" for Testing,
       Testing 2 and Testing 3.

       So the pacing version gets its outline BY CONSTRUCTION instead — it hands
       `ExamScheduleWidget` its own `SIDE_CARD` shell without the lifted
       override, the same bordered-and-unfilled shell its Quick Links card uses.
       The version's own column decides how the version's own column looks; the
       flag stays what it was, the axis for comparing a ground across versions. */
    defaultVariant: 'white',
    variants: [
      { value: 'white', label: 'White (no background)' },
      { value: 'tint', label: 'Light blue — the selected-rail wash' },
      /* ⚠ `outline` ADDED 2026-10-07, the direct ask. The third answer to the
         same question and the only one that is not a FILL: no ground at all, a
         hairline instead, so the card reads as an outlined region of the page
         rather than a panel sitting on it. ⚠ IT ALSO DROPS THE SHADOW, which
         is not decoration — an elevation under a transparent card is a shadow
         cast by nothing, and it is the giveaway that makes an outline-only
         treatment look broken. Additive: `white` is still the default, so no
         version moves until someone picks this. */
      { value: 'outline', label: 'Outline only — no fill' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'exam-calendar-style',
    group: 'Widgets',
    label: 'Exam calendar — treatment',
    description:
      'How the in-card month picker is DRAWN, on the `ask-first` exam card. Raised 2026-09-29 from a review note that the picker \u201cfeels a little muted and minimalistic-looking\u201d \u2014 a judgement about PRESENCE, which is not one dial, so the three arms each turn a different one up rather than being three steps along one slider. `minimal` is the control and is byte-for-byte what shipped: a hairline box on the page ground, 22px nav, 11.5px numerals, recessive because it is a field rather than a feature. `framed` gives the same calendar ROOM and a surface \u2014 a raised card, a rule under the month, square day cells about half again as large, a real hover \u2014 arguing the picker was thin rather than wrong. `branded` draws it as an OBJECT: a navy cap across the top carrying the month in white, round day cells, the selected day a filled navy disc. \u26a0 `branded` IS THE SAVED STATE\u2019S TEAR-OFF, EARLIER \u2014 the readout you get after saving is a navy-capped calendar, so this makes the thing you pick from and the thing you end up with visibly one object; the cost is that it becomes the loudest element on a card whose job is to ask a one-line question. \u26a0 SKINS ONLY: every arm renders the same grid from the same cells with the same disabled / today / selected logic, so the comparison is the drawing and nothing else. Only affects `exam-step-style: ask-first`; the other two arms have their own pickers. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'framed',
    variants: [
      { value: 'minimal', label: 'Minimal (shipped)' },
      { value: 'framed', label: 'Framed — room and a surface' },
      { value: 'branded', label: 'Branded — navy cap, round days' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'journey-step-order',
    group: 'Widgets',
    label: 'Journey step order',
    description:
      'Which step the right-hand journey column opens with. `coursework-first` (default) is what ships \u2014 Complete Coursework as Step 1, then Schedule State Exam, Pass State Exam and Get Licensed. `exam-first` promotes SCHEDULE STATE EXAM to Step 1 and drops Coursework to Step 2, on the argument that booking the exam is the thing a learner can do today and the one that dates everything else \u2014 the Study Pace tile already derives its plan from the exam date. ⚠ THE NUMBERS MOVE WITH THE CARDS: the eyebrows renumber so the column still reads 1-2-3-4 top to bottom. Four cards cannot draw a continuous spine, so the numbering IS the sequence; an order change that left the numbers behind would read as four unrelated things. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'exam-first',
    variants: [
      { value: 'coursework-first', label: 'Coursework first' },
      { value: 'exam-first', label: 'Schedule exam first' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'study-pace-hidden',
    group: 'Widgets',
    label: 'Study Pace — hide',
    description:
      'Removes the Study Pace tile from the home screen. OFF by default, so the shipped dashboard is unchanged; turn it on to see the page without it. ⚠ NOT THE SAME AS `study-pace-widget`, which swaps the live tile for the lo-fi PLACEHOLDER — that one changes what the tile shows, this one removes it. On the Testing version the tile owns the whole row, so the row goes with it; on every other version Readiness stays and takes the full width. Both behaviours are the ones a completed course already produces, reused rather than re-derived.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'nav-rail-icons',
    group: 'Widgets',
    label: 'Rail icons',
    description:
      'Whether the primary rail\u2019s items carry an icon, and how big. `standard` (default) is what ships \u2014 17px beside the label. `small` keeps them at 14px, so the label leads and the glyph reads as a marker rather than a peer. `none` drops them entirely and the labels left-align against the row padding, which is what a rail of four short words arguably wants. ⚠ THE COLLAPSED RAIL IS UNAFFECTED by all three: it steps its glyph to 20px and sets 10px text under it, and an unlabelled OR unglyphed collapsed rail is the thing every nav study finds people mis-click. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'small',
    variants: [
      { value: 'standard', label: 'Standard (17px)' },
      { value: 'small', label: 'Small (14px)' },
      { value: 'none', label: 'No icons (left-aligned)' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'nav-rail-captions',
    group: 'Widgets',
    label: 'Rail group captions',
    description:
      'Whether the primary rail shows its group captions \u2014 MY LEARNING, EXPLORE, SUPPORT. On by default, as shipped. Off removes the uppercase headings and lets the items run as one list, which suits a short rail where the captions are most of the ink. ⚠ THE GROUPS KEEP THEIR ACCESSIBLE NAMES either way: with the caption hidden the `<ul>` carries it as `aria-label`, so a screen reader still hears "My Learning" and "Support" as the groups they are. Hiding the name with the text would make this an accessibility regression rather than a layout change \u2014 the same rule the collapsed rail already follows.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'nav-rail-surface',
    group: 'Navigation',
    label: 'Left nav background',
    description:
      'Whether the left rail paints its own surface ON HOME. `filled` (default) is what ships \u2014 the rail sits on `--color-nav-surface`, a panel beside the content. `none` drops that fill so the rail sits directly on the page, and the column reads as part of the page rather than as a docked panel. \u26a0 HOME ONLY, deliberately: it is the one screen where the rail stands beside a full layout rather than a single body, so it is where the panel edge is doing the least work. Every other section keeps the surface under both settings. `none-aligned` does the same and also drops the rows 16px, so the first nav item\u2019s top edge meets the top of the content\u2019s first card instead of floating above it \u2014 16 is the measured difference, not a nudge. \u26a0 THE RIGHT BORDER IS ALREADY TRANSPARENT in every mode (see the rail column in `PlatformShell`), so dropping the fill leaves no seam behind \u2014 nothing else has to change for this to read.',
    defaultEnabled: true,
    defaultVariant: 'filled',
    variants: [
      { value: 'filled', label: 'Filled (as shipped)' },
      { value: 'none', label: 'None \u2014 page background' },
      { value: 'none-aligned', label: 'None \u2014 dropped to the content' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'nav-placement',
    group: 'Navigation',
    label: 'Nav placement',
    description:
      'WHERE THE PRIMARY NAVIGATION LIVES \u2014 one axis, two answers. **`left`**: the rail carries the destinations, as it ships, plus a Compass Learning row so both arms offer the same places. **`top`**: a row in the header carries Home \u00b7 Compass Learning (Figma 765:3801), the shell drops the rail column and the content runs full width \u2014 and everything the rail used to hold is RE-HOMED rather than dropped: My Courses and Certificates become tile buttons above the Quick Question card on Home, and Help gets a control of its own (see `nav-help`). \u26a0 THE TWO ARE EXCLUSIVE as of 2026-10-01, and that is the restructure. The old `hybrid` drew the header AND the rail, so Home lit up in two navigations at once; if the header is the navigation there is no rail for it to disagree with. \u26a0 THE GREETING IS NOT PART OF THIS CHOICE any more \u2014 the Home page header (\u201cWelcome to your learning experience, Jordan\u201d + \u201cHome\u201d) renders under BOTH, so switching arms compares navigation and nothing else. \u26a0 `hybrid` AND `hybrid-tabs` ARE OFF THE PICKER, NOT GONE: both still resolve from `?ff=nav-placement:hybrid` so the new shape can be held against what it replaces while the decision is open. Nothing new is built on them. Turning the flag OFF resolves to `left` AND drops the exploration\u2019s own additions (the Compass row, the greeting), so off is the shipped product rather than a half-migrated one.',
    defaultEnabled: true,
    /* ⚠ `top` IS THE BRANCH DEFAULT as of 2026-10-01 — it was `hybrid`, which is
       no longer on the picker. The whole of this pass is the top-nav arm (the
       tiles, the two Help placements, the sheet), so it is what the branch build
       should open on; `left` is one click away on the bar and is the honest
       control to compare it against. Still a BRANCH default:
       `promote-to-prototype` decides what, if anything, becomes the baseline. */
    defaultVariant: 'top',
    /* ⚠ EVERY ARM STATES `ready` ON ITSELF, 2026-10-05, AND IT HAS TO.
       `variantsForDemo` drops any arm whose maturity resolves to `wip`, and an
       absent one INHERITS THE FLAG'S — which is `wip` here, deliberately, so
       the demo bar's Navigation control rendered with an empty picker: the
       pill opened, the radiogroup was there, and it had nothing in it. Nothing
       failed. No test opens the dropdown, so the suite was green and the
       defect was visible only by clicking the control.

       The flag staying `wip` while its arms are `ready` is the honest reading:
       the EXPLORATION is undecided (that is the flag), but each treatment is
       finished enough for a stakeholder to look at (that is the arms). */
    variants: [
      { value: 'left', label: 'Left nav' },
      { value: 'top', label: 'Top nav' },
      /* ⚠ ERIC'S THIRD ARM, FOLDED IN 2026-10-05. It was `?nav=expanding-top-nav`
         on a parallel axis of its own; see `navPlacement.ts` for why there is
         one axis now. The label names Atlas because that is where it LOOKS
         different — off the Atlas versions it resolves like `top` rather than
         doing nothing, so it is never a dead option. */
      { value: 'expanding-top', label: 'Expanding top nav (Atlas)' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'nav-help',
    group: 'Navigation',
    label: 'Help placement (top nav)',
    description:
      'WHERE HELP LIVES WHEN THE TOP NAV IS UP \u2014 2026-10-01. `header-icon` puts a `?` in the header utilities, immediately left of the notifications bell; `profile-menu` puts a Help row in the account dropdown, directly above Logout. \u26a0 BOTH OPEN THE SAME SHEET (`HelpSheet`, the Help & Support panel), which is the entire point of the pair \u2014 the question under test is DISCOVERABILITY versus a tidier header, not two different help experiences. Changing the variant moves one trigger; it never changes what Help is. \u26a0 NO EFFECT UNDER `nav-placement: left`, where the rail\u2019s own Get Help row carries it and a second control would be a duplicate \u2014 the predicate is the rail\u2019s absence, not the top nav\u2019s presence. \u26a0 THE RAIL\u2019S GET HELP STILL OPENS THE SECTION, not this sheet, so the two arms answer Help differently today. That is the ask as given (the sheet was scoped to the top nav) and it is the thing to look at second.',
    defaultEnabled: true,
    defaultVariant: 'header-icon',
    variants: [
      { value: 'header-icon', label: 'Header \u2014 ? icon' },
      { value: 'profile-menu', label: 'Profile dropdown \u2014 above Logout' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'combined-progress-bar',
    group: 'Widgets',
    label: 'Combined course card \u2014 progress bar',
    description:
      'Whether Testing 3\u2019s combined course card draws the 8px progress bar under its title. \u26a0 REVIEWED AND DECLINED 2026-10-05 \u2014 it ships OFF, and the reason is the defect the ON arm carried: THE CARD STATED ITS PROGRESS TWICE, with two numbers that disagreed. The bar fills from the card\u2019s `percent` prop, which is lesson progress (62%); the gauge running down the coursework timeline a few lines below is weighted across the whole journey (37%). One course, two fills of visibly different lengths. The timeline carries the figure AND the \u201cyou are here\u201d marker, so it was the half that could stand alone. \u26a0 THE BAR IS NOT BROKEN AND IS ONE URL AWAY (`?ff=combined-progress-bar:on`) \u2014 if the two measures are ever reconciled, this becomes the live question again: does a bar read faster than a column? No effect outside Testing 3.',
    /* ⚠ OFF IS THE REVIEWED BASELINE, not a flag nobody got to. It was `true`
       on the branch so the bar could be seen beside the gauge; the comparison
       happened and the gauge won. See the description for the argument. */
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'journey-stop-mark',
    group: 'Widgets',
    label: 'Coursework timeline \u2014 unreached stops',
    description:
      'WHAT A STOP THE LEARNER HAS NOT REACHED LOOKS LIKE on Testing 3\u2019s timeline. `circle` (default) is the dashed ring the rail has always drawn, shrunk to 10px under the gauge. `dash` replaces it with a short horizontal tick across the line \u2014 a mark ON the timeline rather than a node hung off it. \u26a0 THE ARGUMENT: a ring is a PLACE, and six places read as six equal claims when five of them are not yet real. A tick reads as a graduation on a scale, which is what the gauge arm has made this \u2014 so the two flags are related, and `dash` is most legible with `journey-scale-style: gauge`. \u26a0 THE DONE AND CURRENT STOPS ARE UNAFFECTED under both: a completed tick and a \u201cyou are here\u201d tick would give up the one distinction the column cannot lose. No effect outside Testing 3.',
    defaultEnabled: true,
    /* ⚠ `dash` IS THE DEFAULT as of 2026-10-02, the direct ask ("make these
       current settings the default"). A diff of the live store against this
       catalog found exactly ONE setting moved away from its default — this one
       — so it is the whole of that change; everything else on Testing 3 was
       already opening the way it was being reviewed. */
    defaultVariant: 'dash',
    variants: [
      { value: 'dash', label: 'Tick on the line' },
      { value: 'circle', label: 'Dashed ring (as drawn)' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'journey-scale-style',
    group: 'Widgets',
    label: 'Coursework timeline \u2014 how 0/100 is shown',
    description:
      'FOUR WAYS TO PUT A PERCENTAGE ON Testing 3\u2019s vertical coursework timeline. **`gauge`** (default) turns the spine itself into one continuous track filled to the figure, with 0 at its top, 100 at its foot and the figure at the fill boundary; the stop nodes ride on it. **`axis`** is the first attempt: the per-stop spine kept, with 0 and 100 as digits bracketing the list and the figure beside the progress caret. **`chip`** drops 0 and 100 entirely and puts the figure as a small pill on the stop the learner is on. **`header`** lifts the whole scale out of the column into one horizontal track under \u201cComplete Coursework\u201d, leaving the timeline a plain list. \u26a0 THE TENSION THEY ANSWER DIFFERENTLY: the rows are spaced by their CONTENT\u2019s height, not by how much work each stop is \u2014 so a figure placed next to the current stop is in the right place but not at the right HEIGHT, and a figure placed at its true height sits beside a stop the learner has not reached. `axis` and `chip` choose position; `gauge` and `header` choose proportion. \u26a0 ALL FOUR STATE THE SAME NUMBER, and the nodes still say which stop is live under every one, so none of them loses \u201cwhere am I\u201d. No effect outside Testing 3.',
    defaultEnabled: true,
    /* ⚠ `gauge` OPENS, not `axis`. The ask that started this was that the axis
       "is not doing great" — so the arm that answers its actual defect
       (a scale whose marks are not proportional) is the one to look at first.
       The other three are one click away and nothing is decided. */
    defaultVariant: 'gauge',
    variants: [
      { value: 'gauge', label: 'Gauge \u2014 the spine IS the scale' },
      { value: 'axis', label: 'Axis \u2014 0/100 bracketing the list' },
      { value: 'chip', label: 'Chip \u2014 the figure on the live stop' },
      { value: 'header', label: 'Header \u2014 a horizontal scale above' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'home-tile-style',
    group: 'Widgets',
    label: 'Right rail \u2014 tile shape',
    description:
      'HOW THE RIGHT RAIL\u2019S SIX DESTINATIONS ARE DRAWN on Testing 3. `square` (default) is the grid two across \u2014 icon over label, each tile a true square by `aspect-ratio`. `stacked` is one column of long horizontal buttons, icon left of the label. \u26a0 THE SAME SIX, THE SAME ORDER, THE SAME CTA IDS \u2014 only the shape changes, which is what makes the two comparable. \u26a0 THE TRADE IS HEIGHT AGAINST PRESENCE: six squares two-across is a tall block that gives each destination a face, where six rows read as a menu and take about half the room. \u26a0 Both arms wear `.cre-tile-cta`, so the outline-at-rest and fill-on-hover treatment is identical and the comparison is about layout alone. No effect outside Testing 3, which is the only version drawing this grid.',
    defaultEnabled: true,
    /* ⚠ `stacked` IS THE DEFAULT as of 2026-10-02, the direct ask. It was
       `square` for a day — the shape the rail was built as, kept while the
       alternative was new ("keep the tiles as default, but add a variant",
       2026-10-01). Having seen both in the rail, the rows win: six squares
       two-across is a tall block that pushed the exam card and the readiness
       slot well above the fold, and these six are destinations rather than
       things to dwell on. `square` stays one click away on the bar. */
    defaultVariant: 'stacked',
    variants: [
      { value: 'stacked', label: 'Long buttons, stacked' },
      { value: 'square', label: 'Square tiles, two across' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'exam-card-placement',
    group: 'Widgets',
    label: 'Quick question \u2014 where the exam card sits',
    description:
      'WHICH COLUMN THE EXAM-DATE CARD LIVES IN. `under-course` (default) puts it in the LEFT column, directly below the Current course card and at that card\u2019s full width \u2014 the same slot Option 4\u2019s tab strip hangs off, which is the only place "under the current course card" stays true. `journey-column` is where it shipped: the first card of the right-hand Study Journey column, promoted above the coursework card by `journey-step-order: exam-first`. \u26a0 IT MOVES THE CARD, IT DOES NOT COPY IT \u2014 `StudyJourneyWidget` drops the card from BOTH of its own call sites (the promoted slot and the licensing list) when this is `under-course`, or the learner would be asked the same question twice on one screen. \u26a0 THE NUMBERING IS UNAFFECTED either way, because the card already consumed no step number: it asks a question rather than naming a step, so the three licensing cards are numbered by a running count that skips it. \u26a0 WHAT THE MOVE COSTS: in the journey column the card sat in a sequence that explained it \u2014 Step 1 coursework, Step 2 exam. Under the course card it stands alone, so the question has to carry itself. That is the thing to judge.',
    defaultEnabled: true,
    /* ⚠ REVIEWED AND DECLINED, 2026-10-05 (`promote-to-prototype`). It was the
       BRANCH default at `under-course` — 2026-10-01, the direct ask ("set it as
       the default") — and that line used to say this skill would decide. It
       has: the baseline goes back to `journey-column`, the arm that ships.

       THE ARGUMENT, so a later reader can tell whether it still holds: in the
       journey column the card sits in a sequence that explains it — Step 1
       coursework, Step 2 exam — and under the course card it stands alone, so
       the question has to carry itself. That cost was recorded when the flag
       landed and it is what the decision turned on.

       ⚠ IT WAS NEVER TESTING 3'S QUESTION. `LearnerFocusedBand` gates the move
       on `!combinedCoursework`, so Testing 3 — the version this branch
       promotes — overrides this flag entirely and renders the exam card in the
       right-hand column either way. What changes here is Testing, Testing 2 and
       QE Focused. `?ff=exam-card-placement:under-course` is the one URL. */
    defaultVariant: 'journey-column',
    variants: [
      {
        value: 'under-course',
        label: 'Under the Current course card',
        description:
          'Left column, directly beneath the course card and the same width as it. The Study Journey column loses its first card and starts on Complete Coursework.',
      },
      {
        value: 'journey-column',
        label: 'In the Study Journey column (as shipped)',
        description:
          'Right column, above the coursework card \u2014 where `journey-step-order: exam-first` promotes it.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'course-entry-details',
    group: 'Widgets',
    label: 'Course entry — Details link',
    description:
      'Whether the combined course entry card shows its `Details →` link, which opens the Current Learning Path detail panel. ⚠ OFF BY DEFAULT (2026-09-28, the direct ask): the card is the one place a learner is meant to press Resume, and a second link beside it competes for that press. Turning it on is how to compare the two, not a setting to leave on absent-mindedly. Applies to `combined` only — the split header has its own Details link, unaffected.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'course-entry-style',
    group: 'Widgets',
    label: 'Course entry',
    description:
      'Whether the course header and the Jump Back In card are two blocks or ONE. `split` (default) is what ships: a COURSE PROGRESS header — cover, name, bar, the percentage and the stat pairs — with a separate ruled card under it carrying the lesson and the Resume CTA. `combined` renders both halves inside a single bordered card (`CourseEntryCard`), eyebrow "Current course:", divided by a hairline. ⚠ IT IS A LAYOUT CHANGE ONLY: the same figures, the same three CTA shapes (Start course / Resume / Review course), the same `Details →`. Deliberately NOT carried over from the reference design it came from — the Target exam date cell (removed 2026-09-21 and still echoed on Schedule State Exam) and the Course Overview button. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'combined',
    variants: [
      { value: 'split', label: 'Split (two blocks)' },
      { value: 'combined', label: 'Combined (one card)' },
    ],
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
  /* `dashboard-navigation` WAS HERE — ARCHIVED 2026-10-01. The A/B between the
     Compass player under the app header (`option-1`) and the full-screen
     `CourseContentV2` page (`option-2`). Option 1 won, so the player is
     unconditional now and the flag had nothing left to choose. See the
     `dashboard-navigation-ab` row in `archivedItems.ts` for the re-wire. */
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
    /* ON THE DESIGN BAR — 2026-10-05.
       The text ink ramp — the second thing the ask named. Reviewed and declined as
       a baseline on 2026-09-23 and kept one URL away; the design bar is where
       that comparison actually gets run. */
    /* ⚠ OFF THE DESIGN BAR — 2026-10-20, Jillienne: "remove this. its set on
       neutral for good." The fifth and last control retired that afternoon,
       and the only one whose losing arm was REVIEWED AND REJECTED rather than
       simply not chosen — the flag's own description carries that verdict
       from 2026-09-23 and the reasoning behind it (the warm ink has nothing
       to be warm against on a neutral ground; the thing worth testing is the
       SURFACES, not the ink alone).

       ⚠ NO ESCAPE-HATCH ENTRY NEEDED, unlike the other four: this flag was
       ALREADY in `REBRAND_FLAGS`, so it has been on the cyan bar and in the
       Feature Flag panel at once. Dropping `surface` leaves the panel row it
       already had, which is where a rejected arm belongs — reachable to
       re-check the verdict, not offered to a stakeholder.

       See `dashboard-text-tiers-control` in archivedItems.ts. */
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
    key: 'compass-session-chrome',
    /* THE COURSE CONTENT'S TWO VERSIONS — 2026-10-08, the direct ask: "we will
       need to incorporate 2 versions of the course content, one that takes over
       the whole screen, and another one that actually is below the global
       header."

       ⚠ THE MACHINERY WAS ALREADY THERE AND HALF-UNUSED. `courseTakeover.ts`
       has carried three answers since 2026-09-23 — `none`, `course` (header
       STAYS, with a thicker bottom stroke) and `takeover` (header GOES). The
       session hardcoded `takeover`; this makes the existing `course` arm
       reachable. No new chrome state, no new store.

       ⚠ THE TWO BARS STACK ON THE `in-shell` ARM, AND THAT IS THE AGREED STATE
       RATHER THAN AN OVERSIGHT — 2026-10-08, the direct ask ("leave it for now.
       decision to fix will be made later"). The session draws its own 53px
       `SessionBar` (lesson position, chapter, progress, Notes, Rubi), so under
       the global header there is ~114px of chrome above the lesson. ⚠ It is NOT
       the "two XCEL logos stacked" case the takeover note warns about — the
       session bar carries no logo — which is why this arm is viable at all.
       The three ways out (leave it, slim the bar to progress only, drop it and
       re-home Notes + Rubi) are a decision deferred, not missed. Slimming is
       the one to think hardest about: the chapter title is the only thing on
       screen naming what the learner is studying, and the global header does
       not replace it.

       ⚠ `full-screen` IS THE DEFAULT because it is what ships, so the flag
       changes nothing until someone picks. The arm is the question; the
       baseline is not.

       ⚠ `owner: 'anjani'` SINCE 2026-10-15 — moved off `'jill'` (the author,
       not the scope owner) now that `DesignerId` carries her. Labeling only;
       `versions` below is still what makes the bar reach it. */
    surface: 'design',
    owner: 'anjani',
    /* Scoped to the version the ask came from. ⚠ The EFFECT is not scoped — any
       version that opens the session reads this flag — which is the same split
       `atlas-brand-skin` has: `versions` decides whose BAR carries the control,
       not where the arm applies.

       ⚠ `eric-atlas-e2e` ADDED 2026-10-15 — the default moved to Eric's
       End-to-End Demo on 2026-10-14, and the Compass row (`xcel-compass`)
       opens that version with no `version=` pin. Without this the control was
       reachable by `?ff=` only. `hybrid-pacing` stays so nothing that already
       worked here moves. */
    /* The session's own chrome, so it belongs where the session is. */
    surfaces: ['compass:session'],
    versions: ['hybrid-pacing', 'eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Course content',
    description:
      'Whether the Compass SESSION takes the whole screen or sits under the global header. `full-screen` is what ships: the page calls `setCourseChrome(\'takeover\')`, the app header stands down, and the session\u2019s own bar is the only chrome. `in-shell` uses `courseTakeover`\u2019s other arm (`course`), which keeps the header and gives it a thicker bottom stroke \u2014 so the learner stays inside the product\u2019s navigation while studying. \u26a0 ON `in-shell` THE TWO BARS STACK: the session draws its own 53px bar (lesson position, chapter, progress, Notes, Rubi) under the global header, ~114px of chrome before any lesson content. That is the agreed state while the fix is decided \u2014 it is not the two-logos case, because the session bar carries no lockup. Variant-only.',
    defaultEnabled: true,
    defaultVariant: 'full-screen',
    variants: [
      { value: 'full-screen', label: 'Full screen (as it ships)' },
      { value: 'in-shell', label: 'Under the global header' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-surface',
    /* WHOSE COMPASS — 2026-10-15, the direct ask: "I want what she did to be
       put into the Prototype - Compass Learning section only."

       Anjani's Compass — her rail (`CompassRail`), her course landing
       (`CompassCourseLanding`) and, with the OCT2 master, her study planner
       (`CompassStudyPlanner`) — had been gated on `isHybridVersion` since
       2026-10-08. The Compass Prototypes row (`xcel-compass`) opens the DEFAULT
       version, and on 2026-10-14 that became Eric's End-to-End Demo, so the
       version gate would have put the shared eight-row sidebar on the row that
       is hers. A flag is what `promote-to-prototype` can see and group under
       the Compass row; a version check is not.

       ⚠ `anjani` IS THE DEFAULT ON THIS BRANCH, which is the designer rule
       (CLAUDE.md: a flag whose default is ON on your branch), and it is the
       Compass scope owner's call at promotion — see `PROTOTYPE_SCOPES`. It
       applies on EVERY dashboard version, Eric's included, because the Compass
       surface has one owner however you reached it; `atlas` is the arm that
       keeps his sidebar and its eight pages for anyone who needs the old page.

       ⚠ `owner: 'anjani'` SINCE 2026-10-15 — until then this read `'jill'`
       (the author, not the scope owner), because `DesignerId` had no `anjani`
       yet and the flag panel lists a flag only on versions its owner owns —
       she owned none, so an `anjani` owner made this reachable by `?ff=`
       alone. `DesignerId` carries her now (`FLAG_DESIGNERS`), but that is
       LABELING ONLY: she still owns no dashboard version, so the Feature Flag
       panel (which filters by the ACTIVE VERSION's owner, not a flag's own
       `owner`) does not surface this any differently than before — `versions`
       below is what the Design Controls bar actually reads. The scope's
       design authority is recorded where it lives, in `PROTOTYPE_SCOPES`. */
    owner: 'anjani',
    /* ⚠ `versions: ['eric-atlas-e2e']` ADDED 2026-10-15. Without it this flag
       only shows on the Design Controls bar (and the Feature Flag panel, same
       owner filter) when `flagOwner(version) === 'jill'` — true for every
       version EXCEPT the one the Compass row (`xcel-compass`) actually opens,
       Eric's End-to-End Demo, the default since 2026-10-14. That left the arm
       deciding whose Compass renders reachable only by
       `?ff=compass-surface:atlas`. This is the Compass scope's own version
       list the note above already asked for; widen it if a second
       Compass-hosting version is ever added. */
    /* ⚠ NO `surfaces`, AND NO `surface: 'design'` EITHER — this one is not
       a bar control. It lives in the Feature Flag panel, which scopes by
       PAGE rather than by the surface on screen, so a `surfaces` list on
       it would be read by nothing. It was briefly given one on
       2026-10-16, on the assumption that every `compass-*` flag is a
       design control; it is not, and the empty Compass Overview bar is
       what showed that up. */
    versions: ['eric-atlas-e2e'],
    group: 'Navigation',
    label: 'Compass surface',
    description:
      'Whose Compass Learning renders at `?section=compass` and inside the course player. `anjani` (default) is her design: the six-row rail with the XCEL lockup and the course-hours / exam / learner footer, the Course landing with the resume card and five modules, and the Study planner — pace, weekly hours, days off, a calendar and Rubi rebuilding the plan. `atlas` is the shared `CompassSidebar` with the Atlas design\u2019s eight pages and bare grounds. Applies on every dashboard version.',
    defaultEnabled: true,
    defaultVariant: 'anjani',
    variants: [
      { value: 'anjani', label: 'Anjani\u2019s — rail, course landing, study planner' },
      { value: 'atlas', label: 'Atlas — the shared sidebar and its eight pages' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-dashboard-state',
    /* HER DEV TOGGLE — 2026-10-16. Her prototype carries two dashboards and a
       fixed button bottom-right that swaps them: "Dev: showing empty
       dashboard · click to toggle" (`setDashState`). This is that switch,
       on the bar where the rest of her controls live.

       ⚠ "DAY ONE", NOT "EMPTY". Her id is `dash-empty` and her button says
       empty, but the screen is not an empty state — it is a learner's FIRST
       day, with a first-check card, a 28% ring, five not-started assignments
       and three learning tips. "Empty" describes the data; "Day one"
       describes what a reviewer is looking at, and they are being asked to
       judge the screen.

       ⚠ IT IS A DIFFERENT SCENARIO, NOT THE SAME LEARNER EARLIER. Hers sits
       an Arizona exam on Oct 15, 56 days out; the loaded one is Florida, Aug
       14, 8 days out. Switching changes the course as well as the progress,
       which is hers and deliberate — see the fixtures. */
    surface: 'design',
    owner: 'anjani',
    versions: ['eric-atlas-e2e'],
    surfaces: ['compass:overview'],
    group: 'Widgets',
    label: 'Dashboard',
    description:
      'Which of Anjani\u2019s two Compass dashboards the overview draws. Loaded: the learner mid-course. Day one: their first visit \u2014 the first-check card, a 28% ring, nothing started, and three learning tips in place of session read-outs.',
    variants: [
      { value: 'loaded', label: 'Loaded', description: 'Mid-course' },
      { value: 'day-one', label: 'Day one', description: 'First visit, nothing started' },
    ],
    defaultVariant: 'loaded',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-dashboard-nudge',
    /* HER "DASHBOARD NUDGES" MENU — 2026-10-16, the floating button in
       `public/prototypes/xcel-compass-nudge-journey.html` that fires one of
       three batch nudges onto the dashboard (`dnFire`), with a Clear beside
       them.

       ⚠ SCOPED TO THE OVERVIEW BECAUSE HER OWN NOTE SCOPES IT: "These three
       are batch nudges in Sole's spec — produced between sessions. They
       never fire inside a lesson." Offering them on the session would be the
       bar contradicting the spec the nudges come from.

       The copy is hers, in `COMPASS_DASHBOARD_NUDGES`. `none` is her Clear,
       and it is the default: the Rubi suggestion the readiness band already
       carried is what the overview shows until someone fires one, so this
       control adds a state rather than replacing the shipped one. */
    surface: 'design',
    owner: 'anjani',
    versions: ['eric-atlas-e2e'],
    surfaces: ['compass:overview'],
    group: 'Widgets',
    label: 'Nudge',
    description:
      'Fire one of Anjani\u2019s three batch dashboard nudges into the readiness band. Batch nudges are produced between sessions and never inside a lesson, so this is the overview only. Clear restores the band\u2019s own Rubi suggestion.',
    /* Her menu's own rows: the number, her title, and under it the rule
       about when that nudge may fire. The sub-lines are hers verbatim. */
    variants: [
      { value: 'none', label: 'None', description: 'Clear', badge: '\u00d7' },
      { value: 'd05', label: '05', description: 'Gone quiet, progress stalled', detail: 'batch \u00b7 one per pacing window' },
      { value: 'd08', label: '08', description: 'Back after time away', detail: 'batch \u00b7 once per return' },
      { value: 'd09', label: '09', description: 'Exam close, readiness not there', detail: 'batch \u00b7 planning cadence only' },
    ],
    panelNote:
      'These three are batch nudges in Sole\u2019s spec \u2014 produced between sessions. They never fire inside a lesson.',
    defaultVariant: 'none',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-panel',
    /* HER NUDGE JOURNEY'S "PANEL" GROUP — 2026-10-16, ported from
       `public/prototypes/xcel-compass-nudge-journey.html`, where it is three
       buttons (`demoPanel('closed'|'idle'|'live')`) reading Closed, Idle and
       Chatting.

       ⚠ THE THIRD LABEL IS HERS, NOT THE CODE'S. Her handler calls it `live`
       and the button reads "Chatting"; the learner-facing word wins, because
       the bar is read by people who have not opened the file.

       CLOSED: the Rubi rail is shut and the lesson has the full width. IDLE:
       the rail is open on its greeting and three starters, untouched.
       CHATTING: the same rail with the conversation already under way — the
       state a screenshot of a real session would be in, and the only one that
       shows the thread at all. */
    surface: 'design',
    owner: 'anjani',
    versions: ['eric-atlas-e2e'],
    surfaces: ['compass:session'],
    group: 'Widgets',
    label: 'Panel',
    description:
      'Rubi\u2019s rail beside the lesson. Closed: shut, the lesson full-width. Idle: open on the greeting and its three starters. Chatting: the same rail with the conversation already under way.',
    variants: [
      { value: 'closed', label: 'Closed' },
      { value: 'idle', label: 'Idle' },
      { value: 'live', label: 'Chatting' },
    ],
    /* ⚠ `idle`, NOT her prototype's `closed`. The React session has opened
       with Rubi's rail showing since it was built (`useState(true)`), and
       `CompassSession` pins that. A control arriving on the bar is not a
       decision to move the baseline underneath it — picking Closed is one
       click, and it is the reviewer's to make. */
    defaultVariant: 'idle',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-planner-rubi',
    /* THE PLANNER'S TWO CONCEPTS — Rubi on / Rubi off — 2026-10-15. Her OCT2
       file draws this as an in-page control marked "Prototype", dashed so it
       reads as scaffolding; here it is a design control, which is what the
       product does with scaffolding. ON: the Rubi panel on the right, three
       starters, and the norm note in her voice. OFF: no panel, the calendar
       widens, and the norm note reads "Good to know".

       ⚠ `versions: ['eric-atlas-e2e']` ADDED 2026-10-15 — this used to have
       none, so the bar carried it on the versions its OWNER owns (Jill's)
       only, never on Eric's default, where the Compass row actually opens.
       Reachable only by `?ff=compass-planner-rubi:off` until now. This is the
       "Compass scope with its own versions" the line above used to ask for. */
    surface: 'design',
    owner: 'anjani',
    /* Her PLANNER's control, and only the planner draws it (2026-10-16). */
    surfaces: ['compass:study-planner'],
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    /* ⚠ NO "PLANNER:" PREFIX — 2026-10-16, Jillienne: "we have compass-study
       planner, so we don't need 'planner' in all of these other titles." The
       bar's scope tag reads "Compass · Study planner" above them now, so each
       label was saying it a second time, in 8.5px, five times over.

       It is also closer to Anjani's: her slim row reads RUBI [ON], not
       "Planner: Rubi". The Feature Flag panel keeps its bearings without the
       prefix — it groups these under Widgets and carries each flag's
       `description`, which still names the Study planner in full. */
    label: 'Rubi',
    description:
      'Whether the Study planner\u2019s Rubi panel is part of the learner\u2019s package. ON: the panel, its three starters and the undo stack; the norm note speaks as Rubi. OFF: the planner alone, wider, and the note reads "Good to know".',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-planner-absence',
    /* THE ABSENCE THE PLAN OPENS WITH — 2026-10-15. Her file has "Study today /
       Miss today / Away a week" buttons that advance the clock so the missed-
       day flow can be shown; the product has no buttons in the page, so the
       same states are seeded here. `missed-day`: yesterday's session was
       missed, today is Sep 23. `away-week`: two sessions studied, then seven
       days away, today is Oct 1 — the two done topics are what return note B
       recaps.

       `versions: ['eric-atlas-e2e']` — 2026-10-15, the same reach fix as
       `compass-planner-rubi` above. */
    surface: 'design',
    owner: 'anjani',
    /* Her PLANNER's control, and only the planner draws it (2026-10-16). */
    surfaces: ['compass:study-planner'],
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Absence',
    description:
      'Seeds time away so the return note can be seen. None (default): the plan as onboarding left it, today Sep 22. Missed a day: one missed session, today Sep 23. Away a week: two sessions done, then seven days away, today Oct 1.',
    defaultEnabled: true,
    defaultVariant: 'none',
    variants: [
      /* ⚠ THE LABELS ARE THE LEARNER'S DAY, THE VALUES ARE THE STATE —
         2026-10-16, Jillienne, renaming the first two arms from the bar.
         "None" and "Missed a day" described the ABSENCE; "Study Today" and
         "Miss Today" describe what the planner is showing, which is what a
         reviewer is actually choosing between.

         ⚠ THE VALUES DO NOT MOVE. `none` / `missed-day` / `away-week` are
         `AbsenceKind` in `compassPlanStore`, the `?ff=` strings in review
         links, and what `CompassStudyPlanner.test` arms. Renaming a label is
         copy; renaming a value would silently retire every link anyone has
         already shared. */
      { value: 'none', label: 'Study Today' },
      { value: 'missed-day', label: 'Miss Today' },
      { value: 'away-week', label: 'Away a week' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-planner-return',
    /* THE RETURN NOTE — 2026-10-15, her second master. After time away the
       planner (and the Overview's week block) say what moved, once, sized to
       the absence. A says the outcome; B adds a catch-up review of the last
       two topics studied before the break. Her file switches these with a
       "Return A / B" control in the prototype box; here it is a design
       control. Shows only when `compass-planner-absence` seeds an absence.

       `versions: ['eric-atlas-e2e']` — 2026-10-15, the same reach fix as
       `compass-planner-rubi` above: the owner-match fallback never carried
       this to Eric's default, where the Compass row opens. */
    surface: 'design',
    owner: 'anjani',
    /* Her PLANNER's control, and only the planner draws it (2026-10-16). */
    surfaces: ['compass:study-planner'],
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Return',
    description:
      'The note after a missed session or time away. A: what moved and when you now finish. B: the same, plus a catch-up review of the last two topics before the break, offered first.',
    defaultEnabled: true,
    defaultVariant: 'A',
    variants: [
      /* ⚠ THE ARM IS THE LETTER, THE SENTENCE IS THE TOOLTIP — 2026-10-16,
         Jillienne: "Buttons should be just A, B. On hover, show a tooltip
         with the 'what moved' etc." The two sentences were the widest pair
         on the bar and they only say which of two concepts a reviewer is
         looking at; the letter is enough to pick, and the sentence is there
         the moment anyone wonders. `description` already existed for exactly
         this and is what the Feature Flag panel prints under the arm. */
      { value: 'A', label: 'A', description: 'What moved' },
      { value: 'B', label: 'B', description: 'With a catch-up review' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-planner-under',
    /* BELOW THE WEEK — 2026-10-15. Three things to compare under the week
       view: nothing, next week as a quieter row of the same grid, or the next
       few sessions as a list with the next spaced review. Her "Below week"
       control.

       `versions: ['eric-atlas-e2e']` — 2026-10-15, the same reach fix as
       `compass-planner-rubi` above. */
    surface: 'design',
    owner: 'anjani',
    /* Her PLANNER's control, and only the planner draws it (2026-10-16). */
    surfaces: ['compass:study-planner'],
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Below Week',
    description:
      'What sits under the week view. None (default): the week stands alone. Next week: the following week as a quieter row. Coming up: the next four sessions as a list, and when the next spaced review falls.',
    defaultEnabled: true,
    defaultVariant: 'none',
    variants: [
      { value: 'none', label: 'None' },
      { value: 'next', label: 'Next week' },
      { value: 'coming', label: 'Coming up' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-planner-day-off',
    /* TAKING A DAY OFF — 2026-10-15. Skip: a Skip button appears on a planned
       day (on hover, or always on touch) and takes it off in one click; the
       day itself still opens the menu. Menu: no button, the click opens the
       per-day menu, which says where the session would land before you
       commit. Her "Day off" control.

       `versions: ['eric-atlas-e2e']` — 2026-10-15, the same reach fix as
       `compass-planner-rubi` above. */
    surface: 'design',
    owner: 'anjani',
    /* Her PLANNER's control, and only the planner draws it (2026-10-16). */
    surfaces: ['compass:study-planner'],
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Day off',
    description:
      'How a day is taken off in the planner. Skip button (default): one click on the day\u2019s Skip. Menu: clicking the day opens a small menu that says where the session would move, with "Pick several days" for a range.',
    defaultEnabled: true,
    defaultVariant: 'skip',
    variants: [
      { value: 'skip', label: 'Skip button' },
      { value: 'menu', label: 'Menu' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'hybrid-course-expiry',
    /* HOW CLOSE THE ACCESS DEADLINE IS — 2026-10-07, the direct ask for a demo
       control showing the course expiring, nearly expired, and expired.

       ⚠ IT OVERRIDES THE DATE, NOT JUST THE COLOUR, and it has to. "Access ends
       June 11" over an amber warning icon is a contradiction: the whole claim
       of the amber state is that the date is CLOSE. Each arm restates the date
       from `today`, so the wording, the colour and the icon agree.

       ⚠ `expired` IS THE ONLY ARM THAT LEAVES THE LINE. It greys the product
       and makes it unclickable — see `[data-course-expired]` in tokens.css. The
       greyscale lands on `.min-h-screen`, the app root INSIDE the prototype
       chrome, deliberately: greying the whole document would also grey the
       design bar this control lives on, and making THAT unclickable would trap
       a designer in the state with no way out.

       ⚠ NOTHING IS CLICKABLE IN `expired` "for now" — the ask's own words. It
       is `pointer-events: none`, which stops the mouse and NOT the keyboard; a
       tab-through still reaches every control. Real expiry handling is a
       product decision — what CAN you still do, renew, view certificates? — and
       this arm exists to ask that question rather than to answer it. */
    surface: 'design',
    owner: 'jill',
    versions: ['hybrid-pacing'],
    group: 'Widgets',
    label: 'Course expiration',
    description:
      'The access deadline\u2019s urgency on Hybrid \u2014 Pacing Exploration, and the state of the screen under it. `Normal` (default) is the real date in grey. `Ending soon` is inside seven days \u2014 amber with a warning triangle. `Ends in 2 days` is amber\u2019s next step \u2014 red with a calendar-exclamation. `Expired` turns the line charcoal and puts the whole product into greyscale with nothing clickable. \u26a0 EACH ARM RESTATES THE DATE from today, because a colour saying "close" over a date two months out is a contradiction. \u26a0 The greyscale covers the APP, not the prototype bars \u2014 otherwise the control that sets this would be greyed and unclickable too.',
    defaultEnabled: true,
    defaultVariant: 'normal',
    variants: [
      { value: 'normal', label: 'Normal' },
      { value: 'soon', label: 'Ending soon (under 7 days)' },
      { value: 'urgent', label: 'Ends in 2 days' },
      { value: 'expired', label: 'Expired' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'hybrid-pace-standing',
    /* HOW THE LEARNER IS DOING AGAINST THEIR GOAL — 2026-10-07, the direct ask
       for "a demo tool that shows Pacing goals and include On Track, Off Track
       and all the other possible messaging we need to give the users".

       ⚠ IT FORCES A STATE, IT DOES NOT MEASURE ONE, and that is deliberate
       rather than a shortcut. `studyPace` already has the real machinery —
       `weekStanding` and `observedPace` — and both need `weekMinutes`, a
       seven-day fixture of what was actually studied, which this home is never
       handed. Wiring that through is a separate and much larger job; what a
       copy exploration needs first is every message on screen side by side, and
       a forced state is the only way to see the ones a fixture does not reach.

       ⚠ SO THE HOURS FIGURE IS SCENARIO DATA, derived from the chosen arm
       against the goal's own `minsPerWeek` rather than from anything observed.
       It moves with the pace the learner picked, so the two numbers in the
       sentence are always consistent with each other — but it is NOT a reading
       of behaviour and must not be presented to a stakeholder as one.

       ⚠ THE ARMS ARE THE MESSAGES, which is why there are five and not three.
       "Behind" and "off track" are different things to say — one is a nudge the
       learner can act on this week, the other is an admission the goal no
       longer fits and sends them to the Study Plan. Collapsing them was the
       first draft and it lost the only message that has an action attached. */
    surface: 'design',
    owner: 'jill',
    versions: ['hybrid-pacing'],
    group: 'Widgets',
    label: 'Pacing standing',
    description:
      'Which standing Hybrid \u2014 Pacing Exploration reports against the study goal, and therefore which message the pace panel shows. `On track` (default) is the shipped case. `Ahead` finishes early. `Behind` is a gap the learner can still close this week. `Off track` says the goal no longer fits and sends them to the Study Plan \u2014 the only arm with an action attached. `No data yet` is the first week, before there is an average to report. \u26a0 FORCED, NOT MEASURED: the hours figure is derived from the arm against the goal\u2019s own weekly minutes, so the two numbers agree \u2014 it is not a reading of behaviour. In-progress only; at 0% the panel asks for a pace instead.',
    defaultEnabled: true,
    defaultVariant: 'on-track',
    variants: [
      { value: 'on-track', label: 'On track' },
      { value: 'ahead', label: 'Ahead of goal' },
      { value: 'behind', label: 'Behind — recoverable' },
      { value: 'off-track', label: 'Off track — adjust the goal' },
      { value: 'no-data', label: 'No data yet' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'hybrid-title-lesson',
    /* THE CURRENT LESSON AS A LINE UNDER THE COURSE TITLE — 2026-10-07, the
       direct ask, and the counterpart to `hybrid-lesson-block` beside it.

       ⚠ THE TWO ARE THE SAME FACT IN TWO PLACES, which is the comparison they
       exist to make. The journey block names the lesson where the learner is
       in the LIST; this names it beside Resume Course, where the action is. Off
       in the journey and on here is the pairing this version ships with, so the
       lesson is stated once and next to the button that opens it.

       ⚠ BOTH ON IS A VALID STATE AND IS NOT A DEFECT — it is what you set to
       see whether the repetition reads as reinforcement or as noise. Both off
       is valid too: the stop keeps "26 of 42 Completed" either way, so the
       screen still says where the learner is, just not which lesson.

       ⚠ IN PROGRESS ONLY. At 0% there is no lesson in progress to name, and the
       title area carries Begin Course rather than Resume — see `showLesson`. */
    surface: 'design',
    owner: 'jill',
    versions: ['hybrid-pacing'],
    group: 'Widgets',
    label: 'Lesson line under title',
    description:
      'Whether Hybrid \u2014 Pacing Exploration names the lesson in progress on one line under the course title, above Course Overview and Resume Course. ON by default as of 2026-10-07, as the replacement for the journey\u2019s lesson block (`hybrid-lesson-block`, off). \u26a0 THE TWO CAN BOTH BE ON \u2014 that is the comparison, not a bug. \u26a0 In-progress only: at 0% there is no lesson to name and the button beside it reads Begin Course.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'hybrid-lesson-block',
    /* THE CURRENT LESSON UNDER THE COUNTED STOP — 2026-10-07, the direct ask:
       "is showing this here triggered by a feature flag? if not - i want to put
       it behind a feature flag and hide it."

       It was not. The block was gated on DATA alone (`showLesson` — started, a
       count above zero, a count below the total), which is right for "is there
       a lesson to name" and says nothing about "should we name it". This is the
       second question, and it now has a switch.

       ⚠ OFF BY DEFAULT, WHICH IS THE ASK AND IS ALSO THE INVERTED DIRECTION
       this catalog normally avoids — `hybrid-quick-links-style` next door
       argues that an unset flag should render what the version ships. The
       difference is that here "hidden" IS what the version ships from today;
       the flag exists to bring the block BACK for comparison, not to take it
       away. If the block is ever restored as the default, flip
       `defaultEnabled` and the test below rather than inverting the read.

       ⚠ SCOPED TO THE PACING FORK, and deliberately not to Hybrid V1. V1 is
       the Prototypes baseline as of 2026-10-06 — what a stakeholder lands on —
       and `HybridHomeV1.tsx` does not read this flag at all, so no default
       here can reach it. Hiding the block there is a separate decision about
       the product. */
    surface: 'design',
    owner: 'jill',
    versions: ['hybrid-pacing'],
    group: 'Widgets',
    label: 'Current lesson block',
    description:
      'Whether Hybrid \u2014 Pacing Exploration names the lesson in progress under the Pre-Licensing Lessons stop \u2014 the eyebrow ("Lesson 27 \u00b7 About 18 minutes"), the chapter title, and the hover row that resumes the course. OFF by default as of 2026-10-07. \u26a0 THE STOP\u2019S OWN COUNT IS NOT AFFECTED: "26 of 42 Completed" stays either way, so what this hides is the NAMING of the current lesson and the second way into the course, not the progress. \u26a0 It has no effect where there is no lesson to name \u2014 before the first one, or once the count reaches the total.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'hybrid-quick-links-style',
    /* HYBRID V1'S QUICK LINKS SHAPE — 2026-10-05, the direct ask: bring back
       the tile treatment and put both within reach.

       ⚠ ITS OWN FLAG, NOT `home-tile-style`. That one drives Testing 3's
       `HomeTileGrid`, and a flag is GLOBAL STATE however the bar scopes the
       control — flipping it here to look at Hybrid would have silently
       reshaped Testing 3's rail too. Two versions asking the same question is
       not a reason to share the answer.

       ⚠ `rows` IS THE DEFAULT so an unset flag is the shape the version ships
       with; `=== 'tiles'` is the opt-in, the same direction `home-tile-style`
       chose and for the same reason — an inverted test makes "no decision"
       render as a decision. */
    surface: 'design',
    owner: 'jill',
    versions: ['hybrid-v1'],
    group: 'Widgets',
    label: 'Quick Links shape',
    description:
      'How Hybrid V1\u2019s Quick Links card draws its seven destinations. `Rows` (default) is the stacked list with an icon, a label and a hover-revealed chevron. `Tiles` is the square, outlined treatment \u2014 two across, icon over label, filling on hover. ⚠ THE SAME SEVEN IN THE SAME ORDER WITH THE SAME HANDLERS either way; only the shape changes, which is what makes the two comparable. ⚠ Six squares two-across is a TALL block, so the thing to judge is what it does to the length of the right column, not the tiles themselves.',
    defaultEnabled: true,
    defaultVariant: 'rows',
    variants: [
      { value: 'rows', label: 'Rows — stacked list' },
      { value: 'tiles', label: 'Tiles — square, outlined' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-brand-skin',
    /* ERIC'S BRAND SKIN, ON THE DESIGN BAR — 2026-10-05, converted the same way
       as `atlas-heading-font` beside it and for the same reason: brand COLOURS
       are a design decision, and the demo bar is the stakeholders' bar.

       ⚠ A SKIN IS NOT A BRAND, and the distinction is load-bearing. `Brand` in
       `AccountContext` stays `'xcel'` whichever skin is showing — the courses,
       personas and fixtures are XCEL's throughout. What a skin changes is what
       the Atlas Development doc says changes per brand: the LOGO and the BRAND
       COLOURS. Neutrals, type scale, spacing and layout are platform and stay.
       See `atlasBrandSkin.ts` for why re-widening `Brand` was refused.

       ⚠ SCOPED BY `versions`, like the fonts: tokens.css only re-points the
       ramps under the Atlas palette, so on any other version this would render
       and change nothing.

       ⚠ IT ALSO NEEDS `atlas-xcel-palette` ON, which a flag cannot express as a
       dependency — `PlatformShell` mirrors `data-atlas-brand` only while the
       palette is applied. That flag defaults ON, so the control works out of
       the box; turn the palette off and this one renders but does nothing. The
       same caveat applies to `atlas-heading-font` below. Worth a real
       dependency if a third control ever joins them.

       ⚠ `?skin=` STILL WINS WHEN PRESENT, as an alias.

       ⚠ `hybrid-pacing` JOINED THE SCOPE 2026-10-08, the direct ask ("I want to
       bring in the brand colour concept Eric was using"). Nothing about the
       MECHANISM changed, and that is the point: Hybrid answers
       `isAtlasCompassNavVersion`, so `PlatformShell` was already mirroring
       `data-atlas-palette` and `data-atlas-brand` on it, and the Hybrid home's
       own `--color-compass-page-button` already resolves through the brand
       ramps these skins re-point. Checked in the browser before the edit:
       `?skin=cre` on `hybrid-pacing` re-dressed the logo, the CTAs and the nav
       pills with no code at all. The `versions` list was the only thing holding
       the CONTROL off that bar.

       ⚠ SHARED, NOT FORKED. A second flag of Jill's own would be two controls
       writing one `data-atlas-brand`, and the skins would drift apart the first
       time Eric retuned a ramp. `owner` stays `eric` — it is his control and
       his palette; the `versions` list is what decides whose BAR it appears on,
       which is exactly the split the note at `atlas-heading-font` below
       records. The default (`global`) is what Hybrid already rendered, so
       nothing moves until someone picks another. */
    surface: 'design',
    owner: 'eric',
    // V3 left on 2026-10-09 for its own copy, `atlas-brand-skin-v3`, below.
    // Hybrid - Pacing Exploration joined on main, 2026-10-08 (see above).
    versions: ['eric-atlas-v1', 'eric-atlas-v2', 'discoverability-atlas-compass-nav', 'hybrid-pacing'],
    group: 'Widgets',
    label: 'Brand',
    description:
      'Which Colibri brand the Atlas/Compass pages are dressed as — the LOGO and the BRAND COLOURS only. ⚠ IT IS A SKIN, NOT A BRAND: `Brand` in AccountContext stays XCEL, so the courses, personas and fixtures are XCEL’s whichever skin is showing; neutrals, type scale, spacing and layout are platform and do not move. XCEL is the default (again since 2026-10-06; Global was from 2026-10-01). Global is no brand at all — the Compass Design System v5’s own colours, for an instance that is not any Colibri brand. ⚠ REQUIRES the Atlas palette (`atlas-xcel-palette`, on by default): with it off, tokens.css never re-points the ramps and this control changes nothing.',
    defaultEnabled: true,
    // XCEL loads first (2026-10-06, Eric's request). Global leads the list
    // since 2026-10-08 (Eric: "move the global brand to the first item"),
    // with XCEL second — the order moved, the default did not.
    /* ⚠ KEPT AT XCEL ON THE 2026-10-14 PROMOTION, knowingly. The baseline
       (End-to-End Demo) reads `atlas-brand-skin-v3`, not this, so this default
       decides how HYBRID looks when a stakeholder picks it from the menu —
       XCEL now, Global before the merge. Jillienne chose to let it change
       rather than give Hybrid its own copy; `?skin=global` restores the
       old look on any link. */
    defaultVariant: 'xcel',
    variants: [
      { value: 'global', label: 'Atlas' },
      { value: 'xcel', label: 'XCEL (Insurance)' },
      { value: 'xcel-blue-cta', label: 'XCEL Blue CTA' },
      { value: 'cre', label: 'Colibri Real Estate' },
      { value: 'mckissock', label: 'McKissock Learning' },
      { value: 'elite', label: 'Elite Learning' },
      /* ⚠ PALETTES, NOT BRANDS — 2026-10-08, the direct ask. The five above are
         Colibri companies and swap the LOGO as well as the colours; these four
         are colour palettes with no company behind them, so the page keeps
         whichever logo it had. `AtlasPaletteSkin` in `atlasBrandSkin.ts` marks
         the split, and `Logo` asks `SKIN_LOGOS` whether a skin has artwork
         rather than listing the ones that do not. */
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-brand-skin-v3',
    /* ERIC/ATLAS V3'S OWN BRAND CONTROL — 2026-10-09, Eric: "make the Global
       brand the default view on V3". A flag has ONE default for every version,
       so V3 gets its own copy of `atlas-brand-skin` (same variants, same
       order) defaulting to Global; the other versions keep XCEL. PlatformShell
       reads this one when `?version=eric-atlas-v3`. Everything said on
       `atlas-brand-skin` above — skin not brand, needs the Atlas palette,
       `?skin=` wins — holds here too. */
    surface: 'design',
    owner: 'eric',
    versions: ['eric-atlas-v3', 'eric-atlas-white', 'eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Brand',
    description:
      'Eric/Atlas V3’s Brand control — the same skins as `atlas-brand-skin`, but Global by default (2026-10-09). A SKIN, NOT A BRAND: the logo and brand colours only. ⚠ REQUIRES the Atlas palette (`atlas-xcel-palette`, on by default).',
    defaultEnabled: true,
    defaultVariant: 'global',
    variants: [
      { value: 'global', label: 'Atlas' },
      { value: 'xcel', label: 'XCEL (Insurance)' },
      { value: 'xcel-blue-cta', label: 'XCEL Blue CTA' },
      { value: 'cre', label: 'Colibri Real Estate' },
      { value: 'mckissock', label: 'McKissock Learning' },
      { value: 'elite', label: 'Elite Learning' },
      /* ⚠ THE FOUR PALETTE THEMES CAME OFF BOTH BRAND DROPDOWNS — 2026-10-20,
         Jillienne: "remove these 4 color styles". Grasslands, Everglade,
         Harbor and Marigold were added 2026-10-08 ("add 4 additional brand
         themes using the colors from these screenshots") and were PALETTES,
         not brands: no company behind them, so the page kept whichever logo
         it had, which `AtlasPaletteSkin` in `atlasBrandSkin.ts` still marks.

         ⚠ BOTH CONTROLS, OR THE TWO BRAND DROPDOWNS DIFFER. The line this
         replaces said they are "kept on both controls so the two Brand
         dropdowns never differ" — `atlas-brand-skin` (V1/V2) and
         `atlas-brand-skin-v3` carry the same list by design, and editing one
         is how they drift.

         ⚠ THE PALETTES THEMSELVES ARE KEPT AND STILL REACHABLE. They remain
         in `ATLAS_SKINS`, in the `AtlasSkin` type and in tokens.css ("FOUR
         PALETTE THEMES"), so `?skin=grasslands` still resolves and renders —
         only the dropdown rows are gone. See `atlas-palette-skins` in
         archivedItems.ts. */
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-heading-font',
    /* ERIC'S HEADING FACES, ON THE DESIGN BAR — 2026-10-05, the direct ask
       ("this should be part of the design controls for eric's stuff").

       It was a Demo Controls dropdown driven by `?fonts=` until the Atlas merge
       took it off that bar: a typeface comparison is a DESIGN decision, and the
       demo bar is the stakeholders' bar. This is the sanctioned route back —
       CLAUDE.md's rule is that you do not edit `DesignControlsBar` to get a
       control on it, you mark the flag.

       ⚠ `versions`, NOT `owner`, IS WHAT SCOPES IT. Owner alone would put it on
       every version Eric owns; these faces are wired to the Atlas pages
       specifically (tokens.css "ATLAS HEADING FONTS", and `PlatformShell` only
       mirrors `data-atlas-font` under `atlasNav`). On any other version the
       control would render and change nothing.

       ⚠ `?fonts=` STILL RESOLVES, as an alias — see `PlatformShell`. Every
       Atlas font link shared before today keeps working. */
    surface: 'design',
    owner: 'eric',
    // Off WIP's and White's bars (2026-10-14, Eric's request): they keep the
    // default, Playfair 2.
    versions: ['eric-atlas-v1', 'eric-atlas-v2', 'discoverability-atlas-compass-nav'],
    group: 'Widgets',
    label: 'Headings',
    description:
      'The heading typeface on the Atlas/Compass pages — the XCEL Atlas Style Guide’s own DM Serif Display plus the faces from the “Atlas Serif Trials” page, each carrying the trial’s own weight and size settings so it reads as it did there (see `atlasFontSets.ts`). ⚠ ONE WEIGHT PER FACE IS LOADED and weight synthesis is off under the Atlas palette, so every heading renders at the trial weight whatever its component asks for. ⚠ Open Sans is a valid `?fonts=open-sans` value with its tokens intact but is deliberately absent from this list (2026-09-30, the designer’s request).',
    // Variant-only, the same shape as `dashboard-heading-font` below: the
    // enable toggle is on so the flag is live, and the CHOICE is the variant.
    defaultEnabled: true,
    // Playfair 2 is the face a fresh demo loads (2026-10-07, Eric's request);
    // Source Serif 4 was from 2026-10-06, DM Serif Display before that.
    /* ⚠ REACHES PROTOTYPES SINCE 2026-10-14 — `promote-to-prototype`. End-to-End
       Demo is the baseline and reads this default (its own bar hides the
       control), so Playfair 2 is what a stakeholder's `?demo=1` renders. The
       flag has ONE default, so Hybrid takes Playfair 2 too when picked — DM
       Serif Display before the merge; decided, not drifted. */
    defaultVariant: 'playfair-2',
    // Playfair 2 heads the list and is the default (2026-10-07, Eric's
    // request); every other face stays in the dropdown.
    variants: [
      { value: 'playfair-2', label: 'Playfair 2 (default)' },
      { value: 'dm-serif-display', label: 'DM Serif Display (style guide)' },
      { value: 'source-serif-4', label: 'Source Serif 4' },
      { value: 'figtree', label: 'Proxima Nova stand-in (Figtree)' },
      { value: 'outfit', label: 'Outfit' },
      { value: 'instrument-sans', label: 'Instrument Sans' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-affidavit',
    /* THE AFFIDAVIT OVER ATLAS HOME — 2026-10-16, Jillienne: "Affidavit: On -
       Off, Pre-course or Post Course (if selected on)".

       ⚠ THREE ARMS, NOT A SWITCH PLUS A SECOND CONTROL. The ask describes two
       levels, and the states it describes are three: off, on-and-pre,
       on-and-post. The design bar has no nested control — `secondaryVariants`
       is read by the Feature Flag PANEL and nothing else — so a two-level
       version would be a switch beside a second group that is meaningless
       half the time. One segmented group says the same thing in one click,
       and it is the shape every other control on this bar already uses.

       ⚠ THE NAMES ARE THE JOURNEY'S. "Pre-course Affidavit" and
       "Study-manual Notice Affidavit" are what the Study Journey calls these
       two rows (`whiteJourneyTitles`); the arms are short so the bar stays
       readable, and each carries the full name as its tooltip.

       ⚠ `?affidavit=1` STILL WORKS. Arriving from Confirmation & Password
       opens the pre-course one, as it has since 2026-10-15 — this control is
       a second way in, not a replacement, and closing the modal clears both
       so it does not spring back. */
    surface: 'design',
    owner: 'eric',
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Affidavit',
    description:
      'The affidavit modal over the End-to-End Demo\u2019s Home. Off: Home as it lands. Pre-course: the affidavit signed before the coursework. Post-course: the Study-manual Notice Affidavit, signed after it.',
    variants: [
      { value: 'off', label: 'Off' },
      { value: 'pre', label: 'Pre-course', description: 'Pre-course Affidavit' },
      { value: 'post', label: 'Post-course', description: 'Study-manual Notice Affidavit' },
    ],
    defaultVariant: 'off',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-home-long-title',
    /* A REFERENCE TOGGLE beside Headings on the Design bar (2026-10-07, Eric's
       request: "add another toggle … to show this long title for reference").
       On, Eric/Atlas V2's Home shows a deliberately LONG course title — the
       worst case a heading face has to wrap — in place of the fixture's. Off
       (default), the real title. V2 only: the long title lives in
       `AtlasHomeEricV2`, so on any other version this would change nothing. */
    surface: 'design',
    owner: 'eric',
    versions: ['eric-atlas-v2', 'eric-atlas-v3', 'eric-atlas-white', 'eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Long title',
    description:
      'Shows a deliberately long course title on Eric/Atlas V2\u2019s Home (\u201cNew York Property and Casualty Conversion Course Pre-licensing and Live Review Class\u201d) so a heading face can be judged at its worst wrap. Off: the course\u2019s real title. On End-to-End Demo it adds \u201cwith Comprehensive Exam Simulators\u201d to the course title on Home, Invited Product Detail and Checkout. Display only \u2014 the course behind it is unchanged.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-wip-quick-links-side',
    /* WHICH SIDE ERIC/ATLAS WIP'S QUICK LINKS SITS, ON THE DESIGN BAR
       (2026-10-13, Eric's request). Left (default) — beside the course card
       on Home and before the cards on My Courses and Certificates, as it is
       now. Right — after them on all three. One pick for the three pages. */
    surface: 'design',
    owner: 'eric',
    // …and White, which shows WIP's Home (2026-10-14, Eric's request).
    // Not on End-to-End Demo's bar (2026-10-14, Eric's request).
    versions: ['eric-atlas-v3', 'eric-atlas-white'],
    group: 'Navigation',
    label: 'Quick Links',
    description:
      'Which side of the page Eric/Atlas WIP\u2019s Quick Links card sits on \u2014 Home, My Courses and Certificates together. Left (default) or Right.',
    defaultEnabled: true,
    defaultVariant: 'left',
    variants: [
      { value: 'left', label: 'Quick Links Left' },
      { value: 'right', label: 'Quick Links Right' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-background',
    /* WIP OR WHITE, ON THE DESIGN BAR (2026-10-14, Eric's request): the two
       versions show the same Home, Toned on WIP's warm page and White on a
       white one. Picking an option SWITCHES THE VERSION, and each version sets
       it to match on arrival — `useAtlasBackgroundSwitch` (atlasBackground.ts),
       called by PlatformShell. */
    surface: 'design',
    owner: 'eric',
    versions: ['eric-atlas-v3', 'eric-atlas-white'],
    group: 'Navigation',
    label: 'Background',
    description:
      'The page behind the Home: Toned (Eric/Atlas WIP) or White (Eric/Atlas White). Picking one opens that version.',
    defaultEnabled: true,
    defaultVariant: 'toned',
    variants: [
      { value: 'toned', label: 'Toned' },
      { value: 'white', label: 'White' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'demo-start-point',
    /* START — WHERE THE DEMO OPENS (2026-10-16, Jillienne: "add a demo control
       for Start … this will replace the Page design control on Eric's version
       and make it available for all").

       It REPLACES `atlas-e2e-page`, which was the same idea scoped to one
       person and one version: `surface: 'design'`, `owner: 'eric'`,
       `versions: ['eric-atlas-e2e']`, so the only control that could move a
       stakeholder between the invite flow and the dashboard lived on the
       light-cyan bar, behind the robot's dropdown, on one version. See the
       `atlas-e2e-page` row in `archivedItems.ts` for the re-wire.

       ⚠ IT IS A DEMO CONTROL NOW, which is the whole point and also the
       reason it is Jillienne's: where a stakeholder ENTERS the product is
       what the product demos, not what one exploration is exploring. No
       `surface`, no `owner`, no `versions` — it draws on the amber bar for
       every version.

       ⚠ COMPASS IS A `?section=`, NOT A PAGE, which is why the destinations
       live in `EndToEndPageSync` rather than being derivable from the value:
       three of these are routes under `/end-to-end-demo` and two are the same
       `/dashboard-rebrand` pathname told apart by a param.

       ⚠ INVITE AND CHECKOUT PIN ERIC'S VERSION. `useEndToEndDemoParams` writes
       `version=eric-atlas-e2e` onto those pages because the page IS that
       version's way in — so picking one of the first three FROM another
       version moves you onto his. That is the invite flow only existing in one
       version, not this control choosing for you; Atlas and Compass keep
       whatever version you were on.

       Default `atlas`: a bare `/dashboard-rebrand` is the dashboard, and a
       control whose default disagreed with the route it loads on would make
       every plain load look like a pick the reviewer did not make. */
    group: 'Navigation',
    label: 'Start',
    description:
      'Where the demo opens: the Invite & Checkout flow (the invitation email, the invite page, its checkout and the password step \u2014 one journey, opening at the email), the Atlas dashboard, or Compass. Picking one opens it; arriving anywhere in the flow sets the control to match. Invite & Checkout is the End-to-End Demo\u2019s own journey and opens on its version.',
    defaultEnabled: true,
    defaultVariant: 'atlas',
    variants: [
      /* ⚠ ONE OPTION WHERE THERE WERE FOUR — 2026-10-20, Jillienne: "Lets
         COmbine Email, invite, Checkout, and Confirmation into 1 Invite &
         Checkout flow."

         Email → Invite → Checkout → Confirmation is ONE journey a learner
         walks end to end, and the control was listing each of its screens
         beside Atlas and Compass, which are whole surfaces. Two thirds of the
         menu was one flow, and reading it required already knowing that.

         It opens on the Email — the flow's first screen — and it ANSWERS TO
         all four pathnames, so walking the journey no longer makes the
         control jump between entries mid-walk. See `START_POINTS` in
         `endToEndDemo.ts`; `resolveStartPoint` keeps a browser holding one of
         the four old ids working.

         ⚠ WHAT IS LOST, so it is a decision rather than a discovery: you can
         no longer JUMP straight to Checkout or to the password step from this
         control — the thing `atlas-e2e-page` was kept for on 2026-10-16. The
         routes are unchanged and still reachable by URL
         (`/end-to-end-demo/checkout`, `/end-to-end-demo/confirmation`), and
         arriving on either still ticks this option. */
      { value: 'invite-checkout', label: 'Invite & Checkout' },
      { value: 'atlas', label: 'Atlas' },
      { value: 'compass', label: 'Compass' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'invite-flow-version',
    /* THE INVITE FLOW'S VERSION (2026-10-22, Jillienne: "i need to create a V2
       in the version panel for the invite flow"). Which build of the invite
       door renders at all four of its routes — the email, Invited Product
       Detail, checkout and Confirmation & Password.

       ⚠ IT IS A FLAG RATHER THAN A `?version=` ID, and that is forced rather
       than preferred. `useEndToEndDemoParams` writes `version=eric-atlas-e2e`
       onto these four pages on mount, because they are that dashboard
       version's way in — so an invite id in the same parameter is overwritten a
       tick after it is read. The flag store is the one place on these routes
       that is not already spoken for, and it brings per-browser persistence
       and `?ff=` pinning with it. `inviteFlowVersions.ts` carries the long
       form of this.

       ⚠ THE VARIANTS MUST MATCH `INVITE_FLOW_VERSIONS`. The picker lists that
       catalog and writes the id straight back here; a row with no variant is a
       card that selects nothing. `InviteFlowVersions.test.ts` holds the two
       lists together.

       DEFAULT `v2` ON THIS BRANCH, which is the branch rule — the flag default
       is what makes a branch build show the work. On `main` it is `v1`: the
       End-to-End and Invite & Purchase rows both open this flow, so the default
       here IS what stakeholders see, and moving it is `promote-to-prototype`'s
       decision rather than this flag's. */
    group: 'Navigation',
    label: 'Invite flow version',
    description:
      'Which build of the Invite & Purchase flow renders at its four routes — the invitation email, Invited Product Detail, checkout, and Confirmation & Password. V1 is the released baseline; V2 is the checkout exploration.',
    defaultEnabled: true,
    defaultVariant: 'v2',
    variants: [
      { value: 'v1', label: 'V1', description: 'The released baseline — the flow as the End-to-End row shows it.' },
      { value: 'v2', label: 'V2', description: 'The checkout exploration. A fork of V1; identical until it is changed.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'invite-flow-journey',
    /* WHICH INVITE FLOW ARE WE WALKING — 2026-10-22, Jillienne: "i think i
       need 1 refinement row where we can review all of the different flows, so
       maybe that is a design tool dropdown to select which flow we are working
       through?"

       ONE control, ONE Refinement row, four flows. Four rows for four arms of
       one build would be four links going stale separately; this is one
       address that always shows all four.

       ⚠ FOUR VARIANTS MAKES IT A DROPDOWN, not pills, and that is the bar's own
       rule rather than anything set here — `SEGMENTED_MAX` is 3 in
       `DesignControlsBar`, above which a control becomes "INVITE FLOW: … ⌄".
       Which is exactly the shape asked for, with no edit to protected chrome.

       ⚠ IT REPLACES `checkout-audience` (B2B / B2C / Guest), which stood for
       half a day. That control collapsed two questions into one: WHO sent them
       (a partner, or nobody) and WHAT the invitation carried (their details,
       their email, or nothing). These four separate them, which is what makes
       `qr-social` expressible at all — partner-attributed, individually
       unknown.

         B2B2C with email    — a partner invited them and supplied the address.
                               Locked at checkout; password set inline.
         B2B2C w/o email     — a partner invited them, no address. Typed twice,
                               masked first; password from the emailed link.
         B2C Guest Checkout  — no partner, nothing known. The student form
                               starts empty and Payment stays closed until it
                               is complete.
         QR code / social    — a partner's broadcast link. Partner pricing, but
                               nothing known about who scanned it, and no
                               product chosen: the options modal is inherent
                               here rather than a toggle.
         B2B2C verified      — a partner invited them, no address, and the
                               learner proves one BEFORE checkout: a modal
                               asks name and email, sends a 6-digit code, and
                               the code unlocks the checkout. Locked after;
                               password inline. (2026-10-27, the fifth arm.)
         Signed-in XCEL       — a returning customer, signed in to the public
                               site. Checkout filled from the account, email
                               locked, no partner question; the dashboard's
                               own password is set on the confirmation page,
                               with a line saying why. (2026-10-27, sixth.)

       The long form of every predicate is in `inviteFlows.ts`.

       DEFAULT `b2b2c-email`: it is the flow the committed build tells — the
       invitation email names Jordan, Sunrise Bank and the course. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    surfaces: ['invite'],
    group: 'Navigation',
    label: 'Invite flow',
    /* Six two-line rows and counting — see the field's note. */
    picker: 'sheet',
    description:
      'Which invite flow the demo walks. B2B2C with email: a partner invited this learner and supplied their address, so it is locked at checkout and the password is set inline. B2B2C without email: invited, but the address is theirs to type twice (first field masked) and the password comes from a link in the confirmation email. B2C Guest Checkout: no partner, nothing known — the student information starts empty and Payment stays closed until it is complete. QR code or social link: a partner’s broadcast link, so partner pricing applies but nothing is known about who scanned it and the product options modal always opens. B2B2C verified email: invited without an address, and the learner proves one before checkout — name and email in a modal, a 6-digit code sent to it — after which it is locked and the password is set inline. Signed-in XCEL account: a returning customer on the public site, known by name — checkout arrives filled with the account email locked, no partner question, and the confirmation page explains that the learning dashboard needs a password of its own.',
    defaultEnabled: true,
    /* ⚠ THE GUEST, SINCE 2026-10-23 — see `DEFAULT_INVITE_FLOW`, which this
       must equal (`InviteFlows.test.tsx` pins the pair). */
    defaultVariant: 'b2c-guest',
    variants: [
      {
        value: 'b2b2c-email',
        /* ⚠ THE SECOND FIRE — 2026-10-23, and the mark has stopped meaning
           "the long one". It means BUILT AND WALKABLE END TO END: this arm
           collects the student's details from scratch like the guest does
           (the partner passed an email and nothing else), and it ends on the
           same confirmation page the guest ends on. The two unmarked arms
           have not caught up. */
        label: '🔥 B2B2C with email',
        description: 'Partner invited them, address supplied. Locked at checkout.',
      },
      {
        value: 'b2b2c-no-email',
        label: 'B2B2C w/o email',
        description: 'Partner invited them, no address. Typed twice, password from the emailed link.',
      },
      {
        value: 'b2c-guest',
        /* ⚠ THE FIRE IS JILLIENNE'S MARK, 2026-10-22: "mark this one with a
           dumpster on fire icon", then "just use the fire" — at badge size two
           glyphs read as a smudge, and the fire is the half that carries the
           meaning.

           It began on this arm alone, as "the hardest of the four": the only
           one that starts on the public site, builds its own cart, asks for
           the partner code, fills the student form from scratch and gates
           payment behind it. `b2b2c-email` joined it on 2026-10-23, which
           turned the mark into something more useful than a difficulty rating
           — see the note there.

           ⚠ IT RIDES IN THE LABEL BECAUSE THE BAR IS PROTECTED CHROME. The
           dropdown draws whatever string the variant gives it; an icon slot
           would mean editing `DemoBar`, which is shared chrome and not this
           flag's to change. */
        label: '🔥 B2C Guest Checkout',
        description: 'No partner, nothing known. Student form empty, Payment closed until it is complete.',
      },
      {
        value: 'qr-social',
        label: 'QR code or social link',
        description: 'A partner\u2019s broadcast link: partner pricing, nobody identified, product options always asked.',
      },
      {
        value: 'b2b2c-verified',
        /* THE FIFTH ARM — 2026-10-27, Jillienne: "another invite flow, that
           includes a modal prior to the checkout flow that requires the first
           name, last name, and email address, and this will send a 6-digit
           pin to the users email that they will need to enter before they
           can continue with the checkout flow."

           It is the no-email arm with the proof moved FORWARD: instead of
           typing the address twice at checkout and setting the password from
           a mailed link afterwards, the learner proves the address before
           the checkout opens, and from there it behaves like the with-email
           arm — locked at checkout, password inline. The predicates in
           `inviteFlows.ts` say so; the modal is `VerifyEmailModal`. */
        label: 'B2B2C verified email',
        description: 'Partner invited them, no address. Name and email proven by a 6-digit code before checkout.',
      },
      {
        value: 'xcel-signed-in',
        /* THE SIXTH ARM — 2026-10-27, Jillienne: "another invite flow that is
           for a user that is already logged into the Xcel site, but when they
           complete their purchase, they will need to create a new password."

           A returning XCEL customer on the public site. The header knows
           them, checkout arrives filled from the account with Payment open
           and the email locked, no partner question is asked, and the
           confirmation page's password card says why a new password is
           needed. `signedIn` in `inviteFlows.ts` is the predicate. */
        label: 'Signed-in XCEL account',
        description: 'Already an XCEL customer, signed in. Checkout filled from the account; a new password after the order.',
      },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'order-confirmation-style',
    /* WHICH THANK-YOU PAGE THE GUEST FLOW ENDS ON — 2026-10-22, Jillienne: "i
       want another version of this thank you page, use a feature flag dropdown
       to show different ones".

       Receipt — the public site's own: full width, order number, Launch
                 Student Portal, the two Order Details panels.
       Split —   a dark receipt rail on the left and the topo background on the
                 right carrying a sign-in card, in the loading page's register.
                 On this one the learner must validate from their email before
                 they can log in.

       ⚠ TWO ENDINGS, NOT TWO SKINS. The receipt hands over a portal button and
       assumes the account is ready; the split screen sends them to their inbox
       first. That is a different promise about when they can start, which is
       the thing worth comparing.

       ⚠ THREE IS STILL A SEGMENTED GROUP, not a dropdown — the bar switches
       shape ABOVE three (`SEGMENTED_MAX`). A fourth style makes it the dropdown
       that was originally asked for, with nothing here to change. Three side by
       side is the better control for three anyway: the point is comparing them,
       and a popover hides two of the options while you look at the first. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    surfaces: ['invite'],
    group: 'Navigation',
    label: 'Thank you page',
    description:
      'Which confirmation the guest flow ends on. Receipt: the public site’s own — order number, Launch Student Portal, Order Details. Split: the confirmation as a dark receipt rail beside the topo background and a sign-in card, where the learner has to validate from their email before they can log in.',
    defaultEnabled: true,
    /* ⚠ `light` SINCE 2026-10-22 (was `receipt`). The receipt is still the
       public site's own ending and still one click away; this is the treatment
       the branch is putting forward. */
    defaultVariant: 'light',
    variants: [
      { value: 'receipt', label: 'Receipt', description: 'The public site’s own, full width.' },
      { value: 'split', label: 'Split', description: 'Dark receipt rail beside the topo background and a sign-in card.' },
      { value: 'light', label: 'Light', description: 'The same split, with the rail in warm paper rather than the dark ground.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'split-journey-rail',
    /* THE JOURNEY RAIL, AFTER THE EMAIL IS VALIDATED — 2026-10-22, Jillienne:
       "add a feature toggle that hides this section completely and on default
       only shows the last step section, centered in the screen."

       On —  the three-step "Your Journey at a Glance" panel on its charcoal
             ground, beside the password card.
       Off — nothing on the left at all, and the card centres itself in the
             page. THE DEFAULT.

       ⚠ OFF BY DEFAULT, WHICH IS THE ARGUMENT THIS FLAG MAKES. The learner has
       come back from their inbox to do exactly one thing — set a password —
       and a panel listing the months ahead competes with it at the moment it
       matters least. The rail is kept because it is a real option for this
       screen, not because the screen needs it.

       ⚠ IT ONLY GOVERNS THE VALIDATED STATE. Before validating, the left half
       is the RECEIPT, and that panel is doing a different job — proving the
       order exists while the learner is off in their mail. This toggle does
       not touch it. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    surfaces: ['invite'],
    group: 'Navigation',
    label: 'Journey rail',
    description:
      'The three-step “Your Journey at a Glance” panel beside the password card, after the learner validates their email. Off — the default — leaves the card centred on the page by itself.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'partner-code-ask',
    /* WHERE THE PARTNER CODE QUESTION IS ASKED — 2026-10-22, Jillienne: "i
       think we should explore a variant of this simply showing over the
       checkout screen in a simple modal instead of taking user to another page
       right away. make it a toggle to compare both versions?"

       Page — "Do you have a Partner Code?" is its own step between the cart
              and the checkout, which is what the design shows today.
       Modal — the same question over the checkout, so the learner never leaves
              the page they came to pay on.

       ⚠ A PRESENTATION AXIS, NOT A BEHAVIOUR ONE. Both arms ask the same
       question, take the same two answers and have the same consequence — Yes
       makes the purchase partner-attributed and the price moves. One shared
       component draws the question for both (`PartnerCodeAsk`), so the two
       cannot drift into being different questions, which is the thing that
       would make the comparison worthless.

       ⚠ ONLY THE FLOWS WITH NO PARTNER ALREADY see it at all. An invited
       learner's partner is on their invitation and a scanned code carries its
       own attribution; asking either whether they have a code is asking
       something the flow already answered. See `asksForPartnerCode`.

       ⚠ DEFAULT `modal` SINCE 2026-10-22 (was `page`). It opened on `page`
       because that is the arm the design showed first and the modal read as
       the thing being tried; the modal is now the one being taken forward, so
       it is what a bare load gets. Both arms are one click apart on the bar,
       and which becomes the Prototypes baseline is `promote-to-prototype`'s
       decision rather than this line's. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    surfaces: ['invite'],
    group: 'Navigation',
    label: 'Partner code ask',
    description:
      'Where “Do you have a Partner Code?” is asked on the flows that have no partner yet. Page: its own step between the cart and the checkout. Modal: the same question over the checkout, so the learner never leaves the page they came to pay on. Answering Yes makes the purchase partner-attributed on both arms, which is what moves the price.',
    defaultEnabled: true,
    defaultVariant: 'modal',
    variants: [
      { value: 'page', label: 'Page', description: 'Its own step between the cart and the checkout.' },
      { value: 'modal', label: 'Modal', description: 'Over the checkout — the learner never leaves the page.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'invite-missing-details',
    /* THE RECRUITER LEFT THE DETAILS BLANK — 2026-10-22, Jillienne's brief:
       "if the user clicks on the email invite, but the recruiter did not enter
       a state or line of authority for the user … we do not know what product
       to show them, we need to trigger a modal to show the users the options".

       OFF (the baseline): the invitation named the course, which is the story
       the email itself tells — Sunrise Bank invited Jordan to a specific
       package — and the invite door opens on that product.
       ON: it did not, so Invited Product Detail opens with a modal asking for
       the state and the line of authority, and the product is named from the
       answer.

       ⚠ DEFAULT OFF, which parts company with the usual "flags default ON on
       your branch" rule, on purpose. The email page is the flow's first screen
       and it names the course in the invitation's own words; an ON default
       would have every reviewer read that letter and then be asked what they
       are licensing for, which reads as a bug in the demo rather than as the
       case being explored. The control sits on the Design bar on these pages,
       one click away.

       ⚠ THE MODAL IS NOT THE FEATURE — the missing pair is, and the pair is
       what NAMES the product. `inviteMissingDetails.ts` carries the long form,
       including why the answer lives in the address rather than in page state. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    surfaces: ['invite'],
    group: 'Navigation',
    label: 'Invitation missing details',
    description:
      'On, the recruiter left the state and line of authority blank, so the invite door does not know what product to show: Invited Product Detail opens with a modal offering the options, and the product is named from the pick (carried through checkout and confirmation). Off, the invitation named the course and the flow opens on it.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'e2e-ends-at-password',
    /* THE INVITE & PURCHASE FLOW ENDS AT THE PASSWORD (2026-10-15,
       Jillienne: "it should END after user puts in a password"). ON (the
       baseline): Confirmation & Password's Confirm closes the flow on the
       page — it becomes a loading page, a spinner over "Taking you to your
       learning dashboard…", and nothing navigates (a "Password created" card
       until later the same afternoon). OFF: Eric's hand-off, which the row carried from the
       morning of 2026-10-15 until this flag — Confirm opens the demo's Home
       with the Affidavit modal over it (`?affidavit=1`). The modal and the
       hand-off are intact on the off arm, not archived. One conditional at
       the page's submit rather than a sibling page: the page is 300 lines
       and this changes only its last step. The Design bar's Page control
       still lists Home; this flag decides what CONFIRM does, not what the
       control can open.
       PROMOTED 2026-10-15 (promote-to-prototype): ON is the baseline on the
       invite row — its owners' (Afsana & Eric) decision, applied by
       Jillienne. No `owner`: it resolves to jill, whose call it was. */
    group: 'Navigation',
    label: 'Invite flow ends at the password',
    description:
      'On, Confirm on Confirmation & Password ends the Invite & Purchase flow there: the page becomes a loading page \u2014 a spinner over \u201cTaking you to your learning dashboard\u2026\u201d. Whether that page then hands off to Home is `e2e-loading-opens-home`. Off, Confirm opens the End-to-End Demo\u2019s Home with the Affidavit modal over it, immediately.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'e2e-loading-opens-home',
    /* THE LOADING PAGE HANDS OFF TO HOME (2026-10-16, Jillienne: "after the
       loading gif page, after 3 seconds, should transition to the Atlas
       Learning Home page"). The seam the released End-to-End row is built
       on: the invite door runs to the password, the loading page resolves,
       and the learner lands in Atlas Learning without a click.

       ⚠ THE FLAG IS NOT WHAT TELLS THE TWO ROWS APART — `?journey=full` on
       the End-to-End row's address is, and `endToEndDemo.ts` says why. A
       flag has ONE value per build and both rows open the same build, so a
       flag alone would hand off on BOTH or neither. The Invite & Purchase
       row (Afsana & Eric) carries no journey param and still ends at the
       spinner, which is their surface and their promoted baseline.

       What this flag is FOR is the promotion decision: default ON on the
       branch, so `promote-to-prototype` surfaces it and the hand-off becomes
       the baseline only when Jillienne says so. OFF restores exactly what
       `main` shipped on 2026-10-15 for both rows, without editing either
       row's address.

       ⚠ IT ALSO SITS ON TOP OF `e2e-ends-at-password`, which decides whether
       Confirm ends on a loading page at all. That one is the Invite scope's,
       and with it off there is no loading page and this flag never reads.

       The hand-off goes to the demo's Home WITHOUT `?affidavit=1`: the
       Affidavit modal is that flag's off-arm hand-off, a different one with a
       different purpose, and stacking a modal over the landing you just
       waited three seconds for buries it. */
    group: 'Navigation',
    label: 'Loading page opens Home',
    description:
      'On, the loading page waits three seconds and then opens the End-to-End Demo\u2019s Atlas Learning Home \u2014 but ONLY on the End-to-End row\u2019s walk, which carries ?journey=full. The Invite & Purchase row opens the same pages and still ends at the loading page. Off, neither row hands off. Only reads when \u201cInvite flow ends at the password\u201d is on.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'e2e-course-overview-opens-compass',
    /* THE ATLAS↔COMPASS SEAM (2026-10-16, Jillienne: "clicking Course
       Overview … will now link up with Anjani's Prototype"). On the
       End-to-End row's walk, the Atlas course card's Course Overview opens
       Compass Learning instead of doing nothing. Off, the button is inert
       again, which is what that walk had before.

       ⚠ THE WALK ONLY — `useCourseOverviewOpensCompass` ANDs this with
       `?journey=full`, so Eric's Atlas Learning tile is untouched. A flag
       alone would change both tiles, for the same reason `journey` exists
       at all: one value per build, two rows on that build.

       ⚠ NOTHING OF ERIC'S IS UNWIRED. His overview, Study Plan, Flashcards,
       Progress, Resources and Rubi Insights pages stay exactly where they
       are and stay reachable from the Atlas Top Nav, so he can keep working
       on them on his branch — Jillienne's condition when she asked for this.
       This flag changes ONE button's destination on ONE row's walk. */
    group: 'Navigation',
    label: 'Course Overview opens Compass',
    description:
      'On the End-to-End row\u2019s walk (?journey=full), the Atlas course card\u2019s Course Overview opens Anjani\u2019s Compass Learning. Off, it does nothing, as before. Eric\u2019s Atlas Learning tile is unaffected either way, and none of his course pages are removed.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'e2e-begin-opens-compass-session',
    /* BEGIN COURSE OPENS THE COMPASS SESSION (2026-10-16, Jillienne, with the
       button selected: "make this button go into the compass course"). The
       second half of the Atlas↔Compass seam — Course Overview reaches
       Anjani's DASHBOARD, this reaches a LESSON (`?section=compass&session=1`:
       the Contents rail, the video, Rubi beside it).

       ⚠ A SEPARATE KEY FROM `e2e-course-overview-opens-compass`, though the
       two are flipped together in practice. They are different destinations
       from two buttons sitting side by side, and a reviewer notices them
       separately — so they are promoted separately rather than as one
       "wire Atlas to Compass" switch that cannot be half-taken.

       ⚠ THE WALK ONLY, like its sibling: `useBeginOpensCompassSession` ANDs
       this with `?journey=full`, so Eric's Atlas Learning tile keeps the
       inert Begin Course he promoted. Off, this walk's button is inert too,
       which is what it was before. */
    group: 'Navigation',
    label: 'Begin Course opens the Compass session',
    description:
      'On the End-to-End row\u2019s walk (?journey=full), Begin Course on the Atlas course card opens Anjani\u2019s Compass session \u2014 the lesson view, not the dashboard. Off, it does nothing, as before. Eric\u2019s Atlas Learning tile is unaffected either way.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'e2e-session-keeps-atlas-header',
    /* THE WALK'S LESSON KEEPS A WAY HOME (2026-10-16, Jillienne: "this course
       needs to have a header that matches Atlas header so user can get back
       to HOME"). Begin Course now lands a reviewer inside a Compass lesson,
       and the session's shipped arm is FULL SCREEN with no Home in its own
       bar — so the walk ended somewhere with no way back to the product.

       On, `?journey=full` forces `compass-session-chrome`'s `in-shell` arm:
       the Atlas header sits above the session and Home works.

       ⚠ IT OVERRIDES ANJANI'S CONTROL RATHER THAN CHANGING ITS DEFAULT.
       `full-screen` is still what ships and still what her Compass tile
       opens — the arm is her decision, her surface. This is the End-to-End
       row borrowing the other arm for its own walk.

       ⚠ THE TWO BARS STACK on that arm (global header + the session's 53px
       bar, ~150px before lesson content). `compass-session-chrome`'s own note
       calls it the agreed state while the fix is decided; the walk takes it
       knowingly. If that fix lands, this flag is where to re-check. */
    group: 'Navigation',
    label: 'Compass session keeps the Atlas header',
    description:
      'On the End-to-End row\u2019s walk (?journey=full), the Compass session renders under the Atlas header so Home is reachable, instead of taking the whole screen. Off, the walk gets the shipped full-screen session. Anjani\u2019s Compass tile is unaffected either way, and the Course content control still works everywhere.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-session-centred',
    /* THE LESSON IS A CENTRED COLUMN (2026-10-16, Jillienne, with the session's
       `<main>` selected: "the course content should be centered in the
       screen"). `cardStyle` and `footerStyle` were already capped at 680 and
       the segment label was not, so on a wide screen the three sat against the
       left edge of a column up to 1187px — the label stretching full width
       while the card beneath it stopped short, which reads as a layout bug
       rather than a measure.

       ⚠ A PLAIN FLAG, NOT `surface: 'design'`, and that is deliberate:
       `promote-to-prototype` lists design controls separately BECAUSE THEY
       NEVER REACH PROTOTYPES, and this is meant to ship, not to be a toggle on
       a bar.

       ⚠ IT IS ANJANI'S SURFACE (`compass:session`), which is why it is flagged
       at all rather than merged as a three-line layout fix: on by default so
       it shows as a Compass-scope candidate at promotion, and off restores the
       left-aligned column exactly, so disagreeing costs one word. */
    group: 'Widgets',
    label: 'Compass session content is centred',
    description:
      'On, the Compass session\u2019s lesson column (label, card and footer) is centred in the space left by the Contents rail and Rubi, at the 680px measure the card already used. Off, it sits against the left edge as before.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-key-terms-rating',
    /* KEY TERMS, ANJANI'S WAY (2026-10-16, Jillienne with the beat selected:
       "This is not matching Anjanis").

       What the React port had wrong was the INTERACTION, not the styling. It
       drew a two-column grid of small cards saying "Flip to check", so the
       flip was the whole gesture. In hers THE RATING IS THE FLIP: a full-width
       card per term, "How sure are you before you flip?", and answering —
       I know this / Not sure / New to me — is what reveals the definition, the
       example and "Practice this with Rubi". Her question only means anything
       if answering it is the thing that flips.

       Ported from `compKeyterm` and `rate()` in her
       `xcel-compass-type-scale-preview.html`, not from a screenshot: the copy,
       the levels, their order and the tag lines are hers verbatim.
       `KeyTermsBeat` is untouched beside `KeyTermsBeatV2` — the sibling rule —
       so off is exactly the old grid.

       ⚠ ANJANI'S SURFACE. On by default so it shows as a Compass-scope
       candidate at promotion rather than riding in with a merge. */
    group: 'Widgets',
    label: 'Key terms: rate before you flip',
    description:
      'On, the Compass session\u2019s Key terms beat is Anjani\u2019s card \u2014 one per term, with Save, \u201cHow sure are you before you flip?\u201d and three confidence buttons that reveal the definition, the example and Practice this with Rubi. Off, the original two-column \u201cFlip to check\u201d grid.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'e2e-walk-journey-steps',
    /* THE STUDY JOURNEY'S STEPS, TIDIED FOR THE WALK (2026-10-16, Jillienne,
       selecting them one at a time). Step 2's detail becomes the
       state-exam-date prompt in place of "150 scored questions in 165
       minutes. 70% to pass."; Step 3 drops "Apply online, then submit your
       fingerprints."; the "<State> State Requirements" button goes.

       ⚠ THE PROMPT IS MOVED, NOT COPIED — it stood above the steps and is now
       Step 2's detail, or the same question appears twice.

       ⚠ THE WALK ONLY. Eric's Atlas Learning tile keeps the steps he
       promoted, figures and button intact; `useWalkStudyJourneySteps` ANDs
       this with `?journey=full`. Off, this walk looks like his again. */
    group: 'Widgets',
    label: 'Walk: tidy the Study Journey steps',
    description:
      'On the End-to-End row\u2019s walk (?journey=full), Step 2 asks \u201cDo you know your state exam date?\u201d instead of reciting the exam figures, Step 3 drops its detail line, and the State Requirements button is not drawn. Off, the steps are as Eric promoted them. Eric\u2019s Atlas Learning tile is unaffected either way.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-check-confidence',
    /* KNOWLEDGE CHECK, ANJANI'S WAY (2026-10-16, Jillienne: "Fix Knowledge
       Check Next to match anjanis").

       Same shape of mismatch as Key terms, and the same lesson: what the port
       had wrong was the ORDER, not the styling. It drew radios and revealed
       the rationale the moment one was chosen. Hers asks a question in
       between — pick an option, then "Before you see the answer — how sure are
       you?" — and only then locks the answer, marks right and wrong and
       explains. Ask after the reveal and you are asking how sure someone was
       about something already on screen.

       ⚠ RUBI SPEAKS ON TWO OF THE FOUR OUTCOMES, not all of them: a right
       answer the learner did not trust, and a wrong one they did. Right-and-
       sure needs nothing said; wrong-and-unsure already knows. Showing
       feedback every time is the easy way to lose the whole idea.

       Ends on her readout — "On pace" or "A bit tight" — once every question
       is answered. Ported from `compCheck`, `pick`, `conf`, `answer` and
       `showReadout` in her `xcel-compass-type-scale-preview.html`; the copy is
       verbatim. `CheckBeat` is untouched beside it as the off arm.

       ⚠ ANJANI'S SURFACE. On by default so it shows as a Compass-scope
       candidate at promotion rather than riding in with a merge. */
    group: 'Widgets',
    label: 'Knowledge check: rate before the reveal',
    description:
      'On, the Compass session\u2019s Knowledge check is Anjani\u2019s \u2014 lettered option buttons, \u201cQuestion N of M\u201d, a confidence question before the answer is shown, then right/wrong marking, the rationale, a word from Rubi when confidence and outcome disagree, and a readout at the end. Off, the original radio list that revealed the rationale on pick.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-infographic-chart',
    /* THE INFOGRAPHIC DRAWS HER CHART (2026-10-16, Jillienne: "This section is
       also needing to be updated to Anjanis").

       ⚠ THE PLACEHOLDER IT REPLACES RESTED ON A WRONG PREMISE, and that is
       the thing worth recording. Its note said the source authors this beat
       with "no chart data behind it, so there is nothing to plot" — and
       inventing a curve would indeed have been inventing the teaching. But
       her `compInfographic` DOES draw it: a HAND-AUTHORED SVG, not a series
       plotted from data. There was nothing to invent because the drawing
       already existed; it just was not where a search for data would look.

       On: her geometry point for point — the axis, four grid lines, a dotted
       flat Term line and the Permanent curve rising to $30k at Yr 30 — plus
       her "The takeaway" box. Off: the "Chart to come" placeholder.

       Her hex is mapped onto this repo's tokens (Permanent → primary-700,
       Term → warning-700), which is the house rule and also what keeps the
       chart right in dark mode.

       ⚠ ANJANI'S SURFACE. On by default so it shows as a Compass-scope
       candidate at promotion rather than riding in with a merge. */
    group: 'Widgets',
    label: 'Infographic: draw the chart',
    description:
      'On, the Compass session\u2019s Infographic beat draws Anjani\u2019s cash-value chart \u2014 term flat at zero against permanent rising over thirty years \u2014 with her \u201cThe takeaway\u201d box under it. Off, the \u201cChart to come\u201d placeholder.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-pace-style',
    /* HOW HARD THIS LEARNER STUDIES — 2026-10-20, Jillienne: "pacing can be
       Crammer, Average, or Thorough. We need to incorporate a different icon
       based on the Pacing."

       ⚠ A DEMO CONTROL, NOT A DESIGN ONE, and that was the call. The two bars
       split on WHO the question is about: the amber bar says how the product
       behaves for different LEARNERS (progress, tier, course, access window),
       the cyan one says what is open inside an exploration (fonts, colour,
       layout axes). How fast somebody studies is a property of the learner,
       so it belongs beside Progress and Expires — and a stakeholder can then
       see all three pacings without being told to open the robot menu.

       ⚠ IT DRIVES THE ARITHMETIC, NOT A LABEL. The value is a `StudyStyle`,
       already a `studyPace` input (`STYLE_FACTORS`), so it multiplies the
       hours and the week goal, the hours a week, the completion date, the
       pace's NAME and its icon all move together off one choice. A control
       that changed only the name would put "Crammer" over an Average plan's
       figures, which is the mismatch this surface has been bitten by twice.

       ⚠ THE VALUES ARE `PLANNER_PACES`' IDS. The labels and hints below are
       that list's own, restated here because the catalog cannot import
       fixtures — if they drift, the planner and the Home disagree about what
       "Crammer" means. `STYLE_FACTORS` was renamed to match on the same day;
       see its note.

       ⚠ NO `surface` FIELD, AND THAT IS HOW A DEMO CONTROL IS DECLARED. The
       type only admits `surface: 'design'`; omitting it is what keeps a flag
       off the cyan bar. Being off that bar does not put it on the amber one
       either — `DemoControlsBar`'s own `SHOW_CONTROL` list decides what the
       amber bar carries, because that list says what the PRODUCT demos rather
       than what any one exploration is exploring. Both edits are needed; this
       is only the first. */
    group: 'Learner',
    label: 'Pacing',
    description:
      'How hard the learner studies, as a multiplier on the hours the course claims \u2014 Crammer (x0.75, head down, done fast), Average (x1, what most learners pick) or Thorough (x1.3, slower, more spacing). It moves the week goal, the hours a week, the completion date, the pace name and the pace icon together.',
    defaultEnabled: true,
    defaultVariant: 'average',
    variants: [
      { value: 'crammer', label: 'Crammer — head down, done fast' },
      { value: 'average', label: 'Average — what most learners pick' },
      { value: 'thorough', label: 'Thorough — slower, more spacing' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-pace-standing',
    /* HOW THE LEARNER IS DOING, ON THE ATLAS PACE CARD (2026-10-19,
       Jillienne: "we need this type of messaging to be considered for the
       study pace section for when a user is no longer at 0%").

       Past 0% the card's sentence was still "Your default recommended study
       pace is just a starting point" — true on day one and stale every day
       after, because by then the learner HAS a pace and the interesting
       thing is how it is going. This picks which of those five states the
       demo shows.

       ⚠ AT 0% IT IS IGNORED, and that is the point of the ask. Nobody has a
       standing before they start, so the starting-point copy stays there —
       which is also why `no-data` is a separate arm from Not Started: it is
       "this WEEK is empty", not "the course is".

       ⚠ THE SAME FIVE ARMS AS `hybrid-pace-standing`, and the same sentences
       — `paceStanding.ts` is shared so the two cards cannot report one
       standing two ways. A separate flag because that one is scoped to
       Anjani's `hybrid-pacing` version and this is Eric's surface; one flag
       across both would put her control on his bar.

       ⚠ SCENARIO DATA. The average in the sentence is the GOAL scaled by the
       arm, not a reading of anything. When real week minutes land, the arm
       becomes a preview of a real state — see `observedHoursFor`. */
    /* ⚠ OFF THE DESIGN BAR — 2026-10-20, Jillienne: "remove pace standing. we
       looped that into the Pacing for the demo controls."

       ⚠ THE TWO ARE NOT THE SAME AXIS, and it is worth being exact because
       the reason given for removing this one describes the other.
       `dashboard-pace-style` ("Pacing", amber bar) is Crammer / Average /
       Thorough — how HARD the learner studies, a multiplier on the hours that
       moves the week goal, the completion date and the pace icon. This flag
       is on-track / ahead / behind / off-track / no-data — how the learner is
       DOING against that goal, which is the sentence the card prints past 0%.
       Pacing does not carry those five and nothing was folded into it.

       ⚠ SO FOUR STANDINGS LEAVE THE BAR, not the product. `on-track` is the
       default and what the card says; Behind, Off track, Ahead and No data
       are reachable from the Feature Flag panel (this flag was already listed
       there) and by `?ff=`. At 0% it is ignored entirely — the card keeps its
       starting-point copy — so the landing screen is unaffected either way.

       ⚠ AND THE SIBLING IS STILL ON ANJANI'S BAR. `hybrid-pace-standing` is a
       separate flag scoped to `hybrid-pacing` with the same five arms and the
       same shared `paceStanding.ts` sentences; it is untouched.

       See `atlas-pace-standing-control` in archivedItems.ts. */
    group: 'Widgets',
    label: 'Pace standing',
    description:
      'What the Atlas Home\u2019s Study pace section says once the learner is past 0%: on track, ahead, behind, off track, or no data logged this week. At 0% it is ignored \u2014 there is no standing before you start, so the card keeps its starting-point copy. \u26a0 The average quoted is the goal scaled by the arm, not a measurement.',
    defaultEnabled: true,
    defaultVariant: 'on-track',
    variants: [
      { value: 'on-track', label: 'On track' },
      { value: 'ahead', label: 'Ahead of goal' },
      { value: 'behind', label: 'Behind — recoverable' },
      { value: 'off-track', label: 'Off track — adjust the goal' },
      { value: 'no-data', label: 'No data yet' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-home-align',
    /* THE HOME COLUMN, TWO WAYS (2026-10-19, Jillienne: "add a variant where
       all of these are left aligned").

       ⚠ IT IS THE EYEBROWS ONLY (2026-10-19, narrowed within the hour: "for
       the left aligned variant, make that just for the eyebrow text"). The
       first pass left-aligned the whole stack — the dials, the pace lines
       and the completion date with them — and that was more than the ask.
       `left` moves the four LABELS to the column's edge; everything they
       label stays on the centre axis.

       ⚠ ONE AXIS, THREADED AS A VALUE rather than forked into siblings.
       CLAUDE.md says copy the component instead of threading a conditional,
       and that is right when two designs diverge; this is one `textAlign`
       on one shared style, and forking the pace card, the readiness card
       and the eyebrow module over it would leave two copies of everything
       built today to keep in step. If the arms ever differ by more than
       their eyebrows, fork them then.

       ⚠ ON THE DESIGN BAR, so not a promotion candidate — the DEFAULT still
       renders for everyone. Same trade-off as `atlas-pace-card` and
       `atlas-exam-prompt`, written down for the same reason. */
    /* ⚠ OFF THE DESIGN BAR — 2026-10-20, Jillienne: "Centred has been decided,
       we can remove this option from Design Controls". Third control retired
       that afternoon on the same rule, after Navigation and Exam date prompt:
       the bars carry OPEN questions, and `center` is both the default and the
       answer. `left` still renders and is in `REBRAND_FLAGS`.
       See `atlas-home-align-control` in archivedItems.ts. */
    group: 'Widgets',
    label: 'Section labels',
    description:
      'Where the Atlas Home column\u2019s four section labels sit \u2014 Course progress, Study pace, Estimated completion, Exam readiness. Centred (default): on the same axis as the dials and figures under them. Left: against the column\u2019s left edge. Only the LABELS move; the dials and the pace lines stay centred on both arms. \u26a0 The ESTIMATED COMPLETION and state-exam labels stopped following this on 2026-10-20, when those rows were pinned label-left / figure-right \u2014 neither arm moves them now.',
    defaultEnabled: true,
    defaultVariant: 'center',
    variants: [
      { value: 'center', label: 'Centred' },
      { value: 'left', label: 'Left aligned' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-exam-prompt',
    /* STEP 2's EXAM-DATE PROMPT, TWO WAYS (2026-10-19, Jillienne: "add a
       variant of this where the information is in a container, light blue to
       match the top widget, When is your exam is Bold, and there is a subtext
       of line explaining that entering your exam date will help us structure
       your study pace accordingly").

       `row` (default) is what Step 2 became earlier the same day: a stop on
       the journey — open ring, the question in the list's own type, a
       secondary Add Date beside it, the spine running down to Exam
       Information. `card` lifts the same question out of the list into a
       Primary 100 container with the question BOLD and a sentence under it
       saying what the date buys. The two argue about whether this belongs in
       the list or above it.

       ⚠ THE CARD IS THE DEFAULT, asked for within the hour of the variant
       itself (2026-10-19, Jillienne: "default this page to 0%, and readiness
       off, affidavit off, Exam Prompt as Card, study pace card as Ring").
       It was `row` for the length of one commit, on the reading that "add a
       variant" leaves the original in place; the follow-up settled it the
       other way, and the row is what is now kept beside it.

       ⚠ ON THE DESIGN BAR, and therefore NOT a promotion candidate —
       `promote-to-prototype` lists design controls separately because they
       never reach Prototypes. The DEFAULT still renders for everyone, so
       whichever arm is default here is what ships. Same trade-off as
       `atlas-pace-card`, written down for the same reason. */
    /* ⚠ OFF THE DESIGN BAR — 2026-10-20, Jillienne: "Card has been decided,
       we can remove this from the Design COntorls". It was `surface: 'design'`
       + `versions: ['eric-atlas-e2e']`, which is the sanctioned way ONTO the
       cyan bar; dropping both is the way off it. Same shape as the Navigation
       control leaving the amber bar the same day — a decided axis needs no
       control.

       ⚠ THE FLAG AND BOTH ARMS SURVIVE, and that is the whole of the archive
       convention here: `card` is the default and what both Homes draw, `row`
       still renders, and the flag is in `REBRAND_FLAGS` so the Feature Flag
       panel can still reach it. Without that last part it would be
       `?ff=`-only, which `FlagPanelScope.test.ts` correctly calls a flag you
       can only get at by hand-editing a URL.

       See `atlas-exam-prompt-control` in archivedItems.ts. */
    group: 'Widgets',
    label: 'Exam date prompt',
    description:
      'How Step 2 asks for the state exam date on the End-to-End walk. Row: a stop on the journey — open ring, the question in the list\u2019s type, a secondary Add Date beside it. Card (default): the question in a Primary 100 container, bold, with a line under it saying that the date is what the study pace is built from. Exam Information stays below either way.',
    defaultEnabled: true,
    defaultVariant: 'card',
    variants: [
      { value: 'card', label: 'Card' },
      { value: 'row', label: 'Row (as a stop)' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'home-breakpoint',
    /* THE DEVICE BREAKPOINT TOOL — 2026-10-30, Eric: "create a design tool … for device breakpoints. Then … versions using
       the breakpoints … for the learner homepage so that I can adjust each breakpoint as needed."

       live    — no frame: the app at the browser's own width, as before. THE DEFAULT.
       mobile / tablet / desktop / wide — the app drawn in a viewport of exactly that size (`HOME_BREAKPOINTS`,
                 src/data/homeBreakpoints.ts), scrolling inside it, with the size captioned above.

       Each breakpoint's Home layout is its OWN stylesheet in src/styles/home-breakpoints/, scoped by the frame's
       `data-home-bp`, so a change for Mobile Portrait cannot move Desktop. Off (`live`), none of them applies and the Home is
       the baseline untouched.

       ⚠ A DESIGN CONTROL, so it never reaches Prototypes; the stylesheets ride only inside the frame. A breakpoint layout
       that should SHIP is a media query in the product's own styles, decided at merge. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    group: 'Layout',
    label: 'Breakpoint',
    description:
      'Draws the app at a device breakpoint: Live (default, the browser\u2019s width), Mobile Portrait 402 \u00d7 874, Tablet Portrait 820 \u00d7 1180, Desktop 1366 \u00d7 650 or Desktop Wide 1920 \u00d7 1080. Each breakpoint has its own Home stylesheet.',
    defaultEnabled: true,
    defaultVariant: 'live',
    variants: [
      { value: 'live', label: 'Live', description: 'No frame — the browser\u2019s own width.' },
      { value: 'mobile', label: 'Mobile 402', description: 'Mobile Portrait, 402 \u00d7 874.' },
      { value: 'tablet', label: 'Tablet 820', description: 'Tablet Portrait, 820 \u00d7 1180.' },
      { value: 'desktop', label: 'Desktop 1366', description: 'Desktop, 1366 \u00d7 650.' },
      { value: 'wide', label: 'Wide 1920', description: 'Desktop Wide, 1920 \u00d7 1080.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-pace-card',
    /* THE STUDY PACE CARD, TWO WAYS (2026-10-16, Jillienne: "lets add a
       component variant for this section. update to this new UI, keep the
       other one accessible from the dropdown").

       `ring` (default) is the dial card — Your study pace, one percentage, the
       week goal and Customize Your Pace. `states` is what was there: the tan
       `AtlasCourseProgressStates`, pressable through five states of the
       journey. Both read the same `studyPace` model, so they cannot disagree
       about the plan — only about how much of it to show at once.

       ⚠ ON THE DESIGN BAR, which is what "accessible from the dropdown"
       means: `surface: 'design'` plus `variants` draws a radiogroup there,
       scoped by `versions` to the bar of the version it belongs to.

       ⚠ AND THEREFORE NOT A PROMOTION CANDIDATE. `promote-to-prototype` lists
       design controls separately BECAUSE THEY NEVER REACH PROTOTYPES — the
       DEFAULT still renders for everyone, so the ring does ship, but it will
       not come up as a decision at merge the way the other changes today do.
       If this should be a baseline decision rather than a designer's toggle,
       it wants `surface` dropped and a plain variant flag instead. Worth
       being deliberate about, which is why it is written down. */
    /* ⚠ OFF THE DESIGN BAR — 2026-10-20, Jillienne: "ring has been decided".
       Fourth and last of the afternoon's retirements.

       ⚠ THIS ONE CHANGES WHAT HAPPENS AT MERGE, and the flag's own note above
       is where that was written down: a design control "never reaches
       Prototypes — `promote-to-prototype` lists them separately for exactly
       that reason — so the ring SHIPS (it is the default and defaults render)
       but will not come up as a decision at merge the way the rest of today's
       work does. That is a consequence of asking for a dropdown, not an
       oversight." Without `surface: 'design'` it IS a promotion candidate
       now, which is the honest place for a decided default to sit.

       `states` still renders and is in `REBRAND_FLAGS`.
       See `atlas-pace-card-control` in archivedItems.ts. */
    group: 'Widgets',
    label: 'Study pace card',
    description:
      'Which Study Pace card the Atlas Home draws. Ring (default): the progress dial, the week goal and Customize Your Pace. States: the tan card that steps through Study pace, Readiness and the State exam. Both read the same pace model.',
    defaultEnabled: true,
    defaultVariant: 'ring',
    variants: [
      { value: 'ring', label: 'Ring' },
      { value: 'states', label: 'States (as it was)' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'compass-resume-opens-session',
    /* RESUME LESSON OPENS THE SESSION (2026-10-16, Jillienne: "Learn > Resume
       lesson should take user to the video screen"). It opens the session at
       its FIRST BEAT, the video.

       ⚠ IT WAS INERT ON PURPOSE, and the reason still stands — which is why
       it is wired this way and not the other. `CompassCourseLanding`'s own
       note refused to wire it because doing so "would assert a mapping nobody
       has made between her nineteen chapters and the player's table of
       contents". That mapping still does not exist: nineteen chapters, one
       lesson. Opening the session at the video claims nothing about WHICH
       lesson it is; mapping the row to a chapter would have been the
       assertion that note refused.

       What changed is the balance. A button drawn as an action and doing
       nothing reads as broken to a reviewer walking the product, and that is
       a worse problem than a demo that always opens the same lesson.

       ⚠ SO THE ROW'S PROGRESS BAR AND THE LESSON DO NOT AGREE, and cannot
       until the mapping exists — the bar is the chapter's, the lesson is the
       fixture's. Off restores the inert button.

       ⚠ ANJANI'S SURFACE. On by default so it shows as a Compass-scope
       candidate at promotion. */
    group: 'Navigation',
    label: 'Learn: Resume lesson opens the session',
    description:
      'On, Resume lesson on the Compass Learn page opens the lesson session at its first beat \u2014 the video. Off, the button is drawn and inert, as it was. \u26a0 It always opens the SAME lesson: the landing lists nineteen chapters and the player holds one, and no mapping between them exists, so the row\u2019s progress bar and the lesson it opens do not agree.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-readiness-section',
    /* THE READINESS SECTION, ON OR OFF (2026-10-16, Jillienne: "add a toggle
       in design control to hide the readiness section").

       ⚠ A DESIGN CONTROL, NOT A DEMO ONE, and the distinction is why it is
       here rather than beside Progress: whether the column CARRIES a
       readiness section is a question about the layout being explored, not
       about the learner being demonstrated. Progress moved the other way the
       same day for the mirror of that reason — it drives what a stakeholder
       sees, so it belongs on the amber bar.

       ⚠ NO `variants`, so the design bar draws it as an ON/OFF rather than a
       radiogroup — the sanctioned way onto that bar, and why this flag edits
       no bar file.

       ⚠ OFF BY DEFAULT since the same day (Jillienne: "when readiness is
       off, (on default)"). The toggle was added to hide the section, and
       hidden is the state she wants the column to open in — the control is
       for putting it BACK while a decision is open, not for taking it away.

       On, the section is drawn INCLUDING THE RULE ABOVE IT; off, two rules go
       with it — that one, and the BOTTOM rule of Estimated completion, which
       separates this card from what follows. With nothing following, it is a
       line under the last thing on screen. */
    surface: 'design',
    versions: ['eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Readiness section',
    description:
      'Whether the Atlas Home\u2019s left column carries the Exam readiness section. Off by default. On, it is drawn with the rule above it; off, that rule and Estimated completion\u2019s bottom rule both go, because neither has anything left to divide.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-header-v2',
    /* THE ATLAS HEADER, ON THE DESIGN BAR (2026-10-13, Eric's request:
       "replace the nav … with the new nav"). On (default), Eric's Atlas
       versions draw `AtlasHeader` — Figma "Atlas UX Design" 333:594, the
       two-row header with the eyebrow bar and the My Courses / profile
       dropdowns — in place of the 60px slim header and its Top Nav. Off, the
       slim header exactly as it was. Desktop only; Eric's versions only (the
       list is `ATLAS_HEADER_V2_VERSIONS`, atlasHeaderV2.ts). */
    surface: 'design',
    owner: 'eric',
    // Off WIP's and White's bars (2026-10-14, Eric's request): they keep the
    // default, the two-row header.
    versions: ['eric-atlas-v2'],
    group: 'Navigation',
    label: 'Header',
    description:
      'The two-row Atlas header (Figma 333:594): an eyebrow bar with English and Help, then the logo, Home, a My Courses dropdown, notifications and a profile dropdown. Off: the 60px slim header with its Top Nav, as before.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-white-top-nav',
    /* ERIC/ATLAS WHITE's TOP NAV, ON THE DESIGN BAR (2026-10-12, Eric's
       request). Static — the Top Nav as it is (Home, Course Overview).
       Dropdown — Figma 323:2001: the second button reads "My Courses" and
       opens a dropdown (All Courses, then each active course) that picks the
       course White's Home shows instead of opening the course Overview. Home
       has no dropdown. White only until 2026-10-13, when Eric/Atlas WIP took
       the same control (Eric's request: "update this nav to the nav that is in
       the White version"). One flag, so the pick is shared by both. */
    /* OFF THE DESIGN BAR (2026-10-14, Eric's request: hide it on WIP and
       White, its only versions). Not `surface: 'design'` any more — an empty
       `versions` would follow Eric to every version — so it keeps its default,
       Static, with no control. Restore the line below to bring it back. */
    // surface: 'design',
    owner: 'eric',
    versions: ['eric-atlas-v3', 'eric-atlas-white', 'eric-atlas-e2e'],
    group: 'Navigation',
    label: 'Top Nav',
    description:
      'Eric/Atlas White\u2019s header buttons. Static (default): Home and Course Overview, as on the other versions. Dropdown (Figma 323:2001): the second button becomes \u201cMy Courses\u201d with a dropdown \u2014 All Courses opens My Courses; each course makes itself the one White\u2019s Home shows.',
    defaultEnabled: true,
    defaultVariant: 'static',
    variants: [
      { value: 'static', label: 'Static' },
      { value: 'dropdown', label: 'Dropdown' },
      // Home Only (2026-10-12, Eric's request): no second button at all.
      { value: 'home-only', label: 'Home Only' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-v3-link-tiles',
    /* ERIC/ATLAS V3'S LINK TILES, ON THE DESIGN BAR (2026-10-09, Eric:
       "replace these with the attached version but save the current ones as
       possible versions"). Stacked — Figma 269:8778, the default: a big thin
       icon over "3 Certificates available" / "2 Active courses", the whole
       tile the link. Inline — the 2026-10-08 tiles (icon beside the count and
       a View link), kept as the alternative. V3 only. */
    /* OFF THE DESIGN BAR (2026-10-14, Eric's request: hide it on WIP and
       White, its only versions). Not `surface: 'design'` any more — an empty
       `versions` would follow Eric to every version — so it keeps its default,
       Stacked, with no control. Restore the line below to bring it back. */
    // surface: 'design',
    owner: 'eric',
    versions: ['eric-atlas-v3', 'eric-atlas-white', 'eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Link tiles',
    description:
      'The Certificates / Courses tiles at the top of Eric/Atlas V3’s left column. Stacked (default, Figma 269:8778): the icon over the words, the whole tile a link. Inline: the earlier tiles, icon beside the count with a View link.',
    defaultEnabled: true,
    defaultVariant: 'stacked',
    variants: [
      { value: 'stacked', label: 'Stacked' },
      { value: 'inline', label: 'Inline' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    key: 'atlas-v3-progress',
    /* ERIC/ATLAS'S PROGRESS — ON THE DEMO BAR SINCE 2026-10-16 (Jillienne:
       "the progress from the Design Controls needs to move up into the Demo
       Controls"). It was `surface: 'design'`, Eric's, from 2026-10-09: "a
       Progress dropdown … that overrides the Demo Progress dropdown", just
       for V3.

       WHY IT MOVED: it now drives the READINESS bands as well as the ring, so
       it decides what a stakeholder sees on two cards rather than what one
       designer is exploring — which is the line between the two bars.

       ⚠ IT REPLACES THE GENERIC PROGRESS ON THESE VERSIONS rather than
       joining it. `dashboard-progress-state` is still the demo bar's Progress
       everywhere else; on the versions below, `DemoControlsBar` draws THIS
       one instead, so there is one "Progress" on the bar at a time and it
       always drives what is on screen. Jillienne's call, asked and answered —
       two progress dropdowns side by side was the alternative.

       ⚠ THE FIVE STATES ARE A READINESS LADDER NOW: 0% Not Started, 14%
       Beginner, 36% Developing, 75% Proficient, 100% Ready. Milestone and
       Course Expired are gone from the list — the states exist to show the
       readiness bands stepping, and those two were not points on that scale.

       ⚠ AND READINESS IS NOT COMPLETION. 100% progress showing Ready is the
       demo's shorthand: somebody can finish a course and not be ready.
       Jillienne flagged it the same day as its own pass — when real scoring
       lands, this straight map from progress is the thing that has to go. */
    /* ⚠ NO `surface`. That field means "draw me on the DESIGN bar" and is
       the only bar a flag can reach declaratively — the demo bar is
       hand-built JSX (see the two-bars table in CLAUDE.md), so a control gets
       there by being rendered in `DemoControlsBar`, which is where this one
       now is. Dropping `surface` is what takes it OFF the design bar.
       `versions` is kept as the record of where it applies; the bar gates on
       the same list. */
    versions: ['eric-atlas-v3', 'eric-atlas-white', 'eric-atlas-e2e'],
    group: 'Widgets',
    label: 'Progress',
    description:
      'Which Course progress state Eric’s Atlas Home shows — the ring, the readiness band, how many Pre-Licensing Lessons are done, and how far down Step 1 the green checks reach. The first four rungs are the readiness ladder (Not Started 0%, Beginner 14%, Developing 36%, Proficient 75%); the five after them walk Step 1’s own rows, finishing at Ready 100%. Replaces the demo bar’s generic Progress on these versions. ⚠ Readiness tracks progress here for demonstration only — finishing a course does not make a learner ready. ⚠ The five Step 1 rungs’ percentages are INVENTED demo figures.',
    defaultEnabled: true,
    defaultVariant: 'not-started',
    /* ⚠ BUILT FROM THE LADDER, NOT TYPED (2026-10-16). The five states were
       listed here AND in `V3_PROGRESS` AND in `V3_READINESS_FOR` — three
       copies of one list, so a rung could reach the dropdown and not the
       Home, which is exactly how a control comes to look broken. Adding a
       rung is now an edit to `atlasProgressLadder.ts` alone. */
    variants: ATLAS_PROGRESS_LADDER.map((r) => ({ value: r.key, label: r.label })),
    page: 'dashboard-rebrand',
  },
  {
    key: 'dashboard-heading-font',
    /* ON THE DESIGN BAR — 2026-10-05.
       The heading typeface — a TYPOGRAPHY decision, which is the first thing the
       ask named ("fonts, the brand colors"). Nothing about it tells a
       stakeholder how the product behaves for a learner. */
    /* ⚠ OFF THE DESIGN BAR — 2026-10-20, Jillienne: "Heading font = Playfair.
       This can be removed." Seventh and last of the afternoon's retirements.

       ⚠ SHE IS RIGHT ABOUT PLAYFAIR AND IT IS NOT THIS FLAG, which is the
       better reason to remove it. Measured on Jill/Atlas-Main: the Atlas
       Home's titles compute to `Playfair, Georgia, serif` because they read
       `--font-heading-serif`, while this control re-points `--font-heading`
       (Lato there, and still Lato with the control on `serif`). So on the
       surface being explored it changes nothing you can see — a control whose
       name promises the page's headings and does not reach them is worse than
       no control.

       ⚠ PLAYFAIR COMES FROM SOMEWHERE ELSE AGAIN, and the something else is
       not `atlas-heading-font` either: that flag's `versions` are
       `eric-atlas-v1`, `eric-atlas-v2` and `discoverability-atlas-compass-nav`,
       none of which is this version or the End-to-End Demo. It is the token
       itself. Worth knowing before anyone goes looking for a control to
       change it with.

       ⚠ IT IS NOT INERT EVERYWHERE. `--font-heading` is read by
       `JumpBackInWidget`, `CourseEntryCard` and the `tokens.css` serif block
       on the Dashboard Rebrand routes, so the arm still does something on
       surfaces that use it — which is why the flag and both arms stay, with
       the Feature Flag panel row it already had.

       See `dashboard-heading-font-control` in archivedItems.ts. */
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
    // READY: the axis the demo exists to show — an empty dashboard vs. a
    // populated one. Nothing about it is unsettled.
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
    /**
     * THE COURSE AXIS — 2026-10-15, Jillienne's brief. A Demo Controls
     * dropdown; `courseFixtures.ts` says what the axis is and
     * `DemoControlsBar` draws it.
     *
     * ⚠ IT IS NOT THE EDUCATION TYPE, AND IT IS NOT NEW YORK. The flag above
     * picks the JOURNEY (CE renewal / qualifying / exam prep); the qualifying
     * journey has demoed New York since 2026-09-16 and keeps doing so. This
     * picks which pre-licensing COURSE the Florida-authored surfaces —
     * Readiness, the Study Plan, the Compass content tree, the Exam Prep band
     * — are showing. Two axes, two questions.
     *
     * ⚠ DEFAULTS `fl` + `unregulated` SO `main` IS UNCHANGED. Every surface
     * this reaches was authored against Florida with free navigation, so the
     * committed defaults are "what the dashboard already did" and nothing
     * moves until a reviewer touches the control. Confirmed with Jillienne
     * 2026-10-15 before building.
     *
     * ⚠ NOT IN `REBRAND_FLAGS`, deliberately — it has a dedicated dropdown on
     * the always-visible Demo Controls bar, so a panel row would be a
     * redundant and worse copy of a control already on screen. Same call
     * `dashboard-progress-state` and `dashboard-education-type` carry, and
     * `FlagPanelScope.test.ts` is where that exclusion has to be DECLARED or
     * the suite fails.
     */
    key: 'dashboard-course-state',
    label: 'Course',
    description:
      'Which licence the dashboard demos — New York, Florida or Texas Life & Health. It re-points every course-aware surface at that jurisdiction’s own content: the Current Learning Path band and its Jump Back In card, the Study Journey and the Get Licensed steps under it, the Exam Readiness breakdown and its facts table, the Study Plan and its week themes, and the Compass course content tree. All three of the dashboard’s journeys (CE renewal, qualifying education, exam prep) answer for all three courses, so the control and the page can never name different jurisdictions. Sequencing (secondary): Unregulated leaves every item in Step 1 open in any order (today’s behaviour); Regulated unlocks them in sequence — everything after the item you are on carries a padlock. ⚠ Only the NEW YORK qualifying licence is confirmed against XCEL’s published page; Texas is invented throughout, and New York’s CE and exam-prep arms are invented so the control cannot lie. XCEL only.',
    defaultEnabled: true,
    /* ⚠ `auto`, BECAUSE NO SINGLE COURSE PRESERVES `main` — see
       `CourseSelection` in `courseFixtures.ts` for the two wrong defaults
       this went through. The dashboard demos New York on the qualifying
       journey and Florida on CE and exam prep, and that split is a decision
       with a test on it. `auto` means "whatever this journey already did". */
    defaultVariant: 'fl',
    variants: [
      /* ⚠ "Automatic" STOOD HERE until 2026-10-20 and was the committed
         default. It read "each journey keeps the licence it already demoed",
         which was true and hid that the licence DEPENDED ON THE VERSION:
         Florida on the End-to-End family, New York on every other. One
         setting, two answers, nothing on screen saying which you had. Florida
         is the default now — `DEFAULT_SELECTION` in `courseFixtures.ts`, where
         the rest of the reasoning is, and where a stored `auto` is resolved. */
      { value: 'fl', label: 'Florida Life & Health Pre-Licensing', description: 'The course the CE and exam-prep fixtures were authored against. Published exam facts; ⚠ invented qualifying lesson count.' },
      { value: 'ny', label: 'New York Life & Health Pre-Licensing', description: 'The licence the qualifying journey has demoed since 2026-09-16, and the only one whose exam facts are confirmed against XCEL’s published page. Picking it explicitly puts CE and exam prep on New York too.' },
      { value: 'tx', label: 'Texas Life & Health Pre-Licensing', description: 'Its own curriculum (general knowledge, then the Texas Insurance Code), study plan and content tree. ⚠ Every figure invented.' },
    ],
    secondaryVariants: [
      { value: 'unregulated', label: 'Unregulated', description: 'Every item in the pre-licensing course is open, in any order. Today’s behaviour.' },
      { value: 'regulated', label: 'Regulated', description: 'Items unlock in sequence: the next not-started item is open, everything after it is locked.' },
    ],
    defaultSecondaryVariant: 'unregulated',
    secondaryVariantLabel: 'Sequencing',
    page: 'dashboard-rebrand',
  },
  {
    /**
     * THE ACCESS-WINDOW AXIS — 2026-10-15, the direct ask: "a demo selector
     * for a course to expire in 1 day, 7 days, 15 days, 30 days, 90 days,
     * 120 days, 400 days."
     *
     * ⚠ IT IS NOT THE COURSE AXIS. That one picks WHICH licence; this moves
     * the one date every expiry-shaped surface reads — the header's "Course
     * Access Ends", the Study Pace's ceiling, and the Jump Back In card's
     * expiring-soon badge. The two compose.
     *
     * ⚠ DEFAULT `auto` SO `main` IS UNCHANGED. Each Progress state already
     * authors its own window — On Track 29 days, At Risk 3, Off Track a
     * deliberately unreachable 11 — and those are stories somebody wrote. A
     * day count as the default would overwrite every one of them.
     *
     * ⚠ NOT IN `REBRAND_FLAGS`: it has a dedicated dropdown on the
     * always-visible Demo Controls bar. `FlagPanelScope.test.ts` is where
     * that exclusion has to be declared or the suite fails.
     */
    key: 'dashboard-course-expiry',
    label: 'Expires',
    description:
      'How many days of course access are left. Moves every expiry-shaped surface at once: the "Course Access Ends" date and countdown on the course header, the ceiling the Study Pace plans against, and the Jump Back In card’s expiring-soon badge. The spread crosses every threshold on purpose — 1, 7 and 15 days fall inside the warning window and badge; 30 and up do not; 1 day is short enough that no honest study pace fits, which is the "no pace works" state the card otherwise reaches on one persona only; 400 days is past a year, where the countdown has to read as a date rather than a sprint. Automatic (the default) leaves each Progress state on the window it already authored. XCEL only.',
    defaultEnabled: true,
    defaultVariant: '30',
    variants: [
      /* ⚠ "Automatic" STOOD HERE until 2026-10-20 and was the committed
         default: "each Progress state keeps its own window — On Track 29
         days, At Risk 3, Off Track 11". Removing it overwrites those three
         authored windows with one number, which is the cost — see
         `DEFAULT_EXPIRY` in `courseFixtures.ts`, where the reasoning and the
         At Risk consequence are written down. */
      /* ⚠ THE ROW LIVES IN TWO PLACES — `EXPIRY_PICKER` renders the dropdown,
         this is the catalog's copy, and a row in one and not the other is a
         control offering a value its own catalog does not know. */
      { value: '-3', label: 'Expired', description: 'Three days PAST the access date — the Atlas card goes charcoal, drops its count and offers Extend Course as its only CTA.' },
      { value: '1', label: '1 day', description: 'Expiring tomorrow. Badges, and no study pace fits. On the Atlas card this is the last usable day.' },
      { value: '7', label: '7 days', description: 'Inside the warning window — the card badges.' },
      { value: '15', label: '15 days', description: 'The badge’s edge: half the 30-day enrolment window.' },
      { value: '30', label: '30 days', description: 'A full window, just outside the badge.' },
      { value: '90', label: '90 days', description: 'A quarter out.' },
      { value: '120', label: '120 days', description: 'Four months out.' },
      { value: '400', label: '400 days', description: 'Past a year — the countdown has to read as a date.' },
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
    // READY: four agreed states of a shipped widget.
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

  /* ─── My Purchases ─────────────────────────────────────────────────── */
  {
    key: 'account-purchases-ledger',
    group: 'My Purchases',
    label: 'Purchases ledger',
    description:
      'What the My Purchases account section renders. ON (default on this branch) shows the order LEDGER — orders grouped by month with a per-month count, every group but the newest collapsed, and one card per order that expands into a full receipt (Billed To / Sold By, line items, subtotal, tax, discount, total, Download Receipt). OFF falls back to the "not built yet" placeholder the section shipped with. Ported from the reference design and retoned: its $0.00 membership-absorbed totals and per-state CE certificate lines do not apply to XCEL, which charges real money for packages.',
    defaultEnabled: true,
    // `account-purchases`, not `dashboard-rebrand`: the section has its own page
    // card in the flag panel (the Gift Recipients flags already sit on it), and
    // this belongs beside them rather than in the catch-all for the shell.
    page: 'dashboard-rebrand',
  },
  {
    key: 'purchases-layout',
    group: 'My Purchases',
    label: 'Layout (A/B)',
    description:
      'Which My Purchases layout renders. Variant-only — read the variant, ignore the toggle. Mirrors `gift-recipients-layout`, the same card-list-vs-table A/B one section over. No effect while `account-purchases-ledger` is off, which serves the not-built-yet placeholder instead of either arm.',
    defaultEnabled: true,
    // PROMOTED TO THE BASELINE 2026-09-30: `table` is the direction Jillienne
    // picked. `cards` shipped first and stays a valid value so its
    // implementation remains reachable via `?ff=purchases-layout:cards` — it is
    // not archived, because the A/B has not been called, only defaulted.
    defaultVariant: 'table',
    variants: [
      {
        value: 'cards',
        label: 'Month-grouped cards',
        description:
          'Orders bucketed under collapsible month headings, every group but the newest collapsed, each card expanding its receipt in place via Show Details.',
      },
      {
        value: 'table',
        label: 'Sortable ledger + sheet',
        description:
          'The default. One flat table — Order Date · Order Number · Summary · Status · Total — with every header sortable and no month grouping. Clicking a row opens that receipt in a right-anchored sheet rather than expanding in place, so row height never varies and a long history stays scannable.',
      },
    ],
    page: 'dashboard-rebrand',
  },

  /* ─── Account menu → Appearance ────────────────────────────────────── */
  {
    key: 'account-appearance-preferences',
    group: 'Account Menu',
    label: 'Preferences (appearance)',
    description:
      'The "Preferences" row in the top-right account dropdown, between the account destinations and Logout. ON adds the row, which opens a sheet whose Appearance sub-view swaps the shell between Light / Dim / Dark / System. OFF (default) hides the row and the sheet with it. ⚠ ALSO ROUTE-SCOPED, and the flag does not override that: the appearance treatment only applies inside the Dashboard Discoverability shell, so the row appears on /dashboard-rebrand only — turning this ON elsewhere shows nothing, because the sheet would change nothing there.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },

  /* ─── Purchases → Gift Recipients (purchase for others) ───────────── */
  {
    key: 'gift-recipients',
    group: 'Gift Recipients',
    label: 'Gift Recipients section',
    description:
      'The "Purchase for Others" tracking section under Purchases — a history of everything bought on behalf of someone else, with each recipient\'s claim (redemption) status and a Send Reminder action. ON (default) adds the "Gift Recipients" row to the account sub-nav and serves /account/gift-recipients; OFF hides the row and redirects the route back to Purchases. Only appears for brands that sell purchase-for-others (STC today) — other brands show the section\'s empty state.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
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
    page: 'dashboard-rebrand',
  },
  /* ── feat/atlas-compass-global-nav (merged 2026-10-02) ── */
  {
    // The Atlas home's LAYOUT (2026-10-02, the designer's request): V2 is
    // Figma 161:662 — one course card holding the figures, progress dial,
    // pace and the journey, beside an exam-date card and a links card. V1 is
    // the earlier Atlas home, kept so it can be called back up.
    key: 'atlas-home-layout',
    /* ⚠ ERIC'S — 2026-10-05, promote-to-prototype. A flag with no `owner`
       resolves to Jill (`flagOwner`), so without this it sits in HER tab of
       the Feature Flag panel and is invisible in his. `prototype-bar-branch-home`
       is deliberately NOT marked: it is prototype-bar chrome, not Atlas work. */
    owner: 'eric',
    group: 'Home Page',
    label: 'Atlas home layout',
    description:
      'Which layout the Atlas/Compass Home renders. V1: the course card, the Schedule State Exam banner and the Study Pace card in the left column, the Study Journey rail on the right. V2 (Figma 161:662): one course card with the completion / review / access figures, a progress dial and the study pace beside the Study Journey, with "Do you know your state exam date?" and "Quick Links" cards on the right. Variant-only. Atlas/Compass version only.',
    defaultEnabled: true,
    defaultVariant: 'v2',
    variants: [
      { value: 'v1', label: 'V1 · Course card, banner and rail', description: 'The Atlas home before 2026-10-02.' },
      { value: 'v2', label: 'V2 · One course card + side cards', description: 'Figma 161:662.' },
    ],
    page: 'dashboard-rebrand',
  },
  {
    // The prototype bar's house icon on a BRANCH build. `deployContext.ts`
    // drops it there so a stakeholder arriving through a public Refinement row
    // is not one click from the gateway; this flag puts it back for the
    // designer reviewing a branch. OFF by default, deliberately — the site has
    // no logins, so "only Eric" means Eric switches it on in his own browser
    // (flags persist per browser in localStorage) and every other visitor,
    // stakeholders included, keeps main's rule. No effect on production,
    // where the icon always shows.
    key: 'prototype-bar-branch-home',
    group: 'Navigation',
    label: 'Home Link on Branch Build',
    description:
      'Show the prototype bar\'s house icon (back to the UX Dashboard) on a Netlify branch build. OFF by default — main\'s rule: branch builds drop the icon so a stakeholder who opens a public Refinement row cannot click through to the project list. Switch it on in your own browser to keep the link; it stays on there and nowhere else. Production always shows it, whatever this says.',
    defaultEnabled: false,
    page: 'dashboard-rebrand',
  },
  {
    // The XCEL palette from the Atlas Development doc's Brand Guidelines tab
    // (Figma "XCEL - Atlas Style Guide", 2026-09-28), applied to the Atlas/
    // Compass version only. ON on feat/atlas-compass-global-nav, per the
    // Contributing guide's rule; off shows the same pages in the product's
    // standing XCEL ramps, for comparison.
    key: 'atlas-xcel-palette',
    owner: 'eric',
    group: 'Widgets',
    label: 'Atlas XCEL palette + type',
    description:
      'Apply the XCEL Atlas Style Guide palette to the Atlas/Compass Global Navigation version: primary red #9A1B1E for buttons, text links and active items only; secondary tan (600, #7E6748) for eyebrow labels; tertiary blue for everything the navy did before; each at the guide\'s exact 100–900 steps. Off keeps the standing XCEL ramps (San Juan primary, Brick CTA, Beech tertiary). Also sets headings in DM Serif Display, the guide\'s heading serif (400 only; body stays Open Sans). Other versions are unaffected either way. Rubi\'s orange is not in the guide and is unchanged.',
    defaultEnabled: true,
    page: 'dashboard-rebrand',
  },
  {
    // THE ATLAS HOME'S RIGHT RAIL, two layouts (2026-09-30, the designer's
    // request). V1 is the rail as it stood: Step 1 and Step 2 as their own
    // cards, Steps 3 and 4 as ruled rows, the requirements button under them.
    // V2 puts all four steps and the button in ONE frame with the Step 2
    // card's background and stroke. Atlas/Compass version only.
    key: 'atlas-right-rail-layout',
    owner: 'eric',
    group: 'Right Rail Layout',
    label: 'Right rail layout',
    description:
      'How the Atlas home\'s right rail (the four licensing steps) is framed. V1: Step 1 and Step 2 are separate cards, Steps 3 and 4 sit below with rounded left rules, and the State Requirements button is its own full-width button under them. V2: all four steps share one frame with the Step 2 card\'s background and 1px stroke; the steps lose their own cards and rules and line up on the frame\'s padding, and the State Requirements button sits inside the frame at its full inner width. Variant-only. Atlas/Compass version only.',
    defaultEnabled: true,
    // V2 is the default since 2026-09-30 (the designer's request), on every
    // brand skin; V1 stays selectable.
    defaultVariant: 'v2',
    variants: [
      { value: 'v1', label: 'V1 · Separate cards', description: 'Step 1 and Step 2 as their own cards, Steps 3 and 4 with left rules, the requirements button below.' },
      { value: 'v2', label: 'V2 · One frame', description: 'All four steps and the requirements button inside one frame styled like the Step 2 card.' },
    ],
    page: 'dashboard-rebrand',
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
/**
 * WHAT A PARTICIPANT LANDS ON — `VITE_GATEWAY_MODE=testing` only, 2026-09-23.
 *
 * A session has to open on a known state, and the committed baseline is not
 * it: `dashboard-progress-state` defaults to On Track because that is the most
 * useful state for a stakeholder walking the Prototypes link, and a user test
 * of a learner starting a course needs 0%.
 *
 * ⚠ IT OVERRIDES THE DEFAULT, NOT THE FLAG. A moderator can still change
 * Progress from the demo bar mid-session, `?ff=` still wins, and the Feature
 * Flag panel still reaches everything. This only decides where a fresh page
 * view starts — which is the one thing a participant-facing site cannot leave
 * to whatever happens to be committed.
 *
 * ⚠ AND IT CHANGES NOTHING ON THE OTHER TWO SITES. `main` keeps whatever
 * `/promote-to-prototype` put in the catalog; this is a third-site concern and
 * lives behind the same env var the third site already sets.
 *
 * ⚠ A DEFAULT IS NOT ENOUGH ON ITS OWN — 2026-10-08. For two weeks this was
 * the whole mechanism, and a session still opened at ~63%: `loadInitial`
 * merged `cgp.featureFlags` over it, and that key holds whatever Progress the
 * moderator last picked from the `?test=0` bar in the same browser. Demo mode
 * is `?demo=1` only, so on the test site every ordinary page view both READS
 * and WRITES that key, and one check of the On Track state became the
 * participant's starting point for every session after it. `loadInitial` and
 * `loadCustomDefaults` now return the baseline untouched on this build; see
 * the note on each.
 *
 * `dashboard-navigation` WAS LISTED HERE — pinning the A/B's control arm so a
 * later catalog change could not silently start participants on the variant.
 * It went with the flag on 2026-10-01; there is no variant left to be started
 * on. See `archivedItems.ts`.
 */
const TESTING_BASELINE: Record<string, Partial<FeatureFlagState>> = {
  'dashboard-progress-state': { variant: 'not-started' },
}

export function defaultFlagState(def: FeatureFlagDefinition): FeatureFlagState {
  return catalogDefault(def)
}

function catalogDefault(def: FeatureFlagDefinition): FeatureFlagState {
  const base: FeatureFlagState = {
    enabled: def.defaultEnabled,
    variant: def.defaultVariant,
    secondaryVariant: def.defaultSecondaryVariant,
  }
  /* ⚠ APPLIED HERE RATHER THAN AT EITHER CALL SITE, because there are two and
     they must agree: `loadInitial` builds the in-memory state, `baselineFrom`
     builds what `?demo=1` renders. A participant link carries `demo=1`, so an
     override that missed the second one would be invisible in exactly the case
     it exists for. */
  if (!isTestingGateway()) return base
  const override = TESTING_BASELINE[def.key]
  return override ? { ...base, ...override } : base
}

/** Load the saved custom-default baseline. Validates the same way as
 *  `loadInitial` (boolean enabled, variant must exist in the catalog)
 *  and keeps ONLY keys that were explicitly saved — a missing key means
 *  "use the catalog default". */
function loadCustomDefaults(): Record<string, FeatureFlagState> {
  if (typeof window === 'undefined') return {}
  // The testing build starts every page view from the catalog + the
  // `TESTING_BASELINE` — a saved custom default is the one other thing
  // `baselineFrom` and `reset` would put in front of it. See the baseline note.
  if (isTestingGateway()) return {}
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
  /* ⚠ NOTHING THE BROWSER SAVED REACHES A FRESH PAGE VIEW ON THE TESTING BUILD
     — 2026-10-08. Persistence still runs (the bar keeps working mid-session
     and a write is harmless), but it is never read back, so the moderator's
     last Progress pick cannot become the next participant's starting state.
     `?ff=` is still the way to open a session on anything but the baseline. */
  if (isTestingGateway()) return defaults
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

/**
 * The COURSE the dashboard is demoing, and how its content tree sequences —
 * 2026-10-15, with the Demo Controls bar's Course dropdown.
 *
 * ONE HOOK rather than a bare flag read at each site, for the reason
 * `useStudyPlanKind` gives above and Readiness learned the hard way: every
 * surface that resolves a course has to agree. Readiness showing Texas
 * chapters while the Study Plan paced Florida weeks is exactly the drift
 * `ProgressAgreement.test.tsx` exists to catch — and it would be invisible
 * until someone held two tabs side by side.
 *
 * It returns BOTH halves of the flag because they travel together: a surface
 * that needs the course usually needs to know whether it is regulated, and
 * two reads of one key is two chances to read a different one.
 *
 * Outside a provider it returns the catalog defaults (Florida, unregulated),
 * matching `useFeatureFlag`.
 */
export function useCourseDemo(): {
  /** What the control is SET to — `auto` included. For the pill. */
  selection: CourseSelection
  /**
   * The chosen course, or `undefined` under `auto`.
   *
   * ⚠ PASS IT THROUGH UNDEFINED. Every data function on this axis treats a
   * missing course as "resolve what you always resolved", which is precisely
   * what `auto` means — so a consumer never needs to branch on it.
   */
  course: CourseId | undefined
  /** The two-letter jurisdiction, or `undefined` under `auto`. */
  state: string | undefined
  /** The course's Learning Path id, or `undefined` under `auto`. */
  pathId: string | undefined
  regulated: boolean
  /** What the ACCESS-WINDOW control is set to — `auto` included. For the pill. */
  expiry: ExpirySelection
  /**
   * Days of access left, or `undefined` under `auto`.
   *
   * ⚠ A SECOND AXIS RIDING THE SAME HOOK, not a property of the course. It is
   * here because every consumer that resolves a persona needs both and two
   * hooks would be two chances to pass one and forget the other — which is
   * exactly how the course axis reached Readiness and not Home.
   */
  expiryDays: number | undefined
} {
  const flag = useFeatureFlag(COURSE_FLAG_KEY)
  const selection = resolveSelection(flag.variant)
  const course = chosenCourse(selection)
  const expiry = resolveExpiry(useFeatureFlag(EXPIRY_FLAG_KEY).variant)
  return {
    selection,
    course,
    state: course ? courseStateFor(course) : undefined,
    pathId: course ? coursePathIdFor(course) : undefined,
    regulated: isRegulatedCourse(flag.secondaryVariant),
    expiry,
    expiryDays: chosenExpiryDays(expiry),
  }
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
