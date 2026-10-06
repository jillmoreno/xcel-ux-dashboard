import type { DesignerId, Maturity } from '@/context/FeatureFlagContext'
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
  | 'eric-atlas-v1'
  | 'hybrid-v1'
  | 'discoverability-testing-3'
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
  | 'testing-3'
  | 'testing-2'
export type DashboardVersion = {
  id: DashboardVersionId
  label: string
  createdAt: string
  modifiedAt: string
  description: string
  /**
   * Whose exploration this version is — 2026-10-05, with the Feature Flag
   * panel's designer tabs. Absent means Jill, the same default `flagOwner`
   * applies to flags, and for the same reason: every version on `main` today is
   * hers, so nothing here needed editing.
   *
   * ⚠ IT GATES THE PICKER, NOT THE URL. `?version=` still resolves any id for
   * anyone — these versions are a shared product surface and a designer filter
   * must not make one unreachable. What the owner decides is whose TAB offers
   * it.
   */
  owner?: DesignerId
  /**
   * How finished this version is — the same gate `FEATURE_FLAGS` uses, added
   * 2026-10-05 when the picker moved onto the demo controls bar and became
   * reachable by STAKEHOLDERS for the first time.
   *
   * ⚠ IT GATES THE PICKER ON THE DEMO SITE ONLY. The design site lists every
   * version and marks the unfinished ones; `?version=` still resolves any id
   * for anyone, exactly as `maturity` works for flags. Nothing here is a
   * permission.
   *
   * ⚠ ABSENT MEANS `wip`, and it fails CLOSED on purpose: a version added
   * tomorrow with no `maturity` is invisible to stakeholders rather than
   * leaking a half-built dashboard to the people being asked to approve one.
   * That is the whole reason this field exists — all three versions in the
   * picker today are finished and marked `ready`, so the gate filters nothing
   * yet. It is armed for the next one.
   */
  maturity?: Maturity
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
  /* READY — it has been a committed default and is complete. See `maturity`:
     all three in the picker are, so the gate is armed rather than filtering. */
  maturity: 'ready',
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
// gives its Study Pace tile the presets card. This one asks what the
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

// "Testing 3" — Testing, with the COURSE and its COURSEWORK as one block.
// Added 2026-10-01.
//
// ⚠ IT IS TESTING'S CHILD, NOT QE FOCUSED'S, which is the one thing to hold on
// to when reading the chain. It inherits Testing's whole arrangement — the
// dropped Readiness tile, Study Pace across the full row, the split journey
// cards, the course header band — and changes exactly one thing, so the
// comparison is about that thing.
//
// THE ARGUMENT IT MAKES: the Current course card and the Complete coursework
// card are the same subject in two columns. Both name the course, both state
// how far through it the learner is, and the stops inside Complete Coursework
// are what the course IS. A learner reading down the page meets the same
// progress twice in two different shapes and has to work out that they agree.
// So this version renders them as ONE card — the course identity, the figure
// and Resume, then a hairline, then the stops that make it up.
//
// AND THE QUICK BUTTONS MOVE UNDER IT. My Courses and Certificates sit above
// the Quick question card on Testing (they are the `nav-placement: top` arm's
// re-homing of two rail rows). With the combined block taking the top of the
// left column, the two destinations that are NOT about this course belong
// after it rather than beside it.
//
// ⚠ "Testing 2" IS A DIFFERENT, OLDER VERSION and this is not it. That id
// (`discoverability-testing-2`) is QE Focused with a live Study Pace tile; it
// was archived from the picker on 2026-09-28 and STILL RESOLVES, and it is the
// only route to the Study Pace Adjust sheet. Numbering carried on past it
// rather than reusing it — see `archivedItems.ts`.
export const DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3: DashboardVersion = {
  id: 'discoverability-testing-3',
  /* READY — it has been a committed default and is complete. See `maturity`:
     all three in the picker are, so the gate is armed rather than filtering. */
  maturity: 'ready',
  label: 'Testing 3',
  createdAt: '2026-10-01',
  modifiedAt: '2026-10-01',
  description:
    'Testing, with the Current course card and the Complete coursework card combined into ONE block \u2014 the course identity, the progress figure and Resume, then a hairline, then the coursework stops that make the course up. The argument: the two cards are the same subject in two columns, and a learner meets the same progress twice in two shapes and has to work out that they agree. My Courses and Certificates move below the combined block rather than sitting above the Quick question card. Everything else is Testing\u2019s, so the difference is the one block. \u26a0 NOT related to "Testing 2", which is an older, archived version with a live Study Pace tile.',
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
  /* READY — it has been a committed default and is complete. See `maturity`:
     all three in the picker are, so the gate is armed rather than filtering. */
  maturity: 'ready',
  label: 'Testing',
  createdAt: '2026-09-21',
  modifiedAt: '2026-09-21',
  description:
    'QE Focused with the home screen\u2019s second row given over to pacing. The Readiness tile \u2014 a lo-fi stub since 2026-09-17 \u2014 is dropped, and Study Pace takes the full width and stops being square, rendering the presets card: a finish date, the room it leaves before access ends, and an Adjust sheet. It was an EXPLORATION of five treatments behind `dashboard-pacing-style` until 2026-09-22, when presets won and the rest were unwired (see `archivedItems.ts`). Everything else matches QE Focused so the difference is the one tile.',
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
  /* ⚠ ERIC'S, like the entry below — 2026-10-05. Without `owner` a version
     resolves to Jill (see `flagOwner`), so both Atlas rows sat in HER tab of
     the Dashboard Versions panel and were invisible in his. Nothing on screen
     says a row is in the wrong tab, which is why this is easy to miss. */
  owner: 'eric',
  /* ⚠ NO `maturity` HERE, DELIBERATELY — 2026-10-05, the promotion decision.
     This is the PARENT entry the code is keyed on (`isAtlasCompassNavVersion`
     answers true for it and for V1, and they render the same pages today), so
     making both pickable would have put two identical-looking Atlas rows in
     the stakeholder picker. V1 is the one with a name and a date on it, so V1
     is the one stakeholders get.

     ABSENT, NOT `wip`: absent says "not decided yet" and is the right state
     for the day these two diverge. The design site badges it "Design site
     only" meanwhile, so the decline is visible to designers rather than
     silent. */
  label: 'Atlas/Compass Global Navigation',
  createdAt: '2026-09-22',
  modifiedAt: '2026-09-22',
  description:
    'The Testing home under one global navigation spanning Atlas (the dashboard, Study Journey and readiness) and Compass (the course content): a text-only left rail from the Atlas/Compass Figma \u2014 Home, Study Plan, Course, Certificates & Transcripts, Resources, Get Help \u2014 that stays open while a course is open.',
}

// "Eric/Atlas V1" — 2026-10-02, the designer's request: the Atlas/Compass
// version as it stands, named as its own Dashboard Version and behind the
// `dashboard-version-eric-atlas-v1` flag (the picker hides it when the flag is
// off). IT IS THE SAME CODE, NOT A FROZEN COPY: `isAtlasCompassNavVersion`
// answers true for it, so it renders exactly what Atlas/Compass renders —
// including whatever later changes to the Atlas pages bring. A true freeze is
// a deploy permalink, not a version entry.
export const DISCOVERABILITY_DASHBOARD_VERSION_ERIC_ATLAS_V1: DashboardVersion = {
  id: 'eric-atlas-v1',
  owner: 'eric',
  /* ⚠ PICKABLE BY STAKEHOLDERS — 2026-10-05, promote-to-prototype. This says
     the demo site lists it (`dashboardVersionsForAudience`); it does NOT make
     it the baseline. Prototypes still renders Testing 3, and a fresh `?demo=1`
     still lands there — `defaultDiscoverabilityVersionFor` is untouched by
     this promotion.

     Chosen over the parent entry above because it is the one that carries a
     name and a date, so a stakeholder picking it knows whose work and as of
     when. The two render identically today; the day they stop, the parent is
     the one to reconsider. */
  maturity: 'ready',
  label: 'Eric/Atlas V1',
  createdAt: '2026-10-02',
  modifiedAt: '2026-10-02',
  description:
    'Eric\u2019s Atlas/Compass work as of 2026-10-02: the Top Nav (Home \u00b7 My Learning) over the Global brand, no left rail on Home, the Schedule State Exam banner, the one-frame right rail, the collapsible left rail on the course pages, the course player with Rubi beside it, and the Compass Resources page. Shares the Atlas/Compass code. Feature-flagged.',
}

// "Hybrid V1" — 2026-10-05, Jillienne's. Eric's Atlas home (the layout, the
// figures column, the step list) carrying Testing 3's answers to the questions
// that version had already settled: the coursework timeline with its percentage
// and current-lesson marker, and the licensing steps folded away by default.
//
// ⚠ IT IS A FORK OF THE HOME, NOT A FLAG THROUGH IT. `HybridHomeV1.tsx` is a
// sibling of `AtlasHomeV2.tsx` (CLAUDE.md: copy it, do not thread conditionals
// through the original) so Eric's version cannot move when this one does, and
// neither of us is editing the other's screen. The cost is the usual one — a
// fix in one does not reach the other — and the note in each file says so.
//
// ⚠ IT TAKES THE ATLAS CHROME. `isAtlasCompassNavVersion` answers true for it,
// so the rail, the slim header and the palette are Eric's; what is forked is
// the HOME CONTENT only.
export const DISCOVERABILITY_DASHBOARD_VERSION_HYBRID_V1: DashboardVersion = {
  id: 'hybrid-v1',
  owner: 'jill',
  /* ⚠ NO `maturity` YET — reachable on the design site, not offered to
     stakeholders. It is being built; `promote-to-prototype` is where that
     changes. */
  label: 'Hybrid V1',
  createdAt: '2026-10-05',
  modifiedAt: '2026-10-06',
  /* ⚠ IT SAID "carries the percentage and the current-lesson marker" FROM THE
     DAY THE VERSION WAS CREATED, describing work that had not been built yet —
     and when it was built (2026-10-06) the percentage was deliberately left
     out, because the dial two columns left already draws it. A description is
     what a stakeholder reads in the version picker, so it states what the page
     DOES, never what it is going to do. */
  description:
    'Eric\u2019s Atlas home combined with Testing 3\u2019s coursework treatment. The figures column leads with Course Access and drops Days to Review; Begin Course sits in the title area; Steps 2 and 3 (Pass State Exam, Get Licensed) are collapsed by default to keep the first screen to one task; and Complete Coursework expands the lessons stop with a completion count and the lesson in progress.',
}

/** True for Hybrid V1 — the one version that renders `HybridHomeV1` instead of
 *  `AtlasHomeV2`. A helper rather than a literal at the call site so the id
 *  lives in one place, the same shape `isAtlasCompassNavVersion` uses. */
export function isHybridV1Version(versionId: string | null | undefined): boolean {
  return versionId === DISCOVERABILITY_DASHBOARD_VERSION_HYBRID_V1.id
}

/** True for the Atlas/Compass Global Navigation version — and for Eric/Atlas
 *  V1, which is the same pages under its own name. One helper so the shell and
 *  the demo bar cannot disagree about which version is on. */
export function isAtlasCompassNavVersion(versionId: string | null | undefined): boolean {
  return (
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV.id ||
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_ERIC_ATLAS_V1.id ||
    /* Hybrid V1 takes the Atlas CHROME (rail, slim header, palette) and forks
       only the home content — see its entry above. */
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_HYBRID_V1.id
  )
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
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3.id ||
    // Testing 2 is a QE clone too — without this the demo bar would offer
    // Continuing Ed on a page that resolves a pre-licensing path, which is
    // the exact defect the note above records.
    versionId === DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2.id ||
    // Atlas/Compass Global Navigation renders the Testing home — as does
    // Eric/Atlas V1.
    isAtlasCompassNavVersion(versionId)
  )
}

// "Go to Legacy 2.0 Dashboard" is NOT a version here — because the classic
// dashboard loads outside this shell (a full navigation to `/dashboard`, the
// "Legacy Dashboard 2.0" tile link), it renders as a plain jump-off CTA below
// the version list rather than a selectable card. See the `secondaryCta` prop on
// DashboardVersionsPanel + the rebrand branch in Header.
//
/*
 * THE PICKER LIST. Three entries as of 2026-09-22, down from five.
 *
 * QE FOCUSED and MARKETING FOCUSED were archived on the direct ask — "we are
 * going in the direction of Testing Version". Same mechanism Badged got on
 * 2026-08-17 and for the same reason: pulled from THIS LIST only. Both consts,
 * both `discoverability-*` type members, every `?version=` resolution branch
 * and every component they render are KEPT, so restoring either is a one-line
 * re-add here and a deep link to it still resolves today.
 *
 * ⚠ ARCHIVING QE FOCUSED DOES NOT ARCHIVE THE QE LAYOUT, and anyone reading
 * this as "QE is gone" will break the thing that replaced it. `MembershipOverview`
 * computes `qeFocused = dashboardLayout === 'qe-focused' || testing || testingVersion`
 * — Testing and Testing 2 ARE the QE arrangement, plus their departures from
 * it. The layout, its components and `QeFocusedVersion.test.tsx`'s 161 tests
 * are all still live and still the best description of what Testing inherits.
 * What went is one row in a picker.
 *
 * ⚠ MARKETING FOCUSED IS STILL THE HOUSE DEFAULT for any brand that is not
 * XCEL — see `defaultDiscoverabilityVersionFor` below. With `Brand` a
 * one-member union that branch is unreachable today, but it is the seam a
 * second brand re-enters through, exactly like the `[data-brand]` selector in
 * `tokens.css`. The const stays for that reason as much as for restoring it.
 *
 * (Badged Version was archived 2026-08-17 — re-add
 * DISCOVERABILITY_DASHBOARD_VERSION_BADGED here to restore it to the picker.)
 */
export const DISCOVERABILITY_DASHBOARD_VERSIONS: DashboardVersion[] = [
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
  /* Testing 3 — Testing with the course and its coursework as one block. Listed
     directly after its parent, because the picker is the only place the lineage
     is visible and reading them in order is what makes the one difference
     legible. */
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3,
  /* Testing 2 was archived 2026-09-28 — re-add
     DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2 here to restore it to the
     picker. Same one-line shape as Badged, QE Focused and Marketing Focused
     above; see `discoverability-testing-2` in archivedItems.ts.
     ⚠ It is the ONLY route to the Study Pace ADJUST SHEET (`livePace`), which
     is still fully built and still renders on `?version=discoverability-testing-2`. */
  // Atlas/Compass (and Eric/Atlas V1, behind `dashboard-version-eric-atlas-v1`
  // — the Header filters it out of the picker when the flag is off) come from
  // feat/atlas-compass-global-nav.
  DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV,
  DISCOVERABILITY_DASHBOARD_VERSION_ERIC_ATLAS_V1,
  DISCOVERABILITY_DASHBOARD_VERSION_HYBRID_V1,
  DISCOVERABILITY_DASHBOARD_VERSION_LEARNER_FOCUSED,
]

/**
 * The versions a given audience's picker offers.
 *
 * ⚠ THE DEMO SITE GETS `ready` ONLY; the design site gets everything. Same
 * split `variantsForDemo` makes for a flag's variants, and deliberately the
 * same shape so there is one rule to learn rather than two.
 *
 * ⚠ IT FILTERS THE PICKER, NOT THE ROUTE. `?version=<id>` still resolves any
 * version on either site — a `wip` version is unlisted, never unreachable, so
 * a link to one in a Refinement row keeps working.
 */
export function dashboardVersionsForAudience(demoSite: boolean): DashboardVersion[] {
  if (!demoSite) return DISCOVERABILITY_DASHBOARD_VERSIONS
  return DISCOVERABILITY_DASHBOARD_VERSIONS.filter((v) => v.maturity === 'ready')
}

/** A version's label from its id, for the places that have the id and need the
 *  words — the demo bar's trigger, mostly. Falls back to the id so an unknown
 *  value is visible rather than blank. */
export function dashboardVersionLabel(id: string): string {
  return DISCOVERABILITY_DASHBOARD_VERSIONS.find((v) => v.id === id)?.label ?? id
}

/**
 * Which Discoverability layout a brand lands on with NO `?version=`.
 *
 * Marketing Focused is the house default. **XCEL defaults to TESTING 3**
 * (2026-10-02, the direct ask: "lets change testing 3 to the new default
 * view"). It was TESTING from 2026-09-21 ("i actually wanted Testing 1 as the
 * default").
 *
 * THE LINEAGE, because each step carried the last one's argument forward rather
 * than reversing it. Learner Focused from 2026-09-04 — XCEL sells a licence,
 * not a membership, so there is no upsell for a marketing carousel to carry and
 * its learners arrive with a booked exam date. QE Focused from 2026-09-16 —
 * Learner Focused leads with the progress gauge, and this leads with the whole
 * requirement breakdown plus what to study next. Testing now — QE Focused with
 * the Readiness stub dropped, the whole square row given to Study Pace, the
 * trimmed three-row rail and the journey split into four widgets. Both earlier
 * versions stay in the picker so the three can be compared. Testing 3 from
 * 2026-10-02 — Testing with the course and its coursework as ONE block, the
 * licensing steps folded in behind disclosures, and the right rail rebuilt as
 * six destinations over an exam card and a readiness slot.
 *
 * ⚠ IT IS STILL A BRANCH DEFAULT, which is the whole of what this line does.
 * `jill/navigation-exploration` is where Testing 3 lives; this makes the branch
 * build and its `?demo=1` link open on the work under review, which is the
 * Contributing guide's rule for a design branch. Whether it becomes the
 * baseline on `main` is `/promote-to-prototype`'s call and nothing here decides
 * it.
 *
 * ⚠ TESTING 3 IS NOT FINISHED, and that is the known cost of pointing the
 * landing page at it. Two things on it are explicitly open: `Are you ready` is
 * an empty reserved slot, and `journey-scale-style` is a FOUR-ARM exploration
 * with no winner — so a stakeholder opening the link lands on a page with one
 * blank card and one undecided treatment. That is the trade the ask accepts;
 * the earlier promotion of Testing waited until its own exploration had
 * resolved, and this one has not.
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
 * ⚠ WHAT IT MOVES: the public link and the `?demo=1` baseline open on TESTING.
 * That was the open question this pin existed to force — the landing page was a
 * pacing EXPLORATION rather than a settled design, and which of five treatments
 * a stakeholder saw was a flag default rather than a decision. ANSWERED
 * 2026-09-22: presets won, `dashboard-pacing-style` was retired, and the tile
 * renders one treatment. The landing page now states a design.
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
    ? DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3.id
    : DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED.id
}

/**
 * THE VERSION THE APP IS ACTUALLY ON — `?version=` when the URL names one, else
 * the brand's default. 2026-10-06.
 *
 * ⚠ IT EXISTS BECAUSE TWELVE CALL SITES READ THE RAW PARAM AND ONE DID NOT, and
 * the day that mattered was the day a version in the ATLAS FAMILY became the
 * default. Until then every default (QE Focused, Testing, Testing 3) was
 * outside that family, so `isAtlasCompassNavVersion(null)` and
 * `isAtlasCompassNavVersion(theDefault)` both answered false and the raw reads
 * were right BY COINCIDENCE. Hybrid V1 broke all of them at once: a bare
 * `?demo=1` drew the Atlas top nav (the one resolved read) over Testing 3's
 * course card (every raw one) — one screen made of two versions.
 *
 * ⚠ SO `null` IS NOT A VERSION, it is a question. Any predicate asking "which
 * version is this?" has to be handed the ANSWER, which is what this returns.
 * `params.get('version')` on its own is only ever "did the URL say so".
 *
 * ⚠ AND THE BRAND ARGUMENT IS NOT DECORATION, even though `Brand` is a
 * one-member union and this always returns the XCEL answer today. It is the
 * same seam `archivedItems.ts` keeps `DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED`
 * alive for — a second brand resolves to a different default, and a hard-coded
 * `'xcel'` here would fail on the day one is added rather than at the edit.
 */
export function resolveDashboardVersion(
  param: string | null | undefined,
  brand: Brand,
): string {
  return param ?? defaultDiscoverabilityVersionFor(brand)
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
