/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ARCHIVE — things removed from the XCEL project
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Rendered by `ArchiveTable` in the dashboard's Archive section. Hand-edited;
 *  there is no generator.
 *
 *  NO LONGER EMPTY as of 2026-09-10 — two rows as of 2026-09-16. It was empty on
 *  purpose before that, and the rule behind it still holds: do not seed this with rows from
 *  the other dashboards' archives to make it look populated, because a restore
 *  note pointing at another repo's files is worse than no row at all.
 *
 *  THE CONVENTION THIS FILE ENFORCES, for when there is something to put here:
 *
 *    Don't delete outright. When you remove something, UNWIRE it (pull it from
 *    routes, render paths, flags) but KEEP the file(s) in the repo, just
 *    unreferenced — then add a row here pointing at them, with a `restoreNote`
 *    that lists the actual re-wire steps. Bringing it back should be a re-wire,
 *    never a rebuild.
 *
 *  `restoreNote` is the field that earns its keep, and the one most often
 *  written too thinly. Name the files, the exact call sites, and anything that
 *  was deliberately NOT restored — a note that just says "re-add the component"
 *  is how a removal becomes permanent by accident.
 *
 *  The first row turned out not to be the one predicted here (the XCEL rows
 *  moving out of the Common LMS dashboard — still an open question, and still
 *  that project's archive rather than this one, since the code being unwired
 *  would be theirs). It was a card on the Profile page instead.
 */
export type ArchivedItem = {
  /** Stable id (kebab-case). */
  id: string
  /** Component / feature / variant name. */
  name: string
  /** One line: what it was / what it did. */
  what: string
  /** Where the code still lives (file path[s]) — kept in-repo, just unwired. */
  location: string
  /** The feature flag or route that governed it, if any. */
  flag?: string
  /** When it was archived — 'YYYY-MM-DD'. */
  dateRemoved: string
  /** Why it was pulled from the project. */
  reason: string
  /** How to bring it back — the re-wire steps / which flag or route to restore. */
  restoreNote: string
  /**
   * Optional screenshot of what it looked like, shown in the detail Sheet.
   * A path under `public/` (served at BASE_URL), e.g. 'archive/my-thing.png'.
   * Drop the PNG in `public/archive/`. Absent → the Sheet shows a placeholder.
   */
  screenshot?: string
}

export const ARCHIVED_ITEMS: ArchivedItem[] = [
  {
    id: 'exam-step-style-alternatives',
    name: 'Inline date field + Exam Date card (the two losing exam-date treatments)',
    what: 'The two treatments `exam-step-style` picked between before `ask-first` won. `inline` was what shipped — a card headed "Schedule State Exam" with a "$40 exam fee" meta line and an always-visible `<input type="date">` labelled "Already scheduled?", with Save and Clear beside it. `date-first` was the 2026-09-28 rework (`ExamDateCard`): headed "Exam Date", no fee line, and a secondary CTA that opened a month selector INSIDE the card, the card quietening to "Change date" at link weight once a date was set.',
    location:
      'BOTH INTACT AND UNREACHABLE, and they are unreachable in DIFFERENT WAYS, which matters for the restore. `date-first`: `src/components/learning/ExamDateCard.tsx` is untouched and now has NO importer — `StudyJourneyWidget.tsx` dropped its import. `inline`: `ExamDateCapture` and its "Schedule State Exam" branch are still INSIDE `LicensingStepWidget` in `src/components/learning/StudyJourneyWidget.tsx`, still compiled and still referenced — the branch is simply never taken, because both call sites now send `schedule-exam` to `ExamScheduleWidget` unconditionally. That is deliberate: it keeps the `home.exam-date-save` / `home.exam-date-clear` literals alive, and `CtaTest`’s orphan scan fails if a catalog id has no literal in source. `ExamStepCard`, the component that chose between the two arms, was REMOVED — a comment marks where it was. Comments mark the flag’s place in `src/context/FeatureFlagContext.tsx` and in `REBRAND_FLAGS` in `src/components/account/FeatureFlagPanel.tsx`.',
    flag: 'exam-step-style (RETIRED — the key no longer exists, so a stored ?ff= value resolves to nothing)',
    dateRemoved: '2026-09-29',
    reason:
      'The fork ended. `ask-first` was promoted to the Prototypes baseline on 2026-09-29 and then chosen outright, which left the flag with one option — and a picker with one option is a label. The argument that settled it is what `ask-first` assumes: `inline` and `date-first` both lead with a control for entering a date, which presumes the learner has one, and for most learners arriving the honest answer is no. Asking first captures that no. ⚠ Worth knowing what went with them, because neither was replaced feature-for-feature: `inline` was the only treatment that stated the $40 fee on the CARD (it is still in the step sheet, which was `date-first`’s argument and is now the only behaviour), and it was the only one reachable without the split-steps layout.',
    restoreNote:
      'FOUR EDITS, and (1) is the one that makes the rest do anything. (1) Re-add the `exam-step-style` entry to `FEATURE_FLAGS` in `src/context/FeatureFlagContext.tsx` — a comment marks the spot, above `exam-card-background` — with its three variants and whichever `defaultVariant` you want. (2) Re-add `\'exam-step-style\'` to `REBRAND_FLAGS` in `src/components/account/FeatureFlagPanel.tsx`, likewise marked; `FlagPanelScope.test.ts` fails if you skip it, which is the friendly failure. (3) Restore `ExamStepCard` in `src/components/learning/StudyJourneyWidget.tsx` (comment marks where it was) and re-add the `ExamDateCard` import. (4) Point BOTH call sites at it — the promoted slot AND the `licensingAfter` map. ⚠ THE TRAP IS (4), and it has bitten before: `journey-step-order: exam-first` renders this step from the promoted slot instead of the map, so branching in only one leaves the reworked card under one step order and a different one under the other — an A/B measuring two things at once. ⚠ THE SECOND TRAP IS THE NUMBERING. `ask-first` is not a journey step and takes no number, so `courseworkStep` is pinned to 1 and the licensing cards run a RUNNING COUNT that skips `schedule-exam`. A numbered arm needs that reverted or the column reads 1-2-3 with a numbered card sitting outside the sequence. NOT RESTORED DELIBERATELY: nothing in `ExamDateCard.tsx` or `ExamDateCapture` was edited, so there is no component work — this is wiring only. TESTS THAT CHANGE BACK, all four inverted rather than deleted: `ExamDateCard.test.tsx` was the `date-first` suite and is now a three-test retirement guard — restore the originals with `git show` from the removing commit rather than rewriting them, since they encode copy-bench decisions this file no longer records; `ExamDate.test.tsx`’s "the capture" block was rewritten onto the new card; `JourneyStepOrder.test.tsx` lost its 1-2-3-4 numbering assertions (they need a numbered exam card); and `TestingVersion.test.tsx` / `Testing2Version.test.tsx` expect region "Exam Date" where they expected "Schedule State Exam", plus `Step 2, 3` where they expected `Step 2, 3, 4` and an ABSENT $40 fee where they asserted it present. ⚠ NOT VERIFIED: whether the inline card still renders correctly if you re-point a call site at it — the branch has not been executed since the retirement, and it was written against a `LicensingStepWidget` that has not changed but has not been exercised with `schedule-exam` either.',
  },
  {
    id: 'sandbox-section',
    name: 'Sandbox (gateway section)',
    what: 'A gated section of the UX Dashboard rail for standalone HTML files in ACTIVE development \u2014 opened, edited and reloaded directly, outside the app build. Its empty state told you how to add one: a `PROTOTYPE_FEATURES` row with `category: sandbox`, an `externalUrl` pointing at the file, and no `devStatus`.',
    location:
      'NOTHING OF ITS CONTENT EXISTS TO KEEP \u2014 the section was empty, and no row in this repo has ever carried `category: sandbox` (checked across `PROTOTYPE_FEATURES`). What went from `src/pages/UxDashboardPage.tsx`: the `sandbox` member of the `UxSection` union, the `SectionDef`, the `sandbox: []` bucket, the section-specific empty state and its `codeStyle` const. The `sandbox` member of `FeatureCategory` in `src/data/prototypeFeatures.ts` was KEPT \u2014 that type block is verbatim from the LMS, so a row ported carrying it must still compile \u2014 and `sectionOf` now redirects it to Design in an explicit branch.',
    flag: "category: 'sandbox' (still a valid value; now routes to Design)",
    dateRemoved: '2026-09-29',
    reason:
      'Jillienne\u2019s call. Sandbox answered "I am editing a raw HTML file live, outside the build" \u2014 a single-designer workflow. The team now works on branches that Netlify builds, and shares them through Refinement, so the artifact under active work has a URL of its own and does not need a rail row pointing at a local file. It read 0 and had read 0 since it was built.',
    restoreNote:
      'Four edits in `src/pages/UxDashboardPage.tsx`: (1) add the `sandbox` member back to the `UxSection` union; (2) re-add the `SectionDef` at the marked spot, between Exploration and Development, with `gate: { id: DEV_GATE_ID, title: Sandbox }` copied from a sibling \u2014 it shared the group password; (3) add `sandbox: []` back to the `bySection` map, REQUIRED because that map is typed `Record<UxSection, PrototypeFeature[]>` and the build fails without it; (4) in `sectionOf`, change the explicit `if (f.category === sandbox) return design` back to `return sandbox`. \u26a0 THE TRAP IS (4), and it is why that branch was left in rather than deleted: with the branch gone the category falls through to the `return design` at the end of the function and lands in the same place, so a half-restore \u2014 section back, routing not \u2014 gives you an empty Sandbox section and rows quietly in Design, which type-checks and passes every test. The empty state that named the fields was removed with the section; it is not needed for a restore, but `codeStyle` in the same file has to come back if you want it. NOT restored, because it was never removed: `category: sandbox` in `FeatureCategory`, and the doc comment there which now records the redirect. Tests: `EXPECTED_SECTIONS` in `src/test/UxDashboard.smoke.test.tsx` and `GATED_SECTIONS` in `src/test/PublicGateway.test.tsx` both need Sandbox put back.',
  },
  {
    id: 'todo-section',
    name: 'To Do (gateway section)',
    what: 'A section of the UX Dashboard rail for upcoming projects and loose ends \u2014 paste an item in, tag it with a stage, drag to rank. Its nav count was the number of OPEN items, read live from the store rather than from the static `count` field, so it fell as items were ticked off.',
    location:
      'THE PANEL AND ITS STORE ARE FULLY INTACT and unreferenced: `src/components/prototype/TodoPanel.tsx` and `src/components/prototype/todoStore.ts`, neither edited. What went is six things in `src/pages/UxDashboardPage.tsx` \u2014 the `todo` member of the `UxSection` union, the `SectionDef` entry, the `todo: []` bucket in the `bySection` map, the `useTodoOpenCount()` call, its arm of the nav-count ternary, and the `section === todo` render branch \u2014 plus the two imports those fed. A comment marks where the two `SectionDef`s stood.',
    flag: '?section=todo (NO LONGER RESOLVES \u2014 see the restore note)',
    dateRemoved: '2026-09-29',
    reason:
      'Jillienne\u2019s call, trimming the rail. It read 0 \u2014 and the count is LIVE, so a standing 0 meant the list was genuinely empty, not that a static number had gone stale. A section whose whole purpose is holding items, holding none, is a row of chrome above the ones people use.',
    restoreNote:
      'Five edits, all in `src/pages/UxDashboardPage.tsx`: (1) add the `todo` member back to the `UxSection` union; (2) re-add the `SectionDef` at the marked spot, last in the restricted group, with `gate: { id: DEV_GATE_ID, title: To Do }` copied from any sibling \u2014 it shared the group password, so this is not a new gate; (3) add `todo: []` back to the `bySection` map, which is REQUIRED because the map is typed `Record<UxSection, PrototypeFeature[]>` and the build fails without it; (4) re-add `const todoOpen = useTodoOpenCount()` and its arm of the nav-count ternary; (5) re-add the render branch for `<TodoPanel />`. Then restore the two imports. \u26a0 THE TRAP IS (4): everything still compiles and the row still draws without it, showing a permanent 0 \u2014 which is exactly what the section looked like on the day it was archived, so a restore that skips it would look successful and be wrong. NOT restored, and not needed: `TodoPanel.tsx` and `todoStore.ts` were not touched at all. Items live in `localStorage` under `cgp.todo`, per browser, so anything typed before the archive is still in the browser that typed it and comes back with the section. No test asserted the panel itself; what changed is `EXPECTED_SECTIONS` in `src/test/UxDashboard.smoke.test.tsx` and `GATED_SECTIONS` in `src/test/PublicGateway.test.tsx`, which both need To Do put back.',
  },
  {
    id: 'contributing-section',
    name: 'Contributing (gateway section)',
    what: 'The designer guide as a rail section \u2014 how a second designer gets work onto this dashboard: clone, branch, flag, push, Refinement, promote. It was `public/contributing/index.html` shown in an iframe, so the section, the standalone page and the PDF were one document and could not drift.',
    location:
      'THE GUIDE ITSELF IS UNTOUCHED. `public/contributing/index.html` and `contributing.pdf` are unedited and STILL SERVED at `/contributing/` on the full site \u2014 that URL works today, and it is where CLAUDE.md sends designers. `scripts/public-redirects.mjs` still lists `/contributing/*` in `BLOCKED`, deliberately, so the public build still 404s it at the edge. The iframe component moved OUT of `UxDashboardPage.tsx` into `src/components/prototype/GuideFrame.tsx`, exported and unreferenced. What went from the page: the `contributing` union member, the `SectionDef`, the `contributing: []` bucket and the render branch.',
    flag: '?section=contributing (NO LONGER RESOLVES; /contributing/ still does)',
    dateRemoved: '2026-09-29',
    reason:
      'Jillienne\u2019s call, trimming the rail. The guide is a document people read once when they arrive, not a place they navigate to, and it already has a URL and a PDF. Removing the row does not remove the guide \u2014 which is the whole reason this was safe to do.',
    restoreNote:
      'Four edits in `src/pages/UxDashboardPage.tsx`: (1) the `contributing` member back on the `UxSection` union; (2) the `SectionDef` at the marked spot, last, with `gate: { id: DEV_GATE_ID, title: Contributing }` copied from a sibling; (3) `contributing: []` back in the `bySection` map \u2014 required, the map is a `Record<UxSection, PrototypeFeature[]>`; (4) the render branch rendering GuideFrame with src /contributing/ and title "Contributing to the dashboard", IMPORTED from `@/components/prototype/GuideFrame` rather than re-declared in the page. \u26a0 THE TRAP: `GuideFrame` was moved out of the page precisely because an unused module-level function there trips `noUnusedLocals` and fails the build \u2014 so do NOT paste it back inline and leave the file behind; you end up with two copies and the one you edit may not be the one that renders. DELIBERATELY NOT RESTORED, because nothing was done to them: the guide, its PDF, and the `/contributing/*` block on the public build. That block must STAY whatever happens to the section \u2014 it is what keeps a static file unreadable on the stakeholder site, which no client-side gate can do. The test to change back is in `src/test/UxDashboard.smoke.test.tsx`: it was INVERTED, and now asserts the section does NOT resolve while still asserting the guide and its PDF exist. Keep the second half, flip the first. `GATED_SECTIONS` in `src/test/PublicGateway.test.tsx` and `EXPECTED_SECTIONS` in the smoke suite both need Contributing back.',
  },
  {
    id: 'discoverability-testing-2',
    name: 'Testing 2 (dashboard version)',
    what: 'QE Focused with a LIVE Study Pace tile in the square slot \u2014 one derived pace ("2 hours a night \u00b7 6 nights a week \u00b7 Finishes by May 24") and an ADJUST button opening a sheet with the three finish dates (Relaxed / Recommended / Focused), days a week, an optional exam date, and a switch turning the pace into sessions on the Study Plan. It asked what the tile should let you CHANGE; Testing asks what it should SHOW.',
    location:
      'FULLY INTACT, exactly as QE Focused and Marketing Focused above \u2014 `DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2` in `src/data/dashboardVersions.ts`, its `discoverability-testing-2` type member, the `testingVersion` / `livePace` branches in `MembershipOverview`, the live `StudyPaceTile` and its Adjust sheet. Only the entry in `DISCOVERABILITY_DASHBOARD_VERSIONS` was removed, so `?version=discoverability-testing-2` STILL RESOLVES \u2014 `Testing2Version.test.tsx` renders it on every test.',
    flag: '?version=discoverability-testing-2 (still resolves)',
    dateRemoved: '2026-09-28',
    reason:
      'Jillienne\u2019s call. The pacing question it was built to ask has been answered by Testing, which took the presets card, the activity history and the derived-pace readout; Testing 2\u2019s contribution was the ADJUST sheet, and nobody has asked to adjust a pace on the demo since. Two near-identical versions in a three-entry picker is one too many when only one of them is being shown.',
    restoreNote:
      'Re-add `DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2` to `DISCOVERABILITY_DASHBOARD_VERSIONS` in `src/data/dashboardVersions.ts`. That is the whole restore \u2014 one line \u2014 and the picker order is the array order, so put it back between Testing and Learner Focused where it read. A comment marks the spot. \u26a0 WHAT IS ACTUALLY AT STAKE, and the reason to think before deleting more than the picker line: this version is the ONLY route to the Study Pace ADJUST SHEET. `livePace` is `testingVersion && studyPaceFlag` in `MembershipOverview`, and `testingVersion` is `dashboardLayout === \u2018testing-2\u2019` \u2014 no other version sets it. Unwire anything further and the sheet, the three finish-date presets and the two-ceiling logic behind them become unreachable dead code rather than one line from returning. NOT restored deliberately: nothing else was touched, so no test, fixture or component work is needed \u2014 `Testing2Version.test.tsx` still passes untouched because it addresses the version by `?version=` rather than through the picker.',
  },
  {
    id: 'rail-rows-2026-09-28',
    name: 'Seven left-nav rows (Learning Path, Browse Catalog, Recommended for You, Resource Library, Exam & Cert Prep, Rubi Insights, Podcasts)',
    what: 'Seven rail items and their per-item visibility flags. Six of the seven were already toggled OFF on the XCEL baseline and had been for weeks — only Rubi Insights was live, sitting at the foot of My Learning as the AI tutor a candidate uses session after session. Together they were most of the Navigation group in the flag panel: fifteen toggles for a rail that drew five rows.',
    location:
      'THE SECTIONS ARE FULLY INTACT. Every page still resolves from `?section=` \u2014 `catalog`, `recommended`, `m-learning-library`, `m-exam-prep`, `m-career-tools`, `podcasts`, `learning-path` \u2014 and `PlatformShell` still maps, titles and renders all seven. What went is the RAIL ROWS in `src/components/layout/PlatformSideNav.tsx` (`MEMBERSHIP_ITEMS`, `myLearningItems`, both arms of `exploreItems`) and the seven `NAV_SECTION_FLAGS` entries in `src/context/FeatureFlagContext.tsx`. A comment marks each removal site.',
    flag: 'nav-show-learning-path, nav-show-catalog, nav-show-recommended, nav-show-m-learning-library, nav-show-m-exam-prep, nav-show-m-career-tools, nav-show-podcasts (all removed)',
    dateRemoved: '2026-09-28',
    reason:
      'Jillienne\u2019s call, reviewing the flag panel: the Navigation group had fifteen toggles for a rail that shows five rows, and these seven were the ones nobody was turning on. It REVERSES a decision recorded at Browse Catalog on 2026-09-16 \u2014 that they were hidden via flag \u201crather than by deleting the row\u201d so a reviewer could restore one without a code change. That reasoning was sound while the question was still open; it is not, and a toggle nobody uses is panel weight rather than optionality.',
    restoreNote:
      'TWO EDITS PER ROW, AND THE ORDER MATTERS. (1) Re-add the row to its list in `PlatformSideNav.tsx` \u2014 `MEMBERSHIP_ITEMS` for Resource Library / Exam & Cert Prep / Rubi Insights, `myLearningItems` for Learning Path, `exploreItems` (BOTH arms \u2014 the MVP trim and the main list) for Browse Catalog, and the main arm for Recommended for You and Podcasts. Each site carries a comment saying what left it. (2) Re-add its `{ section, label, defaultEnabled: false }` entry to `NAV_SECTION_FLAGS` in `FeatureFlagContext.tsx`. \u26a0 EDIT (2) IS NOT OPTIONAL AND IS THE TRAP THIS NOTE EXISTS FOR: `useNavSectionVisible` returns TRUE when a section has no flag, so a row restored WITHOUT its flag comes back permanently visible and cannot be switched off \u2014 the opposite of the state it was archived from. Restoring flag-first is safe; row-first is not. ALSO NEEDED: Rubi Insights is a spread rather than a plain row \u2014 it was filtered out of `MEMBERSHIP_ITEMS` in `exploreItems` and spread INTO `myLearningItems` with `careerToolsLabelFor(brand)` and `shortLabel: \u2018Rubi\u2019`; both halves come back together or it renders twice. Learning Path needs `pluralLP` back (`multiplePaths` + the `learning-path-version` read) for its singular/plural label, and Recommended for You needs `hasRecommendations` (`buildRecommendedShelves`) plus that import. NOT restored deliberately: nothing in `PlatformShell` was touched, so no route, title or render work is needed \u2014 and `nav-gray-scale` was left alone, which is a rail COLOUR flag that was selected alongside these but is not a nav row. TESTS: `NavSectionFlags.test.tsx` asserts the whole rail in order and will need the row added back to its expectation.',
  },
  {
    id: 'progress-off-track',
    name: 'Off Track (demo progress state)',
    what: 'A Progress persona for a learner who bought late and left it — 19% done against an 11-day access window, which puts the work past any pace the model will recommend. The Study Pace card drops its nightly figure and names the two ways out (extend access, or cut what is left). Reached from the PERSONA dropdown as "Pace — won\u2019t finish"; it was never a row in the Progress dropdown itself.',
    location:
      'FULLY INTACT. `progress-off-track` is still a member of `DashboardProgressVariant` and still has its entry in every map in `src/data/dashboardProgressFixtures.ts` \u2014 `DAYS_LEFT_BY_VARIANT` (10), `STATUS_BY_VARIANT`, the ratio map, and its own branch in the jump-back-in chain with the short `expiresAt: 2026-05-22` that makes the state reachable. So a stored flag value or a `?ff=dashboard-progress-state:progress-off-track` override STILL RESOLVES. Two things were unwired: the `pace-wont-fit` persona in `src/components/prototype/demoControlsUtil.ts`, and the variant\u2019s entry in the `dashboard-progress-state` catalog in `src/context/FeatureFlagContext.tsx`. Both sites carry a comment where the entry was.',
    flag: 'dashboard-progress-state: progress-off-track (still resolves)',
    dateRemoved: '2026-09-23',
    reason:
      'Redundant as of the same day. Off Track existed to reach the pace model\u2019s `state: \'no\'` \u2014 its own flag description said so \u2014 and it did that with a deliberately short window rather than with a long course. When the demo\u2019s day counts were re-authored to 29 / 17 / 3, At Risk at 3 days against ~36 remaining lessons reaches the same branch on its own. Two personas demonstrating one branch is one too many, and Off Track was the one nobody had asked for.',
    restoreNote:
      'TWO EDITS, and the order does not matter. (1) Re-add the `progress-off-track` variant to `dashboard-progress-state` in `src/context/FeatureFlagContext.tsx`, between `progress-at-risk` and `progress-expired` \u2014 a comment marks the spot. (2) Re-add the `pace-wont-fit` persona to `DEMO_PERSONAS` in `src/components/prototype/demoControlsUtil.ts`, likewise. \u26a0 EDIT (1) IS NOT OPTIONAL and is the trap this note exists for: the variant lived in every fixture map while being ABSENT from the flag catalog once before, so the persona\u2019s seed was silently ignored, the dashboard fell back to On Track, and the whole unreachable-pace branch was dead copy that still type-checked and still passed every test. `StudyPaceTile.test.tsx` had a test pinning the catalog for exactly that reason; it was inverted to pin At Risk instead, so restoring this should restore that assertion too. NOT restored deliberately: nothing in `dashboardProgressFixtures.ts` was touched, so no fixture work is needed \u2014 and consider whether At Risk should go back to a longer runway at the same time, since the two now overlap by design rather than by accident.',
  },
  {
    id: 'discoverability-qe-focused',
    name: 'QE Focused (dashboard version)',
    what: 'The pre-licensing dashboard built for a candidate working towards a booked exam — the slim top band (path identity + status + Resume) beside the Study Journey, the Learning Path detail sheet\u2019s whole Progress tab rendered inline, and Recommended for You dropped. XCEL\u2019s default from 2026-09-16 until Testing took it on 2026-09-21.',
    location:
      'FULLY INTACT. `DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED` in `src/data/dashboardVersions.ts`, its `discoverability-qe-focused` type member, every `?version=` resolution branch, and every component it renders. Only the entry in `DISCOVERABILITY_DASHBOARD_VERSIONS` was removed, so `?version=discoverability-qe-focused` STILL RESOLVES — `QeFocusedVersion.test.tsx` (163 tests) renders it on every one.',
    flag: '?version=discoverability-qe-focused (still resolves)',
    dateRemoved: '2026-09-22',
    reason:
      'The direct ask: "we can go ahead and remove these versions, we are going in the direction of Testing Version." Testing and Testing 2 are both built on this arrangement and had made it the thing behind the thing — a picker row nobody would choose, sitting in front of the two versions the work is actually happening on.',
    restoreNote:
      'Re-add `DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED` to `DISCOVERABILITY_DASHBOARD_VERSIONS` in `src/data/dashboardVersions.ts`. That is the whole restore — one line — and the picker order is the array order, so put it where it should read. NOTHING ELSE WAS UNWIRED, which is the point: two tests pin that (`is gone from the picker` and `still RESOLVES, which is what keeps this file meaningful`) and both would need updating. \u26a0 DO NOT "finish the job" by deleting the QE LAYOUT. `MembershipOverview` computes `qeFocused = dashboardLayout === \'qe-focused\' || testing || testingVersion` — Testing and Testing 2 ARE this arrangement plus their departures from it, so removing the layout removes them. What was archived is one row in a picker, not a design.',
  },
  {
    id: 'discoverability-marketing-focused',
    name: 'Marketing Focused (dashboard version)',
    what: 'The house Discoverability dashboard — the joined top card with the Jump Back In half replaced by a full-bleed "What\u2019s New" carousel (rotating brand-gradient slides with dot navigation), the left half keeping a compact Current Learning Path, a Deadline / Time Remaining stat row and a Jump Back In card.',
    location:
      'FULLY INTACT, exactly as QE Focused above — const, type member, `?version=` branches and components all kept; only the picker entry went. `?version=discoverability-marketing-focused` still resolves.',
    flag: '?version=discoverability-marketing-focused (still resolves)',
    dateRemoved: '2026-09-22',
    reason:
      'Same ask, same pass. XCEL sells a licence rather than a membership, so there was never an upsell for the marketing carousel to carry — the reasoning that moved XCEL off it on 2026-09-04 and never moved back.',
    restoreNote:
      'One line: re-add `DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED` to `DISCOVERABILITY_DASHBOARD_VERSIONS`. \u26a0 THE CONST IS LOAD-BEARING EVEN WHILE ARCHIVED, and this is the half worth reading twice: `defaultDiscoverabilityVersionFor` returns it for any brand that is NOT XCEL. `Brand` is a one-member union so that branch is unreachable today, which makes it exactly the kind of thing a later cleanup deletes as dead — and the failure would surface on the day someone adds a second brand, not on the day of the delete. It is the same seam the `[data-brand]` selector in `tokens.css` is kept for. A test pins it.',
  },
  {
    id: 'clp-stats-stat-card',
    name: 'Current Progress — the `stat-card` treatment',
    what: 'The three KPI cells and the status strip gathered onto ONE white card: a sub-label under each cell ("Your exam target date", "~1.5 hrs/day suggested pace", "lessons of this course"), Completed printed as a two-tone fraction with the denominator dimmed, a hairline rule between the numbers and the status, and the strip rendered `bare` inside the card rather than tinted.',
    location:
      'GIT HISTORY ONLY — branches inside `src/components/membership/v5/LearnerFocusedBand.tsx` keyed off one `statCard` boolean, not a separate component. `git log -S "kpiSubLabels"` finds the whole treatment.',
    flag: 'dashboard-clp-stats (retired)',
    dateRemoved: '2026-09-22',
    reason:
      'Default — three bare cells divided by vertical rules — won. It was already the committed default, so the flag offered one live answer and one the project had not chosen.',
    restoreNote:
      'Re-add `dashboard-clp-stats` to `FEATURE_FLAGS` (variants `default` / `stat-card`, `defaultVariant: \'default\'`) and to the `FeatureFlagPanel.tsx` scope. In `LearnerFocusedBand.tsx` restore `const clpStatsVariant = useFeatureFlag(\'dashboard-clp-stats\').variant ?? \'default\'` and `const statCard = onPage && clpStatsVariant === \'stat-card\'` — the hook call must stay UNCONDITIONAL — then re-gate SIX sites that were flattened: `paceTiles` (had `&& !statCard`), the wrapper `<div>` above the KPI grid (was the white card`s background/border/padding), the grid`s `gap` and `marginTop`, the Completed cell`s two-tone fraction, the hairline rule under the numbers, and `StatusStrip``s `marginTop` + `bare`. ALSO restore `kpiSubLabels` and the two locals it alone used — `hoursPerDay` and `daysLeft` — plus the `sub=` prop on all three `KpiDark` cells. NOT restored by any of that: `hoursPerDay` also fed the retired `rate` pacing treatment (see `pacing-treatment-exploration`), so the derivation comes back here but its other consumer does not.',
  },
  {
    id: 'pacing-treatment-exploration',
    name: 'Study Pace treatments — Rate, Runway, Balance',
    what: 'Three of the five answers the Testing version offered to "am I pacing to finish in time", each a WHOLE answer rather than a restyle of one. Rate stated a suggested ~hrs/day and the date it finished by. Runway stated ~units a week over a segmented strip — one segment per remaining WEEK, the last part-filled — with "N lessons left · N wks to go" beneath. Balance stated the two remaining figures (units left, days left) in bare cells split by a vertical rule and derived nothing from them.',
    location:
      'GIT HISTORY ONLY — these were arms of one conditional inside `src/components/membership/v5/LearnerFocusedBand.tsx`, not separate files, so there was no file to leave unreferenced (tsc fails on unused locals). They are whole in the commit that removed them; `git log -S "runwayStrip" -- src/components/membership/v5/LearnerFocusedBand.tsx` finds it. `lo-fi` is NOT archived — it is still the live rendering for every non-Testing version.',
    flag: 'dashboard-pacing-style (retired)',
    dateRemoved: '2026-09-22',
    reason:
      'Presets won. The exploration existed to compare five treatments on the Testing version, and with a winner chosen the flag was a picker between one live answer and three dead ones — plus a way for a stakeholder to land on a treatment nobody had chosen. The flag had been promoted to the committed baseline the day before (`presets`), which is what made keeping the alternatives cost rather than earn.',
    restoreNote:
      'Four coordinated steps. (1) Re-add the `dashboard-pacing-style` definition to `FEATURE_FLAGS` in `src/context/FeatureFlagContext.tsx` — group `Widgets`, page `dashboard-rebrand`, `defaultEnabled: true`, five variants (lo-fi / rate / runway / balance / presets); it sat between `dashboard-journey-complete` and `dashboard-progress-state`. (2) Re-add the key to the scope array in `src/components/account/FeatureFlagPanel.tsx` or the panel will not show it on /dashboard-rebrand. (3) In `LearnerFocusedBand.tsx` replace `const pacingStyle = paceOnly ? \'presets\' : \'lo-fi\'` with the flag read — `useFeatureFlag(\'dashboard-pacing-style\').variant ?? \'runway\'`, then `paceOnly ? pacingVariant : \'lo-fi\'` (the hook call must stay UNCONDITIONAL; three comments in that file record the rules-of-hooks trap). (4) Restore the `pacingBody` arms and the locals they alone used, ALL removed with them: `unitsLeft`, `unitsPerWeek`, `weeksLeftWhole`, `runwayStrip`, `pacingFigureStyle`, `pacingUnitStyle`, `pacingNoteStyle`, and the `timeRemainingText` import from `learningPathsHomeUtil`. NOT restored deliberately: the status-constancy guarantee. The four retired treatments all showed `pacingStatus`; presets replaces it with a sentence, so `TestingVersion.test.tsx` pinned the four together and presets separately — restoring the arms means restoring that pairing, not just the render.',
  },
  {
    id: 'learner-band-completed-celebration',
    name: 'Completed celebration band (100%)',
    what: 'The green "You’re all caught up!" card the Learner Focused band returned INSTEAD of itself at 100% — a success half with the completed stats and a View Certificate action, joined to a white panel offering Browse Catalog.',
    location:
      'src/components/membership/v5/LearnerFocusedBand.tsx — the `if (renewalReady) { … }` early return, replaced by a block comment at the same spot. `CompletedCelebration` and its `CompletedStat` type are UNTOUCHED in `CompletedCelebration.tsx` and still used by `ClpJumpBackInBand` and `MarketingFocusedBand`.',
    dateRemoved: '2026-09-21',
    reason:
      'The direct ask for a completed state on the NORMAL band ("the course image should not disappear"). The early return was why nothing else survived 100%: the course header and its art, the Study Journey, the Jump Back In card and the pace tile were all below it and never rendered. What replaced it is the band in a completed state — the pace tile hidden, Jump Back In reading "Review Course Material", and the journey marking all four coursework stops complete. The celebration is not wrong, it is a different answer to the same state, and keeping both would have said "complete" twice on one screen.',
    restoreNote:
      'Re-add one `if (renewalReady) { … }` block at the top of `LearnerFocusedBand`’s render, above the `return (` — it built a `CompletedStat[]` from `mandatory`/`elective` when `hasBreakdown`, then `deadline` and `timeRemainingText(weeksLeft)`, and returned a `<section aria-label="Learning path complete" className="cre-learner-focused-band">` with a two-column grid wrapping `<CompletedCelebration …>`. Re-import `CompletedCelebration` and `type CompletedStat` from `./CompletedCelebration`, and `DiscoveryEmpty` from `./JumpBackInDiscoveryEmpty` (both imports went with it). `renewalReady`, `onBrowseCatalog` and `onViewCertificate` are ALL STILL PROPS — `renewalReady` now drives the completed treatments inside the band, and the other two are accepted-and-ignored precisely so a restore needs no caller changes; re-add them to the destructure. NOT restored deliberately: the second `gridTemplateColumns: stack ? …` declaration that lived in that branch. A test (`has only ONE grid to edit now`) pins its absence, because the celebration grid once received an edit meant for the live one and the symptom was the left column silently getting narrower — re-adding the branch means updating that test and inheriting the warning in it.',
  },
  {
    id: 'header-cart',
    name: 'Header cart button',
    what: 'The shopping-cart icon pill in the top-right header cluster, left of the notification bell and the account menu.',
    location: 'src/components/layout/Header.tsx — `CartButton`, exported and unreferenced.',
    dateRemoved: '2026-09-21',
    reason:
      'The direct ask ("no cart"). It was a `<Link to="#">` — a control that has never gone anywhere — in a product where the learner is already enrolled and buys course packages on xcelsolutions.com rather than inside the LMS, so it promised a storefront this app does not have. Removed in the same pass as the membership upsell band and the Career Tools "Member Exclusive" badge, but for a DIFFERENT reason: those two are a correctness fix behind `supportsMembership` and return on their own for a brand that sells a membership, whereas this is editorial and therefore archived.',
    restoreNote:
      'Re-add `<CartButton />` as the first child of the `utilities` cluster in `Header.tsx` (directly above `{showBell && <NotificationsMenu />}`), and delete the block comment that replaced it. The component itself is unchanged and still exported from that file — drop the `export` again if it regains its only in-file caller, since it was exported solely to keep an unreferenced local function from failing lint. NOT restored with it, and a separate decision: the `to="#"` href. It never resolved, so a restore that matters wants a real destination (a cart route, or an outbound link to the xcelsolutions.com basket) rather than the dead link this was. Nothing else moved — the bell and the account menu keep their positions, and the cluster comment explaining why the bell sits between Cart and the avatar was deliberately left in place.',
  },
  {
    id: 'dashboard-mvp-version',
    name: 'Dashboard MVP (classic /dashboard version)',
    what:
      'The sixth entry in the classic dashboard version picker — a pared-back V3 with the right rail hidden, the hero "Saved this year" chip dropped, the content column centred, and Featured Products moved below Learning Path + Courses.',
    location:
      'src/components/dashboard/versions/DashboardMVP.tsx (kept, unreferenced). Its MVP_FLAGS snapshot is still in that file.',
    flag: "Was driven by MVP_FLAGS — a snapshot of eight now-removed catalog flags; the route itself is `/dashboard?version=mvp`, behind `dashboard-tab`.",
    dateRemoved: '2026-09-16',
    reason:
      'It was defined ENTIRELY by a feature-flag snapshot, and the XCEL flag audit removed all eight of those flags from the catalog (they only ever drove the classic /dashboard, which this project\'s demo never opens). Without them MVP renders as V3 with hideRightRail / membershipPlacement="trail" / consolidatedProgress — a second near-identical row in the picker. The three props survive on DashboardV3, so what made MVP a distinct LAYOUT is still there; what is gone is the flag configuration that made it a distinct CONFIGURATION.',
    restoreNote:
      'Re-add the eight flags to FEATURE_FLAGS in src/context/FeatureFlagContext.tsx (dashboard-kpi-card, jump-back-in-card, jump-back-in-card-links, dashboard-top5-pagination, membership-card-layout/-height/-width, streak-hero-card) and revert the pinned constants that replaced them in DashboardV3.tsx and LearnerOverviewPanel.tsx — each pin carries a comment naming its flag. Then re-add the `mvp` row to DASHBOARD_VERSIONS (src/data/dashboardVersions.ts) and the `case \'mvp\'` branch + DashboardMVP import to src/pages/DashboardPage.tsx. NOT restored deliberately: nothing in DashboardMVP.tsx itself was edited, so no component work is needed — and note the five right-rail flags in MVP_FLAGS (premium-membership-card, whats-new-card, quick-links-card, rubi-tutor-widget, dashboard-rail-tray) were always moot here, since `hideRightRail` already drops that column.',
  },
  {
    id: 'profile-motivational-statement',
    name: 'Motivational Statement card (Profile)',
    what: 'A card on the Profile page holding the learner’s own motivational statement, with an edit pencil opening the real `MotivationalStatementPanel` (the only card there wired to anything but a stub).',
    location:
      'src/components/account/profile/ProfileCards.tsx (`MotivationalStatementCard`, still exported, no longer imported) · src/components/membership/MotivationalStatementPanel.tsx · src/context/MotivationContext.tsx',
    dateRemoved: '2026-09-10',
    reason:
      'Editorial — removed from the Profile page at Jillienne’s request. NOT a capability or data problem: the statement is real, the panel works, and the context is untouched.',
    restoreNote:
      'Re-add `MotivationalStatementCard` to the import from `@/components/account/profile/ProfileCards` in src/pages/ProfilePage.tsx and render it as the FIRST child of the right-hand column, above `MembershipPlanCard`. Nothing else moved: the component, `MotivationalStatementPanel` and `MotivationContext` are all intact and unchanged, and the STATEMENT itself is still read and written by `ProfilePersonalizePanel` (through `MotivationContext`) and displayed by `ProfilePersonalizeBand`. CORRECTED 2026-09-16: this note used to say the panel was “STILL REACHABLE from the left rail (`NavProfileHeader` → MotivationalStatementPanel)”. That stopped being true when the rail profile header was unwired the same day — see `nav-profile-header` below. `MotivationalStatementPanel` (the slide-over) now has NO live caller, so restoring this card also restores the only door onto it. Deliberately NOT restored alongside it: the Membership Plan card, which left the same page on the same day for an unrelated reason (it is gated on `supportsMembership`, not archived, and returns by itself for a brand that sells one).',
  },
  {
    id: 'nav-profile-header',
    name: 'Profile header (left rail)',
    what: 'The pinned top region of the dashboard rail: the learner’s 48px avatar with its thin Brick `brandRing`, “Welcome back, <name>” as a button to the Profile page, their motivational statement, and the divider under the group. On a brand that sells membership it also carried the “Your Membership” summary — moot for XCEL, where `supportsMembership` is false.',
    location:
      'src/components/layout/PlatformSideNav.tsx (`NavProfileHeader`, exported, no longer rendered) · `NavMotivationQuote` and `NavMembershipSummary` are reached only through it · src/components/membership/MotivationalStatementPanel.tsx',
    dateRemoved: '2026-09-16',
    reason:
      'Editorial — removed at Jillienne’s request. The header’s account trigger gained the learner’s photo AND name on the same day, so this was the second portrait-and-name of the same person in one viewport, a few hundred pixels apart. The rail now opens on MY LEARNING, which is its job.',
    restoreNote:
      'Re-add `<div style={{ flexShrink: 0 }}><NavProfileHeader isMember={isMember} onSelect={onSelect} /></div>` as the first child of the `<nav>` in `PlatformSideNav`, and restore `const isMember = membership === \'member\'` with `membership` back in that component’s `useAccount()` destructure — `NavProfileHeader` is its only consumer, so it was dropped with it. Nothing INSIDE the header changed: the component, `NavMotivationQuote`, `NavMotivationStatementButton`, `NavMembershipSummary` and `MotivationalStatementPanel` are all intact. Two things to decide rather than restore blindly: (1) the header’s account trigger now shows the same photo and name, so bringing this back re-creates the duplication that removed it — consider dropping the name from `.cre-account-pill` instead; (2) `brandRing` on `Avatar` has NO other call site, and it exists to mark this avatar as the learner’s own, so restoring the header restores the only thing that uses it. Deliberately NOT restored with it: nothing — this row is self-contained.',
  },
]
