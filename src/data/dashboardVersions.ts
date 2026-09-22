import type { Brand } from '@/context/AccountContext'

export type DashboardVersionId =
  | 'v1'
  | 'v2'
  | 'v3'
  | 'v4'
  | 'v5'
  | 'mvp'
  | 'discoverability-learner-focused'
  | 'discoverability-marketing-focused'
  | 'discoverability-badged'
  | 'discoverability-qe-focused'
  | 'discoverability-testing'
  | 'discoverability-testing-2'
  | 'discoverability-atlas-compass-nav'

/**
 * The rebrand overview's LAYOUT, resolved from `?version=` by `PlatformShell`
 * and threaded to `MembershipOverview`. One exported name because five files
 * declared this union inline and a fifth member had to be added to every one of
 * them — the kind of edit that compiles after four of five.
 *
 * `default` is the standalone V5/V7 membership page, not a dashboard version.
 */
export type DashboardLayout =
  | 'default'
  | 'learner-focused'
  | 'marketing-focused'
  | 'badged'
  | 'qe-focused'
  | 'testing'
  | 'testing-2'
export type DashboardVersion = {
  id: DashboardVersionId
  label: string
  createdAt: string
  modifiedAt: string
  description: string
}

// ARCHIVED 2026-09-16 — `mvp` ("Dashboard MVP") was unwired here and in
// `DashboardPage`'s switch. It was defined ENTIRELY by a snapshot of eight
// classic-dashboard feature flags (`MVP_FLAGS` in `DashboardMVP.tsx`), and the
// XCEL flag audit removed all eight from the catalog — without them the MVP
// renders as V3 with `hideRightRail` / `trail` / `consolidatedProgress`, i.e. a
// second near-identical entry in this picker. `DashboardMVP.tsx` is kept in the
// repo unreferenced; see ARCHIVED_ITEMS id `dashboard-mvp-version` for the
// re-wire steps. The id stays in `DashboardVersionId` so a stored
// `cgp.dashboard.version` of 'mvp' still type-checks and falls through to V1.
export const DASHBOARD_VERSIONS: DashboardVersion[] = [
  {
    id: 'v1',
    label: 'Dashboard V1',
    createdAt: '2026-05-06',
    modifiedAt: '2026-05-22',
    description:
      'Teal hero band merging welcome + 4 inline stats over a tabbed Learner Overview / Continue Listening / Jump Back In / Recommended / Member Benefits surface.',
  },
  {
    id: 'v2',
    label: 'Dashboard V2',
    createdAt: '2026-05-22',
    modifiedAt: '2026-05-22',
    description:
      'Same layout as V1, with the Achievements section removed from the Learner Overview tab so progress design can be explored without competing visual weight.',
  },
  {
    id: 'v3',
    label: 'Dashboard V3',
    createdAt: '2026-05-27',
    modifiedAt: '2026-05-27',
    description:
      'Fresh clone of V2 — starting point for the next round of dashboard explorations. Identical surface today; iterate freely without touching V2.',
  },
  {
    id: 'v4',
    label: 'Dashboard V4',
    createdAt: '2026-06-07',
    modifiedAt: '2026-06-07',
    description:
      'V3 layout with the welcome/stats hero relocated into the left column as a vertical widget stacked directly above Jump Back In.',
  },
  {
    id: 'v5',
    label: 'Dashboard V5',
    createdAt: '2026-06-08',
    modifiedAt: '2026-06-08',
    description:
      'Identical to V3 but the Featured Products card moves to the bottom — below Learning Path + Courses (+ Streak) in two-thirds width, and below all three widgets in full width.',
  },
]

// The Dashboard Discoverability feature (/dashboard-rebrand) is a standalone
// dashboard — NOT one of the classic `/dashboard` iterations above (kept OUT of
// DASHBOARD_VERSIONS so the Explore Dashboard feature still lists v1–v5/mvp). The
// picker offers two layout variants: **Marketing Focused is the default** (the
// layout a fresh /dashboard-rebrand visit lands on) and Learner Focused. (The
// earlier Side-by-side, Vibrant, and Stacked-cards explorations were fully
// retired — their layout paths + flags were removed in the flag audit.)
export const DISCOVERABILITY_DASHBOARD_VERSION_LEARNER_FOCUSED: DashboardVersion = {
  id: 'discoverability-learner-focused',
  label: 'Learner Focused',
  createdAt: '2026-06-24',
  modifiedAt: '2026-06-24',
  description:
    'The top section is one joined card — Current Learning Path (a two-segment completion gauge + Mandatory/Elective bars, KPIs, and status on a deep-navy half) beside a white Jump Back In half (poster cover, progress, and a magenta Resume course CTA). Recommended for you + What’s New follow below.',
}

export const DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED: DashboardVersion = {
  id: 'discoverability-marketing-focused',
  label: 'Marketing Focused',
  createdAt: '2026-07-01',
  modifiedAt: '2026-07-01',
  description:
    'The default Discoverability dashboard. The joined top card, but the Jump Back In half is replaced by a full-bleed “What’s New” marketing carousel — rotating brand-gradient announcement slides with dot navigation. The left half keeps a compact Current Learning Path (two-segment progress + status), a Deadline / Time Remaining stat row, and a Jump Back In card.',
}

// "Badged Version" — the same discoverability dashboard, but every available/
// product card carries a membership tier badge (Passport / Passport Lite) plus
// an optional status badge (New / Member Exclusive) as a top-corner overlay.
// Affects the dashboard overview only (Marketing Focused layout + badge overlays).
// ARCHIVED 2026-08-17 — pulled from the picker list below (see ARCHIVED_ITEMS
// `discoverability-badged`). The const, the `discoverability-badged` type member,
// the `?version=` resolution branches (PlatformShell / MembershipOverview), and
// the `badged/` component files are all KEPT so restoring is a one-line re-add
// to DISCOVERABILITY_DASHBOARD_VERSIONS. The `?version=discoverability-badged`
// URL still resolves for anyone who deep-links it.
export const DISCOVERABILITY_DASHBOARD_VERSION_BADGED: DashboardVersion = {
  id: 'discoverability-badged',
  label: 'Badged Version',
  createdAt: '2026-07-07',
  modifiedAt: '2026-07-07',
  description:
    'The Marketing Focused dashboard, with a tier + status badge overlay on every product card. Each card carries a membership tier badge — Passport (gold + crown) or Passport Lite (navy + bolt) — top-left, plus an optional status badge (New or Member Exclusive) top-right, across the What’s New carousel, Recommended for you, and What’s Trending.',
}

// "QE Focused" — the qualifying-education dashboard, and XCEL's default from
// 2026-09-16. It is the first version built around a candidate who has not got
// a licence yet: someone working a fixed curriculum towards a booked exam,
// where the useful questions are "how much of the requirement have I cleared"
// and "what comes next", not "what else could I buy".
//
// Three departures from Learner Focused, each answering one of those:
//
//   1. **The Progress detail is on the PAGE.** The Learning Path detail
//      slide-over's Progress tab — gauge, category bars, the Deadline / Time
//      Remaining / Completed tiles, and the per-category course lists with
//      their completion state — renders inline as a section. A candidate opens
//      the dashboard to see exactly that, so it should not be a click away.
//   2. **The top band slims to a lead-in.** Because the section below now
//      carries the gauge and the stat tiles, the navy half keeps only the path
//      identity, status and Resume — otherwise the same three facts appear
//      twice on one screen.
//   3. **Recommended for You is dropped.** It is a discovery surface, and this
//      version is deliberately not a discovery dashboard.
//
// The white half carries the STUDY JOURNEY rather than Today's Tasks — the
// curriculum as an ordered sequence. See `StudyJourneyRail`.
export const DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED: DashboardVersion = {
  id: 'discoverability-qe-focused',
  label: 'QE Focused',
  createdAt: '2026-09-16',
  modifiedAt: '2026-09-16',
  description:
    'Built for a pre-licensing candidate working towards a booked exam. The top band slims to path identity + status + Resume beside a Study Journey — the curriculum as an ordered sequence of chapters and milestone exams. Below it the Learning Path detail sheet\u2019s whole Progress tab renders inline: completion gauge, category bars, Target Date / Time Remaining / Completed tiles, and a course list per requirement category. Recommended for You is dropped \u2014 this version is not a discovery dashboard.',
}

// "Testing 2" (2026-09-21) — a CLONE of QE Focused carrying the PRESET-AND-SHEET
// answer to the pacing slot.
//
// **It is the second of two, and the pairing is the point.** "Testing"
// (`discoverability-testing`, built on the same day on its own branch) asks what
// the tile should SHOW — it drops Readiness, gives Study Pace the full width, and
// offers four treatments behind `dashboard-pacing-style`. This one asks what the
// learner should be able to DO: the tile keeps its square and shows one derived
// pace with NO controls, and everything adjustable moves behind Adjust into a
// sheet — the three finish dates, days a week, an exam date, and building a study
// plan on the calendar. The two are not competing drafts of one design; they are
// different questions about the same slot, and both want answering.
//
// Both are layouts of their own rather than flags ON QE Focused, for one reason:
// they have to be openable SIDE BY SIDE in separate tabs, and a flag is global to
// the session — flipping it would change every tab at once.
//
// Everything QE Focused does, this does, because `MembershipOverview` treats
// `testing-2` as qe-focused for every other decision. The ONLY divergence is the
// left square tile, which renders the real `StudyPaceTile` instead of the lo-fi
// stub. Readiness stays lo-fi here: it is the next thing, not this one.
export const DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2: DashboardVersion = {
  id: 'discoverability-testing-2',
  label: 'Testing 2',
  createdAt: '2026-09-21',
  modifiedAt: '2026-09-21',
  description:
    'QE Focused with a LIVE Study Pace tile in the square slot. The tile itself operates nothing — it states one derived pace and offers Adjust, which opens a sheet holding the three finish dates (Relaxed / Recommended / Focused, each a date rather than a weekly quota), how many days a week, an optional exam date, and a switch that turns the pace into sessions on the Study Plan. Two ceilings can bind — course access expiry, and the exam date minus a review buffer — and the sheet says which one is doing the work. Readiness is still a lo-fi stub. Compare with Testing, which asks what the tile should show rather than what it should let you change.',
}

// "Testing" — QE Focused with the home screen's second row opened up for the
// PACING exploration. Added 2026-09-21, and it is a WORKING version rather than
// a candidate: it exists so the pacing treatments can be compared on the real
// home screen against real data, not so a stakeholder can be shown a fourth
// layout.
//
// Two departures from QE Focused, and they are one change seen from both ends:
//
//   1. **The Readiness tile is dropped.** It is the right-hand half of the
//      band's square-tile pair and has been a deliberate lo-fi stub since
//      2026-09-17 ("Not designed yet"). There IS a real readiness model one
//      rail item away (`ReadinessPanel`), so the stub is the placeholder, not
//      the section — dropping it here costs nothing and takes an unbuilt
//      surface out of the frame while the built one beside it is being judged.
//   2. **Study Pace takes the whole row**, and stops being square. Square was
//      a property of the PAIR, not of the content; alone in a ~506px column a
//      1:1 tile would be a 506px box holding two lines. `dashboard-pacing-
//      style` then picks the treatment inside it.
//
// It inherits everything else QE Focused does — the page-surface band, the
// category gauge, the Study Journey, no Recommended band, the requirements-only
// detail sheet — because the question being asked is about ONE tile and every
// other difference would be noise in the comparison.
export const DISCOVERABILITY_DASHBOARD_VERSION_TESTING: DashboardVersion = {
  id: 'discoverability-testing',
  label: 'Testing',
  createdAt: '2026-09-21',
  modifiedAt: '2026-09-21',
  description:
    'QE Focused with the home screen\u2019s second row given over to the Pacing exploration. The Readiness tile \u2014 a lo-fi stub since 2026-09-17 \u2014 is dropped, and Study Pace takes the full width and stops being square. Which pacing treatment renders there is `dashboard-pacing-style`: Lo-fi (the stub, for comparison), Rate (a suggested hrs/day), Runway (work remaining laid against time remaining) or Balance (the two figures, no derived rate). Everything else matches QE Focused so the comparison is about the one tile.',
}

// "Atlas/Compass Global Navigation" — 2026-09-22. A version for exploring ONE
// navigation across the two surfaces the learner moves between: Atlas (this
// dashboard — the Study Journey, readiness, the programme) and Compass (the
// course content the launcher opens).
//
// ITS HOME IS TESTING'S, NOT A COPY OF IT. `PlatformShell` resolves it to the
// `testing` layout (2026-09-22, merged in from `feat/pace-presets-variant`), so
// every Testing and QE rule holds — the live Study Pace tile, the qualifying
// journey, no Recommended band — and a later change to that home reaches this
// version too. The ONE thing this version adds is the rail:
// `AtlasCompassSideNav`, from Figma 49:3365, keyed on `isAtlasCompassNavVersion`.
export const DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV: DashboardVersion = {
  id: 'discoverability-atlas-compass-nav',
  label: 'Atlas/Compass Global Navigation',
  createdAt: '2026-09-22',
  modifiedAt: '2026-09-22',
  description:
    'The Testing home under one global navigation spanning Atlas (the dashboard, Study Journey and readiness) and Compass (the course content): a text-only left rail from the Atlas/Compass Figma \u2014 Home, Study Plan, Certificates & Transcripts, Resources, Get Help \u2014 that stays open while a course is open.',
}

/** True for the Atlas/Compass Global Navigation version. One helper so the
 *  shell and the demo bar cannot disagree about which version is on. */
export function isAtlasCompassNavVersion(versionId: string | null | undefined): boolean {
  return versionId === DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV.id
}

/**
 * Does this version resolve a QUALIFYING journey (pre-licensing / exam prep)
 * rather than a CE renewal cycle?
 *
 * TWO PLACES act on this and they must agree, which is why it is a function
 * rather than an `=== 'discoverability-qe-focused'` in each:
 *
 *   - `MembershipOverview` forces `educationType` to `qe` / `exam-prep`, so the
 *     version named for qualifying education cannot open on a CE path.
 *   - `DemoControlsBar` drops Continuing Ed from its Education dropdown for the
 *     same reason, and labels the control with what the PAGE resolved.
 *
 * They were two hardcoded id comparisons, and adding Testing broke the second
 * one silently: the page resolved a pre-licensing path while the bar above it
 * still offered — and read — "Continuing Ed", which is exactly the "dropdown
 * entry that changes nothing when clicked" the flag audit spent a pass
 * removing. The bar calls this now; `MembershipOverview` tests the LAYOUT
 * (`qe-focused` plus `testing`), because that is the value it is threaded.
 *
 * A new QE-shaped version is one entry here, not two edits in two files.
 */
export function isQualifyingEducationVersion(versionId: string): boolean {
  return (
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED.id ||
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id ||
    // Testing 2 is a QE clone too — without this the demo bar would offer
    // Continuing Ed on a page that resolves a pre-licensing path, which is
    // the exact defect the note above records.
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2.id ||
    // Atlas/Compass Global Navigation renders the Testing home.
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV.id
  )
}

// "Go to Legacy 2.0 Dashboard" is NOT a version here — because the classic
// dashboard loads outside this shell (a full navigation to `/dashboard`, the
// "Legacy Dashboard 2.0" tile link), it renders as a plain jump-off CTA below
// the version list rather than a selectable card. See the `secondaryCta` prop on
// DashboardVersionsPanel + the rebrand branch in Header.
//
// Marketing Focused leads the list — it's the default.
// (Badged Version was archived 2026-08-17 — dropped from this list; re-add
// DISCOVERABILITY_DASHBOARD_VERSION_BADGED here to restore it to the picker.)
export const DISCOVERABILITY_DASHBOARD_VERSIONS: DashboardVersion[] = [
  DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2,
  DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV,
  DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_LEARNER_FOCUSED,
]

/**
 * Which Discoverability layout a brand lands on with NO `?version=`.
 *
 * Marketing Focused is the house default. **XCEL defaults to TESTING**
 * (2026-09-21, the direct ask: "i actually wanted Testing 1 as the default").
 *
 * THE LINEAGE, because each step carried the last one's argument forward rather
 * than reversing it. Learner Focused from 2026-09-04 — XCEL sells a licence,
 * not a membership, so there is no upsell for a marketing carousel to carry and
 * its learners arrive with a booked exam date. QE Focused from 2026-09-16 —
 * Learner Focused leads with the progress gauge, and this leads with the whole
 * requirement breakdown plus what to study next. Testing now — QE Focused with
 * the Readiness stub dropped, the whole square row given to Study Pace, the
 * trimmed three-row rail and the journey split into four widgets. Both earlier
 * versions stay in the picker so the three can be compared.
 *
 * ⚠ THIS REVERSES A DECISION THAT WAS PINNED, and the pin was right when it was
 * written. Testing shipped on 2026-09-21 explicitly NOT as the default, with a
 * test asserting it, because "a fourth picker entry that quietly became what a
 * stakeholder lands on is the worst outcome this change could have". Nothing
 * about that reasoning was wrong — what changed is that it is no longer quiet.
 * This is the deliberate promotion the pin existed to force, and the test was
 * rewritten to assert the new default rather than deleted, so the original
 * subject survives.
 *
 * ⚠ WHAT IT MOVES, and it is the whole point of the pin: the public link and
 * the `?demo=1` baseline now open on TESTING, whose Study Pace tile renders
 * `dashboard-pacing-style`'s committed default — `runway`. So the landing page
 * is now a pacing EXPLORATION rather than a settled design, and which treatment
 * a stakeholder sees is a flag default rather than a version decision. Changing
 * `defaultVariant` is how that is answered; it was deliberately left alone here
 * because it is a separate call.
 *
 * ⚠ TWO PLACES read a default and they must agree, or the picker marks one
 * layout "Default" while the page loads the other: `PlatformShell`'s
 * `?version=` fallback, and the `defaultVersionId` the Header passes to
 * `DashboardVersionsPanel` for the inline "Default" pill. Both call this.
 *
 * Not persisted and not settable — the rebrand's picker suppresses "Set as
 * default" (`hideSetDefault`), so this IS the default, per brand.
 */
export function defaultDiscoverabilityVersionFor(brand: Brand): string {
  return brand === 'xcel'
    ? DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id
    : DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED.id
}

// Built-in baseline default — the version a fresh visitor lands on when
// they haven't set their own default. V3 is the current working
// iteration, so new sessions start there.
export const DEFAULT_DASHBOARD_VERSION: DashboardVersionId = 'v3'

// User-chosen default, set from the Dashboard Versions panel's "Set as
// default" trigger. Persisted separately from the sticky last-viewed
// version (`cgp.dashboard.version`) so it survives even after previewing
// other versions.
const DEFAULT_VERSION_STORAGE_KEY = 'cgp.dashboard.defaultVersion'

function isValidVersionId(value: string | null): value is DashboardVersionId {
  return value != null && DASHBOARD_VERSIONS.some((v) => v.id === value)
}

/** The user-chosen default dashboard version, or the built-in
 *  {@link DEFAULT_DASHBOARD_VERSION} when none has been set. */
export function readDefaultDashboardVersion(): DashboardVersionId {
  if (typeof window === 'undefined') return DEFAULT_DASHBOARD_VERSION
  try {
    const raw = window.localStorage.getItem(DEFAULT_VERSION_STORAGE_KEY)
    return isValidVersionId(raw) ? raw : DEFAULT_DASHBOARD_VERSION
  } catch {
    return DEFAULT_DASHBOARD_VERSION
  }
}

/** Persist the chosen default dashboard version. */
export function writeDefaultDashboardVersion(id: DashboardVersionId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DEFAULT_VERSION_STORAGE_KEY, id)
  } catch {
    // Ignore quota / private-mode errors.
  }
}
